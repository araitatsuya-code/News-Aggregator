#!/bin/bash

# パフォーマンスベンチマークテスト
# 並列処理と逐次処理の性能比較
# 要件4.1, 4.2に対応

set -e

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# プロジェクトルートに移動
cd "$PROJECT_ROOT"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "パフォーマンスベンチマークテスト開始"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 並列処理ユーティリティを読み込み
source scripts/utils/parallel-processor.sh
source scripts/utils/deployment-optimizer.sh

# テスト用ディレクトリを作成
TEST_DIR="/tmp/performance_test_$$"
mkdir -p "$TEST_DIR"

echo "テスト用データを準備中..."

# 大量のテスト用JSONファイルを作成
for i in {1..20}; do
    cat > "$TEST_DIR/test_$i.json" << EOF
{
  "id": $i,
  "timestamp": "$(date -Iseconds)",
  "data": {
    "value": $((i * 10)),
    "description": "Test data for item $i",
    "nested": {
      "array": [1, 2, 3, 4, 5],
      "object": {
        "key1": "value1",
        "key2": "value2"
      }
    }
  },
  "metadata": {
    "created_by": "benchmark_test",
    "version": "1.0",
    "tags": ["test", "benchmark", "json"]
  }
}
EOF
done

echo "作成されたテストファイル数: $(ls "$TEST_DIR"/*.json | wc -l)"

# ベンチマーク1: 逐次JSON検証
echo
echo "ベンチマーク1: 逐次JSON検証"
sequential_start=$(date +%s)

for file in "$TEST_DIR"/*.json; do
    python3 -m json.tool "$file" >/dev/null 2>&1
done

sequential_end=$(date +%s)
sequential_duration=$((sequential_end - sequential_start))

echo "逐次処理時間: ${sequential_duration}秒"

# ベンチマーク2: 並列JSON検証
echo
echo "ベンチマーク2: 並列JSON検証"
init_parallel_processor

parallel_start=$(date +%s)

parallel_json_validation "$TEST_DIR/*.json" "ベンチマーク用JSON検証"

parallel_end=$(date +%s)
parallel_duration=$((parallel_end - parallel_start))

echo "並列処理時間: ${parallel_duration}秒"

# 結果を表示
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "パフォーマンス比較結果"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "テストファイル数: 20個"
echo "逐次処理時間: ${sequential_duration}秒"
echo "並列処理時間: ${parallel_duration}秒"

if [[ $sequential_duration -gt 0 ]]; then
    if [[ $parallel_duration -lt $sequential_duration ]]; then
        improvement=$((sequential_duration - parallel_duration))
        improvement_percent=$((improvement * 100 / sequential_duration))
        echo "時間短縮: ${improvement}秒 (${improvement_percent}% 改善)"
        echo "✅ 並列処理による性能向上を確認"
    elif [[ $parallel_duration -eq $sequential_duration ]]; then
        echo "⚖️  処理時間は同等"
    else
        overhead=$((parallel_duration - sequential_duration))
        echo "オーバーヘッド: ${overhead}秒"
        echo "ℹ️  小さなタスクでは並列処理のオーバーヘッドが影響する場合があります"
    fi
else
    echo "ℹ️  処理が高速すぎて時間差を測定できませんでした"
fi

# ベンチマーク3: ファイルコピーの性能比較
echo
echo "ベンチマーク3: ファイルコピーの性能比較"

# コピー先ディレクトリを作成
COPY_SEQUENTIAL_DIR="$TEST_DIR/copy_sequential"
COPY_PARALLEL_DIR="$TEST_DIR/copy_parallel"
mkdir -p "$COPY_SEQUENTIAL_DIR" "$COPY_PARALLEL_DIR"

# 逐次コピー
echo "逐次ファイルコピー実行中..."
copy_sequential_start=$(date +%s)

for file in "$TEST_DIR"/*.json; do
    cp "$file" "$COPY_SEQUENTIAL_DIR/"
done

copy_sequential_end=$(date +%s)
copy_sequential_duration=$((copy_sequential_end - copy_sequential_start))

# 並列コピー
echo "並列ファイルコピー実行中..."
init_parallel_processor

copy_parallel_start=$(date +%s)

parallel_file_copy "$TEST_DIR/*.json" "$COPY_PARALLEL_DIR" "ベンチマーク用ファイルコピー"

copy_parallel_end=$(date +%s)
copy_parallel_duration=$((copy_parallel_end - copy_parallel_start))

echo
echo "ファイルコピー性能比較:"
echo "逐次コピー時間: ${copy_sequential_duration}秒"
echo "並列コピー時間: ${copy_parallel_duration}秒"

# コピー結果の検証
sequential_files=$(ls "$COPY_SEQUENTIAL_DIR"/*.json 2>/dev/null | wc -l)
parallel_files=$(ls "$COPY_PARALLEL_DIR"/*.json 2>/dev/null | wc -l)

echo "逐次コピー結果: ${sequential_files}ファイル"
echo "並列コピー結果: ${parallel_files}ファイル"

if [[ $sequential_files -eq $parallel_files ]] && [[ $sequential_files -eq 20 ]]; then
    echo "✅ ファイルコピーの整合性確認完了"
else
    echo "❌ ファイルコピーの整合性に問題があります"
fi

# ベンチマーク4: 複合処理の性能比較
echo
echo "ベンチマーク4: 複合処理（検証+コピー）の性能比較"

COMPLEX_SEQUENTIAL_DIR="$TEST_DIR/complex_sequential"
COMPLEX_PARALLEL_DIR="$TEST_DIR/complex_parallel"
mkdir -p "$COMPLEX_SEQUENTIAL_DIR" "$COMPLEX_PARALLEL_DIR"

# 逐次複合処理
echo "逐次複合処理実行中..."
complex_sequential_start=$(date +%s)

for file in "$TEST_DIR"/*.json; do
    # JSON検証
    python3 -m json.tool "$file" >/dev/null 2>&1
    # ファイルコピー
    cp "$file" "$COMPLEX_SEQUENTIAL_DIR/"
done

complex_sequential_end=$(date +%s)
complex_sequential_duration=$((complex_sequential_end - complex_sequential_start))

# 並列複合処理
echo "並列複合処理実行中..."
init_parallel_processor

complex_parallel_start=$(date +%s)

# 並列で検証とコピーを同時実行
job_count=0
for file in "$TEST_DIR"/*.json; do
    filename=$(basename "$file")
    # 検証ジョブ
    add_parallel_job "validate_complex_$job_count" "python3 -m json.tool '$file' >/dev/null 2>&1" "複合検証: $filename"
    # コピージョブ
    add_parallel_job "copy_complex_$job_count" "cp '$file' '$COMPLEX_PARALLEL_DIR/'" "複合コピー: $filename"
    ((job_count++))
done

execute_parallel_jobs 60

complex_parallel_end=$(date +%s)
complex_parallel_duration=$((complex_parallel_end - complex_parallel_start))

echo
echo "複合処理性能比較:"
echo "逐次複合処理時間: ${complex_sequential_duration}秒"
echo "並列複合処理時間: ${complex_parallel_duration}秒"

# 最適化サマリーを表示
echo
init_deployment_optimizer
update_optimization_stats "json_validation" "$sequential_duration" "$parallel_duration" "20"
update_optimization_stats "file_copy" "$copy_sequential_duration" "$copy_parallel_duration" "20"
update_optimization_stats "complex_processing" "$complex_sequential_duration" "$complex_parallel_duration" "40"

show_optimization_summary

# クリーンアップ
echo
echo "テストデータをクリーンアップ中..."
rm -rf "$TEST_DIR"

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ パフォーマンスベンチマークテスト完了"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"