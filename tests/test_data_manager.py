"""
DataManagerクラスのテスト
"""

import json
import pytest
import tempfile
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import patch, MagicMock

from shared.data.data_manager import DataManager
from shared.types import NewsItem, DailySummary, ProcessingMetrics, RSSSource


class TestDataManager:
    """DataManagerクラスのテストケース"""
    
    @pytest.fixture
    def temp_dir(self):
        """テスト用一時ディレクトリ"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def data_manager(self, temp_dir):
        """テスト用DataManagerインスタンス"""
        return DataManager(output_path=temp_dir)
    
    @pytest.fixture
    def sample_news_items(self):
        """テスト用ニュース記事データ"""
        return [
            NewsItem(
                id="test-1",
                title="AI技術の最新動向",
                original_title="Latest AI Technology Trends",
                summary="AI技術の最新動向について解説します。",
                url="https://example.com/article1",
                source="TechNews",
                category="海外",
                published_at=datetime(2024, 8, 31, 10, 0, 0),
                language="ja",
                tags=["AI", "技術"],
                ai_confidence=0.95
            ),
            NewsItem(
                id="test-2", 
                title="機械学習の応用事例",
                original_title="Machine Learning Applications",
                summary="機械学習の実用的な応用事例を紹介します。",
                url="https://example.com/article2",
                source="MLBlog",
                category="国内",
                published_at=datetime(2024, 8, 31, 11, 0, 0),
                language="ja",
                tags=["機械学習", "応用"],
                ai_confidence=0.88
            )
        ]
    
    @pytest.fixture
    def sample_daily_summary(self, sample_news_items):
        """テスト用日次サマリーデータ"""
        return DailySummary(
            date="2024-08-31",
            total_articles=2,
            top_trends=["AI", "機械学習"],
            significant_news=sample_news_items[:1],
            category_breakdown={"海外": 1, "国内": 1},
            summary_ja="今日のAI関連ニュースまとめ",
            summary_en="Today's AI news summary",
            generated_at=datetime(2024, 8, 31, 12, 0, 0)
        )
    
    def test_init_creates_directories(self, temp_dir):
        """初期化時に必要なディレクトリが作成されることをテスト"""
        data_manager = DataManager(output_path=temp_dir)
        
        expected_dirs = [
            Path(temp_dir),
            Path(temp_dir) / "news",
            Path(temp_dir) / "summaries",
            Path(temp_dir) / "config"
        ]
        
        for directory in expected_dirs:
            assert directory.exists()
            assert directory.is_dir()
    
    def test_save_daily_news(self, data_manager, sample_news_items, temp_dir):
        """日別ニュースデータの保存をテスト"""
        date = "2024-08-31"
        data_manager.save_daily_news(date, sample_news_items)
        
        # 記事ファイルの確認
        articles_file = Path(temp_dir) / "news" / date / "articles.json"
        assert articles_file.exists()
        
        with open(articles_file, 'r', encoding='utf-8') as f:
            articles_data = json.load(f)
        
        assert len(articles_data) == 2
        assert articles_data[0]["id"] == "test-1"
        assert articles_data[0]["title"] == "AI技術の最新動向"
        
        # メタデータファイルの確認
        metadata_file = Path(temp_dir) / "news" / date / "metadata.json"
        assert metadata_file.exists()
        
        with open(metadata_file, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        assert metadata["total"] == 2
        assert metadata["categories"]["海外"] == 1
        assert metadata["categories"]["国内"] == 1
        
        # 最新ニュースファイルの確認
        latest_file = Path(temp_dir) / "news" / "latest.json"
        assert latest_file.exists()
    
    def test_save_daily_summary(self, data_manager, sample_daily_summary, temp_dir):
        """日次サマリーの保存をテスト"""
        data_manager.save_daily_summary(sample_daily_summary)
        
        # 日次サマリーファイルの確認
        summary_file = Path(temp_dir) / "summaries" / "2024-08-31.json"
        assert summary_file.exists()
        
        with open(summary_file, 'r', encoding='utf-8') as f:
            summary_data = json.load(f)
        
        assert summary_data["date"] == "2024-08-31"
        assert summary_data["total_articles"] == 2
        assert summary_data["summary_ja"] == "今日のAI関連ニュースまとめ"
        
        # 最新サマリーファイルの確認
        latest_summary_file = Path(temp_dir) / "summaries" / "latest.json"
        assert latest_summary_file.exists()
    
    def test_load_existing_data(self, data_manager, sample_news_items):
        """既存データの読み込みをテスト"""
        date = "2024-08-31"
        
        # データを保存
        data_manager.save_daily_news(date, sample_news_items)
        
        # データを読み込み
        loaded_articles = data_manager.load_existing_data(date)
        
        assert loaded_articles is not None
        assert len(loaded_articles) == 2
        assert loaded_articles[0].id == "test-1"
        assert loaded_articles[0].title == "AI技術の最新動向"
        assert isinstance(loaded_articles[0].published_at, datetime)
    
    def test_load_existing_data_not_found(self, data_manager):
        """存在しないデータの読み込みをテスト"""
        result = data_manager.load_existing_data("2024-01-01")
        assert result is None
    
    def test_cleanup_old_data(self, data_manager, sample_news_items, sample_daily_summary, temp_dir):
        """古いデータのクリーンアップをテスト"""
        # 古いデータを作成
        old_date = (datetime.now() - timedelta(days=35)).strftime("%Y-%m-%d")
        recent_date = (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d")
        
        # 古いニュースデータ
        data_manager.save_daily_news(old_date, sample_news_items)
        # 新しいニュースデータ
        data_manager.save_daily_news(recent_date, sample_news_items)
        
        # 古いサマリーデータ
        old_summary = DailySummary(
            date=old_date,
            total_articles=1,
            top_trends=["test"],
            significant_news=[],
            category_breakdown={},
            summary_ja="古いサマリー",
            summary_en="Old summary",
            generated_at=datetime.now()
        )
        data_manager.save_daily_summary(old_summary)
        
        # 新しいサマリーデータ
        recent_summary = DailySummary(
            date=recent_date,
            total_articles=1,
            top_trends=["test"],
            significant_news=[],
            category_breakdown={},
            summary_ja="新しいサマリー",
            summary_en="Recent summary",
            generated_at=datetime.now()
        )
        data_manager.save_daily_summary(recent_summary)
        
        # クリーンアップ実行
        data_manager.cleanup_old_data(retention_days=30)
        
        # 古いデータが削除されていることを確認
        old_news_dir = Path(temp_dir) / "news" / old_date
        assert not old_news_dir.exists()
        
        old_summary_file = Path(temp_dir) / "summaries" / f"{old_date}.json"
        assert not old_summary_file.exists()
        
        # 新しいデータが残っていることを確認
        recent_news_dir = Path(temp_dir) / "news" / recent_date
        assert recent_news_dir.exists()
        
        recent_summary_file = Path(temp_dir) / "summaries" / f"{recent_date}.json"
        assert recent_summary_file.exists()
        
        # latest.jsonは残っていることを確認
        latest_summary_file = Path(temp_dir) / "summaries" / "latest.json"
        assert latest_summary_file.exists()
    
    def test_save_config_files(self, data_manager, temp_dir):
        """設定ファイルの保存をテスト"""
        data_manager.save_config_files()
        
        # カテゴリファイルの確認
        categories_file = Path(temp_dir) / "config" / "categories.json"
        assert categories_file.exists()
        
        with open(categories_file, 'r', encoding='utf-8') as f:
            categories = json.load(f)
        
        assert "国内" in categories
        assert "海外" in categories
        assert "Reddit" in categories
        
        # ソースファイルの確認
        sources_file = Path(temp_dir) / "config" / "sources.json"
        assert sources_file.exists()
        
        with open(sources_file, 'r', encoding='utf-8') as f:
            sources = json.load(f)
        
        assert len(sources) > 0
        assert "url" in sources[0]
        assert "name" in sources[0]
        assert "category" in sources[0]
    
    def test_save_processing_metrics(self, data_manager, temp_dir):
        """処理メトリクスの保存をテスト"""
        metrics = ProcessingMetrics(
            start_time=datetime(2024, 8, 31, 10, 0, 0),
            end_time=datetime(2024, 8, 31, 10, 30, 0),
            articles_collected=10,
            articles_processed=8,
            articles_failed=2,
            api_calls_made=5,
            errors=["Error 1", "Error 2"]
        )
        
        data_manager.save_processing_metrics(metrics)
        
        # メトリクスファイルが作成されていることを確認
        metrics_dir = Path(temp_dir) / "metrics"
        assert metrics_dir.exists()
        
        metrics_files = list(metrics_dir.glob("metrics_*.json"))
        assert len(metrics_files) == 1
        
        with open(metrics_files[0], 'r', encoding='utf-8') as f:
            metrics_data = json.load(f)
        
        assert metrics_data["articles_collected"] == 10
        assert metrics_data["articles_processed"] == 8
        assert metrics_data["success_rate"] == 0.8
        assert metrics_data["duration_seconds"] == 1800.0
    
    def test_serialize_deserialize_news_item(self, data_manager, sample_news_items):
        """NewsItemのシリアライズ・デシリアライズをテスト"""
        original_item = sample_news_items[0]
        
        # シリアライズ
        serialized = data_manager._serialize_news_item(original_item)
        
        # デシリアライズ
        deserialized = data_manager._deserialize_news_item(serialized)
        
        # 元のデータと一致することを確認
        assert deserialized.id == original_item.id
        assert deserialized.title == original_item.title
        assert deserialized.published_at == original_item.published_at
        assert deserialized.ai_confidence == original_item.ai_confidence
    
    def test_generate_metadata(self, data_manager, sample_news_items):
        """メタデータ生成をテスト"""
        metadata = data_manager._generate_metadata(sample_news_items)
        
        assert metadata["total"] == 2
        assert metadata["categories"]["海外"] == 1
        assert metadata["categories"]["国内"] == 1
        assert metadata["sources"]["TechNews"] == 1
        assert metadata["sources"]["MLBlog"] == 1
        assert metadata["languages"]["ja"] == 2
        assert "generated_at" in metadata
    
    def test_update_latest_news(self, data_manager, temp_dir):
        """最新ニュース更新をテスト"""
        # 多数の記事を作成（公開日時が異なる）
        articles = []
        for i in range(25):
            article = NewsItem(
                id=f"test-{i}",
                title=f"記事 {i}",
                original_title=f"Article {i}",
                summary=f"記事 {i} の要約",
                url=f"https://example.com/article{i}",
                source="TestSource",
                category="テスト",
                published_at=datetime(2024, 8, 31, 10, i, 0),
                language="ja",
                tags=["test"],
                ai_confidence=0.9
            )
            articles.append(article)
        
        data_manager._update_latest_news(articles, limit=20)
        
        # 最新ファイルの確認
        latest_file = Path(temp_dir) / "news" / "latest.json"
        assert latest_file.exists()
        
        with open(latest_file, 'r', encoding='utf-8') as f:
            latest_data = json.load(f)
        
        # 20件に制限されていることを確認
        assert len(latest_data) == 20
        
        # 最新の記事が最初に来ることを確認（降順ソート）
        assert latest_data[0]["id"] == "test-24"  # 最新
        assert latest_data[19]["id"] == "test-5"  # 20番目
    
    @patch('shared.data.data_manager.logging.getLogger')
    def test_error_handling(self, mock_logger, temp_dir):
        """エラーハンドリングをテスト"""
        mock_logger_instance = MagicMock()
        mock_logger.return_value = mock_logger_instance
        
        # 無効なパスでDataManagerを作成
        invalid_path = "/invalid/path/that/does/not/exist"
        
        # 権限エラーが発生する可能性があるため、例外をキャッチ
        try:
            data_manager = DataManager(output_path=invalid_path)
            # 無効なデータで保存を試行
            data_manager.save_daily_news("invalid-date", [])
        except Exception:
            # エラーが発生することを期待
            pass
        
        # ログが呼ばれたことを確認
        assert mock_logger.called