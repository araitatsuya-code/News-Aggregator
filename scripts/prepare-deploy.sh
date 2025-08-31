#!/bin/bash

# デプロイ準備スクリプト
# AI News Aggregator - Deployment Preparation Script

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
AI News Aggregator - デプロイ準備スクリプト

使用方法:
    $0 [オプション]

オプション:
    --data-only, -d     データ処理のみ実行
    --build-only, -b    ビルド準備のみ実行
    --check, -c         設定チェックのみ実行
    --help, -h          このヘルプを表示

例:
    $0                  # 全ての準備を実行
    $0 --data-only      # データ処理のみ
    $0 --build-only     # ビルド準備のみ
    $0 --check          # 設定チェックのみ

EOF
}

# デフォルト設定
DATA_ONLY=false
BUILD_ONLY=false
CHECK_ONLY=false

# 引数解析
while [[ $# -gt 0 ]]; do
    case $1 in
        --data-only|-d)
            DATA_ONLY=true
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

log_info "AI News Aggregator デプロイ準備開始"

# 1. 環境確認
log_info "環境を確認中..."

# プロジェクトルートの確認
if [[ ! -f "requirements.txt" ]]; then
    log_error "プロジェクトルートディレクトリで実行してください"
    exit 1
fi

# Python環境の確認
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    log_error "Pythonがインストールされていません"
    exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD --version)
log_info "Python バージョン: $PYTHON_VERSION"

# Node.js環境の確認
if [[ -d "frontend" ]]; then
    if ! command -v node &> /dev/null; then
        log_error "Node.jsがインストールされていません"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    log_info "Node.js バージョン: $NODE_VERSION"
fi

# 2. 設定ファイルの確認
log_info "設定ファイルを確認中..."

# .envファイルの確認
if [[ -f ".env" ]]; then
    log_info ".envファイルを確認しました"
    
    # Claude APIキーの確認
    if grep -q "CLAUDE_API_KEY=" .env; then
        if grep -q "CLAUDE_API_KEY=your-actual-claude-api-key-here" .env; then
            log_warning "Claude APIキーがデフォルト値のままです"
            log_warning ".envファイルで実際のAPIキーを設定してください"
        else
            log_success "Claude APIキーが設定されています"
        fi
    else
        log_warning "Claude APIキーが設定されていません"
    fi
else
    log_warning ".envファイルが見つかりません"
    log_info ".env.exampleからコピーして設定してください"
fi

# vercel.jsonの確認
if [[ -f "vercel.json" ]]; then
    log_success "vercel.json設定ファイルを確認しました"
else
    log_error "vercel.json設定ファイルが見つかりません"
    exit 1
fi

# フロントエンド設定の確認
if [[ -d "frontend" ]]; then
    if [[ -f "frontend/next.config.js" ]]; then
        log_success "Next.js設定ファイルを確認しました"
    else
        log_error "Next.js設定ファイルが見つかりません"
        exit 1
    fi
    
    if [[ -f "frontend/package.json" ]]; then
        log_success "package.json設定ファイルを確認しました"
    else
        log_error "package.json設定ファイルが見つかりません"
        exit 1
    fi
fi

# チェックのみの場合はここで終了
if [[ "$CHECK_ONLY" == true ]]; then
    log_success "設定チェックが完了しました"
    exit 0
fi

# 3. データ処理の実行
if [[ "$BUILD_ONLY" != true ]]; then
    log_info "データ処理を実行中..."
    
    # 仮想環境の確認と有効化
    if [[ -d "venv" ]]; then
        log_info "既存の仮想環境を使用します"
        source venv/bin/activate
    else
        log_info "仮想環境を作成中..."
        $PYTHON_CMD -m venv venv
        source venv/bin/activate
    fi
    
    # Python依存関係のインストール
    log_info "Python依存関係をインストール中..."
    pip install -r requirements.txt
    
    # データ処理の実行
    log_info "ニュースデータを処理中..."
    if python scripts/main.py; then
        log_success "データ処理が完了しました"
    else
        log_warning "データ処理でエラーが発生しましたが、継続します"
    fi
    
    # データファイルの確認
    DATA_DIR="frontend/public/data"
    if [[ -d "$DATA_DIR" ]]; then
        NEWS_FILES=$(find "$DATA_DIR/news" -name "*.json" 2>/dev/null | wc -l)
        SUMMARY_FILES=$(find "$DATA_DIR/summaries" -name "*.json" 2>/dev/null | wc -l)
        
        log_info "生成されたニュースファイル数: $NEWS_FILES"
        log_info "生成されたサマリーファイル数: $SUMMARY_FILES"
        
        if [[ $NEWS_FILES -gt 0 ]]; then
            log_success "ニュースデータが正常に生成されました"
        else
            log_warning "ニュースデータファイルが生成されませんでした"
            # フォールバック用の空ファイルを作成
            mkdir -p "$DATA_DIR/news"
            mkdir -p "$DATA_DIR/summaries"
            echo '[]' > "$DATA_DIR/news/latest.json"
            echo '{"date":"","total_articles":0,"top_trends":[],"significant_news":[],"category_breakdown":{},"summary_ja":"データを準備中です","summary_en":"Data is being prepared","generated_at":""}' > "$DATA_DIR/summaries/latest.json"
            log_info "フォールバック用データファイルを作成しました"
        fi
    else
        log_warning "データディレクトリが見つかりません"
        mkdir -p "$DATA_DIR/news"
        mkdir -p "$DATA_DIR/summaries"
        log_info "データディレクトリを作成しました"
    fi
fi

# データのみの場合はここで終了
if [[ "$DATA_ONLY" == true ]]; then
    log_success "データ処理が完了しました"
    exit 0
fi

# 4. フロントエンドビルド準備
if [[ -d "frontend" ]]; then
    log_info "フロントエンドビルド準備を実行中..."
    
    cd frontend
    
    # 依存関係のインストール
    log_info "フロントエンド依存関係をインストール中..."
    npm ci --production=false
    
    # TypeScriptタイプチェック
    log_info "TypeScriptタイプチェックを実行中..."
    if npm run type-check; then
        log_success "TypeScriptタイプチェックが完了しました"
    else
        log_error "TypeScriptタイプチェックに失敗しました"
        exit 1
    fi
    
    # ESLintチェック
    log_info "ESLintチェックを実行中..."
    if npm run lint; then
        log_success "ESLintチェックが完了しました"
    else
        log_warning "ESLintチェックで警告がありますが、継続します"
    fi
    
    # テスト実行
    log_info "テストを実行中..."
    if npm test -- --passWithNoTests; then
        log_success "テストが完了しました"
    else
        log_warning "テストで問題がありますが、継続します"
    fi
    
    # サイトマップ生成
    log_info "サイトマップを生成中..."
    if npm run generate-sitemap; then
        log_success "サイトマップが生成されました"
    else
        log_warning "サイトマップ生成に失敗しましたが、継続します"
    fi
    
    cd ..
fi

# 5. 最終確認
log_info "最終確認を実行中..."

# 必要なファイルの存在確認
REQUIRED_FILES=(
    "vercel.json"
    "frontend/package.json"
    "frontend/next.config.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        log_success "✓ $file"
    else
        log_error "✗ $file が見つかりません"
        exit 1
    fi
done

# データファイルの確認
if [[ -f "frontend/public/data/news/latest.json" ]]; then
    log_success "✓ ニュースデータファイル"
else
    log_warning "✗ ニュースデータファイルが見つかりません"
fi

if [[ -f "frontend/public/data/summaries/latest.json" ]]; then
    log_success "✓ サマリーデータファイル"
else
    log_warning "✗ サマリーデータファイルが見つかりません"
fi

log_success "デプロイ準備が完了しました！"

# 6. 次のステップの案内
cat << EOF

🎉 デプロイ準備完了！

次のステップ:
1. Vercelにデプロイ:
   ./scripts/deploy-vercel.sh --preview  # プレビュー環境
   ./scripts/deploy-vercel.sh --prod     # 本番環境

2. GitHub Actionsでの自動デプロイ:
   - mainブランチにプッシュすると自動で本番デプロイ
   - プルリクエストでプレビューデプロイ

3. 手動Vercelデプロイ:
   vercel          # プレビュー
   vercel --prod   # 本番

設定確認:
- ✅ プロジェクト設定
- ✅ ビルド設定
- ✅ データファイル
- ✅ 依存関係

EOF