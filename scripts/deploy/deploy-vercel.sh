#!/bin/bash

# Vercelデプロイメントスクリプト
# AI News Aggregator - Vercel Deployment Script

set -e

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ユーティリティスクリプトを読み込み
source "$SCRIPT_DIR/utils/error-handler.sh"
source "$SCRIPT_DIR/utils/detailed-logger.sh"
source "$SCRIPT_DIR/utils/progress-logger.sh"

# カラー出力用の定数（後方互換性のため保持）
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数（後方互換性のため保持、内部的には統一ログシステムを使用）
log_info() {
    if command -v detailed_log_info >/dev/null 2>&1; then
        detailed_log_info "$1" "vercel"
    fi
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    if command -v detailed_log_info >/dev/null 2>&1; then
        detailed_log_info "$1" "vercel" "{\"level\":\"success\"}"
    fi
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    if command -v detailed_log_warn >/dev/null 2>&1; then
        detailed_log_warn "$1" "vercel"
    fi
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    if command -v detailed_log_error >/dev/null 2>&1; then
        detailed_log_error "$1" "vercel"
    fi
    echo -e "${RED}[ERROR]${NC} $1"
}

# ヘルプ表示
show_help() {
    cat << EOF
AI News Aggregator - Vercelデプロイメントスクリプト

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

# デフォルト設定
DEPLOY_TYPE="preview"
BUILD_ONLY=false
CHECK_ONLY=false

# 環境指定とプロンプト機能
validate_environment() {
    local env="$1"
    case "$env" in
        "preview"|"prod")
            return 0
            ;;
        *)
            log_error "無効な環境が指定されました: $env"
            log_error "有効な環境: preview, prod"
            return 1
            ;;
    esac
}

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

# 環境の検証
if ! validate_environment "$DEPLOY_TYPE"; then
    exit 1
fi

# 本番環境への確認プロンプト
confirm_production_deploy

# プロジェクトルートディレクトリの確認
if [[ ! -f "package.json" && ! -f "frontend/package.json" ]]; then
    log_error "プロジェクトルートディレクトリで実行してください"
    exit 1
fi

# フロントエンドディレクトリに移動
if [[ -d "frontend" ]]; then
    cd frontend
fi

log_info "AI News Aggregator Vercelデプロイメント開始"
log_info "デプロイタイプ: $DEPLOY_TYPE"

# 1. 依存関係の確認
log_info "依存関係を確認中..."

# Node.jsバージョン確認
if ! command -v node &> /dev/null; then
    log_error "Node.jsがインストールされていません"
    exit 1
fi

NODE_VERSION=$(node --version)
log_info "Node.js バージョン: $NODE_VERSION"

# npmバージョン確認
if ! command -v npm &> /dev/null; then
    log_error "npmがインストールされていません"
    exit 1
fi

NPM_VERSION=$(npm --version)
log_info "npm バージョン: $NPM_VERSION"

# Vercel CLIの確認
if ! command -v vercel &> /dev/null; then
    log_warning "Vercel CLIがインストールされていません。インストール中..."
    npm install -g vercel
    log_success "Vercel CLIをインストールしました"
fi

VERCEL_VERSION=$(vercel --version)
log_info "Vercel CLI バージョン: $VERCEL_VERSION"

# 2. プロジェクト設定の確認
log_info "プロジェクト設定を確認中..."

# package.jsonの存在確認
if [[ ! -f "package.json" ]]; then
    log_error "package.jsonが見つかりません"
    exit 1
fi

# next.config.jsの存在確認
if [[ ! -f "next.config.js" ]]; then
    log_error "next.config.jsが見つかりません"
    exit 1
fi

# vercel.jsonの存在確認（プロジェクトルート）
if [[ -f "../vercel.json" ]]; then
    log_info "vercel.json設定ファイルを確認しました"
else
    log_warning "vercel.json設定ファイルが見つかりません"
fi

# 3. データファイルの確認
log_info "データファイルを確認中..."

# データ存在確認機能
check_data_files() {
    local data_dir="public/data"
    local errors=0
    
    # データディレクトリの存在確認
    if [[ ! -d "$data_dir" ]]; then
        log_error "データディレクトリが見つかりません: $data_dir"
        log_error "対処法: scripts/core/main.py を実行してデータを生成してください"
        return 1
    fi
    
    # latest.jsonファイルの存在と有効性確認
    local news_latest="$data_dir/news/latest.json"
    local summaries_latest="$data_dir/summaries/latest.json"
    
    log_info "重要なデータファイルを確認中..."
    
    # ニュースのlatest.jsonファイル確認
    if [[ ! -f "$news_latest" ]]; then
        log_error "ニュースのlatest.jsonファイルが見つかりません: $news_latest"
        ((errors++))
    else
        # JSONファイルの有効性確認
        if ! python3 -m json.tool "$news_latest" > /dev/null 2>&1; then
            log_error "ニュースのlatest.jsonファイルが無効なJSON形式です: $news_latest"
            ((errors++))
        else
            # ファイル内容の基本確認
            local news_count=$(python3 -c "import json; data=json.load(open('$news_latest')); print(len(data))" 2>/dev/null || echo "0")
            if [[ $news_count -eq 0 ]]; then
                log_error "ニュースのlatest.jsonファイルにデータが含まれていません"
                ((errors++))
            else
                log_info "ニュース記事数: $news_count"
            fi
        fi
    fi
    
    # サマリーのlatest.jsonファイル確認
    if [[ ! -f "$summaries_latest" ]]; then
        log_error "サマリーのlatest.jsonファイルが見つかりません: $summaries_latest"
        ((errors++))
    else
        # JSONファイルの有効性確認
        if ! python3 -m json.tool "$summaries_latest" > /dev/null 2>&1; then
            log_error "サマリーのlatest.jsonファイルが無効なJSON形式です: $summaries_latest"
            ((errors++))
        else
            # ファイル内容の基本確認
            local summary_date=$(python3 -c "import json; data=json.load(open('$summaries_latest')); print(data.get('date', 'N/A'))" 2>/dev/null || echo "N/A")
            local total_articles=$(python3 -c "import json; data=json.load(open('$summaries_latest')); print(data.get('total_articles', 0))" 2>/dev/null || echo "0")
            
            if [[ "$summary_date" == "N/A" ]] || [[ $total_articles -eq 0 ]]; then
                log_error "サマリーのlatest.jsonファイルに必要なデータが含まれていません"
                ((errors++))
            else
                log_info "サマリー日付: $summary_date"
                log_info "サマリー記事数: $total_articles"
            fi
        fi
    fi
    
    # 追加のデータファイル統計
    if [[ -d "$data_dir/news" ]]; then
        local news_files=$(find "$data_dir/news" -name "*.json" 2>/dev/null | wc -l)
        log_info "ニュースファイル総数: $news_files"
    fi
    
    if [[ -d "$data_dir/summaries" ]]; then
        local summary_files=$(find "$data_dir/summaries" -name "*.json" 2>/dev/null | wc -l)
        log_info "サマリーファイル総数: $summary_files"
    fi
    
    # エラーがある場合の対処法表示
    if [[ $errors -gt 0 ]]; then
        log_error ""
        log_error "データファイルに問題があります。以下の手順で解決してください:"
        log_error "1. 仮想環境を有効化: source venv/bin/activate"
        log_error "2. データ収集を実行: python3 scripts/core/main.py"
        log_error "3. データ準備スクリプトを使用: ./scripts/deploy/deploy-data-only.sh"
        log_error ""
        return 1
    fi
    
    log_success "すべてのデータファイルが正常に確認されました"
    return 0
}

# データファイル確認の実行
if ! check_data_files; then
    log_error "データファイルの確認に失敗しました"
    exit 1
fi

# チェックのみの場合はここで終了
if [[ "$CHECK_ONLY" == true ]]; then
    log_success "デプロイ前チェックが完了しました"
    exit 0
fi

# 4. 依存関係のインストール
log_info "依存関係をインストール中..."
npm ci --production=false

# 5. TypeScriptタイプチェック
log_info "TypeScriptタイプチェックを実行中..."
if ! npm run type-check; then
    log_error "TypeScriptタイプチェックに失敗しました"
    exit 1
fi

# 6. ESLintチェック
log_info "ESLintチェックを実行中..."
if ! npm run lint; then
    log_error "ESLintチェックに失敗しました"
    exit 1
fi

# 7. ビルド実行
log_info "プロジェクトをビルド中..."
if ! npm run build:vercel; then
    log_error "ビルドに失敗しました"
    exit 1
fi

log_success "ビルドが完了しました"

# ビルドのみの場合はここで終了
if [[ "$BUILD_ONLY" == true ]]; then
    log_success "ビルドが完了しました（デプロイはスキップ）"
    exit 0
fi

# 8. Vercelデプロイメント
log_info "Vercelにデプロイ中..."

# プロジェクトルートに戻る
cd ..

if [[ "$DEPLOY_TYPE" == "prod" ]]; then
    log_info "本番環境にデプロイしています..."
    vercel --prod --yes
    log_success "本番環境へのデプロイが完了しました"
else
    log_info "プレビュー環境にデプロイしています..."
    vercel --yes
    log_success "プレビュー環境へのデプロイが完了しました"
fi

# 9. デプロイ後の確認
log_info "デプロイ後の確認を実行中..."

# デプロイされたURLを取得
DEPLOYED_URL=$(vercel ls | grep "ai-news-aggregator" | head -1 | awk '{print $2}')

if [[ -n "$DEPLOYED_URL" ]]; then
    log_success "デプロイされたURL: https://$DEPLOYED_URL"
    
    # ヘルスチェック
    log_info "ヘルスチェックを実行中..."
    if curl -f -s "https://$DEPLOYED_URL" > /dev/null; then
        log_success "サイトが正常に動作しています"
    else
        log_warning "サイトへのアクセスに問題がある可能性があります"
    fi
else
    log_warning "デプロイされたURLを取得できませんでした"
fi

log_success "Vercelデプロイメントが完了しました！"

# 10. 次のステップの案内
cat << EOF

🎉 デプロイメント完了！

次のステップ:
1. デプロイされたサイトにアクセスして動作確認
2. カスタムドメインの設定（必要に応じて）
3. 環境変数の設定確認
4. データ更新の自動化設定

Vercelダッシュボード: https://vercel.com/dashboard
プロジェクト設定: https://vercel.com/dashboard/projects

EOF