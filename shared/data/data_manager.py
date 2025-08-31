"""
データ管理クラス
構造化されたJSONファイルの出力とデータ管理を担当
"""

import json
import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional, Dict, Any
import logging

from ..types import NewsItem, DailySummary, ProcessingMetrics
from ..config import get_categories, get_default_rss_sources


class DataManager:
    """データ管理とJSON出力を担当するクラス"""
    
    def __init__(self, output_path: str = "frontend/public/data"):
        """
        初期化
        
        Args:
            output_path: 出力先ディレクトリパス
        """
        self.output_path = Path(output_path)
        self.logger = logging.getLogger(__name__)
        
        # 必要なディレクトリを作成
        self._ensure_directories()
    
    def _ensure_directories(self) -> None:
        """必要なディレクトリ構造を作成"""
        directories = [
            self.output_path,
            self.output_path / "news",
            self.output_path / "summaries", 
            self.output_path / "config"
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            self.logger.debug(f"Directory ensured: {directory}")
    
    def save_daily_news(self, date: str, articles: List[NewsItem]) -> None:
        """
        日別ニュースデータを保存
        
        Args:
            date: 日付文字列 (YYYY-MM-DD形式)
            articles: ニュース記事リスト
        """
        try:
            # 日付ディレクトリを作成
            date_dir = self.output_path / "news" / date
            date_dir.mkdir(parents=True, exist_ok=True)
            
            # 記事データを保存
            articles_data = [self._serialize_news_item(article) for article in articles]
            articles_file = date_dir / "articles.json"
            
            with open(articles_file, 'w', encoding='utf-8') as f:
                json.dump(articles_data, f, ensure_ascii=False, indent=2)
            
            # メタデータを生成・保存
            metadata = self._generate_metadata(articles)
            metadata_file = date_dir / "metadata.json"
            
            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
            
            self.logger.info(f"Saved {len(articles)} articles for date {date}")
            
            # 最新データも更新
            self._update_latest_news(articles)
            
        except Exception as e:
            self.logger.error(f"Failed to save daily news for {date}: {e}")
            raise
    
    def save_daily_summary(self, summary: DailySummary) -> None:
        """
        日次サマリーを保存
        
        Args:
            summary: 日次サマリーデータ
        """
        try:
            # 日次サマリーファイルを保存
            summary_file = self.output_path / "summaries" / f"{summary.date}.json"
            summary_data = self._serialize_daily_summary(summary)
            
            with open(summary_file, 'w', encoding='utf-8') as f:
                json.dump(summary_data, f, ensure_ascii=False, indent=2)
            
            # 最新サマリーも更新
            latest_summary_file = self.output_path / "summaries" / "latest.json"
            with open(latest_summary_file, 'w', encoding='utf-8') as f:
                json.dump(summary_data, f, ensure_ascii=False, indent=2)
            
            self.logger.info(f"Saved daily summary for {summary.date}")
            
        except Exception as e:
            self.logger.error(f"Failed to save daily summary for {summary.date}: {e}")
            raise
    
    def load_existing_data(self, date: str) -> Optional[List[NewsItem]]:
        """
        既存の日別データを読み込み
        
        Args:
            date: 日付文字列 (YYYY-MM-DD形式)
            
        Returns:
            既存のニュース記事リスト、存在しない場合はNone
        """
        try:
            articles_file = self.output_path / "news" / date / "articles.json"
            
            if not articles_file.exists():
                return None
            
            with open(articles_file, 'r', encoding='utf-8') as f:
                articles_data = json.load(f)
            
            articles = [self._deserialize_news_item(data) for data in articles_data]
            self.logger.info(f"Loaded {len(articles)} existing articles for {date}")
            
            return articles
            
        except Exception as e:
            self.logger.error(f"Failed to load existing data for {date}: {e}")
            return None
    
    def cleanup_old_data(self, retention_days: int = 30) -> None:
        """
        古いデータをクリーンアップ
        
        Args:
            retention_days: 保持日数
        """
        try:
            cutoff_date = datetime.now() - timedelta(days=retention_days)
            cutoff_str = cutoff_date.strftime("%Y-%m-%d")
            
            # ニュースデータのクリーンアップ
            news_dir = self.output_path / "news"
            if news_dir.exists():
                for date_dir in news_dir.iterdir():
                    if date_dir.is_dir() and date_dir.name < cutoff_str:
                        shutil.rmtree(date_dir)
                        self.logger.info(f"Removed old news data: {date_dir.name}")
            
            # サマリーデータのクリーンアップ
            summaries_dir = self.output_path / "summaries"
            if summaries_dir.exists():
                for summary_file in summaries_dir.glob("*.json"):
                    if summary_file.stem != "latest" and summary_file.stem < cutoff_str:
                        summary_file.unlink()
                        self.logger.info(f"Removed old summary: {summary_file.name}")
            
            self.logger.info(f"Cleanup completed. Retained data from {cutoff_str} onwards")
            
        except Exception as e:
            self.logger.error(f"Failed to cleanup old data: {e}")
            raise
    
    def save_config_files(self) -> None:
        """設定ファイルを保存"""
        try:
            # カテゴリ設定
            categories_file = self.output_path / "config" / "categories.json"
            categories = get_categories()
            
            with open(categories_file, 'w', encoding='utf-8') as f:
                json.dump(categories, f, ensure_ascii=False, indent=2)
            
            # ソース設定
            sources_file = self.output_path / "config" / "sources.json"
            sources = get_default_rss_sources()
            sources_data = [
                {
                    "url": source.url,
                    "category": source.category,
                    "language": source.language,
                    "name": source.name,
                    "enabled": source.enabled
                }
                for source in sources
            ]
            
            with open(sources_file, 'w', encoding='utf-8') as f:
                json.dump(sources_data, f, ensure_ascii=False, indent=2)
            
            self.logger.info("Config files saved successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to save config files: {e}")
            raise
    
    def save_processing_metrics(self, metrics: ProcessingMetrics) -> None:
        """
        処理メトリクスを保存
        
        Args:
            metrics: 処理メトリクス
        """
        try:
            metrics_file = self.output_path / "metrics" / f"metrics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            metrics_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(metrics_file, 'w', encoding='utf-8') as f:
                json.dump(metrics.to_dict(), f, ensure_ascii=False, indent=2)
            
            self.logger.info("Processing metrics saved")
            
        except Exception as e:
            self.logger.error(f"Failed to save processing metrics: {e}")
            raise
    
    def _update_latest_news(self, articles: List[NewsItem], limit: int = 100) -> None:
        """最新ニュースファイルを更新"""
        try:
            # 最新記事を取得（公開日時でソート）
            # タイムゾーン情報を統一してからソート
            def get_comparable_datetime(article):
                dt = article.published_at
                if dt.tzinfo is None:
                    # naive datetimeの場合、UTCとして扱う
                    from datetime import timezone
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            
            sorted_articles = sorted(articles, key=get_comparable_datetime, reverse=True)
            latest_articles = sorted_articles[:limit]
            
            latest_file = self.output_path / "news" / "latest.json"
            articles_data = [self._serialize_news_item(article) for article in latest_articles]
            
            with open(latest_file, 'w', encoding='utf-8') as f:
                json.dump(articles_data, f, ensure_ascii=False, indent=2)
            
            self.logger.debug(f"Updated latest news with {len(latest_articles)} articles")
            
        except Exception as e:
            self.logger.error(f"Failed to update latest news: {e}")
            raise
    
    def _generate_metadata(self, articles: List[NewsItem]) -> Dict[str, Any]:
        """記事メタデータを生成"""
        categories = {}
        sources = {}
        languages = {}
        
        for article in articles:
            # カテゴリ別集計
            categories[article.category] = categories.get(article.category, 0) + 1
            
            # ソース別集計
            sources[article.source] = sources.get(article.source, 0) + 1
            
            # 言語別集計
            languages[article.language] = languages.get(article.language, 0) + 1
        
        return {
            "total": len(articles),
            "categories": categories,
            "sources": sources,
            "languages": languages,
            "generated_at": datetime.now().isoformat()
        }
    
    def _serialize_news_item(self, item: NewsItem) -> Dict[str, Any]:
        """NewsItemをJSON用辞書に変換"""
        return {
            "id": item.id,
            "title": item.title,
            "original_title": item.original_title,
            "summary": item.summary,
            "url": item.url,
            "source": item.source,
            "category": item.category,
            "published_at": item.published_at.isoformat(),
            "language": item.language,
            "tags": item.tags,
            "ai_confidence": item.ai_confidence
        }
    
    def _deserialize_news_item(self, data: Dict[str, Any]) -> NewsItem:
        """JSON辞書からNewsItemを復元"""
        return NewsItem(
            id=data["id"],
            title=data["title"],
            original_title=data["original_title"],
            summary=data["summary"],
            url=data["url"],
            source=data["source"],
            category=data["category"],
            published_at=datetime.fromisoformat(data["published_at"]),
            language=data["language"],
            tags=data["tags"],
            ai_confidence=data["ai_confidence"]
        )
    
    def _serialize_daily_summary(self, summary: DailySummary) -> Dict[str, Any]:
        """DailySummaryをJSON用辞書に変換"""
        return {
            "date": summary.date,
            "total_articles": summary.total_articles,
            "top_trends": summary.top_trends,
            "significant_news": [self._serialize_news_item(item) for item in summary.significant_news],
            "category_breakdown": summary.category_breakdown,
            "summary_ja": summary.summary_ja,
            "summary_en": summary.summary_en,
            "generated_at": summary.generated_at.isoformat()
        }