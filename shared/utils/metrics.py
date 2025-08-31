"""
処理メトリクス収集モジュール
システムの処理状況を監視・記録する
"""

import json
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
from contextlib import contextmanager
import psutil
import threading
from collections import defaultdict

from .logger import get_logger


@dataclass
class ProcessingMetrics:
    """処理メトリクス"""
    start_time: datetime
    end_time: Optional[datetime] = None
    articles_collected: int = 0
    articles_processed: int = 0
    articles_failed: int = 0
    api_calls_made: int = 0
    api_calls_failed: int = 0
    errors: List[str] = None
    warnings: List[str] = None
    memory_usage_mb: float = 0.0
    cpu_usage_percent: float = 0.0
    processing_time_seconds: float = 0.0
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []
        if self.warnings is None:
            self.warnings = []
    
    @property
    def duration_seconds(self) -> float:
        """処理時間を秒で取得"""
        if self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return (datetime.now() - self.start_time).total_seconds()
    
    @property
    def success_rate(self) -> float:
        """成功率を計算"""
        if self.articles_collected == 0:
            return 0.0
        return self.articles_processed / self.articles_collected
    
    @property
    def api_success_rate(self) -> float:
        """API成功率を計算"""
        if self.api_calls_made == 0:
            return 0.0
        return (self.api_calls_made - self.api_calls_failed) / self.api_calls_made
    
    def to_dict(self) -> Dict[str, Any]:
        """辞書形式に変換"""
        data = asdict(self)
        data.update({
            'duration_seconds': self.duration_seconds,
            'success_rate': self.success_rate,
            'api_success_rate': self.api_success_rate,
            'error_count': len(self.errors),
            'warning_count': len(self.warnings)
        })
        # datetime オブジェクトを文字列に変換
        data['start_time'] = self.start_time.isoformat()
        if self.end_time:
            data['end_time'] = self.end_time.isoformat()
        return data


@dataclass
class SystemMetrics:
    """システムメトリクス"""
    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    memory_available_mb: float
    disk_usage_percent: float
    disk_free_gb: float
    
    def to_dict(self) -> Dict[str, Any]:
        """辞書形式に変換"""
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data


class MetricsCollector:
    """メトリクス収集クラス"""
    
    def __init__(self, output_dir: str = "frontend/public/data/metrics"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.logger = get_logger(self.__class__.__name__)
        
        # 現在の処理メトリクス
        self.current_metrics: Optional[ProcessingMetrics] = None
        
        # システムメトリクス履歴
        self.system_metrics_history: List[SystemMetrics] = []
        self.max_history_size = 1000
        
        # カウンター
        self._counters = defaultdict(int)
        self._timers = {}
        
        # スレッドロック
        self._lock = threading.Lock()
    
    def start_processing(self) -> ProcessingMetrics:
        """処理開始"""
        with self._lock:
            self.current_metrics = ProcessingMetrics(start_time=datetime.now())
            self.logger.info("処理メトリクス収集を開始しました")
            return self.current_metrics
    
    def end_processing(self) -> Optional[ProcessingMetrics]:
        """処理終了"""
        with self._lock:
            if self.current_metrics:
                self.current_metrics.end_time = datetime.now()
                self.current_metrics.memory_usage_mb = psutil.Process().memory_info().rss / 1024 / 1024
                self.current_metrics.cpu_usage_percent = psutil.cpu_percent()
                
                # メトリクスを保存
                self._save_processing_metrics(self.current_metrics)
                
                self.logger.info(
                    f"処理完了 - 時間: {self.current_metrics.duration_seconds:.2f}秒, "
                    f"成功率: {self.current_metrics.success_rate:.2%}"
                )
                
                return self.current_metrics
            return None
    
    def increment_counter(self, name: str, value: int = 1):
        """カウンターを増加"""
        with self._lock:
            self._counters[name] += value
            
            # 現在のメトリクスに反映
            if self.current_metrics:
                if name == "articles_collected":
                    self.current_metrics.articles_collected += value
                elif name == "articles_processed":
                    self.current_metrics.articles_processed += value
                elif name == "articles_failed":
                    self.current_metrics.articles_failed += value
                elif name == "api_calls_made":
                    self.current_metrics.api_calls_made += value
                elif name == "api_calls_failed":
                    self.current_metrics.api_calls_failed += value
    
    def add_error(self, error: str):
        """エラーを追加"""
        with self._lock:
            if self.current_metrics:
                self.current_metrics.errors.append(error)
                self.logger.error(f"メトリクスエラー記録: {error}")
    
    def add_warning(self, warning: str):
        """警告を追加"""
        with self._lock:
            if self.current_metrics:
                self.current_metrics.warnings.append(warning)
                self.logger.warning(f"メトリクス警告記録: {warning}")
    
    @contextmanager
    def timer(self, name: str):
        """処理時間測定コンテキストマネージャー"""
        start_time = time.time()
        try:
            yield
        finally:
            elapsed = time.time() - start_time
            with self._lock:
                self._timers[name] = elapsed
                self.logger.debug(f"タイマー '{name}': {elapsed:.3f}秒")
    
    def collect_system_metrics(self) -> SystemMetrics:
        """システムメトリクスを収集"""
        try:
            # CPU使用率
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # メモリ情報
            memory = psutil.virtual_memory()
            
            # ディスク情報
            disk = psutil.disk_usage('/')
            
            metrics = SystemMetrics(
                timestamp=datetime.now(),
                cpu_percent=cpu_percent,
                memory_percent=memory.percent,
                memory_used_mb=memory.used / 1024 / 1024,
                memory_available_mb=memory.available / 1024 / 1024,
                disk_usage_percent=disk.percent,
                disk_free_gb=disk.free / 1024 / 1024 / 1024
            )
            
            # 履歴に追加
            with self._lock:
                self.system_metrics_history.append(metrics)
                if len(self.system_metrics_history) > self.max_history_size:
                    self.system_metrics_history.pop(0)
            
            return metrics
            
        except Exception as e:
            self.logger.error(f"システムメトリクス収集エラー: {e}")
            raise
    
    def get_current_metrics(self) -> Optional[ProcessingMetrics]:
        """現在のメトリクスを取得"""
        return self.current_metrics
    
    def get_system_metrics_summary(self, hours: int = 24) -> Dict[str, Any]:
        """システムメトリクスのサマリーを取得"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        with self._lock:
            recent_metrics = [
                m for m in self.system_metrics_history 
                if m.timestamp >= cutoff_time
            ]
        
        if not recent_metrics:
            return {}
        
        cpu_values = [m.cpu_percent for m in recent_metrics]
        memory_values = [m.memory_percent for m in recent_metrics]
        
        return {
            'period_hours': hours,
            'sample_count': len(recent_metrics),
            'cpu': {
                'avg': sum(cpu_values) / len(cpu_values),
                'max': max(cpu_values),
                'min': min(cpu_values)
            },
            'memory': {
                'avg': sum(memory_values) / len(memory_values),
                'max': max(memory_values),
                'min': min(memory_values)
            },
            'latest': recent_metrics[-1].to_dict() if recent_metrics else None
        }
    
    def _save_processing_metrics(self, metrics: ProcessingMetrics):
        """処理メトリクスをファイルに保存"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"metrics_{timestamp}.json"
            filepath = self.output_dir / filename
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(metrics.to_dict(), f, ensure_ascii=False, indent=2)
            
            # 最新メトリクスも保存
            latest_path = self.output_dir / "latest_metrics.json"
            with open(latest_path, 'w', encoding='utf-8') as f:
                json.dump(metrics.to_dict(), f, ensure_ascii=False, indent=2)
            
            self.logger.info(f"処理メトリクスを保存しました: {filepath}")
            
        except Exception as e:
            self.logger.error(f"メトリクス保存エラー: {e}")
    
    def save_system_metrics(self):
        """システムメトリクスをファイルに保存"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"system_metrics_{timestamp}.json"
            filepath = self.output_dir / filename
            
            with self._lock:
                data = {
                    'timestamp': datetime.now().isoformat(),
                    'metrics': [m.to_dict() for m in self.system_metrics_history]
                }
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            self.logger.info(f"システムメトリクスを保存しました: {filepath}")
            
        except Exception as e:
            self.logger.error(f"システムメトリクス保存エラー: {e}")
    
    def cleanup_old_metrics(self, days: int = 30):
        """古いメトリクスファイルを削除"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            deleted_count = 0
            
            for file_path in self.output_dir.glob("metrics_*.json"):
                if file_path.stat().st_mtime < cutoff_date.timestamp():
                    file_path.unlink()
                    deleted_count += 1
            
            if deleted_count > 0:
                self.logger.info(f"{deleted_count}個の古いメトリクスファイルを削除しました")
                
        except Exception as e:
            self.logger.error(f"メトリクスクリーンアップエラー: {e}")


# グローバルメトリクスコレクター
_global_collector: Optional[MetricsCollector] = None


def get_metrics_collector() -> MetricsCollector:
    """グローバルメトリクスコレクターを取得"""
    global _global_collector
    if _global_collector is None:
        _global_collector = MetricsCollector()
    return _global_collector


def reset_metrics_collector():
    """グローバルメトリクスコレクターをリセット"""
    global _global_collector
    _global_collector = None