#!/usr/bin/env python3
"""
完全なパイプラインのデモンストレーション
RSS収集 → AI要約 → データ管理の流れを実演
"""

import sys
import asyncio
from datetime import datetime
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.append(str(Path(__file__).parent.parent))

from shared.collectors.rss_collector import RSSCollector
from shared.ai.claude_summarizer import ClaudeSummarizer
from shared.data.data_manager import DataManager
from shared.config import get_default_rss_sources, AppConfig
from shared.utils.logger import setup_logger


async def main():
    """メインデモ処理"""
    logger = setup_logger("pipeline_demo")
    logger.info("完全パイプラインのデモを開始します")
    
    try:
        # 設定を読み込み（環境変数が設定されていない場合はスキップ）
        try:
            config = AppConfig.from_env()
            logger.info("設定を読み込みました")
        except ValueError as e:
            logger.warning(f"環境変数が設定されていません: {e}")
            logger.info("モックデータを使用してデモを実行します")
            
            # モックデータでデモを実行
            await demo_with_mock_data()
            return
        
        # RSS収集器を初期化
        rss_sources = get_default_rss_sources()[:2]  # 最初の2つのソースのみ使用
        collector = RSSCollector(rss_sources)
        logger.info(f"RSS収集器を初期化しました: {len(rss_sources)}ソース")
        
        # AI要約器を初期化
        summarizer = ClaudeSummarizer(config)
        logger.info("AI要約器を初期化しました")
        
        # データ管理器を初期化
        data_manager = DataManager(config.output_path)
        logger.info("データ管理器を初期化しました")
        
        # RSS収集を実行
        logger.info("RSS収集を開始します...")
        async with collector:
            raw_articles = await collector.collect_all()
        logger.info(f"RSS収集完了: {len(raw_articles)}件の記事を収集")
        
        if not raw_articles:
            logger.warning("収集された記事がありません")
            return
        
        # 最初の3件のみ処理（デモ用）
        raw_articles = raw_articles[:3]
        logger.info(f"デモ用に{len(raw_articles)}件の記事を処理します")
        
        # AI要約処理を実行
        logger.info("AI要約処理を開始します...")
        processed_articles = await summarizer.batch_process(raw_articles)
        logger.info(f"AI要約処理完了: {len(processed_articles)}件の記事を処理")
        
        # 日次サマリーを生成
        logger.info("日次サマリーを生成します...")
        daily_summary = await summarizer.analyze_daily_trends(processed_articles)
        logger.info("日次サマリー生成完了")
        
        # データを保存
        today = datetime.now().strftime("%Y-%m-%d")
        logger.info("データ保存を開始します...")
        
        data_manager.save_daily_news(today, processed_articles)
        data_manager.save_daily_summary(daily_summary)
        data_manager.save_config_files()
        
        logger.info("データ保存完了")
        
        # 結果を表示
        logger.info("=== 処理結果 ===")
        logger.info(f"処理日: {today}")
        logger.info(f"処理記事数: {len(processed_articles)}")
        logger.info(f"トップトレンド: {', '.join(daily_summary.top_trends[:3])}")
        
        for i, article in enumerate(processed_articles, 1):
            logger.info(f"記事{i}: {article.title} ({article.source})")
        
        logger.info("完全パイプラインのデモが正常に完了しました")
        
    except Exception as e:
        logger.error(f"デモ中にエラーが発生しました: {e}")
        raise


async def demo_with_mock_data():
    """モックデータを使用したデモ"""
    logger = setup_logger("mock_demo")
    logger.info("モックデータを使用したデモを実行します")
    
    from shared.types import NewsItem, DailySummary
    
    # モックデータを作成
    mock_articles = [
        NewsItem(
            id="mock-1",
            title="AIの最新動向について",
            original_title="Latest AI Trends",
            summary="人工知能技術の最新動向について詳しく解説します。機械学習とディープラーニングの進歩が注目されています。",
            url="https://example.com/ai-trends",
            source="AI News",
            category="海外",
            published_at=datetime.now(),
            language="ja",
            tags=["AI", "機械学習", "技術"],
            ai_confidence=0.92
        ),
        NewsItem(
            id="mock-2",
            title="自然言語処理の新技術",
            original_title="New NLP Technology",
            summary="自然言語処理分野で革新的な新技術が発表されました。従来の手法を大幅に上回る性能を実現しています。",
            url="https://example.com/nlp-tech",
            source="Tech Review",
            category="国内",
            published_at=datetime.now(),
            language="ja",
            tags=["NLP", "自然言語処理", "革新"],
            ai_confidence=0.88
        )
    ]
    
    mock_summary = DailySummary(
        date=datetime.now().strftime("%Y-%m-%d"),
        total_articles=2,
        top_trends=["AI", "機械学習", "NLP"],
        significant_news=mock_articles,
        category_breakdown={"海外": 1, "国内": 1},
        summary_ja="本日はAI技術の最新動向と自然言語処理の新技術が注目されました。",
        summary_en="Today's highlights include latest AI trends and new NLP technology.",
        generated_at=datetime.now()
    )
    
    # データ管理器でデータを保存
    data_manager = DataManager()
    today = datetime.now().strftime("%Y-%m-%d")
    
    data_manager.save_daily_news(today, mock_articles)
    data_manager.save_daily_summary(mock_summary)
    data_manager.save_config_files()
    
    logger.info("=== モックデータ処理結果 ===")
    logger.info(f"処理日: {today}")
    logger.info(f"記事数: {len(mock_articles)}")
    logger.info(f"トップトレンド: {', '.join(mock_summary.top_trends)}")
    
    for i, article in enumerate(mock_articles, 1):
        logger.info(f"記事{i}: {article.title}")
    
    logger.info("モックデータデモが完了しました")


if __name__ == "__main__":
    asyncio.run(main())