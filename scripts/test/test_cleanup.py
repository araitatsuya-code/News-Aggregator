#!/usr/bin/env python3
"""
DataManagerのクリーンアップ機能テストスクリプト
"""

import sys
from datetime import datetime, timedelta
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.append(str(Path(__file__).parent.parent))

from shared.data.data_manager import DataManager
from shared.types import NewsItem, DailySummary
from shared.utils.logger import setup_logger


def main():
    """クリーンアップテスト"""
    logger = setup_logger("cleanup_test")
    logger.info("クリーンアップ機能のテストを開始します")
    
    try:
        data_manager = DataManager()
        
        # 古いデータを作成（35日前）
        old_date = (datetime.now() - timedelta(days=35)).strftime("%Y-%m-%d")
        old_article = NewsItem(
            id="old-1",
            title="古いニュース",
            original_title="Old News",
            summary="これは古いニュースです",
            url="https://example.com/old",
            source="OldSource",
            category="テスト",
            published_at=datetime.now() - timedelta(days=35),
            language="ja",
            tags=["old"],
            ai_confidence=0.8
        )
        
        old_summary = DailySummary(
            date=old_date,
            total_articles=1,
            top_trends=["old"],
            significant_news=[old_article],
            category_breakdown={"テスト": 1},
            summary_ja="古いサマリー",
            summary_en="Old summary",
            generated_at=datetime.now() - timedelta(days=35)
        )
        
        # 古いデータを保存
        data_manager.save_daily_news(old_date, [old_article])
        data_manager.save_daily_summary(old_summary)
        logger.info(f"古いデータを作成しました: {old_date}")
        
        # 現在のファイル数を確認
        output_path = Path("frontend/public/data")
        news_dirs_before = list((output_path / "news").glob("????-??-??"))
        summary_files_before = list((output_path / "summaries").glob("????-??-??.json"))
        
        logger.info(f"クリーンアップ前: ニュースディレクトリ {len(news_dirs_before)}個, サマリーファイル {len(summary_files_before)}個")
        
        # クリーンアップ実行（30日保持）
        data_manager.cleanup_old_data(retention_days=30)
        logger.info("クリーンアップを実行しました")
        
        # クリーンアップ後のファイル数を確認
        news_dirs_after = list((output_path / "news").glob("????-??-??"))
        summary_files_after = list((output_path / "summaries").glob("????-??-??.json"))
        
        logger.info(f"クリーンアップ後: ニュースディレクトリ {len(news_dirs_after)}個, サマリーファイル {len(summary_files_after)}個")
        
        # 古いデータが削除されたことを確認
        old_news_dir = output_path / "news" / old_date
        old_summary_file = output_path / "summaries" / f"{old_date}.json"
        
        if not old_news_dir.exists():
            logger.info(f"✓ 古いニュースディレクトリが削除されました: {old_date}")
        else:
            logger.warning(f"✗ 古いニュースディレクトリが残っています: {old_date}")
        
        if not old_summary_file.exists():
            logger.info(f"✓ 古いサマリーファイルが削除されました: {old_date}.json")
        else:
            logger.warning(f"✗ 古いサマリーファイルが残っています: {old_date}.json")
        
        # latest.jsonは残っていることを確認
        latest_summary = output_path / "summaries" / "latest.json"
        if latest_summary.exists():
            logger.info("✓ latest.jsonは保持されています")
        else:
            logger.warning("✗ latest.jsonが削除されました")
        
        logger.info("クリーンアップ機能のテストが完了しました")
        
    except Exception as e:
        logger.error(f"テスト中にエラーが発生しました: {e}")
        raise


if __name__ == "__main__":
    main()