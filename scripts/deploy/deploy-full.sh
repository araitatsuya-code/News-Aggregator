#!/bin/bash

# メインデプロイスクリプト - ワンコマンドデプロイメント
# AI News Aggregator - Full Deployment Script
# 全ワークフローを統合するメインスクリプト

set -e

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ユーティリティスクリプトを読み込み
source "$SCRIPT_DIR/utils/error-handler.sh"
source "$SCRIPT_DIR/utils/detailed-logger.sh"
source "$SCRIPT_DIR/utils/progress-logger.sh"
source "$SCRIPT_DIR/utils/time-tracker.sh"
source "$SCRIPT_DIR/utils/venv-manager.sh"

# デフォルト設定
DEPLOY_ENV="preview"
SKIP_DATA_COLLECTION=false
VERBOSE_MODE=false
BACKUP_ENABLED=false
LOG_FILE="$PROJECT_ROOT/logs/deploy-full-$(date +%Y%m%d_%H%M%S).log"

# バックアップ関連の設定
BACKUP_DIR="$PROJECT_ROOT/backups"
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CURRENT_BACKUP_DIR=""
BACKUP_MANIFEST_FILE=""

# ヘルプ表示
show_help() {
    cat << EOF
AI News Aggregator - ワンコマンドデプロイメント

使用方法:
    $0 [オプション]

オプション:
    --env <環境>            デプロイ環境を指定 (preview または prod)
    --prod, -p              本番環境にデプロイ (--env prod と同等)
    --preview, -pr          プレビュー環境にデプロイ (--env preview と同等、デフォルト)
    --skip-data, -s         データ収集をスキップしてデプロイのみ実行
    --verbose, -v           詳細ログを出力
    --backup, -b            既存データのバックアップを作成
    --restore <backup_id>   指定されたバックアップから復元
    --list-backups          利用可能なバックアップを一覧表示
    --log-file <path>       ログファイルのパスを指定
    --help, -h              このヘルプを表示

説明:
    このスクリプトは以下のワークフローを順次実行します:
    1. 環境確認と仮想環境有効化
    2. データ収集（記事取得・要約）※--skip-dataで省略可能
    3. データコピー（latest.json更新）
    4. Vercelデプロイメント

例:
    $0                      # プレビュー環境に全ワークフロー実行
    $0 --prod --backup      # 本番環境にバックアップ付きでデプロイ
    $0 --skip-data --prod   # データ収集をスキップして本番デプロイ
    $0 --verbose            # 詳細ログ付きでプレビューデプロイ
    $0 --list-backups       # 利用可能なバックアップを表示
    $0 --restore deploy-20240115_143022  # 指定バックアップから復元

注意:
    - 本番環境へのデプロイ時は確認プロンプトが表示されます
    - --skip-dataを使用する場合は事前にデータが準備されている必要があります

EOF
}

# コマンドライン引数解析機能
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --env)
                if [[ -n "$2" ]] && [[ "$2" != --* ]]; then
                    DEPLOY_ENV="$2"
                    shift 2
                else
                    log_error "--env オプションには環境を指定してください (preview または prod)"
                    exit 1
                fi
                ;;
            --prod|-p)
                DEPLOY_ENV="prod"
                shift
                ;;
            --preview|-pr)
                DEPLOY_ENV="preview"
                shift
                ;;
            --skip-data|-s)
                SKIP_DATA_COLLECTION=true
                shift
                ;;
            --verbose|-v)
                VERBOSE_MODE=true
                shift
                ;;
            --backup|-b)
                BACKUP_ENABLED=true
                shift
                ;;
            --restore)
                if [[ -n "$2" ]] && [[ "$2" != --* ]]; then
                    # 復元モードで実行
                    restore_from_backup "$2"
                    exit $?
                else
                    log_error "--restore オプションにはバックアップIDを指定してください"
                    list_available_backups
                    exit 1
                fi
                ;;
            --list-backups)
                list_available_backups
                exit 0
                ;;
            --log-file)
                if [[ -n "$2" ]] && [[ "$2" != --* ]]; then
                    LOG_FILE="$2"
                    shift 2
                else
                    log_error "ログファイルパスが指定されていません"
                    exit 1
                fi
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "不明なオプション: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# 環境指定の検証
validate_deploy_environment() {
    case "$DEPLOY_ENV" in
        "preview"|"prod")
            return 0
            ;;
        *)
            log_error "無効な環境が指定されました: $DEPLOY_ENV"
            log_error "有効な環境: preview, prod"
            return 1
            ;;
    esac
}

# 本番環境への確認プロンプト
confirm_production_deploy() {
    if [[ "$DEPLOY_ENV" == "prod" ]]; then
        log_warn "本番環境への全ワークフローデプロイを実行しようとしています"
        log_warn "この操作により、データ収集から本番サイト更新まで全て実行されます"
        echo ""
        
        # 対話的な確認プロンプト
        while true; do
            read -p "本番環境にデプロイしますか？ (yes/no): " yn
            case $yn in
                [Yy]es|[Yy]|はい|y)
                    log_info "本番環境への全ワークフローデプロイを続行します"
                    break
                    ;;
                [Nn]o|[Nn]|いいえ|n)
                    log_info "デプロイをキャンセルしました"
                    exit 0
                    ;;
                *)
                    echo "yes または no で回答してください"
                    ;;
            esac
        done
        echo ""
    fi
}

# 初期化処理
initialize() {
    # プロジェクトルートに移動
    cd "$PROJECT_ROOT"
    
    # エラーハンドラーを初期化
    local error_log_file="${LOG_FILE%.log}_error.log"
    init_error_handler "$error_log_file"
    
    # 詳細ログシステムを初期化
    local log_level="info"
    local log_format="text"
    if [[ "$VERBOSE_MODE" == "true" ]]; then
        log_level="debug"
        log_format="json"
    fi
    
    local detailed_log_file="${LOG_FILE%.log}_detailed.log"
    init_detailed_logger "$detailed_log_file" "$log_level" "$log_format"
    
    # 基本ログ設定
    set_log_file "$LOG_FILE"
    
    if [[ "$VERBOSE_MODE" == "true" ]]; then
        set_log_level "debug"
    else
        set_log_level "info"
    fi
    
    # 時間トラッカー初期化
    init_time_tracker
    
    log_info "AI News Aggregator ワンコマンドデプロイメント開始"
    detailed_log_info "ワンコマンドデプロイメント開始" "main" "{\"deploy_env\":\"$DEPLOY_ENV\",\"skip_data\":$SKIP_DATA_COLLECTION,\"verbose\":$VERBOSE_MODE,\"backup\":$BACKUP_ENABLED}"
    
    log_info "実行時刻: $(date '+%Y-%m-%d %H:%M:%S')"
    log_info "作業ディレクトリ: $PROJECT_ROOT"
    log_info "ログファイル: $LOG_FILE"
    log_info "詳細ログファイル: $detailed_log_file"
    log_info "エラーログファイル: $error_log_file"
    log_info "デプロイ環境: $DEPLOY_ENV"
    
    if [[ "$SKIP_DATA_COLLECTION" == "true" ]]; then
        log_info "データ収集: スキップ"
    fi
    
    if [[ "$VERBOSE_MODE" == "true" ]]; then
        log_info "詳細ログモード: 有効"
    fi
    
    if [[ "$BACKUP_ENABLED" == "true" ]]; then
        log_info "バックアップ機能: 有効"
    fi
}

# 環境確認
check_environment() {
    log_info "環境確認を実行中..."
    
    # プロジェクトルートディレクトリの確認
    if [[ ! -f "requirements.txt" ]]; then
        log_error "プロジェクトルートディレクトリで実行してください（requirements.txtが見つかりません）"
        return 1
    fi
    
    # 必要なスクリプトファイルの存在確認
    local required_scripts=(
        "scripts/core/main.py"
        "scripts/deploy/deploy-data-only.sh"
        "scripts/deploy/deploy-vercel.sh"
    )
    
    for script in "${required_scripts[@]}"; do
        if [[ ! -f "$script" ]]; then
            log_error "必要なスクリプトが見つかりません: $script"
            return 1
        fi
    done
    
    # 必要なディレクトリの確認
    local required_dirs=("shared" "frontend")
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            log_error "必要なディレクトリが見つかりません: $dir"
            return 1
        fi
    done
    
    # フロントエンドの必要ファイル確認
    if [[ ! -f "frontend/package.json" ]]; then
        log_error "フロントエンドのpackage.jsonが見つかりません"
        return 1
    fi
    
    log_success "環境確認完了"
    return 0
}

# データ受け渡し用の変数
WORKFLOW_DATA_FILE="/tmp/deploy_workflow_data_$$"
DEPLOYMENT_STATUS="unknown"
DEPLOYED_URL=""

# ワークフローデータを初期化
init_workflow_data() {
    cat > "$WORKFLOW_DATA_FILE" << EOF
{
  "workflow_id": "$$",
  "start_time": "$(date -Iseconds)",
  "steps": {},
  "data": {
    "articles_count": 0,
    "categories": [],
    "sources": [],
    "deployment_url": "",
    "deployment_status": "pending"
  }
}
EOF
}

# ワークフローデータを更新
update_workflow_data() {
    local step_name="$1"
    local status="$2"
    local data="$3"
    
    if [[ ! -f "$WORKFLOW_DATA_FILE" ]]; then
        init_workflow_data
    fi
    
    # Pythonを使用してJSONを更新
    python3 -c "
import json
import sys
from datetime import datetime

try:
    with open('$WORKFLOW_DATA_FILE', 'r') as f:
        data = json.load(f)
    
    data['steps']['$step_name'] = {
        'status': '$status',
        'timestamp': datetime.now().isoformat(),
        'data': '$data' if '$data' else None
    }
    
    with open('$WORKFLOW_DATA_FILE', 'w') as f:
        json.dump(data, f, indent=2)
        
except Exception as e:
    print(f'Error updating workflow data: {e}', file=sys.stderr)
    sys.exit(1)
"
}

# データ収集結果を検証し、次のステップに渡すデータを準備
validate_and_prepare_data() {
    log_info "データ収集結果を検証中..."
    
    # 必須データファイルの存在確認
    local required_files=(
        "frontend/public/data/news/latest.json"
        "frontend/public/data/summaries/latest.json"
    )
    
    local validation_errors=0
    local articles_count=0
    local categories=()
    local sources=()
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "必須データファイルが見つかりません: $file"
            ((validation_errors++))
        else
            # JSONファイルの構文チェック
            if ! python3 -m json.tool "$file" >/dev/null 2>&1; then
                log_error "JSONファイルの構文エラー: $file"
                ((validation_errors++))
            fi
        fi
    done
    
    if [[ $validation_errors -gt 0 ]]; then
        log_error "データ検証で $validation_errors 個のエラーが見つかりました"
        return 1
    fi
    
    # データ統計を取得
    local news_file="frontend/public/data/news/latest.json"
    if [[ -f "$news_file" ]]; then
        local stats=$(python3 -c "
import json
from collections import Counter

try:
    with open('$news_file', 'r', encoding='utf-8') as f:
        articles = json.load(f)
    
    print(f'ARTICLES_COUNT:{len(articles)}')
    
    categories = Counter()
    sources = Counter()
    
    for article in articles:
        categories[article.get('category', 'unknown')] += 1
        sources[article.get('source', 'unknown')] += 1
    
    print('CATEGORIES:' + ','.join(categories.keys()))
    print('SOURCES:' + ','.join(sources.keys()))
    
except Exception as e:
    print(f'ERROR:{e}')
" 2>/dev/null)
        
        if [[ $? -eq 0 ]]; then
            articles_count=$(echo "$stats" | grep "^ARTICLES_COUNT:" | cut -d: -f2)
            local categories_str=$(echo "$stats" | grep "^CATEGORIES:" | cut -d: -f2)
            local sources_str=$(echo "$stats" | grep "^SOURCES:" | cut -d: -f2)
            
            log_info "データ検証結果:"
            log_info "  記事数: $articles_count"
            log_info "  カテゴリ: $categories_str"
            log_info "  ソース: $sources_str"
            
            # ワークフローデータを更新
            update_workflow_data "data_validation" "completed" "articles:$articles_count"
        fi
    fi
    
    if [[ $articles_count -eq 0 ]]; then
        log_warn "記事が生成されていません"
        return 1
    fi
    
    log_success "データ検証が完了しました"
    return 0
}

# デプロイ前の最終確認
pre_deploy_validation() {
    log_info "デプロイ前の最終確認を実行中..."
    
    # データファイルの最終確認
    if [[ "$SKIP_DATA_COLLECTION" == "true" ]]; then
        log_info "データ収集をスキップしたため、既存データを確認中..."
        
        if ! validate_and_prepare_data; then
            log_error "既存データの確認に失敗しました"
            log_error "データ収集を実行してください: $0 --env $DEPLOY_ENV"
            return 1
        fi
    fi
    
    # フロントエンドの依存関係確認
    if [[ ! -d "frontend/node_modules" ]]; then
        log_warn "フロントエンドの依存関係がインストールされていません"
        log_info "依存関係をインストール中..."
        
        cd frontend
        if ! npm ci --production=false; then
            log_error "依存関係のインストールに失敗しました"
            cd ..
            return 1
        fi
        cd ..
        
        log_success "依存関係のインストールが完了しました"
    fi
    
    # Vercel CLIの確認
    if ! command -v vercel >/dev/null 2>&1; then
        log_error "Vercel CLIがインストールされていません"
        log_error "インストール方法: npm install -g vercel"
        return 1
    fi
    
    log_success "デプロイ前の最終確認が完了しました"
    return 0
}

# デプロイ後の検証
post_deploy_validation() {
    log_info "デプロイ後の検証を実行中..."
    
    # デプロイされたURLを取得
    local deployed_url=""
    
    # Vercelからデプロイ情報を取得
    if command -v vercel >/dev/null 2>&1; then
        deployed_url=$(vercel ls 2>/dev/null | grep -E "(ai-news-aggregator|news-aggregator)" | head -1 | awk '{print $2}' || echo "")
    fi
    
    if [[ -n "$deployed_url" ]]; then
        DEPLOYED_URL="https://$deployed_url"
        log_info "デプロイされたURL: $DEPLOYED_URL"
        
        # ヘルスチェック
        log_info "サイトのヘルスチェックを実行中..."
        
        local health_check_attempts=3
        local health_check_success=false
        
        for ((i=1; i<=health_check_attempts; i++)); do
            log_debug "ヘルスチェック試行 $i/$health_check_attempts"
            
            if curl -f -s --max-time 30 "$DEPLOYED_URL" >/dev/null 2>&1; then
                health_check_success=true
                break
            else
                log_debug "ヘルスチェック失敗、30秒後に再試行..."
                sleep 30
            fi
        done
        
        if [[ "$health_check_success" == "true" ]]; then
            log_success "サイトが正常に動作しています"
            DEPLOYMENT_STATUS="success"
            
            # APIエンドポイントの確認
            log_info "データAPIの確認中..."
            if curl -f -s --max-time 15 "$DEPLOYED_URL/data/news/latest.json" >/dev/null 2>&1; then
                log_success "データAPIが正常に動作しています"
            else
                log_warn "データAPIへのアクセスに問題がある可能性があります"
            fi
            
        else
            log_error "サイトへのアクセスに問題があります"
            DEPLOYMENT_STATUS="failed"
            return 1
        fi
        
        # ワークフローデータを更新
        update_workflow_data "deployment" "completed" "url:$DEPLOYED_URL"
        
    else
        log_warn "デプロイされたURLを取得できませんでした"
        DEPLOYMENT_STATUS="unknown"
    fi
    
    return 0
}

# エラー時の中断処理
handle_step_failure() {
    local failed_step="$1"
    local error_message="$2"
    
    # 統一エラーハンドリングを使用
    case "$failed_step" in
        "環境確認")
            handle_error "$ERROR_TYPE_ENVIRONMENT" "ステップ '$failed_step' でエラーが発生しました: $error_message" 1 "step:$failed_step"
            ;;
        "仮想環境有効化")
            handle_error "$ERROR_TYPE_ENVIRONMENT" "ステップ '$failed_step' でエラーが発生しました: $error_message" 1 "step:$failed_step"
            ;;
        "データ収集")
            handle_error "$ERROR_TYPE_EXTERNAL_COMMAND" "ステップ '$failed_step' でエラーが発生しました: $error_message" 1 "step:$failed_step"
            ;;
        "Vercelデプロイ")
            handle_error "$ERROR_TYPE_EXTERNAL_COMMAND" "ステップ '$failed_step' でエラーが発生しました: $error_message" 1 "step:$failed_step"
            ;;
        *)
            handle_error "$ERROR_TYPE_UNKNOWN" "ステップ '$failed_step' でエラーが発生しました: $error_message" 1 "step:$failed_step"
            ;;
    esac
    
    # 詳細ログに記録
    detailed_log_error "ステップ失敗: $failed_step" "workflow" "{\"step\":\"$failed_step\",\"error\":\"$error_message\",\"action\":\"step_failure\"}"
    
    # ワークフローデータを更新
    update_workflow_data "$failed_step" "failed" "$error_message"
    
    # エラー統計を表示
    show_error_summary
}

# メイン処理を実行
main() {
    # 引数解析
    parse_arguments "$@"
    
    # 環境指定の検証
    if ! validate_deploy_environment; then
        exit 1
    fi
    
    # 本番環境への確認プロンプト
    confirm_production_deploy
    
    # 初期化
    initialize
    
    # ワークフローデータを初期化
    init_workflow_data
    
    # バックアップディレクトリを作成（バックアップが有効な場合）
    if [[ "$BACKUP_ENABLED" == "true" ]]; then
        create_backup_directory
    fi
    
    # 総ステップ数を設定
    local total_steps=4
    if [[ "$SKIP_DATA_COLLECTION" == "true" ]]; then
        total_steps=3
    fi
    if [[ "$BACKUP_ENABLED" == "true" ]]; then
        total_steps=$((total_steps + 1))
    fi
    
    set_total_steps $total_steps
    start_workflow_timer
    
    log_info "ワンコマンドデプロイメントを開始します"
    log_info "実行予定ステップ:"
    local step_num=1
    log_info "  $step_num. 環境確認と仮想環境有効化"
    ((step_num++))
    
    if [[ "$BACKUP_ENABLED" == "true" ]]; then
        log_info "  $step_num. 既存データのバックアップ作成"
        ((step_num++))
    fi
    
    if [[ "$SKIP_DATA_COLLECTION" != "true" ]]; then
        log_info "  $step_num. データ収集（記事取得・要約・コピー）"
        ((step_num++))
        log_info "  $step_num. デプロイ前検証"
        ((step_num++))
        log_info "  $step_num. Vercelデプロイメント"
    else
        log_info "  $step_num. デプロイ前検証"
        ((step_num++))
        log_info "  $step_num. Vercelデプロイメント（データ収集スキップ）"
    fi
    
    echo
    
    # ステップ1: 環境確認と仮想環境有効化
    start_step "環境確認と仮想環境有効化"
    start_step_timer "環境確認"
    
    if ! check_environment; then
        handle_step_failure "環境確認" "環境確認に失敗しました"
        fail_step "環境確認" "環境確認に失敗しました"
        exit 1
    fi
    
    if ! setup_and_verify_environment; then
        handle_step_failure "仮想環境有効化" "仮想環境のセットアップに失敗しました"
        fail_step "仮想環境有効化" "仮想環境のセットアップに失敗しました"
        exit 1
    fi
    
    local step1_duration=$(end_step_timer "環境確認")
    complete_step "環境確認と仮想環境有効化" "$step1_duration"
    update_workflow_data "environment_setup" "completed" "duration:$step1_duration"
    
    # ステップ2: バックアップ作成（オプション）
    if [[ "$BACKUP_ENABLED" == "true" ]]; then
        start_step "既存データのバックアップ作成"
        start_step_timer "バックアップ作成"
        
        if ! backup_data_files; then
            handle_step_failure "バックアップ作成" "バックアップの作成に失敗しました"
            fail_step "バックアップ作成" "バックアップの作成に失敗しました"
            exit 1
        fi
        
        local backup_duration=$(end_step_timer "バックアップ作成")
        complete_step "既存データのバックアップ作成" "$backup_duration"
        update_workflow_data "backup_creation" "completed" "duration:$backup_duration"
    fi
    
    # ステップ3: データ収集（オプション）
    if [[ "$SKIP_DATA_COLLECTION" != "true" ]]; then
        start_step "データ収集（記事取得・要約・コピー）"
        start_step_timer "データ収集"
        
        log_info "データ準備スクリプトを実行中..."
        
        # データ準備スクリプトのオプション構築
        local data_script_options=""
        if [[ "$VERBOSE_MODE" == "true" ]]; then
            data_script_options="$data_script_options --verbose"
        fi
        if [[ "$BACKUP_ENABLED" == "true" ]]; then
            data_script_options="$data_script_options --backup"
        fi
        
        # データ準備スクリプトを実行
        if ! bash "$SCRIPT_DIR/deploy-data-only.sh" $data_script_options; then
            handle_step_failure "データ収集" "データ収集に失敗しました"
            fail_step "データ収集" "データ収集に失敗しました"
            exit 1
        fi
        
        local step2_duration=$(end_step_timer "データ収集")
        complete_step "データ収集（記事取得・要約・コピー）" "$step2_duration"
        update_workflow_data "data_collection" "completed" "duration:$step2_duration"
        
        # データ収集結果の検証
        if ! validate_and_prepare_data; then
            handle_step_failure "データ収集" "データ検証に失敗しました"
            fail_step "データ収集" "データ検証に失敗しました"
            exit 1
        fi
    else
        log_info "データ収集をスキップしました"
        update_workflow_data "data_collection" "skipped" "reason:skip_data_flag"
    fi
    
    # ステップ4: デプロイ前検証
    start_step "デプロイ前検証"
    start_step_timer "デプロイ前検証"
    
    if ! pre_deploy_validation; then
        handle_step_failure "デプロイ前検証" "デプロイ前検証に失敗しました"
        fail_step "デプロイ前検証" "デプロイ前検証に失敗しました"
        exit 1
    fi
    
    local step3_duration=$(end_step_timer "デプロイ前検証")
    complete_step "デプロイ前検証" "$step3_duration"
    update_workflow_data "pre_deploy_validation" "completed" "duration:$step3_duration"
    
    # ステップ5: Vercelデプロイメント
    start_step "Vercelデプロイメント"
    start_step_timer "Vercelデプロイ"
    
    log_info "Vercelデプロイスクリプトを実行中..."
    
    # Vercelデプロイスクリプトのオプション構築
    local vercel_script_options="--env $DEPLOY_ENV"
    
    # Vercelデプロイスクリプトを実行
    if ! bash "$SCRIPT_DIR/deploy-vercel.sh" $vercel_script_options; then
        handle_step_failure "Vercelデプロイ" "Vercelデプロイに失敗しました"
        fail_step "Vercelデプロイ" "Vercelデプロイに失敗しました"
        exit 1
    fi
    
    local step4_duration=$(end_step_timer "Vercelデプロイ")
    complete_step "Vercelデプロイメント" "$step4_duration"
    update_workflow_data "vercel_deploy" "completed" "duration:$step4_duration"
    
    # デプロイ後の検証
    if ! post_deploy_validation; then
        log_warn "デプロイ後の検証で問題が検出されましたが、デプロイは完了しています"
    fi
    
    # 完了処理
    local total_duration=$(end_workflow_timer)
    
    # 古いバックアップのクリーンアップ
    if [[ "$BACKUP_ENABLED" == "true" ]]; then
        cleanup_old_backups
    fi
    
    log_success "ワンコマンドデプロイメントが完了しました！"
    
    # 実行時間統計を表示
    show_time_statistics
    
    # 完了サマリーを表示
    show_deployment_summary
}

# デプロイメント完了サマリーを表示
show_deployment_summary() {
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎉 ワンコマンドデプロイメント完了"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    echo "実行されたワークフロー:"
    echo "✅ 環境確認と仮想環境有効化"
    
    if [[ "$BACKUP_ENABLED" == "true" ]]; then
        echo "✅ 既存データのバックアップ作成"
        if [[ -n "$CURRENT_BACKUP_DIR" ]] && [[ -d "$CURRENT_BACKUP_DIR" ]]; then
            echo "   📁 バックアップ場所: $(basename "$CURRENT_BACKUP_DIR")"
        fi
    fi
    
    if [[ "$SKIP_DATA_COLLECTION" != "true" ]]; then
        echo "✅ データ収集（記事取得・要約・コピー）"
    else
        echo "⏭️  データ収集（スキップ）"
    fi
    
    echo "✅ デプロイ前検証"
    echo "✅ Vercelデプロイメント ($DEPLOY_ENV 環境)"
    echo
    
    if [[ "$DEPLOY_ENV" == "prod" ]]; then
        echo "🌐 本番サイトが更新されました"
        if [[ -n "$DEPLOYED_URL" ]]; then
            echo "   🔗 URL: $DEPLOYED_URL"
        fi
    else
        echo "🔍 プレビュー環境にデプロイされました"
        if [[ -n "$DEPLOYED_URL" ]]; then
            echo "   🔗 URL: $DEPLOYED_URL"
        fi
    fi
    
    echo
    echo "次のステップ:"
    echo "1. デプロイされたサイトにアクセスして動作確認"
    echo "2. データの更新状況を確認"
    
    if [[ "$DEPLOY_ENV" == "preview" ]]; then
        echo "3. 問題がなければ本番環境にデプロイ:"
        echo "   $0 --prod --skip-data"
    fi
    
    if [[ "$BACKUP_ENABLED" == "true" ]] && [[ -n "$CURRENT_BACKUP_DIR" ]]; then
        echo
        echo "バックアップ情報:"
        echo "📁 バックアップID: $(basename "$CURRENT_BACKUP_DIR")"
        echo "📁 復元方法: $0 --restore $(basename "$CURRENT_BACKUP_DIR")"
        echo "📁 バックアップ一覧: $0 --list-backups"
    fi
    
    echo
    echo "ログファイル: $LOG_FILE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# バックアップ機能の実装

# バックアップディレクトリを作成
create_backup_directory() {
    CURRENT_BACKUP_DIR="$BACKUP_DIR/deploy-$BACKUP_TIMESTAMP"
    BACKUP_MANIFEST_FILE="$CURRENT_BACKUP_DIR/backup_manifest.json"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        mkdir -p "$BACKUP_DIR"
        log_info "バックアップディレクトリを作成しました: $BACKUP_DIR"
    fi
    
    mkdir -p "$CURRENT_BACKUP_DIR"
    log_info "バックアップを作成中: $CURRENT_BACKUP_DIR"
    
    # バックアップマニフェストを初期化
    cat > "$BACKUP_MANIFEST_FILE" << EOF
{
  "backup_id": "deploy-$BACKUP_TIMESTAMP",
  "created_at": "$(date -Iseconds)",
  "deploy_env": "$DEPLOY_ENV",
  "workflow_type": "full_deploy",
  "backed_up_items": [],
  "total_size": 0,
  "status": "in_progress"
}
EOF
}

# データファイルをバックアップ
backup_data_files() {
    if [[ "$BACKUP_ENABLED" != "true" ]]; then
        log_debug "バックアップはスキップされました"
        return 0
    fi
    
    log_info "データファイルのバックアップを作成中..."
    
    local data_dir="frontend/public/data"
    local backup_data_dir="$CURRENT_BACKUP_DIR/data"
    local backed_up_items=()
    local total_size=0
    
    if [[ ! -d "$data_dir" ]]; then
        log_warn "バックアップ対象のデータディレクトリが存在しません: $data_dir"
        return 0
    fi
    
    # データディレクトリをバックアップ
    mkdir -p "$backup_data_dir"
    
    # 各データタイプを個別にバックアップ
    local data_types=("news" "summaries" "config" "metrics" "dashboard")
    
    for data_type in "${data_types[@]}"; do
        local source_dir="$data_dir/$data_type"
        local backup_subdir="$backup_data_dir/$data_type"
        
        if [[ -d "$source_dir" ]]; then
            log_debug "バックアップ中: $data_type"
            
            # ディレクトリをコピー
            if cp -r "$source_dir" "$backup_subdir" 2>/dev/null; then
                local dir_size=$(du -sb "$backup_subdir" 2>/dev/null | cut -f1 || echo "0")
                local file_count=$(find "$backup_subdir" -type f | wc -l)
                
                backed_up_items+=("$data_type:$file_count files:$dir_size bytes")
                total_size=$((total_size + dir_size))
                
                log_debug "  $data_type: $file_count ファイル ($(numfmt --to=iec $dir_size))"
            else
                log_warn "  $data_type のバックアップに失敗しました"
            fi
        else
            log_debug "  $data_type ディレクトリが存在しません"
        fi
    done
    
    # 設定ファイルもバックアップ
    local config_files=(".env" "vercel.json" "frontend/next.config.js" "frontend/package.json")
    local backup_config_dir="$CURRENT_BACKUP_DIR/config"
    mkdir -p "$backup_config_dir"
    
    for config_file in "${config_files[@]}"; do
        if [[ -f "$config_file" ]]; then
            local backup_file="$backup_config_dir/$(basename "$config_file")"
            if cp "$config_file" "$backup_file" 2>/dev/null; then
                local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo "0")
                backed_up_items+=("config/$(basename "$config_file"):$file_size bytes")
                total_size=$((total_size + file_size))
                log_debug "設定ファイルをバックアップ: $(basename "$config_file")"
            fi
        fi
    done
    
    # バックアップマニフェストを更新
    python3 -c "
import json
import sys

try:
    with open('$BACKUP_MANIFEST_FILE', 'r') as f:
        manifest = json.load(f)
    
    manifest['backed_up_items'] = [$(printf '"%s",' "${backed_up_items[@]}" | sed 's/,$//')]
    manifest['total_size'] = $total_size
    manifest['status'] = 'completed'
    manifest['data_backup_completed_at'] = '$(date -Iseconds)'
    
    with open('$BACKUP_MANIFEST_FILE', 'w') as f:
        json.dump(manifest, f, indent=2)
        
except Exception as e:
    print(f'Error updating backup manifest: {e}', file=sys.stderr)
    sys.exit(1)
"
    
    if [[ ${#backed_up_items[@]} -gt 0 ]]; then
        log_success "データファイルのバックアップが完了しました"
        log_info "バックアップサイズ: $(numfmt --to=iec $total_size)"
        log_info "バックアップ場所: $CURRENT_BACKUP_DIR"
    else
        log_warn "バックアップするデータが見つかりませんでした"
    fi
    
    return 0
}

# バックアップからデータを復元
restore_from_backup() {
    local backup_id="$1"
    
    if [[ -z "$backup_id" ]]; then
        log_error "バックアップIDが指定されていません"
        return 1
    fi
    
    local restore_backup_dir="$BACKUP_DIR/$backup_id"
    local restore_manifest_file="$restore_backup_dir/backup_manifest.json"
    
    if [[ ! -d "$restore_backup_dir" ]]; then
        log_error "指定されたバックアップが見つかりません: $backup_id"
        list_available_backups
        return 1
    fi
    
    if [[ ! -f "$restore_manifest_file" ]]; then
        log_error "バックアップマニフェストが見つかりません: $restore_manifest_file"
        return 1
    fi
    
    log_info "バックアップから復元中: $backup_id"
    
    # バックアップ情報を表示
    local backup_info=$(python3 -c "
import json
try:
    with open('$restore_manifest_file', 'r') as f:
        manifest = json.load(f)
    print(f\"作成日時: {manifest.get('created_at', 'N/A')}\")
    print(f\"環境: {manifest.get('deploy_env', 'N/A')}\")
    print(f\"サイズ: {manifest.get('total_size', 0)} bytes\")
    print(f\"ステータス: {manifest.get('status', 'N/A')}\")
except Exception as e:
    print(f'Error reading backup manifest: {e}')
")
    
    echo "$backup_info"
    
    # 確認プロンプト
    echo
    while true; do
        read -p "このバックアップから復元しますか？ (yes/no): " yn
        case $yn in
            [Yy]es|[Yy]|はい|y)
                break
                ;;
            [Nn]o|[Nn]|いいえ|n)
                log_info "復元をキャンセルしました"
                return 0
                ;;
            *)
                echo "yes または no で回答してください"
                ;;
        esac
    done
    
    # 現在のデータをバックアップ（復元前）
    log_info "復元前に現在のデータをバックアップ中..."
    local pre_restore_backup_dir="$BACKUP_DIR/pre-restore-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$pre_restore_backup_dir"
    
    if [[ -d "frontend/public/data" ]]; then
        cp -r "frontend/public/data" "$pre_restore_backup_dir/" 2>/dev/null || true
        log_info "復元前バックアップ: $pre_restore_backup_dir"
    fi
    
    # データを復元
    local restore_data_dir="$restore_backup_dir/data"
    local target_data_dir="frontend/public/data"
    
    if [[ -d "$restore_data_dir" ]]; then
        # 既存のデータディレクトリを削除
        if [[ -d "$target_data_dir" ]]; then
            rm -rf "$target_data_dir"
        fi
        
        # バックアップからデータを復元
        mkdir -p "$(dirname "$target_data_dir")"
        if cp -r "$restore_data_dir" "$target_data_dir"; then
            log_success "データファイルの復元が完了しました"
        else
            log_error "データファイルの復元に失敗しました"
            return 1
        fi
    else
        log_warn "復元するデータファイルが見つかりません"
    fi
    
    # 設定ファイルを復元
    local restore_config_dir="$restore_backup_dir/config"
    if [[ -d "$restore_config_dir" ]]; then
        log_info "設定ファイルを復元中..."
        
        # 設定ファイルの復元（慎重に）
        local config_files=("vercel.json" "next.config.js" "package.json")
        for config_file in "${config_files[@]}"; do
            local backup_config_file="$restore_config_dir/$config_file"
            if [[ -f "$backup_config_file" ]]; then
                local target_config_file=""
                case "$config_file" in
                    "next.config.js"|"package.json")
                        target_config_file="frontend/$config_file"
                        ;;
                    *)
                        target_config_file="$config_file"
                        ;;
                esac
                
                if [[ -n "$target_config_file" ]]; then
                    cp "$backup_config_file" "$target_config_file" 2>/dev/null && \
                        log_debug "復元: $config_file" || \
                        log_warn "復元失敗: $config_file"
                fi
            fi
        done
    fi
    
    log_success "バックアップからの復元が完了しました"
    return 0
}

# 利用可能なバックアップを一覧表示
list_available_backups() {
    log_info "利用可能なバックアップ:"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_info "  バックアップディレクトリが存在しません: $BACKUP_DIR"
        return 0
    fi
    
    local backup_count=0
    
    for backup_dir in "$BACKUP_DIR"/deploy-*; do
        if [[ -d "$backup_dir" ]]; then
            local backup_id=$(basename "$backup_dir")
            local manifest_file="$backup_dir/backup_manifest.json"
            
            if [[ -f "$manifest_file" ]]; then
                local backup_info=$(python3 -c "
import json
try:
    with open('$manifest_file', 'r') as f:
        manifest = json.load(f)
    created_at = manifest.get('created_at', 'N/A')
    deploy_env = manifest.get('deploy_env', 'N/A')
    total_size = manifest.get('total_size', 0)
    status = manifest.get('status', 'N/A')
    
    # サイズを人間が読める形式に変換
    if total_size > 0:
        if total_size >= 1024*1024*1024:
            size_str = f'{total_size/(1024*1024*1024):.1f}GB'
        elif total_size >= 1024*1024:
            size_str = f'{total_size/(1024*1024):.1f}MB'
        elif total_size >= 1024:
            size_str = f'{total_size/1024:.1f}KB'
        else:
            size_str = f'{total_size}B'
    else:
        size_str = 'N/A'
    
    print(f'  {backup_id}')
    print(f'    作成日時: {created_at}')
    print(f'    環境: {deploy_env}')
    print(f'    サイズ: {size_str}')
    print(f'    ステータス: {status}')
    print()
except Exception as e:
    print(f'  {backup_id} (マニフェスト読み込みエラー)')
    print()
")
                echo "$backup_info"
                ((backup_count++))
            else
                echo "  $backup_id (マニフェストなし)"
                ((backup_count++))
            fi
        fi
    done
    
    if [[ $backup_count -eq 0 ]]; then
        log_info "  利用可能なバックアップがありません"
    else
        log_info "合計 $backup_count 個のバックアップが利用可能です"
        echo
        echo "復元方法: $0 --restore <backup_id>"
    fi
}

# 古いバックアップを自動削除
cleanup_old_backups() {
    local max_backups=10  # 保持する最大バックアップ数
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        return 0
    fi
    
    log_debug "古いバックアップのクリーンアップを実行中..."
    
    # バックアップディレクトリを日付順でソート
    local backup_dirs=($(find "$BACKUP_DIR" -maxdepth 1 -type d -name "deploy-*" | sort -r))
    local backup_count=${#backup_dirs[@]}
    
    if [[ $backup_count -gt $max_backups ]]; then
        log_info "古いバックアップを削除中（$backup_count > $max_backups）..."
        
        # 古いバックアップを削除
        for ((i=max_backups; i<backup_count; i++)); do
            local old_backup="${backup_dirs[$i]}"
            local backup_id=$(basename "$old_backup")
            
            log_debug "削除: $backup_id"
            rm -rf "$old_backup"
        done
        
        local deleted_count=$((backup_count - max_backups))
        log_info "$deleted_count 個の古いバックアップを削除しました"
    fi
}

# エラー時のクリーンアップ
cleanup() {
    local exit_code=$?
    
    if [[ $exit_code -ne 0 ]]; then
        log_error "ワンコマンドデプロイメントがエラーで終了しました（終了コード: $exit_code）"
        show_interrupted_time
        
        echo
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "❌ デプロイメント失敗"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo
        echo "トラブルシューティング:"
        echo "1. ログファイルを確認: $LOG_FILE"
        echo "2. 個別のスクリプトを実行して問題を特定:"
        echo "   - データ準備のみ: ./scripts/deploy/deploy-data-only.sh --verbose"
        echo "   - Vercelデプロイのみ: ./scripts/deploy/deploy-vercel.sh --check"
        echo "3. 環境設定を確認:"
        echo "   - 仮想環境: source venv/bin/activate"
        echo "   - 依存関係: pip install -r requirements.txt"
        echo "   - Vercel CLI: vercel --version"
        
        if [[ "$BACKUP_ENABLED" == "true" ]] && [[ -n "$CURRENT_BACKUP_DIR" ]] && [[ -d "$CURRENT_BACKUP_DIR" ]]; then
            echo "4. バックアップから復元:"
            echo "   $0 --restore $(basename "$CURRENT_BACKUP_DIR")"
        fi
        
        echo
    fi
    
    # 一時ファイルのクリーンアップ
    if [[ -f "$WORKFLOW_DATA_FILE" ]]; then
        rm -f "$WORKFLOW_DATA_FILE"
    fi
    
    cleanup_environment
    
    exit $exit_code
}

# シグナルハンドラーを設定
trap cleanup EXIT INT TERM

# メイン処理を実行
main "$@"