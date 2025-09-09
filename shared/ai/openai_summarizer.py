"""
OpenAI GPT-4o を使用した記事要約・翻訳システム
高速・安価・高品質な処理を提供
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from openai import AsyncOpenAI
from asyncio_throttle import Throttler

from ..types import RawNewsItem, NewsItem, DailySummary
from ..exceptions import AIProcessingError
from ..config import AppConfig


class OpenAISummarizer:
    """OpenAI GPT-4oを使用した記事要約・翻訳クラス"""
    
    def __init__(self, config: AppConfig):
        """
        初期化
        
        Args:
            config: アプリケーション設定
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # OpenAI APIキーの確認
        if not hasattr(config, 'openai_api_key') or not config.openai_api_key:
            raise ValueError("OpenAI APIキーが設定されていません")
        
        try:
            self.client = AsyncOpenAI(api_key=config.openai_api_key)
        except Exception as e:
            self.logger.error(f"OpenAI クライアント初期化エラー: {e}")
            raise
        
        # API制限対応: 1分間に500リクエストまで（Claudeより大幅に高い）
        self.throttler = Throttler(rate_limit=450, period=60)  # 安全マージン
        
        # バッチ処理設定
        self.batch_size = getattr(config, 'openai_batch_size', 10)  # Claudeより大きく
        self.max_retries = getattr(config, 'max_retries', 3)
        self.retry_delay = getattr(config, 'retry_delay', 2)
        
        # モデル設定
        self.model = getattr(config, 'openai_model', 'gpt-4o')
        self.max_tokens = getattr(config, 'openai_max_tokens', 500)
    
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
                # 一括処理で効率化（要約・翻訳・タグを1回のAPI呼び出しで）
                result = await self._process_article_all_in_one(article)
                
                if not result:
                    return None
                
                # NewsItem作成
                news_item = NewsItem(
                    id=getattr(article, 'id', str(hash(article.url))),
                    title=result.get('translated_title', article.title),
                    original_title=article.title,
                    summary=result['summary'],
                    url=article.url,
                    source=article.source.name,
                    category=article.source.category,
                    published_at=article.published_at,
                    language=article.source.language,
                    tags=result.get('tags', []),
                    ai_confidence=result.get('confidence', 0.85)
                )
                
                self.logger.debug(f"OpenAI記事要約完了: {article.title[:50]}...")
                return news_item
                
        except Exception as e:
            self.logger.error(f"OpenAI記事要約エラー: {e}, 記事: {article.title[:50]}...")
            raise AIProcessingError(f"OpenAI記事要約に失敗しました: {e}", getattr(article, 'id', None))
    
    async def _process_article_all_in_one(self, article: RawNewsItem) -> Optional[Dict[str, Any]]:
        """
        記事の要約・翻訳・タグ生成を1回のAPI呼び出しで実行
        
        Args:
            article: 生記事データ
            
        Returns:
            処理結果辞書、失敗時はNone
        """
        try:
            content = article.content or article.title
            
            # 言語に応じたプロンプト作成
            if article.source.language == 'ja':
                prompt = f"""
以下の日本語AI・機械学習関連記事を分析して、JSON形式で回答してください：

タイトル: {article.title}
内容: {content}

以下の形式で回答してください：
{{
    "summary": "200文字以内の要約",
    "tags": ["関連タグ1", "関連タグ2", "関連タグ3"],
    "confidence": 0.85
}}

重要なポイントを簡潔にまとめ、技術的な内容も分かりやすく説明してください。
タグは日本語で3-5個生成してください。"""
            else:
                prompt = f"""
以下の英語AI・機械学習関連記事を分析して、JSON形式で回答してください：

Title: {article.title}
Content: {content}

以下の形式で回答してください：
{{
    "summary": "日本語で200文字以内の要約",
    "translated_title": "日本語タイトル",
    "tags": ["関連タグ1", "関連タグ2", "関連タグ3"],
    "confidence": 0.85
}}

要約は日本語で、重要なポイントを簡潔にまとめてください。
タイトルも自然な日本語に翻訳してください。
タグは日本語で3-5個生成してください。"""
            
            # OpenAI API呼び出し
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "あなたはAI・機械学習分野の専門家です。記事を正確に分析し、指定されたJSON形式で回答してください。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=0.3,  # 一貫性を重視
                response_format={"type": "json_object"}  # JSON形式を強制
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # JSON解析
            result = json.loads(result_text)
            
            # 必須フィールドの検証
            if 'summary' not in result:
                self.logger.error("要約が生成されませんでした")
                return None
            
            # 文字数制限チェック
            if len(result['summary']) > 200:
                result['summary'] = result['summary'][:197] + "..."
            
            return result
            
        except json.JSONDecodeError as e:
            self.logger.error(f"JSON解析エラー: {e}")
            self.logger.error(f"レスポンス内容: {result_text[:500]}...")
            # フォールバック: 基本的な要約を生成
            return {
                'summary': f"記事「{article.title}」の要約処理中にエラーが発生しました。",
                'tags': ['AI', '機械学習'],
                'confidence': 0.3
            }
        except Exception as e:
            self.logger.error(f"OpenAI一括処理エラー: {e}")
            self.logger.error(f"記事タイトル: {article.title}")
            return None
    
    async def batch_process(self, articles: List[RawNewsItem]) -> List[NewsItem]:
        """
        記事をバッチ処理で要約（OpenAI最適化版）
        
        Args:
            articles: 生記事データリスト
            
        Returns:
            処理済み記事データリスト
        """
        processed_articles = []
        
        self.logger.info(f"OpenAIバッチ処理開始: {len(articles)}件")
        
        # より大きなバッチサイズで処理（OpenAIは高いレート制限）
        for i in range(0, len(articles), self.batch_size):
            batch = articles[i:i + self.batch_size]
            self.logger.debug(f"OpenAIバッチ処理: {i+1}-{min(i+self.batch_size, len(articles))}/{len(articles)}")
            
            # 並行処理でバッチ内の記事を処理
            tasks = [self._process_article_with_retry(article) for article in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # 成功した結果のみを追加
            for result in batch_results:
                if isinstance(result, NewsItem):
                    processed_articles.append(result)
                elif isinstance(result, Exception):
                    self.logger.error(f"OpenAIバッチ処理エラー: {result}")
            
            # バッチ間の短い待機（OpenAIは高速処理可能）
            if i + self.batch_size < len(articles):
                await asyncio.sleep(2)  # Claudeの45秒と比べて大幅短縮
        
        self.logger.info(f"OpenAIバッチ処理完了: {len(processed_articles)}/{len(articles)}")
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
                if "rate_limit" in str(e).lower() or "429" in str(e):
                    wait_time = 30  # OpenAIは回復が早い
                    self.logger.warning(f"OpenAIレート制限: {wait_time}秒待機")
                    await asyncio.sleep(wait_time)
                    continue
                
                if attempt == self.max_retries - 1:
                    self.logger.error(f"OpenAI記事処理失敗（最大リトライ到達）: {e}")
                    return None
                
                # 指数バックオフ
                wait_time = self.retry_delay * (2 ** attempt)
                self.logger.warning(f"OpenAI記事処理リトライ {attempt + 1}/{self.max_retries}: {wait_time}秒後")
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
            
            # 重要ニュース抽出
            significant_news = sorted(articles, key=lambda x: x.ai_confidence, reverse=True)[:5]
            
            # OpenAIでトレンド分析と要約を並行実行
            async with self.throttler:
                trends_task = self._extract_trends_openai(articles)
                summary_ja_task = self._generate_daily_summary_openai(articles, 'ja')
                summary_en_task = self._generate_daily_summary_openai(articles, 'en')
                
                top_trends, summary_ja, summary_en = await asyncio.gather(
                    trends_task, summary_ja_task, summary_en_task,
                    return_exceptions=True
                )
            
            # エラーハンドリング
            if isinstance(top_trends, Exception):
                self.logger.error(f"トレンド抽出エラー: {top_trends}")
                top_trends = []
            
            if isinstance(summary_ja, Exception):
                self.logger.error(f"日本語サマリー生成エラー: {summary_ja}")
                summary_ja = f"本日は{len(articles)}件のAI関連ニュースを収集しました。"
            
            if isinstance(summary_en, Exception):
                self.logger.error(f"英語サマリー生成エラー: {summary_en}")
                summary_en = f"Collected {len(articles)} AI-related news articles today."
            
            return DailySummary(
                date=datetime.now().strftime('%Y-%m-%d'),
                total_articles=len(articles),
                top_trends=top_trends or [],
                significant_news=significant_news,
                category_breakdown=category_breakdown,
                summary_ja=summary_ja,
                summary_en=summary_en,
                generated_at=datetime.now()
            )
            
        except Exception as e:
            self.logger.error(f"OpenAI日次トレンド分析エラー: {e}")
            raise AIProcessingError(f"OpenAI日次トレンド分析に失敗しました: {e}")
    
    async def _extract_trends_openai(self, articles: List[NewsItem]) -> List[str]:
        """OpenAIでトレンドを抽出"""
        try:
            # 記事情報を要約
            articles_info = []
            for article in articles[:15]:  # 上位15記事
                articles_info.append(f"- {article.title}: {article.summary}")
            
            articles_text = "\n".join(articles_info)
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "あなたはAI・機械学習分野のトレンド分析専門家です。"},
                    {"role": "user", "content": f"""
以下のAI関連ニュースから、今日の主要なトレンドを3-5個抽出してください。
技術動向、企業動向、製品発表などの観点から重要なトピックを特定してください。

ニュース一覧:
{articles_text}

JSON形式で回答してください：
{{
    "trends": ["トレンド1", "トレンド2", "トレンド3"]
}}"""}
                ],
                max_tokens=300,
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return result.get('trends', [])
            
        except Exception as e:
            self.logger.error(f"OpenAIトレンド抽出エラー: {e}")
            return []
    
    async def _generate_daily_summary_openai(self, articles: List[NewsItem], language: str) -> str:
        """OpenAIで日次サマリーを生成"""
        try:
            # 記事情報を要約
            articles_info = []
            for article in articles[:10]:
                articles_info.append(f"- {article.title}: {article.summary}")
            
            articles_text = "\n".join(articles_info)
            
            if language == 'ja':
                prompt = f"""
本日のAI関連ニュースを300文字以内で総括してください。
主要な動向、注目すべき発表、技術トレンドなどを含めて、読者が一日の流れを把握できるようにまとめてください。

本日のニュース:
{articles_text}

日次サマリー（300文字以内）:"""
            else:
                prompt = f"""
Summarize today's AI-related news in 300 characters or less in English.
Include major trends, notable announcements, and technical developments so readers can understand the day's flow.

Today's News:
{articles_text}

Daily Summary (300 chars max):"""
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "あなたはAIニュースの要約専門家です。簡潔で分かりやすい要約を作成してください。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=400,
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            self.logger.error(f"OpenAI日次サマリー生成エラー: {e}")
            if language == 'ja':
                return f"本日は{len(articles)}件のAI関連ニュースを収集しました。"
            else:
                return f"Collected {len(articles)} AI-related news articles today."
    
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