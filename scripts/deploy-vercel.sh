#!/bin/bash

# Vercelデプロイメントスクリプト
# AI News Aggregator - Vercel Deployment Script

set -e

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
AI News Aggregator - Vercelデプロイメントスクリプト

使用方法:
    $0 [オプション]

オプション:
    --prod, -p          本番環境にデプロイ
    --preview, -pr      プレビュー環境にデプロイ（デフォルト）
    --build-only, -b    ビルドのみ実行（デプロイしない）
    --check, -c         デプロイ前チェックのみ実行
    --help, -h          このヘルプを表示

例:
    $0 --prod           # 本番環境にデプロイ
    $0 --preview        # プレビュー環境にデプロイ
    $0 --build-only     # ビルドのみ実行
    $0 --check          # デプロイ前チェック

EOF
}

# デフォルト設定
DEPLOY_TYPE="preview"
BUILD_ONLY=false
CHECK_ONLY=false

# 引数解析
while [[ $# -gt 0 ]]; do
    case $1 in
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

DATA_DIR="public/data"
if [[ -d "$DATA_DIR" ]]; then
    NEWS_FILES=$(find "$DATA_DIR/news" -name "*.json" 2>/dev/null | wc -l)
    SUMMARY_FILES=$(find "$DATA_DIR/summaries" -name "*.json" 2>/dev/null | wc -l)
    
    log_info "ニュースファイル数: $NEWS_FILES"
    log_info "サマリーファイル数: $SUMMARY_FILES"
    
    if [[ $NEWS_FILES -eq 0 ]]; then
        log_warning "ニュースデータファイルが見つかりません"
        log_warning "データ処理パイプラインを実行してからデプロイしてください"
    fi
else
    log_warning "データディレクトリが見つかりません: $DATA_DIR"
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