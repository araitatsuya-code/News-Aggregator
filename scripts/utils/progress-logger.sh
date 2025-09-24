#!/bin/bash

# 進行状況ロガー - ステップ進行状況の表示とログ出力を行う
# 要件6.1, 6.2, 6.3に対応

# カラーコード定義
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color

# プログレスバー文字
readonly PROGRESS_CHAR="█"
readonly EMPTY_CHAR="░"
readonly PROGRESS_WIDTH=50

# ログレベル
readonly LOG_LEVEL_DEBUG=0
readonly LOG_LEVEL_INFO=1
readonly LOG_LEVEL_WARN=2
readonly LOG_LEVEL_ERROR=3

# グローバル変数
CURRENT_LOG_LEVEL=${LOG_LEVEL_INFO}
LOG_FILE=""
STEP_COUNT=0
CURRENT_STEP=0

# ログレベルを設定する
# 引数: ログレベル (debug|info|warn|error)
set_log_level() {
    local level="$1"
    case "$level" in
        "debug") CURRENT_LOG_LEVEL=$LOG_LEVEL_DEBUG ;;
        "info")  CURRENT_LOG_LEVEL=$LOG_LEVEL_INFO ;;
        "warn")  CURRENT_LOG_LEVEL=$LOG_LEVEL_WARN ;;
        "error") CURRENT_LOG_LEVEL=$LOG_LEVEL_ERROR ;;
        *) 
            echo -e "${RED}[ERROR]${NC} 無効なログレベル: $level" >&2
            return 1
            ;;
    esac
}

# ログファイルを設定する
# 引数: ログファイルパス
set_log_file() {
    LOG_FILE="$1"
    # ログディレクトリが存在しない場合は作成
    local log_dir=$(dirname "$LOG_FILE")
    if [[ ! -d "$log_dir" ]]; then
        mkdir -p "$log_dir"
    fi
}

# ログメッセージを出力する（内部関数）
_log_message() {
    local level="$1"
    local color="$2"
    local message="$3"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # コンソール出力
    echo -e "${color}[${level}]${NC} ${message}"
    
    # ファイル出力（ログファイルが設定されている場合）
    if [[ -n "$LOG_FILE" ]]; then
        echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    fi
}

# デバッグメッセージを出力
log_debug() {
    if [[ $CURRENT_LOG_LEVEL -le $LOG_LEVEL_DEBUG ]]; then
        _log_message "DEBUG" "$CYAN" "$1"
    fi
}

# 情報メッセージを出力
log_info() {
    if [[ $CURRENT_LOG_LEVEL -le $LOG_LEVEL_INFO ]]; then
        _log_message "INFO" "$BLUE" "$1"
    fi
}

# 警告メッセージを出力
log_warn() {
    if [[ $CURRENT_LOG_LEVEL -le $LOG_LEVEL_WARN ]]; then
        _log_message "WARN" "$YELLOW" "$1"
    fi
}

# エラーメッセージを出力
log_error() {
    if [[ $CURRENT_LOG_LEVEL -le $LOG_LEVEL_ERROR ]]; then
        _log_message "ERROR" "$RED" "$1"
    fi
}

# 成功メッセージを出力
log_success() {
    _log_message "SUCCESS" "$GREEN" "$1"
}

# ステップの総数を設定
# 引数: ステップ総数
set_total_steps() {
    STEP_COUNT="$1"
    CURRENT_STEP=0
    log_debug "総ステップ数を設定: $STEP_COUNT"
}

# 新しいステップを開始
# 引数: ステップ名
start_step() {
    local step_name="$1"
    ((CURRENT_STEP++))
    
    echo
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${WHITE}ステップ ${CURRENT_STEP}/${STEP_COUNT}: ${step_name}${NC}"
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    log_info "ステップ開始: $step_name (${CURRENT_STEP}/${STEP_COUNT})"
}

# ステップ完了を表示
# 引数: ステップ名, 実行時間（秒）
complete_step() {
    local step_name="$1"
    local duration="$2"
    
    echo -e "${GREEN}✓${NC} ${step_name} ${GREEN}完了${NC}"
    if [[ -n "$duration" ]]; then
        echo -e "  実行時間: ${CYAN}${duration}秒${NC}"
    fi
    
    log_success "ステップ完了: $step_name (実行時間: ${duration}秒)"
}

# ステップ失敗を表示
# 引数: ステップ名, エラーメッセージ
fail_step() {
    local step_name="$1"
    local error_message="$2"
    
    echo -e "${RED}✗${NC} ${step_name} ${RED}失敗${NC}"
    if [[ -n "$error_message" ]]; then
        echo -e "  エラー: ${RED}${error_message}${NC}"
    fi
    
    log_error "ステップ失敗: $step_name - $error_message"
}

# プログレスバーを表示
# 引数: 現在の進行度（0-100）, メッセージ（オプション）
show_progress() {
    local progress="$1"
    local message="$2"
    
    # 進行度を0-100の範囲に制限
    if [[ $progress -lt 0 ]]; then
        progress=0
    elif [[ $progress -gt 100 ]]; then
        progress=100
    fi
    
    # プログレスバーの計算
    local filled_width=$((progress * PROGRESS_WIDTH / 100))
    local empty_width=$((PROGRESS_WIDTH - filled_width))
    
    # プログレスバーの構築
    local progress_bar=""
    for ((i=0; i<filled_width; i++)); do
        progress_bar+="$PROGRESS_CHAR"
    done
    for ((i=0; i<empty_width; i++)); do
        progress_bar+="$EMPTY_CHAR"
    done
    
    # 表示
    printf "\r${CYAN}[${progress_bar}]${NC} ${progress}%%"
    if [[ -n "$message" ]]; then
        printf " ${message}"
    fi
}

# プログレスバーを完了して改行
finish_progress() {
    echo
}

# 実行サマリーを表示
# 引数: 総実行時間（秒）, 成功ステップ数, 失敗ステップ数
show_summary() {
    local total_time="$1"
    local success_count="$2"
    local failure_count="$3"
    
    echo
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${WHITE}実行サマリー${NC}"
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "総実行時間: ${CYAN}${total_time}秒${NC}"
    echo -e "成功ステップ: ${GREEN}${success_count}${NC}"
    
    if [[ $failure_count -gt 0 ]]; then
        echo -e "失敗ステップ: ${RED}${failure_count}${NC}"
        echo -e "実行結果: ${RED}失敗${NC}"
    else
        echo -e "実行結果: ${GREEN}成功${NC}"
    fi
    
    log_info "実行サマリー - 総時間: ${total_time}秒, 成功: ${success_count}, 失敗: ${failure_count}"
}

# スピナーを表示（長時間実行される処理用）
# 引数: メッセージ
show_spinner() {
    local message="$1"
    local spinner_chars="⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
    local i=0
    
    while true; do
        local char=${spinner_chars:$((i % ${#spinner_chars})):1}
        printf "\r${CYAN}${char}${NC} ${message}"
        sleep 0.1
        ((i++))
    done
}

# スピナーを停止
stop_spinner() {
    printf "\r"
}

# ヘルプメッセージを表示
show_help() {
    cat << EOF
進行状況ロガー - ステップ進行状況の表示とログ出力

使用方法:
  source progress-logger.sh

主要関数:
  set_log_level <level>     - ログレベルを設定 (debug|info|warn|error)
  set_log_file <path>       - ログファイルを設定
  
  log_debug <message>       - デバッグメッセージを出力
  log_info <message>        - 情報メッセージを出力
  log_warn <message>        - 警告メッセージを出力
  log_error <message>       - エラーメッセージを出力
  log_success <message>     - 成功メッセージを出力
  
  set_total_steps <count>   - ステップ総数を設定
  start_step <name>         - 新しいステップを開始
  complete_step <name> <duration> - ステップ完了を表示
  fail_step <name> <error>  - ステップ失敗を表示
  
  show_progress <percent> [message] - プログレスバーを表示
  finish_progress           - プログレスバーを完了
  
  show_summary <time> <success> <failure> - 実行サマリーを表示

例:
  set_log_file "logs/deploy.log"
  set_total_steps 3
  start_step "環境確認"
  complete_step "環境確認" 5
EOF
}

# スクリプトが直接実行された場合はヘルプを表示
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    show_help
fi