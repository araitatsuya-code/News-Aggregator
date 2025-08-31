"""
共通データ型定義
AI News Aggregator システムで使用される全てのデータ型を定義
"""

from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional, Dict, Literal
import uuid


@dataclass
class RSSSource:
    """RSSソース情報"""
    url: str
    category: str
    language: Literal['ja', 'en']
    name: str
    enabled: bool = True


@dataclass
class RawNewsItem:
    """RSS収集時の生データ"""
    title: str
    url: str
    published_at: datetime
    source: RSSSource
    content: Optional[str] = None
    
    def __post_init__(self):
        """ID生成"""
        if not hasattr(self, 'id'):
            self.id = str(uuid.uuid4())


@dataclass
class NewsItem:
    """処理済みニュース項目"""
    id: str
    title: str
    original_title: str
    summary: str
    url: str
    source: str
    category: str
    published_at: datetime
    language: Literal['ja', 'en']
    tags: List[str]
    ai_confidence: float
    
    def __post_init__(self):
        """バリデーション"""
        if not (0.0 <= self.ai_confidence <= 1.0):
            raise ValueError("ai_confidence must be between 0.0 and 1.0")


@dataclass
class DailySummary:
    """日次サマリー情報"""
    date: str
    total_articles: int
    top_trends: List[str]
    significant_news: List[NewsItem]
    category_breakdown: Dict[str, int]
    summary_ja: str
    summary_en: str
    generated_at: datetime
    
    def __post_init__(self):
        """バリデーション"""
        if self.total_articles < 0:
            raise ValueError("total_articles must be non-negative")


@dataclass
class ProcessingMetrics:
    """処理メトリクス"""
    start_time: datetime
    end_time: datetime
    articles_collected: int
    articles_processed: int
    articles_failed: int
    api_calls_made: int
    errors: List[str]
    
    def to_dict(self) -> Dict[str, any]:
        """辞書形式に変換"""
        return {
            'duration_seconds': (self.end_time - self.start_time).total_seconds(),
            'success_rate': self.articles_processed / max(self.articles_collected, 1),
            'articles_collected': self.articles_collected,
            'articles_processed': self.articles_processed,
            'articles_failed': self.articles_failed,
            'api_calls_made': self.api_calls_made,
            'error_count': len(self.errors)
        }