#!/bin/bash

# 詳細ログ出力機能の単体テスト
# 要件7に対応

# テストフレームワークの設定
TEST_NAME="詳細ログ出力機能テスト"
TEST_COUNT=0
PASSED_COUNT=0
FAILED_COUNT=0
TEST_TEMP_DIR=""
TEST_DETAILED_LOG=""

# カラーコード
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# テスト用の一時ディレクトリを作成
setup_test_environment() {
    TEST_TEMP_DIR=$(mktemp -d -t detailed_logger_test_XXXXXX)
    TEST_DETAILED_LOG="$TEST_TEMP_DIR/detailed.log"
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

assert_not_empty() {
    local value="$1"
    local test_name="$2"
    
    if [[ -n "$value" ]]; then
        show_test_result "$test_name" "PASS"
    else
        show_test_result "$test_name" "FAIL" "値が空です"
    fi
}

# detailed-logger.shを読み込み
source_detailed_logger() {
    local script_path="$(dirname "$(dirname "$(dirname "$0")")")/scripts/utils/detailed-logger.sh"
    if [[ -f "$script_path" ]]; then
        source "$script_path"
        return 0
    else
        echo "エラー: detailed-logger.shが見つかりません: $script_path"
        return 1
    fi
}

# テスト1: 詳細ログシステム初期化のテスト（テキスト形式）
test_init_detailed_logger_text() {
    echo -e "\n${BLUE}=== 詳細ログシステム初期化テスト（テキスト形式） ===${NC}"
    
    # テキスト形式で初期化
    init_detailed_logger "$TEST_DETAILED_LOG" "info" "text"
    
    # 設定が正しく反映されることを確認
    assert_equals "$TEST_DETAILED_LOG" "$DETAILED_LOG_FILE" "ログファイルパスが設定されること"
    assert_equals "$LOG_LEVEL_INFO" "$DETAILED_LOG_LEVEL" "ログレベルが設定されること"
    assert_equals "$LOG_FORMAT_TEXT" "$DETAILED_LOG_FORMAT" "ログ形式が設定されること"
    
    # セッションIDが生成されることを確認
    assert_not_empty "$SESSION_ID" "セッションIDが生成されること"
    
    # ログファイルが作成されることを確認
    assert_file_exists "$TEST_DETAILED_LOG" "ログファイルが作成されること"
    
    # ログファイルの内容を確認
    if [[ -f "$TEST_DETAILED_LOG" ]]; then
        local log_content=$(cat "$TEST_DETAILED_LOG")
        assert_contains "$log_content" "詳細ログ" "ログファイルにヘッダーが書かれること"
        assert_contains "$log_content" "$SESSION_ID" "ログファイルにセッションIDが書かれること"
    fi
}

# テスト2: 詳細ログシステム初期化のテスト（JSON形式）
test_init_detailed_logger_json() {
    echo -e "\n${BLUE}=== 詳細ログシステム初期化テスト（JSON形式） ===${NC}"
    
    # JSON形式で初期化
    local json_log_file="$TEST_TEMP_DIR/detailed_json.log"
    init_detailed_logger "$json_log_file" "debug" "json"
    
    # 設定が正しく反映されることを確認
    assert_equals "$json_log_file" "$DETAILED_LOG_FILE" "ログファイルパスが設定されること"
    assert_equals "$LOG_LEVEL_DEBUG" "$DETAILED_LOG_LEVEL" "ログレベルが設定されること"
    assert_equals "$LOG_FORMAT_JSON" "$DETAILED_LOG_FORMAT" "ログ形式が設定されること"
    
    # ログファイルが作成されることを確認
    assert_file_exists "$json_log_file" "JSONログファイルが作成されること"
    
    # JSONログファイルの内容を確認
    if [[ -f "$json_log_file" ]]; then
        local log_content=$(cat "$json_log_file")
        assert_contains "$log_content" "log_metadata" "JSONログにメタデータセクションが含まれること"
        assert_contains "$log_content" "entries" "JSONログにエントリセクションが含まれること"
        assert_contains "$log_content" "$SESSION_ID" "JSONログにセッションIDが含まれること"
    fi
}

# テスト3: ログレベル名取得のテスト
test_get_log_level_name() {
    echo -e "\n${BLUE}=== ログレベル名取得テスト ===${NC}"
    
    # 各ログレベルの名前を確認
    local debug_name=$(get_log_level_name $LOG_LEVEL_DEBUG)
    assert_equals "DEBUG" "$debug_name" "DEBUGレベルの名前が正しいこと"
    
    local info_name=$(get_log_level_name $LOG_LEVEL_INFO)
    assert_equals "INFO" "$info_name" "INFOレベルの名前が正しいこと"
    
    local warn_name=$(get_log_level_name $LOG_LEVEL_WARN)
    assert_equals "WARN" "$warn_name" "WARNレベルの名前が正しいこと"
    
    local error_name=$(get_log_level_name $LOG_LEVEL_ERROR)
    assert_equals "ERROR" "$error_name" "ERRORレベルの名前が正しいこと"
    
    local critical_name=$(get_log_level_name $LOG_LEVEL_CRITICAL)
    assert_equals "CRITICAL" "$critical_name" "CRITICALレベルの名前が正しいこと"
}

# テスト4: 基本ログ出力のテスト（テキスト形式）
test_basic_logging_text() {
    echo -e "\n${BLUE}=== 基本ログ出力テスト（テキスト形式） ===${NC}"
    
    # テキスト形式で初期化
    init_detailed_logger "$TEST_DETAILED_LOG" "debug" "text"
    
    # 各レベルのログを出力
    detailed_log_debug "デバッグメッセージ" "test_component" '{"key":"value"}'
    detailed_log_info "情報メッセージ" "test_component"
    detailed_log_warn "警告メッセージ"
    detailed_log_error "エラーメッセージ"
    detailed_log_critical "致命的エラーメッセージ"
    
    # ログファイルの内容を確認
    if [[ -f "$TEST_DETAILED_LOG" ]]; then
        local log_content=$(cat "$TEST_DETAILED_LOG")
        assert_contains "$log_content" "[DEBUG]" "DEBUGログが記録されること"
        assert_contains "$log_content" "[INFO]" "INFOログが記録されること"
        assert_contains "$log_content" "[WARN]" "WARNログが記録されること"
        assert_contains "$log_content" "[ERROR]" "ERRORログが記録されること"
        assert_contains "$log_content" "[CRITICAL]" "CRITICALログが記録されること"
        
        assert_contains "$log_content" "デバッグメッセージ" "デバッグメッセージが記録されること"
        assert_contains "$log_content" "情報メッセージ" "情報メッセージが記録されること"
        assert_contains "$log_content" "test_component" "コンポーネント名が記録されること"
        assert_contains "$log_content" "メタデータ" "メタデータが記録されること"
    fi
}

# テスト5: 基本ログ出力のテスト（JSON形式）
test_basic_logging_json() {
    echo -e "\n${BLUE}=== 基本ログ出力テスト（JSON形式） ===${NC}"
    
    # JSON形式で初期化
    local json_log_file="$TEST_TEMP_DIR/basic_json.log"
    init_detailed_logger "$json_log_file" "debug" "json"
    
    # 各レベルのログを出力
    detailed_log_info "JSONテストメッセージ" "json_component" '{"test_key":"test_value"}'
    detailed_log_error "JSONエラーメッセージ" "json_component"
    
    # JSONログファイルの内容を確認
    if [[ -f "$json_log_file" ]]; then
        local log_content=$(cat "$json_log_file")
        assert_contains "$log_content" '"level": "INFO"' "JSONにINFOレベルが記録されること"
        assert_contains "$log_content" '"level": "ERROR"' "JSONにERRORレベルが記録されること"
        assert_contains "$log_content" '"message": "JSONテストメッセージ"' "JSONにメッセージが記録されること"
        assert_contains "$log_content" '"component": "json_component"' "JSONにコンポーネントが記録されること"
        assert_contains "$log_content" '"session_id"' "JSONにセッションIDが記録されること"
        assert_contains "$log_content" '"timestamp"' "JSONにタイムスタンプが記録されること"
        assert_contains "$log_content" '"test_key":"test_value"' "JSONにメタデータが記録されること"
    fi
}

# テスト6: ログレベルフィルタリングのテスト
test_log_level_filtering() {
    echo -e "\n${BLUE}=== ログレベルフィルタリングテスト ===${NC}"
    
    # WARN以上のレベルで初期化
    local filter_log_file="$TEST_TEMP_DIR/filter.log"
    init_detailed_logger "$filter_log_file" "warn" "text"
    
    # 各レベルのログを出力
    detailed_log_debug "デバッグメッセージ（表示されない）"
    detailed_log_info "情報メッセージ（表示されない）"
    detailed_log_warn "警告メッセージ（表示される）"
    detailed_log_error "エラーメッセージ（表示される）"
    detailed_log_critical "致命的エラーメッセージ（表示される）"
    
    # ログファイルの内容を確認
    if [[ -f "$filter_log_file" ]]; then
        local log_content=$(cat "$filter_log_file")
        
        # WARN未満のメッセージは記録されないことを確認
        if echo "$log_content" | grep -q "デバッグメッセージ"; then
            show_test_result "DEBUGメッセージがフィルタリングされること" "FAIL" "DEBUGメッセージが記録されています"
        else
            show_test_result "DEBUGメッセージがフィルタリングされること" "PASS"
        fi
        
        if echo "$log_content" | grep -q "情報メッセージ"; then
            show_test_result "INFOメッセージがフィルタリングされること" "FAIL" "INFOメッセージが記録されています"
        else
            show_test_result "INFOメッセージがフィルタリングされること" "PASS"
        fi
        
        # WARN以上のメッセージは記録されることを確認
        assert_contains "$log_content" "警告メッセージ" "WARNメッセージが記録されること"
        assert_contains "$log_content" "エラーメッセージ" "ERRORメッセージが記録されること"
        assert_contains "$log_content" "致命的エラーメッセージ" "CRITICALメッセージが記録されること"
    fi
}

# テスト7: 特殊ログ関数のテスト
test_special_log_functions() {
    echo -e "\n${BLUE}=== 特殊ログ関数テスト ===${NC}"
    
    # 初期化
    init_detailed_logger "$TEST_DETAILED_LOG" "info" "text"
    
    # ステップ開始ログ
    detailed_log_step_start "テストステップ" 1 5
    
    # ステップ完了ログ
    detailed_log_step_complete "テストステップ" 10 "success"
    
    # コマンド実行ログ
    detailed_log_command "echo test" 0 2 "test output"
    
    # システム情報ログ
    detailed_log_system_info "cpu" '{"cores":4,"usage":"50%"}'
    
    # パフォーマンス情報ログ
    detailed_log_performance "memory_usage" 1024 "MB"
    
    # ログファイルの内容を確認
    if [[ -f "$TEST_DETAILED_LOG" ]]; then
        local log_content=$(cat "$TEST_DETAILED_LOG")
        assert_contains "$log_content" "ステップ開始: テストステップ" "ステップ開始ログが記録されること"
        assert_contains "$log_content" "ステップ完了: テストステップ" "ステップ完了ログが記録されること"
        assert_contains "$log_content" "コマンド実行成功: echo test" "コマンド実行ログが記録されること"
        assert_contains "$log_content" "システム情報: cpu" "システム情報ログが記録されること"
        assert_contains "$log_content" "パフォーマンス: memory_usage" "パフォーマンス情報ログが記録されること"
    fi
}

# テスト8: 実行サマリー生成のテスト
test_generate_execution_summary() {
    echo -e "\n${BLUE}=== 実行サマリー生成テスト ===${NC}"
    
    # 初期化
    init_detailed_logger "$TEST_DETAILED_LOG" "info" "text"
    
    # 実行サマリーを生成
    generate_execution_summary 120 5 1 2
    
    # ログファイルの内容を確認
    if [[ -f "$TEST_DETAILED_LOG" ]]; then
        local log_content=$(cat "$TEST_DETAILED_LOG")
        assert_contains "$log_content" "ワークフロー実行サマリー" "実行サマリーが記録されること"
        assert_contains "$log_content" "成功: 5" "成功数が記録されること"
        assert_contains "$log_content" "失敗: 1" "失敗数が記録されること"
        assert_contains "$log_content" "警告: 2" "警告数が記録されること"
    fi
}

# テスト9: ログローテーションのテスト
test_log_rotation() {
    echo -e "\n${BLUE}=== ログローテーションテスト ===${NC}"
    
    # 小さなファイルサイズ制限を設定（テスト用）
    DETAILED_LOG_MAX_SIZE=100  # 100バイト
    
    # 初期化
    init_detailed_logger "$TEST_DETAILED_LOG" "info" "text"
    
    # 大量のログを出力してファイルサイズを超過させる
    for i in {1..20}; do
        detailed_log_info "大量ログメッセージ $i - これは長いメッセージです"
    done
    
    # ローテーションが実行されるかテスト
    rotate_log_if_needed
    
    # 元のファイルサイズが制限内に収まっているかチェック
    if [[ -f "$TEST_DETAILED_LOG" ]]; then
        local file_size=$(stat -f%z "$TEST_DETAILED_LOG" 2>/dev/null || stat -c%s "$TEST_DETAILED_LOG" 2>/dev/null || echo 0)
        if [[ $file_size -le $DETAILED_LOG_MAX_SIZE ]]; then
            show_test_result "ログローテーションが実行されること" "PASS"
        else
            show_test_result "ログローテーションが実行されること" "FAIL" "ファイルサイズ: $file_size"
        fi
    fi
    
    # ファイルサイズ制限を元に戻す
    DETAILED_LOG_MAX_SIZE=10485760
}

# テスト10: JSON形式ログの終了処理のテスト
test_finalize_json_log() {
    echo -e "\n${BLUE}=== JSON形式ログ終了処理テスト ===${NC}"
    
    # JSON形式で初期化
    local json_log_file="$TEST_TEMP_DIR/finalize_json.log"
    init_detailed_logger "$json_log_file" "info" "json"
    
    # いくつかのログを出力
    detailed_log_info "テストメッセージ1"
    detailed_log_info "テストメッセージ2"
    
    # JSON形式ログを終了
    finalize_json_log
    
    # JSONファイルの内容を確認
    if [[ -f "$json_log_file" ]]; then
        local log_content=$(cat "$json_log_file")
        assert_contains "$log_content" "log_finalized" "JSON終了マーカーが追加されること"
        
        # JSONの形式が正しいかチェック（簡易）
        if echo "$log_content" | grep -q "^{" && echo "$log_content" | grep -q "}$"; then
            show_test_result "JSONが正しい形式で終了されること" "PASS"
        else
            show_test_result "JSONが正しい形式で終了されること" "FAIL"
        fi
    fi
}

# テスト11: ログ統計表示のテスト
test_show_log_statistics() {
    echo -e "\n${BLUE}=== ログ統計表示テスト ===${NC}"
    
    # 初期化
    init_detailed_logger "$TEST_DETAILED_LOG" "info" "text"
    
    # いくつかのログを出力
    detailed_log_info "統計テストメッセージ1"
    detailed_log_warn "統計テストメッセージ2"
    detailed_log_error "統計テストメッセージ3"
    
    # ログ統計を表示
    local stats_output=$(show_log_statistics 2>&1)
    
    # 統計情報が表示されることを確認
    assert_contains "$stats_output" "ログ統計" "統計ヘッダーが表示されること"
    assert_contains "$stats_output" "ログファイル:" "ログファイルパスが表示されること"
    assert_contains "$stats_output" "セッションID:" "セッションIDが表示されること"
    assert_contains "$stats_output" "ファイルサイズ:" "ファイルサイズが表示されること"
    assert_contains "$stats_output" "ログエントリ数:" "エントリ数が表示されること"
    assert_contains "$stats_output" "レベル別統計:" "レベル別統計が表示されること"
}

# テスト12: ログ設定表示のテスト
test_show_log_configuration() {
    echo -e "\n${BLUE}=== ログ設定表示テスト ===${NC}"
    
    # 初期化
    init_detailed_logger "$TEST_DETAILED_LOG" "debug" "text"
    
    # ログ設定を表示
    local config_output=$(show_log_configuration 2>&1)
    
    # 設定情報が表示されることを確認
    assert_contains "$config_output" "ログ設定" "設定ヘッダーが表示されること"
    assert_contains "$config_output" "ログファイル:" "ログファイルパスが表示されること"
    assert_contains "$config_output" "ログレベル: DEBUG" "ログレベルが表示されること"
    assert_contains "$config_output" "ログ形式: TEXT" "ログ形式が表示されること"
    assert_contains "$config_output" "最大ファイルサイズ:" "最大ファイルサイズが表示されること"
    assert_contains "$config_output" "セッションID:" "セッションIDが表示されること"
}

# テスト13: ヘルプ表示のテスト
test_show_help() {
    echo -e "\n${BLUE}=== ヘルプ表示テスト ===${NC}"
    
    local output=$(show_help 2>&1)
    
    assert_contains "$output" "詳細ログ出力機能" "ヘルプにタイトルが表示されること"
    assert_contains "$output" "init_detailed_logger" "ヘルプに初期化関数が表示されること"
    assert_contains "$output" "detailed_log_info" "ヘルプにログ関数が表示されること"
    assert_contains "$output" "detailed_log_step_start" "ヘルプに特殊ログ関数が表示されること"
    assert_contains "$output" "generate_execution_summary" "ヘルプにサマリー関数が表示されること"
    assert_contains "$output" "show_log_statistics" "ヘルプに統計関数が表示されること"
}

# メインテスト実行関数
run_all_tests() {
    echo -e "${YELLOW}$TEST_NAME を開始します${NC}"
    echo "テスト環境: $TEST_TEMP_DIR"
    
    # detailed-logger.shを読み込み
    if ! source_detailed_logger; then
        echo -e "${RED}エラー: detailed-logger.shの読み込みに失敗しました${NC}"
        return 1
    fi
    
    # 各テストを実行
    test_init_detailed_logger_text
    test_init_detailed_logger_json
    test_get_log_level_name
    test_basic_logging_text
    test_basic_logging_json
    test_log_level_filtering
    test_special_log_functions
    test_generate_execution_summary
    test_log_rotation
    test_finalize_json_log
    test_show_log_statistics
    test_show_log_configuration
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