"""
ログ設定モジュール
統一されたログ設定を提供
ログローテーションとエラー通知機能を含む
"""

import logging
import logging.handlers
import sys
import os
import smtplib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json
import threading
from collections import deque


def setup_logger(
    name: str, 
    level: str = "INFO",
    log_dir: str = "logs",
    console_output: bool = True
) -> logging.Logger:
    """
    ロガーを設定
    
    Args:
        name: ロガー名
        level: ログレベル
        log_dir: ログディレクトリ
        console_output: コンソール出力の有無
    
    Returns:
        設定済みロガー
    """
    logger = logging.getLogger(name)
    
    # 既存のハンドラをクリア
    logger.handlers.clear()
    
    # ログレベル設定
    if isinstance(level, str):
        logger.setLevel(getattr(logging, level.upper()))
    else:
        logger.setLevel(level)
    
    # フォーマッター
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
    )
    
    # コンソールハンドラ
    if console_output:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(
            logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
        )
        logger.addHandler(console_handler)
    
    # ファイルハンドラ
    log_path = Path(log_dir)
    log_path.mkdir(exist_ok=True)
    
    log_file = log_path / f'{name}_{datetime.now().strftime("%Y%m%d")}.log'
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # 親ロガーへの伝播を防ぐ
    logger.propagate = False
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    既存のロガーを取得、なければデフォルト設定で作成
    
    Args:
        name: ロガー名
    
    Returns:
        ロガー
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        # デフォルト設定でセットアップ
        log_level = os.getenv('LOG_LEVEL', 'INFO')
        log_dir = os.getenv('LOG_DIR', 'logs')
        return setup_logger(name, log_level, log_dir)
    return logger


class ErrorNotificationHandler(logging.Handler):
    """エラー通知ハンドラー"""
    
    def __init__(self, 
                 smtp_host: str = None,
                 smtp_port: int = 587,
                 smtp_user: str = None,
                 smtp_password: str = None,
                 to_emails: List[str] = None,
                 level: int = logging.ERROR):
        super().__init__(level)
        self.smtp_host = smtp_host or os.getenv('SMTP_HOST')
        self.smtp_port = smtp_port
        self.smtp_user = smtp_user or os.getenv('SMTP_USER')
        self.smtp_password = smtp_password or os.getenv('SMTP_PASSWORD')
        self.to_emails = to_emails or []
        
        # エラー通知の制限（同じエラーを短時間で複数回送信しない）
        self.error_cache = deque(maxlen=100)
        self.cache_duration = timedelta(minutes=30)
        self.lock = threading.Lock()
    
    def emit(self, record: logging.LogRecord):
        """ログレコードを処理してエラー通知を送信"""
        if not self._should_send_notification(record):
            return
        
        try:
            self._send_email_notification(record)
        except Exception as e:
            # 通知送信エラーは標準エラー出力に記録
            print(f"エラー通知送信失敗: {e}", file=sys.stderr)
    
    def _should_send_notification(self, record: logging.LogRecord) -> bool:
        """通知を送信すべきかチェック"""
        if not all([self.smtp_host, self.smtp_user, self.smtp_password, self.to_emails]):
            return False
        
        # エラーメッセージのハッシュを作成
        error_key = f"{record.levelname}:{record.getMessage()}"
        current_time = datetime.now()
        
        with self.lock:
            # 最近同じエラーが送信されていないかチェック
            for cached_time, cached_key in self.error_cache:
                if (cached_key == error_key and 
                    current_time - cached_time < self.cache_duration):
                    return False
            
            # キャッシュに追加
            self.error_cache.append((current_time, error_key))
            return True
    
    def _send_email_notification(self, record: logging.LogRecord):
        """メール通知を送信"""
        subject = f"[AI News Aggregator] {record.levelname}: {record.name}"
        
        body = f"""
エラーが発生しました:

時刻: {datetime.fromtimestamp(record.created).strftime('%Y-%m-%d %H:%M:%S')}
レベル: {record.levelname}
ロガー: {record.name}
ファイル: {record.pathname}:{record.lineno}
関数: {record.funcName}

メッセージ:
{record.getMessage()}

スタックトレース:
{self.format(record)}
"""
        
        msg = MIMEMultipart()
        msg['From'] = self.smtp_user
        msg['To'] = ', '.join(self.to_emails)
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)


class LogRotationManager:
    """ログローテーション管理クラス"""
    
    def __init__(self, log_dir: str = "logs", max_bytes: int = 10*1024*1024, backup_count: int = 5):
        self.log_dir = Path(log_dir)
        self.max_bytes = max_bytes  # 10MB
        self.backup_count = backup_count
        self.log_dir.mkdir(exist_ok=True)
    
    def create_rotating_handler(self, filename: str) -> logging.handlers.RotatingFileHandler:
        """ローテーション対応ファイルハンドラーを作成"""
        log_path = self.log_dir / filename
        handler = logging.handlers.RotatingFileHandler(
            log_path,
            maxBytes=self.max_bytes,
            backupCount=self.backup_count,
            encoding='utf-8'
        )
        return handler
    
    def cleanup_old_logs(self, days: int = 30):
        """古いログファイルを削除"""
        cutoff_date = datetime.now() - timedelta(days=days)
        deleted_count = 0
        
        try:
            for log_file in self.log_dir.glob("*.log*"):
                if log_file.stat().st_mtime < cutoff_date.timestamp():
                    log_file.unlink()
                    deleted_count += 1
            
            if deleted_count > 0:
                print(f"{deleted_count}個の古いログファイルを削除しました")
                
        except Exception as e:
            print(f"ログクリーンアップエラー: {e}", file=sys.stderr)


def setup_advanced_logger(
    name: str,
    level: str = "INFO",
    log_dir: str = "logs",
    console_output: bool = True,
    enable_rotation: bool = True,
    enable_error_notification: bool = False,
    max_bytes: int = 10*1024*1024,
    backup_count: int = 5
) -> logging.Logger:
    """
    高度なロガーを設定（ローテーション・通知機能付き）
    
    Args:
        name: ロガー名
        level: ログレベル
        log_dir: ログディレクトリ
        console_output: コンソール出力の有無
        enable_rotation: ローテーション機能の有無
        enable_error_notification: エラー通知機能の有無
        max_bytes: ローテーション最大サイズ
        backup_count: バックアップファイル数
    
    Returns:
        設定済みロガー
    """
    logger = logging.getLogger(name)
    
    # 既存のハンドラをクリア
    logger.handlers.clear()
    
    # ログレベル設定
    if isinstance(level, str):
        logger.setLevel(getattr(logging, level.upper()))
    else:
        logger.setLevel(level)
    
    # フォーマッター
    detailed_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
    )
    simple_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # コンソールハンドラ
    if console_output:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(simple_formatter)
        logger.addHandler(console_handler)
    
    # ファイルハンドラ（ローテーション対応）
    log_path = Path(log_dir)
    log_path.mkdir(exist_ok=True)
    
    if enable_rotation:
        rotation_manager = LogRotationManager(log_dir, max_bytes, backup_count)
        file_handler = rotation_manager.create_rotating_handler(f'{name}.log')
    else:
        log_file = log_path / f'{name}_{datetime.now().strftime("%Y%m%d")}.log'
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
    
    file_handler.setFormatter(detailed_formatter)
    logger.addHandler(file_handler)
    
    # エラー通知ハンドラ
    if enable_error_notification:
        notification_handler = ErrorNotificationHandler()
        notification_handler.setFormatter(detailed_formatter)
        logger.addHandler(notification_handler)
    
    # 親ロガーへの伝播を防ぐ
    logger.propagate = False
    
    return logger


class LogAnalyzer:
    """ログ分析クラス"""
    
    def __init__(self, log_dir: str = "logs"):
        self.log_dir = Path(log_dir)
    
    def analyze_logs(self, hours: int = 24) -> Dict[str, Any]:
        """ログを分析してサマリーを作成"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        stats = {
            'period_hours': hours,
            'total_lines': 0,
            'levels': {'DEBUG': 0, 'INFO': 0, 'WARNING': 0, 'ERROR': 0, 'CRITICAL': 0},
            'loggers': {},
            'errors': [],
            'warnings': []
        }
        
        try:
            for log_file in self.log_dir.glob("*.log"):
                self._analyze_log_file(log_file, cutoff_time, stats)
            
            return stats
            
        except Exception as e:
            return {'error': f"ログ分析エラー: {e}"}
    
    def _analyze_log_file(self, log_file: Path, cutoff_time: datetime, stats: Dict[str, Any]):
        """個別ログファイルを分析"""
        try:
            with open(log_file, 'r', encoding='utf-8') as f:
                for line in f:
                    if not line.strip():
                        continue
                    
                    stats['total_lines'] += 1
                    
                    # ログレベルを抽出
                    for level in stats['levels'].keys():
                        if f' - {level} - ' in line:
                            stats['levels'][level] += 1
                            
                            # エラーと警告を記録
                            if level in ['ERROR', 'CRITICAL']:
                                stats['errors'].append(line.strip())
                            elif level == 'WARNING':
                                stats['warnings'].append(line.strip())
                            break
                    
                    # ロガー名を抽出
                    parts = line.split(' - ')
                    if len(parts) >= 3:
                        logger_name = parts[1]
                        stats['loggers'][logger_name] = stats['loggers'].get(logger_name, 0) + 1
                        
        except Exception as e:
            stats['errors'].append(f"ファイル分析エラー {log_file}: {e}")


class LoggerMixin:
    """ロガーミックスイン"""
    
    @property
    def logger(self) -> logging.Logger:
        """クラス名ベースのロガーを取得"""
        return get_logger(self.__class__.__name__)