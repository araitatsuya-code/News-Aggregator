#!/usr/bin/env python3
"""
並列デプロイメント機能の統合テスト
要件1, 要件2, 要件3, 要件4に対応
"""

import asyncio
import json
import os
import subprocess
import tempfile
import time
import unittest
from pathlib import Path
from typing import Dict, List, Optional


class ParallelDeploymentTest(unittest.TestCase):
    """並列デプロイメント機能のテストクラス"""
    
    def setUp(self):
        """テスト前の準備"""
        self.project_root = Path(__file__).parent.parent.parent
        self.scripts_dir = self.project_root / "scripts"
        self.test_data_dir = Path(tempfile.mkdtemp())
        self.test_logs_dir = self.test_data_dir / "logs"
        self.test_logs_dir.mkdir(exist_ok=True)
        
        # テスト用環境変数を設定
        self.test_env = os.environ.copy()
        self.test_env.update({
            'MAX_PARALLEL_JOBS': '2',
            'OPTIMIZATION_ENABLED': 'true',
            'PARALLEL_DATA_PROCESSING': 'true',
            'PARALLEL_FILE_OPERATIONS': 'true',
            'CONCURRENT_VALIDATIONS': 'true'
        })
        
        print(f"テストデータディレクトリ: {self.test_data_dir}")
    
    def tearDown(self):
        """テスト後のクリーンアップ"""
        import shutil
        if self.test_data_dir.exists():
            shutil.rmtree(self.test_data_dir)
    
    def run_shell_script(self, script_path: str, args: List[str] = None, 
                        timeout: int = 300) -> subprocess.CompletedProcess:
        """シェルスクリプトを実行"""
        if args is None:
            args = []
        
        cmd = ['bash', str(script_path)] + args
        
        try:
            result = subprocess.run(
                cmd,
                cwd=self.project_root,
                env=self.test_env,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return result
        except subprocess.TimeoutExpired as e:
            self.fail(f"スクリプト実行がタイムアウトしました: {script_path} (timeout: {timeout}s)")
    
    def test_parallel_processor_initialization(self):
        """並列処理ユーティリティの初期化テスト"""
        script_path = self.scripts_dir / "utils" / "parallel-processor.sh"
        
        # スクリプトが存在することを確認
        self.assertTrue(script_path.exists(), f"並列処理スクリプトが見つかりません: {script_path}")
        
        # スクリプトが実行可能であることを確認
        self.assertTrue(os.access(script_path, os.X_OK), "並列処理スクリプトが実行可能ではありません")
        
        # ヘルプメッセージが表示されることを確認
        result = self.run_shell_script(script_path, timeout=30)
        self.assertEqual(result.returncode, 0, f"並列処理スクリプトの実行に失敗: {result.stderr}")
        self.assertIn("並列処理ユーティリティ", result.stdout, "ヘルプメッセージが正しく表示されません")
    
    def test_deployment_optimizer_initialization(self):
        """デプロイメント最適化ユーティリティの初期化テスト"""
        script_path = self.scripts_dir / "utils" / "deployment-optimizer.sh"
        
        # スクリプトが存在することを確認
        self.assertTrue(script_path.exists(), f"最適化スクリプトが見つかりません: {script_path}")
        
        # スクリプトが実行可能であることを確認
        self.assertTrue(os.access(script_path, os.X_OK), "最適化スクリプトが実行可能ではありません")
        
        # ヘルプメッセージが表示されることを確認
        result = self.run_shell_script(script_path, timeout=30)
        self.assertEqual(result.returncode, 0, f"最適化スクリプトの実行に失敗: {result.stderr}")
        self.assertIn("デプロイメント最適化ユーティリティ", result.stdout, "ヘルプメッセージが正しく表示されません")
    
    def test_parallel_file_operations(self):
        """並列ファイル操作のテスト"""
        # テスト用ファイルを作成
        test_files_dir = self.test_data_dir / "test_files"
        test_files_dir.mkdir()
        
        # テスト用JSONファイルを作成
        for i in range(5):
            test_file = test_files_dir / f"test_{i}.json"
            test_data = {"test_id": i, "data": f"test data {i}"}
            with open(test_file, 'w') as f:
                json.dump(test_data, f)
        
        # 並列処理テストスクリプトを作成
        test_script = self.test_data_dir / "test_parallel_ops.sh"
        with open(test_script, 'w') as f:
            f.write(f"""#!/bin/bash
set -e

# プロジェクトルートに移動
cd "{self.project_root}"

# 並列処理ユーティリティを読み込み
source scripts/utils/parallel-processor.sh

# 並列処理を初期化
init_parallel_processor

# 並列JSON検証を実行
parallel_json_validation "{test_files_dir}/*.json" "テスト用JSON検証"

# 結果を表示
show_parallel_results
""")
        
        os.chmod(test_script, 0o755)
        
        # テストスクリプトを実行
        result = self.run_shell_script(test_script, timeout=60)
        
        # 実行結果を確認
        self.assertEqual(result.returncode, 0, f"並列ファイル操作テストに失敗: {result.stderr}")
        self.assertIn("並列ジョブ実行結果", result.stdout, "並列処理結果が表示されません")
    
    def test_deployment_pipeline_optimization(self):
        """デプロイメントパイプライン最適化のテスト"""
        # 最適化テストスクリプトを作成
        test_script = self.test_data_dir / "test_optimization.sh"
        with open(test_script, 'w') as f:
            f.write(f"""#!/bin/bash
set -e

# プロジェクトルートに移動
cd "{self.project_root}"

# 最適化ユーティリティを読み込み
source scripts/utils/deployment-optimizer.sh

# 最適化を初期化
init_deployment_optimizer

# データのみパイプライン最適化をテスト
optimize_deployment_pipeline "data-only"

# 最適化サマリーを表示
show_optimization_summary
""")
        
        os.chmod(test_script, 0o755)
        
        # テストスクリプトを実行
        result = self.run_shell_script(test_script, timeout=120)
        
        # 実行結果を確認
        self.assertEqual(result.returncode, 0, f"パイプライン最適化テストに失敗: {result.stderr}")
        self.assertIn("デプロイメント最適化サマリー", result.stdout, "最適化サマリーが表示されません")
    
    def test_performance_measurement(self):
        """パフォーマンス測定機能のテスト"""
        # パフォーマンステストスクリプトを作成
        test_script = self.test_data_dir / "test_performance.sh"
        with open(test_script, 'w') as f:
            f.write(f"""#!/bin/bash
set -e

# プロジェクトルートに移動
cd "{self.project_root}"

# 最適化ユーティリティを読み込み
source scripts/utils/deployment-optimizer.sh

# 最適化を初期化
init_deployment_optimizer

# パフォーマンス測定テスト
measure_performance "test_operation" "sleep 1"
measure_performance "test_command" "echo 'test'"

# 最適化サマリーを表示
show_optimization_summary
""")
        
        os.chmod(test_script, 0o755)
        
        # テストスクリプトを実行
        result = self.run_shell_script(test_script, timeout=60)
        
        # 実行結果を確認
        self.assertEqual(result.returncode, 0, f"パフォーマンス測定テストに失敗: {result.stderr}")
        self.assertIn("パフォーマンス測定完了", result.stdout, "パフォーマンス測定が実行されません")
    
    def test_integration_with_existing_scripts(self):
        """既存スクリプトとの統合テスト"""
        # deploy-data-only.sh スクリプトが並列処理を読み込むことを確認
        deploy_script = self.scripts_dir / "deploy" / "deploy-data-only.sh"
        
        with open(deploy_script, 'r') as f:
            content = f.read()
        
        # 並列処理ユーティリティが読み込まれていることを確認
        self.assertIn("parallel-processor.sh", content, "deploy-data-only.sh が並列処理ユーティリティを読み込んでいません")
        self.assertIn("deployment-optimizer.sh", content, "deploy-data-only.sh が最適化ユーティリティを読み込んでいません")
        
        # deploy-full.sh スクリプトも確認
        full_deploy_script = self.scripts_dir / "deploy" / "deploy-full.sh"
        
        with open(full_deploy_script, 'r') as f:
            content = f.read()
        
        # 並列処理ユーティリティが読み込まれていることを確認
        self.assertIn("parallel-processor.sh", content, "deploy-full.sh が並列処理ユーティリティを読み込んでいません")
        self.assertIn("deployment-optimizer.sh", content, "deploy-full.sh が最適化ユーティリティを読み込んでいません")
    
    def test_error_handling_in_parallel_operations(self):
        """並列処理でのエラーハンドリングテスト"""
        # エラーハンドリングテストスクリプトを作成
        test_script = self.test_data_dir / "test_error_handling.sh"
        with open(test_script, 'w') as f:
            f.write(f"""#!/bin/bash
set -e

# プロジェクトルートに移動
cd "{self.project_root}"

# 並列処理ユーティリティを読み込み
source scripts/utils/parallel-processor.sh

# 並列処理を初期化
init_parallel_processor

# 成功するジョブと失敗するジョブを追加
add_parallel_job "success_job" "echo 'success'" "成功ジョブ"
add_parallel_job "fail_job" "exit 1" "失敗ジョブ"
add_parallel_job "another_success" "echo 'another success'" "別の成功ジョブ"

# 並列実行（失敗があっても継続）
execute_parallel_jobs 30 || true

# 結果を表示
show_parallel_results
""")
        
        os.chmod(test_script, 0o755)
        
        # テストスクリプトを実行
        result = self.run_shell_script(test_script, timeout=60)
        
        # 実行結果を確認（失敗ジョブがあっても全体は実行される）
        self.assertIn("並列ジョブ実行結果", result.stdout, "エラーハンドリング結果が表示されません")
        self.assertIn("成功:", result.stdout, "成功ジョブの結果が表示されません")
        self.assertIn("失敗:", result.stdout, "失敗ジョブの結果が表示されません")
    
    def test_cpu_core_detection(self):
        """CPUコア数検出機能のテスト"""
        # CPUコア数検出テストスクリプトを作成
        test_script = self.test_data_dir / "test_cpu_detection.sh"
        with open(test_script, 'w') as f:
            f.write(f"""#!/bin/bash
set -e

# プロジェクトルートに移動
cd "{self.project_root}"

# 並列処理ユーティリティを読み込み
source scripts/utils/parallel-processor.sh

# 並列処理を初期化（CPUコア数に基づいて並列数が調整される）
init_parallel_processor

# MAX_PARALLEL_JOBS の値を確認
echo "MAX_PARALLEL_JOBS: $MAX_PARALLEL_JOBS"

# CPUコア数を表示
if command -v nproc >/dev/null 2>&1; then
    echo "CPU cores (nproc): $(nproc)"
elif command -v sysctl >/dev/null 2>&1; then
    echo "CPU cores (sysctl): $(sysctl -n hw.ncpu 2>/dev/null || echo 'N/A')"
else
    echo "CPU cores: Unknown"
fi
""")
        
        os.chmod(test_script, 0o755)
        
        # テストスクリプトを実行
        result = self.run_shell_script(test_script, timeout=30)
        
        # 実行結果を確認
        self.assertEqual(result.returncode, 0, f"CPUコア数検出テストに失敗: {result.stderr}")
        self.assertIn("MAX_PARALLEL_JOBS:", result.stdout, "並列数設定が表示されません")


class PerformanceBenchmarkTest(unittest.TestCase):
    """パフォーマンスベンチマークテスト"""
    
    def setUp(self):
        """テスト前の準備"""
        self.project_root = Path(__file__).parent.parent.parent
        self.scripts_dir = self.project_root / "scripts"
        self.test_data_dir = Path(tempfile.mkdtemp())
        
        # テスト用環境変数を設定
        self.test_env = os.environ.copy()
        self.test_env.update({
            'MAX_PARALLEL_JOBS': '4',
            'OPTIMIZATION_ENABLED': 'true'
        })
    
    def tearDown(self):
        """テスト後のクリーンアップ"""
        import shutil
        if self.test_data_dir.exists():
            shutil.rmtree(self.test_data_dir)
    
    def test_parallel_vs_sequential_performance(self):
        """並列処理と逐次処理のパフォーマンス比較"""
        # テスト用ファイルを大量作成
        test_files_dir = self.test_data_dir / "performance_test"
        test_files_dir.mkdir()
        
        # 20個のJSONファイルを作成
        for i in range(20):
            test_file = test_files_dir / f"perf_test_{i}.json"
            test_data = {
                "id": i,
                "data": f"performance test data {i}",
                "timestamp": time.time(),
                "nested": {
                    "value": i * 2,
                    "description": f"nested data for item {i}"
                }
            }
            with open(test_file, 'w') as f:
                json.dump(test_data, f, indent=2)
        
        # 逐次処理のベンチマーク
        sequential_script = self.test_data_dir / "sequential_benchmark.sh"
        with open(sequential_script, 'w') as f:
            f.write(f"""#!/bin/bash
set -e
cd "{self.project_root}"

start_time=$(date +%s)

# 逐次でJSON検証
for file in {test_files_dir}/*.json; do
    python3 -m json.tool "$file" >/dev/null 2>&1
done

end_time=$(date +%s)
duration=$((end_time - start_time))
echo "Sequential processing time: ${{duration}} seconds"
""")
        
        os.chmod(sequential_script, 0o755)
        
        # 並列処理のベンチマーク
        parallel_script = self.test_data_dir / "parallel_benchmark.sh"
        with open(parallel_script, 'w') as f:
            f.write(f"""#!/bin/bash
set -e
cd "{self.project_root}"

source scripts/utils/parallel-processor.sh

start_time=$(date +%s)

# 並列でJSON検証
parallel_json_validation "{test_files_dir}/*.json" "パフォーマンステスト"

end_time=$(date +%s)
duration=$((end_time - start_time))
echo "Parallel processing time: ${{duration}} seconds"
""")
        
        os.chmod(parallel_script, 0o755)
        
        # 両方のベンチマークを実行
        sequential_result = subprocess.run(
            ['bash', str(sequential_script)],
            cwd=self.project_root,
            env=self.test_env,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        parallel_result = subprocess.run(
            ['bash', str(parallel_script)],
            cwd=self.project_root,
            env=self.test_env,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        # 結果を確認
        self.assertEqual(sequential_result.returncode, 0, f"逐次処理ベンチマークに失敗: {sequential_result.stderr}")
        self.assertEqual(parallel_result.returncode, 0, f"並列処理ベンチマークに失敗: {parallel_result.stderr}")
        
        print(f"逐次処理結果: {sequential_result.stdout.strip()}")
        print(f"並列処理結果: {parallel_result.stdout.strip()}")
        
        # 両方とも実行時間が記録されていることを確認
        self.assertIn("Sequential processing time:", sequential_result.stdout)
        self.assertIn("Parallel processing time:", parallel_result.stdout)


def run_integration_tests():
    """統合テストを実行"""
    # テストスイートを作成
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # 並列デプロイメントテストを追加
    suite.addTests(loader.loadTestsFromTestCase(ParallelDeploymentTest))
    
    # パフォーマンスベンチマークテストを追加
    suite.addTests(loader.loadTestsFromTestCase(PerformanceBenchmarkTest))
    
    # テストランナーを作成して実行
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()


if __name__ == "__main__":
    print("並列デプロイメント機能の統合テストを開始...")
    success = run_integration_tests()
    
    if success:
        print("\n✅ 全ての統合テストが成功しました！")
        exit(0)
    else:
        print("\n❌ 一部の統合テストが失敗しました。")
        exit(1)