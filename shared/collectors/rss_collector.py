"""
RSS収集システム
複数のRSSソースから記事を収集し、正規化・重複除去を行う
"""

import asyncio
import hashlib
import logging
from datetime import datetime, timezone
from typing import List, Optional, Set, Dict, Any
from urllib.parse import urljoin, urlparse

import aiohttp
import feedparser
from dateutil import parser as date_parser

from ..types import RSSSource, RawNewsItem
from ..exceptions import RSSCollectionError


class RSSCollector:
    """RSS収集クラス"""
    
    def __init__(self, sources: List[RSSSource], timeout: int = 30, max_retries: int = 3):
        """
        初期化
        
        Args:
            sources: RSS ソースのリスト
            timeout: HTTP タイムアウト（秒）
            max_retries: 最大リトライ回数
        """
        self.sources = [source for source in sources if source.enabled]
        self.timeout = timeout
        self.max_retries = max_retries
        self.logger = logging.getLogger(__name__)
        self._session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        """非同期コンテキストマネージャー開始"""
        self._session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.timeout),
            headers={
                'User-Agent': 'AI-News-Aggregator/1.0 (RSS Reader)'
            }
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """非同期コンテキストマネージャー終了"""
        if self._session:
            await self._session.close()
            
    async def collect_all(self) -> List[RawNewsItem]:
        """
        全ソースから記事を収集
        
        Returns:
            収集された記事のリスト（重複除去済み）
        """
        if not self._session:
            raise RuntimeError("RSSCollectorは非同期コンテキストマネージャーとして使用してください")
            
        self.logger.info(f"RSS収集開始 - {len(self.sources)}個のソースから収集")
        
        # 並行して全ソースから収集
        tasks = [self._collect_from_source(source) for source in self.sources]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 結果をまとめる
        all_articles = []
        successful_sources = 0
        
        for i, result in enumerate(results):
            source = self.sources[i]
            if isinstance(result, Exception):
                self.logger.error(f"ソース '{source.name}' の収集に失敗: {result}")
            else:
                all_articles.extend(result)
                successful_sources += 1
                self.logger.info(f"ソース '{source.name}' から {len(result)}件の記事を収集")
        
        self.logger.info(f"収集完了 - {successful_sources}/{len(self.sources)}個のソースが成功")
        
        # 重複除去
        deduplicated_articles = self.deduplicate(all_articles)
        self.logger.info(f"重複除去後: {len(deduplicated_articles)}件の記事")
        
        return deduplicated_articles
        
    async def _collect_from_source(self, source: RSSSource) -> List[RawNewsItem]:
        """
        単一ソースから記事を収集（リトライ機能付き）
        
        Args:
            source: RSSソース
            
        Returns:
            収集された記事のリスト
            
        Raises:
            RSSCollectionError: 収集に失敗した場合
        """
        last_exception = None
        
        for attempt in range(self.max_retries):
            try:
                return await self._fetch_and_parse(source)
            except Exception as e:
                last_exception = e
                if attempt < self.max_retries - 1:
                    wait_time = 2 ** attempt  # 指数バックオフ
                    self.logger.warning(
                        f"ソース '{source.name}' の収集に失敗 (試行 {attempt + 1}/{self.max_retries}): {e}. "
                        f"{wait_time}秒後にリトライします"
                    )
                    await asyncio.sleep(wait_time)
                else:
                    self.logger.error(f"ソース '{source.name}' の収集に最終的に失敗: {e}")
        
        raise RSSCollectionError(source.name, str(last_exception))
        
    async def _fetch_and_parse(self, source: RSSSource) -> List[RawNewsItem]:
        """
        RSSフィードを取得して解析
        
        Args:
            source: RSSソース
            
        Returns:
            解析された記事のリスト
        """
        # RSSフィードを取得
        async with self._session.get(source.url) as response:
            if response.status != 200:
                raise RSSCollectionError(
                    source.name, 
                    f"HTTP {response.status}: {response.reason}"
                )
            
            content = await response.text()
            
        # feedparserで解析
        feed = feedparser.parse(content)
        
        if feed.bozo and feed.bozo_exception:
            self.logger.warning(f"ソース '{source.name}' のRSSに問題があります: {feed.bozo_exception}")
        
        if not hasattr(feed, 'entries') or not feed.entries:
            raise RSSCollectionError(source.name, "記事が見つかりません")
        
        # 記事を正規化
        articles = []
        for entry in feed.entries:
            try:
                article = self.normalize_article(entry, source)
                if article:
                    articles.append(article)
            except Exception as e:
                self.logger.warning(f"記事の正規化に失敗 (ソース: {source.name}): {e}")
                continue
        
        return articles
        
    def normalize_article(self, entry: Any, source: RSSSource) -> Optional[RawNewsItem]:
        """
        RSS記事エントリを正規化
        
        Args:
            entry: feedparserのエントリオブジェクト
            source: RSSソース
            
        Returns:
            正規化された記事、または None（無効な記事の場合）
        """
        try:
            # タイトルの取得
            title = getattr(entry, 'title', '').strip()
            if not title:
                return None
            
            # URLの取得と正規化
            url = getattr(entry, 'link', '').strip()
            if not url:
                return None
            
            # 相対URLを絶対URLに変換
            if not url.startswith(('http://', 'https://')):
                base_url = f"{urlparse(source.url).scheme}://{urlparse(source.url).netloc}"
                url = urljoin(base_url, url)
            
            # 公開日時の取得と正規化
            published_at = self._parse_published_date(entry)
            
            # コンテンツの取得
            content = self._extract_content(entry)
            
            return RawNewsItem(
                title=title,
                url=url,
                published_at=published_at,
                source=source,
                content=content
            )
            
        except Exception as e:
            self.logger.warning(f"記事の正規化中にエラー: {e}")
            return None
            
    def _parse_published_date(self, entry: Any) -> datetime:
        """
        公開日時を解析
        
        Args:
            entry: feedparserのエントリオブジェクト
            
        Returns:
            解析された日時（UTC）
        """
        # 複数の日時フィールドを試行
        date_fields = ['published_parsed', 'updated_parsed', 'published', 'updated']
        
        for field in date_fields:
            if hasattr(entry, field):
                date_value = getattr(entry, field)
                
                if date_value is None:
                    continue
                    
                try:
                    if isinstance(date_value, tuple):
                        # time.struct_time形式
                        return datetime(*date_value[:6], tzinfo=timezone.utc)
                    elif isinstance(date_value, str):
                        # 文字列形式
                        parsed_date = date_parser.parse(date_value)
                        if parsed_date.tzinfo is None:
                            parsed_date = parsed_date.replace(tzinfo=timezone.utc)
                        return parsed_date.astimezone(timezone.utc)
                except Exception:
                    continue
        
        # 日時が取得できない場合は現在時刻を使用
        self.logger.warning("記事の公開日時が取得できません。現在時刻を使用します。")
        return datetime.now(timezone.utc)
        
    def _extract_content(self, entry: Any) -> Optional[str]:
        """
        記事のコンテンツを抽出
        
        Args:
            entry: feedparserのエントリオブジェクト
            
        Returns:
            抽出されたコンテンツ、または None
        """
        # 複数のコンテンツフィールドを試行
        content_fields = ['content', 'summary', 'description']
        
        for field in content_fields:
            if hasattr(entry, field):
                content_value = getattr(entry, field)
                
                if isinstance(content_value, list) and content_value:
                    # contentフィールドはリスト形式の場合がある
                    content_text = content_value[0].get('value', '')
                elif isinstance(content_value, str):
                    content_text = content_value
                else:
                    continue
                
                if content_text and content_text.strip():
                    return content_text.strip()
        
        return None
        
    def deduplicate(self, articles: List[RawNewsItem]) -> List[RawNewsItem]:
        """
        記事の重複を除去
        
        Args:
            articles: 記事のリスト
            
        Returns:
            重複除去された記事のリスト
        """
        seen_hashes: Set[str] = set()
        seen_urls: Set[str] = set()
        deduplicated = []
        
        for article in articles:
            # URLベースの重複チェック
            if article.url in seen_urls:
                continue
            
            # タイトルベースの重複チェック（ハッシュ化）
            title_hash = self._generate_title_hash(article.title)
            if title_hash in seen_hashes:
                continue
            
            seen_urls.add(article.url)
            seen_hashes.add(title_hash)
            deduplicated.append(article)
        
        return deduplicated
        
    def _generate_title_hash(self, title: str) -> str:
        """
        タイトルのハッシュを生成（重複検出用）
        
        Args:
            title: 記事タイトル
            
        Returns:
            正規化されたタイトルのハッシュ
        """
        # タイトルを正規化（小文字化、空白の正規化）
        normalized_title = ' '.join(title.lower().split())
        
        # SHA256ハッシュを生成
        return hashlib.sha256(normalized_title.encode('utf-8')).hexdigest()