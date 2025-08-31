"""
ログ設定モジュール
統一されたログ設定を提供
"""

import logging
import sys
import os
from datetime import datetime
from pathlib import Path
from typing import Optional


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
    logger.setLevel(getattr(logging, level.upper()))
    
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


class LoggerMixin:
    """ロガーミックスイン"""
    
    @property
    def logger(self) -> logging.Logger:
        """クラス名ベースのロガーを取得"""
        return get_logger(self.__class__.__name__)