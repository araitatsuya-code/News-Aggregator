"""
RSS収集関連のユーティリティ関数
"""

import logging
from typing import List, Optional
from datetime import datetime, timedelta

from ..types import RawNewsItem, RSSSource
from ..collectors import RSSCollector
from ..config import get_default_rss_sources


async def collect_latest_news(
    sources: Optional[List[RSSSource]] = None,
    max_age_hours: int = 24,
    timeout: int = 30,
    max_retries: int = 3
) -> List[RawNewsItem]:
    """
    最新ニュースを収集
    
    Args:
        sources: RSSソースのリスト（Noneの場合はデフォルトを使用）
        max_age_hours: 収集する記事の最大経過時間（時間）
        timeout: HTTP タイムアウト（秒）
        max_retries: 最大リトライ回数
        
    Returns:
        収集された記事のリスト
    """
    logger = logging.getLogger(__name__)
    
    if sources is None:
        sources = get_default_rss_sources()
        logger.info("デフォルトのRSSソースを使用します")
    
    logger.info(f"{len(sources)}個のRSSソースから記事を収集開始")
    
    # RSS収集実行
    async with RSSCollector(sources, timeout=timeout, max_retries=max_retries) as collector:
        all_articles = await collector.collect_all()
    
    # 指定時間以内の記事のみフィルタリング
    cutoff_time = datetime.now().astimezone() - timedelta(hours=max_age_hours)
    recent_articles = [
        article for article in all_articles
        if article.published_at.astimezone() > cutoff_time
    ]
    
    logger.info(f"収集完了: 全{len(all_articles)}件中、{len(recent_articles)}件が{max_age_hours}時間以内の記事")
    
    # 公開日時でソート（新しい順）
    recent_articles.sort(key=lambda x: x.published_at, reverse=True)
    
    return recent_articles


def filter_articles_by_category(
    articles: List[RawNewsItem], 
    category: str
) -> List[RawNewsItem]:
    """
    カテゴリで記事をフィルタリング
    
    Args:
        articles: 記事のリスト
        category: フィルタリングするカテゴリ
        
    Returns:
        フィルタリングされた記事のリスト
    """
    return [article for article in articles if article.source.category == category]


def filter_articles_by_language(
    articles: List[RawNewsItem], 
    language: str
) -> List[RawNewsItem]:
    """
    言語で記事をフィルタリング
    
    Args:
        articles: 記事のリスト
        language: フィルタリングする言語（'ja' または 'en'）
        
    Returns:
        フィルタリングされた記事のリスト
    """
    return [article for article in articles if article.source.language == language]


def get_articles_summary_stats(articles: List[RawNewsItem]) -> dict:
    """
    記事の統計情報を取得
    
    Args:
        articles: 記事のリスト
        
    Returns:
        統計情報の辞書
    """
    if not articles:
        return {
            'total_count': 0,
            'by_category': {},
            'by_language': {},
            'by_source': {},
            'date_range': None
        }
    
    # カテゴリ別集計
    by_category = {}
    for article in articles:
        category = article.source.category
        by_category[category] = by_category.get(category, 0) + 1
    
    # 言語別集計
    by_language = {}
    for article in articles:
        language = article.source.language
        by_language[language] = by_language.get(language, 0) + 1
    
    # ソース別集計
    by_source = {}
    for article in articles:
        source_name = article.source.name
        by_source[source_name] = by_source.get(source_name, 0) + 1
    
    # 日付範囲
    dates = [article.published_at for article in articles]
    date_range = {
        'earliest': min(dates),
        'latest': max(dates)
    } if dates else None
    
    return {
        'total_count': len(articles),
        'by_category': by_category,
        'by_language': by_language,
        'by_source': by_source,
        'date_range': date_range
    }