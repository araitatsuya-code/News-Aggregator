#!/bin/bash

# =============================================================================
# 統合テスト実行スクリプト
# ワンコマンドデプロイメントの統合テストを実行する
# =============================================================================

set -euo pipefail

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# カラー出力設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 使用方法の表示
show_usage() {
    echo "使用方法: $0 [オプション]"
    echo ""
    echo "オプション:"
    echo "  -h, --help     このヘルプを表示"
    echo "  -v, --verbose  詳細な出力を表示"
    echo "  -q, --quiet    エラー以外の出力を抑制"
    echo "  --clean        テスト前にキャッシュをクリア"
    echo ""
    echo "例:"
    echo "  $0                    # 標準的な統合テストを実行"
    echo "  $0 --verbose          # 詳細出力で統合テストを実行"
    echo "  $0 --clean --verbose  # キャッシュクリア後に詳細出力で実行"
}

# ログ関数
log_info() {
    if [ "${QUIET:-false}" != "true" ]; then
        echo -e "${BLUE}[INFO]${NC} $1"
    fi
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 前提条件の確認
check_prerequisites() {
    log_info "前提条件を確認しています..."
    
    local missing_tools=()
    
    # 必須ツールの確認
    if ! command -v python3 &> /dev/null; then
        missing_tools+=("python3")
    fi
    
    if ! command -v bash &> /dev/null; then
        missing_tools+=("bash")
    fi
    
    # 推奨ツールの確認
    if ! command -v jq &> /dev/null; then
        log_warning "jqが見つかりません。JSONファイルの検証機能が制限されます"
    fi
    
    if ! command -v timeout &> /dev/null; then
        log_warning "timeoutコマンドが見つかりません。テストのタイムアウト機能が無効になります"
    fi
    
    # 必須ツールが不足している場合はエラー
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "以下の必須ツールが見つかりません: ${missing_tools[*]}"
        echo ""
        echo "インストール方法:"
        for tool in "${missing_tools[@]}"; do
            case $tool in
                python3)
                    echo "  - Python3: https://www.python.org/downloads/"
                    ;;
                bash)
                    echo "  - Bash: 通常はシステムに標準インストールされています"
                    ;;
            esac
        done
        return 1
    fi
    
    log_success "前提条件の確認が完了しました"
}

# テストキャッシュのクリア
clean_test_cache() {
    log_info "テストキャッシュをクリアしています..."
    
    # 統合テストの一時ファイルを削除
    find "$SCRIPT_DIR" -name "test_workspace" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$SCRIPT_DIR" -name "mock_data" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$SCRIPT_DIR" -name "integration_test_*.log" -type f -delete 2>/dev/null || true
    
    # プロジェクトの一時ファイルを削除
    find "$PROJECT_ROOT" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$PROJECT_ROOT" -name "*.pyc" -type f -delete 2>/dev/null || true
    
    log_success "テストキャッシュのクリアが完了しました"
}

# 統合テストの実行
run_integration_tests() {
    log_info "統合テストを実行しています..."
    
    cd "$PROJECT_ROOT"
    
    # 統合テストスクリプトの実行
    local test_script="$SCRIPT_DIR/test_deployment_workflows.sh"
    
    if [ ! -f "$test_script" ]; then
        log_error "統合テストスクリプトが見つかりません: $test_script"
        return 1
    fi
    
    if [ ! -x "$test_script" ]; then
        log_error "統合テストスクリプトに実行権限がありません: $test_script"
        return 1
    fi
    
    # テストの実行
    local exit_code=0
    if [ "${VERBOSE:-false}" = "true" ]; then
        "$test_script"
        exit_code=$?
    else
        # 一時ファイルを使用してテストスクリプトの終了コードを保存
        local temp_output=$(mktemp)
        "$test_script" > "$temp_output" 2>&1
        exit_code=$?
        grep -E "(INFO|SUCCESS|WARNING|ERROR|テスト結果|====)" "$temp_output" || true
        rm -f "$temp_output"
    fi
    
    if [ $exit_code -eq 0 ]; then
        log_success "統合テストが正常に完了しました"
    else
        log_error "統合テストが失敗しました (終了コード: $exit_code)"
    fi
    
    return $exit_code
}

# テスト結果の分析
analyze_test_results() {
    log_info "テスト結果を分析しています..."
    
    # 最新のログファイルを検索（macOS対応）
    local latest_log
    latest_log=$(find "$SCRIPT_DIR" -name "integration_test_*.log" -type f -exec ls -t {} + 2>/dev/null | head -1)
    
    if [ -n "$latest_log" ] && [ -f "$latest_log" ]; then
        log_info "詳細なログファイル: $latest_log"
        
        # エラーの抽出
        local error_count
        error_count=$(grep -c "\[ERROR\]" "$latest_log" 2>/dev/null || echo "0")
        
        if [ "$error_count" -gt 0 ]; then
            log_warning "ログファイルに $error_count 個のエラーが記録されています"
            
            if [ "${VERBOSE:-false}" = "true" ]; then
                echo ""
                echo "エラーの詳細:"
                grep "\[ERROR\]" "$latest_log" | head -5
                if [ "$error_count" -gt 5 ]; then
                    echo "... (他 $((error_count - 5)) 個のエラー)"
                fi
            fi
        fi
        
        # 実行時間の抽出
        local start_time end_time
        start_time=$(head -1 "$latest_log" 2>/dev/null | grep -o '\[.*\]' | tr -d '[]' || echo "")
        end_time=$(tail -1 "$latest_log" 2>/dev/null | grep -o '\[.*\]' | tr -d '[]' || echo "")
        
        if [ -n "$start_time" ] && [ -n "$end_time" ]; then
            log_info "テスト実行時間: $start_time ～ $end_time"
        fi
    else
        log_warning "ログファイルが見つかりませんでした"
    fi
}

# メイン実行関数
main() {
    local VERBOSE=false
    local QUIET=false
    local CLEAN=false
    
    # コマンドライン引数の解析
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
            --clean)
                CLEAN=true
                shift
                ;;
            *)
                log_error "不明なオプション: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # 環境変数として設定
    export VERBOSE QUIET
    
    echo "=============================================="
    echo "ワンコマンドデプロイメント統合テスト実行"
    echo "=============================================="
    
    # 前提条件の確認
    if ! check_prerequisites; then
        exit 1
    fi
    
    # キャッシュクリア（必要な場合）
    if [ "$CLEAN" = "true" ]; then
        clean_test_cache
    fi
    
    # 統合テストの実行
    local test_result=0
    if ! run_integration_tests; then
        test_result=1
    fi
    
    # テスト結果の分析
    analyze_test_results
    
    echo ""
    echo "=============================================="
    if [ $test_result -eq 0 ]; then
        echo -e "${GREEN}統合テストが正常に完了しました${NC}"
    else
        echo -e "${RED}統合テストが失敗しました${NC}"
    fi
    echo "=============================================="
    
    exit $test_result
}

# スクリプトが直接実行された場合のみmain関数を呼び出す
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi