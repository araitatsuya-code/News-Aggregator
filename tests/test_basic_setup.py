"""
基本セットアップのテスト
プロジェクト基盤が正しく設定されているかを確認
"""

import pytest
import sys
from pathlib import Path
from datetime import datetime

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from shared.types import RSSSource, NewsItem, DailySummary, ProcessingMetrics
from shared.config import AppConfig, get_default_rss_sources, get_categories
from shared.utils.logger import setup_logger, get_logger
from shared.exceptions import RSSCollectionError, AIProcessingError


class TestDataTypes:
    """データ型のテスト"""
    
    def test_rss_source_creation(self):
        """RSSSource作成テスト"""
        source = RSSSource(
            url="https://example.com/feed.xml",
            category="テスト",
            language="ja",
            name="テストソース"
        )
        assert source.url == "https://example.com/feed.xml"
        assert source.enabled is True
    
    def test_news_item_validation(self):
        """NewsItem検証テスト"""
        news = NewsItem(
            id="test-1",
            title="テストニュース",
            original_title="Test News",
            summary="テスト要約",
            url="https://example.com/news/1",
            source="テストソース",
            category="テスト",
            published_at=datetime.now(),
            language="ja",
            tags=["AI", "テスト"],
            ai_confidence=0.8
        )
        assert news.ai_confidence == 0.8
        
        # 不正な信頼度でエラーが発生することを確認
        with pytest.raises(ValueError):
            NewsItem(
                id="test-2",
                title="テストニュース2",
                original_title="Test News 2",
                summary="テスト要約2",
                url="https://example.com/news/2",
                source="テストソース",
                category="テスト",
                published_at=datetime.now(),
                language="ja",
                tags=["AI"],
                ai_confidence=1.5  # 不正な値
            )
    
    def test_processing_metrics(self):
        """ProcessingMetrics テスト"""
        start = datetime.now()
        end = datetime.now()
        
        metrics = ProcessingMetrics(
            start_time=start,
            end_time=end,
            articles_collected=10,
            articles_processed=8,
            articles_failed=2,
            api_calls_made=5,
            errors=["エラー1", "エラー2"]
        )
        
        result = metrics.to_dict()
        assert result['articles_collected'] == 10
        assert result['articles_processed'] == 8
        assert result['success_rate'] == 0.8
        assert result['error_count'] == 2


class TestConfiguration:
    """設定のテスト"""
    
    def test_default_rss_sources(self):
        """デフォルトRSSソース取得テスト"""
        sources = get_default_rss_sources()
        assert len(sources) > 0
        assert all(isinstance(source, RSSSource) for source in sources)
    
    def test_categories(self):
        """カテゴリ一覧取得テスト"""
        categories = get_categories()
        assert "国内" in categories
        assert "海外" in categories
        assert "Reddit" in categories


class TestLogging:
    """ログ機能のテスト"""
    
    def test_logger_setup(self):
        """ロガー設定テスト"""
        logger = setup_logger("test", "DEBUG", "test_logs", console_output=False)
        assert logger.name == "test"
        assert logger.level == 10  # DEBUG level
    
    def test_get_logger(self):
        """ロガー取得テスト"""
        logger = get_logger("test_logger")
        assert logger is not None


class TestExceptions:
    """例外クラスのテスト"""
    
    def test_rss_collection_error(self):
        """RSS収集エラーテスト"""
        error = RSSCollectionError("test_source", "connection failed")
        assert "test_source" in str(error)
        assert "connection failed" in str(error)
    
    def test_ai_processing_error(self):
        """AI処理エラーテスト"""
        error = AIProcessingError("API limit exceeded", "article-123")
        assert "article-123" in str(error)
        assert "API limit exceeded" in str(error)