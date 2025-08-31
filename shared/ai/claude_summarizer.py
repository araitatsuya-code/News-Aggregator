"""
Claude API を使用した記事要約・翻訳システム
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from anthropic import AsyncAnthropic
from asyncio_throttle import Throttler

from ..types import RawNewsItem, NewsItem, DailySummary
from ..exceptions import AIProcessingError
from ..config import AppConfig


class ClaudeSummarizer:
    """Claude APIを使用した記事要約・翻訳クラス"""
    
    def __init__(self, config: AppConfig):
        """
        初期化
        
        Args:
            config: アプリケーション設定
        """
        self.config = config
        # Anthropicクライアントの初期化（最新版対応）
        try:
            self.client = AsyncAnthropic(api_key=config.claude_api_key)
        except TypeError as e:
            # 古いバージョンとの互換性対応
            self.logger = logging.getLogger(__name__)
            self.logger.error(f"Anthropicクライアント初期化エラー: {e}")
            # 基本的なパラメータのみで初期化を試行
            self.client = AsyncAnthropic(api_key=config.claude_api_key)
        
        self.logger = logging.getLogger(__name__)
        
        # API制限対応: 1分間に40リクエストまで（安全マージン付き）
        self.throttler = Throttler(rate_limit=40, period=60)
        
        # バッチ処理設定
        self.batch_size = config.claude_batch_size
        self.max_retries = config.max_retries
        self.retry_delay = config.retry_delay
    
    async def summarize_article(self, article: RawNewsItem) -> Optional[NewsItem]:
        """
        記事を要約し、NewsItemに変換
        
        Args:
            article: 生記事データ
            
        Returns:
            処理済み記事データ、失敗時はNone
        """
        try:
            # API制限対応
            async with self.throttler:
                # 要約生成
                summary = await self._generate_summary(article)
                if not summary:
                    return None
                
                # 翻訳（英語記事の場合）
                translated_title = article.title
                if article.source.language == 'en':
                    translated_title = await self._translate_to_japanese(article.title, article.source.name)
                    if not translated_title:
                        translated_title = article.title
                
                # タグ生成
                tags = await self._generate_tags(article, summary)
                
                # NewsItem作成
                news_item = NewsItem(
                    id=getattr(article, 'id', str(hash(article.url))),
                    title=translated_title,
                    original_title=article.title,
                    summary=summary,
                    url=article.url,
                    source=article.source.name,
                    category=article.source.category,
                    published_at=article.published_at,
                    language=article.source.language,
                    tags=tags,
                    ai_confidence=0.8  # デフォルト信頼度
                )
                
                self.logger.info(f"記事要約完了: {article.title[:50]}...")
                return news_item
                
        except Exception as e:
            self.logger.error(f"記事要約エラー: {e}, 記事: {article.title[:50]}...")
            raise AIProcessingError(f"記事要約に失敗しました: {e}", getattr(article, 'id', None))
    
    async def _generate_summary(self, article: RawNewsItem) -> Optional[str]:
        """
        記事の要約を生成
        
        Args:
            article: 生記事データ
            
        Returns:
            要約文、失敗時はNone
        """
        try:
            # プロンプト作成
            content = article.content or article.title
            prompt = self._create_summary_prompt(article.title, content, article.source.language)
            
            # Claude API呼び出し
            response = await self.client.messages.create(
                model=self.config.claude_model,
                max_tokens=self.config.claude_max_tokens,
                messages=[{"role": "user", "content": prompt}]
            )
            
            summary = response.content[0].text.strip()
            
            # 文字数チェック（200文字以内）
            if len(summary) > 200:
                summary = summary[:197] + "..."
            
            return summary
            
        except Exception as e:
            self.logger.error(f"要約生成エラー: {e}")
            return None
    
    async def _translate_to_japanese(self, text: str, source_name: str = "") -> Optional[str]:
        """
        英語テキストを日本語に翻訳
        
        Args:
            text: 翻訳対象テキスト
            source_name: ソース名（Reddit等の特別処理用）
            
        Returns:
            翻訳結果、失敗時はNone
        """
        try:
            # Redditタイトルの場合は特別処理
            if "reddit" in source_name.lower() or text.startswith('[') or text.endswith(']'):
                prompt = f"""
以下のRedditタイトルを日本語に翻訳してください。
- [D], [R], [P]などのタグは削除
- 冗長な説明は削除してシンプルなタイトルに
- 技術用語は適切に日本語化

元タイトル: {text}

和訳:"""
            else:
                prompt = f"""
以下の英語タイトルを自然な日本語に翻訳してください。
技術用語は適切に日本語化し、読みやすいタイトルにしてください。

英語タイトル: {text}

和訳:"""

            response = await self.client.messages.create(
                model=self.config.claude_model,
                max_tokens=self.config.claude_max_tokens,
                messages=[{"role": "user", "content": prompt}]
            )
            
            result = response.content[0].text.strip()
            
            # 不要なプレフィックス・サフィックスを削除
            prefixes_to_remove = [
                "和訳：", "和訳:", "日本語翻訳：", "日本語翻訳:", 
                "翻訳：", "翻訳:", "日本語：", "日本語:",
                "以下は英語テキストを自然な日本語に翻訳したものです。", 
                "タイトルごとに以下のように翻訳しました。",
                "以下のように翻訳しました：", "以下のように翻訳しました:",
                "翻訳結果：", "翻訳結果:", "タイトル："
            ]
            
            # プレフィックス削除
            for prefix in prefixes_to_remove:
                if result.startswith(prefix):
                    result = result[len(prefix):].strip()
            
            # 改行文字を削除し、余分な空白を整理
            result = result.replace('\n', '').strip()
            
            # 重複した同じ内容を削除（例：「v1.0.97\n\nバージョン1.0.97」→「v1.0.97」）
            lines = [line.strip() for line in result.split('\n') if line.strip()]
            if len(lines) > 1 and lines[0] in lines[1]:
                result = lines[0]
            elif len(lines) > 1 and all(line == lines[0] for line in lines):
                result = lines[0]
            
            return result
            
        except Exception as e:
            self.logger.error(f"翻訳エラー: {e}")
            return None
    
    async def _generate_tags(self, article: RawNewsItem, summary: str) -> List[str]:
        """
        記事のタグを生成
        
        Args:
            article: 生記事データ
            summary: 要約文
            
        Returns:
            タグリスト
        """
        try:
            prompt = f"""
以下の記事タイトルと要約から、関連するタグを3-5個生成してください。
タグは日本語で、AI・機械学習・技術分野に関連するものにしてください。

タイトル: {article.title}
要約: {summary}

タグ（カンマ区切り）:"""

            response = await self.client.messages.create(
                model=self.config.claude_model,
                max_tokens=200,
                messages=[{"role": "user", "content": prompt}]
            )
            
            tags_text = response.content[0].text.strip()
            tags = [tag.strip() for tag in tags_text.split(',') if tag.strip()]
            
            return tags[:5]  # 最大5個まで
            
        except Exception as e:
            self.logger.error(f"タグ生成エラー: {e}")
            return []
    
    def _create_summary_prompt(self, title: str, content: str, language: str) -> str:
        """
        要約生成用プロンプトを作成
        
        Args:
            title: 記事タイトル
            content: 記事内容
            language: 記事言語
            
        Returns:
            プロンプト文字列
        """
        if language == 'ja':
            return f"""
以下のAI・機械学習関連の記事を200文字以内で要約してください。
重要なポイントを簡潔にまとめ、技術的な内容も分かりやすく説明してください。

タイトル: {title}
内容: {content}

要約:"""
        else:
            return f"""
以下の英語のAI・機械学習関連記事を日本語で200文字以内に要約してください。
重要なポイントを簡潔にまとめ、技術的な内容も分かりやすく説明してください。

Title: {title}
Content: {content}

日本語要約:"""
    
    async def batch_process(self, articles: List[RawNewsItem]) -> List[NewsItem]:
        """
        記事をバッチ処理で要約
        
        Args:
            articles: 生記事データリスト
            
        Returns:
            処理済み記事データリスト
        """
        processed_articles = []
        
        # バッチサイズごとに分割して処理
        for i in range(0, len(articles), self.batch_size):
            batch = articles[i:i + self.batch_size]
            self.logger.info(f"バッチ処理開始: {i+1}-{min(i+self.batch_size, len(articles))}/{len(articles)}")
            
            # 並行処理でバッチ内の記事を処理
            tasks = [self._process_article_with_retry(article) for article in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # 成功した結果のみを追加
            for result in batch_results:
                if isinstance(result, NewsItem):
                    processed_articles.append(result)
                elif isinstance(result, Exception):
                    self.logger.error(f"バッチ処理エラー: {result}")
            
            # バッチ間の待機（API制限対応）
            if i + self.batch_size < len(articles):
                await asyncio.sleep(3)  # レート制限を避けるため3秒待機
        
        self.logger.info(f"バッチ処理完了: {len(processed_articles)}/{len(articles)} 記事処理成功")
        return processed_articles
    
    async def _process_article_with_retry(self, article: RawNewsItem) -> Optional[NewsItem]:
        """
        リトライ機能付きで記事を処理
        
        Args:
            article: 生記事データ
            
        Returns:
            処理済み記事データ、失敗時はNone
        """
        for attempt in range(self.max_retries):
            try:
                return await self.summarize_article(article)
            except Exception as e:
                # レート制限エラーの特別処理
                if "rate_limit_error" in str(e) or "429" in str(e):
                    wait_time = 60  # レート制限の場合は60秒待機
                    self.logger.warning(f"レート制限エラー: 60秒待機します")
                    await asyncio.sleep(wait_time)
                    continue
                
                if attempt == self.max_retries - 1:
                    self.logger.error(f"記事処理失敗（最大リトライ回数到達）: {e}")
                    return None
                
                # 指数バックオフで待機
                wait_time = self.retry_delay * (2 ** attempt)
                self.logger.warning(f"記事処理リトライ {attempt + 1}/{self.max_retries}: {wait_time}秒後に再試行")
                await asyncio.sleep(wait_time)
        
        return None
    
    async def analyze_daily_trends(self, articles: List[NewsItem]) -> DailySummary:
        """
        日次トレンド分析を実行
        
        Args:
            articles: 処理済み記事リスト
            
        Returns:
            日次サマリー
        """
        try:
            if not articles:
                return self._create_empty_summary()
            
            # カテゴリ別集計
            category_breakdown = {}
            for article in articles:
                category_breakdown[article.category] = category_breakdown.get(article.category, 0) + 1
            
            # 重要ニュース抽出（信頼度順）
            significant_news = sorted(articles, key=lambda x: x.ai_confidence, reverse=True)[:5]
            
            # トレンド分析
            top_trends = await self._extract_trends(articles)
            
            # サマリー生成
            summary_ja = await self._generate_daily_summary(articles, 'ja')
            summary_en = await self._generate_daily_summary(articles, 'en')
            
            return DailySummary(
                date=datetime.now().strftime('%Y-%m-%d'),
                total_articles=len(articles),
                top_trends=top_trends,
                significant_news=significant_news,
                category_breakdown=category_breakdown,
                summary_ja=summary_ja or "本日のAIニュースサマリーの生成に失敗しました。",
                summary_en=summary_en or "Failed to generate daily AI news summary.",
                generated_at=datetime.now()
            )
            
        except Exception as e:
            self.logger.error(f"日次トレンド分析エラー: {e}")
            raise AIProcessingError(f"日次トレンド分析に失敗しました: {e}")
    
    async def _extract_trends(self, articles: List[NewsItem]) -> List[str]:
        """
        記事からトレンドを抽出
        
        Args:
            articles: 記事リスト
            
        Returns:
            トレンドリスト
        """
        try:
            # 全記事のタイトルと要約を結合
            all_text = "\n".join([f"{article.title}: {article.summary}" for article in articles])
            
            prompt = f"""
以下のAI関連ニュースから、今日の主要なトレンドを3-5個抽出してください。
技術動向、企業動向、製品発表などの観点から重要なトピックを特定してください。

ニュース一覧:
{all_text[:3000]}  # 文字数制限

主要トレンド（箇条書き）:"""

            response = await self.client.messages.create(
                model=self.config.claude_model,
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}]
            )
            
            trends_text = response.content[0].text.strip()
            trends = []
            for line in trends_text.split('\n'):
                line = line.strip()
                if line and (line.startswith('•') or line.startswith('-') or line.startswith('*')):
                    trend = line.lstrip('•-* ').strip()
                    if trend:
                        trends.append(trend)
            
            return trends[:5]
            
        except Exception as e:
            self.logger.error(f"トレンド抽出エラー: {e}")
            return []
    
    async def _generate_daily_summary(self, articles: List[NewsItem], language: str) -> Optional[str]:
        """
        日次サマリーを生成
        
        Args:
            articles: 記事リスト
            language: 出力言語 ('ja' or 'en')
            
        Returns:
            サマリー文、失敗時はNone
        """
        try:
            # 記事情報を要約
            articles_info = []
            for article in articles[:10]:  # 上位10記事
                articles_info.append(f"- {article.title}: {article.summary}")
            
            articles_text = "\n".join(articles_info)
            
            if language == 'ja':
                prompt = f"""
本日のAI関連ニュースを300文字以内で総括してください。
主要な動向、注目すべき発表、技術トレンドなどを含めて、読者が一日の流れを把握できるようにまとめてください。

本日のニュース:
{articles_text}

日次サマリー:"""
            else:
                prompt = f"""
Summarize today's AI-related news in 300 characters or less in English.
Include major trends, notable announcements, and technical developments so readers can understand the day's flow.

Today's News:
{articles_text}

Daily Summary:"""

            response = await self.client.messages.create(
                model=self.config.claude_model,
                max_tokens=self.config.claude_max_tokens,
                messages=[{"role": "user", "content": prompt}]
            )
            
            return response.content[0].text.strip()
            
        except Exception as e:
            self.logger.error(f"日次サマリー生成エラー: {e}")
            return None
    
    def _create_empty_summary(self) -> DailySummary:
        """
        空のサマリーを作成
        
        Returns:
            空のDailySummary
        """
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