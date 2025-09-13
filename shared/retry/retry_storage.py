"""
リトライキューのストレージ管理
JSONファイルへの保存・読み込み、ファイルロック、エラーハンドリングを提供
"""

import json
import os
import fcntl
import tempfile
import shutil
from pathlib import Path
from typing import Optional
from datetime import datetime
import logging

from .retry_queue import RetryQueue


class RetryStorage:
    """
    リトライキューのストレージ管理クラス
    JSONファイルへの安全な保存・読み込み機能を提供
    """
    
    def __init__(self, file_path: str = "data/retry_queue.json"):
        """
        初期化
        
        Args:
            file_path: 保存先ファイルパス
        """
        self.file_path = Path(file_path)
        self.logger = logging.getLogger(__name__)
        
        # ディレクトリが存在しない場合は作成
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
    
    def save_queue(self, queue: RetryQueue) -> bool:
        """
        キューをJSONファイルに保存
        ファイルロックを使用して安全に保存
        
        Args:
            queue: 保存するRetryQueue
            
        Returns:
            bool: 保存に成功した場合True
        """
        try:
            # 一時ファイルに書き込み後、アトミックに移動
            temp_file = None
            with tempfile.NamedTemporaryFile(
                mode='w', 
                dir=self.file_path.parent, 
                delete=False,
                encoding='utf-8'
            ) as temp_file:
                # キューを辞書形式に変換してJSON保存
                queue_data = queue.to_dict()
                
                # メタデータを追加
                save_data = {
                    'version': '1.0',
                    'saved_at': datetime.now().isoformat(),
                    'queue': queue_data
                }
                
                json.dump(save_data, temp_file, ensure_ascii=False, indent=2)
                temp_file.flush()
                os.fsync(temp_file.fileno())
            
            # アトミックに移動
            shutil.move(temp_file.name, self.file_path)
            
            self.logger.info(f"リトライキューを保存しました: {self.file_path} (アイテム数: {len(queue.items)})")
            return True
            
        except Exception as e:
            self.logger.error(f"リトライキューの保存に失敗しました: {e}")
            
            # 一時ファイルのクリーンアップ
            if temp_file and os.path.exists(temp_file.name):
                try:
                    os.unlink(temp_file.name)
                except:
                    pass
            
            return False
    
    def load_queue(self) -> Optional[RetryQueue]:
        """
        JSONファイルからキューを読み込み
        ファイルロックを使用して安全に読み込み
        
        Returns:
            Optional[RetryQueue]: 読み込まれたキュー、失敗時はNone
        """
        if not self.file_path.exists():
            self.logger.info(f"リトライキューファイルが存在しません。新しいキューを作成します: {self.file_path}")
            return RetryQueue()
        
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                # ファイルロックを取得
                fcntl.flock(f.fileno(), fcntl.LOCK_SH)
                
                try:
                    data = json.load(f)
                    
                    # バージョンチェック
                    version = data.get('version', '1.0')
                    if version != '1.0':
                        self.logger.warning(f"未対応のファイルバージョンです: {version}")
                    
                    # キューデータを取得
                    queue_data = data.get('queue', {})
                    queue = RetryQueue.from_dict(queue_data)
                    
                    self.logger.info(f"リトライキューを読み込みました: {self.file_path} (アイテム数: {len(queue.items)})")
                    return queue
                    
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)
                    
        except json.JSONDecodeError as e:
            self.logger.error(f"JSONファイルの形式が不正です: {e}")
            # バックアップを作成して新しいキューを返す
            self._create_backup()
            return RetryQueue()
            
        except Exception as e:
            self.logger.error(f"リトライキューの読み込みに失敗しました: {e}")
            return None
    
    def backup_queue(self) -> bool:
        """
        現在のキューファイルをバックアップ
        
        Returns:
            bool: バックアップに成功した場合True
        """
        if not self.file_path.exists():
            return True
        
        try:
            backup_path = self._get_backup_path()
            shutil.copy2(self.file_path, backup_path)
            self.logger.info(f"リトライキューをバックアップしました: {backup_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"バックアップの作成に失敗しました: {e}")
            return False
    
    def cleanup_old_entries(self, days: int = 7) -> bool:
        """
        古いエントリのクリーンアップ
        キューを読み込み、古いエントリを削除して保存し直す
        
        Args:
            days: 保持日数
            
        Returns:
            bool: クリーンアップに成功した場合True
        """
        try:
            queue = self.load_queue()
            if queue is None:
                return False
            
            removed_count = queue.cleanup_old_entries(days)
            
            if removed_count > 0:
                success = self.save_queue(queue)
                if success:
                    self.logger.info(f"古いエントリを削除しました: {removed_count}件")
                return success
            else:
                self.logger.debug("削除対象の古いエントリはありませんでした")
                return True
                
        except Exception as e:
            self.logger.error(f"古いエントリのクリーンアップに失敗しました: {e}")
            return False
    
    def get_file_info(self) -> dict:
        """
        ファイル情報を取得
        
        Returns:
            dict: ファイル情報
        """
        if not self.file_path.exists():
            return {
                'exists': False,
                'path': str(self.file_path)
            }
        
        try:
            stat = self.file_path.stat()
            return {
                'exists': True,
                'path': str(self.file_path),
                'size': stat.st_size,
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'created': datetime.fromtimestamp(stat.st_ctime).isoformat()
            }
        except Exception as e:
            self.logger.error(f"ファイル情報の取得に失敗しました: {e}")
            return {
                'exists': True,
                'path': str(self.file_path),
                'error': str(e)
            }
    
    def _create_backup(self) -> None:
        """
        破損したファイルのバックアップを作成
        """
        try:
            if self.file_path.exists():
                backup_path = self._get_backup_path(suffix='_corrupted')
                shutil.copy2(self.file_path, backup_path)
                self.logger.info(f"破損したファイルをバックアップしました: {backup_path}")
        except Exception as e:
            self.logger.error(f"破損ファイルのバックアップに失敗しました: {e}")
    
    def _get_backup_path(self, suffix: str = '') -> Path:
        """
        バックアップファイルのパスを生成
        
        Args:
            suffix: ファイル名に追加するサフィックス
            
        Returns:
            Path: バックアップファイルのパス
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_name = f"{self.file_path.stem}_backup_{timestamp}{suffix}{self.file_path.suffix}"
        return self.file_path.parent / backup_name
    
    def validate_queue_file(self) -> bool:
        """
        キューファイルの整合性をチェック
        
        Returns:
            bool: ファイルが有効な場合True
        """
        try:
            queue = self.load_queue()
            return queue is not None
        except Exception:
            return False
    
    def repair_queue_file(self) -> bool:
        """
        破損したキューファイルの修復を試行
        
        Returns:
            bool: 修復に成功した場合True
        """
        try:
            # バックアップを作成
            self._create_backup()
            
            # 新しい空のキューを作成
            new_queue = RetryQueue()
            success = self.save_queue(new_queue)
            
            if success:
                self.logger.info("キューファイルを修復しました（空のキューで初期化）")
            
            return success
            
        except Exception as e:
            self.logger.error(f"キューファイルの修復に失敗しました: {e}")
            return False