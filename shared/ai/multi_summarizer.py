"""
マルチプロバイダー対応AI要約システム
複数のAIサービスを使い分けてレート制限とコストを最適化
"""

import asyncio
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from enum import Enum
import random

from ..types import RawNewsItem, NewsItem, DailySummary
from ..exceptions import AIProcessingError
from ..config import AppConfig
from ..cache import ArticleCache


class AIProvider(Enum):
    """AIプロバイダー種別"""
    CLAUDE = "claude"
    OPENAI = "openai"
    GEMINI = "gemini"
    LOCAL = "local"


class ProviderStatus:
    """プロバイダーの状態管理"""
    
    def __init__(self, provider: AIProvider):
        self.provider = provider
        self.available = True
        self.last_error = None
        self.error_count = 0
        self.last_used = None
        self.rate_limit_reset = None
    
    def mark_error(self, error: str):
        """エラーを記録"""
        self.error_count += 1
        self.last_error = error
        
        # 連続エラーが多い場合は一時的に無効化
        if self.error_count >= 3:
            self.available = False
    
    def mark_success(self):
        """成功を記録"""
        self.error_count = 0
        self.last_error = None
        self.available = True
        self.last_used = datetime.now()
    
    def is_rate_limited(self) -> bool:
        """レート制限中かチェック"""
        if self.rate_limit_reset and datetime.now() < self.rate_limit_reset:
            return True
        return False


class MultiAISummarizer:
    """マルチプロバイダー対応AI要約システム"""
    
    def __init__(self, config: AppConfig):
        """
        初期化
        
        Args:
            config: アプリケーション設定
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # プロバイダー初期化
        self.providers = {}
        self.provider_status = {}
        
        # キャッシュシステム
        self.cache = ArticleCache(cache_dir="cache/articles", retention_days=7)
        
        # 設定に基づいてプロバイダーを初期化
        self._initialize_providers()
        
        # 負荷分散設定
        self.provider_weights = {
            AIProvider.OPENAI: 0.4,    # 高速・安価
            AIProvider.CLAUDE: 0.3,    # 高品質
            AIProvider.GEMINI: 0.2,    # 大容量
            AIProvider.LOCAL: 0.1      # 無料・プライバシー
        }
    
    def _initialize_providers(self):
        """利用可能なプロバイダーを初期化"""
        
        # Claude
        if hasattr(self.config, 'claude_api_key') and self.config.claude_api_key:
            try:
                from .claude_summarizer import ClaudeSummarizer
                self.providers[AIProvider.CLAUDE] = ClaudeSummarizer(self.config)
                self.provider_status[AIProvider.CLAUDE] = ProviderStatus(AIProvider.CLAUDE)
                self.logger.info("Claude要約器を初期化しました")
            except Exception as e:
                self.logger.warning(f"Claude初期化失敗: {e}")
        
        # OpenAI
        if hasattr(self.config, 'openai_api_key') and self.config.openai_api_key:
            try:
                from .openai_summarizer import OpenAISummarizer
                self.providers[AIProvider.OPENAI] = OpenAISummarizer(self.config)
                self.provider_status[AIProvider.OPENAI] = ProviderStatus(AIProvider.OPENAI)
                self.logger.info("OpenAI要約器を初期化しました")
            except ImportError as e:
                self.logger.warning(f"OpenAI初期化失敗（依存関係不足）: {e}")
            except Exception as e:
                self.logger.warning(f"OpenAI初期化失敗: {e}")
        
        # Gemini
        if hasattr(self.config, 'gemini_api_key') and self.config.gemini_api_key:
            try:
                from .gemini_summarizer import GeminiSummarizer
                self.providers[AIProvider.GEMINI] = GeminiSummarizer(self.config)
                self.provider_status[AIProvider.GEMINI] = ProviderStatus(AIProvider.GEMINI)
                self.logger.info("Gemini要約器を初期化しました")
            except Exception as e:
                self.logger.warning(f"Gemini初期化失敗: {e}")
        
        # ローカルモデル（Ollama等）
        if hasattr(self.config, 'use_local_model') and self.config.use_local_model:
            try:
                from .local_summarizer import LocalSummarizer
                self.providers[AIProvider.LOCAL] = LocalSummarizer(self.config)
                self.provider_status[AIProvider.LOCAL] = ProviderStatus(AIProvider.LOCAL)
                self.logger.info("ローカル要約器を初期化しました")
            except Exception as e:
                self.logger.warning(f"ローカルモデル初期化失敗: {e}")
        
        if not self.providers:
            raise ValueError("利用可能なAIプロバイダーがありません")
        
        self.logger.info(f"初期化完了: {list(self.providers.keys())}")
    
    def _select_provider(self, task_type: str = "summarize") -> Optional[AIProvider]:
        """
        タスクに最適なプロバイダーを選択
        
        Args:
            task_type: タスク種別 (summarize, translate, analyze)
            
        Returns:
            選択されたプロバイダー、利用不可の場合はNone
        """
        # 利用可能なプロバイダーをフィルタリング
        available_providers = []
        for provider, status in self.provider_status.items():
            if status.available and not status.is_rate_limited():
                available_providers.append(provider)
        
        if not available_providers:
            self.logger.warning("利用可能なプロバイダーがありません")
            return None
        
        # タスク別の優先度設定
        task_preferences = {
            "summarize": [AIProvider.OPENAI, AIProvider.CLAUDE, AIProvider.GEMINI, AIProvider.LOCAL],
            "translate": [AIProvider.OPENAI, AIProvider.GEMINI, AIProvider.CLAUDE, AIProvider.LOCAL],
            "analyze": [AIProvider.CLAUDE, AIProvider.GEMINI, AIProvider.OPENAI, AIProvider.LOCAL],
            "batch": [AIProvider.GEMINI, AIProvider.OPENAI, AIProvider.CLAUDE, AIProvider.LOCAL]
        }
        
        preferences = task_preferences.get(task_type, available_providers)
        
        # 優先度順で利用可能なプロバイダーを選択
        for preferred in preferences:
            if preferred in available_providers:
                return preferred
        
        # フォールバック: ランダム選択
        return random.choice(available_providers)
    
    async def summarize_article(self, article: RawNewsItem) -> Optional[NewsItem]:
        """
        記事を要約（マルチプロバイダー対応）
        
        Args:
            article: 生記事データ
            
        Returns:
            処理済み記事データ、失敗時はNone
        """
        # キャッシュチェック
        cached_item = self.cache.get(article)
        if cached_item:
            self.logger.debug(f"キャッシュヒット: {article.title[:50]}...")
            return cached_item
        
        # プロバイダー選択
        provider = self._select_provider("summarize")
        if not provider:
            self.logger.error("利用可能なプロバイダーがありません")
            return None
        
        # フォールバック付きで処理実行
        for attempt_provider in [provider] + [p for p in self.providers.keys() if p != provider]:
            if not self.provider_status[attempt_provider].available:
                continue
                
            try:
                self.logger.debug(f"{attempt_provider.value}で記事処理: {article.title[:50]}...")
                
                summarizer = self.providers[attempt_provider]
                result = await summarizer.summarize_article(article)
                
                if result:
                    # 成功をマーク
                    self.provider_status[attempt_provider].mark_success()
                    
                    # キャッシュに保存
                    self.cache.put(article, result)
                    
                    self.logger.info(f"記事要約完了 ({attempt_provider.value}): {article.title[:50]}...")
                    return result
                
            except Exception as e:
                error_msg = str(e)
                self.logger.warning(f"{attempt_provider.value}でエラー: {error_msg}")
                
                # エラーをマーク
                self.provider_status[attempt_provider].mark_error(error_msg)
                
                # レート制限エラーの場合は一時的に無効化
                if "rate_limit" in error_msg.lower() or "429" in error_msg:
                    self.provider_status[attempt_provider].rate_limit_reset = (
                        datetime.now().timestamp() + 300  # 5分間無効化
                    )
                
                # 次のプロバイダーを試行
                continue
        
        self.logger.error(f"すべてのプロバイダーで記事処理に失敗: {article.title[:50]}...")
        return None
    
    async def batch_process(self, articles: List[RawNewsItem]) -> List[NewsItem]:
        """
        記事をバッチ処理（負荷分散）
        
        Args:
            articles: 生記事データリスト
            
        Returns:
            処理済み記事データリスト
        """
        processed_articles = []
        
        # キャッシュされた記事を先に処理
        cached_articles = []
        new_articles = []
        
        for article in articles:
            cached_item = self.cache.get(article)
            if cached_item:
                cached_articles.append(cached_item)
            else:
                new_articles.append(article)
        
        processed_articles.extend(cached_articles)
        self.logger.info(f"キャッシュヒット: {len(cached_articles)}件, 新規処理: {len(new_articles)}件")
        
        if not new_articles:
            return processed_articles
        
        # 記事を利用可能なプロバイダーに分散
        provider_batches = self._distribute_articles(new_articles)
        
        # 各プロバイダーで並行処理
        tasks = []
        for provider, batch in provider_batches.items():
            if batch:
                task = self._process_batch_with_provider(provider, batch)
                tasks.append(task)
        
        # 並行実行
        batch_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 結果をマージ
        for result in batch_results:
            if isinstance(result, list):
                processed_articles.extend(result)
            elif isinstance(result, Exception):
                self.logger.error(f"バッチ処理エラー: {result}")
        
        self.logger.info(f"マルチプロバイダーバッチ処理完了: {len(processed_articles)}/{len(articles)}")
        return processed_articles
    
    def _distribute_articles(self, articles: List[RawNewsItem]) -> Dict[AIProvider, List[RawNewsItem]]:
        """
        記事を利用可能なプロバイダーに分散
        
        Args:
            articles: 記事リスト
            
        Returns:
            プロバイダー別記事分散
        """
        # 利用可能なプロバイダーを取得
        available_providers = [
            provider for provider, status in self.provider_status.items()
            if status.available and not status.is_rate_limited()
        ]
        
        if not available_providers:
            return {}
        
        # 重み付けに基づいて記事を分散
        provider_batches = {provider: [] for provider in available_providers}
        
        for i, article in enumerate(articles):
            # 重み付けに基づいてプロバイダーを選択
            weights = [self.provider_weights.get(p, 0.1) for p in available_providers]
            total_weight = sum(weights)
            normalized_weights = [w / total_weight for w in weights]
            
            # 重み付きランダム選択
            provider = random.choices(available_providers, weights=normalized_weights)[0]
            provider_batches[provider].append(article)
        
        # 分散結果をログ出力
        for provider, batch in provider_batches.items():
            if batch:
                self.logger.info(f"{provider.value}: {len(batch)}件の記事を割り当て")
        
        return provider_batches
    
    async def _process_batch_with_provider(self, provider: AIProvider, articles: List[RawNewsItem]) -> List[NewsItem]:
        """
        特定のプロバイダーでバッチ処理
        
        Args:
            provider: 使用するプロバイダー
            articles: 処理する記事リスト
            
        Returns:
            処理済み記事リスト
        """
        try:
            summarizer = self.providers[provider]
            
            # プロバイダー固有のバッチ処理を実行
            if hasattr(summarizer, 'batch_process'):
                results = await summarizer.batch_process(articles)
            else:
                # バッチ処理がない場合は個別処理
                tasks = [summarizer.summarize_article(article) for article in articles]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                results = [r for r in results if isinstance(r, NewsItem)]
            
            # 成功をマーク
            self.provider_status[provider].mark_success()
            
            self.logger.info(f"{provider.value}バッチ処理完了: {len(results)}/{len(articles)}")
            return results
            
        except Exception as e:
            self.logger.error(f"{provider.value}バッチ処理エラー: {e}")
            self.provider_status[provider].mark_error(str(e))
            return []
    
    async def analyze_daily_trends(self, articles: List[NewsItem]) -> DailySummary:
        """
        日次トレンド分析（最適なプロバイダーを選択）
        
        Args:
            articles: 処理済み記事リスト
            
        Returns:
            日次サマリー
        """
        # 分析に最適なプロバイダーを選択（Claude > Gemini > OpenAI）
        provider = self._select_provider("analyze")
        
        if not provider:
            self.logger.error("トレンド分析用のプロバイダーが利用できません")
            return self._create_empty_summary()
        
        try:
            summarizer = self.providers[provider]
            result = await summarizer.analyze_daily_trends(articles)
            
            self.provider_status[provider].mark_success()
            self.logger.info(f"日次トレンド分析完了 ({provider.value})")
            
            return result
            
        except Exception as e:
            self.logger.error(f"日次トレンド分析エラー ({provider.value}): {e}")
            self.provider_status[provider].mark_error(str(e))
            
            # フォールバック: 基本的なサマリーを生成
            return self._create_basic_summary(articles)
    
    def _create_empty_summary(self) -> DailySummary:
        """空のサマリーを作成"""
        return DailySummary(
            date=datetime.now().strftime('%Y-%m-%d'),
            total_articles=0,
            top_trends=[],
            significant_news=[],
            category_breakdown={},
            summary_ja="本日はAI関連のニュースがありませんでした。",
            summary_en="No AI-related news today.",
            generated_at=datetime.now()
        )
    
    def _create_basic_summary(self, articles: List[NewsItem]) -> DailySummary:
        """基本的なサマリーを作成（AI処理なし）"""
        # カテゴリ別集計
        category_breakdown = {}
        for article in articles:
            category_breakdown[article.category] = category_breakdown.get(article.category, 0) + 1
        
        # 重要ニュース抽出
        significant_news = sorted(articles, key=lambda x: x.ai_confidence, reverse=True)[:5]
        
        # 基本的なトレンド（タグベース）
        tag_counts = {}
        for article in articles:
            for tag in article.tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        top_trends = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        top_trends = [trend[0] for trend in top_trends]
        
        return DailySummary(
            date=datetime.now().strftime('%Y-%m-%d'),
            total_articles=len(articles),
            top_trends=top_trends,
            significant_news=significant_news,
            category_breakdown=category_breakdown,
            summary_ja=f"本日は{len(articles)}件のAI関連ニュースを収集しました。",
            summary_en=f"Collected {len(articles)} AI-related news articles today.",
            generated_at=datetime.now()
        )
    
    def get_provider_status(self) -> Dict[str, Dict[str, Any]]:
        """プロバイダーの状態を取得"""
        status = {}
        for provider, provider_status in self.provider_status.items():
            status[provider.value] = {
                "available": provider_status.available,
                "error_count": provider_status.error_count,
                "last_error": provider_status.last_error,
                "last_used": provider_status.last_used.isoformat() if provider_status.last_used else None,
                "rate_limited": provider_status.is_rate_limited()
            }
        return status