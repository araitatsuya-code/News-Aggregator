#!/bin/bash

# 詳細ログ出力機能 - 構造化ログとローテーション機能を提供
# 要件7.1, 7.2, 7.3, 7.4に対応

# ログレベル定数
readonly LOG_LEVEL_DEBUG=0
readonly LOG_LEVEL_INFO=1
readonly LOG_LEVEL_WARN=2
readonly LOG_LEVEL_ERROR=3
readonly LOG_LEVEL_CRITICAL=4

# ログ形式定数
readonly LOG_FORMAT_TEXT=1
readonly LOG_FORMAT_JSON=2

# グローバル変数
DETAILED_LOG_FILE=""
DETAILED_LOG_LEVEL=$LOG_LEVEL_INFO
DETAILED_LOG_FORMAT=$LOG_FORMAT_TEXT
DETAILED_LOG_MAX_SIZE=10485760  # 10MB
DETAILED_LOG_MAX_FILES=5
SESSION_ID=""
WORKFLOW_START_TIME=""
WORKFLOW_METADATA="{}"

# セッションIDを生成
generate_session_id() {
    SESSION_ID="deploy_$(date +%Y%m%d_%H%M%S)_$$"
}

# 詳細ログシステムを初期化
# 引数: ログファイルパス, ログレベル（オプション）, ログ形式（オプション）
init_detailed_logger() {
    local log_file="$1"
    local log_level="${2:-info}"
    local log_format="${3:-text}"
    
    DETAILED_LOG_FILE="$log_file"
    
    # ログレベルを設定
    case "$log_level" in
        "debug")    DETAILED_LOG_LEVEL=$LOG_LEVEL_DEBUG ;;
        "info")     DETAILED_LOG_LEVEL=$LOG_LEVEL_INFO ;;
        "warn")     DETAILED_LOG_LEVEL=$LOG_LEVEL_WARN ;;
        "error")    DETAILED_LOG_LEVEL=$LOG_LEVEL_ERROR ;;
        "critical") DETAILED_LOG_LEVEL=$LOG_LEVEL_CRITICAL ;;
        *)          DETAILED_LOG_LEVEL=$LOG_LEVEL_INFO ;;
    esac
    
    # ログ形式を設定
    case "$log_format" in
        "text") DETAILED_LOG_FORMAT=$LOG_FORMAT_TEXT ;;
        "json") DETAILED_LOG_FORMAT=$LOG_FORMAT_JSON ;;
        *)      DETAILED_LOG_FORMAT=$LOG_FORMAT_TEXT ;;
    esac
    
    # セッションIDを生成
    generate_session_id
    
    # ワークフロー開始時刻を記録
    WORKFLOW_START_TIME=$(date +%s)
    
    # ログディレクトリを作成
    local log_dir=$(dirname "$DETAILED_LOG_FILE")
    if [[ ! -d "$log_dir" ]]; then
        mkdir -p "$log_dir" || {
            echo "エラー: ログディレクトリの作成に失敗しました: $log_dir" >&2
            return 1
        }
    fi
    
    # ログローテーションを実行
    rotate_log_if_needed
    
    # ログファイルを初期化
    if [[ $DETAILED_LOG_FORMAT -eq $LOG_FORMAT_JSON ]]; then
        init_json_log
    else
        init_text_log
    fi
    
    # 初期化ログを出力
    detailed_log_info "詳細ログシステムを初期化しました" "logger" "{\"session_id\":\"$SESSION_ID\",\"log_level\":\"$log_level\",\"log_format\":\"$log_format\"}"
}

# テキスト形式ログを初期化
init_text_log() {
    {
        echo "# 詳細ログ - $(date '+%Y-%m-%d %H:%M:%S')"
        echo "# セッションID: $SESSION_ID"
        echo "# ログレベル: $(get_log_level_name $DETAILED_LOG_LEVEL)"
        echo "# フォーマット: [タイムスタンプ] [レベル] [コンポーネント] メッセージ"
        echo ""
    } > "$DETAILED_LOG_FILE"
}

# JSON形式ログを初期化
init_json_log() {
    {
        echo "{"
        echo "  \"log_metadata\": {"
        echo "    \"session_id\": \"$SESSION_ID\","
        echo "    \"start_time\": \"$(date -Iseconds)\","
        echo "    \"log_level\": \"$(get_log_level_name $DETAILED_LOG_LEVEL)\","
        echo "    \"format\": \"json\""
        echo "  },"
        echo "  \"entries\": ["
    } > "$DETAILED_LOG_FILE"
}

# ログレベル名を取得
get_log_level_name() {
    local level="$1"
    case "$level" in
        $LOG_LEVEL_DEBUG)    echo "DEBUG" ;;
        $LOG_LEVEL_INFO)     echo "INFO" ;;
        $LOG_LEVEL_WARN)     echo "WARN" ;;
        $LOG_LEVEL_ERROR)    echo "ERROR" ;;
        $LOG_LEVEL_CRITICAL) echo "CRITICAL" ;;
        *)                   echo "UNKNOWN" ;;
    esac
}

# ログローテーションが必要かチェックし、必要に応じて実行
rotate_log_if_needed() {
    if [[ ! -f "$DETAILED_LOG_FILE" ]]; then
        return 0
    fi
    
    local file_size=$(stat -f%z "$DETAILED_LOG_FILE" 2>/dev/null || stat -c%s "$DETAILED_LOG_FILE" 2>/dev/null || echo 0)
    
    if [[ $file_size -gt $DETAILED_LOG_MAX_SIZE ]]; then
        rotate_logs
    fi
}

# ログローテーションを実行
rotate_logs() {
    if [[ ! -f "$DETAILED_LOG_FILE" ]]; then
        return 0
    fi
    
    local log_dir=$(dirname "$DETAILED_LOG_FILE")
    local log_name=$(basename "$DETAILED_LOG_FILE")
    local log_base="${log_name%.*}"
    local log_ext="${log_name##*.}"
    
    # 既存のローテーションファイルをシフト
    for ((i=$((DETAILED_LOG_MAX_FILES-1)); i>=1; i--)); do
        local old_file="$log_dir/${log_base}.${i}.${log_ext}"
        local new_file="$log_dir/${log_base}.$((i+1)).${log_ext}"
        
        if [[ -f "$old_file" ]]; then
            if [[ $i -eq $((DETAILED_LOG_MAX_FILES-1)) ]]; then
                # 最古のファイルを削除
                rm -f "$old_file"
            else
                mv "$old_file" "$new_file"
            fi
        fi
    done
    
    # 現在のログファイルをローテーション
    mv "$DETAILED_LOG_FILE" "$log_dir/${log_base}.1.${log_ext}"
    
    # 新しいログファイルを初期化
    if [[ $DETAILED_LOG_FORMAT -eq $LOG_FORMAT_JSON ]]; then
        init_json_log
    else
        init_text_log
    fi
}

# 詳細ログエントリを出力（内部関数）
_write_detailed_log() {
    local level="$1"
    local level_num="$2"
    local component="$3"
    local message="$4"
    local metadata="$5"
    
    # ログレベルチェック
    if [[ $level_num -lt $DETAILED_LOG_LEVEL ]]; then
        return 0
    fi
    
    local timestamp=$(date -Iseconds)
    local unix_timestamp=$(date +%s)
    
    if [[ $DETAILED_LOG_FORMAT -eq $LOG_FORMAT_JSON ]]; then
        _write_json_log_entry "$level" "$component" "$message" "$metadata" "$timestamp" "$unix_timestamp"
    else
        _write_text_log_entry "$level" "$component" "$message" "$metadata" "$timestamp"
    fi
}

# テキスト形式ログエントリを出力
_write_text_log_entry() {
    local level="$1"
    local component="$2"
    local message="$3"
    local metadata="$4"
    local timestamp="$5"
    
    {
        echo "[$timestamp] [$level] [$component] $message"
        if [[ -n "$metadata" ]] && [[ "$metadata" != "{}" ]]; then
            echo "  メタデータ: $metadata"
        fi
    } >> "$DETAILED_LOG_FILE"
}

# JSON形式ログエントリを出力
_write_json_log_entry() {
    local level="$1"
    local component="$2"
    local message="$3"
    local metadata="$4"
    local timestamp="$5"
    local unix_timestamp="$6"
    
    # JSONエントリを構築
    local json_entry
    json_entry=$(cat << EOF
    {
      "timestamp": "$timestamp",
      "unix_timestamp": $unix_timestamp,
      "session_id": "$SESSION_ID",
      "level": "$level",
      "component": "$component",
      "message": "$message"
EOF
    )
    
    # メタデータを追加
    if [[ -n "$metadata" ]] && [[ "$metadata" != "{}" ]]; then
        json_entry="$json_entry,
      \"metadata\": $metadata"
    fi
    
    json_entry="$json_entry
    }"
    
    # ファイルに追記（カンマ区切りで）
    # 注意: 最後のエントリの後にカンマが残るが、ログ終了時に修正される
    echo "$json_entry," >> "$DETAILED_LOG_FILE"
}

# デバッグログを出力
detailed_log_debug() {
    local message="$1"
    local component="${2:-main}"
    local metadata="${3:-{}}"
    
    _write_detailed_log "DEBUG" $LOG_LEVEL_DEBUG "$component" "$message" "$metadata"
}

# 情報ログを出力
detailed_log_info() {
    local message="$1"
    local component="${2:-main}"
    local metadata="${3:-{}}"
    
    _write_detailed_log "INFO" $LOG_LEVEL_INFO "$component" "$message" "$metadata"
}

# 警告ログを出力
detailed_log_warn() {
    local message="$1"
    local component="${2:-main}"
    local metadata="${3:-{}}"
    
    _write_detailed_log "WARN" $LOG_LEVEL_WARN "$component" "$message" "$metadata"
}

# エラーログを出力
detailed_log_error() {
    local message="$1"
    local component="${2:-main}"
    local metadata="${3:-{}}"
    
    _write_detailed_log "ERROR" $LOG_LEVEL_ERROR "$component" "$message" "$metadata"
}

# 致命的エラーログを出力
detailed_log_critical() {
    local message="$1"
    local component="${2:-main}"
    local metadata="${3:-{}}"
    
    _write_detailed_log "CRITICAL" $LOG_LEVEL_CRITICAL "$component" "$message" "$metadata"
}

# ステップ開始ログを出力
detailed_log_step_start() {
    local step_name="$1"
    local step_number="${2:-}"
    local total_steps="${3:-}"
    
    local metadata="{\"step_name\":\"$step_name\""
    if [[ -n "$step_number" ]]; then
        metadata="$metadata,\"step_number\":$step_number"
    fi
    if [[ -n "$total_steps" ]]; then
        metadata="$metadata,\"total_steps\":$total_steps"
    fi
    metadata="$metadata,\"action\":\"step_start\"}"
    
    detailed_log_info "ステップ開始: $step_name" "workflow" "$metadata"
}

# ステップ完了ログを出力
detailed_log_step_complete() {
    local step_name="$1"
    local duration="$2"
    local result="${3:-success}"
    
    local metadata="{\"step_name\":\"$step_name\",\"duration\":$duration,\"result\":\"$result\",\"action\":\"step_complete\"}"
    
    if [[ "$result" == "success" ]]; then
        detailed_log_info "ステップ完了: $step_name (${duration}秒)" "workflow" "$metadata"
    else
        detailed_log_error "ステップ失敗: $step_name (${duration}秒)" "workflow" "$metadata"
    fi
}

# コマンド実行ログを出力
detailed_log_command() {
    local command="$1"
    local exit_code="$2"
    local duration="${3:-0}"
    local output="${4:-}"
    
    local metadata="{\"command\":\"$command\",\"exit_code\":$exit_code,\"duration\":$duration"
    if [[ -n "$output" ]]; then
        # 出力を安全にJSONエスケープ
        local escaped_output=$(echo "$output" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | tr '\n' ' ')
        metadata="$metadata,\"output\":\"$escaped_output\""
    fi
    metadata="$metadata,\"action\":\"command_execution\"}"
    
    if [[ $exit_code -eq 0 ]]; then
        detailed_log_info "コマンド実行成功: $command" "command" "$metadata"
    else
        detailed_log_error "コマンド実行失敗: $command (終了コード: $exit_code)" "command" "$metadata"
    fi
}

# システム情報ログを出力
detailed_log_system_info() {
    local info_type="$1"
    local info_data="$2"
    
    local metadata="{\"info_type\":\"$info_type\",\"data\":$info_data,\"action\":\"system_info\"}"
    
    detailed_log_info "システム情報: $info_type" "system" "$metadata"
}

# パフォーマンス情報ログを出力
detailed_log_performance() {
    local metric_name="$1"
    local metric_value="$2"
    local unit="${3:-}"
    
    local metadata="{\"metric_name\":\"$metric_name\",\"value\":$metric_value"
    if [[ -n "$unit" ]]; then
        metadata="$metadata,\"unit\":\"$unit\""
    fi
    metadata="$metadata,\"action\":\"performance_metric\"}"
    
    detailed_log_info "パフォーマンス: $metric_name = $metric_value $unit" "performance" "$metadata"
}

# 実行サマリーを生成してログに出力
generate_execution_summary() {
    local total_duration="$1"
    local success_count="$2"
    local failure_count="$3"
    local warning_count="${4:-0}"
    
    local end_time=$(date +%s)
    local summary_metadata
    
    summary_metadata=$(cat << EOF
{
  "workflow_summary": {
    "session_id": "$SESSION_ID",
    "start_time": $WORKFLOW_START_TIME,
    "end_time": $end_time,
    "total_duration": $total_duration,
    "success_count": $success_count,
    "failure_count": $failure_count,
    "warning_count": $warning_count,
    "completion_status": "$(if [[ $failure_count -eq 0 ]]; then echo "success"; else echo "failure"; fi)"
  },
  "action": "workflow_summary"
}
EOF
    )
    
    detailed_log_info "ワークフロー実行サマリー - 成功: $success_count, 失敗: $failure_count, 警告: $warning_count" "summary" "$summary_metadata"
}

# JSON形式ログを適切に終了
finalize_json_log() {
    if [[ $DETAILED_LOG_FORMAT -eq $LOG_FORMAT_JSON ]] && [[ -f "$DETAILED_LOG_FILE" ]]; then
        # 最後のカンマを削除し、JSONを閉じる
        sed -i '' '$s/,$//' "$DETAILED_LOG_FILE" 2>/dev/null || sed -i '$s/,$//' "$DETAILED_LOG_FILE" 2>/dev/null
        
        {
            echo "  ],"
            echo "  \"log_finalized\": {"
            echo "    \"timestamp\": \"$(date -Iseconds)\","
            echo "    \"session_id\": \"$SESSION_ID\""
            echo "  }"
            echo "}"
        } >> "$DETAILED_LOG_FILE"
    fi
}

# ログファイルを圧縮
compress_log_file() {
    local log_file="$1"
    
    if [[ -f "$log_file" ]] && command -v gzip >/dev/null 2>&1; then
        gzip "$log_file"
        detailed_log_info "ログファイルを圧縮しました: ${log_file}.gz" "logger"
    fi
}

# 古いログファイルをクリーンアップ
cleanup_old_logs() {
    local log_dir=$(dirname "$DETAILED_LOG_FILE")
    local log_name=$(basename "$DETAILED_LOG_FILE")
    local log_base="${log_name%.*}"
    local log_ext="${log_name##*.}"
    
    # 設定された最大ファイル数を超える古いログを削除
    local log_files=("$log_dir"/${log_base}.*.${log_ext})
    local log_count=${#log_files[@]}
    
    if [[ $log_count -gt $DETAILED_LOG_MAX_FILES ]]; then
        # 古いファイルから削除
        local files_to_delete=$((log_count - DETAILED_LOG_MAX_FILES))
        for ((i=0; i<files_to_delete; i++)); do
            if [[ -f "${log_files[$i]}" ]]; then
                rm -f "${log_files[$i]}"
                detailed_log_info "古いログファイルを削除しました: ${log_files[$i]}" "logger"
            fi
        done
    fi
}

# ログ統計を表示
show_log_statistics() {
    if [[ ! -f "$DETAILED_LOG_FILE" ]]; then
        echo "ログファイルが見つかりません: $DETAILED_LOG_FILE"
        return 1
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "ログ統計"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "ログファイル: $DETAILED_LOG_FILE"
    echo "セッションID: $SESSION_ID"
    
    # ファイルサイズ
    local file_size=$(stat -f%z "$DETAILED_LOG_FILE" 2>/dev/null || stat -c%s "$DETAILED_LOG_FILE" 2>/dev/null || echo 0)
    local file_size_mb=$((file_size / 1024 / 1024))
    echo "ファイルサイズ: ${file_size} bytes (${file_size_mb} MB)"
    
    # エントリ数（形式に応じて）
    if [[ $DETAILED_LOG_FORMAT -eq $LOG_FORMAT_JSON ]]; then
        local entry_count=$(grep -c '"timestamp":' "$DETAILED_LOG_FILE" 2>/dev/null || echo 0)
        echo "ログエントリ数: $entry_count"
    else
        local entry_count=$(grep -c '^\[' "$DETAILED_LOG_FILE" 2>/dev/null || echo 0)
        echo "ログエントリ数: $entry_count"
    fi
    
    # レベル別統計
    if [[ $DETAILED_LOG_FORMAT -eq $LOG_FORMAT_TEXT ]]; then
        echo
        echo "レベル別統計:"
        for level in DEBUG INFO WARN ERROR CRITICAL; do
            local count=$(grep -c "\[$level\]" "$DETAILED_LOG_FILE" 2>/dev/null || echo 0)
            printf "  %-8s: %d\n" "$level" "$count"
        done
    fi
}

# ログ設定を表示
show_log_configuration() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "ログ設定"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "ログファイル: $DETAILED_LOG_FILE"
    echo "ログレベル: $(get_log_level_name $DETAILED_LOG_LEVEL)"
    echo "ログ形式: $(if [[ $DETAILED_LOG_FORMAT -eq $LOG_FORMAT_JSON ]]; then echo "JSON"; else echo "TEXT"; fi)"
    echo "最大ファイルサイズ: $((DETAILED_LOG_MAX_SIZE / 1024 / 1024)) MB"
    echo "最大ファイル数: $DETAILED_LOG_MAX_FILES"
    echo "セッションID: $SESSION_ID"
}

# 詳細ログシステムを終了
finalize_detailed_logger() {
    if [[ -n "$DETAILED_LOG_FILE" ]]; then
        detailed_log_info "詳細ログシステムを終了します" "logger"
        
        # JSON形式の場合は適切に終了
        if [[ $DETAILED_LOG_FORMAT -eq $LOG_FORMAT_JSON ]]; then
            finalize_json_log
        fi
        
        # 古いログファイルをクリーンアップ
        cleanup_old_logs
        
        # ログ統計を表示
        if command -v log_info >/dev/null 2>&1; then
            log_info "詳細ログを出力しました: $DETAILED_LOG_FILE"
        fi
    fi
}

# ヘルプメッセージを表示
show_help() {
    cat << EOF
詳細ログ出力機能 - 構造化ログとローテーション機能

使用方法:
  source detailed-logger.sh

初期化:
  init_detailed_logger <ログファイル> [ログレベル] [ログ形式]

ログ出力関数:
  detailed_log_debug <メッセージ> [コンポーネント] [メタデータ]
  detailed_log_info <メッセージ> [コンポーネント] [メタデータ]
  detailed_log_warn <メッセージ> [コンポーネント] [メタデータ]
  detailed_log_error <メッセージ> [コンポーネント] [メタデータ]
  detailed_log_critical <メッセージ> [コンポーネント] [メタデータ]

特殊ログ関数:
  detailed_log_step_start <ステップ名> [ステップ番号] [総ステップ数]
  detailed_log_step_complete <ステップ名> <実行時間> [結果]
  detailed_log_command <コマンド> <終了コード> [実行時間] [出力]
  detailed_log_system_info <情報タイプ> <情報データ>
  detailed_log_performance <メトリック名> <値> [単位]

管理関数:
  generate_execution_summary <総時間> <成功数> <失敗数> [警告数]
  finalize_detailed_logger
  show_log_statistics
  show_log_configuration

ログレベル: debug, info, warn, error, critical
ログ形式: text, json

例:
  init_detailed_logger "logs/deploy-detail.log" "info" "json"
  detailed_log_step_start "データ収集" 1 5
  detailed_log_command "python3 scripts/main.py" 0 120
  detailed_log_step_complete "データ収集" 120 "success"
  finalize_detailed_logger
EOF
}

# 終了時の処理を設定
trap finalize_detailed_logger EXIT

# スクリプトが直接実行された場合はヘルプを表示
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    show_help
fi