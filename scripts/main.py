"""
メイン処理スクリプト
AI News Aggregator のデータ処理パイプラインを実行
"""

import asyncio
import sys
import traceback
from pathlib import Path
from datetime import datetime
from typing import List, Optional

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from shared.config import AppConfig
from shared.utils.logger import setup_logger
from shared.types import ProcessingMetrics, RawNewsItem, NewsItem, DailySummary


class ProcessingPipeline:
    """メイン処理パイプライン"""
    
    def __init__(self, config: AppConfig):
        """
        初期化
        
        Args:
            config: アプリケーション設定
        """
        self.config = config
        self.logger = setup_logger("main", config.log_level, config.log_dir)
        
        # 処理メトリクス初期化
        self.metrics = ProcessingMetrics(
            start_time=datetime.now(),
            end_time=datetime.now(),  # 後で更新
            articles_collected=0,
            articles_processed=0,
            articles_failed=0,
            api_calls_made=0,
            errors=[]
        )
        
        # コンポーネント
        self.collector = None
        self.summarizer = None
        self.data_manager = None
    
    async def initialize_components(self) -> bool:
        """
        コンポーネントを初期化
        
        Returns:
            初期化成功時True
        """
        try:
            from shared.collectors.rss_collector import RSSCollector
            from shared.ai.claude_summarizer import ClaudeSummarizer
            from shared.data.data_manager import DataManager
            from shared.config import get_default_rss_sources
            
            # RSS収集器を初期化
            rss_sources = get_default_rss_sources()
            self.collector = RSSCollector(rss_sources)
            self.logger.info(f"RSS収集器を初期化しました: {len(rss_sources)}ソース")
            
            # AI要約器を初期化
            self.summarizer = ClaudeSummarizer(self.config)
            self.logger.info("AI要約器を初期化しました")
            
            # データ管理器を初期化
            self.data_manager = DataManager(self.config.output_path)
            self.logger.info("データ管理器を初期化しました")
            
            return True
            
        except Exception as e:
            self.logger.error(f"コンポーネント初期化エラー: {e}")
            self.metrics.errors.append(f"Component initialization failed: {str(e)}")
            return False
    
    async def collect_articles(self) -> Optional[List[RawNewsItem]]:
        """
        RSS記事を収集
        
        Returns:
            収集された記事リスト、失敗時はNone
        """
        try:
            self.logger.info("RSS収集を開始します...")
            
            async with self.collector:
                raw_articles = await self.collector.collect_all()
            
            self.metrics.articles_collected = len(raw_articles)
            self.logger.info(f"RSS収集完了: {len(raw_articles)}件の記事を収集")
            
            if not raw_articles:
                self.logger.warning("収集された記事がありません")
                return []
            
            return raw_articles
            
        except Exception as e:
            error_msg = f"RSS収集エラー: {str(e)}"
            self.logger.error(error_msg)
            self.metrics.errors.append(error_msg)
            
            # RSS収集が完全に失敗した場合でも、前日のデータで継続を試みる
            self.logger.info("前日のデータで処理継続を試みます...")
            return await self._load_fallback_data()
    
    async def _load_fallback_data(self) -> Optional[List[RawNewsItem]]:
        """
        フォールバック用の前日データを読み込み
        
        Returns:
            前日のデータ、存在しない場合はNone
        """
        try:
            from datetime import timedelta
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            
            existing_articles = self.data_manager.load_existing_data(yesterday)
            if existing_articles:
                # NewsItemをRawNewsItemに変換（簡易版）
                from shared.types import RSSSource
                fallback_source = RSSSource(
                    url="fallback",
                    category="その他",
                    language="ja",
                    name="Fallback Data"
                )
                
                raw_articles = []
                for article in existing_articles:
                    raw_article = RawNewsItem(
                        title=article.original_title,
                        url=article.url,
                        published_at=article.published_at,
                        source=fallback_source,
                        content=article.summary
                    )
                    raw_articles.append(raw_article)
                
                self.logger.info(f"フォールバックデータを読み込みました: {len(raw_articles)}件")
                return raw_articles
            
            return None
            
        except Exception as e:
            self.logger.error(f"フォールバックデータ読み込みエラー: {e}")
            return None
    
    async def process_articles(self, raw_articles: List[RawNewsItem]) -> List[NewsItem]:
        """
        記事を処理（要約・翻訳）
        
        Args:
            raw_articles: 生記事データ
            
        Returns:
            処理済み記事リスト
        """
        processed_articles = []
        
        try:
            self.logger.info("AI要約処理を開始します...")
            
            # バッチ処理で記事を処理
            batch_size = self.config.claude_batch_size
            for i in range(0, len(raw_articles), batch_size):
                batch = raw_articles[i:i + batch_size]
                
                try:
                    batch_results = await self.summarizer.batch_process(batch)
                    processed_articles.extend(batch_results)
                    
                    # API呼び出し回数を記録
                    self.metrics.api_calls_made += len(batch)
                    
                    self.logger.info(f"バッチ処理完了: {i + len(batch)}/{len(raw_articles)}")
                    
                except Exception as e:
                    error_msg = f"バッチ処理エラー (batch {i//batch_size + 1}): {str(e)}"
                    self.logger.error(error_msg)
                    self.metrics.errors.append(error_msg)
                    
                    # バッチが失敗しても他のバッチは継続処理
                    continue
            
            self.metrics.articles_processed = len(processed_articles)
            self.metrics.articles_failed = len(raw_articles) - len(processed_articles)
            
            self.logger.info(f"AI要約処理完了: {len(processed_articles)}件の記事を処理")
            
            return processed_articles
            
        except Exception as e:
            error_msg = f"記事処理エラー: {str(e)}"
            self.logger.error(error_msg)
            self.metrics.errors.append(error_msg)
            return processed_articles  # 部分的な結果でも返す
    
    async def generate_daily_summary(self, articles: List[NewsItem]) -> Optional[DailySummary]:
        """
        日次サマリーを生成
        
        Args:
            articles: 処理済み記事リスト
            
        Returns:
            日次サマリー、失敗時はNone
        """
        try:
            if not articles:
                self.logger.warning("サマリー生成用の記事がありません")
                return None
            
            self.logger.info("日次トレンド分析を開始します...")
            daily_summary = await self.summarizer.analyze_daily_trends(articles)
            self.logger.info("日次トレンド分析完了")
            
            return daily_summary
            
        except Exception as e:
            error_msg = f"日次サマリー生成エラー: {str(e)}"
            self.logger.error(error_msg)
            self.metrics.errors.append(error_msg)
            return None
    
    async def save_data(self, articles: List[NewsItem], summary: Optional[DailySummary]) -> bool:
        """
        データを保存
        
        Args:
            articles: 処理済み記事リスト
            summary: 日次サマリー
            
        Returns:
            保存成功時True
        """
        try:
            today = datetime.now().strftime("%Y-%m-%d")
            self.logger.info("データ保存を開始します...")
            
            # 記事データを保存
            if articles:
                self.data_manager.save_daily_news(today, articles)
                self.logger.info(f"記事データを保存しました: {len(articles)}件")
            
            # サマリーデータを保存
            if summary:
                self.data_manager.save_daily_summary(summary)
                self.logger.info("サマリーデータを保存しました")
            
            # 設定ファイルを保存
            self.data_manager.save_config_files()
            self.logger.info("設定ファイルを保存しました")
            
            # 古いデータをクリーンアップ
            self.data_manager.cleanup_old_data(self.config.retention_days)
            self.logger.info("古いデータのクリーンアップを実行しました")
            
            self.logger.info("データ保存完了")
            return True
            
        except Exception as e:
            error_msg = f"データ保存エラー: {str(e)}"
            self.logger.error(error_msg)
            self.metrics.errors.append(error_msg)
            return False
    
    def log_processing_results(self, articles: List[NewsItem], summary: Optional[DailySummary]):
        """処理結果をログ出力"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        self.logger.info("=== 処理結果 ===")
        self.logger.info(f"処理日: {today}")
        self.logger.info(f"収集記事数: {self.metrics.articles_collected}")
        self.logger.info(f"処理記事数: {self.metrics.articles_processed}")
        self.logger.info(f"失敗記事数: {self.metrics.articles_failed}")
        self.logger.info(f"API呼び出し回数: {self.metrics.api_calls_made}")
        self.logger.info(f"エラー数: {len(self.metrics.errors)}")
        
        if summary:
            self.logger.info(f"トップトレンド数: {len(summary.top_trends)}")
            self.logger.info(f"カテゴリ数: {len(summary.category_breakdown)}")
        
        # 成功率を計算
        success_rate = (self.metrics.articles_processed / max(self.metrics.articles_collected, 1)) * 100
        self.logger.info(f"処理成功率: {success_rate:.1f}%")
        
        # エラーがある場合は詳細を出力
        if self.metrics.errors:
            self.logger.warning("=== エラー詳細 ===")
            for i, error in enumerate(self.metrics.errors, 1):
                self.logger.warning(f"{i}. {error}")
    
    def save_metrics(self):
        """処理メトリクスを保存"""
        try:
            self.metrics.end_time = datetime.now()
            self.data_manager.save_processing_metrics(self.metrics)
            self.logger.info("処理メトリクスを保存しました")
            
            # メトリクス詳細をログ出力
            metrics_dict = self.metrics.to_dict()
            self.logger.info(f"処理時間: {metrics_dict['duration_seconds']:.1f}秒")
            self.logger.info(f"処理成功率: {metrics_dict['success_rate']:.3f}")
            
        except Exception as e:
            self.logger.error(f"メトリクス保存エラー: {e}")
    
    async def run(self) -> int:
        """
        パイプライン実行
        
        Returns:
            終了コード (0: 成功, 1: 失敗)
        """
        self.logger.info("AI News Aggregator starting...")
        
        try:
            # 1. コンポーネント初期化
            if not await self.initialize_components():
                return 1
            
            # 2. RSS記事収集
            raw_articles = await self.collect_articles()
            if raw_articles is None:
                self.logger.error("記事収集が完全に失敗しました")
                return 1
            
            # 3. 記事処理
            processed_articles = await self.process_articles(raw_articles)
            
            # 4. 日次サマリー生成
            daily_summary = await self.generate_daily_summary(processed_articles)
            
            # 5. データ保存
            save_success = await self.save_data(processed_articles, daily_summary)
            
            # 6. 結果ログ出力
            self.log_processing_results(processed_articles, daily_summary)
            
            # 処理が部分的にでも成功していれば成功とみなす
            if processed_articles or save_success:
                self.logger.info("Processing completed successfully")
                return 0
            else:
                self.logger.error("Processing failed completely")
                return 1
                
        except Exception as e:
            error_msg = f"予期しないエラー: {str(e)}"
            self.logger.error(error_msg)
            self.logger.error(f"スタックトレース: {traceback.format_exc()}")
            self.metrics.errors.append(error_msg)
            return 1
        
        finally:
            # メトリクス保存
            self.save_metrics()


async def main():
    """メイン処理"""
    # 設定読み込み
    try:
        config = AppConfig.from_env()
    except ValueError as e:
        print(f"Configuration error: {e}")
        sys.exit(1)
    
    # パイプライン実行
    pipeline = ProcessingPipeline(config)
    exit_code = await pipeline.run()
    sys.exit(exit_code)


if __name__ == "__main__":
    asyncio.run(main())