#!/bin/bash

# 統一エラーハンドリング - 全スクリプトで使用する共通エラー処理機能
# 要件7.1, 7.2に対応

# エラー分類定数
readonly ERROR_TYPE_ENVIRONMENT=1
readonly ERROR_TYPE_DEPENDENCY=2
readonly ERROR_TYPE_NETWORK=3
readonly ERROR_TYPE_FILE_SYSTEM=4
readonly ERROR_TYPE_PERMISSION=5
readonly ERROR_TYPE_VALIDATION=6
readonly ERROR_TYPE_EXTERNAL_COMMAND=7
readonly ERROR_TYPE_CONFIGURATION=8
readonly ERROR_TYPE_UNKNOWN=99

# エラーレベル定数
readonly ERROR_LEVEL_WARNING=1
readonly ERROR_LEVEL_ERROR=2
readonly ERROR_LEVEL_CRITICAL=3

# グローバル変数
ERROR_LOG_FILE=""
ERROR_COUNT=0
WARNING_COUNT=0
CRITICAL_ERROR_COUNT=0
LAST_ERROR_CODE=0
LAST_ERROR_MESSAGE=""
LAST_ERROR_TYPE=0

# エラーログファイルを設定
# 引数: ログファイルパス
set_error_log_file() {
    ERROR_LOG_FILE="$1"
    
    # ログディレクトリが存在しない場合は作成
    local log_dir=$(dirname "$ERROR_LOG_FILE")
    if [[ ! -d "$log_dir" ]]; then
        mkdir -p "$log_dir" || {
            echo "エラー: ログディレクトリの作成に失敗しました: $log_dir" >&2
            return 1
        }
    fi
    
    # ログファイルの初期化
    {
        echo "# エラーログ - $(date '+%Y-%m-%d %H:%M:%S')"
        echo "# フォーマット: [タイムスタンプ] [レベル] [タイプ] メッセージ"
        echo ""
    } > "$ERROR_LOG_FILE"
}

# エラー情報をログに記録（内部関数）
_log_error_to_file() {
    local timestamp="$1"
    local level="$2"
    local error_type="$3"
    local message="$4"
    local context="$5"
    
    if [[ -n "$ERROR_LOG_FILE" ]]; then
        {
            echo "[$timestamp] [$level] [TYPE:$error_type] $message"
            if [[ -n "$context" ]]; then
                echo "  コンテキスト: $context"
            fi
            echo ""
        } >> "$ERROR_LOG_FILE"
    fi
}

# エラータイプの名前を取得
get_error_type_name() {
    local error_type="$1"
    
    case "$error_type" in
        $ERROR_TYPE_ENVIRONMENT)    echo "環境エラー" ;;
        $ERROR_TYPE_DEPENDENCY)     echo "依存関係エラー" ;;
        $ERROR_TYPE_NETWORK)        echo "ネットワークエラー" ;;
        $ERROR_TYPE_FILE_SYSTEM)    echo "ファイルシステムエラー" ;;
        $ERROR_TYPE_PERMISSION)     echo "権限エラー" ;;
        $ERROR_TYPE_VALIDATION)     echo "検証エラー" ;;
        $ERROR_TYPE_EXTERNAL_COMMAND) echo "外部コマンドエラー" ;;
        $ERROR_TYPE_CONFIGURATION)  echo "設定エラー" ;;
        $ERROR_TYPE_UNKNOWN)        echo "不明なエラー" ;;
        *)                          echo "未定義エラー" ;;
    esac
}

# 回復手順を取得
get_recovery_instructions() {
    local error_type="$1"
    
    case "$error_type" in
        $ERROR_TYPE_ENVIRONMENT)
            cat << EOF
回復手順:
1. 仮想環境が正しく作成されているか確認してください
2. 必要に応じて仮想環境を再作成してください:
   python3 -m venv venv
3. 仮想環境を有効化してください:
   source venv/bin/activate
EOF
            ;;
        $ERROR_TYPE_DEPENDENCY)
            cat << EOF
回復手順:
1. 依存関係をインストールしてください:
   pip install -r requirements.txt
2. pipを最新版に更新してください:
   pip install --upgrade pip
3. 必要に応じて個別にパッケージをインストールしてください
EOF
            ;;
        $ERROR_TYPE_NETWORK)
            cat << EOF
回復手順:
1. インターネット接続を確認してください
2. プロキシ設定を確認してください
3. APIキーが正しく設定されているか確認してください
4. しばらく時間をおいてから再試行してください
EOF
            ;;
        $ERROR_TYPE_FILE_SYSTEM)
            cat << EOF
回復手順:
1. ディスク容量を確認してください: df -h
2. 書き込み権限を確認してください
3. 必要に応じてファイルやディレクトリを作成してください
4. 一時ファイルを削除してください
EOF
            ;;
        $ERROR_TYPE_PERMISSION)
            cat << EOF
回復手順:
1. ファイル・ディレクトリの権限を確認してください: ls -la
2. 必要に応じて権限を変更してください: chmod
3. 所有者を確認してください: chown
4. sudoが必要な場合は管理者に相談してください
EOF
            ;;
        $ERROR_TYPE_VALIDATION)
            cat << EOF
回復手順:
1. 入力データの形式を確認してください
2. 設定ファイルの内容を確認してください
3. 必要なファイルが存在するか確認してください
4. データの整合性を確認してください
EOF
            ;;
        $ERROR_TYPE_EXTERNAL_COMMAND)
            cat << EOF
回復手順:
1. 必要なコマンドがインストールされているか確認してください
2. PATHが正しく設定されているか確認してください
3. コマンドのバージョンを確認してください
4. 必要に応じてコマンドを再インストールしてください
EOF
            ;;
        $ERROR_TYPE_CONFIGURATION)
            cat << EOF
回復手順:
1. 設定ファイルの内容を確認してください
2. 環境変数が正しく設定されているか確認してください
3. 設定ファイルの形式（JSON、YAML等）を確認してください
4. デフォルト設定を使用してみてください
EOF
            ;;
        *)
            cat << EOF
回復手順:
1. エラーメッセージを詳しく確認してください
2. ログファイルを確認してください
3. 最近の変更を確認してください
4. 問題が解決しない場合は管理者に相談してください
EOF
            ;;
    esac
}

# 警告を処理
# 引数: エラータイプ, メッセージ, コンテキスト（オプション）
handle_warning() {
    local error_type="$1"
    local message="$2"
    local context="$3"
    
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local type_name=$(get_error_type_name "$error_type")
    
    # カウンターを更新
    ((WARNING_COUNT++))
    
    # コンソール出力
    if command -v log_warn >/dev/null 2>&1; then
        log_warn "[$type_name] $message"
    else
        echo -e "\033[1;33m[WARNING]\033[0m [$type_name] $message" >&2
    fi
    
    # ファイル出力
    _log_error_to_file "$timestamp" "WARNING" "$error_type" "$message" "$context"
    
    # デバッグ情報
    if [[ -n "$context" ]]; then
        if command -v log_debug >/dev/null 2>&1; then
            log_debug "警告コンテキスト: $context"
        fi
    fi
}

# エラーを処理
# 引数: エラータイプ, メッセージ, 終了コード（オプション）, コンテキスト（オプション）
handle_error() {
    local error_type="$1"
    local message="$2"
    local exit_code="${3:-1}"
    local context="$4"
    
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local type_name=$(get_error_type_name "$error_type")
    
    # グローバル変数を更新
    ((ERROR_COUNT++))
    LAST_ERROR_CODE="$exit_code"
    LAST_ERROR_MESSAGE="$message"
    LAST_ERROR_TYPE="$error_type"
    
    # コンソール出力
    if command -v log_error >/dev/null 2>&1; then
        log_error "[$type_name] $message"
    else
        echo -e "\033[0;31m[ERROR]\033[0m [$type_name] $message" >&2
    fi
    
    # ファイル出力
    _log_error_to_file "$timestamp" "ERROR" "$error_type" "$message" "$context"
    
    # コンテキスト情報の表示
    if [[ -n "$context" ]]; then
        if command -v log_debug >/dev/null 2>&1; then
            log_debug "エラーコンテキスト: $context"
        else
            echo "  コンテキスト: $context" >&2
        fi
    fi
    
    # 回復手順の表示
    echo >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    get_recovery_instructions "$error_type" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
}

# 致命的エラーを処理（処理を停止）
# 引数: エラータイプ, メッセージ, 終了コード（オプション）, コンテキスト（オプション）
handle_critical_error() {
    local error_type="$1"
    local message="$2"
    local exit_code="${3:-1}"
    local context="$4"
    
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local type_name=$(get_error_type_name "$error_type")
    
    # グローバル変数を更新
    ((CRITICAL_ERROR_COUNT++))
    ((ERROR_COUNT++))
    LAST_ERROR_CODE="$exit_code"
    LAST_ERROR_MESSAGE="$message"
    LAST_ERROR_TYPE="$error_type"
    
    # コンソール出力
    echo -e "\033[1;31m[CRITICAL ERROR]\033[0m [$type_name] $message" >&2
    
    # ファイル出力
    _log_error_to_file "$timestamp" "CRITICAL" "$error_type" "$message" "$context"
    
    # コンテキスト情報の表示
    if [[ -n "$context" ]]; then
        echo "  コンテキスト: $context" >&2
    fi
    
    # 回復手順の表示
    echo >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "致命的エラーが発生しました。処理を停止します。" >&2
    echo >&2
    get_recovery_instructions "$error_type" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    
    # エラー統計を表示
    show_error_summary
    
    # 処理を停止
    exit "$exit_code"
}

# コマンド実行エラーを処理
# 引数: コマンド名, 終了コード, 標準エラー出力（オプション）
handle_command_error() {
    local command_name="$1"
    local exit_code="$2"
    local stderr_output="$3"
    
    local message="コマンド '$command_name' が失敗しました (終了コード: $exit_code)"
    local context="コマンド: $command_name"
    
    if [[ -n "$stderr_output" ]]; then
        context="$context, エラー出力: $stderr_output"
    fi
    
    handle_error "$ERROR_TYPE_EXTERNAL_COMMAND" "$message" "$exit_code" "$context"
}

# ファイル操作エラーを処理
# 引数: 操作名, ファイルパス, エラーメッセージ（オプション）
handle_file_error() {
    local operation="$1"
    local file_path="$2"
    local error_message="$3"
    
    local message="ファイル操作 '$operation' が失敗しました: $file_path"
    if [[ -n "$error_message" ]]; then
        message="$message - $error_message"
    fi
    
    local context="操作: $operation, ファイル: $file_path"
    
    handle_error "$ERROR_TYPE_FILE_SYSTEM" "$message" 1 "$context"
}

# ネットワークエラーを処理
# 引数: URL/ホスト名, エラーメッセージ（オプション）
handle_network_error() {
    local target="$1"
    local error_message="$2"
    
    local message="ネットワークエラーが発生しました: $target"
    if [[ -n "$error_message" ]]; then
        message="$message - $error_message"
    fi
    
    local context="対象: $target"
    
    handle_error "$ERROR_TYPE_NETWORK" "$message" 1 "$context"
}

# 検証エラーを処理
# 引数: 検証対象, 期待値, 実際の値
handle_validation_error() {
    local target="$1"
    local expected="$2"
    local actual="$3"
    
    local message="検証エラー: $target の値が期待値と異なります"
    local context="対象: $target, 期待値: $expected, 実際の値: $actual"
    
    handle_error "$ERROR_TYPE_VALIDATION" "$message" 1 "$context"
}

# エラー統計を表示
show_error_summary() {
    echo >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "エラー統計" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "警告: $WARNING_COUNT 件" >&2
    echo "エラー: $ERROR_COUNT 件" >&2
    echo "致命的エラー: $CRITICAL_ERROR_COUNT 件" >&2
    
    if [[ $ERROR_COUNT -gt 0 ]]; then
        echo >&2
        echo "最後のエラー:" >&2
        echo "  タイプ: $(get_error_type_name "$LAST_ERROR_TYPE")" >&2
        echo "  メッセージ: $LAST_ERROR_MESSAGE" >&2
        echo "  終了コード: $LAST_ERROR_CODE" >&2
    fi
    
    if [[ -n "$ERROR_LOG_FILE" ]] && [[ -f "$ERROR_LOG_FILE" ]]; then
        echo >&2
        echo "詳細なエラーログ: $ERROR_LOG_FILE" >&2
    fi
}

# エラー統計をリセット
reset_error_counters() {
    ERROR_COUNT=0
    WARNING_COUNT=0
    CRITICAL_ERROR_COUNT=0
    LAST_ERROR_CODE=0
    LAST_ERROR_MESSAGE=""
    LAST_ERROR_TYPE=0
}

# エラーハンドラーの初期化
# 引数: ログファイルパス（オプション）
init_error_handler() {
    local log_file="$1"
    
    # エラー統計をリセット
    reset_error_counters
    
    # ログファイルを設定
    if [[ -n "$log_file" ]]; then
        set_error_log_file "$log_file"
    fi
    
    # シグナルハンドラーを設定
    trap 'handle_critical_error $ERROR_TYPE_UNKNOWN "処理が中断されました (SIGINT)" 130 "シグナル: SIGINT"' INT
    trap 'handle_critical_error $ERROR_TYPE_UNKNOWN "処理が終了されました (SIGTERM)" 143 "シグナル: SIGTERM"' TERM
    
    # デバッグ情報
    if command -v log_debug >/dev/null 2>&1; then
        log_debug "エラーハンドラーを初期化しました"
        if [[ -n "$log_file" ]]; then
            log_debug "エラーログファイル: $log_file"
        fi
    fi
}

# 安全なコマンド実行（エラーハンドリング付き）
# 引数: コマンド, エラータイプ（オプション）, エラーメッセージ（オプション）
safe_execute() {
    local command="$1"
    local error_type="${2:-$ERROR_TYPE_EXTERNAL_COMMAND}"
    local error_message="$3"
    
    if command -v log_debug >/dev/null 2>&1; then
        log_debug "コマンド実行: $command"
    fi
    
    # コマンドを実行し、出力をキャプチャ
    local output
    local exit_code
    
    output=$(eval "$command" 2>&1)
    exit_code=$?
    
    if [[ $exit_code -ne 0 ]]; then
        local message="${error_message:-コマンドの実行に失敗しました: $command}"
        handle_command_error "$command" "$exit_code" "$output"
        return $exit_code
    fi
    
    # 成功時は出力を表示
    if [[ -n "$output" ]]; then
        echo "$output"
    fi
    
    return 0
}

# ヘルプメッセージを表示
show_help() {
    cat << EOF
統一エラーハンドリング - 共通エラー処理機能

使用方法:
  source error-handler.sh

初期化:
  init_error_handler [ログファイルパス]

エラー処理関数:
  handle_warning <タイプ> <メッセージ> [コンテキスト]
  handle_error <タイプ> <メッセージ> [終了コード] [コンテキスト]
  handle_critical_error <タイプ> <メッセージ> [終了コード] [コンテキスト]

特定エラー処理関数:
  handle_command_error <コマンド名> <終了コード> [標準エラー出力]
  handle_file_error <操作名> <ファイルパス> [エラーメッセージ]
  handle_network_error <URL/ホスト名> [エラーメッセージ]
  handle_validation_error <対象> <期待値> <実際の値>

ユーティリティ関数:
  safe_execute <コマンド> [エラータイプ] [エラーメッセージ]
  show_error_summary
  reset_error_counters

エラータイプ定数:
  ERROR_TYPE_ENVIRONMENT      - 環境エラー
  ERROR_TYPE_DEPENDENCY       - 依存関係エラー
  ERROR_TYPE_NETWORK          - ネットワークエラー
  ERROR_TYPE_FILE_SYSTEM      - ファイルシステムエラー
  ERROR_TYPE_PERMISSION       - 権限エラー
  ERROR_TYPE_VALIDATION       - 検証エラー
  ERROR_TYPE_EXTERNAL_COMMAND - 外部コマンドエラー
  ERROR_TYPE_CONFIGURATION    - 設定エラー
  ERROR_TYPE_UNKNOWN          - 不明なエラー

例:
  init_error_handler "logs/error.log"
  safe_execute "python3 scripts/main.py"
  handle_error \$ERROR_TYPE_NETWORK "APIへの接続に失敗しました"
EOF
}

# スクリプトが直接実行された場合はヘルプを表示
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    show_help
fi