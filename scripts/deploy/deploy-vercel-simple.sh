#!/bin/bash

# 簡素化されたVercelデプロイメントスクリプト
# AI News Aggregator - Simple Vercel Deployment Script

set -e

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# デフォルト設定
DEPLOY_TYPE="preview"
BUILD_ONLY=false
CHECK_ONLY=false

# カラー出力用の定数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

# ヘルプ表示
show_help() {
    cat << EOF
AI News Aggregator - Vercelデプロイメントスクリプト（簡素版）

使用方法:
    $0 [オプション]

オプション:
    --env <環境>        デプロイ環境を指定 (preview または prod)
    --prod, -p          本番環境にデプロイ (--env prod と同等)
    --preview, -pr      プレビュー環境にデプロイ (--env preview と同等、デフォルト)
    --build-only, -b    ビルドのみ実行（デプロイしない）
    --check, -c         デプロイ前チェックのみ実行
    --help, -h          このヘルプを表示

例:
    $0 --env prod       # 本番環境にデプロイ
    $0 --prod           # 本番環境にデプロイ（短縮形）
    $0 --env preview    # プレビュー環境にデプロイ
    $0 --preview        # プレビュー環境にデプロイ（短縮形）
    $0 --build-only     # ビルドのみ実行
    $0 --check          # デプロイ前チェック

注意:
    本番環境へのデプロイ時は確認プロンプトが表示されます

EOF
}

# 環境検証
validate_deploy_environment() {
    case "$DEPLOY_TYPE" in
        "preview"|"prod")
            return 0
            ;;
        *)
            log_error "無効な環境が指定されました: $DEPLOY_TYPE"
            log_error "有効な環境: preview, prod"
            return 1
            ;;
    esac
}

# 本番環境への確認プロンプト
confirm_production_deploy() {
    if [[ "$DEPLOY_TYPE" == "prod" ]]; then
        log_warning "本番環境へのデプロイを実行しようとしています"
        log_warning "この操作により、本番サイトが更新されます"
        echo ""
        
        # 対話的な確認プロンプト
        while true; do
            read -p "本番環境にデプロイしますか？ (yes/no): " yn
            case $yn in
                [Yy]es|[Yy]|はい|y)
                    log_info "本番環境へのデプロイを続行します"
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

# 前提条件チェック
check_prerequisites() {
    log_info "前提条件をチェック中..."
    
    # Vercel CLIの確認
    if ! command -v vercel >/dev/null 2>&1; then
        log_error "Vercel CLIがインストールされていません"
        log_error "インストール方法: npm install -g vercel"
        return 1
    fi
    
    log_info "Vercel CLI: $(vercel --version)"
    
    # フロントエンドディレクトリの確認
    if [[ ! -d "$PROJECT_ROOT/frontend" ]]; then
        log_error "フロントエンドディレクトリが見つかりません: $PROJECT_ROOT/frontend"
        return 1
    fi
    
    # package.jsonの確認
    if [[ ! -f "$PROJECT_ROOT/frontend/package.json" ]]; then
        log_error "package.jsonが見つかりません: $PROJECT_ROOT/frontend/package.json"
        return 1
    fi
    
    # データファイルの確認
    if [[ ! -f "$PROJECT_ROOT/frontend/public/data/news/latest.json" ]]; then
        log_warning "latest.jsonが見つかりません。データ収集を先に実行してください。"
        log_warning "実行方法: make deploy-data"
    fi
    
    log_success "前提条件チェック完了"
    return 0
}

# フロントエンドビルド
build_frontend() {
    log_info "フロントエンドをビルド中..."
    
    cd "$PROJECT_ROOT/frontend"
    
    # 依存関係のインストール
    if [[ ! -d "node_modules" ]]; then
        log_info "依存関係をインストール中..."
        npm ci
    fi
    
    # ビルド実行
    log_info "Next.jsアプリケーションをビルド中..."
    npm run build
    
    log_success "フロントエンドビルド完了"
    cd "$PROJECT_ROOT"
}

# Vercelデプロイ
deploy_to_vercel() {
    log_info "Vercelにデプロイ中..."
    
    cd "$PROJECT_ROOT/frontend"
    
    # デプロイコマンドの構築
    local deploy_cmd="vercel"
    
    if [[ "$DEPLOY_TYPE" == "prod" ]]; then
        deploy_cmd="$deploy_cmd --prod"
        log_info "本番環境にデプロイ中..."
    else
        log_info "プレビュー環境にデプロイ中..."
    fi
    
    # 非対話モードで実行
    deploy_cmd="$deploy_cmd --yes"
    
    # デプロイ実行
    log_info "実行コマンド: $deploy_cmd"
    
    if $deploy_cmd; then
        log_success "Vercelデプロイが完了しました"
        
        # デプロイされたURLを取得して表示
        local deployed_url=$(vercel ls 2>/dev/null | grep -E "(ai-news-aggregator|news-aggregator)" | head -1 | awk '{print $2}' || echo "")
        if [[ -n "$deployed_url" ]]; then
            log_success "デプロイされたURL: https://$deployed_url"
        fi
    else
        log_error "Vercelデプロイに失敗しました"
        cd "$PROJECT_ROOT"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
    return 0
}

# 引数解析
while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            if [[ -n "$2" ]] && [[ "$2" != --* ]]; then
                DEPLOY_TYPE="$2"
                shift 2
            else
                log_error "--env オプションには環境を指定してください (preview または prod)"
                exit 1
            fi
            ;;
        --prod|-p)
            DEPLOY_TYPE="prod"
            shift
            ;;
        --preview|-pr)
            DEPLOY_TYPE="preview"
            shift
            ;;
        --build-only|-b)
            BUILD_ONLY=true
            shift
            ;;
        --check|-c)
            CHECK_ONLY=true
            shift
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

# メイン処理
main() {
    log_info "Vercelデプロイメントを開始します"
    log_info "デプロイ環境: $DEPLOY_TYPE"
    
    # 環境検証
    if ! validate_deploy_environment; then
        exit 1
    fi
    
    # 前提条件チェック
    if ! check_prerequisites; then
        exit 1
    fi
    
    # チェックのみの場合はここで終了
    if [[ "$CHECK_ONLY" == "true" ]]; then
        log_success "デプロイ前チェックが完了しました"
        exit 0
    fi
    
    # 本番環境への確認プロンプト
    confirm_production_deploy
    
    # フロントエンドビルド
    if ! build_frontend; then
        log_error "フロントエンドビルドに失敗しました"
        exit 1
    fi
    
    # ビルドのみの場合はここで終了
    if [[ "$BUILD_ONLY" == "true" ]]; then
        log_success "ビルドが完了しました"
        exit 0
    fi
    
    # Vercelデプロイ
    if ! deploy_to_vercel; then
        log_error "Vercelデプロイに失敗しました"
        exit 1
    fi
    
    log_success "Vercelデプロイメントが完了しました！"
}

# メイン処理を実行
main "$@"