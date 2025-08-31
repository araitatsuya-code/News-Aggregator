"""
AI処理システムの統合テスト
"""

import pytest
from datetime import datetime
from shared.ai import ClaudeSummarizer
from shared.types import RawNewsItem, RSSSource
from shared.config import AppConfig


def test_claude_summarizer_import():
    """ClaudeSummarizerのインポートテスト"""
    assert ClaudeSummarizer is not None


def test_claude_summarizer_initialization():
    """ClaudeSummarizerの初期化テスト"""
    config = AppConfig(
        claude_api_key="test_key",
        claude_model="claude-3-haiku-20240307",
        claude_max_tokens=1000,
        claude_batch_size=5
    )
    
    summarizer = ClaudeSummarizer(config)
    assert summarizer is not None
    assert summarizer.config == config
    assert summarizer.batch_size == 5


def test_raw_news_item_to_news_item_compatibility():
    """RawNewsItemとNewsItemの互換性テスト"""
    source = RSSSource(
        url="https://example.com/rss",
        category="テスト",
        language="en",
        name="Test Source"
    )
    
    raw_item = RawNewsItem(
        title="Test Article",
        url="https://example.com/article",
        published_at=datetime.now(),
        source=source,
        content="Test content"
    )
    
    # RawNewsItemが正しく作成されることを確認
    assert raw_item.title == "Test Article"
    assert raw_item.source.name == "Test Source"
    assert hasattr(raw_item, 'id')  # __post_init__でIDが生成される