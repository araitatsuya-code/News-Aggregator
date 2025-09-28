#!/bin/bash

# 基本的な並列処理機能のテスト
# 要件4.1, 4.2に対応

set -e

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# プロジェクトルートに移動
cd "$PROJECT_ROOT"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "並列処理機能の基本テスト開始"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# テスト1: 並列処理ユーティリティの読み込みテスト
echo
echo "テスト1: 並列処理ユーティリティの読み込み"
if source scripts/utils/parallel-processor.sh; then
    echo "✅ 並列処理ユーティリティの読み込み成功"
else
    echo "❌ 並列処理ユーティリティの読み込み失敗"
    exit 1
fi

# テスト2: デプロイメント最適化ユーティリティの読み込みテスト
echo
echo "テスト2: デプロイメント最適化ユーティリティの読み込み"
if source scripts/utils/deployment-optimizer.sh; then
    echo "✅ デプロイメント最適化ユーティリティの読み込み成功"
else
    echo "❌ デプロイメント最適化ユーティリティの読み込み失敗"
    exit 1
fi

# テスト3: 並列処理の初期化テスト
echo
echo "テスト3: 並列処理の初期化"
if init_parallel_processor; then
    echo "✅ 並列処理の初期化成功"
else
    echo "❌ 並列処理の初期化失敗"
    exit 1
fi

# テスト4: 簡単な並列ジョブの実行テスト
echo
echo "テスト4: 簡単な並列ジョブの実行"

# テスト用ジョブを追加
add_parallel_job "test_job_1" "echo 'Job 1 completed'" "テストジョブ1"
add_parallel_job "test_job_2" "echo 'Job 2 completed'" "テストジョブ2"
add_parallel_job "test_job_3" "sleep 1 && echo 'Job 3 completed'" "テストジョブ3"

# 並列実行
if execute_parallel_jobs 30; then
    echo "✅ 並列ジョブの実行成功"
    show_parallel_results
else
    echo "❌ 並列ジョブの実行失敗"
    show_parallel_results
    exit 1
fi

# テスト5: デプロイメント最適化の初期化テスト
echo
echo "テスト5: デプロイメント最適化の初期化"
if init_deployment_optimizer; then
    echo "✅ デプロイメント最適化の初期化成功"
else
    echo "❌ デプロイメント最適化の初期化失敗"
    exit 1
fi

# テスト6: パフォーマンス測定テスト
echo
echo "テスト6: パフォーマンス測定"
if measure_performance "test_sleep" "sleep 1"; then
    echo "✅ パフォーマンス測定成功"
else
    echo "❌ パフォーマンス測定失敗"
    exit 1
fi

# テスト7: 最適化サマリーの表示テスト
echo
echo "テスト7: 最適化サマリーの表示"
show_optimization_summary

# テスト8: テスト用JSONファイルの並列検証
echo
echo "テスト8: JSONファイルの並列検証"

# テスト用ディレクトリとファイルを作成
TEST_DIR="/tmp/parallel_test_$$"
mkdir -p "$TEST_DIR"

# テスト用JSONファイルを作成
for i in {1..5}; do
    echo "{\"test_id\": $i, \"data\": \"test data $i\"}" > "$TEST_DIR/test_$i.json"
done

# 並列JSON検証を実行
init_parallel_processor
if parallel_json_validation "$TEST_DIR/*.json" "テスト用JSON検証"; then
    echo "✅ JSONファイルの並列検証成功"
    show_parallel_results
else
    echo "❌ JSONファイルの並列検証失敗"
    show_parallel_results
fi

# テスト用ファイルをクリーンアップ
rm -rf "$TEST_DIR"

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 全ての基本テストが完了しました！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"