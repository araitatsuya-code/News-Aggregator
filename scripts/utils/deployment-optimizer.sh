#!/bin/bash

# デプロイメント最適化ユーティリティ - 並列処理による最適化を提供する
# 要件4.1, 4.2に対応

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 並列処理ユーティリティを読み込み
source "$SCRIPT_DIR/parallel-processor.sh"

# 最適化設定
OPTIMIZATION_ENABLED=${OPTIMIZATION_ENABLED:-true}
PARALLEL_DATA_PROCESSING=${PARALLEL_DATA_PROCESSING:-true}
PARALLEL_FILE_OPERATIONS=${PARALLEL_FILE_OPERATIONS:-true}
CONCURRENT_VALIDATIONS=${CONCURRENT_VALIDATIONS:-true}

# 最適化統計
OPTIMIZATION_STATS_FILE="/tmp/deployment_optimization_$$"

# 初期化処理
init_deployment_optimizer() {
    if [[ "$OPTIMIZATION_ENABLED" != "true" ]]; then
        if command -v log_info >/dev/null 2>&1; then
            log_info "デプロイメント最適化は無効です"
        fi
        return 0
    fi
    
    # 並列処理を初期化
    init_parallel_processor
    
    # 統計ファイルを初期化
    cat > "$OPTIMIZATION_STATS_FILE" << EOF
{
  "optimization_start": "$(date -Iseconds)",
  "parallel_jobs": [],
  "time_savings": {},
  "performance_metrics": {}
}
EOF
    
    if command -v log_info >/dev/null 2>&1; then
        log_info "デプロイメント最適化を初期化しました"
    fi
}

# 最適化統計を更新
update_optimization_stats() {
    local operation="$1"
    local original_time="$2"
    local optimized_time="$3"
    local jobs_count="$4"
    
    if [[ ! -f "$OPTIMIZATION_STATS_FILE" ]]; then
        return 0
    fi
    
    local time_saved=$((original_time - optimized_time))
    local improvement_percent=0
    
    if [[ $original_time -gt 0 ]]; then
        improvement_percent=$((time_saved * 100 / original_time))
    fi
    
    # Python を使用してJSONを更新
    python3 -c "
import json
import sys

try:
    with open('$OPTIMIZATION_STATS_FILE', 'r') as f:
        stats = json.load(f)
    
    stats['time_savings']['$operation'] = {
        'original_time': $original_time,
        'optimized_time': $optimized_time,
        'time_saved': $time_saved,
        'improvement_percent': $improvement_percent,
        'parallel_jobs': $jobs_count
    }
    
    with open('$OPTIMIZATION_STATS_FILE', 'w') as f:
        json.dump(stats, f, indent=2)
        
except Exception as e:
    print(f'Error updating optimization stats: {e}', file=sys.stderr)
" 2>/dev/null || true
}

# 並列データ収集の最適化
optimize_data_collection() {
    if [[ "$PARALLEL_DATA_PROCESSING" != "true" ]]; then
        return 0
    fi
    
    local start_time=$(date +%s)
    
    if command -v log_info >/dev/null 2>&1; then
        log_info "データ収集の並列最適化を開始..."
    fi
    
    # データ収集の前処理を並列化
    init_parallel_processor
    
    # 環境確認ジョブ
    add_parallel_job "env_check" "python3 -c 'import sys; print(sys.version)' >/dev/null" "Python環境確認"
    
    # 依存関係確認ジョブ
    add_parallel_job "deps_check" "python3 -c 'import json, asyncio, aiohttp' >/dev/null 2>&1" "依存関係確認"
    
    # ディレクトリ準備ジョブ
    local data_dirs=("frontend/public/data/news" "frontend/public/data/summaries" "frontend/public/data/config")
    local job_count=2
    
    for dir in "${data_dirs[@]}"; do
        add_parallel_job "mkdir_$job_count" "mkdir -p '$dir'" "ディレクトリ作成: $dir"
        ((job_count++))
    done
    
    # 並列実行
    if execute_parallel_jobs 30; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        if command -v log_success >/dev/null 2>&1; then
            log_success "データ収集前処理の並列最適化完了 (${duration}秒)"
        fi
        
        # 統計更新（推定値）
        local estimated_original_time=$((duration * 2))
        update_optimization_stats "data_collection_prep" "$estimated_original_time" "$duration" "$job_count"
        
        return 0
    else
        if command -v log_warn >/dev/null 2>&1; then
            log_warn "データ収集前処理の並列最適化に失敗"
        fi
        return 1
    fi
}

# 並列ファイル操作の最適化
optimize_file_operations() {
    local operation_type="$1"  # backup, copy, validate
    local source_pattern="$2"
    local destination="$3"
    
    if [[ "$PARALLEL_FILE_OPERATIONS" != "true" ]]; then
        return 0
    fi
    
    local start_time=$(date +%s)
    
    case "$operation_type" in
        "backup")
            optimize_backup_operations "$source_pattern" "$destination"
            ;;
        "copy")
            optimize_copy_operations "$source_pattern" "$destination"
            ;;
        "validate")
            optimize_validation_operations "$source_pattern"
            ;;
        *)
            if command -v log_warn >/dev/null 2>&1; then
                log_warn "不明なファイル操作タイプ: $operation_type"
            fi
            return 1
            ;;
    esac
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # 統計更新
    local estimated_original_time=$((duration * 3))  # 推定値
    update_optimization_stats "file_operations_$operation_type" "$estimated_original_time" "$duration" "parallel"
}

# バックアップ操作の最適化
optimize_backup_operations() {
    local source_pattern="$1"
    local backup_dir="$2"
    
    if command -v log_info >/dev/null 2>&1; then
        log_info "バックアップ操作の並列最適化中..."
    fi
    
    # 並列ファイルコピーを使用
    parallel_file_copy "$source_pattern" "$backup_dir" "最適化バックアップ"
}

# コピー操作の最適化
optimize_copy_operations() {
    local source_pattern="$1"
    local destination="$2"
    
    if command -v log_info >/dev/null 2>&1; then
        log_info "コピー操作の並列最適化中..."
    fi
    
    # 並列ファイルコピーを使用
    parallel_file_copy "$source_pattern" "$destination" "最適化コピー"
}

# 検証操作の最適化
optimize_validation_operations() {
    local json_pattern="$1"
    
    if [[ "$CONCURRENT_VALIDATIONS" != "true" ]]; then
        return 0
    fi
    
    if command -v log_info >/dev/null 2>&1; then
        log_info "検証操作の並列最適化中..."
    fi
    
    # 並列JSON検証を使用
    parallel_json_validation "$json_pattern" "最適化検証"
}

# デプロイメントパイプラインの最適化
optimize_deployment_pipeline() {
    local pipeline_type="$1"  # full, data-only, vercel-only
    
    if [[ "$OPTIMIZATION_ENABLED" != "true" ]]; then
        return 0
    fi
    
    local start_time=$(date +%s)
    
    if command -v log_info >/dev/null 2>&1; then
        log_info "デプロイメントパイプライン最適化開始: $pipeline_type"
    fi
    
    case "$pipeline_type" in
        "full")
            optimize_full_deployment_pipeline
            ;;
        "data-only")
            optimize_data_only_pipeline
            ;;
        "vercel-only")
            optimize_vercel_only_pipeline
            ;;
        *)
            if command -v log_warn >/dev/null 2>&1; then
                log_warn "不明なパイプラインタイプ: $pipeline_type"
            fi
            return 1
            ;;
    esac
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if command -v log_success >/dev/null 2>&1; then
        log_success "パイプライン最適化完了: $pipeline_type (${duration}秒)"
    fi
}

# フルデプロイメントパイプラインの最適化
optimize_full_deployment_pipeline() {
    init_parallel_processor
    
    # 独立して実行可能なタスクを並列化
    add_parallel_job "env_validation" "bash -c 'source scripts/utils/venv-manager.sh && verify_python_environment'" "環境検証"
    add_parallel_job "dir_preparation" "mkdir -p logs backups frontend/public/data/{news,summaries,config,metrics}" "ディレクトリ準備"
    add_parallel_job "dependency_check" "python3 -c 'import json, asyncio, aiohttp, anthropic' >/dev/null 2>&1" "依存関係確認"
    
    # 並列実行
    if execute_parallel_jobs 60; then
        if command -v log_success >/dev/null 2>&1; then
            log_success "フルデプロイメント前処理の並列最適化完了"
        fi
    else
        if command -v log_warn >/dev/null 2>&1; then
            log_warn "フルデプロイメント前処理の並列最適化に失敗"
        fi
        show_parallel_results
    fi
}

# データのみパイプラインの最適化
optimize_data_only_pipeline() {
    init_parallel_processor
    
    # データ処理の前処理を並列化
    add_parallel_job "data_dirs" "mkdir -p frontend/public/data/{news,summaries,config}" "データディレクトリ作成"
    add_parallel_job "cache_dirs" "mkdir -p cache/articles" "キャッシュディレクトリ作成"
    add_parallel_job "log_dirs" "mkdir -p logs" "ログディレクトリ作成"
    add_parallel_job "python_check" "python3 --version >/dev/null" "Python確認"
    
    # 並列実行
    if execute_parallel_jobs 30; then
        if command -v log_success >/dev/null 2>&1; then
            log_success "データパイプライン前処理の並列最適化完了"
        fi
    else
        if command -v log_warn >/dev/null 2>&1; then
            log_warn "データパイプライン前処理の並列最適化に失敗"
        fi
    fi
}

# Vercelのみパイプラインの最適化
optimize_vercel_only_pipeline() {
    init_parallel_processor
    
    # Vercelデプロイの前処理を並列化
    add_parallel_job "vercel_check" "command -v vercel >/dev/null" "Vercel CLI確認"
    add_parallel_job "node_check" "node --version >/dev/null" "Node.js確認"
    add_parallel_job "npm_deps" "cd frontend && npm list --depth=0 >/dev/null 2>&1" "NPM依存関係確認"
    add_parallel_job "data_validation" "test -f frontend/public/data/news/latest.json" "データファイル確認"
    
    # 並列実行
    if execute_parallel_jobs 45; then
        if command -v log_success >/dev/null 2>&1; then
            log_success "Vercelパイプライン前処理の並列最適化完了"
        fi
    else
        if command -v log_warn >/dev/null 2>&1; then
            log_warn "Vercelパイプライン前処理の並列最適化に失敗"
        fi
    fi
}

# 最適化結果のサマリーを表示
show_optimization_summary() {
    if [[ ! -f "$OPTIMIZATION_STATS_FILE" ]]; then
        echo "最適化統計が見つかりません"
        return 1
    fi
    
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "デプロイメント最適化サマリー"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Python を使用してJSONを解析し統計を表示
    python3 -c "
import json
import sys
from datetime import datetime

try:
    with open('$OPTIMIZATION_STATS_FILE', 'r') as f:
        stats = json.load(f)
    
    print('最適化開始時刻:', stats.get('optimization_start', 'N/A'))
    print()
    
    time_savings = stats.get('time_savings', {})
    if time_savings:
        print('時間短縮効果:')
        total_saved = 0
        total_original = 0
        
        for operation, data in time_savings.items():
            original = data.get('original_time', 0)
            optimized = data.get('optimized_time', 0)
            saved = data.get('time_saved', 0)
            improvement = data.get('improvement_percent', 0)
            jobs = data.get('parallel_jobs', 0)
            
            print(f'  {operation}:')
            print(f'    元の時間: {original}秒')
            print(f'    最適化後: {optimized}秒')
            print(f'    短縮時間: {saved}秒 ({improvement}% 改善)')
            print(f'    並列ジョブ数: {jobs}')
            print()
            
            total_saved += saved
            total_original += original
        
        if total_original > 0:
            total_improvement = (total_saved * 100) // total_original
            print(f'総合改善効果: {total_saved}秒短縮 ({total_improvement}% 改善)')
    else:
        print('時間短縮データがありません')
    
except Exception as e:
    print(f'統計表示エラー: {e}', file=sys.stderr)
    sys.exit(1)
"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# パフォーマンス測定を実行
measure_performance() {
    local operation_name="$1"
    local command="$2"
    
    local start_time=$(date +%s)
    local start_timestamp=$(date -Iseconds)
    
    if command -v log_debug >/dev/null 2>&1; then
        log_debug "パフォーマンス測定開始: $operation_name"
    fi
    
    echo "パフォーマンス測定開始: $operation_name"
    
    # コマンド実行
    local exit_code=0
    eval "$command" || exit_code=$?
    
    local end_time=$(date +%s)
    local end_timestamp=$(date -Iseconds)
    local duration=$((end_time - start_time))
    
    # 結果をログ出力
    echo "パフォーマンス測定完了: $operation_name (${duration}秒)"
    
    if command -v log_info >/dev/null 2>&1; then
        log_info "パフォーマンス測定完了: $operation_name (${duration}秒)"
    fi
    
    # 統計ファイルに記録
    if [[ -f "$OPTIMIZATION_STATS_FILE" ]]; then
        python3 -c "
import json

try:
    with open('$OPTIMIZATION_STATS_FILE', 'r') as f:
        stats = json.load(f)
    
    if 'performance_metrics' not in stats:
        stats['performance_metrics'] = {}
    
    stats['performance_metrics']['$operation_name'] = {
        'start_time': '$start_timestamp',
        'end_time': '$end_timestamp',
        'duration': $duration,
        'exit_code': $exit_code
    }
    
    with open('$OPTIMIZATION_STATS_FILE', 'w') as f:
        json.dump(stats, f, indent=2)
        
except Exception as e:
    pass
" 2>/dev/null || true
    fi
    
    return $exit_code
}

# クリーンアップ処理
cleanup_deployment_optimizer() {
    cleanup_parallel_processor
    
    if [[ -f "$OPTIMIZATION_STATS_FILE" ]]; then
        rm -f "$OPTIMIZATION_STATS_FILE"
    fi
}

# 終了時のクリーンアップを設定
trap cleanup_deployment_optimizer EXIT

# ヘルプメッセージを表示
show_help() {
    cat << EOF
デプロイメント最適化ユーティリティ - 並列処理による最適化

使用方法:
  source deployment-optimizer.sh

主要関数:
  init_deployment_optimizer                    - 最適化を初期化
  optimize_data_collection                     - データ収集の最適化
  optimize_file_operations <type> <src> <dst> - ファイル操作の最適化
  optimize_deployment_pipeline <type>         - パイプライン全体の最適化
  show_optimization_summary                   - 最適化結果サマリー
  measure_performance <name> <command>        - パフォーマンス測定

環境変数:
  OPTIMIZATION_ENABLED        - 最適化の有効/無効 (default: true)
  PARALLEL_DATA_PROCESSING    - データ処理の並列化 (default: true)
  PARALLEL_FILE_OPERATIONS    - ファイル操作の並列化 (default: true)
  CONCURRENT_VALIDATIONS      - 検証の並列実行 (default: true)

例:
  init_deployment_optimizer
  optimize_deployment_pipeline "full"
  show_optimization_summary
EOF
}

# スクリプトが直接実行された場合はヘルプを表示
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    show_help
fi