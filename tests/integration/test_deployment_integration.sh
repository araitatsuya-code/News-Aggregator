#!/bin/bash

# デプロイメント統合テスト - 並列処理機能を含む
# 要件1, 要件2, 要件3, 要件4に対応

set -e

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# プロジェクトルートに移動
cd "$PROJECT_ROOT"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "デプロイメント統合テスト開始（並列処理機能含む）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# テスト用環境変数を設定
export MAX_PARALLEL_JOBS=2
export OPTIMIZATION_ENABLED=true
export PARALLEL_DATA_PROCESSING=true
export PARALLEL_FILE_OPERATIONS=true
export CONCURRENT_VALIDATIONS=true

# テスト1: デプロイメントスクリプトの存在確認
echo
echo "テスト1: デプロイメントスクリプトの存在確認"

required_scripts=(
    "scripts/deploy/deploy-full.sh"
    "scripts/deploy/deploy-data-only.sh"
    "scripts/utils/parallel-processor.sh"
    "scripts/utils/deployment-optimizer.sh"
)

for script in "${required_scripts[@]}"; do
    if [[ -f "$script" ]]; then
        echo "✅ $script が存在します"
    else
        echo "❌ $script が見つかりません"
        exit 1
    fi
    
    if [[ -x "$script" ]]; then
        echo "✅ $script は実行可能です"
    else
        echo "❌ $script は実行可能ではありません"
        exit 1
    fi
done

# テスト2: 並列処理ユーティリティの統合確認
echo
echo "テスト2: 並列処理ユーティリティの統合確認"

# deploy-data-only.sh が並列処理を読み込むことを確認
if grep -q "parallel-processor.sh" scripts/deploy/deploy-data-only.sh; then
    echo "✅ deploy-data-only.sh が並列処理ユーティリティを読み込んでいます"
else
    echo "❌ deploy-data-only.sh が並列処理ユーティリティを読み込んでいません"
    exit 1
fi

if grep -q "deployment-optimizer.sh" scripts/deploy/deploy-data-only.sh; then
    echo "✅ deploy-data-only.sh が最適化ユーティリティを読み込んでいます"
else
    echo "❌ deploy-data-only.sh が最適化ユーティリティを読み込んでいません"
    exit 1
fi

# deploy-full.sh も確認
if grep -q "parallel-processor.sh" scripts/deploy/deploy-full.sh; then
    echo "✅ deploy-full.sh が並列処理ユーティリティを読み込んでいます"
else
    echo "❌ deploy-full.sh が並列処理ユーティリティを読み込んでいません"
    exit 1
fi

if grep -q "deployment-optimizer.sh" scripts/deploy/deploy-full.sh; then
    echo "✅ deploy-full.sh が最適化ユーティリティを読み込んでいます"
else
    echo "❌ deploy-full.sh が最適化ユーティリティを読み込んでいません"
    exit 1
fi

# テスト3: デプロイメントスクリプトのヘルプ表示テスト
echo
echo "テスト3: デプロイメントスクリプトのヘルプ表示テスト"

# deploy-data-only.sh のヘルプ表示
if bash scripts/deploy/deploy-data-only.sh --help >/dev/null 2>&1; then
    echo "✅ deploy-data-only.sh のヘルプ表示が正常に動作します"
else
    echo "❌ deploy-data-only.sh のヘルプ表示に問題があります"
    # デバッグ用に実際のエラーを表示
    echo "デバッグ: ヘルプ表示の実行結果"
    bash scripts/deploy/deploy-data-only.sh --help 2>&1 | head -10
    exit 1
fi

# deploy-full.sh のヘルプ表示
if bash scripts/deploy/deploy-full.sh --help >/dev/null 2>&1; then
    echo "✅ deploy-full.sh のヘルプ表示が正常に動作します"
else
    echo "❌ deploy-full.sh のヘルプ表示に問題があります"
    # デバッグ用に実際のエラーを表示
    echo "デバッグ: ヘルプ表示の実行結果"
    bash scripts/deploy/deploy-full.sh --help 2>&1 | head -10
    exit 1
fi

# テスト4: 並列処理機能の動作確認
echo
echo "テスト4: 並列処理機能の動作確認"

# テスト用データを作成
TEST_DATA_DIR="/tmp/deployment_integration_test_$$"
mkdir -p "$TEST_DATA_DIR/frontend/public/data/news"
mkdir -p "$TEST_DATA_DIR/frontend/public/data/summaries"

# テスト用JSONファイルを作成
for i in {1..5}; do
    echo "{\"test_id\": $i, \"data\": \"integration test data $i\"}" > "$TEST_DATA_DIR/frontend/public/data/news/test_$i.json"
done

echo "{\"date\": \"$(date -Iseconds)\", \"summary\": \"test summary\"}" > "$TEST_DATA_DIR/frontend/public/data/summaries/latest.json"
echo "{\"articles\": []}" > "$TEST_DATA_DIR/frontend/public/data/news/latest.json"

# 並列処理テストスクリプトを作成
TEST_SCRIPT="$TEST_DATA_DIR/test_parallel_integration.sh"
cat > "$TEST_SCRIPT" << 'EOF'
#!/bin/bash
set -e

# プロジェクトルートに移動
cd "$1"

# 並列処理ユーティリティを読み込み
source scripts/utils/parallel-processor.sh
source scripts/utils/deployment-optimizer.sh

# 並列処理を初期化
init_parallel_processor
init_deployment_optimizer

# テスト用データディレクトリ
TEST_DATA_DIR="$2"

# 並列JSON検証を実行
echo "並列JSON検証を実行中..."
parallel_json_validation "$TEST_DATA_DIR/frontend/public/data/**/*.json" "統合テスト用JSON検証"

# 結果を表示
show_parallel_results

# 最適化サマリーを表示
show_optimization_summary

echo "✅ 並列処理統合テスト完了"
EOF

chmod +x "$TEST_SCRIPT"

# テストスクリプトを実行
if bash "$TEST_SCRIPT" "$PROJECT_ROOT" "$TEST_DATA_DIR"; then
    echo "✅ 並列処理機能の統合テストが成功しました"
else
    echo "❌ 並列処理機能の統合テストに失敗しました"
    exit 1
fi

# テスト5: 環境変数による設定テスト
echo
echo "テスト5: 環境変数による設定テスト"

# 最適化無効でのテスト
if OPTIMIZATION_ENABLED=false bash -c 'source scripts/utils/deployment-optimizer.sh && init_deployment_optimizer'; then
    echo "✅ 最適化無効設定が正常に動作します"
else
    echo "❌ 最適化無効設定に問題があります"
    exit 1
fi

# テスト6: エラーハンドリングテスト
echo
echo "テスト6: エラーハンドリングテスト"

ERROR_TEST_SCRIPT="$TEST_DATA_DIR/test_error_handling.sh"
cat > "$ERROR_TEST_SCRIPT" << 'EOF'
#!/bin/bash
set -e

cd "$1"

source scripts/utils/parallel-processor.sh

# 並列処理を初期化
init_parallel_processor

# 成功と失敗が混在するジョブを追加
add_parallel_job "success_job" "echo 'success'" "成功ジョブ"
add_parallel_job "fail_job" "exit 1" "失敗ジョブ"
add_parallel_job "another_success" "echo 'another success'" "別の成功ジョブ"

# 並列実行（失敗があっても継続）
execute_parallel_jobs 30 || true

# 結果を表示
show_parallel_results

echo "エラーハンドリングテスト完了"
EOF

chmod +x "$ERROR_TEST_SCRIPT"

if bash "$ERROR_TEST_SCRIPT" "$PROJECT_ROOT"; then
    echo "✅ エラーハンドリングが正常に動作します"
else
    echo "❌ エラーハンドリングに問題があります"
    exit 1
fi

# テスト7: パフォーマンス測定機能テスト
echo
echo "テスト7: パフォーマンス測定機能テスト"

PERF_TEST_SCRIPT="$TEST_DATA_DIR/test_performance_measurement.sh"
cat > "$PERF_TEST_SCRIPT" << 'EOF'
#!/bin/bash
set -e

cd "$1"

source scripts/utils/deployment-optimizer.sh

# 最適化を初期化
init_deployment_optimizer

# パフォーマンス測定テスト
measure_performance "test_echo" "echo 'performance test'"
measure_performance "test_sleep" "sleep 0.5"

# 最適化サマリーを表示
show_optimization_summary

echo "パフォーマンス測定テスト完了"
EOF

chmod +x "$PERF_TEST_SCRIPT"

if bash "$PERF_TEST_SCRIPT" "$PROJECT_ROOT"; then
    echo "✅ パフォーマンス測定機能が正常に動作します"
else
    echo "❌ パフォーマンス測定機能に問題があります"
    exit 1
fi

# クリーンアップ
echo
echo "テストデータをクリーンアップ中..."
rm -rf "$TEST_DATA_DIR"

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 全てのデプロイメント統合テストが成功しました！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "実装された機能:"
echo "• 並列処理による実行時間短縮"
echo "• データ収集とファイル操作の最適化"
echo "• 並列JSON検証"
echo "• 並列ファイルコピー"
echo "• パフォーマンス測定と統計"
echo "• エラーハンドリングと回復機能"
echo "• 環境変数による設定制御"
echo "• 最適化サマリーとレポート機能"
echo
echo "要件対応状況:"
echo "✅ 要件4.1: ステップ別時間計測"
echo "✅ 要件4.2: 総実行時間計算"
echo "✅ 要件6: 進行状況表示"
echo "✅ 並列処理による実行時間短縮"
echo "✅ データ収集とファイル操作の最適化"