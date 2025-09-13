"""
リトライキューのデータ構造定義
失敗した記事の情報を管理するためのデータクラス
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, Any, List
import json
from ..types import RawNewsItem


@dataclass
class RetryQueueItem:
    """
    リトライキューアイテム
    失敗した記事の情報を格納し、リトライ管理を行う
    """
    id: str                                    # 記事ID
    article_data: Dict[str, Any]              # 元記事データ（RawNewsItemのシリアライズ形式）
    failure_reason: str                       # 失敗理由
    failure_timestamp: datetime               # 失敗時刻
    retry_count: int                          # リトライ回数
    next_retry_time: datetime                 # 次回リトライ時刻
    provider_failures: Dict[str, int]         # プロバイダー別失敗回数
    max_retries: int = 5                      # 最大リトライ回数
    created_at: datetime = field(default_factory=datetime.now)  # 作成日時
    
    def is_expired(self) -> bool:
        """
        リトライ期限切れかチェック
        
        Returns:
            bool: 最大リトライ回数に達している場合True
        """
        return self.retry_count >= self.max_retries
    
    def can_retry_now(self) -> bool:
        """
        現在リトライ可能かチェック
        
        Returns:
            bool: 現在時刻が次回リトライ時刻を過ぎている場合True
        """
        return datetime.now() >= self.next_retry_time and not self.is_expired()
    
    def get_raw_news_item(self) -> RawNewsItem:
        """
        保存されている記事データからRawNewsItemオブジェクトを復元
        
        Returns:
            RawNewsItem: 復元された記事データ
        """
        # article_dataから必要な情報を取得してRawNewsItemを復元
        from ..types import RSSSource
        
        # RSSSourceの復元
        source_data = self.article_data['source']
        source = RSSSource(
            url=source_data['url'],
            category=source_data['category'],
            language=source_data['language'],
            name=source_data['name'],
            enabled=source_data.get('enabled', True)
        )
        
        # RawNewsItemの復元
        raw_item = RawNewsItem(
            title=self.article_data['title'],
            url=self.article_data['url'],
            published_at=datetime.fromisoformat(self.article_data['published_at']),
            source=source,
            content=self.article_data.get('content')
        )
        raw_item.id = self.article_data['id']
        
        return raw_item
    
    def to_dict(self) -> Dict[str, Any]:
        """
        辞書形式に変換（JSON保存用）
        
        Returns:
            Dict[str, Any]: シリアライズ可能な辞書
        """
        return {
            'id': self.id,
            'article_data': self.article_data,
            'failure_reason': self.failure_reason,
            'failure_timestamp': self.failure_timestamp.isoformat(),
            'retry_count': self.retry_count,
            'next_retry_time': self.next_retry_time.isoformat(),
            'provider_failures': self.provider_failures,
            'max_retries': self.max_retries,
            'created_at': self.created_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'RetryQueueItem':
        """
        辞書からRetryQueueItemを復元
        
        Args:
            data: シリアライズされた辞書データ
            
        Returns:
            RetryQueueItem: 復元されたオブジェクト
        """
        return cls(
            id=data['id'],
            article_data=data['article_data'],
            failure_reason=data['failure_reason'],
            failure_timestamp=datetime.fromisoformat(data['failure_timestamp']),
            retry_count=data['retry_count'],
            next_retry_time=datetime.fromisoformat(data['next_retry_time']),
            provider_failures=data['provider_failures'],
            max_retries=data['max_retries'],
            created_at=datetime.fromisoformat(data['created_at'])
        )
    
    @classmethod
    def from_raw_news_item(cls, raw_item: RawNewsItem, failure_reason: str, 
                          next_retry_time: datetime, provider_failures: Dict[str, int] = None) -> 'RetryQueueItem':
        """
        RawNewsItemからRetryQueueItemを作成
        
        Args:
            raw_item: 失敗した記事データ
            failure_reason: 失敗理由
            next_retry_time: 次回リトライ時刻
            provider_failures: プロバイダー別失敗回数
            
        Returns:
            RetryQueueItem: 新しいリトライキューアイテム
        """
        # RawNewsItemを辞書形式に変換
        article_data = {
            'id': raw_item.id,
            'title': raw_item.title,
            'url': raw_item.url,
            'published_at': raw_item.published_at.isoformat(),
            'content': raw_item.content,
            'source': {
                'url': raw_item.source.url,
                'category': raw_item.source.category,
                'language': raw_item.source.language,
                'name': raw_item.source.name,
                'enabled': raw_item.source.enabled
            }
        }
        
        return cls(
            id=raw_item.id,
            article_data=article_data,
            failure_reason=failure_reason,
            failure_timestamp=datetime.now(),
            retry_count=0,
            next_retry_time=next_retry_time,
            provider_failures=provider_failures or {},
            max_retries=5,
            created_at=datetime.now()
        )


@dataclass
class RetryQueue:
    """
    リトライキュー
    複数のRetryQueueItemを管理し、統計情報を提供
    """
    items: List[RetryQueueItem] = field(default_factory=list)  # キューアイテム
    last_updated: datetime = field(default_factory=datetime.now)  # 最終更新時刻
    total_processed: int = 0                   # 総処理数
    total_succeeded: int = 0                   # 総成功数
    total_failed: int = 0                      # 総失敗数
    
    def get_active_items(self) -> List[RetryQueueItem]:
        """
        アクティブなアイテムを取得（期限切れでないもの）
        
        Returns:
            List[RetryQueueItem]: アクティブなアイテムのリスト
        """
        return [item for item in self.items if not item.is_expired()]
    
    def get_retry_candidates(self) -> List[RetryQueueItem]:
        """
        リトライ対象アイテムを取得（現在リトライ可能なもの）
        
        Returns:
            List[RetryQueueItem]: リトライ対象アイテムのリスト
        """
        return [item for item in self.get_active_items() if item.can_retry_now()]
    
    def get_expired_items(self) -> List[RetryQueueItem]:
        """
        期限切れアイテムを取得
        
        Returns:
            List[RetryQueueItem]: 期限切れアイテムのリスト
        """
        return [item for item in self.items if item.is_expired()]
    
    def add_item(self, item: RetryQueueItem) -> None:
        """
        アイテムをキューに追加
        
        Args:
            item: 追加するRetryQueueItem
        """
        # 既存のアイテムがある場合は更新、なければ追加
        existing_index = None
        for i, existing_item in enumerate(self.items):
            if existing_item.id == item.id:
                existing_index = i
                break
        
        if existing_index is not None:
            self.items[existing_index] = item
        else:
            self.items.append(item)
        
        self.last_updated = datetime.now()
    
    def remove_item(self, item_id: str) -> bool:
        """
        アイテムをキューから削除
        
        Args:
            item_id: 削除するアイテムのID
            
        Returns:
            bool: 削除に成功した場合True
        """
        for i, item in enumerate(self.items):
            if item.id == item_id:
                del self.items[i]
                self.last_updated = datetime.now()
                return True
        return False
    
    def get_item_by_id(self, item_id: str) -> RetryQueueItem:
        """
        IDでアイテムを取得
        
        Args:
            item_id: 取得するアイテムのID
            
        Returns:
            RetryQueueItem: 見つかったアイテム、なければNone
        """
        for item in self.items:
            if item.id == item_id:
                return item
        return None
    
    def cleanup_old_entries(self, days: int = 7) -> int:
        """
        古いエントリをクリーンアップ
        
        Args:
            days: 保持日数
            
        Returns:
            int: 削除されたアイテム数
        """
        cutoff_date = datetime.now() - timedelta(days=days)
        initial_count = len(self.items)
        
        # 期限切れかつ古いアイテムを削除
        self.items = [
            item for item in self.items 
            if not (item.is_expired() and item.created_at < cutoff_date)
        ]
        
        removed_count = initial_count - len(self.items)
        if removed_count > 0:
            self.last_updated = datetime.now()
        
        return removed_count
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        キューの統計情報を取得
        
        Returns:
            Dict[str, Any]: 統計情報
        """
        active_items = self.get_active_items()
        retry_candidates = self.get_retry_candidates()
        expired_items = self.get_expired_items()
        
        # プロバイダー別失敗統計
        provider_stats = {}
        for item in self.items:
            for provider, count in item.provider_failures.items():
                if provider not in provider_stats:
                    provider_stats[provider] = 0
                provider_stats[provider] += count
        
        return {
            'total_items': len(self.items),
            'active_items': len(active_items),
            'retry_candidates': len(retry_candidates),
            'expired_items': len(expired_items),
            'total_processed': self.total_processed,
            'total_succeeded': self.total_succeeded,
            'total_failed': self.total_failed,
            'success_rate': self.total_succeeded / max(self.total_processed, 1),
            'provider_failures': provider_stats,
            'last_updated': self.last_updated.isoformat()
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """
        辞書形式に変換（JSON保存用）
        
        Returns:
            Dict[str, Any]: シリアライズ可能な辞書
        """
        return {
            'items': [item.to_dict() for item in self.items],
            'last_updated': self.last_updated.isoformat(),
            'total_processed': self.total_processed,
            'total_succeeded': self.total_succeeded,
            'total_failed': self.total_failed
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'RetryQueue':
        """
        辞書からRetryQueueを復元
        
        Args:
            data: シリアライズされた辞書データ
            
        Returns:
            RetryQueue: 復元されたオブジェクト
        """
        items = [RetryQueueItem.from_dict(item_data) for item_data in data.get('items', [])]
        
        return cls(
            items=items,
            last_updated=datetime.fromisoformat(data.get('last_updated', datetime.now().isoformat())),
            total_processed=data.get('total_processed', 0),
            total_succeeded=data.get('total_succeeded', 0),
            total_failed=data.get('total_failed', 0)
        )