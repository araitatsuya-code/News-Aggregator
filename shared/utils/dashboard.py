"""
パフォーマンス監視ダッシュボード
システムの状態を可視化するHTMLダッシュボードを生成
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
import base64
from io import BytesIO

from .metrics import MetricsCollector, get_metrics_collector
from .logger import LogAnalyzer, get_logger


class DashboardGenerator:
    """ダッシュボード生成クラス"""
    
    def __init__(self, 
                 output_dir: str = "frontend/public/data/dashboard",
                 metrics_dir: str = "frontend/public/data/metrics"):
        self.output_dir = Path(output_dir)
        self.metrics_dir = Path(metrics_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.logger = get_logger(self.__class__.__name__)
    
    def generate_dashboard(self) -> str:
        """ダッシュボードHTMLを生成"""
        try:
            # データを収集
            dashboard_data = self._collect_dashboard_data()
            
            # HTMLを生成
            html_content = self._generate_html(dashboard_data)
            
            # ファイルに保存
            dashboard_path = self.output_dir / "index.html"
            with open(dashboard_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            # JSONデータも保存
            json_path = self.output_dir / "dashboard_data.json"
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(dashboard_data, f, ensure_ascii=False, indent=2, default=str)
            
            self.logger.info(f"ダッシュボードを生成しました: {dashboard_path}")
            return str(dashboard_path)
            
        except Exception as e:
            self.logger.error(f"ダッシュボード生成エラー: {e}")
            raise
    
    def _collect_dashboard_data(self) -> Dict[str, Any]:
        """ダッシュボード用データを収集"""
        data = {
            'generated_at': datetime.now().isoformat(),
            'system_status': self._get_system_status(),
            'processing_metrics': self._get_processing_metrics(),
            'log_analysis': self._get_log_analysis(),
            'performance_trends': self._get_performance_trends(),
            'alerts': self._get_alerts()
        }
        return data
    
    def _get_system_status(self) -> Dict[str, Any]:
        """システム状態を取得"""
        try:
            collector = get_metrics_collector()
            current_metrics = collector.collect_system_metrics()
            summary = collector.get_system_metrics_summary(hours=24)
            
            return {
                'current': current_metrics.to_dict(),
                'summary_24h': summary,
                'status': self._determine_system_status(current_metrics, summary)
            }
        except Exception as e:
            self.logger.error(f"システム状態取得エラー: {e}")
            return {'error': str(e)}
    
    def _get_processing_metrics(self) -> Dict[str, Any]:
        """処理メトリクスを取得"""
        try:
            # 最新の処理メトリクスを読み込み
            latest_metrics_path = self.metrics_dir / "latest_metrics.json"
            if latest_metrics_path.exists():
                with open(latest_metrics_path, 'r', encoding='utf-8') as f:
                    latest_metrics = json.load(f)
            else:
                latest_metrics = None
            
            # 過去24時間のメトリクスを収集
            recent_metrics = self._get_recent_metrics(hours=24)
            
            return {
                'latest': latest_metrics,
                'recent_24h': recent_metrics,
                'trends': self._calculate_processing_trends(recent_metrics)
            }
        except Exception as e:
            self.logger.error(f"処理メトリクス取得エラー: {e}")
            return {'error': str(e)}
    
    def _get_log_analysis(self) -> Dict[str, Any]:
        """ログ分析結果を取得"""
        try:
            analyzer = LogAnalyzer()
            return analyzer.analyze_logs(hours=24)
        except Exception as e:
            self.logger.error(f"ログ分析エラー: {e}")
            return {'error': str(e)}
    
    def _get_performance_trends(self) -> Dict[str, Any]:
        """パフォーマンストレンドを取得"""
        try:
            # 過去7日間のメトリクスを分析
            trends = {
                'daily_processing': self._get_daily_processing_trends(days=7),
                'system_performance': self._get_system_performance_trends(days=7),
                'error_rates': self._get_error_rate_trends(days=7)
            }
            return trends
        except Exception as e:
            self.logger.error(f"パフォーマンストレンド取得エラー: {e}")
            return {'error': str(e)}
    
    def _get_alerts(self) -> List[Dict[str, Any]]:
        """アラートを生成"""
        alerts = []
        
        try:
            # システムメトリクスベースのアラート
            collector = get_metrics_collector()
            current_metrics = collector.collect_system_metrics()
            
            if current_metrics.cpu_percent > 80:
                alerts.append({
                    'level': 'warning',
                    'type': 'high_cpu',
                    'message': f'CPU使用率が高いです: {current_metrics.cpu_percent:.1f}%',
                    'timestamp': datetime.now().isoformat()
                })
            
            if current_metrics.memory_percent > 85:
                alerts.append({
                    'level': 'warning',
                    'type': 'high_memory',
                    'message': f'メモリ使用率が高いです: {current_metrics.memory_percent:.1f}%',
                    'timestamp': datetime.now().isoformat()
                })
            
            if current_metrics.disk_usage_percent > 90:
                alerts.append({
                    'level': 'critical',
                    'type': 'high_disk',
                    'message': f'ディスク使用率が危険レベルです: {current_metrics.disk_usage_percent:.1f}%',
                    'timestamp': datetime.now().isoformat()
                })
            
            # ログベースのアラート
            analyzer = LogAnalyzer()
            log_stats = analyzer.analyze_logs(hours=1)
            
            if log_stats.get('levels', {}).get('ERROR', 0) > 10:
                alerts.append({
                    'level': 'warning',
                    'type': 'high_error_rate',
                    'message': f'過去1時間でエラーが多発しています: {log_stats["levels"]["ERROR"]}件',
                    'timestamp': datetime.now().isoformat()
                })
            
            # 処理メトリクスベースのアラート
            latest_metrics_path = self.metrics_dir / "latest_metrics.json"
            if latest_metrics_path.exists():
                with open(latest_metrics_path, 'r', encoding='utf-8') as f:
                    latest_metrics = json.load(f)
                
                if latest_metrics.get('success_rate', 1.0) < 0.8:
                    alerts.append({
                        'level': 'warning',
                        'type': 'low_success_rate',
                        'message': f'処理成功率が低下しています: {latest_metrics["success_rate"]:.1%}',
                        'timestamp': datetime.now().isoformat()
                    })
            
        except Exception as e:
            self.logger.error(f"アラート生成エラー: {e}")
            alerts.append({
                'level': 'error',
                'type': 'system_error',
                'message': f'監視システムエラー: {e}',
                'timestamp': datetime.now().isoformat()
            })
        
        return alerts
    
    def _determine_system_status(self, current_metrics, summary) -> str:
        """システム状態を判定"""
        if current_metrics.cpu_percent > 90 or current_metrics.memory_percent > 95:
            return 'critical'
        elif current_metrics.cpu_percent > 70 or current_metrics.memory_percent > 80:
            return 'warning'
        else:
            return 'healthy'
    
    def _get_recent_metrics(self, hours: int = 24) -> List[Dict[str, Any]]:
        """最近のメトリクスを取得"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        metrics = []
        
        try:
            for metrics_file in self.metrics_dir.glob("metrics_*.json"):
                # ファイル名から日時を抽出
                filename = metrics_file.stem
                if filename.startswith("metrics_"):
                    try:
                        timestamp_str = filename[8:]  # "metrics_" を除去
                        file_time = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
                        
                        if file_time >= cutoff_time:
                            with open(metrics_file, 'r', encoding='utf-8') as f:
                                metric_data = json.load(f)
                                metrics.append(metric_data)
                    except (ValueError, json.JSONDecodeError):
                        continue
            
            # 時刻順にソート
            metrics.sort(key=lambda x: x.get('start_time', ''))
            
        except Exception as e:
            self.logger.error(f"最近のメトリクス取得エラー: {e}")
        
        return metrics
    
    def _calculate_processing_trends(self, metrics: List[Dict[str, Any]]) -> Dict[str, Any]:
        """処理トレンドを計算"""
        if not metrics:
            return {}
        
        success_rates = [m.get('success_rate', 0) for m in metrics]
        processing_times = [m.get('duration_seconds', 0) for m in metrics]
        article_counts = [m.get('articles_processed', 0) for m in metrics]
        
        return {
            'avg_success_rate': sum(success_rates) / len(success_rates) if success_rates else 0,
            'avg_processing_time': sum(processing_times) / len(processing_times) if processing_times else 0,
            'avg_articles_processed': sum(article_counts) / len(article_counts) if article_counts else 0,
            'total_articles': sum(article_counts),
            'trend_direction': self._calculate_trend_direction(success_rates)
        }
    
    def _calculate_trend_direction(self, values: List[float]) -> str:
        """トレンド方向を計算"""
        if len(values) < 2:
            return 'stable'
        
        recent_avg = sum(values[-3:]) / min(3, len(values))
        older_avg = sum(values[:-3]) / max(1, len(values) - 3) if len(values) > 3 else recent_avg
        
        if recent_avg > older_avg * 1.05:
            return 'improving'
        elif recent_avg < older_avg * 0.95:
            return 'declining'
        else:
            return 'stable'
    
    def _get_daily_processing_trends(self, days: int = 7) -> Dict[str, Any]:
        """日次処理トレンドを取得"""
        # 実装は簡略化 - 実際にはより詳細な分析が必要
        return {
            'period_days': days,
            'note': '日次トレンド分析は今後実装予定'
        }
    
    def _get_system_performance_trends(self, days: int = 7) -> Dict[str, Any]:
        """システムパフォーマンストレンドを取得"""
        # 実装は簡略化 - 実際にはより詳細な分析が必要
        return {
            'period_days': days,
            'note': 'システムパフォーマンストレンド分析は今後実装予定'
        }
    
    def _get_error_rate_trends(self, days: int = 7) -> Dict[str, Any]:
        """エラー率トレンドを取得"""
        # 実装は簡略化 - 実際にはより詳細な分析が必要
        return {
            'period_days': days,
            'note': 'エラー率トレンド分析は今後実装予定'
        }
    
    def _generate_html(self, data: Dict[str, Any]) -> str:
        """HTMLダッシュボードを生成"""
        # HTMLコンテンツを生成
        alerts_html = self._generate_alerts_html(data.get('alerts', []))
        system_status = data.get('system_status', {}).get('status', 'unknown')
        system_metrics_html = self._generate_system_metrics_html(data.get('system_status', {}))
        processing_metrics_html = self._generate_processing_metrics_html(data.get('processing_metrics', {}))
        log_analysis_html = self._generate_log_analysis_html(data.get('log_analysis', {}))
        performance_trends_html = self._generate_performance_trends_html(data.get('performance_trends', {}))
        
        html_content = f"""<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI News Aggregator - 監視ダッシュボード</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }}
        
        .header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
        }}
        
        .header .subtitle {{
            font-size: 1.2em;
            opacity: 0.9;
        }}
        
        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        
        .card {{
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s;
        }}
        
        .card:hover {{
            transform: translateY(-2px);
        }}
        
        .card h2 {{
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 1.4em;
            border-bottom: 2px solid #3498db;
            padding-bottom: 5px;
        }}
        
        .status-indicator {{
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }}
        
        .status-healthy {{ background-color: #27ae60; }}
        .status-warning {{ background-color: #f39c12; }}
        .status-critical {{ background-color: #e74c3c; }}
        
        .metric {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #ecf0f1;
        }}
        
        .metric:last-child {{
            border-bottom: none;
        }}
        
        .metric-label {{
            font-weight: 500;
            color: #34495e;
        }}
        
        .metric-value {{
            font-weight: bold;
            color: #2c3e50;
        }}
        
        .alert {{
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
        }}
        
        .alert-warning {{
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
        }}
        
        .alert-critical {{
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }}
        
        .alert-error {{
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }}
        
        .progress-bar {{
            width: 100%;
            height: 8px;
            background-color: #ecf0f1;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 5px;
        }}
        
        .progress-fill {{
            height: 100%;
            transition: width 0.3s ease;
        }}
        
        .progress-healthy {{ background-color: #27ae60; }}
        .progress-warning {{ background-color: #f39c12; }}
        .progress-critical {{ background-color: #e74c3c; }}
        
        .timestamp {{
            text-align: center;
            color: #7f8c8d;
            font-size: 0.9em;
            margin-top: 30px;
            padding: 15px;
            background: white;
            border-radius: 10px;
        }}
        
        .no-data {{
            text-align: center;
            color: #7f8c8d;
            font-style: italic;
            padding: 20px;
        }}
        
        @media (max-width: 768px) {{
            .container {{
                padding: 10px;
            }}
            
            .header {{
                padding: 20px;
            }}
            
            .header h1 {{
                font-size: 2em;
            }}
            
            .grid {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>AI News Aggregator</h1>
            <div class="subtitle">監視ダッシュボード</div>
        </div>
        
        <!-- アラート -->
        {alerts_html}
        
        <div class="grid">
            <!-- システム状態 -->
            <div class="card">
                <h2>
                    <span class="status-indicator status-{system_status}"></span>
                    システム状態
                </h2>
                {system_metrics_html}
            </div>
            
            <!-- 処理メトリクス -->
            <div class="card">
                <h2>処理メトリクス</h2>
                {processing_metrics_html}
            </div>
            
            <!-- ログ分析 -->
            <div class="card">
                <h2>ログ分析 (24時間)</h2>
                {log_analysis_html}
            </div>
            
            <!-- パフォーマンストレンド -->
            <div class="card">
                <h2>パフォーマンストレンド</h2>
                {performance_trends_html}
            </div>
        </div>
        
        <div class="timestamp">
            最終更新: {data.get('generated_at', 'Unknown')}
        </div>
    </div>
    
    <script>
        // 自動リフレッシュ (5分間隔)
        setTimeout(() => {{
            window.location.reload();
        }}, 5 * 60 * 1000);
    </script>
</body>
</html>"""
        
        return html_content

    
    def _generate_alerts_html(self, alerts: List[Dict[str, Any]]) -> str:
        """アラートHTMLを生成"""
        if not alerts:
            return ""
        
        html = ""
        for alert in alerts:
            level = alert.get('level', 'warning')
            message = alert.get('message', '')
            html += f'<div class="alert alert-{level}">{message}</div>'
        
        return f'<div style="margin-bottom: 20px;">{html}</div>'
    
    def _generate_system_metrics_html(self, system_data: Dict[str, Any]) -> str:
        """システムメトリクスHTMLを生成"""
        if 'error' in system_data:
            return f'<div class="no-data">エラー: {system_data["error"]}</div>'
        
        current = system_data.get('current', {})
        if not current:
            return '<div class="no-data">データがありません</div>'
        
        cpu_percent = current.get('cpu_percent', 0)
        memory_percent = current.get('memory_percent', 0)
        disk_percent = current.get('disk_usage_percent', 0)
        
        def get_progress_class(value):
            if value > 80:
                return 'progress-critical'
            elif value > 60:
                return 'progress-warning'
            else:
                return 'progress-healthy'
        
        html = f"""
        <div class="metric">
            <span class="metric-label">CPU使用率</span>
            <span class="metric-value">{cpu_percent:.1f}%</span>
        </div>
        <div class="progress-bar">
            <div class="progress-fill {get_progress_class(cpu_percent)}" style="width: {cpu_percent}%"></div>
        </div>
        
        <div class="metric">
            <span class="metric-label">メモリ使用率</span>
            <span class="metric-value">{memory_percent:.1f}%</span>
        </div>
        <div class="progress-bar">
            <div class="progress-fill {get_progress_class(memory_percent)}" style="width: {memory_percent}%"></div>
        </div>
        
        <div class="metric">
            <span class="metric-label">ディスク使用率</span>
            <span class="metric-value">{disk_percent:.1f}%</span>
        </div>
        <div class="progress-bar">
            <div class="progress-fill {get_progress_class(disk_percent)}" style="width: {disk_percent}%"></div>
        </div>
        """
        
        return html
    
    def _generate_processing_metrics_html(self, processing_data: Dict[str, Any]) -> str:
        """処理メトリクスHTMLを生成"""
        if 'error' in processing_data:
            return f'<div class="no-data">エラー: {processing_data["error"]}</div>'
        
        latest = processing_data.get('latest')
        if not latest:
            return '<div class="no-data">最新の処理データがありません</div>'
        
        success_rate = latest.get('success_rate', 0) * 100
        duration = latest.get('duration_seconds', 0)
        articles_processed = latest.get('articles_processed', 0)
        articles_collected = latest.get('articles_collected', 0)
        
        html = f"""
        <div class="metric">
            <span class="metric-label">成功率</span>
            <span class="metric-value">{success_rate:.1f}%</span>
        </div>
        <div class="metric">
            <span class="metric-label">処理時間</span>
            <span class="metric-value">{duration:.1f}秒</span>
        </div>
        <div class="metric">
            <span class="metric-label">処理記事数</span>
            <span class="metric-value">{articles_processed}/{articles_collected}</span>
        </div>
        <div class="metric">
            <span class="metric-label">API呼び出し</span>
            <span class="metric-value">{latest.get('api_calls_made', 0)}</span>
        </div>
        """
        
        return html
    
    def _generate_log_analysis_html(self, log_data: Dict[str, Any]) -> str:
        """ログ分析HTMLを生成"""
        if 'error' in log_data:
            return f'<div class="no-data">エラー: {log_data["error"]}</div>'
        
        levels = log_data.get('levels', {})
        total_lines = log_data.get('total_lines', 0)
        
        html = f"""
        <div class="metric">
            <span class="metric-label">総ログ行数</span>
            <span class="metric-value">{total_lines:,}</span>
        </div>
        <div class="metric">
            <span class="metric-label">エラー</span>
            <span class="metric-value">{levels.get('ERROR', 0) + levels.get('CRITICAL', 0)}</span>
        </div>
        <div class="metric">
            <span class="metric-label">警告</span>
            <span class="metric-value">{levels.get('WARNING', 0)}</span>
        </div>
        <div class="metric">
            <span class="metric-label">情報</span>
            <span class="metric-value">{levels.get('INFO', 0)}</span>
        </div>
        """
        
        return html
    
    def _generate_performance_trends_html(self, trends_data: Dict[str, Any]) -> str:
        """パフォーマンストレンドHTMLを生成"""
        if 'error' in trends_data:
            return f'<div class="no-data">エラー: {trends_data["error"]}</div>'
        
        # 簡略化された表示
        html = '<div class="no-data">トレンド分析機能は開発中です</div>'
        
        return html


def generate_monitoring_dashboard() -> str:
    """監視ダッシュボードを生成"""
    generator = DashboardGenerator()
    return generator.generate_dashboard()


if __name__ == "__main__":
    # テスト実行
    dashboard_path = generate_monitoring_dashboard()
    print(f"ダッシュボードが生成されました: {dashboard_path}")