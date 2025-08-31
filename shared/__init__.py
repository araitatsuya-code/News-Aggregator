# Shared module for common data types and utilities

from .data import DataManager
from .types import NewsItem, DailySummary, RSSSource, RawNewsItem, ProcessingMetrics
from .config import AppConfig, get_default_rss_sources, get_categories

__all__ = [
    'DataManager',
    'NewsItem', 
    'DailySummary',
    'RSSSource',
    'RawNewsItem', 
    'ProcessingMetrics',
    'AppConfig',
    'get_default_rss_sources',
    'get_categories'
]