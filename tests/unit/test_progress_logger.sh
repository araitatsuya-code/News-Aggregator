#!/bin/bash

# 進行状況ロガーの単体テスト
# 要件6, 要件7に対応

# テストフレームワークの設定
TEST_NAME="進行状況ロガーテスト"
TEST_COUNT=0
PASSED_COUNT=0
FAILED_COUNT=0
TEST_TEMP_DIR=""
TEST_LOG_FILE=""

# カラーコード
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# テスト用の一時ディレクトリを作成
setup_test_environment() {
    TEST_TEMP_DIR=$(mktemp -d -t progress_logger_test_XXXXXX)
    TEST_LOG_FILE="$TEST_TEMP_DIR/test.log"
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

# progress-logger.shを読み込み
source_progress_logger() {
    local script_path="$(dirname "$(dirname "$(dirname "$0")")")/scripts/utils/progress-logger.sh"
    if [[ -f "$script_path" ]]; then
        source "$script_path"
        return 0
    else
        echo "エラー: progress-logger.shが見つかりません: $script_path"
        return 1
    fi
}

# テスト1: ログレベル設定のテスト（正常系）
test_set_log_level_success() {
    echo -e "\n${BLUE}=== ログレベル設定テスト（正常系） ===${NC}"
    
    # 各ログレベルをテスト
    set_log_level "debug"
    assert_equals "$LOG_LEVEL_DEBUG" "$CURRENT_LOG_LEVEL" "debugレベルが正しく設定されること"
    
    set_log_level "info"
    assert_equals "$LOG_LEVEL_INFO" "$CURRENT_LOG_LEVEL" "infoレベルが正しく設定されること"
    
    set_log_level "warn"
    assert_equals "$LOG_LEVEL_WARN" "$CURRENT_LOG_LEVEL" "warnレベルが正しく設定されること"
    
    set_log_level "error"
    assert_equals "$LOG_LEVEL_ERROR" "$CURRENT_LOG_LEVEL" "errorレベルが正しく設定されること"
}

# テスト2: ログレベル設定のテスト（異常系）
test_set_log_level_failure() {
    echo -e "\n${BLUE}=== ログレベル設定テスト（異常系） ===${NC}"
    
    # 無効なログレベルでテスト
    set_log_level "invalid"
    local result=$?
    
    assert_false $result "無効なログレベルの場合は失敗すること"
}

# テスト3: ログファイル設定のテスト
test_set_log_file() {
    echo -e "\n${BLUE}=== ログファイル設定テスト ===${NC}"
    
    set_log_file "$TEST_LOG_FILE"
    
    assert_equals "$TEST_LOG_FILE" "$LOG_FILE" "ログファイルパスが正しく設定されること"
    
    # ログディレクトリが作成されることを確認
    local log_dir=$(dirname "$TEST_LOG_FILE")
    if [[ -d "$log_dir" ]]; then
        show_test_result "ログディレクトリが作成されること" "PASS"
    else
        show_test_result "ログディレクトリが作成されること" "FAIL"
    fi
}

# テスト4: 基本ログ出力のテスト
test_basic_logging() {
    echo -e "\n${BLUE}=== 基本ログ出力テスト ===${NC}"
    
    # ログファイルを設定
    set_log_file "$TEST_LOG_FILE"
    set_log_level "debug"
    
    # 各レベルのログを出力
    log_debug "デバッグメッセージ"
    log_info "情報メッセージ"
    log_warn "警告メッセージ"
    log_error "エラーメッセージ"
    log_success "成功メッセージ"
    
    # ログファイルが作成されることを確認
    assert_file_exists "$TEST_LOG_FILE" "ログファイルが作成されること"
    
    # ログファイルの内容を確認
    if [[ -f "$TEST_LOG_FILE" ]]; then
        local log_content=$(cat "$TEST_LOG_FILE")
        assert_contains "$log_content" "デバッグメッセージ" "デバッグメッセージがログに記録されること"
        assert_contains "$log_content" "情報メッセージ" "情報メッセージがログに記録されること"
        assert_contains "$log_content" "警告メッセージ" "警告メッセージがログに記録されること"
        assert_contains "$log_content" "エラーメッセージ" "エラーメッセージがログに記録されること"
        assert_contains "$log_content" "成功メッセージ" "成功メッセージがログに記録されること"
    fi
}

# テスト5: ログレベルフィルタリングのテスト
test_log_level_filtering() {
    echo -e "\n${BLUE}=== ログレベルフィルタリングテスト ===${NC}"
    
    # 新しいログファイルを設定
    local filter_log_file="$TEST_TEMP_DIR/filter_test.log"
    set_log_file "$filter_log_file"
    set_log_level "warn"  # warn以上のみ出力
    
    # 各レベルのログを出力
    log_debug "デバッグメッセージ（表示されない）"
    log_info "情報メッセージ（表示されない）"
    log_warn "警告メッセージ（表示される）"
    log_error "エラーメッセージ（表示される）"
    
    if [[ -f "$filter_log_file" ]]; then
        local log_content=$(cat "$filter_log_file")
        
        # warn以下のメッセージは記録されないことを確認
        if echo "$log_content" | grep -q "デバッグメッセージ"; then
            show_test_result "debugメッセージがフィルタリングされること" "FAIL" "debugメッセージが記録されています"
        else
            show_test_result "debugメッセージがフィルタリングされること" "PASS"
        fi
        
        if echo "$log_content" | grep -q "情報メッセージ"; then
            show_test_result "infoメッセージがフィルタリングされること" "FAIL" "infoメッセージが記録されています"
        else
            show_test_result "infoメッセージがフィルタリングされること" "PASS"
        fi
        
        # warn以上のメッセージは記録されることを確認
        assert_contains "$log_content" "警告メッセージ" "warnメッセージが記録されること"
        assert_contains "$log_content" "エラーメッセージ" "errorメッセージが記録されること"
    fi
}

# テスト6: ステップ管理のテスト
test_step_management() {
    echo -e "\n${BLUE}=== ステップ管理テスト ===${NC}"
    
    # ステップ総数を設定
    set_total_steps 3
    assert_equals "3" "$STEP_COUNT" "ステップ総数が正しく設定されること"
    assert_equals "0" "$CURRENT_STEP" "現在ステップが初期化されること"
    
    # ステップを開始
    start_step "テストステップ1"
    assert_equals "1" "$CURRENT_STEP" "現在ステップが更新されること"
    
    start_step "テストステップ2"
    assert_equals "2" "$CURRENT_STEP" "現在ステップが正しく増加すること"
}

# テスト7: ステップ完了・失敗のテスト
test_step_completion() {
    echo -e "\n${BLUE}=== ステップ完了・失敗テスト ===${NC}"
    
    # ログファイルを設定
    set_log_file "$TEST_LOG_FILE"
    
    # ステップ完了のテスト
    complete_step "テストステップ" "10"
    
    # ステップ失敗のテスト
    fail_step "失敗ステップ" "テストエラー"
    
    # ログファイルの内容を確認
    if [[ -f "$TEST_LOG_FILE" ]]; then
        local log_content=$(cat "$TEST_LOG_FILE")
        assert_contains "$log_content" "テストステップ" "完了ステップがログに記録されること"
        assert_contains "$log_content" "失敗ステップ" "失敗ステップがログに記録されること"
        assert_contains "$log_content" "テストエラー" "エラーメッセージがログに記録されること"
    fi
}

# テスト8: プログレスバーのテスト
test_progress_bar() {
    echo -e "\n${BLUE}=== プログレスバーテスト ===${NC}"
    
    # プログレスバー表示のテスト（出力をキャプチャ）
    local output
    
    # 0%のテスト
    output=$(show_progress 0 "開始" 2>&1)
    if echo "$output" | grep -q "0%"; then
        show_test_result "0%のプログレスバーが表示されること" "PASS"
    else
        show_test_result "0%のプログレスバーが表示されること" "FAIL"
    fi
    
    # 50%のテスト
    output=$(show_progress 50 "進行中" 2>&1)
    if echo "$output" | grep -q "50%"; then
        show_test_result "50%のプログレスバーが表示されること" "PASS"
    else
        show_test_result "50%のプログレスバーが表示されること" "FAIL"
    fi
    
    # 100%のテスト
    output=$(show_progress 100 "完了" 2>&1)
    if echo "$output" | grep -q "100%"; then
        show_test_result "100%のプログレスバーが表示されること" "PASS"
    else
        show_test_result "100%のプログレスバーが表示されること" "FAIL"
    fi
    
    # 範囲外の値のテスト（負の値）
    output=$(show_progress -10 "負の値" 2>&1)
    if echo "$output" | grep -q "0%"; then
        show_test_result "負の値が0%に制限されること" "PASS"
    else
        show_test_result "負の値が0%に制限されること" "FAIL"
    fi
    
    # 範囲外の値のテスト（100超過）
    output=$(show_progress 150 "超過値" 2>&1)
    if echo "$output" | grep -q "100%"; then
        show_test_result "100超過の値が100%に制限されること" "PASS"
    else
        show_test_result "100超過の値が100%に制限されること" "FAIL"
    fi
}

# テスト9: サマリー表示のテスト
test_show_summary() {
    echo -e "\n${BLUE}=== サマリー表示テスト ===${NC}"
    
    # ログファイルを設定
    set_log_file "$TEST_LOG_FILE"
    
    # サマリーを表示
    show_summary "120" "5" "1"
    
    # ログファイルの内容を確認
    if [[ -f "$TEST_LOG_FILE" ]]; then
        local log_content=$(cat "$TEST_LOG_FILE")
        assert_contains "$log_content" "実行サマリー" "サマリーがログに記録されること"
        assert_contains "$log_content" "120秒" "実行時間がログに記録されること"
        assert_contains "$log_content" "成功: 5" "成功数がログに記録されること"
        assert_contains "$log_content" "失敗: 1" "失敗数がログに記録されること"
    fi
}

# テスト10: ヘルプ表示のテスト
test_show_help() {
    echo -e "\n${BLUE}=== ヘルプ表示テスト ===${NC}"
    
    local output=$(show_help 2>&1)
    
    assert_contains "$output" "進行状況ロガー" "ヘルプにタイトルが表示されること"
    assert_contains "$output" "set_log_level" "ヘルプに関数名が表示されること"
    assert_contains "$output" "log_info" "ヘルプにログ関数が表示されること"
    assert_contains "$output" "start_step" "ヘルプにステップ関数が表示されること"
}

# テスト11: エラーハンドリングのテスト
test_error_handling() {
    echo -e "\n${BLUE}=== エラーハンドリングテスト ===${NC}"
    
    # 存在しないディレクトリへのログファイル設定
    local invalid_log_file="/nonexistent/directory/test.log"
    
    # ディレクトリが作成されるかテスト
    set_log_file "$invalid_log_file"
    
    # ディレクトリが作成されたかチェック
    local log_dir=$(dirname "$invalid_log_file")
    if [[ -d "$log_dir" ]]; then
        show_test_result "存在しないディレクトリが作成されること" "PASS"
        # クリーンアップ
        rm -rf "/nonexistent"
    else
        show_test_result "存在しないディレクトリが作成されること" "FAIL"
    fi
}

# テスト12: グローバル変数の初期化テスト
test_global_variables_initialization() {
    echo -e "\n${BLUE}=== グローバル変数初期化テスト ===${NC}"
    
    # 初期状態の確認
    assert_equals "$LOG_LEVEL_INFO" "$CURRENT_LOG_LEVEL" "ログレベルが初期化されていること"
    assert_equals "" "$LOG_FILE" "ログファイルが初期化されていること"
    assert_equals "0" "$STEP_COUNT" "ステップ数が初期化されていること"
    assert_equals "0" "$CURRENT_STEP" "現在ステップが初期化されていること"
}

# メインテスト実行関数
run_all_tests() {
    echo -e "${YELLOW}$TEST_NAME を開始します${NC}"
    echo "テスト環境: $TEST_TEMP_DIR"
    
    # progress-logger.shを読み込み
    if ! source_progress_logger; then
        echo -e "${RED}エラー: progress-logger.shの読み込みに失敗しました${NC}"
        return 1
    fi
    
    # 各テストを実行
    test_global_variables_initialization
    test_set_log_level_success
    test_set_log_level_failure
    test_set_log_file
    test_basic_logging
    test_log_level_filtering
    test_step_management
    test_step_completion
    test_progress_bar
    test_show_summary
    test_show_help
    test_error_handling
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