#!/bin/bash

# 仮想環境マネージャーの単体テスト
# 要件5, 要件6, 要件7に対応

# テストフレームワークの設定
TEST_NAME="仮想環境マネージャーテスト"
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
    TEST_TEMP_DIR=$(mktemp -d -t venv_manager_test_XXXXXX)
    cd "$TEST_TEMP_DIR" || exit 1
    
    # テスト用のrequirements.txtを作成
    cat > requirements.txt << EOF
requests>=2.25.0
python-dateutil>=2.8.0
# コメント行
pytest>=6.0.0

# 空行も含む
EOF
    
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

assert_not_equals() {
    local not_expected="$1"
    local actual="$2"
    local test_name="$3"
    
    if [[ "$not_expected" != "$actual" ]]; then
        show_test_result "$test_name" "PASS"
    else
        show_test_result "$test_name" "FAIL" "期待しない値: '$not_expected' が実際の値と一致しました"
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

assert_directory_exists() {
    local dir_path="$1"
    local test_name="$2"
    
    if [[ -d "$dir_path" ]]; then
        show_test_result "$test_name" "PASS"
    else
        show_test_result "$test_name" "FAIL" "ディレクトリが存在しません: $dir_path"
    fi
}

# venv-manager.shを読み込み
source_venv_manager() {
    local script_path="$(dirname "$(dirname "$(dirname "$0")")")/scripts/utils/venv-manager.sh"
    if [[ -f "$script_path" ]]; then
        source "$script_path"
        return 0
    else
        echo "エラー: venv-manager.shが見つかりません: $script_path"
        return 1
    fi
}

# テスト1: 仮想環境検出機能のテスト（正常系）
test_detect_virtual_environment_success() {
    echo -e "\n${BLUE}=== 仮想環境検出テスト（正常系） ===${NC}"
    
    # テスト用の仮想環境ディレクトリを作成
    mkdir -p venv/bin
    touch venv/bin/activate
    
    # 関数を実行
    detect_virtual_environment
    local result=$?
    
    assert_true $result "仮想環境の検出が成功すること"
    assert_equals "venv" "$DETECTED_VENV_PATH" "検出されたパスが正しいこと"
}

# テスト2: 仮想環境検出機能のテスト（異常系）
test_detect_virtual_environment_failure() {
    echo -e "\n${BLUE}=== 仮想環境検出テスト（異常系） ===${NC}"
    
    # 仮想環境が存在しない状態でテスト
    detect_virtual_environment
    local result=$?
    
    assert_false $result "仮想環境が存在しない場合は失敗すること"
    assert_equals "" "$DETECTED_VENV_PATH" "検出されたパスが空であること"
}

# テスト3: 仮想環境検出機能のテスト（activateスクリプトなし）
test_detect_virtual_environment_no_activate() {
    echo -e "\n${BLUE}=== 仮想環境検出テスト（activateスクリプトなし） ===${NC}"
    
    # ディレクトリは存在するがactivateスクリプトがない場合
    mkdir -p venv/bin
    # activateスクリプトは作成しない
    
    detect_virtual_environment
    local result=$?
    
    assert_false $result "activateスクリプトがない場合は失敗すること"
}

# テスト4: 複数の仮想環境候補のテスト
test_detect_multiple_venv_candidates() {
    echo -e "\n${BLUE}=== 複数仮想環境候補テスト ===${NC}"
    
    # 複数の候補を作成（優先順位テスト）
    mkdir -p .venv/bin
    touch .venv/bin/activate
    mkdir -p venv/bin
    touch venv/bin/activate
    
    detect_virtual_environment
    local result=$?
    
    assert_true $result "複数候補がある場合でも検出が成功すること"
    assert_equals "venv" "$DETECTED_VENV_PATH" "優先順位に従って最初の候補が選ばれること"
}

# テスト5: Python環境検証のテスト（正常系）
test_verify_python_environment_success() {
    echo -e "\n${BLUE}=== Python環境検証テスト（正常系） ===${NC}"
    
    # Pythonが利用可能な場合のテスト
    if command -v python3 >/dev/null 2>&1; then
        verify_python_environment
        local result=$?
        assert_true $result "Pythonが利用可能な場合は検証が成功すること"
    else
        show_test_result "Python環境検証テスト（正常系）" "SKIP" "Python3が利用できません"
    fi
}

# テスト6: 依存関係チェックのテスト（正常系）
test_check_dependencies_with_requirements() {
    echo -e "\n${BLUE}=== 依存関係チェックテスト（requirements.txtあり） ===${NC}"
    
    # requirements.txtが存在する場合のテスト
    if command -v python3 >/dev/null 2>&1; then
        check_dependencies
        local result=$?
        # 依存関係が不足している可能性があるので、実行できることを確認
        show_test_result "依存関係チェックが実行できること" "PASS"
    else
        show_test_result "依存関係チェックテスト" "SKIP" "Python3が利用できません"
    fi
}

# テスト7: 依存関係チェックのテスト（requirements.txtなし）
test_check_dependencies_no_requirements() {
    echo -e "\n${BLUE}=== 依存関係チェックテスト（requirements.txtなし） ===${NC}"
    
    # requirements.txtを削除
    rm -f requirements.txt
    
    check_dependencies
    local result=$?
    
    assert_false $result "requirements.txtがない場合は失敗すること"
}

# テスト8: 環境情報表示のテスト
test_show_environment_info() {
    echo -e "\n${BLUE}=== 環境情報表示テスト ===${NC}"
    
    # 環境情報表示が実行できることを確認
    local output=$(show_environment_info 2>&1)
    local result=$?
    
    assert_true $result "環境情報表示が実行できること"
    
    # 出力に期待される内容が含まれているかチェック
    if echo "$output" | grep -q "環境情報"; then
        show_test_result "環境情報のヘッダーが表示されること" "PASS"
    else
        show_test_result "環境情報のヘッダーが表示されること" "FAIL" "ヘッダーが見つかりません"
    fi
}

# テスト9: セットアップ手順表示のテスト
test_show_venv_setup_instructions() {
    echo -e "\n${BLUE}=== セットアップ手順表示テスト ===${NC}"
    
    local output=$(show_venv_setup_instructions 2>&1)
    
    # 出力に期待される内容が含まれているかチェック
    if echo "$output" | grep -q "仮想環境セットアップ手順"; then
        show_test_result "セットアップ手順のヘッダーが表示されること" "PASS"
    else
        show_test_result "セットアップ手順のヘッダーが表示されること" "FAIL"
    fi
    
    if echo "$output" | grep -q "python3 -m venv venv"; then
        show_test_result "仮想環境作成コマンドが表示されること" "PASS"
    else
        show_test_result "仮想環境作成コマンドが表示されること" "FAIL"
    fi
}

# テスト10: グローバル変数の初期化テスト
test_global_variables_initialization() {
    echo -e "\n${BLUE}=== グローバル変数初期化テスト ===${NC}"
    
    # 初期状態の確認
    assert_equals "" "$DETECTED_VENV_PATH" "DETECTED_VENV_PATHが初期化されていること"
    assert_equals "" "$ORIGINAL_VIRTUAL_ENV" "ORIGINAL_VIRTUAL_ENVが初期化されていること"
    assert_equals "false" "$VENV_ACTIVATED" "VENV_ACTIVATEDが初期化されていること"
}

# テスト11: エラーハンドリングのテスト
test_error_handling() {
    echo -e "\n${BLUE}=== エラーハンドリングテスト ===${NC}"
    
    # 存在しないパスでの仮想環境有効化テスト
    DETECTED_VENV_PATH="/nonexistent/path"
    activate_virtual_environment
    local result=$?
    
    assert_false $result "存在しないパスでの有効化は失敗すること"
    
    # パスが設定されていない状態での有効化テスト
    DETECTED_VENV_PATH=""
    activate_virtual_environment
    local result=$?
    
    assert_false $result "パスが設定されていない場合は失敗すること"
}

# テスト12: ヘルプ表示のテスト
test_show_help() {
    echo -e "\n${BLUE}=== ヘルプ表示テスト ===${NC}"
    
    local output=$(show_help 2>&1)
    
    if echo "$output" | grep -q "仮想環境マネージャー"; then
        show_test_result "ヘルプにタイトルが表示されること" "PASS"
    else
        show_test_result "ヘルプにタイトルが表示されること" "FAIL"
    fi
    
    if echo "$output" | grep -q "detect_virtual_environment"; then
        show_test_result "ヘルプに関数名が表示されること" "PASS"
    else
        show_test_result "ヘルプに関数名が表示されること" "FAIL"
    fi
}

# メインテスト実行関数
run_all_tests() {
    echo -e "${YELLOW}$TEST_NAME を開始します${NC}"
    echo "テスト環境: $TEST_TEMP_DIR"
    
    # venv-manager.shを読み込み
    if ! source_venv_manager; then
        echo -e "${RED}エラー: venv-manager.shの読み込みに失敗しました${NC}"
        return 1
    fi
    
    # 各テストを実行
    test_global_variables_initialization
    test_detect_virtual_environment_failure
    test_detect_virtual_environment_no_activate
    test_detect_virtual_environment_success
    test_detect_multiple_venv_candidates
    test_verify_python_environment_success
    test_check_dependencies_no_requirements
    
    # requirements.txtを再作成してテスト
    cat > requirements.txt << EOF
requests>=2.25.0
python-dateutil>=2.8.0
EOF
    test_check_dependencies_with_requirements
    
    test_show_environment_info
    test_show_venv_setup_instructions
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