"""
ClaudeSummarizer のテスト
"""

import pytest
import asyncio
from datetime import datetime
from unittest.mock import Mock, AsyncMock, patch
from shared.ai.claude_summarizer import ClaudeSummarizer
from shared.types import RawNewsItem, RSSSource, NewsItem
from shared.config import AppConfig
from shared.exceptions import AIProcessingError


@pytest.fixture
def mock_config():
    """テスト用設定"""
    return AppConfig(
        claude_api_key="test_api_key",
        claude_model="claude-3-haiku-20240307",
        claude_max_tokens=1000,
        claude_batch_size=2,
        max_retries=2,
        retry_delay=0.1
    )


@pytest.fixture
def sample_rss_source():
    """テスト用RSSソース"""
    return RSSSource(
        url="https://example.com/rss",
        category="テスト",
        language="en",
        name="Test Source"
    )


@pytest.fixture
def sample_raw_news_item(sample_rss_source):
    """テスト用生記事データ"""
    item = RawNewsItem(
        title="Test AI Article",
        url="https://example.com/article1",
        published_at=datetime.now(),
        source=sample_rss_source,
        content="This is a test article about AI technology."
    )
    item.id = "test_id_1"
    return item


@pytest.fixture
def japanese_raw_news_item():
    """テスト用日本語記事データ"""
    source = RSSSource(
        url="https://example.jp/rss",
        category="国内",
        language="ja",
        name="日本のソース"
    )
    item = RawNewsItem(
        title="AIに関するテスト記事",
        url="https://example.jp/article1",
        published_at=datetime.now(),
        source=source,
        content="これはAI技術に関するテスト記事です。"
    )
    item.id = "test_id_jp"
    return item


class TestClaudeSummarizer:
    """ClaudeSummarizerのテストクラス"""
    
    @pytest.mark.asyncio
    async def test_init(self, mock_config):
        """初期化テスト"""
        summarizer = ClaudeSummarizer(mock_config)
        
        assert summarizer.config == mock_config
        assert summarizer.batch_size == 2
        assert summarizer.max_retries == 2
        assert summarizer.retry_delay == 0.1
    
    @pytest.mark.asyncio
    async def test_summarize_article_english(self, mock_config, sample_raw_news_item):
        """英語記事の要約テスト"""
        summarizer = ClaudeSummarizer(mock_config)
        
        # Claude APIのモック
        mock_response = Mock()
        mock_response.content = [Mock(text="これはAI技術に関するテスト要約です。")]
        
        with patch.object(summarizer.client, 'messages') as mock_messages:
            mock_messages.create = AsyncMock(return_value=mock_response)
            
            result = await summarizer.summarize_article(sample_raw_news_item)
            
            assert result is not None
            assert isinstance(result, NewsItem)
            assert result.id == "test_id_1"
            assert result.original_title == "Test AI Article"
            assert result.summary == "これはAI技術に関するテスト要約です。"
            assert result.url == "https://example.com/article1"
            assert result.source == "Test Source"
            assert result.category == "テスト"
            assert result.language == "en"
            assert result.ai_confidence == 0.8
    
    @pytest.mark.asyncio
    async def test_summarize_article_japanese(self, mock_config, japanese_raw_news_item):
        """日本語記事の要約テスト"""
        summarizer = ClaudeSummarizer(mock_config)
        
        # Claude APIのモック
        mock_response = Mock()
        mock_response.content = [Mock(text="これは日本語記事の要約です。")]
        
        with patch.object(summarizer.client, 'messages') as mock_messages:
            mock_messages.create = AsyncMock(return_value=mock_response)
            
            result = await summarizer.summarize_article(japanese_raw_news_item)
            
            assert result is not None
            assert result.title == "AIに関するテスト記事"  # 日本語記事は翻訳されない
            assert result.original_title == "AIに関するテスト記事"
            assert result.summary == "これは日本語記事の要約です。"
    
    @pytest.mark.asyncio
    async def test_generate_summary(self, mock_config, sample_raw_news_item):
        """要約生成テスト"""
        summarizer = ClaudeSummarizer(mock_config)
        
        mock_response = Mock()
        mock_response.content = [Mock(text="テスト要約文です。")]
        
        with patch.object(summarizer.client, 'messages') as mock_messages:
            mock_messages.create = AsyncMock(return_value=mock_response)
            
            result = await summarizer._generate_summary(sample_raw_news_item)
            
            assert result == "テスト要約文です。"
            mock_messages.create.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_generate_summary_truncation(self, mock_config, sample_raw_news_item):
        """要約文字数制限テスト"""
        summarizer = ClaudeSummarizer(mock_config)
        
        # 200文字を超える要約
        long_summary = "あ" * 250
        mock_response = Mock()
        mock_response.content = [Mock(text=long_summary)]
        
        with patch.object(summarizer.client, 'messages') as mock_messages:
            mock_messages.create = AsyncMock(return_value=mock_response)
            
            result = await summarizer._generate_summary(sample_raw_news_item)
            
            assert len(result) == 200
            assert result.endswith("...")
    
    @pytest.mark.asyncio
    async def test_translate_to_japanese(self, mock_config):
        """英日翻訳テスト"""
        summarizer = ClaudeSummarizer(mock_config)
        
        mock_response = Mock()
        mock_response.content = [Mock(text="人工知能技術")]
        
        with patch.object(summarizer.client, 'messages') as mock_messages:
            mock_messages.create = AsyncMock(return_value=mock_response)
            
            result = await summarizer._translate_to_japanese("Artificial Intelligence Technology")
            
            assert result == "人工知能技術"
    
    @pytest.mark.asyncio
    async def test_generate_tags(self, mock_config, sample_raw_news_item):
        """タグ生成テスト"""
        summarizer = ClaudeSummarizer(mock_config)
        
        mock_response = Mock()
        mock_response.content = [Mock(text="AI, 機械学習, 技術, イノベーション")]
        
        with patch.object(summarizer.client, 'messages') as mock_messages:
            mock_messages.create = AsyncMock(return_value=mock_response)
            
            result = await summarizer._generate_tags(sample_raw_news_item, "テスト要約")
            
            assert result == ["AI", "機械学習", "技術", "イノベーション"]
    
    @pytest.mark.asyncio
    async def test_batch_process(self, mock_config, sample_rss_source):
        """バッチ処理テスト"""
        summarizer = ClaudeSummarizer(mock_config)
        
        # テスト用記事リスト
        articles = []
        for i in range(3):
            item = RawNewsItem(
                title=f"Test Article {i}",
                url=f"https://example.com/article{i}",
                published_at=datetime.now(),
                source=sample_rss_source,
                content=f"Test content {i}"
            )
            item.id = f"test_id_{i}"
            articles.append(item)
        
        # summarize_articleをモック
        mock_results = []
        for i in range(3):
            mock_result = NewsItem(
                id=f"test_id_{i}",
                title=f"Test Article {i}",
                original_title=f"Test Article {i}",
                summary=f"Summary {i}",
                url=f"https://example.com/article{i}",
                source="Test Source",
                category="テスト",
                published_at=datetime.now(),
                language="en",
                tags=[],
                ai_confidence=0.8
            )
            mock_results.append(mock_result)
        
        with patch.object(summarizer, '_process_article_with_retry') as mock_process:
            mock_process.side_effect = mock_results
            
            result = await summarizer.batch_process(articles)
            
            assert len(result) == 3
            assert all(isinstance(item, NewsItem) for item in result)
            assert mock_process.call_count == 3
    
    @pytest.mark.asyncio
    async def test_process_article_with_retry_success(self, mock_config, sample_raw_news_item):
        """リトライ機能テスト（成功ケース）"""
        summarizer = ClaudeSummarizer(mock_config)
        
        expected_result = NewsItem(
            id="test_id_1",
            title="Test Article",
            original_title="Test Article",
            summary="Test Summary",
            url="https://example.com/article1",
            source="Test Source",
            category="テスト",
            published_at=datetime.now(),
            language="en",
            tags=[],
            ai_confidence=0.8
        )
        
        with patch.object(summarizer, 'summarize_article') as mock_summarize:
            mock_summarize.return_value = expected_result
            
            result = await summarizer._process_article_with_retry(sample_raw_news_item)
            
            assert result == expected_result
            mock_summarize.assert_called_once_with(sample_raw_news_item)
    
    @pytest.mark.asyncio
    async def test_process_article_with_retry_failure(self, mock_config, sample_raw_news_item):
        """リトライ機能テスト（失敗ケース）"""
        summarizer = ClaudeSummarizer(mock_config)
        
        with patch.object(summarizer, 'summarize_article') as mock_summarize:
            mock_summarize.side_effect = AIProcessingError("Test error")
            
            result = await summarizer._process_article_with_retry(sample_raw_news_item)
            
            assert result is None
            assert mock_summarize.call_count == 2  # max_retries = 2
    
    @pytest.mark.asyncio
    async def test_analyze_daily_trends(self, mock_config):
        """日次トレンド分析テスト"""
        summarizer = ClaudeSummarizer(mock_config)
        
        # テスト用記事リスト
        articles = []
        for i in range(3):
            article = NewsItem(
                id=f"test_id_{i}",
                title=f"Test Article {i}",
                original_title=f"Test Article {i}",
                summary=f"Summary {i}",
                url=f"https://example.com/article{i}",
                source="Test Source",
                category="テスト",
                published_at=datetime.now(),
                language="en",
                tags=[],
                ai_confidence=0.8 + i * 0.1
            )
            articles.append(article)
        
        # モック設定
        with patch.object(summarizer, '_extract_trends') as mock_trends, \
             patch.object(summarizer, '_generate_daily_summary') as mock_summary:
            
            mock_trends.return_value = ["トレンド1", "トレンド2"]
            mock_summary.return_value = "日次サマリーテスト"
            
            result = await summarizer.analyze_daily_trends(articles)
            
            assert isinstance(result, type(summarizer._create_empty_summary()))
            assert result.total_articles == 3
            assert result.top_trends == ["トレンド1", "トレンド2"]
            assert len(result.significant_news) == 3
            assert result.category_breakdown == {"テスト": 3}
    
    @pytest.mark.asyncio
    async def test_analyze_daily_trends_empty(self, mock_config):
        """空記事リストでの日次トレンド分析テスト"""
        summarizer = ClaudeSummarizer(mock_config)
        
        result = await summarizer.analyze_daily_trends([])
        
        assert result.total_articles == 0
        assert result.top_trends == []
        assert result.significant_news == []
        assert result.category_breakdown == {}
        assert "ニュースがありませんでした" in result.summary_ja
    
    @pytest.mark.asyncio
    async def test_api_error_handling(self, mock_config, sample_raw_news_item):
        """API エラーハンドリングテスト"""
        summarizer = ClaudeSummarizer(mock_config)
        
        with patch.object(summarizer.client, 'messages') as mock_messages:
            mock_messages.create = AsyncMock(side_effect=Exception("API Error"))
            
            # _generate_summaryがNoneを返すため、summarize_articleもNoneを返す
            result = await summarizer.summarize_article(sample_raw_news_item)
            assert result is None
    
    def test_create_summary_prompt_japanese(self, mock_config):
        """日本語記事用プロンプト作成テスト"""
        summarizer = ClaudeSummarizer(mock_config)
        
        prompt = summarizer._create_summary_prompt("テストタイトル", "テスト内容", "ja")
        
        assert "テストタイトル" in prompt
        assert "テスト内容" in prompt
        assert "200文字以内" in prompt
    
    def test_create_summary_prompt_english(self, mock_config):
        """英語記事用プロンプト作成テスト"""
        summarizer = ClaudeSummarizer(mock_config)
        
        prompt = summarizer._create_summary_prompt("Test Title", "Test Content", "en")
        
        assert "Test Title" in prompt
        assert "Test Content" in prompt
        assert "日本語で200文字以内" in prompt