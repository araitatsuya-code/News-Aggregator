#!/bin/bash
# AI News Aggregator Docker クリーンアップスクリプト

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
    echo "  -a, --all            全てのリソースを削除（イメージ、ボリューム含む）"
    echo "  -v, --volumes        ボリュームも削除"
    echo "  -i, --images         イメージも削除"
    echo "  -n, --networks       ネットワークも削除"
    echo "  -l, --logs           ログファイルも削除"
    echo "  -f, --force          確認なしで実行"
    echo "  -h, --help           このヘルプを表示"
    echo ""
    echo "例:"
    echo "  $0                   # コンテナのみ停止・削除"
    echo "  $0 --all             # 全リソース削除"
    echo "  $0 --volumes --logs  # ボリュームとログも削除"
}

# デフォルト値
REMOVE_ALL=false
REMOVE_VOLUMES=false
REMOVE_IMAGES=false
REMOVE_NETWORKS=false
REMOVE_LOGS=false
FORCE=false

# コマンドライン引数の解析
while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--all)
            REMOVE_ALL=true
            REMOVE_VOLUMES=true
            REMOVE_IMAGES=true
            REMOVE_NETWORKS=true
            shift
            ;;
        -v|--volumes)
            REMOVE_VOLUMES=true
            shift
            ;;
        -i|--images)
            REMOVE_IMAGES=true
            shift
            ;;
        -n|--networks)
            REMOVE_NETWORKS=true
            shift
            ;;
        -l|--logs)
            REMOVE_LOGS=true
            shift
            ;;
        -f|--force)
            FORCE=true
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

print_info "AI News Aggregator Docker クリーンアップスクリプト"

# 確認メッセージ
if [[ "$FORCE" != true ]]; then
    echo ""
    print_warning "以下の操作を実行します:"
    echo "  - コンテナの停止・削除"
    
    if [[ "$REMOVE_VOLUMES" == true ]]; then
        echo "  - ボリュームの削除"
    fi
    
    if [[ "$REMOVE_IMAGES" == true ]]; then
        echo "  - イメージの削除"
    fi
    
    if [[ "$REMOVE_NETWORKS" == true ]]; then
        echo "  - ネットワークの削除"
    fi
    
    if [[ "$REMOVE_LOGS" == true ]]; then
        echo "  - ログファイルの削除"
    fi
    
    echo ""
    read -p "続行しますか？ (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "キャンセルしました"
        exit 0
    fi
fi

# Docker Composeサービスの停止
print_info "Docker Composeサービスを停止中..."
if docker compose down 2>/dev/null; then
    print_success "サービスを停止しました"
else
    print_warning "一部のサービスが既に停止している可能性があります"
fi

# 追加のCompose設定ファイルも停止
for compose_file in docker-compose.prod.yml docker-compose.secrets.yml; do
    if [[ -f "$compose_file" ]]; then
        print_info "$compose_file のサービスを停止中..."
        docker compose -f docker-compose.yml -f "$compose_file" down 2>/dev/null || true
    fi
done

# AI News Aggregator関連のコンテナを個別に停止・削除
print_info "AI News Aggregator関連のコンテナを削除中..."
CONTAINERS=$(docker ps -aq --filter "name=ai-news" 2>/dev/null || true)
if [[ -n "$CONTAINERS" ]]; then
    docker stop $CONTAINERS 2>/dev/null || true
    docker rm $CONTAINERS 2>/dev/null || true
    print_success "コンテナを削除しました"
else
    print_info "削除対象のコンテナが見つかりませんでした"
fi

# ボリュームの削除
if [[ "$REMOVE_VOLUMES" == true ]]; then
    print_info "ボリュームを削除中..."
    
    # Docker Composeボリューム
    docker compose down -v 2>/dev/null || true
    
    # 個別ボリューム
    VOLUMES=$(docker volume ls -q --filter "name=ai-news" 2>/dev/null || true)
    if [[ -n "$VOLUMES" ]]; then
        docker volume rm $VOLUMES 2>/dev/null || true
        print_success "ボリュームを削除しました"
    else
        print_info "削除対象のボリュームが見つかりませんでした"
    fi
fi

# イメージの削除
if [[ "$REMOVE_IMAGES" == true ]]; then
    print_info "イメージを削除中..."
    
    # AI News Aggregator関連のイメージ
    IMAGES=$(docker images -q --filter "reference=*ai-news*" --filter "reference=*news-aggregator*" 2>/dev/null || true)
    if [[ -n "$IMAGES" ]]; then
        docker rmi $IMAGES 2>/dev/null || true
        print_success "イメージを削除しました"
    else
        print_info "削除対象のイメージが見つかりませんでした"
    fi
    
    # 未使用イメージのクリーンアップ
    print_info "未使用イメージをクリーンアップ中..."
    docker image prune -f 2>/dev/null || true
fi

# ネットワークの削除
if [[ "$REMOVE_NETWORKS" == true ]]; then
    print_info "ネットワークを削除中..."
    
    NETWORKS=$(docker network ls -q --filter "name=ai-news" 2>/dev/null || true)
    if [[ -n "$NETWORKS" ]]; then
        docker network rm $NETWORKS 2>/dev/null || true
        print_success "ネットワークを削除しました"
    else
        print_info "削除対象のネットワークが見つかりませんでした"
    fi
    
    # 未使用ネットワークのクリーンアップ
    print_info "未使用ネットワークをクリーンアップ中..."
    docker network prune -f 2>/dev/null || true
fi

# ログファイルの削除
if [[ "$REMOVE_LOGS" == true ]]; then
    print_info "ログファイルを削除中..."
    
    if [[ -d "logs" ]]; then
        rm -rf logs/*
        print_success "ログファイルを削除しました"
    else
        print_info "ログディレクトリが見つかりませんでした"
    fi
    
    # Nginxログの削除
    if [[ -d "nginx/logs" ]]; then
        rm -rf nginx/logs/*
        print_success "Nginxログファイルを削除しました"
    fi
fi

# システム全体のクリーンアップ（オプション）
if [[ "$REMOVE_ALL" == true ]]; then
    print_info "Dockerシステム全体をクリーンアップ中..."
    docker system prune -f 2>/dev/null || true
    print_success "システムクリーンアップが完了しました"
fi

print_success "クリーンアップが完了しました！"

# 残存リソースの確認
print_info "残存リソースの確認:"
echo "コンテナ数: $(docker ps -aq | wc -l)"
echo "イメージ数: $(docker images -q | wc -l)"
echo "ボリューム数: $(docker volume ls -q | wc -l)"
echo "ネットワーク数: $(docker network ls -q | wc -l)"

print_info "再起動する場合: ./scripts/docker/docker-start.sh"