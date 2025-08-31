#!/usr/bin/env python3
"""
監視機能テストスクリプト
メトリクス収集、ログ分析、ダッシュボード生成をテスト
"""

import asyncio
import sys
import time
from pathlib import Path
from datetime import datetime

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from shared.utils.metrics import MetricsCollector, get_metrics_collector, reset_metrics_collector
from shared.utils.logger import setup_advanced_logger, LogAnalyzer
from shared.utils.dashboard import generate_monitoring_dashboard


async def test_metrics_collection():
    """メトリクス収集機能をテスト"""
    print("=== メトリクス収集テスト ===")
    
    # メトリクスコレクターをリセット
    reset_metrics_collector()
    collector = get_metrics_collector()
    
    # 処理開始
    metrics = collector.start_processing()
    print(f"処理開始: {metrics.start_time}")
    
    # 模擬処理
    print("模擬処理を実行中...")
    
    # RSS収集の模擬
    with collector.timer("rss_collection"):
        await asyncio.sleep(1)  # 1秒の処理時間を模擬
        collector.increment_counter("articles_collected", 25)
    
    # AI処理の模擬
    with collector.timer("ai_processing"):
        await asyncio.sleep(2)  # 2秒の処理時間を模擬
        collector.increment_counter("articles_processed", 20)
        collector.increment_counter("articles_failed", 5)
        collector.increment_counter("api_calls_made", 4)
    
    # エラーと警告の追加
    collector.add_warning("テスト警告: RSS取得で一部ソースが応答しませんでした")
    collector.add_error("テストエラー: API制限に達しました")
    
    # システムメトリクス収集
    system_metrics = collector.collect_system_metrics()
    print(f"システムメトリクス - CPU: {system_metrics.cpu_percent:.1f}%, "
          f"メモリ: {system_metrics.memory_percent:.1f}%")
    
    # 処理終了
    final_metrics = collector.end_processing()
    if final_metrics:
        print(f"処理完了: {final_metrics.end_time}")
        print(f"処理時間: {final_metrics.duration_seconds:.2f}秒")
        print(f"成功率: {final_metrics.success_rate:.1%}")
        print(f"エラー数: {len(final_metrics.errors)}")
        print(f"警告数: {len(final_metrics.warnings)}")
    
    # システムメトリクスサマリー
    summary = collector.get_system_metrics_summary(hours=1)
    if summary:
        print(f"システムサマリー: CPU平均 {summary.get('cpu', {}).get('avg', 0):.1f}%")
    
    print("✓ メトリクス収集テスト完了\n")


def test_advanced_logging():
    """高度なログ機能をテスト"""
    print("=== 高度なログ機能テスト ===")
    
    # 高度なロガーを設定
    logger = setup_advanced_logger(
        "test_monitoring",
        level="INFO",
        enable_rotation=True,
        enable_error_notification=False,  # テストなので通知は無効
        max_bytes=1024*1024,  # 1MB
        backup_count=3
    )
    
    # 各レベルのログを出力
    logger.debug("デバッグメッセージ: 詳細な処理情報")
    logger.info("情報メッセージ: 処理が正常に開始されました")
    logger.warning("警告メッセージ: 一部のRSSソースが応答しません")
    logger.error("エラーメッセージ: API呼び出しが失敗しました")
    
    # 大量のログを生成してローテーションをテスト
    print("大量ログ生成中...")
    for i in range(100):
        logger.info(f"テストログメッセージ {i+1}: 処理中のアイテム数 {i*10}")
    
    print("✓ 高度なログ機能テスト完了\n")


def test_log_analysis():
    """ログ分析機能をテスト"""
    print("=== ログ分析テスト ===")
    
    analyzer = LogAnalyzer()
    
    # 過去24時間のログを分析
    analysis = analyzer.analyze_logs(hours=24)
    
    if 'error' in analysis:
        print(f"ログ分析エラー: {analysis['error']}")
    else:
        print(f"分析期間: {analysis.get('period_hours', 0)}時間")
        print(f"総ログ行数: {analysis.get('total_lines', 0):,}")
        
        levels = analysis.get('levels', {})
        print(f"ログレベル別:")
        for level, count in levels.items():
            if count > 0:
                print(f"  {level}: {count}")
        
        loggers = analysis.get('loggers', {})
        if loggers:
            print(f"ロガー別 (上位5件):")
            sorted_loggers = sorted(loggers.items(), key=lambda x: x[1], reverse=True)[:5]
            for logger_name, count in sorted_loggers:
                print(f"  {logger_name}: {count}")
        
        errors = analysis.get('errors', [])
        if errors:
            print(f"エラー数: {len(errors)}")
            if len(errors) <= 3:
                for error in errors:
                    print(f"  - {error[:100]}...")
    
    print("✓ ログ分析テスト完了\n")


async def test_dashboard_generation():
    """ダッシュボード生成をテスト"""
    print("=== ダッシュボード生成テスト ===")
    
    try:
        dashboard_path = generate_monitoring_dashboard()
        print(f"ダッシュボード生成成功: {dashboard_path}")
        
        # 生成されたファイルの存在確認
        dashboard_file = Path(dashboard_path)
        if dashboard_file.exists():
            file_size = dashboard_file.stat().st_size
            print(f"ファイルサイズ: {file_size:,} bytes")
            
            # HTMLファイルの基本的な内容チェック
            with open(dashboard_file, 'r', encoding='utf-8') as f:
                content = f.read()
                if '<title>' in content and 'ダッシュボード' in content:
                    print("✓ HTMLコンテンツが正常に生成されました")
                else:
                    print("⚠ HTMLコンテンツに問題がある可能性があります")
        else:
            print("⚠ ダッシュボードファイルが見つかりません")
        
        # JSONデータファイルの確認
        json_path = Path(dashboard_path).parent / "dashboard_data.json"
        if json_path.exists():
            print(f"✓ JSONデータファイルも生成されました: {json_path}")
        
    except Exception as e:
        print(f"ダッシュボード生成エラー: {e}")
        import traceback
        traceback.print_exc()
    
    print("✓ ダッシュボード生成テスト完了\n")


def test_error_scenarios():
    """エラーシナリオをテスト"""
    print("=== エラーシナリオテスト ===")
    
    logger = setup_advanced_logger("error_test", enable_error_notification=False)
    collector = get_metrics_collector()
    
    # 様々なエラーパターンをテスト
    test_errors = [
        "RSS収集エラー: タイムアウトが発生しました",
        "API呼び出しエラー: レート制限に達しました", 
        "データ保存エラー: ディスク容量不足です",
        "予期しないエラー: 不明な例外が発生しました"
    ]
    
    for error in test_errors:
        logger.error(error)
        collector.add_error(error)
    
    # 警告もテスト
    test_warnings = [
        "一部のRSSソースが応答しません",
        "処理時間が通常より長くかかっています",
        "メモリ使用量が高くなっています"
    ]
    
    for warning in test_warnings:
        logger.warning(warning)
        collector.add_warning(warning)
    
    print(f"✓ {len(test_errors)}個のエラーと{len(test_warnings)}個の警告を記録しました")
    print("✓ エラーシナリオテスト完了\n")


async def main():
    """メインテスト実行"""
    print("監視機能テストを開始します...\n")
    
    start_time = time.time()
    
    try:
        # 各テストを実行
        await test_metrics_collection()
        test_advanced_logging()
        test_log_analysis()
        await test_dashboard_generation()
        test_error_scenarios()
        
        # 最終的なダッシュボード生成
        print("=== 最終ダッシュボード生成 ===")
        final_dashboard = generate_monitoring_dashboard()
        print(f"最終ダッシュボード: {final_dashboard}")
        
        elapsed_time = time.time() - start_time
        print(f"\n✅ 全テスト完了 (実行時間: {elapsed_time:.2f}秒)")
        print(f"ダッシュボードURL: file://{Path(final_dashboard).absolute()}")
        
    except Exception as e:
        print(f"\n❌ テスト実行エラー: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())