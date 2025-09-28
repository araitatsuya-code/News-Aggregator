#!/bin/bash

# 並列処理ユーティリティ - 並列実行による実行時間短縮を提供する
# 要件4.1, 4.2に対応

# 並列処理の設定
MAX_PARALLEL_JOBS=${MAX_PARALLEL_JOBS:-4}  # デフォルト4並列
JOB_QUEUE_FILE="/tmp/parallel_jobs_$$"
JOB_RESULTS_FILE="/tmp/parallel_results_$$"
JOB_PIDS=()

# 初期化処理
init_parallel_processor() {
    # 一時ファイルを初期化
    echo "# job_id|command|status|start_time|end_time|exit_code" > "$JOB_QUEUE_FILE"
    echo "# job_id|result|error" > "$JOB_RESULTS_FILE"
    
    # CPUコア数に基づいて並列数を調整
    local cpu_cores=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo "4")
    local optimal_jobs=$((cpu_cores > 2 ? cpu_cores - 1 : cpu_cores))
    
    if [[ $optimal_jobs -lt $MAX_PARALLEL_JOBS ]]; then
        MAX_PARALLEL_JOBS=$optimal_jobs
    fi
    
    if command -v log_debug >/dev/null 2>&1; then
        log_debug "並列処理初期化 - 最大並列数: $MAX_PARALLEL_JOBS, CPUコア数: $cpu_cores"
    fi
}

# クリーンアップ処理
cleanup_parallel_processor() {
    # 実行中のジョブを終了
    for pid in "${JOB_PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
        fi
    done
    
    # 一時ファイルを削除
    [[ -f "$JOB_QUEUE_FILE" ]] && rm -f "$JOB_QUEUE_FILE"
    [[ -f "$JOB_RESULTS_FILE" ]] && rm -f "$JOB_RESULTS_FILE"
}

# 終了時のクリーンアップを設定
trap cleanup_parallel_processor EXIT

# 並列ジョブを追加
# 引数: job_id, command, description
add_parallel_job() {
    local job_id="$1"
    local command="$2"
    local description="$3"
    
    if [[ -z "$job_id" ]] || [[ -z "$command" ]]; then
        echo "エラー: ジョブIDとコマンドが必要です" >&2
        return 1
    fi
    
    # 初期化されていない場合は初期化
    if [[ ! -f "$JOB_QUEUE_FILE" ]]; then
        init_parallel_processor
    fi
    
    # ジョブをキューに追加
    echo "$job_id|$command|pending|0|0|0" >> "$JOB_QUEUE_FILE"
    
    if command -v log_debug >/dev/null 2>&1; then
        log_debug "並列ジョブ追加: $job_id - $description"
    fi
}

# 単一ジョブを実行（内部関数）
_execute_job() {
    local job_id="$1"
    local command="$2"
    local start_time=$(date +%s)
    
    # ジョブ開始をログ
    if command -v log_debug >/dev/null 2>&1; then
        log_debug "ジョブ開始: $job_id"
    fi
    
    # コマンド実行
    local output=""
    local error=""
    local exit_code=0
    
    # 出力とエラーをキャプチャしながら実行
    {
        output=$(eval "$command" 2>&1)
        exit_code=$?
    } || {
        exit_code=$?
        error="Command failed with exit code $exit_code"
    }
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # 結果を記録
    local status="completed"
    if [[ $exit_code -ne 0 ]]; then
        status="failed"
        error="${error:-Command failed}"
    fi
    
    # 結果ファイルに記録（ロック機能付き、flockが利用可能な場合のみ）
    if command -v flock >/dev/null 2>&1; then
        (
            flock -x 200
            echo "$job_id|$status|$start_time|$end_time|$exit_code|$duration" >> "$JOB_RESULTS_FILE"
            if [[ -n "$output" ]]; then
                echo "$job_id|output|$output" >> "$JOB_RESULTS_FILE"
            fi
            if [[ -n "$error" ]]; then
                echo "$job_id|error|$error" >> "$JOB_RESULTS_FILE"
            fi
        ) 200>>"$JOB_RESULTS_FILE.lock"
    else
        # flockが利用できない場合は直接書き込み
        echo "$job_id|$status|$start_time|$end_time|$exit_code|$duration" >> "$JOB_RESULTS_FILE"
        if [[ -n "$output" ]]; then
            echo "$job_id|output|$output" >> "$JOB_RESULTS_FILE"
        fi
        if [[ -n "$error" ]]; then
            echo "$job_id|error|$error" >> "$JOB_RESULTS_FILE"
        fi
    fi
    
    if command -v log_debug >/dev/null 2>&1; then
        if [[ $exit_code -eq 0 ]]; then
            log_debug "ジョブ完了: $job_id (${duration}秒)"
        else
            log_debug "ジョブ失敗: $job_id (${duration}秒, 終了コード: $exit_code)"
        fi
    fi
    
    return $exit_code
}

# 並列ジョブを実行
# 引数: timeout_seconds (オプション)
execute_parallel_jobs() {
    local timeout_seconds="${1:-300}"  # デフォルト5分タイムアウト
    
    if [[ ! -f "$JOB_QUEUE_FILE" ]]; then
        echo "エラー: ジョブキューが見つかりません" >&2
        return 1
    fi
    
    local total_jobs=$(grep -v "^#" "$JOB_QUEUE_FILE" | wc -l)
    if [[ $total_jobs -eq 0 ]]; then
        if command -v log_info >/dev/null 2>&1; then
            log_info "実行するジョブがありません"
        fi
        return 0
    fi
    
    if command -v log_info >/dev/null 2>&1; then
        log_info "並列ジョブ実行開始: $total_jobs ジョブ, 最大並列数: $MAX_PARALLEL_JOBS"
    fi
    
    local running_jobs=0
    local completed_jobs=0
    local failed_jobs=0
    local job_pids=()
    local start_time=$(date +%s)
    
    # プログレス表示の初期化
    if command -v show_progress >/dev/null 2>&1; then
        show_progress 0 "並列ジョブ実行中..."
    fi
    
    # ジョブを順次起動
    while IFS='|' read -r job_id command status start end exit_code; do
        # ヘッダー行をスキップ
        [[ "$job_id" == "# job_id" ]] && continue
        [[ "$status" != "pending" ]] && continue
        
        # 並列数制限チェック
        while [[ $running_jobs -ge $MAX_PARALLEL_JOBS ]]; do
            # 完了したジョブをチェック
            local new_pids=()
            for pid in "${job_pids[@]}"; do
                if kill -0 "$pid" 2>/dev/null; then
                    new_pids+=("$pid")
                else
                    ((running_jobs--))
                    ((completed_jobs++))
                    
                    # プログレス更新
                    local progress=$((completed_jobs * 100 / total_jobs))
                    if command -v show_progress >/dev/null 2>&1; then
                        show_progress $progress "並列ジョブ実行中... ($completed_jobs/$total_jobs)"
                    fi
                fi
            done
            job_pids=("${new_pids[@]}")
            
            # タイムアウトチェック
            local current_time=$(date +%s)
            if [[ $((current_time - start_time)) -gt $timeout_seconds ]]; then
                echo "エラー: 並列ジョブ実行がタイムアウトしました" >&2
                return 1
            fi
            
            sleep 0.5
        done
        
        # ジョブを背景で実行
        _execute_job "$job_id" "$command" &
        local job_pid=$!
        job_pids+=("$job_pid")
        JOB_PIDS+=("$job_pid")
        ((running_jobs++))
        
    done < "$JOB_QUEUE_FILE"
    
    # 残りのジョブの完了を待機
    while [[ $running_jobs -gt 0 ]]; do
        local new_pids=()
        for pid in "${job_pids[@]}"; do
            if kill -0 "$pid" 2>/dev/null; then
                new_pids+=("$pid")
            else
                ((running_jobs--))
                ((completed_jobs++))
                
                # プログレス更新
                local progress=$((completed_jobs * 100 / total_jobs))
                if command -v show_progress >/dev/null 2>&1; then
                    show_progress $progress "並列ジョブ実行中... ($completed_jobs/$total_jobs)"
                fi
            fi
        done
        job_pids=("${new_pids[@]}")
        
        # タイムアウトチェック
        local current_time=$(date +%s)
        if [[ $((current_time - start_time)) -gt $timeout_seconds ]]; then
            echo "エラー: 並列ジョブ実行がタイムアウトしました" >&2
            return 1
        fi
        
        sleep 0.5
    done
    
    # プログレス完了
    if command -v finish_progress >/dev/null 2>&1; then
        finish_progress
    fi
    
    # 結果を集計
    local end_time=$(date +%s)
    local total_duration=$((end_time - start_time))
    
    # 失敗ジョブ数をカウント
    if [[ -f "$JOB_RESULTS_FILE" ]]; then
        failed_jobs=$(grep "|failed|" "$JOB_RESULTS_FILE" | wc -l)
    fi
    
    if command -v log_info >/dev/null 2>&1; then
        log_info "並列ジョブ実行完了: 総時間 ${total_duration}秒, 成功 $((completed_jobs - failed_jobs)), 失敗 $failed_jobs"
    fi
    
    # 失敗があった場合はエラーを返す
    if [[ $failed_jobs -gt 0 ]]; then
        return 1
    fi
    
    return 0
}

# ジョブ結果を取得
# 引数: job_id
get_job_result() {
    local job_id="$1"
    
    if [[ -z "$job_id" ]]; then
        echo "エラー: ジョブIDが必要です" >&2
        return 1
    fi
    
    if [[ ! -f "$JOB_RESULTS_FILE" ]]; then
        echo "エラー: 結果ファイルが見つかりません" >&2
        return 1
    fi
    
    # ジョブの結果を検索
    local result=$(grep "^$job_id|" "$JOB_RESULTS_FILE" | head -1)
    if [[ -n "$result" ]]; then
        echo "$result"
        return 0
    else
        echo "ジョブが見つかりません: $job_id" >&2
        return 1
    fi
}

# 全ジョブの結果サマリーを表示
show_parallel_results() {
    if [[ ! -f "$JOB_RESULTS_FILE" ]]; then
        echo "結果ファイルが見つかりません"
        return 1
    fi
    
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "並列ジョブ実行結果"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local total_jobs=0
    local completed_jobs=0
    local failed_jobs=0
    local total_duration=0
    
    # 結果を集計
    while IFS='|' read -r job_id status start_time end_time exit_code duration; do
        # ヘッダー行をスキップ
        [[ "$job_id" == "# job_id" ]] && continue
        
        ((total_jobs++))
        
        if [[ "$status" == "completed" ]]; then
            ((completed_jobs++))
            echo "✓ $job_id: 成功 (${duration}秒)"
        elif [[ "$status" == "failed" ]]; then
            ((failed_jobs++))
            echo "✗ $job_id: 失敗 (${duration}秒, 終了コード: $exit_code)"
            
            # エラー詳細を表示
            local error_detail=$(grep "^$job_id|error|" "$JOB_RESULTS_FILE" | cut -d'|' -f3-)
            if [[ -n "$error_detail" ]]; then
                echo "  エラー: $error_detail"
            fi
        fi
        
        if [[ -n "$duration" ]] && [[ "$duration" =~ ^[0-9]+$ ]]; then
            total_duration=$((total_duration + duration))
        fi
        
    done < <(grep -v "^#" "$JOB_RESULTS_FILE" | grep "|completed\||failed|")
    
    echo
    echo "サマリー:"
    echo "  総ジョブ数: $total_jobs"
    echo "  成功: $completed_jobs"
    echo "  失敗: $failed_jobs"
    echo "  合計実行時間: ${total_duration}秒"
    
    if [[ $total_jobs -gt 0 ]]; then
        local success_rate=$((completed_jobs * 100 / total_jobs))
        echo "  成功率: ${success_rate}%"
        
        if [[ $total_duration -gt 0 ]]; then
            local avg_duration=$((total_duration / total_jobs))
            echo "  平均実行時間: ${avg_duration}秒"
        fi
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 並列ファイル操作: 複数ファイルのコピー
parallel_file_copy() {
    local source_pattern="$1"
    local destination_dir="$2"
    local description="${3:-ファイルコピー}"
    
    if [[ -z "$source_pattern" ]] || [[ -z "$destination_dir" ]]; then
        echo "エラー: ソースパターンと宛先ディレクトリが必要です" >&2
        return 1
    fi
    
    # 宛先ディレクトリを作成
    mkdir -p "$destination_dir"
    
    # ファイルリストを取得（パターンを直接展開）
    local files=()
    
    # パターンがワイルドカードを含む場合の処理
    if [[ "$source_pattern" == *"*"* ]]; then
        # シェルのグロブ展開を使用
        for file in $source_pattern; do
            if [[ -f "$file" ]]; then
                files+=("$file")
            fi
        done
    else
        # 単一ファイルまたはディレクトリの場合
        if [[ -f "$source_pattern" ]]; then
            files+=("$source_pattern")
        elif [[ -d "$source_pattern" ]]; then
            while IFS= read -r -d '' file; do
                files+=("$file")
            done < <(find "$source_pattern" -type f -print0 2>/dev/null)
        fi
    fi
    
    if [[ ${#files[@]} -eq 0 ]]; then
        if command -v log_warn >/dev/null 2>&1; then
            log_warn "コピー対象のファイルが見つかりません: $source_pattern"
        fi
        return 0
    fi
    
    # 並列コピージョブを追加
    local job_count=0
    for file in "${files[@]}"; do
        local filename=$(basename "$file")
        local job_id="copy_${job_count}"
        local copy_command="cp '$file' '$destination_dir/$filename'"
        
        add_parallel_job "$job_id" "$copy_command" "$description: $filename"
        ((job_count++))
    done
    
    if command -v log_info >/dev/null 2>&1; then
        log_info "$description: $job_count ファイルを並列コピー中..."
    fi
    
    # 並列実行
    execute_parallel_jobs 120  # 2分タイムアウト
}

# 並列データ検証: 複数JSONファイルの検証
parallel_json_validation() {
    local json_pattern="$1"
    local description="${2:-JSON検証}"
    
    if [[ -z "$json_pattern" ]]; then
        echo "エラー: JSONファイルパターンが必要です" >&2
        return 1
    fi
    
    # JSONファイルリストを取得（パターンを直接展開）
    local json_files=()
    
    # パターンがワイルドカードを含む場合の処理
    if [[ "$json_pattern" == *"*"* ]]; then
        # シェルのグロブ展開を使用
        for file in $json_pattern; do
            if [[ -f "$file" ]] && [[ "$file" == *.json ]]; then
                json_files+=("$file")
            fi
        done
    else
        # 単一ファイルまたはディレクトリの場合
        if [[ -f "$json_pattern" ]]; then
            json_files+=("$json_pattern")
        elif [[ -d "$json_pattern" ]]; then
            while IFS= read -r -d '' file; do
                json_files+=("$file")
            done < <(find "$json_pattern" -name "*.json" -type f -print0 2>/dev/null)
        fi
    fi
    
    if [[ ${#json_files[@]} -eq 0 ]]; then
        if command -v log_warn >/dev/null 2>&1; then
            log_warn "検証対象のJSONファイルが見つかりません: $json_pattern"
        fi
        return 0
    fi
    
    # 並列検証ジョブを追加
    local job_count=0
    for json_file in "${json_files[@]}"; do
        local job_id="validate_${job_count}"
        local validate_command="python3 -m json.tool '$json_file' >/dev/null 2>&1"
        
        add_parallel_job "$job_id" "$validate_command" "$description: $(basename "$json_file")"
        ((job_count++))
    done
    
    if command -v log_info >/dev/null 2>&1; then
        log_info "$description: $job_count ファイルを並列検証中..."
    fi
    
    # 並列実行
    execute_parallel_jobs 60  # 1分タイムアウト
}

# ヘルプメッセージを表示
show_help() {
    cat << EOF
並列処理ユーティリティ - 並列実行による実行時間短縮

使用方法:
  source parallel-processor.sh

主要関数:
  init_parallel_processor                    - 並列処理を初期化
  add_parallel_job <id> <command> [desc]     - 並列ジョブを追加
  execute_parallel_jobs [timeout]           - 並列ジョブを実行
  get_job_result <job_id>                   - ジョブ結果を取得
  show_parallel_results                     - 実行結果サマリーを表示
  
  parallel_file_copy <pattern> <dest> [desc] - 並列ファイルコピー
  parallel_json_validation <pattern> [desc]  - 並列JSON検証

環境変数:
  MAX_PARALLEL_JOBS  - 最大並列数（デフォルト: 4）

例:
  init_parallel_processor
  add_parallel_job "backup" "cp -r data backup/" "データバックアップ"
  add_parallel_job "validate" "python3 -m json.tool data.json" "JSON検証"
  execute_parallel_jobs
  show_parallel_results
EOF
}

# スクリプトが直接実行された場合はヘルプを表示
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    show_help
fi