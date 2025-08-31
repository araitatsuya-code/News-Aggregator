"""
メイン処理スクリプト
AI News Aggregator のデータ処理パイプラインを実行
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from shared.config import AppConfig
from shared.utils.logger import setup_logger
from shared.types import ProcessingMetrics


async def main():
    """メイン処理"""
    # 設定読み込み
    try:
        config = AppConfig.from_env()
    except ValueError as e:
        print(f"Configuration error: {e}")
        sys.exit(1)
    
    # ログ設定
    logger = setup_logger("main", config.log_level, config.log_dir)
    logger.info("AI News Aggregator starting...")
    
    # 処理メトリクス初期化
    start_time = datetime.now()
    metrics = ProcessingMetrics(
        start_time=start_time,
        end_time=start_time,  # 後で更新
        articles_collected=0,
        articles_processed=0,
        articles_failed=0,
        api_calls_made=0,
        errors=[]
    )
    
    try:
        # 必要なコンポーネントを初期化
        from shared.collectors.rss_collector import RSSCollector
        from shared.ai.claude_summarizer import ClaudeSummarizer
        from shared.data.data_manager import DataManager
        from shared.config import get_default_rss_sources
        
        # RSS収集器を初期化
        rss_sources = get_default_rss_sources()
        collector = RSSCollector(rss_sources)
        logger.info(f"RSS収集器を初期化しました: {len(rss_sources)}ソース")
        
        # AI要約器を初期化
        summarizer = ClaudeSummarizer(config)
        logger.info("AI要約器を初期化しました")
        
        # データ管理器を初期化
        data_manager = DataManager(config.output_path)
        logger.info("データ管理器を初期化しました")
        
        # 1. RSS収集
        logger.info("RSS収集を開始します...")
        async with collector:
            raw_articles = await collector.collect_all()
        logger.info(f"RSS収集完了: {len(raw_articles)}件の記事を収集")
        metrics.articles_collected = len(raw_articles)
        
        if not raw_articles:
            logger.warning("収集された記事がありません")
            return
        
        # 2. AI要約・翻訳
        logger.info("AI要約処理を開始します...")
        processed_articles = await summarizer.batch_process(raw_articles)
        logger.info(f"AI要約処理完了: {len(processed_articles)}件の記事を処理")
        metrics.articles_processed = len(processed_articles)
        metrics.articles_failed = len(raw_articles) - len(processed_articles)
        
        # 3. トレンド分析と日次サマリー生成
        logger.info("日次トレンド分析を開始します...")
        daily_summary = await summarizer.analyze_daily_trends(processed_articles)
        logger.info("日次トレンド分析完了")
        
        # 4. データ保存
        today = datetime.now().strftime("%Y-%m-%d")
        logger.info("データ保存を開始します...")
        
        data_manager.save_daily_news(today, processed_articles)
        data_manager.save_daily_summary(daily_summary)
        data_manager.save_config_files()
        
        logger.info("データ保存完了")
        
        # 処理結果を表示
        logger.info("=== 処理結果 ===")
        logger.info(f"処理日: {today}")
        logger.info(f"収集記事数: {metrics.articles_collected}")
        logger.info(f"処理記事数: {metrics.articles_processed}")
        logger.info(f"失敗記事数: {metrics.articles_failed}")
        logger.info(f"トップトレンド数: {len(daily_summary.top_trends)}")
        logger.info(f"カテゴリ数: {len(daily_summary.category_breakdown)}")
        
        logger.info("Processing completed successfully")
        
    except Exception as e:
        logger.error(f"Processing failed: {e}")
        metrics.errors.append(str(e))
        sys.exit(1)
    
    finally:
        # メトリクス更新
        metrics.end_time = datetime.now()
        logger.info(f"Processing metrics: {metrics.to_dict()}")
        
        # メトリクスを保存
        try:
            from shared.data.data_manager import DataManager
            data_manager = DataManager(config.output_path if 'config' in locals() else "frontend/public/data")
            data_manager.save_processing_metrics(metrics)
            logger.info("処理メトリクスを保存しました")
        except Exception as e:
            logger.error(f"メトリクス保存エラー: {e}")


if __name__ == "__main__":
    asyncio.run(main())