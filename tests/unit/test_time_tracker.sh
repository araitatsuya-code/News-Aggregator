#!/bin/bash

# 時間トラッカーの単体テスト
# 要件4, 要件6, 要件7に対応

# テストフレームワークの設定
TEST_NAME="時間トラッカーテスト"
TEST_COUNT=0
PASSED_COUNT=0
FAILED_COUNT=0
TEST_TEMP_DIR=""

# カラーコード
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# テスト用の一時ディレクトリを作成
setup_test_environment() {
    TEST_TEMP_DIR=$(mktemp -d -t time_tracker_test_XXXXXX)
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

assert_numeric() {
    local value="$1"
    local test_name="$2"
    
    if [[ "$value" =~ ^[0-9]+$ ]]; then
        show_test_result "$test_name" "PASS"
    else
        show_test_result "$test_name" "FAIL" "数値ではありません: '$value'"
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

# time-tracker.shを読み込み
source_time_tracker() {
    local script_path="$(dirname "$(dirname "$(dirname "$0")")")/scripts/utils/time-tracker.sh"
    if [[ -f "$script_path" ]]; then
        source "$script_path"
        return 0
    else
        echo "エラー: time-tracker.shが見つかりません: $script_path"
        return 1
    fi
}

# テスト1: 時刻取得関数のテスト
test_time_functions() {
    echo -e "\n${BLUE}=== 時刻取得関数テスト ===${NC}"
    
    # 現在時刻（秒）の取得テスト
    local current_time=$(get_current_time)
    assert_numeric "$current_time" "現在時刻が数値で取得できること"
    
    # タイムスタンプの取得テスト
    local timestamp=$(get_current_timestamp)
    if echo "$timestamp" | grep -q "[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\} [0-9]\{2\}:[0-9]\{2\}:[0-9]\{2\}"; then
        show_test_result "タイムスタンプが正しい形式で取得できること" "PASS"
    else
        show_test_result "タイムスタンプが正しい形式で取得できること" "FAIL" "形式: '$timestamp'"
    fi
}

# テスト2: ワークフロータイマーのテスト
test_workflow_timer() {
    echo -e "\n${BLUE}=== ワークフロータイマーテスト ===${NC}"
    
    # ワークフロー開始
    start_workflow_timer
    
    # 開始時刻が設定されることを確認
    assert_numeric "$WORKFLOW_START_TIME" "ワークフロー開始時刻が設定されること"
    
    # 少し待機
    sleep 1
    
    # ワークフロー終了
    local total_duration=$(end_workflow_timer)
    
    # 終了時刻が設定されることを確認
    assert_numeric "$WORKFLOW_END_TIME" "ワークフロー終了時刻が設定されること"
    
    # 実行時間が正の値であることを確認
    assert_numeric "$total_duration" "総実行時間が数値で返されること"
    assert_greater_than "$total_duration" "0" "総実行時間が0より大きいこと"
}

# テスト3: ステップタイマーのテスト
test_step_timer() {
    echo -e "\n${BLUE}=== ステップタイマーテスト ===${NC}"
    
    # ステップタイマー開始
    start_step_timer "テストステップ"
    
    # ステップデータファイルが作成されることを確認
    assert_file_exists "$STEP_DATA_FILE" "ステップデータファイルが作成されること"
    
    # 少し待機
    sleep 1
    
    # ステップタイマー終了
    local step_duration=$(end_step_timer "テストステップ")
    
    # 実行時間が正の値であることを確認
    assert_numeric "$step_duration" "ステップ実行時間が数値で返されること"
    assert_greater_than "$step_duration" "0" "ステップ実行時間が0より大きいこと"
    
    # 完了ステップ数が更新されることを確認
    assert_equals "1" "$COMPLETED_STEPS" "完了ステップ数が更新されること"
}

# テスト4: 複数ステップのテスト
test_multiple_steps() {
    echo -e "\n${BLUE}=== 複数ステップテスト ===${NC}"
    
    # 複数のステップを実行
    start_step_timer "ステップ1"
    sleep 1
    local duration1=$(end_step_timer "ステップ1")
    
    start_step_timer "ステップ2"
    sleep 1
    local duration2=$(end_step_timer "ステップ2")
    
    # 両方のステップが記録されることを確認
    assert_numeric "$duration1" "ステップ1の実行時間が記録されること"
    assert_numeric "$duration2" "ステップ2の実行時間が記録されること"
    
    # 完了ステップ数が正しく更新されることを確認
    assert_equals "2" "$COMPLETED_STEPS" "完了ステップ数が正しく更新されること"
}

# テスト5: 時間フォーマット関数のテスト
test_format_duration() {
    echo -e "\n${BLUE}=== 時間フォーマット関数テスト ===${NC}"
    
    # 秒のみのテスト
    local formatted=$(format_duration 30)
    assert_equals "30秒" "$formatted" "30秒が正しくフォーマットされること"
    
    # 分と秒のテスト
    local formatted=$(format_duration 90)
    assert_equals "1分30秒" "$formatted" "90秒が1分30秒にフォーマットされること"
    
    # 時間、分、秒のテスト
    local formatted=$(format_duration 3661)
    assert_equals "1時間1分1秒" "$formatted" "3661秒が1時間1分1秒にフォーマットされること"
    
    # 0秒のテスト
    local formatted=$(format_duration 0)
    assert_equals "0秒" "$formatted" "0秒が正しくフォーマットされること"
    
    # 1時間ちょうどのテスト
    local formatted=$(format_duration 3600)
    assert_equals "1時間" "$formatted" "3600秒が1時間にフォーマットされること"
    
    # 1分ちょうどのテスト
    local formatted=$(format_duration 60)
    assert_equals "1分" "$formatted" "60秒が1分にフォーマットされること"
}

# テスト6: 無効な入力のテスト
test_invalid_input() {
    echo -e "\n${BLUE}=== 無効な入力テスト ===${NC}"
    
    # 無効な秒数でのフォーマットテスト
    local formatted=$(format_duration "invalid")
    if echo "$formatted" | grep -q "無効な秒数"; then
        show_test_result "無効な秒数でエラーメッセージが返されること" "PASS"
    else
        show_test_result "無効な秒数でエラーメッセージが返されること" "FAIL" "結果: '$formatted'"
    fi
    
    # 存在しないステップの終了テスト
    end_step_timer "存在しないステップ"
    local result=$?
    assert_false $result "存在しないステップの終了は失敗すること"
    
    # ステップ名なしでの開始テスト
    start_step_timer ""
    local result=$?
    assert_false $result "ステップ名なしでの開始は失敗すること"
}

# テスト7: 中断時間表示のテスト
test_interrupted_time() {
    echo -e "\n${BLUE}=== 中断時間表示テスト ===${NC}"
    
    # ワークフローを開始
    start_workflow_timer
    sleep 1
    
    # 中断時間を表示（出力をキャプチャ）
    local output=$(show_interrupted_time 2>&1)
    
    # 出力に期待される内容が含まれているかチェック
    assert_contains "$output" "処理が中断されました" "中断メッセージが表示されること"
    assert_contains "$output" "中断までの実行時間" "中断時間が表示されること"
}

# テスト8: 統計情報表示のテスト
test_time_statistics() {
    echo -e "\n${BLUE}=== 統計情報表示テスト ===${NC}"
    
    # ワークフローとステップを実行
    start_workflow_timer
    start_step_timer "統計テストステップ"
    sleep 1
    end_step_timer "統計テストステップ"
    end_workflow_timer
    
    # 統計情報を表示
    local output=$(show_time_statistics 2>&1)
    
    # 出力に期待される内容が含まれているかチェック
    assert_contains "$output" "実行時間統計" "統計ヘッダーが表示されること"
    assert_contains "$output" "総実行時間" "総実行時間が表示されること"
    assert_contains "$output" "ステップ別実行時間" "ステップ別時間が表示されること"
    assert_contains "$output" "統計テストステップ" "実行したステップが表示されること"
    assert_contains "$output" "完了ステップ数" "完了ステップ数が表示されること"
}

# テスト9: パフォーマンス分析のテスト
test_performance_analysis() {
    echo -e "\n${BLUE}=== パフォーマンス分析テスト ===${NC}"
    
    # 複数のステップを実行（実行時間を変える）
    start_step_timer "高速ステップ"
    sleep 1
    end_step_timer "高速ステップ"
    
    start_step_timer "低速ステップ"
    sleep 2
    end_step_timer "低速ステップ"
    
    # パフォーマンス分析を表示
    local output=$(show_performance_analysis 2>&1)
    
    # 出力に期待される内容が含まれているかチェック
    assert_contains "$output" "パフォーマンス分析" "分析ヘッダーが表示されること"
    assert_contains "$output" "最も時間のかかったステップ" "最遅ステップが表示されること"
    assert_contains "$output" "最も速かったステップ" "最速ステップが表示されること"
    assert_contains "$output" "平均実行時間" "平均時間が表示されること"
}

# テスト10: JSON出力のテスト
test_json_export() {
    echo -e "\n${BLUE}=== JSON出力テスト ===${NC}"
    
    # ワークフローとステップを実行
    start_workflow_timer
    start_step_timer "JSONテストステップ"
    sleep 1
    end_step_timer "JSONテストステップ"
    end_workflow_timer
    
    # JSON出力ファイル
    local json_file="$TEST_TEMP_DIR/time_data.json"
    export_time_data_json "$json_file"
    
    # JSONファイルが作成されることを確認
    assert_file_exists "$json_file" "JSONファイルが作成されること"
    
    # JSONの内容を確認
    if [[ -f "$json_file" ]]; then
        local json_content=$(cat "$json_file")
        assert_contains "$json_content" "workflow" "JSONにworkflowセクションが含まれること"
        assert_contains "$json_content" "steps" "JSONにstepsセクションが含まれること"
        assert_contains "$json_content" "total_duration" "JSONに総実行時間が含まれること"
        assert_contains "$json_content" "JSONテストステップ" "JSONに実行したステップが含まれること"
        
        # JSONの形式が正しいかチェック（簡易）
        if echo "$json_content" | grep -q "^{" && echo "$json_content" | grep -q "}$"; then
            show_test_result "JSONが正しい形式で出力されること" "PASS"
        else
            show_test_result "JSONが正しい形式で出力されること" "FAIL"
        fi
    fi
}

# テスト11: 総ステップ数設定のテスト
test_set_total_steps() {
    echo -e "\n${BLUE}=== 総ステップ数設定テスト ===${NC}"
    
    # 総ステップ数を設定
    set_total_steps 5
    
    assert_equals "5" "$TOTAL_STEPS" "総ステップ数が正しく設定されること"
    assert_equals "0" "$COMPLETED_STEPS" "完了ステップ数がリセットされること"
}

# テスト12: エラーハンドリングのテスト
test_error_handling() {
    echo -e "\n${BLUE}=== エラーハンドリングテスト ===${NC}"
    
    # ワークフロー開始時刻が設定されていない状態での終了テスト
    WORKFLOW_START_TIME=""
    end_workflow_timer
    local result=$?
    assert_false $result "開始時刻未設定での終了は失敗すること"
    
    # 中断時間表示で開始時刻が設定されていない場合のテスト
    WORKFLOW_START_TIME=""
    local output=$(show_interrupted_time 2>&1)
    assert_contains "$output" "開始時刻が記録されていません" "開始時刻未設定でエラーメッセージが表示されること"
}

# テスト13: ヘルプ表示のテスト
test_show_help() {
    echo -e "\n${BLUE}=== ヘルプ表示テスト ===${NC}"
    
    local output=$(show_help 2>&1)
    
    assert_contains "$output" "時間トラッカー" "ヘルプにタイトルが表示されること"
    assert_contains "$output" "start_workflow_timer" "ヘルプに関数名が表示されること"
    assert_contains "$output" "format_duration" "ヘルプにフォーマット関数が表示されること"
    assert_contains "$output" "show_time_statistics" "ヘルプに統計関数が表示されること"
}

# メインテスト実行関数
run_all_tests() {
    echo -e "${YELLOW}$TEST_NAME を開始します${NC}"
    echo "テスト環境: $TEST_TEMP_DIR"
    
    # time-tracker.shを読み込み
    if ! source_time_tracker; then
        echo -e "${RED}エラー: time-tracker.shの読み込みに失敗しました${NC}"
        return 1
    fi
    
    # 各テストを実行
    test_time_functions
    test_workflow_timer
    test_step_timer
    test_multiple_steps
    test_format_duration
    test_invalid_input
    test_interrupted_time
    test_time_statistics
    test_performance_analysis
    test_json_export
    test_set_total_steps
    test_error_handling
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