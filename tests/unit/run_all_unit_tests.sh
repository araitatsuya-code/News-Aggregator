#!/bin/bash

# 全ユーティリティスクリプトの単体テスト実行スクリプト
# 要件5, 要件6, 要件7に対応

# テストランナーの設定
RUNNER_NAME="ユーティリティスクリプト単体テストランナー"
TOTAL_TEST_SUITES=0
PASSED_TEST_SUITES=0
FAILED_TEST_SUITES=0
TOTAL_TESTS=0
TOTAL_PASSED=0
TOTAL_FAILED=0

# カラーコード
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m'

# テストスイートのリスト
TEST_SUITES=(
    "test_venv_manager.sh"
    "test_progress_logger.sh"
    "test_time_tracker.sh"
    "test_error_handler.sh"
    "test_detailed_logger.sh"
)

# テストスイート名の表示用マッピング
declare -A TEST_SUITE_NAMES=(
    ["test_venv_manager.sh"]="仮想環境マネージャー"
    ["test_progress_logger.sh"]="進行状況ロガー"
    ["test_time_tracker.sh"]="時間トラッカー"
    ["test_error_handler.sh"]="エラーハンドラー"
    ["test_detailed_logger.sh"]="詳細ログ出力機能"
)

# 使用方法を表示
show_usage() {
    cat << EOF
使用方法: $0 [オプション] [テストスイート名...]

オプション:
  -h, --help          このヘルプメッセージを表示
  -v, --verbose       詳細な出力を表示
  -q, --quiet         エラーのみを表示
  -s, --summary-only  サマリーのみを表示
  --no-color          カラー出力を無効化
  --parallel          並列実行（実験的）

テストスイート名:
  venv-manager        仮想環境マネージャーのテスト
  progress-logger     進行状況ロガーのテスト
  time-tracker        時間トラッカーのテスト
  error-handler       エラーハンドラーのテスト
  detailed-logger     詳細ログ出力機能のテスト
  all                 すべてのテスト（デフォルト）

例:
  $0                          # すべてのテストを実行
  $0 venv-manager            # 仮想環境マネージャーのテストのみ実行
  $0 --verbose all           # すべてのテストを詳細出力で実行
  $0 --summary-only          # サマリーのみ表示
EOF
}

# コマンドライン引数を解析
parse_arguments() {
    VERBOSE=false
    QUIET=false
    SUMMARY_ONLY=false
    NO_COLOR=false
    PARALLEL=false
    SELECTED_TESTS=()
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -q|--quiet)
                QUIET=true
                shift
                ;;
            -s|--summary-only)
                SUMMARY_ONLY=true
                shift
                ;;
            --no-color)
                NO_COLOR=true
                shift
                ;;
            --parallel)
                PARALLEL=true
                shift
                ;;
            venv-manager)
                SELECTED_TESTS+=("test_venv_manager.sh")
                shift
                ;;
            progress-logger)
                SELECTED_TESTS+=("test_progress_logger.sh")
                shift
                ;;
            time-tracker)
                SELECTED_TESTS+=("test_time_tracker.sh")
                shift
                ;;
            error-handler)
                SELECTED_TESTS+=("test_error_handler.sh")
                shift
                ;;
            detailed-logger)
                SELECTED_TESTS+=("test_detailed_logger.sh")
                shift
                ;;
            all)
                SELECTED_TESTS=("${TEST_SUITES[@]}")
                shift
                ;;
            *)
                echo -e "${RED}エラー: 不明なオプション '$1'${NC}" >&2
                show_usage
                exit 1
                ;;
        esac
    done
    
    # デフォルトですべてのテストを選択
    if [[ ${#SELECTED_TESTS[@]} -eq 0 ]]; then
        SELECTED_TESTS=("${TEST_SUITES[@]}")
    fi
    
    # カラー出力を無効化
    if [[ "$NO_COLOR" == "true" ]]; then
        RED=''
        GREEN=''
        YELLOW=''
        BLUE=''
        PURPLE=''
        CYAN=''
        WHITE=''
        NC=''
    fi
}

# ログメッセージを出力
log_message() {
    local level="$1"
    local message="$2"
    
    if [[ "$QUIET" == "true" ]] && [[ "$level" != "ERROR" ]]; then
        return
    fi
    
    if [[ "$SUMMARY_ONLY" == "true" ]] && [[ "$level" != "SUMMARY" ]]; then
        return
    fi
    
    case "$level" in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message" >&2
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "SUMMARY")
            echo -e "${WHITE}$message${NC}"
            ;;
        *)
            echo "$message"
            ;;
    esac
}

# 詳細ログメッセージを出力
log_verbose() {
    if [[ "$VERBOSE" == "true" ]]; then
        log_message "INFO" "$1"
    fi
}

# テストスイートを実行
run_test_suite() {
    local test_file="$1"
    local test_name="${TEST_SUITE_NAMES[$test_file]}"
    
    log_verbose "テストスイート開始: $test_name ($test_file)"
    
    # テストファイルの存在確認
    local test_path="$(dirname "$0")/$test_file"
    if [[ ! -f "$test_path" ]]; then
        log_message "ERROR" "テストファイルが見つかりません: $test_path"
        return 1
    fi
    
    # テストファイルに実行権限を付与
    chmod +x "$test_path"
    
    # テストを実行
    local start_time=$(date +%s)
    local output
    local exit_code
    
    if [[ "$VERBOSE" == "true" ]]; then
        # 詳細モードでは出力をそのまま表示
        "$test_path"
        exit_code=$?
    else
        # 通常モードでは出力をキャプチャ
        output=$("$test_path" 2>&1)
        exit_code=$?
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # 結果を解析
    local test_count=0
    local passed_count=0
    local failed_count=0
    
    if [[ -n "$output" ]]; then
        # 出力から統計情報を抽出
        if echo "$output" | grep -q "総テスト数:"; then
            test_count=$(echo "$output" | grep "総テスト数:" | sed 's/.*総テスト数: \([0-9]*\).*/\1/')
        fi
        if echo "$output" | grep -q "成功:"; then
            passed_count=$(echo "$output" | grep "成功:" | sed 's/.*成功: \([0-9]*\).*/\1/')
        fi
        if echo "$output" | grep -q "失敗:"; then
            failed_count=$(echo "$output" | grep "失敗:" | sed 's/.*失敗: \([0-9]*\).*/\1/')
        fi
    fi
    
    # グローバル統計を更新
    ((TOTAL_TEST_SUITES++))
    TOTAL_TESTS=$((TOTAL_TESTS + test_count))
    TOTAL_PASSED=$((TOTAL_PASSED + passed_count))
    TOTAL_FAILED=$((TOTAL_FAILED + failed_count))
    
    # 結果を表示
    if [[ $exit_code -eq 0 ]]; then
        ((PASSED_TEST_SUITES++))
        log_message "SUCCESS" "$test_name: 成功 (${duration}秒, テスト数: $test_count, 成功: $passed_count, 失敗: $failed_count)"
    else
        ((FAILED_TEST_SUITES++))
        log_message "ERROR" "$test_name: 失敗 (${duration}秒, テスト数: $test_count, 成功: $passed_count, 失敗: $failed_count)"
        
        # 失敗時は出力を表示（詳細モードでない場合）
        if [[ "$VERBOSE" != "true" ]] && [[ "$QUIET" != "true" ]] && [[ -n "$output" ]]; then
            echo -e "${RED}--- $test_name の出力 ---${NC}"
            echo "$output"
            echo -e "${RED}--- 出力終了 ---${NC}"
        fi
    fi
    
    log_verbose "テストスイート終了: $test_name"
    return $exit_code
}

# 並列実行でテストスイートを実行
run_test_suite_parallel() {
    local test_file="$1"
    local temp_dir="$2"
    local result_file="$temp_dir/${test_file}.result"
    
    # テストを実行し、結果をファイルに保存
    local start_time=$(date +%s)
    local test_path="$(dirname "$0")/$test_file"
    
    if [[ -f "$test_path" ]]; then
        chmod +x "$test_path"
        "$test_path" > "$result_file" 2>&1
        local exit_code=$?
    else
        echo "ERROR: テストファイルが見つかりません: $test_path" > "$result_file"
        local exit_code=1
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # 結果情報をファイルに追記
    echo "EXIT_CODE:$exit_code" >> "$result_file"
    echo "DURATION:$duration" >> "$result_file"
    echo "TEST_FILE:$test_file" >> "$result_file"
}

# 並列実行の結果を処理
process_parallel_results() {
    local temp_dir="$1"
    
    for test_file in "${SELECTED_TESTS[@]}"; do
        local result_file="$temp_dir/${test_file}.result"
        local test_name="${TEST_SUITE_NAMES[$test_file]}"
        
        if [[ ! -f "$result_file" ]]; then
            log_message "ERROR" "$test_name: 結果ファイルが見つかりません"
            ((FAILED_TEST_SUITES++))
            ((TOTAL_TEST_SUITES++))
            continue
        fi
        
        # 結果ファイルから情報を抽出
        local exit_code=$(grep "EXIT_CODE:" "$result_file" | cut -d: -f2)
        local duration=$(grep "DURATION:" "$result_file" | cut -d: -f2)
        local output=$(grep -v "EXIT_CODE:\|DURATION:\|TEST_FILE:" "$result_file")
        
        # 統計情報を抽出
        local test_count=0
        local passed_count=0
        local failed_count=0
        
        if echo "$output" | grep -q "総テスト数:"; then
            test_count=$(echo "$output" | grep "総テスト数:" | sed 's/.*総テスト数: \([0-9]*\).*/\1/')
        fi
        if echo "$output" | grep -q "成功:"; then
            passed_count=$(echo "$output" | grep "成功:" | sed 's/.*成功: \([0-9]*\).*/\1/')
        fi
        if echo "$output" | grep -q "失敗:"; then
            failed_count=$(echo "$output" | grep "失敗:" | sed 's/.*失敗: \([0-9]*\).*/\1/')
        fi
        
        # グローバル統計を更新
        ((TOTAL_TEST_SUITES++))
        TOTAL_TESTS=$((TOTAL_TESTS + test_count))
        TOTAL_PASSED=$((TOTAL_PASSED + passed_count))
        TOTAL_FAILED=$((TOTAL_FAILED + failed_count))
        
        # 結果を表示
        if [[ "$exit_code" == "0" ]]; then
            ((PASSED_TEST_SUITES++))
            log_message "SUCCESS" "$test_name: 成功 (${duration}秒, テスト数: $test_count, 成功: $passed_count, 失敗: $failed_count)"
        else
            ((FAILED_TEST_SUITES++))
            log_message "ERROR" "$test_name: 失敗 (${duration}秒, テスト数: $test_count, 成功: $passed_count, 失敗: $failed_count)"
            
            # 失敗時は出力を表示
            if [[ "$QUIET" != "true" ]] && [[ -n "$output" ]]; then
                echo -e "${RED}--- $test_name の出力 ---${NC}"
                echo "$output"
                echo -e "${RED}--- 出力終了 ---${NC}"
            fi
        fi
    done
}

# 全テストスイートを実行
run_all_test_suites() {
    log_message "INFO" "$RUNNER_NAME を開始します"
    log_message "INFO" "実行するテストスイート数: ${#SELECTED_TESTS[@]}"
    
    if [[ "$VERBOSE" == "true" ]]; then
        log_message "INFO" "選択されたテストスイート:"
        for test_file in "${SELECTED_TESTS[@]}"; do
            log_message "INFO" "  - ${TEST_SUITE_NAMES[$test_file]} ($test_file)"
        done
    fi
    
    local overall_start_time=$(date +%s)
    
    if [[ "$PARALLEL" == "true" ]]; then
        log_message "INFO" "並列実行モードで実行します"
        
        # 一時ディレクトリを作成
        local temp_dir=$(mktemp -d -t unit_test_runner_XXXXXX)
        
        # 並列でテストを実行
        local pids=()
        for test_file in "${SELECTED_TESTS[@]}"; do
            run_test_suite_parallel "$test_file" "$temp_dir" &
            pids+=($!)
        done
        
        # すべてのテストの完了を待機
        log_message "INFO" "テストの完了を待機中..."
        for pid in "${pids[@]}"; do
            wait "$pid"
        done
        
        # 結果を処理
        process_parallel_results "$temp_dir"
        
        # 一時ディレクトリをクリーンアップ
        rm -rf "$temp_dir"
    else
        # 順次実行
        for test_file in "${SELECTED_TESTS[@]}"; do
            run_test_suite "$test_file"
        done
    fi
    
    local overall_end_time=$(date +%s)
    local total_duration=$((overall_end_time - overall_start_time))
    
    # 最終サマリーを表示
    show_final_summary "$total_duration"
}

# 最終サマリーを表示
show_final_summary() {
    local total_duration="$1"
    
    echo
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log_message "SUMMARY" "$RUNNER_NAME 最終結果"
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    log_message "SUMMARY" "総実行時間: ${total_duration}秒"
    log_message "SUMMARY" "テストスイート数: $TOTAL_TEST_SUITES"
    log_message "SUMMARY" "成功したテストスイート: ${GREEN}$PASSED_TEST_SUITES${NC}"
    log_message "SUMMARY" "失敗したテストスイート: ${RED}$FAILED_TEST_SUITES${NC}"
    
    echo
    log_message "SUMMARY" "総テスト数: $TOTAL_TESTS"
    log_message "SUMMARY" "成功したテスト: ${GREEN}$TOTAL_PASSED${NC}"
    log_message "SUMMARY" "失敗したテスト: ${RED}$TOTAL_FAILED${NC}"
    
    # 成功率を計算
    if [[ $TOTAL_TESTS -gt 0 ]]; then
        local success_rate=$((TOTAL_PASSED * 100 / TOTAL_TESTS))
        log_message "SUMMARY" "成功率: ${success_rate}%"
    fi
    
    echo
    if [[ $FAILED_TEST_SUITES -eq 0 ]]; then
        log_message "SUMMARY" "${GREEN}✓ すべてのテストスイートが成功しました！${NC}"
        echo
        log_message "SUMMARY" "ユーティリティスクリプトの品質が確認されました。"
        return 0
    else
        log_message "SUMMARY" "${RED}✗ $FAILED_TEST_SUITES 個のテストスイートが失敗しました${NC}"
        echo
        log_message "SUMMARY" "失敗したテストを確認し、問題を修正してください。"
        return 1
    fi
}

# 環境チェック
check_environment() {
    log_verbose "実行環境をチェックしています..."
    
    # 必要なコマンドの存在確認
    local required_commands=("bash" "date" "grep" "sed" "mktemp")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            log_message "ERROR" "必要なコマンドが見つかりません: $cmd"
            return 1
        fi
    done
    
    # テストディレクトリの存在確認
    local test_dir="$(dirname "$0")"
    if [[ ! -d "$test_dir" ]]; then
        log_message "ERROR" "テストディレクトリが見つかりません: $test_dir"
        return 1
    fi
    
    # テストファイルの存在確認
    local missing_tests=()
    for test_file in "${TEST_SUITES[@]}"; do
        if [[ ! -f "$test_dir/$test_file" ]]; then
            missing_tests+=("$test_file")
        fi
    done
    
    if [[ ${#missing_tests[@]} -gt 0 ]]; then
        log_message "WARN" "以下のテストファイルが見つかりません:"
        for test_file in "${missing_tests[@]}"; do
            log_message "WARN" "  - $test_file"
        done
    fi
    
    log_verbose "環境チェック完了"
    return 0
}

# メイン実行部分
main() {
    # コマンドライン引数を解析
    parse_arguments "$@"
    
    # 環境チェック
    if ! check_environment; then
        exit 1
    fi
    
    # すべてのテストスイートを実行
    run_all_test_suites
    
    # 終了コードを返す
    if [[ $FAILED_TEST_SUITES -eq 0 ]]; then
        exit 0
    else
        exit 1
    fi
}

# スクリプトが直接実行された場合はメイン関数を実行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi