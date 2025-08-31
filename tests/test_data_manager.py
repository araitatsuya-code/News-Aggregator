"""
データ管理システムの単体テスト
DataManagerクラスの各機能をテスト
"""

import pytest
import json
import tempfile
import shutil
from pathlib import Path
from datetime import datetime, timezone
from unittest.mock import patch, mock_open
import sys

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from shared.types import NewsItem, DailySummary, RSSSource
from shared.data.data_manager import DataManager
from shared.exceptions import DataManagerError


class TestDataManager:
    """DataManagerクラスのテスト"""
    
    @pytest.fixture
    def temp_dir(self):
        """テスト用一時ディレクトリ"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def data_manager(self, temp_dir):
        """テスト用DataManager"""
        return DataManager(output_path=str(temp_dir))
    
    @pytest.fixture
    def sample_news_items(self):
        """テスト用ニュース記事データ"""
        return [
            NewsItem(
                id="test-1",
                title="AI技術の進歩",
                original_title="AI Technology Advances",
                summary="AI技術が大幅に進歩しています。",
                url="https://example.com/article1",
                source="テストソース1",
                category="AI",
                published_at=datetime(2024, 8, 31, 12, 0, 0, tzinfo=timezone.utc),
                language="ja",
                tags=["AI", "技術"],
                ai_confidence=0.9
            ),
            NewsItem(
                id="test-2",
                title="機械学習の応用",
                original_title="Machine Learning Applications",
                summary="機械学習の新しい応用分野が発見されました。",
                url="https://example.com/article2",
                source="テストソース2",
                category="機械学習",
                published_at=datetime(2024, 8, 31, 13, 0, 0, tzinfo=timezone.utc),
                language="ja",
                tags=["機械学習", "応用"],
                ai_confidence=0.85
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
            category_breakdown={"AI": 1, "機械学習": 1},
            summary_ja="今日はAIと機械学習に関する記事が投稿されました。",
            summary_en="Today saw articles about AI and machine learning.",
            generated_at=datetime.now(timezone.utc)
        )
    
    def test_data_manager_initialization(self, temp_dir):
        """データマネージャー初期化テスト"""
        manager = DataManager(output_path=str(temp_dir))
        assert manager.output_path == Path(temp_dir)
        
        # 必要なディレクトリが作成されることを確認
        assert (temp_dir / "news").exists()
        assert (temp_dir / "summaries").exists()
        assert (temp_dir / "config").exists()
        assert (temp_dir / "metrics").exists()
    
    def test_save_daily_news(self, data_manager, sample_news_items, temp_dir):
        """日次ニュース保存テスト"""
        date = "2024-08-31"
        
        data_manager.save_daily_news(date, sample_news_items)
        
        # ファイルが作成されることを確認
        news_file = temp_dir / "news" / date / "articles.json"
        metadata_file = temp_dir / "news" / date / "metadata.json"
        
        assert news_file.exists()
        assert metadata_file.exists()
        
        # ファイル内容を確認
        with open(news_file, 'r', encoding='utf-8') as f:
            saved_articles = json.load(f)
        
        assert len(saved_articles) == 2
        assert saved_articles[0]['title'] == "AI技術の進歩"
        
        with open(metadata_file, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        assert metadata['total'] == 2
        assert "AI" in metadata['categories']
        assert "機械学習" in metadata['categories']
    
    def test_save_daily_summary(self, data_manager, sample_daily_summary, temp_dir):
        """日次サマリー保存テスト"""
        data_manager.save_daily_summary(sample_daily_summary)
        
        # ファイルが作成されることを確認
        summary_file = temp_dir / "summaries" / "2024-08-31.json"
        latest_file = temp_dir / "summaries" / "latest.json"
        
        assert summary_file.exists()
        assert latest_file.exists()
        
        # ファイル内容を確認
        with open(summary_file, 'r', encoding='utf-8') as f:
            saved_summary = json.load(f)
        
        assert saved_summary['date'] == "2024-08-31"
        assert saved_summary['total_articles'] == 2
        assert "AI" in saved_summary['top_trends']
    
    def test_load_existing_data(self, data_manager, sample_news_items, temp_dir):
        """既存データ読み込みテスト"""
        date = "2024-08-31"
        
        # まずデータを保存
        data_manager.save_daily_news(date, sample_news_items)
        
        # データを読み込み
        loaded_articles = data_manager.load_existing_data(date)
        
        assert loaded_articles is not None
        assert len(loaded_articles) == 2
        assert loaded_articles[0].title == "AI技術の進歩"
    
    def test_load_nonexistent_data(self, data_manager):
        """存在しないデータ読み込みテスト"""
        loaded_articles = data_manager.load_existing_data("2024-01-01")
        assert loaded_articles is None
    
    def test_update_latest_news(self, data_manager, sample_news_items, temp_dir):
        """最新ニュース更新テスト"""
        data_manager.update_latest_news(sample_news_items)
        
        latest_file = temp_dir / "news" / "latest.json"
        assert latest_file.exists()
        
        with open(latest_file, 'r', encoding='utf-8') as f:
            latest_news = json.load(f)
        
        assert len(latest_news) == 2
        assert latest_news[0]['title'] == "AI技術の進歩"
    
    def test_update_latest_news_limit(self, data_manager, temp_dir):
        """最新ニュース件数制限テスト"""
        # 30件のニュース記事を作成
        articles = []
        for i in range(30):
            articles.append(NewsItem(
                id=f"test-{i}",
                title=f"記事 {i}",
                original_title=f"Article {i}",
                summary=f"要約 {i}",
                url=f"https://example.com/article{i}",
                source="テストソース",
                category="テスト",
                published_at=datetime.now(timezone.utc),
                language="ja",
                tags=["テスト"],
                ai_confidence=0.8
            ))
        
        data_manager.update_latest_news(articles)
        
        latest_file = temp_dir / "news" / "latest.json"
        with open(latest_file, 'r', encoding='utf-8') as f:
            latest_news = json.load(f)
        
        # 最新20件のみ保存されることを確認
        assert len(latest_news) == 20
    
    def test_cleanup_old_data(self, data_manager, temp_dir):
        """古いデータクリーンアップテスト"""
        # 複数日のデータを作成
        dates = ["2024-08-25", "2024-08-30", "2024-08-31"]
        
        for date in dates:
            date_dir = temp_dir / "news" / date
            date_dir.mkdir(parents=True, exist_ok=True)
            
            # ダミーファイルを作成
            (date_dir / "articles.json").write_text("[]")
            (temp_dir / "summaries" / f"{date}.json").write_text("{}")
        
        # 3日間の保持期間でクリーンアップ
        data_manager.cleanup_old_data(retention_days=3)
        
        # 古いデータが削除されることを確認
        assert not (temp_dir / "news" / "2024-08-25").exists()
        assert (temp_dir / "news" / "2024-08-30").exists()
        assert (temp_dir / "news" / "2024-08-31").exists()
    
    def test_save_config_data(self, data_manager, temp_dir):
        """設定データ保存テスト"""
        categories = ["AI", "機械学習", "データサイエンス"]
        sources = [
            {
                "name": "テストソース1",
                "url": "https://example.com/feed1.xml",
                "category": "AI",
                "language": "ja"
            }
        ]
        
        data_manager.save_config_data(categories, sources)
        
        # ファイルが作成されることを確認
        categories_file = temp_dir / "config" / "categories.json"
        sources_file = temp_dir / "config" / "sources.json"
        
        assert categories_file.exists()
        assert sources_file.exists()
        
        # ファイル内容を確認
        with open(categories_file, 'r', encoding='utf-8') as f:
            saved_categories = json.load(f)
        
        assert saved_categories == categories
    
    def test_save_processing_metrics(self, data_manager, temp_dir):
        """処理メトリクス保存テスト"""
        from shared.types import ProcessingMetrics
        
        metrics = ProcessingMetrics(
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc),
            articles_collected=10,
            articles_processed=8,
            articles_failed=2,
            api_calls_made=5,
            errors=["エラー1", "エラー2"]
        )
        
        data_manager.save_processing_metrics(metrics)
        
        # メトリクスファイルが作成されることを確認
        metrics_files = list((temp_dir / "metrics").glob("metrics_*.json"))
        assert len(metrics_files) > 0
        
        # ファイル内容を確認
        with open(metrics_files[0], 'r', encoding='utf-8') as f:
            saved_metrics = json.load(f)
        
        assert saved_metrics['articles_collected'] == 10
        assert saved_metrics['success_rate'] == 0.8
    
    def test_get_data_statistics(self, data_manager, sample_news_items, temp_dir):
        """データ統計取得テスト"""
        # テストデータを保存
        data_manager.save_daily_news("2024-08-31", sample_news_items)
        
        stats = data_manager.get_data_statistics()
        
        assert 'total_articles' in stats
        assert 'categories' in stats
        assert 'date_range' in stats
        assert stats['total_articles'] >= 2
    
    def test_file_write_error_handling(self, data_manager, sample_news_items):
        """ファイル書き込みエラーハンドリングテスト"""
        # 書き込み権限のないパスを設定
        data_manager.output_path = Path("/invalid/path")
        
        with pytest.raises(DataManagerError):
            data_manager.save_daily_news("2024-08-31", sample_news_items)
    
    def test_json_serialization_error(self, data_manager, temp_dir):
        """JSON シリアライゼーションエラーテスト"""
        # シリアライズできないオブジェクトを含むデータ
        invalid_data = [{"invalid": set([1, 2, 3])}]  # setはJSONシリアライズできない
        
        with pytest.raises(DataManagerError):
            data_manager._save_json_file(temp_dir / "test.json", invalid_data)