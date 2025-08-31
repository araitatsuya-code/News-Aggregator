"""
RSS収集システムのテスト
"""

import asyncio
import pytest
from datetime import datetime, timezone
from unittest.mock import Mock, AsyncMock, patch
from typing import List

from shared.collectors.rss_collector import RSSCollector
from shared.types import RSSSource, RawNewsItem
from shared.exceptions import RSSCollectionError


class TestRSSCollector:
    """RSSCollectorのテストクラス"""
    
    @pytest.fixture
    def sample_sources(self) -> List[RSSSource]:
        """テスト用のRSSソース"""
        return [
            RSSSource(
                url="https://example.com/feed1.xml",
                category="テスト",
                language="ja",
                name="テストフィード1"
            ),
            RSSSource(
                url="https://example.com/feed2.xml",
                category="テスト",
                language="en",
                name="テストフィード2"
            )
        ]
    
    @pytest.fixture
    def sample_rss_content(self) -> str:
        """テスト用のRSSコンテンツ"""
        return """<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
            <channel>
                <title>テストフィード</title>
                <description>テスト用のRSSフィード</description>
                <item>
                    <title>AIの最新動向について</title>
                    <link>https://example.com/article1</link>
                    <description>AIの最新動向に関する記事です。</description>
                    <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
                </item>
                <item>
                    <title>機械学習の応用事例</title>
                    <link>https://example.com/article2</link>
                    <description>機械学習の応用事例について解説します。</description>
                    <pubDate>Mon, 01 Jan 2024 13:00:00 GMT</pubDate>
                </item>
            </channel>
        </rss>"""
    
    @pytest.mark.asyncio
    async def test_collect_all_success(self, sample_sources, sample_rss_content):
        """正常な記事収集のテスト"""
        collector = RSSCollector(sample_sources)
        
        # HTTPレスポンスをモック
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.text = AsyncMock(return_value=sample_rss_content)
        
        with patch('aiohttp.ClientSession.get') as mock_get:
            mock_get.return_value.__aenter__.return_value = mock_response
            
            async with collector:
                articles = await collector.collect_all()
        
        # 結果の検証（重複除去により2記事になる）
        assert len(articles) == 2  # 重複除去後の記事数
        assert all(isinstance(article, RawNewsItem) for article in articles)
        assert articles[0].title == "AIの最新動向について"
        assert articles[0].url == "https://example.com/article1"
    
    @pytest.mark.asyncio
    async def test_collect_with_http_error(self, sample_sources):
        """HTTP エラー時のテスト"""
        collector = RSSCollector(sample_sources, max_retries=1)
        
        # HTTP 404エラーをモック
        mock_response = AsyncMock()
        mock_response.status = 404
        mock_response.reason = "Not Found"
        
        with patch('aiohttp.ClientSession.get') as mock_get:
            mock_get.return_value.__aenter__.return_value = mock_response
            
            async with collector:
                articles = await collector.collect_all()
        
        # エラーが発生してもプログラムは継続し、空のリストが返される
        assert articles == []
    
    @pytest.mark.asyncio
    async def test_collect_with_retry(self, sample_sources, sample_rss_content):
        """リトライ機能のテスト"""
        collector = RSSCollector(sample_sources, max_retries=2)
        
        # 最初は失敗、2回目は成功するようにモック
        mock_response_error = AsyncMock()
        mock_response_error.status = 500
        mock_response_error.reason = "Internal Server Error"
        
        mock_response_success = AsyncMock()
        mock_response_success.status = 200
        mock_response_success.text = AsyncMock(return_value=sample_rss_content)
        
        with patch('aiohttp.ClientSession.get') as mock_get:
            mock_get.return_value.__aenter__.side_effect = [
                mock_response_error,  # 1回目は失敗
                mock_response_success,  # 2回目は成功
                mock_response_success,  # 2つ目のソース用
            ]
            
            async with collector:
                articles = await collector.collect_all()
        
        # リトライが成功して記事が取得される
        assert len(articles) > 0
    
    def test_normalize_article(self, sample_sources):
        """記事正規化のテスト"""
        collector = RSSCollector(sample_sources)
        source = sample_sources[0]
        
        # モックエントリ
        mock_entry = Mock()
        mock_entry.title = "テスト記事"
        mock_entry.link = "https://example.com/test"
        mock_entry.published_parsed = (2024, 1, 1, 12, 0, 0, 0, 1, 0)
        mock_entry.summary = "テスト記事の要約"
        
        article = collector.normalize_article(mock_entry, source)
        
        assert article is not None
        assert article.title == "テスト記事"
        assert article.url == "https://example.com/test"
        assert article.source == source
        assert article.content == "テスト記事の要約"
        assert isinstance(article.published_at, datetime)
    
    def test_normalize_article_with_invalid_data(self, sample_sources):
        """無効なデータでの記事正規化テスト"""
        collector = RSSCollector(sample_sources)
        source = sample_sources[0]
        
        # タイトルがないエントリ
        mock_entry = Mock()
        mock_entry.title = ""
        mock_entry.link = "https://example.com/test"
        
        article = collector.normalize_article(mock_entry, source)
        assert article is None
        
        # URLがないエントリ
        mock_entry.title = "テスト記事"
        mock_entry.link = ""
        
        article = collector.normalize_article(mock_entry, source)
        assert article is None
    
    def test_deduplicate(self, sample_sources):
        """重複除去のテスト"""
        collector = RSSCollector(sample_sources)
        source = sample_sources[0]
        
        # 重複する記事を作成
        articles = [
            RawNewsItem(
                title="同じタイトル",
                url="https://example.com/article1",
                published_at=datetime.now(timezone.utc),
                source=source
            ),
            RawNewsItem(
                title="同じタイトル",  # タイトルが重複
                url="https://example.com/article2",
                published_at=datetime.now(timezone.utc),
                source=source
            ),
            RawNewsItem(
                title="異なるタイトル",
                url="https://example.com/article1",  # URLが重複
                published_at=datetime.now(timezone.utc),
                source=source
            ),
            RawNewsItem(
                title="ユニークなタイトル",
                url="https://example.com/article3",
                published_at=datetime.now(timezone.utc),
                source=source
            )
        ]
        
        deduplicated = collector.deduplicate(articles)
        
        # 重複が除去されて2件になる
        assert len(deduplicated) == 2
        assert deduplicated[0].title == "同じタイトル"
        assert deduplicated[1].title == "ユニークなタイトル"
    
    def test_generate_title_hash(self, sample_sources):
        """タイトルハッシュ生成のテスト"""
        collector = RSSCollector(sample_sources)
        
        # 同じ内容のタイトル（大文字小文字、空白の違い）
        title1 = "AI Technology News"
        title2 = "ai technology news"
        title3 = "AI  Technology   News"  # 余分な空白
        
        hash1 = collector._generate_title_hash(title1)
        hash2 = collector._generate_title_hash(title2)
        hash3 = collector._generate_title_hash(title3)
        
        # 正規化により同じハッシュになる
        assert hash1 == hash2 == hash3
        
        # 異なるタイトルは異なるハッシュ
        different_title = "Machine Learning Update"
        different_hash = collector._generate_title_hash(different_title)
        assert different_hash != hash1
    
    def test_parse_published_date(self, sample_sources):
        """公開日時解析のテスト"""
        collector = RSSCollector(sample_sources)
        
        # struct_time形式
        mock_entry = Mock()
        mock_entry.published_parsed = (2024, 1, 1, 12, 0, 0, 0, 1, 0)
        
        date = collector._parse_published_date(mock_entry)
        assert isinstance(date, datetime)
        assert date.year == 2024
        assert date.month == 1
        assert date.day == 1
        
        # 文字列形式
        mock_entry = Mock()
        mock_entry.published = "Mon, 01 Jan 2024 12:00:00 GMT"
        delattr(mock_entry, 'published_parsed')
        
        date = collector._parse_published_date(mock_entry)
        assert isinstance(date, datetime)
        assert date.year == 2024
    
    def test_extract_content(self, sample_sources):
        """コンテンツ抽出のテスト"""
        collector = RSSCollector(sample_sources)
        
        # summary形式
        mock_entry = Mock()
        mock_entry.summary = "記事の要約です"
        
        content = collector._extract_content(mock_entry)
        assert content == "記事の要約です"
        
        # content形式（リスト）
        mock_entry = Mock()
        mock_entry.content = [{'value': 'コンテンツの内容'}]
        delattr(mock_entry, 'summary')
        
        content = collector._extract_content(mock_entry)
        assert content == "コンテンツの内容"
        
        # コンテンツがない場合
        mock_entry = Mock()
        
        content = collector._extract_content(mock_entry)
        assert content is None