"""
RSS収集システムのテスト実行スクリプト
"""

import asyncio
import logging
import sys
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.append(str(Path(__file__).parent.parent))

from shared.utils.logger import setup_logger
from shared.utils.rss_utils import collect_latest_news, get_articles_summary_stats
from shared.config import get_default_rss_sources


async def main():
    """メイン処理"""
    # ログ設定
    logger = setup_logger("rss_test", "INFO")
    logger.info("RSS収集システムのテスト開始")
    
    try:
        # デフォルトソースを取得
        sources = get_default_rss_sources()
        logger.info(f"使用するRSSソース: {[source.name for source in sources]}")
        
        # 記事収集実行
        articles = await collect_latest_news(
            sources=sources,
            max_age_hours=48,  # 48時間以内の記事
            timeout=30,
            max_retries=2
        )
        
        if not articles:
            logger.warning("記事が収集されませんでした")
            return
        
        # 統計情報を表示
        stats = get_articles_summary_stats(articles)
        logger.info("=== 収集結果統計 ===")
        logger.info(f"総記事数: {stats['total_count']}")
        logger.info(f"カテゴリ別: {stats['by_category']}")
        logger.info(f"言語別: {stats['by_language']}")
        logger.info(f"ソース別: {stats['by_source']}")
        
        if stats['date_range']:
            logger.info(f"日付範囲: {stats['date_range']['earliest']} ～ {stats['date_range']['latest']}")
        
        # 最新記事を数件表示
        logger.info("=== 最新記事サンプル ===")
        for i, article in enumerate(articles[:5]):
            logger.info(f"{i+1}. [{article.source.name}] {article.title}")
            logger.info(f"   URL: {article.url}")
            logger.info(f"   公開日時: {article.published_at}")
            logger.info(f"   カテゴリ: {article.source.category}")
            logger.info("")
        
        logger.info("RSS収集システムのテスト完了")
        
    except Exception as e:
        logger.error(f"テスト実行中にエラーが発生しました: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())