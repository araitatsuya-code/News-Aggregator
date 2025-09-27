#!/bin/bash

# テストフレームワーク検証用の簡単なテスト
# このテストは他のテストが正しく動作することを確認するためのものです

# テストフレームワークの設定
TEST_NAME="テストフレームワーク検証"
TEST_COUNT=0
PASSED_COUNT=0
FAILED_COUNT=0

# カラーコード
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

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

# 基本的なテスト
test_basic_assertions() {
    echo -e "\n${BLUE}=== 基本アサーションテスト ===${NC}"
    
    # 等価テスト
    assert_equals "test" "test" "文字列の等価比較が正しく動作すること"
    assert_equals "123" "123" "数値の等価比較が正しく動作すること"
    
    # 真偽テスト
    assert_true 0 "真の条件が正しく判定されること"
    
    # コマンド実行テスト
    echo "test" > /tmp/test_file
    if [[ -f "/tmp/test_file" ]]; then
        show_test_result "ファイル作成テストが正しく動作すること" "PASS"
    else
        show_test_result "ファイル作成テストが正しく動作すること" "FAIL"
    fi
    rm -f /tmp/test_file
}

# 環境テスト
test_environment() {
    echo -e "\n${BLUE}=== 環境テスト ===${NC}"
    
    # 基本コマンドの存在確認
    if command -v bash >/dev/null 2>&1; then
        show_test_result "bashコマンドが利用可能であること" "PASS"
    else
        show_test_result "bashコマンドが利用可能であること" "FAIL"
    fi
    
    if command -v date >/dev/null 2>&1; then
        show_test_result "dateコマンドが利用可能であること" "PASS"
    else
        show_test_result "dateコマンドが利用可能であること" "FAIL"
    fi
    
    # 一時ディレクトリの作成テスト
    local temp_dir=$(mktemp -d -t framework_test_XXXXXX)
    if [[ -d "$temp_dir" ]]; then
        show_test_result "一時ディレクトリが作成できること" "PASS"
        rm -rf "$temp_dir"
    else
        show_test_result "一時ディレクトリが作成できること" "FAIL"
    fi
}

# メインテスト実行関数
run_all_tests() {
    echo -e "${YELLOW}$TEST_NAME を開始します${NC}"
    
    test_basic_assertions
    test_environment
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
        echo -e "\n${GREEN}✓ テストフレームワークが正常に動作しています！${NC}"
        return 0
    else
        echo -e "\n${RED}✗ テストフレームワークに問題があります${NC}"
        return 1
    fi
}

# メイン実行部分
main() {
    run_all_tests
    show_test_summary
}

# スクリプトが直接実行された場合はメイン関数を実行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi