"""
設定管理モジュール
環境変数とデフォルト設定を管理
"""

import os
from typing import Optional, List
from dataclasses import dataclass
from pathlib import Path
from .types import RSSSource

# .envファイルを読み込み
try:
    from dotenv import load_dotenv
    # プロジェクトルートの.envファイルを読み込み
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    # python-dotenvがインストールされていない場合はスキップ
    pass


@dataclass
class AppConfig:
    """アプリケーション設定"""
    # API設定
    claude_api_key: str
    claude_model: str = "claude-3-haiku-20240307"
    claude_max_tokens: int = 1000
    claude_batch_size: int = 5
    
    # データ設定
    output_path: str = "frontend/public/data"
    retention_days: int = 30
    
    # ログ設定
    log_level: str = "INFO"
    log_dir: str = "logs"
    
    # 処理設定
    max_retries: int = 3
    retry_delay: float = 1.0
    
    @classmethod
    def from_env(cls) -> 'AppConfig':
        """環境変数から設定を読み込み"""
        claude_api_key = os.getenv('CLAUDE_API_KEY')
        if not claude_api_key:
            raise ValueError("CLAUDE_API_KEY environment variable is required")
        
        return cls(
            claude_api_key=claude_api_key,
            claude_model=os.getenv('CLAUDE_MODEL', cls.claude_model),
            claude_max_tokens=int(os.getenv('CLAUDE_MAX_TOKENS', cls.claude_max_tokens)),
            claude_batch_size=int(os.getenv('CLAUDE_BATCH_SIZE', cls.claude_batch_size)),
            output_path=os.getenv('OUTPUT_PATH', cls.output_path),
            retention_days=int(os.getenv('RETENTION_DAYS', cls.retention_days)),
            log_level=os.getenv('LOG_LEVEL', cls.log_level),
            log_dir=os.getenv('LOG_DIR', cls.log_dir),
            max_retries=int(os.getenv('MAX_RETRIES', cls.max_retries)),
            retry_delay=float(os.getenv('RETRY_DELAY', cls.retry_delay))
        )


def get_default_rss_sources() -> List[RSSSource]:
    """デフォルトRSSソース設定"""
    return [
        RSSSource(
            url="https://feeds.feedburner.com/oreilly/radar",
            category="海外",
            language="en",
            name="O'Reilly Radar"
        ),
        RSSSource(
            url="https://www.reddit.com/r/MachineLearning/.rss",
            category="Reddit",
            language="en",
            name="Reddit ML"
        ),
        RSSSource(
            url="https://www.reddit.com/r/artificial/.rss",
            category="Reddit",
            language="en",
            name="Reddit AI"
        ),
        RSSSource(
            url="https://techcrunch.com/category/artificial-intelligence/feed/",
            category="海外",
            language="en",
            name="TechCrunch AI"
        )
    ]


def get_categories() -> List[str]:
    """利用可能なカテゴリ一覧"""
    return ["国内", "海外", "Reddit", "その他"]