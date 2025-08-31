#!/bin/bash
# AI News Aggregator Docker起動スクリプト

set -e

# 色付きメッセージ用の関数
print_info() {
    echo -e "\033[1;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

print_warning() {
    echo -e "\033[1;33m[WARNING]\033[0m $1"
}

print_error() {
    echo -e "\033[1;31m[ERROR]\033[0m $1"
}

# 使用方法の表示
show_usage() {
    echo "使用方法: $0 [オプション]"
    echo ""
    echo "オプション:"
    echo "  -e, --env ENV        環境を指定 (dev|prod) [デフォルト: dev]"
    echo "  -p, --profile PROFILE プロファイルを指定 [デフォルト: dev]"
    echo "  -b, --build          強制的にイメージを再ビルド"
    echo "  -d, --detach         バックグラウンドで実行"
    echo "  -s, --secrets        Docker Secretsを使用"
    echo "  -v, --validate       環境変数の検証のみ実行"
    echo "  -h, --help           このヘルプを表示"
    echo ""
    echo "例:"
    echo "  $0 --env dev --build    # 開発環境でビルドして起動"
    echo "  $0 --env prod --detach  # 本番環境でバックグラウンド起動"
    echo "  $0 --validate           # 環境変数の検証のみ"
}

# デフォルト値
ENVIRONMENT="dev"
PROFILE="dev"
BUILD_FLAG=""
DETACH_FLAG=""
USE_SECRETS=false
VALIDATE_ONLY=false

# コマンドライン引数の解析
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -p|--profile)
            PROFILE="$2"
            shift 2
            ;;
        -b|--build)
            BUILD_FLAG="--build"
            shift
            ;;
        -d|--detach)
            DETACH_FLAG="-d"
            shift
            ;;
        -s|--secrets)
            USE_SECRETS=true
            shift
            ;;
        -v|--validate)
            VALIDATE_ONLY=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "不明なオプション: $1"
            show_usage
            exit 1
            ;;
    esac
done

# 環境の検証
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    print_error "環境は 'dev' または 'prod' を指定してください"
    exit 1
fi

print_info "AI News Aggregator Docker起動スクリプト"
print_info "環境: $ENVIRONMENT"
print_info "プロファイル: $PROFILE"

# 環境変数の検証
print_info "環境変数の検証を実行中..."
if python3 scripts/validate_env.py; then
    print_success "環境変数の検証が完了しました"
else
    print_error "環境変数の検証に失敗しました"
    exit 1
fi

# 検証のみの場合はここで終了
if [[ "$VALIDATE_ONLY" == true ]]; then
    print_success "検証が完了しました"
    exit 0
fi

# Docker Composeファイルの構築
COMPOSE_FILES="-f docker-compose.yml"

if [[ "$ENVIRONMENT" == "prod" ]]; then
    COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.prod.yml"
    PROFILE="prod"
fi

if [[ "$USE_SECRETS" == true ]]; then
    COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.secrets.yml"
    print_info "Docker Secretsを使用します"
fi

# 必要なディレクトリの作成
print_info "必要なディレクトリを作成中..."
mkdir -p logs
mkdir -p frontend/public/data
mkdir -p nginx/ssl

# Docker Composeの実行
print_info "Docker Composeを起動中..."
COMPOSE_COMMAND="docker compose $COMPOSE_FILES --profile $PROFILE up $BUILD_FLAG $DETACH_FLAG"

print_info "実行コマンド: $COMPOSE_COMMAND"

if eval $COMPOSE_COMMAND; then
    if [[ "$DETACH_FLAG" == "-d" ]]; then
        print_success "Docker Composeがバックグラウンドで起動しました"
        print_info "ログを確認: docker compose logs -f"
        print_info "停止: docker compose down"
    else
        print_success "Docker Composeが正常に終了しました"
    fi
else
    print_error "Docker Composeの起動に失敗しました"
    exit 1
fi

# 起動後の確認（バックグラウンド実行の場合）
if [[ "$DETACH_FLAG" == "-d" ]]; then
    print_info "サービスの起動状況を確認中..."
    sleep 5
    
    if docker compose ps | grep -q "Up"; then
        print_success "サービスが正常に起動しています"
        
        # アクセス情報の表示
        if [[ "$ENVIRONMENT" == "dev" ]]; then
            print_info "開発サーバーアクセス: http://localhost:3000"
        else
            print_info "本番サーバーアクセス: http://localhost"
        fi
        
        print_info "ヘルスチェック: curl http://localhost/health"
    else
        print_warning "一部のサービスが起動していない可能性があります"
        print_info "詳細確認: docker compose ps"
    fi
fi