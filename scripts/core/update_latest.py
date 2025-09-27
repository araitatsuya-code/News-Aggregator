#!/usr/bin/env python3
"""
latest.jsonファイル更新スクリプト
最新のニュースデータをlatest.jsonに反映する
"""

import sys
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from shared.config import AppConfig
from shared.data.data_manager import DataManager
from shared.utils.logger import setup_advanced_logger


def find_latest_date_folder(news_dir: Path) -> Path:
    """最新の日付フォルダを見つける"""
    date_folders = [
        d for d in news_dir.iterdir() 
        if d.is_dir() and d.name.match(r'\d{4}-\d{2}-\d{2}')
    ]
    
    if not date_folders:
        raise FileNotFoundError("No date folders found in news directory")
    
    # 日付順でソートして最新を取得
    latest_folder = sorted(date_folders, key=lambda x: x.name, reverse=True)[0]
    return latest_folder


def load_news_from_date_folder(date_folder: Path) -> List[Dict[Any, Any]]:
    """日付フォルダから記事データを読み込み"""
    articles_file = date_folder / "articles.json"
    
    if not articles_file.exists():
        raise FileNotFoundError(f"articles.json not found in {date_folder}")
    
    with open(articles_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def update_latest_news(data_dir: Path = None, limit: int = 20) -> None:
    """
    latest.jsonを最新データで更新
    
    Args:
        data_dir: データディレクトリ（デフォルト: frontend/public/data）
        limit: 取得する記事数（デフォルト: 20）
    """
    try:
        # データディレクトリ設定
        if data_dir is None:
            data_dir = project_root / "frontend" / "public" / "data"
        
        news_dir = data_dir / "news"
        latest_file = news_dir / "latest.json"
        
        logger = logging.getLogger(__name__)
        logger.info(f"Updating latest.json from {news_dir}")
        
        # 最新の日付フォルダを見つける
        latest_date_folder = find_latest_date_folder(news_dir)
        logger.info(f"Using data from: {latest_date_folder.name}")
        
        # 記事データを読み込み
        articles = load_news_from_date_folder(latest_date_folder)
        logger.info(f"Loaded {len(articles)} articles")
        
        # 公開日時でソート（最新順）
        def get_published_time(article):
            try:
                return datetime.fromisoformat(article['published_at'].replace('Z', '+00:00'))
            except Exception:
                return datetime.min
        
        sorted_articles = sorted(articles, key=get_published_time, reverse=True)
        
        # 指定件数まで制限
        latest_articles = sorted_articles[:limit]
        logger.info(f"Selected top {len(latest_articles)} articles for latest.json")
        
        # latest.jsonに保存
        with open(latest_file, 'w', encoding='utf-8') as f:
            json.dump(latest_articles, f, ensure_ascii=False, indent=2)
        
        logger.info(f"✅ latest.json updated successfully with {len(latest_articles)} articles")
        print(f"✅ latest.json updated: {len(latest_articles)} articles from {latest_date_folder.name}")
        
    except Exception as e:
        logger.error(f"Failed to update latest.json: {e}")
        print(f"❌ Failed to update latest.json: {e}")
        raise


def update_latest_summary(data_dir: Path = None) -> None:
    """
    latest summary.jsonを最新データで更新
    
    Args:
        data_dir: データディレクトリ（デフォルト: frontend/public/data）
    """
    try:
        # データディレクトリ設定
        if data_dir is None:
            data_dir = project_root / "frontend" / "public" / "data"
        
        summaries_dir = data_dir / "summaries"
        latest_summary_file = summaries_dir / "latest.json"
        
        logger = logging.getLogger(__name__)
        logger.info(f"Updating latest summary from {summaries_dir}")
        
        # 最新の日付フォルダを見つける
        latest_date_folder = find_latest_date_folder(summaries_dir)
        logger.info(f"Using summary from: {latest_date_folder.name}")
        
        # サマリーファイル読み込み
        summary_file = latest_date_folder / "summary.json"
        if not summary_file.exists():
            raise FileNotFoundError(f"summary.json not found in {latest_date_folder}")
        
        with open(summary_file, 'r', encoding='utf-8') as f:
            summary_data = json.load(f)
        
        # latest.jsonに保存
        with open(latest_summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary_data, f, ensure_ascii=False, indent=2)
        
        logger.info("✅ Latest summary updated successfully")
        print(f"✅ Latest summary updated from {latest_date_folder.name}")
        
    except Exception as e:
        logger.error(f"Failed to update latest summary: {e}")
        print(f"❌ Failed to update latest summary: {e}")
        raise


def main():
    """メイン処理"""
    # ロガー設定
    logger = setup_advanced_logger("update_latest", level=logging.INFO)
    
    import argparse
    parser = argparse.ArgumentParser(description="Update latest.json files")
    parser.add_argument("--limit", type=int, default=20, help="Number of articles for latest news (default: 20)")
    parser.add_argument("--news-only", action="store_true", help="Update news only")
    parser.add_argument("--summary-only", action="store_true", help="Update summary only")
    parser.add_argument("--data-dir", type=Path, help="Data directory path")
    
    args = parser.parse_args()
    
    try:
        if args.summary_only:
            update_latest_summary(args.data_dir)
        elif args.news_only:
            update_latest_news(args.data_dir, args.limit)
        else:
            # 両方更新
            update_latest_news(args.data_dir, args.limit)
            update_latest_summary(args.data_dir)
        
        print("✅ All updates completed successfully!")
        
    except Exception as e:
        logger.error(f"Update failed: {e}")
        print(f"❌ Update failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()