"""
Claude要約システムの単体テスト
ClaudeSummarizerクラスの各機能をテスト
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

from shared.types import RSSSource, RawNewsItem, NewsItem, DailySummary
from shared.ai.claude_summarizer import ClaudeSummarizer
from shared.exceptions import AIProcessingError


class TestClaudeSummarizer:
    """ClaudeSummarizerクラスのテスト"""
    
    @pytest.fixture
    def summarizer(self):
        """テスト用ClaudeSummarizer"""
        return ClaudeSummarizer(api_key="test-api-key", batch_size=3)
    
    @pytest.fixture
    def sample_raw_article(self):
        """テスト用生記事データ"""
        source = RSSSource(
            url="https://example.com/feed.xml",
            category="海外",
            language="en",
            name="テストソース"
        )
        return RawNewsItem(
            title="Revolutionary AI Model Achieves Human-Level Performance",
            url="https://example.com/article1",
            published_at=datetime.now(timezone.utc),
            source=source,
            content="A new AI model has been developed that can perform tasks at human level..."
        )
    
    @pytest.fixture
    def sample_japanese_article(self):
        """テスト用日本語記事データ"""
        source = RSSSource(
            url="https://example.com/jp-feed.xml",
            category="国内",
            language="ja",
            name="日本語ソース"
        )
        return RawNewsItem(
            title="AIの新技術が発表される",
            url="https://example.com/jp-article1",
            published_at=datetime.now(timezone.utc),
            source=source,
            content="新しいAI技術が発表され、業界に大きな影響を与えると予想される..."
        )
    
    def test_summarizer_initialization(self):
        """要約器初期化テスト"""
        summarizer = ClaudeSummarizer(api_key="test-key", batch_size=5)
        assert summarizer.batch_size == 5
        assert summarizer.api_key == "test-key"
    
    @pytest.mark.asyncio
    @patch('shared.ai.claude_summarizer.anthropic.AsyncAnthropic')
    async def test_summarize_english_article(self, mock_anthropic, summarizer, sample_raw_article):
        """英語記事要約テスト"""
        # モックレスポンスを設定
        mock_client = AsyncMock()
        mock_anthropic.return_value = mock_client
        
        mock_response = Mock()
        mock_response.content = [Mock()]
        mock_response.content[0].text = """
        {
            "summary_ja": "革新的なAIモデルが人間レベルの性能を達成しました。",
            "tags": ["AI", "機械学習", "性能"],
            "confidence": 0.9
        }
        """
        mock_client.messages.create.return_value = mock_response
        
        result = await summarizer.summarize_article(sample_raw_article)
        
        assert isinstance(result, NewsItem)
        assert result.title == sample_raw_article.title
        assert result.summary == "革新的なAIモデルが人間レベルの性能を達成しました。"
        assert "AI" in result.tags
        assert result.ai_confidence == 0.9
        assert result.language == "ja"  # 日本語に翻訳済み
    
    @pytest.mark.asyncio
    @patch('shared.ai.claude_summarizer.anthropic.AsyncAnthropic')
    async def test_summarize_japanese_article(self, mock_anthropic, summarizer, sample_japanese_article):
        """日本語記事要約テスト"""
        mock_client = AsyncMock()
        mock_anthropic.return_value = mock_client
        
        mock_response = Mock()
        mock_response.content = [Mock()]
        mock_response.content[0].text = """
        {
            "summary_ja": "新しいAI技術が発表され、業界に大きな変化をもたらすと期待されています。",
            "tags": ["AI", "技術", "業界"],
            "confidence": 0.85
        }
        """
        mock_client.messages.create.return_value = mock_response
        
        result = await summarizer.summarize_article(sample_japanese_article)
        
        assert isinstance(result, NewsItem)
        assert result.original_title == sample_japanese_article.title
        assert result.language == "ja"
        assert "技術" in result.tags
    
    @pytest.mark.asyncio
    @patch('shared.ai.claude_summarizer.anthropic.AsyncAnthropic')
    async def test_summarize_article_api_error(self, mock_anthropic, summarizer, sample_raw_article):
        """API エラー時の要約テスト"""
        mock_client = AsyncMock()
        mock_anthropic.return_value = mock_client
        mock_client.messages.create.side_effect = Exception("API Error")
        
        with pytest.raises(AIProcessingError):
            await summarizer.summarize_article(sample_raw_article)
    
    @pytest.mark.asyncio
    @patch('shared.ai.claude_summarizer.anthropic.AsyncAnthropic')
    async def test_summarize_article_invalid_json(self, mock_anthropic, summarizer, sample_raw_article):
        """不正なJSON応答時のテスト"""
        mock_client = AsyncMock()
        mock_anthropic.return_value = mock_client
        
        mock_response = Mock()
        mock_response.content = [Mock()]
        mock_response.content[0].text = "Invalid JSON response"
        mock_client.messages.create.return_value = mock_response
        
        with pytest.raises(AIProcessingError):
            await summarizer.summarize_article(sample_raw_article)
    
    @pytest.mark.asyncio
    async def test_translate_to_japanese(self, summarizer):
        """日本語翻訳テスト"""
        with patch.object(summarizer, '_call_claude_api') as mock_call:
            mock_call.return_value = "これは翻訳されたテキストです。"
            
            result = await summarizer.translate_to_japanese("This is a test text.")
            
            assert result == "これは翻訳されたテキストです。"
            mock_call.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_batch_process(self, summarizer):
        """バッチ処理テスト"""
        articles = []
        for i in range(5):
            source = RSSSource(
                url=f"https://example.com/feed{i}.xml",
                category="テスト",
                language="en",
                name=f"ソース{i}"
            )
            articles.append(RawNewsItem(
                title=f"Test Article {i}",
                url=f"https://example.com/article{i}",
                published_at=datetime.now(timezone.utc),
                source=source,
                content=f"Content {i}"
            ))
        
        with patch.object(summarizer, 'summarize_article') as mock_summarize:
            # モックの戻り値を設定
            mock_summarize.side_effect = [
                NewsItem(
                    id=f"test-{i}",
                    title=f"Test Article {i}",
                    original_title=f"Test Article {i}",
                    summary=f"要約 {i}",
                    url=f"https://example.com/article{i}",
                    source=f"ソース{i}",
                    category="テスト",
                    published_at=datetime.now(timezone.utc),
                    language="ja",
                    tags=["テスト"],
                    ai_confidence=0.8
                ) for i in range(5)
            ]
            
            results = await summarizer.batch_process(articles)
            
            assert len(results) == 5
            assert mock_summarize.call_count == 5
    
    @pytest.mark.asyncio
    async def test_batch_process_with_failures(self, summarizer):
        """バッチ処理（一部失敗）テスト"""
        articles = []
        for i in range(3):
            source = RSSSource(
                url=f"https://example.com/feed{i}.xml",
                category="テスト",
                language="en",
                name=f"ソース{i}"
            )
            articles.append(RawNewsItem(
                title=f"Test Article {i}",
                url=f"https://example.com/article{i}",
                published_at=datetime.now(timezone.utc),
                source=source,
                content=f"Content {i}"
            ))
        
        with patch.object(summarizer, 'summarize_article') as mock_summarize:
            # 2番目の記事で失敗
            mock_summarize.side_effect = [
                NewsItem(
                    id="test-0",
                    title="Test Article 0",
                    original_title="Test Article 0",
                    summary="要約 0",
                    url="https://example.com/article0",
                    source="ソース0",
                    category="テスト",
                    published_at=datetime.now(timezone.utc),
                    language="ja",
                    tags=["テスト"],
                    ai_confidence=0.8
                ),
                AIProcessingError("処理失敗", "test-1"),
                NewsItem(
                    id="test-2",
                    title="Test Article 2",
                    original_title="Test Article 2",
                    summary="要約 2",
                    url="https://example.com/article2",
                    source="ソース2",
                    category="テスト",
                    published_at=datetime.now(timezone.utc),
                    language="ja",
                    tags=["テスト"],
                    ai_confidence=0.8
                )
            ]
            
            results = await summarizer.batch_process(articles)
            
            # 失敗した記事を除いて2件が返されることを確認
            assert len(results) == 2
            assert results[0].id == "test-0"
            assert results[1].id == "test-2"
    
    @pytest.mark.asyncio
    async def test_analyze_daily_trends(self, summarizer):
        """日次トレンド分析テスト"""
        # テスト用記事データ
        articles = []
        for i in range(10):
            articles.append(NewsItem(
                id=f"test-{i}",
                title=f"AI記事 {i}",
                original_title=f"AI Article {i}",
                summary=f"AI技術に関する要約 {i}",
                url=f"https://example.com/article{i}",
                source="テストソース",
                category="AI" if i < 5 else "機械学習",
                published_at=datetime.now(timezone.utc),
                language="ja",
                tags=["AI", "技術"] if i < 5 else ["機械学習", "データ"],
                ai_confidence=0.8
            ))
        
        with patch.object(summarizer, '_call_claude_api') as mock_call:
            mock_call.return_value = """
            {
                "summary_ja": "今日はAI技術と機械学習に関する記事が多く投稿されました。",
                "summary_en": "Today saw many articles about AI technology and machine learning.",
                "top_trends": ["AI技術", "機械学習", "データ分析"],
                "significant_news": ["test-0", "test-5"]
            }
            """
            
            result = await summarizer.analyze_daily_trends(articles)
            
            assert isinstance(result, DailySummary)
            assert result.total_articles == 10
            assert "AI技術" in result.top_trends
            assert len(result.significant_news) == 2
            assert result.category_breakdown["AI"] == 5
            assert result.category_breakdown["機械学習"] == 5
    
    def test_extract_tags_from_content(self, summarizer):
        """コンテンツからタグ抽出テスト"""
        content = "This article discusses machine learning and artificial intelligence applications in healthcare."
        
        tags = summarizer._extract_tags_from_content(content)
        
        assert "machine learning" in [tag.lower() for tag in tags]
        assert "artificial intelligence" in [tag.lower() for tag in tags]
    
    def test_calculate_confidence_score(self, summarizer):
        """信頼度スコア計算テスト"""
        # 高品質なコンテンツ
        high_quality_content = "This is a well-written article with detailed analysis and multiple sources."
        high_score = summarizer._calculate_confidence_score(high_quality_content, ["AI", "analysis"])
        
        # 低品質なコンテンツ
        low_quality_content = "Short text."
        low_score = summarizer._calculate_confidence_score(low_quality_content, [])
        
        assert high_score > low_score
        assert 0.0 <= high_score <= 1.0
        assert 0.0 <= low_score <= 1.0