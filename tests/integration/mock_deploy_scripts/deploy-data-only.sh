#!/bin/bash

# モック版データ準備専用スクリプト - テスト用
# 実際のAPI呼び出しは行わず、テスト用の動作をシミュレート

set -e

# デフォルト設定
VERBOSE_MODE=false

# 引数解析
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose)
            VERBOSE_MODE=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

echo "モック版データ準備を開始します..."

if [ "$VERBOSE_MODE" = "true" ]; then
    echo "詳細モードで実行中..."
fi

echo "データ収集を実行中..."
sleep 1

# モック版main.pyの実行
if [ -f "scripts/core/main.py" ]; then
    python3 scripts/core/main.py
else
    echo "main.pyが見つかりません。モックデータを作成します..."
    mkdir -p frontend/public/data/news
    echo '{"articles":[{"id":"mock_001","title":"モック記事","summary":"テスト用記事","url":"https://example.com","published":"'$(date -Iseconds)'","category":"Test","source":"mock"}],"metadata":{"generated_at":"'$(date -Iseconds)'","total_articles":1}}' > frontend/public/data/news/latest.json
fi

echo "データコピーを実行中..."
sleep 1

# ログディレクトリの作成
mkdir -p logs
echo "$(date -Iseconds): モック版データ準備完了" >> logs/deploy-data-$(date +%Y%m%d).log

echo "✅ データ準備が完了しました"

# 生成されたファイルの確認
if [ -f "frontend/public/data/news/latest.json" ]; then
    echo "📊 生成されたデータファイル: frontend/public/data/news/latest.json"
    if command -v jq &> /dev/null; then
        echo "記事数: $(jq '.metadata.total_articles' frontend/public/data/news/latest.json)"
    fi
fi

exit 0