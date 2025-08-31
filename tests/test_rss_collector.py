"""
RSS収集システムの単体テスト
RSSCollectorクラスの各機能をテスト
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timezone
from pathlib import Path
import sys

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from shared.types import RSSSource, RawNewsItem
from shared.collectors.rss_collector import RSSCollector
from shared.exceptions import RSSCollectionError


class TestRSSCollector:
    """RSSCollectorクラスのテスト"""
    
    @pytest.fixture
    def sample_sources(self):
        """テスト用RSSソース"""
        return [
            RSSSource(
                url="https://example.com/feed1.xml",
                category="国内",
                language="ja",
                name="テストソース1"
            ),
            RSSSource(
                url="https://example.com/feed2.xml",
                category="海外",
                language="en",
                name="テストソース2"
            )
        ]
    
    @pytest.fixture
    def collector(self, sample_sources):
        """テスト用RSSCollector"""
        return RSSCollector(sample_sources)
    
    @pytest.fixture
    def mock_feed_data(self):
        """モックRSSフィードデータ"""
        return {
            'entries': [
                {
                    'title': 'Test Article 1',
                    'link': 'https://example.com/article1',
                    'published_parsed': datetime(2024, 8, 31, 12, 0, 0).timetuple(),
                    'summary': 'Test summary 1',
                    'id': 'article-1'
                },
                {
                    'title': 'Test Article 2',
                    'link': 'https://example.com/article2',
                    'published_parsed': datetime(2024, 8, 31, 13, 0, 0).timetuple(),
                    'summary': 'Test summary 2',
                    'id': 'article-2'
                }
            ]
        }
    
    def test_collector_initialization(self, sample_sources):
        """コレクター初期化テスト"""
        collector = RSSCollector(sample_sources)
        assert len(collector.sources) == 2
        assert collector.sources[0].name == "テストソース1"
    
    @patch('shared.collectors.rss_collector.feedparser.parse')
    def test_parse_feed_success(self, mock_parse, collector, mock_feed_data, sample_sources):
        """正常なRSSフィード解析テスト"""
        mock_parse.return_value = mock_feed_data
        
        articles = collector.parse_feed(sample_sources[0])
        
        assert len(articles) == 2
        assert articles[0].title == 'Test Article 1'
        assert articles[0].url == 'https://example.com/article1'
        assert articles[0].source.name == "テストソース1"
    
    @patch('shared.collectors.rss_collector.feedparser.parse')
    def test_parse_feed_empty(self, mock_parse, collector, sample_sources):
        """空のRSSフィード解析テスト"""
        mock_parse.return_value = {'entries': []}
        
        articles = collector.parse_feed(sample_sources[0])
        
        assert len(articles) == 0
    
    @patch('shared.collectors.rss_collector.feedparser.parse')
    def test_parse_feed_error(self, mock_parse, collector, sample_sources):
        """RSSフィード解析エラーテスト"""
        mock_parse.side_effect = Exception("Network error")
        
        with pytest.raises(RSSCollectionError):
            collector.parse_feed(sample_sources[0])
    
    def test_normalize_article(self, collector, sample_sources):
        """記事正規化テスト"""
        entry = {
            'title': 'Test Article',
            'link': 'https://example.com/article',
            'published_parsed': datetime(2024, 8, 31, 12, 0, 0).timetuple(),
            'summary': 'Test summary',
            'id': 'article-1'
        }
        
        article = collector.normalize_article(entry, sample_sources[0])
        
        assert article.title == 'Test Article'
        assert article.url == 'https://example.com/article'
        assert article.source.name == "テストソース1"
        assert isinstance(article.published_at, datetime)
    
    def test_normalize_article_missing_fields(self, collector, sample_sources):
        """必須フィールド欠損時の記事正規化テスト"""
        entry = {
            'title': 'Test Article',
            # linkが欠損
            'published_parsed': datetime(2024, 8, 31, 12, 0, 0).timetuple(),
        }
        
        article = collector.normalize_article(entry, sample_sources[0])
        assert article is None
    
    def test_deduplicate_articles(self, collector, sample_sources):
        """重複記事除去テスト"""
        articles = [
            RawNewsItem(
                title="同じ記事",
                url="https://example.com/article1",
                published_at=datetime.now(timezone.utc),
                source=sample_sources[0],
                content="内容1"
            ),
            RawNewsItem(
                title="同じ記事",  # 同じタイトル
                url="https://example.com/article2",  # 異なるURL
                published_at=datetime.now(timezone.utc),
                source=sample_sources[1],
                content="内容2"
            ),
            RawNewsItem(
                title="異なる記事",
                url="https://example.com/article3",
                published_at=datetime.now(timezone.utc),
                source=sample_sources[0],
                content="内容3"
            )
        ]
        
        deduplicated = collector.deduplicate(articles)
        
        # 重複除去により2件になることを確認
        assert len(deduplicated) == 2
        titles = [article.title for article in deduplicated]
        assert "同じ記事" in titles
        assert "異なる記事" in titles
    
    @pytest.mark.asyncio
    @patch('shared.collectors.rss_collector.RSSCollector.parse_feed')
    async def test_collect_all_success(self, mock_parse_feed, collector, sample_sources):
        """全ソース収集成功テスト"""
        # モックの戻り値を設定
        mock_parse_feed.side_effect = [
            [RawNewsItem(
                title="記事1",
                url="https://example.com/1",
                published_at=datetime.now(timezone.utc),
                source=sample_sources[0]
            )],
            [RawNewsItem(
                title="記事2",
                url="https://example.com/2",
                published_at=datetime.now(timezone.utc),
                source=sample_sources[1]
            )]
        ]
        
        articles = await collector.collect_all()
        
        assert len(articles) == 2
        assert mock_parse_feed.call_count == 2
    
    @pytest.mark.asyncio
    @patch('shared.collectors.rss_collector.RSSCollector.parse_feed')
    async def test_collect_all_partial_failure(self, mock_parse_feed, collector, sample_sources):
        """一部ソース失敗時の収集テスト"""
        # 最初のソースは成功、2番目は失敗
        mock_parse_feed.side_effect = [
            [RawNewsItem(
                title="記事1",
                url="https://example.com/1",
                published_at=datetime.now(timezone.utc),
                source=sample_sources[0]
            )],
            RSSCollectionError("テストソース2", "接続エラー")
        ]
        
        articles = await collector.collect_all()
        
        # 成功したソースの記事のみ取得されることを確認
        assert len(articles) == 1
        assert articles[0].title == "記事1"
    
    def test_generate_article_id(self, collector):
        """記事ID生成テスト"""
        article_id = collector._generate_article_id("Test Title", "https://example.com/test")
        
        assert isinstance(article_id, str)
        assert len(article_id) > 0
        
        # 同じ入力に対して同じIDが生成されることを確認
        article_id2 = collector._generate_article_id("Test Title", "https://example.com/test")
        assert article_id == article_id2
    
    def test_is_ai_related_content(self, collector):
        """AI関連コンテンツ判定テスト"""
        # AI関連キーワードを含むタイトル
        assert collector._is_ai_related("Machine Learning Breakthrough")
        assert collector._is_ai_related("人工知能の最新動向")
        assert collector._is_ai_related("Deep Learning Model")
        assert collector._is_ai_related("ChatGPTの新機能")
        
        # AI関連でないタイトル
        assert not collector._is_ai_related("Weather Forecast")
        assert not collector._is_ai_related("料理レシピ")
        assert not collector._is_ai_related("Sports News")