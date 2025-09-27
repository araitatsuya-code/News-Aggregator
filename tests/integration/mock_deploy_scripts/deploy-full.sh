#!/bin/bash

# モック版フルデプロイスクリプト - テスト用
# 実際のデプロイは行わず、テスト用の動作をシミュレート

set -e

# デフォルト設定
DEPLOY_ENV="preview"
SKIP_DATA_COLLECTION=false
VERBOSE_MODE=false

# 引数解析
while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            DEPLOY_ENV="$2"
            shift 2
            ;;
        --skip-data)
            SKIP_DATA_COLLECTION=true
            shift
            ;;
        --verbose)
            VERBOSE_MODE=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

echo "モック版フルデプロイを開始します..."
echo "環境: $DEPLOY_ENV"

if [ "$DEPLOY_ENV" = "prod" ]; then
    echo "本番環境へのデプロイを実行しますか？ (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "デプロイをキャンセルしました"
        exit 1
    fi
fi

if [ "$SKIP_DATA_COLLECTION" = "false" ]; then
    echo "データ収集を実行中..."
    sleep 1
    
    # モック版main.pyの実行
    if [ -f "scripts/core/main.py" ]; then
        python3 scripts/core/main.py
    else
        echo "main.pyが見つかりません。モックデータを作成します..."
        mkdir -p frontend/public/data/news
        echo '{"articles":[],"metadata":{"generated_at":"'$(date -Iseconds)'","total_articles":0}}' > frontend/public/data/news/latest.json
    fi
fi

echo "Vercelデプロイを実行中..."
sleep 1

# モック版Vercelデプロイの実行
if [ -f "scripts/deploy/deploy-vercel.sh" ]; then
    bash scripts/deploy/deploy-vercel.sh --env "$DEPLOY_ENV"
else
    echo "✅ モック版Vercelデプロイが完了しました"
    echo "🔗 デプロイURL: https://mock-deployment-$DEPLOY_ENV.vercel.app"
fi

echo "✅ フルデプロイが完了しました"
exit 0