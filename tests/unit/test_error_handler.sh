#!/bin/bash

# エラーハンドラーの単体テスト
# 要件7に対応

# テストフレームワークの設定
TEST_NAME="エラーハンドラーテスト"
TEST_COUNT=0
PASSED_COUNT=0
FAILED_COUNT=0
TEST_TEMP_DIR=""
TEST_ERROR_LOG=""

# カラーコード
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# テスト用の一時ディレクトリを作成
setup_test_environment() {
    TEST_TEMP_DIR=$(mktemp -d -t error_handler_test_XXXXXX)
    TEST_ERROR_LOG="$TEST_TEMP_DIR/error.log"
    cd "$TEST_TEMP_DIR" || exit 1
    
    echo "テスト環境を作成しました: $TEST_TEMP_DIR"
}

# テスト環境をクリーンアップ
cleanup_test_environment() {
    if [[ -n "$TEST_TEMP_DIR" ]] && [[ -d "$TEST_TEMP_DIR" ]]; then
        cd /tmp
        rm -rf "$TEST_TEMP_DIR"
        echo "テスト環境をクリーンアップしました"
    fi
}

# テスト結果を表示
show_test_result() {
    local test_name="$1"
    local result="$2"
    local message="$3"
    
    ((TEST_COUNT++))
    
    if [[ "$result" == "PASS" ]]; then
        echo -e "${GREEN}✓${NC} $test_name"
        ((PASSED_COUNT++))
    else
        echo -e "${RED}✗${NC} $test_name"
        if [[ -n "$message" ]]; then
            echo -e "  ${RED}理由: $message${NC}"
        fi
        ((FAILED_COUNT++))
    fi
}

# アサーション関数
assert_equals() {
    local expected="$1"
    local actual="$2"
    local test_name="$3"
    
    if [[ "$expected" == "$actual" ]]; then
        show_test_result "$test_name" "PASS"
    else
        show_test_result "$test_name" "FAIL" "期待値: '$expected', 実際の値: '$actual'"
    fi
}

assert_true() {
    local condition="$1"
    local test_name="$2"
    
    if [[ $condition -eq 0 ]]; then
        show_test_result "$test_name" "PASS"
    else
        show_test_result "$test_name" "FAIL" "条件が真ではありませんでした"
    fi
}

assert_false() {
    local condition="$1"
    local test_name="$2"
    
    if [[ $condition -ne 0 ]]; then
        show_test_result "$test_name" "PASS"
    else
        show_test_result "$test_name" "FAIL" "条件が偽ではありませんでした"
    fi
}

assert_file_exists() {
    local file_path="$1"
    local test_name="$2"
    
    if [[ -f "$file_path" ]]; then
        show_test_result "$test_name" "PASS"
    else
        show_test_result "$test_name" "FAIL" "ファイルが存在しません: $file_path"
    fi
}

assert_contains() {
    local haystack="$1"
    local needle="$2"
    local test_name="$3"
    
    if echo "$haystack" | grep -q "$needle"; then
        show_test_result "$test_name" "PASS"
    else
        show_test_result "$test_name" "FAIL" "'$needle' が見つかりませんでした"
    fi
}

assert_greater_than() {
    local value="$1"
    local threshold="$2"
    local test_name="$3"
    
    if [[ $value -gt $threshold ]]; then
        show_test_result "$test_name" "PASS"
    else
        show_test_result "$test_name" "FAIL" "$value は $threshold より大きくありません"
    fi
}

# error-handler.shを読み込み
source_error_handler() {
    local script_path="$(dirname "$(dirname "$(dirname "$0")")")/scripts/utils/error-handler.sh"
    if [[ -f "$script_path" ]]; then
        source "$script_path"
        return 0
    else
        echo "エラー: error-handler.shが見つかりません: $script_path"
        return 1
    fi
}

# テスト1: エラーハンドラー初期化のテスト
test_init_error_handler() {
    echo -e "\n${BLUE}=== エラーハンドラー初期化テスト ===${NC}"
    
    # エラーハンドラーを初期化
    init_error_handler "$TEST_ERROR_LOG"
    
    # ログファイルが設定されることを確認
    assert_equals "$TEST_ERROR_LOG" "$ERROR_LOG_FILE" "エラーログファイルが設定されること"
    
    # ログファイルが作成されることを確認
    assert_file_exists "$TEST_ERROR_LOG" "エラーログファイルが作成されること"
    
    # カウンターがリセットされることを確認
    assert_equals "0" "$ERROR_COUNT" "エラーカウンターがリセットされること"
    assert_equals "0" "$WARNING_COUNT" "警告カウンターがリセットされること"
    assert_equals "0" "$CRITICAL_ERROR_COUNT" "致命的エラーカウンターがリセットされること"
}

# テスト2: エラータイプ名取得のテスト
test_get_error_type_name() {
    echo -e "\n${BLUE}=== エラータイプ名取得テスト ===${NC}"
    
    # 各エラータイプの名前を確認
    local env_name=$(get_error_type_name $ERROR_TYPE_ENVIRONMENT)
    assert_equals "環境エラー" "$env_name" "環境エラーの名前が正しいこと"
    
    local dep_name=$(get_error_type_name $ERROR_TYPE_DEPENDENCY)
    assert_equals "依存関係エラー" "$dep_name" "依存関係エラーの名前が正しいこと"
    
    local net_name=$(get_error_type_name $ERROR_TYPE_NETWORK)
    assert_equals "ネットワークエラー" "$net_name" "ネットワークエラーの名前が正しいこと"
    
    local fs_name=$(get_error_type_name $ERROR_TYPE_FILE_SYSTEM)
    assert_equals "ファイルシステムエラー" "$fs_name" "ファイルシステムエラーの名前が正しいこと"
    
    local perm_name=$(get_error_type_name $ERROR_TYPE_PERMISSION)
    assert_equals "権限エラー" "$perm_name" "権限エラーの名前が正しいこと"
    
    local val_name=$(get_error_type_name $ERROR_TYPE_VALIDATION)
    assert_equals "検証エラー" "$val_name" "検証エラーの名前が正しいこと"
    
    local cmd_name=$(get_error_type_name $ERROR_TYPE_EXTERNAL_COMMAND)
    assert_equals "外部コマンドエラー" "$cmd_name" "外部コマンドエラーの名前が正しいこと"
    
    local conf_name=$(get_error_type_name $ERROR_TYPE_CONFIGURATION)
    assert_equals "設定エラー" "$conf_name" "設定エラーの名前が正しいこと"
    
    local unknown_name=$(get_error_type_name $ERROR_TYPE_UNKNOWN)
    assert_equals "不明なエラー" "$unknown_name" "不明なエラーの名前が正しいこと"
}

# テスト3: 警告処理のテスト
test_handle_warning() {
    echo -e "\n${BLUE}=== 警告処理テスト ===${NC}"
    
    # エラーハンドラーを初期化
    init_error_handler "$TEST_ERROR_LOG"
    
    # 警告を処理
    handle_warning $ERROR_TYPE_ENVIRONMENT "テスト警告メッセージ" "テストコンテキスト"
    
    # 警告カウンターが更新されることを確認
    assert_equals "1" "$WARNING_COUNT" "警告カウンターが更新されること"
    
    # ログファイルに記録されることを確認
    if [[ -f "$TEST_ERROR_LOG" ]]; then
        local log_content=$(cat "$TEST_ERROR_LOG")
        assert_contains "$log_content" "WARNING" "ログにWARNINGレベルが記録されること"
        assert_contains "$log_content" "テスト警告メッセージ" "ログに警告メッセージが記録されること"
        assert_contains "$log_content" "テストコンテキスト" "ログにコンテキストが記録されること"
    fi
}

# テスト4: エラー処理のテスト
test_handle_error() {
    echo -e "\n${BLUE}=== エラー処理テスト ===${NC}"
    
    # エラーハンドラーを初期化
    init_error_handler "$TEST_ERROR_LOG"
    
    # エラーを処理
    handle_error $ERROR_TYPE_NETWORK "テストエラーメッセージ" 1 "テストコンテキスト"
    
    # エラーカウンターが更新されることを確認
    assert_equals "1" "$ERROR_COUNT" "エラーカウンターが更新されること"
    
    # グローバル変数が更新されることを確認
    assert_equals "1" "$LAST_ERROR_CODE" "最後のエラーコードが更新されること"
    assert_equals "テストエラーメッセージ" "$LAST_ERROR_MESSAGE" "最後のエラーメッセージが更新されること"
    assert_equals "$ERROR_TYPE_NETWORK" "$LAST_ERROR_TYPE" "最後のエラータイプが更新されること"
    
    # ログファイルに記録されることを確認
    if [[ -f "$TEST_ERROR_LOG" ]]; then
        local log_content=$(cat "$TEST_ERROR_LOG")
        assert_contains "$log_content" "ERROR" "ログにERRORレベルが記録されること"
        assert_contains "$log_content" "テストエラーメッセージ" "ログにエラーメッセージが記録されること"
        assert_contains "$log_content" "テストコンテキスト" "ログにコンテキストが記録されること"
    fi
}

# テスト5: 特定エラー処理関数のテスト
test_specific_error_handlers() {
    echo -e "\n${BLUE}=== 特定エラー処理関数テスト ===${NC}"
    
    # エラーハンドラーを初期化
    init_error_handler "$TEST_ERROR_LOG"
    
    # コマンドエラーのテスト
    handle_command_error "test_command" 127 "command not found"
    assert_equals "1" "$ERROR_COUNT" "コマンドエラーでエラーカウンターが更新されること"
    
    # ファイルエラーのテスト
    handle_file_error "read" "/nonexistent/file" "ファイルが見つかりません"
    assert_equals "2" "$ERROR_COUNT" "ファイルエラーでエラーカウンターが更新されること"
    
    # ネットワークエラーのテスト
    handle_network_error "https://example.com" "接続タイムアウト"
    assert_equals "3" "$ERROR_COUNT" "ネットワークエラーでエラーカウンターが更新されること"
    
    # 検証エラーのテスト
    handle_validation_error "パラメータ" "expected" "actual"
    assert_equals "4" "$ERROR_COUNT" "検証エラーでエラーカウンターが更新されること"
    
    # ログファイルの内容を確認
    if [[ -f "$TEST_ERROR_LOG" ]]; then
        local log_content=$(cat "$TEST_ERROR_LOG")
        assert_contains "$log_content" "test_command" "コマンドエラーがログに記録されること"
        assert_contains "$log_content" "/nonexistent/file" "ファイルエラーがログに記録されること"
        assert_contains "$log_content" "https://example.com" "ネットワークエラーがログに記録されること"
        assert_contains "$log_content" "パラメータ" "検証エラーがログに記録されること"
    fi
}

# テスト6: 回復手順表示のテスト
test_recovery_instructions() {
    echo -e "\n${BLUE}=== 回復手順表示テスト ===${NC}"
    
    # 各エラータイプの回復手順をテスト
    local env_instructions=$(get_recovery_instructions $ERROR_TYPE_ENVIRONMENT)
    assert_contains "$env_instructions" "仮想環境" "環境エラーの回復手順が表示されること"
    
    local dep_instructions=$(get_recovery_instructions $ERROR_TYPE_DEPENDENCY)
    assert_contains "$dep_instructions" "pip install" "依存関係エラーの回復手順が表示されること"
    
    local net_instructions=$(get_recovery_instructions $ERROR_TYPE_NETWORK)
    assert_contains "$net_instructions" "インターネット接続" "ネットワークエラーの回復手順が表示されること"
    
    local fs_instructions=$(get_recovery_instructions $ERROR_TYPE_FILE_SYSTEM)
    assert_contains "$fs_instructions" "ディスク容量" "ファイルシステムエラーの回復手順が表示されること"
    
    local perm_instructions=$(get_recovery_instructions $ERROR_TYPE_PERMISSION)
    assert_contains "$perm_instructions" "権限" "権限エラーの回復手順が表示されること"
}

# テスト7: エラー統計表示のテスト
test_error_summary() {
    echo -e "\n${BLUE}=== エラー統計表示テスト ===${NC}"
    
    # エラーハンドラーを初期化
    init_error_handler "$TEST_ERROR_LOG"
    
    # 複数のエラーを発生させる
    handle_warning $ERROR_TYPE_ENVIRONMENT "警告1"
    handle_warning $ERROR_TYPE_ENVIRONMENT "警告2"
    handle_error $ERROR_TYPE_NETWORK "エラー1"
    handle_error $ERROR_TYPE_FILE_SYSTEM "エラー2"
    
    # エラー統計を表示
    local summary_output=$(show_error_summary 2>&1)
    
    # 統計情報が正しく表示されることを確認
    assert_contains "$summary_output" "エラー統計" "統計ヘッダーが表示されること"
    assert_contains "$summary_output" "警告: 2 件" "警告数が正しく表示されること"
    assert_contains "$summary_output" "エラー: 2 件" "エラー数が正しく表示されること"
    assert_contains "$summary_output" "最後のエラー" "最後のエラー情報が表示されること"
    assert_contains "$summary_output" "エラー2" "最後のエラーメッセージが表示されること"
}

# テスト8: 安全なコマンド実行のテスト
test_safe_execute() {
    echo -e "\n${BLUE}=== 安全なコマンド実行テスト ===${NC}"
    
    # エラーハンドラーを初期化
    init_error_handler "$TEST_ERROR_LOG"
    
    # 成功するコマンドのテスト
    local output=$(safe_execute "echo 'テスト成功'" 2>&1)
    local result=$?
    assert_true $result "成功するコマンドが正しく実行されること"
    assert_contains "$output" "テスト成功" "成功時の出力が返されること"
    
    # 失敗するコマンドのテスト
    safe_execute "false" $ERROR_TYPE_EXTERNAL_COMMAND "テスト失敗"
    local result=$?
    assert_false $result "失敗するコマンドが適切に処理されること"
    assert_equals "1" "$ERROR_COUNT" "失敗時にエラーカウンターが更新されること"
}

# テスト9: カウンターリセットのテスト
test_reset_error_counters() {
    echo -e "\n${BLUE}=== カウンターリセットテスト ===${NC}"
    
    # エラーハンドラーを初期化
    init_error_handler "$TEST_ERROR_LOG"
    
    # エラーを発生させる
    handle_warning $ERROR_TYPE_ENVIRONMENT "テスト警告"
    handle_error $ERROR_TYPE_NETWORK "テストエラー"
    
    # カウンターが更新されることを確認
    assert_greater_than "$WARNING_COUNT" "0" "警告カウンターが0より大きいこと"
    assert_greater_than "$ERROR_COUNT" "0" "エラーカウンターが0より大きいこと"
    
    # カウンターをリセット
    reset_error_counters
    
    # カウンターがリセットされることを確認
    assert_equals "0" "$WARNING_COUNT" "警告カウンターがリセットされること"
    assert_equals "0" "$ERROR_COUNT" "エラーカウンターがリセットされること"
    assert_equals "0" "$CRITICAL_ERROR_COUNT" "致命的エラーカウンターがリセットされること"
    assert_equals "0" "$LAST_ERROR_CODE" "最後のエラーコードがリセットされること"
    assert_equals "" "$LAST_ERROR_MESSAGE" "最後のエラーメッセージがリセットされること"
    assert_equals "0" "$LAST_ERROR_TYPE" "最後のエラータイプがリセットされること"
}

# テスト10: ログファイル設定のテスト
test_set_error_log_file() {
    echo -e "\n${BLUE}=== ログファイル設定テスト ===${NC}"
    
    # 新しいログファイルパスを設定
    local new_log_file="$TEST_TEMP_DIR/new_error.log"
    set_error_log_file "$new_log_file"
    
    # ログファイルパスが更新されることを確認
    assert_equals "$new_log_file" "$ERROR_LOG_FILE" "新しいログファイルパスが設定されること"
    
    # ログファイルが作成されることを確認
    assert_file_exists "$new_log_file" "新しいログファイルが作成されること"
    
    # ログファイルの内容を確認
    if [[ -f "$new_log_file" ]]; then
        local log_content=$(cat "$new_log_file")
        assert_contains "$log_content" "エラーログ" "ログファイルにヘッダーが書かれること"
    fi
}

# テスト11: 存在しないディレクトリへのログファイル設定テスト
test_log_directory_creation() {
    echo -e "\n${BLUE}=== ログディレクトリ作成テスト ===${NC}"
    
    # 存在しないディレクトリのパスを指定
    local nested_log_file="$TEST_TEMP_DIR/nested/deep/error.log"
    set_error_log_file "$nested_log_file"
    
    # ディレクトリが作成されることを確認
    local log_dir=$(dirname "$nested_log_file")
    if [[ -d "$log_dir" ]]; then
        show_test_result "ネストしたディレクトリが作成されること" "PASS"
    else
        show_test_result "ネストしたディレクトリが作成されること" "FAIL"
    fi
    
    # ログファイルが作成されることを確認
    assert_file_exists "$nested_log_file" "ネストしたディレクトリにログファイルが作成されること"
}

# テスト12: ヘルプ表示のテスト
test_show_help() {
    echo -e "\n${BLUE}=== ヘルプ表示テスト ===${NC}"
    
    local output=$(show_help 2>&1)
    
    assert_contains "$output" "統一エラーハンドリング" "ヘルプにタイトルが表示されること"
    assert_contains "$output" "init_error_handler" "ヘルプに初期化関数が表示されること"
    assert_contains "$output" "handle_error" "ヘルプにエラー処理関数が表示されること"
    assert_contains "$output" "handle_warning" "ヘルプに警告処理関数が表示されること"
    assert_contains "$output" "safe_execute" "ヘルプに安全実行関数が表示されること"
    assert_contains "$output" "ERROR_TYPE_ENVIRONMENT" "ヘルプにエラータイプ定数が表示されること"
}

# メインテスト実行関数
run_all_tests() {
    echo -e "${YELLOW}$TEST_NAME を開始します${NC}"
    echo "テスト環境: $TEST_TEMP_DIR"
    
    # error-handler.shを読み込み
    if ! source_error_handler; then
        echo -e "${RED}エラー: error-handler.shの読み込みに失敗しました${NC}"
        return 1
    fi
    
    # 各テストを実行
    test_init_error_handler
    test_get_error_type_name
    test_handle_warning
    test_handle_error
    test_specific_error_handlers
    test_recovery_instructions
    test_error_summary
    test_safe_execute
    test_reset_error_counters
    test_set_error_log_file
    test_log_directory_creation
    test_show_help
}

# テスト結果サマリーを表示
show_test_summary() {
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${YELLOW}$TEST_NAME 結果サマリー${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "総テスト数: $TEST_COUNT"
    echo -e "成功: ${GREEN}$PASSED_COUNT${NC}"
    echo -e "失敗: ${RED}$FAILED_COUNT${NC}"
    
    if [[ $FAILED_COUNT -eq 0 ]]; then
        echo -e "\n${GREEN}✓ すべてのテストが成功しました！${NC}"
        return 0
    else
        echo -e "\n${RED}✗ $FAILED_COUNT 個のテストが失敗しました${NC}"
        return 1
    fi
}

# メイン実行部分
main() {
    # 終了時のクリーンアップを設定
    trap cleanup_test_environment EXIT
    
    # テスト環境をセットアップ
    setup_test_environment
    
    # すべてのテストを実行
    run_all_tests
    
    # 結果サマリーを表示
    show_test_summary
}

# スクリプトが直接実行された場合はメイン関数を実行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi