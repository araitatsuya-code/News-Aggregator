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
    # Claude API設定
    claude_api_key: Optional[str] = None
    claude_model: str = "claude-3-haiku-20240307"
    claude_max_tokens: int = 1000
    claude_batch_size: int = 1
    
    # OpenAI API設定
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o"
    openai_max_tokens: int = 500
    openai_batch_size: int = 10
    
    # Gemini API設定
    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-1.5-pro"
    gemini_max_tokens: int = 500
    gemini_batch_size: int = 5
    
    # ローカルモデル設定
    use_local_model: bool = False
    local_model_url: str = "http://localhost:11434"
    local_model_name: str = "llama3.1"
    
    # AI プロバイダー優先順位
    preferred_providers: List[str] = None
    
    # データ設定
    output_path: str = "frontend/public/data"
    retention_days: int = 30
    
    # ログ設定
    log_level: str = "INFO"
    log_dir: str = "logs"
    
    # RSS収集設定
    reddit_article_limit: int = 20
    
    # 処理設定
    max_retries: int = 3
    retry_delay: float = 1.0
    
    @classmethod
    def from_env(cls) -> 'AppConfig':
        """環境変数から設定を読み込み"""
        # 少なくとも1つのAPIキーが必要
        claude_api_key = os.getenv('CLAUDE_API_KEY')
        openai_api_key = os.getenv('OPENAI_API_KEY')
        gemini_api_key = os.getenv('GEMINI_API_KEY')
        use_local_model = os.getenv('USE_LOCAL_MODEL', 'false').lower() == 'true'
        
        if not any([claude_api_key, openai_api_key, gemini_api_key, use_local_model]):
            raise ValueError("少なくとも1つのAI APIキーまたはローカルモデルの設定が必要です")
        
        # 優先順位設定
        preferred_providers = os.getenv('PREFERRED_PROVIDERS', 'openai,claude,gemini,local').split(',')
        preferred_providers = [p.strip() for p in preferred_providers if p.strip()]
        
        return cls(
            # Claude設定
            claude_api_key=claude_api_key,
            claude_model=os.getenv('CLAUDE_MODEL', cls.claude_model),
            claude_max_tokens=int(os.getenv('CLAUDE_MAX_TOKENS', cls.claude_max_tokens)),
            claude_batch_size=int(os.getenv('CLAUDE_BATCH_SIZE', cls.claude_batch_size)),
            
            # OpenAI設定
            openai_api_key=openai_api_key,
            openai_model=os.getenv('OPENAI_MODEL', cls.openai_model),
            openai_max_tokens=int(os.getenv('OPENAI_MAX_TOKENS', cls.openai_max_tokens)),
            openai_batch_size=int(os.getenv('OPENAI_BATCH_SIZE', cls.openai_batch_size)),
            
            # Gemini設定
            gemini_api_key=gemini_api_key,
            gemini_model=os.getenv('GEMINI_MODEL', cls.gemini_model),
            gemini_max_tokens=int(os.getenv('GEMINI_MAX_TOKENS', cls.gemini_max_tokens)),
            gemini_batch_size=int(os.getenv('GEMINI_BATCH_SIZE', cls.gemini_batch_size)),
            
            # ローカルモデル設定
            use_local_model=use_local_model,
            local_model_url=os.getenv('LOCAL_MODEL_URL', cls.local_model_url),
            local_model_name=os.getenv('LOCAL_MODEL_NAME', cls.local_model_name),
            
            # プロバイダー優先順位
            preferred_providers=preferred_providers,
            
            # その他設定
            output_path=os.getenv('OUTPUT_PATH', cls.output_path),
            retention_days=int(os.getenv('RETENTION_DAYS', cls.retention_days)),
            log_level=os.getenv('LOG_LEVEL', cls.log_level),
            log_dir=os.getenv('LOG_DIR', cls.log_dir),
            reddit_article_limit=int(os.getenv('REDDIT_ARTICLE_LIMIT', cls.reddit_article_limit)),
            max_retries=int(os.getenv('MAX_RETRIES', cls.max_retries)),
            retry_delay=float(os.getenv('RETRY_DELAY', cls.retry_delay))
        )


def get_default_rss_sources() -> List[RSSSource]:
    """デフォルトRSSソース設定"""
    return [
        # Claude/Anthropic専用
        RSSSource(
            url="https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_news.xml",
            category="Claude",
            language="en",
            name="Anthropic News"
        ),
        RSSSource(
            url="https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_research.xml",
            category="Claude",
            language="en",
            name="Anthropic Research"
        ),
        RSSSource(
            url="https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_engineering.xml",
            category="Claude",
            language="en",
            name="Anthropic Engineering"
        ),
        RSSSource(
            url="https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_changelog_claude_code.xml",
            category="Claude",
            language="en",
            name="Claude Code Changelog"
        ),
        RSSSource(
            url="https://status.anthropic.com/history.rss",
            category="Claude",
            language="en",
            name="Anthropic Status"
        ),
        
        # Reddit
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
            url="https://www.reddit.com/r/OpenAI/.rss",
            category="Reddit",
            language="en",
            name="r/OpenAI"
        ),
        RSSSource(
            url="https://www.reddit.com/r/ClaudeAI/.rss",
            category="Reddit",
            language="en",
            name="r/ClaudeAI"
        ),
        RSSSource(
            url="https://www.reddit.com/r/LocalLLaMA/.rss",
            category="Reddit",
            language="en",
            name="r/LocalLLaMA"
        ),
        
        # 海外AIニュース
        RSSSource(
            url="https://techcrunch.com/category/artificial-intelligence/feed/",
            category="海外",
            language="en",
            name="TechCrunch AI"
        ),
        RSSSource(
            url="https://www.technologyreview.com/feed/",
            category="海外",
            language="en",
            name="MIT Technology Review"
        ),
        RSSSource(
            url="https://www.theverge.com/rss/index.xml",
            category="海外",
            language="en",
            name="The Verge"
        ),
        RSSSource(
            url="https://feeds.feedburner.com/venturebeat/SZYF",
            category="海外",
            language="en",
            name="VentureBeat"
        ),
        RSSSource(
            url="https://arstechnica.com/ai/feed/",
            category="海外",
            language="en",
            name="Ars Technica AI"
        ),
        RSSSource(
            url="https://www.wired.com/feed/tag/ai/latest/rss",
            category="海外",
            language="en",
            name="WIRED AI"
        ),
        RSSSource(
            url="https://openai.com/news/rss.xml",
            category="海外",
            language="en",
            name="OpenAI"
        ),
        RSSSource(
            url="https://blogs.microsoft.com/ai/feed/",
            category="海外",
            language="en",
            name="Microsoft AI Blog"
        ),
        RSSSource(
            url="https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_ollama.xml",
            category="海外",
            language="en",
            name="Ollama Blog"
        ),
        RSSSource(
            url="https://rsshub.app/huggingface/daily-papers",
            category="海外",
            language="en",
            name="Hugging Face Daily Papers"
        ),
        RSSSource(
            url="https://huggingface.co/blog/feed.xml",
            category="海外",
            language="en",
            name="Hugging Face Blog"
        ),
        RSSSource(
            url="https://deepmind.com/blog/feed/basic/",
            category="海外",
            language="en",
            name="DeepMind"
        ),
        RSSSource(
            url="https://feeds.feedburner.com/blogspot/gJZg",
            category="海外",
            language="en",
            name="Google Research Blog"
        ),
        RSSSource(
            url="https://towardsdatascience.com/feed",
            category="海外",
            language="en",
            name="Towards Data Science"
        ),
        RSSSource(
            url="https://artificialintelligence-news.com/feed/",
            category="海外",
            language="en",
            name="AI News"
        ),
        RSSSource(
            url="https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml",
            category="海外",
            language="en",
            name="The Rundown AI"
        ),
        RSSSource(
            url="https://aibusiness.com/rss.xml",
            category="海外",
            language="en",
            name="AI Business"
        ),
        RSSSource(
            url="https://simonwillison.net/atom/everything/",
            category="海外",
            language="en",
            name="Simon Willison's Weblog"
        ),
        RSSSource(
            url="https://www.oneusefulthing.org/feed",
            category="海外",
            language="en",
            name="One Useful Thing"
        ),
        
        # 国内AIニュース・技術ブログ
        RSSSource(
            url="https://www.ai-shift.co.jp/techblog/feed",
            category="国内",
            language="ja",
            name="AI Shift Tech Blog"
        ),
        RSSSource(
            url="https://medium.com/feed/@kyakuno",
            category="国内",
            language="ja",
            name="AX Tech Blog"
        ),
        RSSSource(
            url="https://zenn.dev/topics/ai/feed",
            category="国内",
            language="ja",
            name="Zenn AI"
        ),
        RSSSource(
            url="https://zenn.dev/topics/llm/feed",
            category="国内",
            language="ja",
            name="Zenn LLM"
        ),
        RSSSource(
            url="https://zenn.dev/topics/nlp/feed",
            category="国内",
            language="ja",
            name="Zenn NLP"
        ),
        RSSSource(
            url="https://zenn.dev/topics/%E6%A9%9F%E6%A2%B0%E5%AD%A6%E7%BF%92/feed",
            category="国内",
            language="ja",
            name="Zenn 機械学習"
        ),
        RSSSource(
            url="https://note.com/chatgpt_lab/rss",
            category="国内",
            language="ja",
            name="ChatGPT ラボ"
        ),
    ]


def get_categories() -> List[str]:
    """利用可能なカテゴリ一覧"""
    return ["Claude", "国内", "海外", "Reddit", "その他"]


# グローバル設定インスタンス
_config: Optional[AppConfig] = None


def get_config() -> AppConfig:
    """設定インスタンスを取得"""
    global _config
    if _config is None:
        _config = AppConfig.from_env()
    return _config