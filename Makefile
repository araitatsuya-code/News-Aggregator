# AI News Aggregator Makefile
# 開発効率化のためのコマンド集

.PHONY: help build up down logs clean test validate dev prod

# デフォルトターゲット
help: ## ヘルプを表示
	@echo "AI News Aggregator 開発用コマンド"
	@echo "=================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# 環境変数の検証
validate: ## 環境変数の検証
	@echo "🔍 環境変数を検証中..."
	@python3 scripts/validate_env.py

# 開発環境
dev: validate ## 開発環境を起動
	@echo "🚀 開発環境を起動中..."
	@./scripts/docker-start.sh --env dev --build

dev-bg: validate ## 開発環境をバックグラウンドで起動
	@echo "🚀 開発環境をバックグラウンドで起動中..."
	@./scripts/docker-start.sh --env dev --build --detach

# 本番環境
prod: validate ## 本番環境を起動
	@echo "🚀 本番環境を起動中..."
	@./scripts/docker-start.sh --env prod --build

prod-bg: validate ## 本番環境をバックグラウンドで起動
	@echo "🚀 本番環境をバックグラウンドで起動中..."
	@./scripts/docker-start.sh --env prod --build --detach

# Docker操作
build: ## イメージをビルド
	@echo "🔨 Dockerイメージをビルド中..."
	@docker compose build

up: ## サービスを起動
	@echo "⬆️  サービスを起動中..."
	@docker compose --profile dev up

up-bg: ## サービスをバックグラウンドで起動
	@echo "⬆️  サービスをバックグラウンドで起動中..."
	@docker compose --profile dev up -d

down: ## サービスを停止
	@echo "⬇️  サービスを停止中..."
	@docker compose down

restart: down up ## サービスを再起動

# ログとモニタリング
logs: ## ログを表示
	@docker compose logs -f

logs-processor: ## データ処理のログを表示
	@docker compose logs -f news-processor

logs-frontend: ## フロントエンドのログを表示
	@docker compose logs -f frontend-dev

status: ## サービスの状態を確認
	@echo "📊 サービス状態:"
	@docker compose ps
	@echo ""
	@echo "📈 リソース使用量:"
	@docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# テスト
test: ## テストを実行
	@echo "🧪 Pythonテストを実行中..."
	@docker compose exec news-processor-dev python -m pytest tests/ -v

test-frontend: ## フロントエンドテストを実行
	@echo "🧪 フロントエンドテストを実行中..."
	@cd frontend && npm test

test-unit: ## 単体テストを実行
	@echo "🧪 単体テストを実行中..."
	@./tests/unit/run_all_unit_tests.sh

test-integration: ## 統合テストを実行
	@echo "🧪 統合テストを実行中..."
	@./tests/integration/run_integration_tests.sh

test-integration-verbose: ## 統合テストを詳細出力で実行
	@echo "🧪 統合テストを詳細出力で実行中..."
	@./tests/integration/run_integration_tests.sh --verbose

test-integration-clean: ## キャッシュクリア後に統合テストを実行
	@echo "🧪 キャッシュクリア後に統合テストを実行中..."
	@./tests/integration/run_integration_tests.sh --clean --verbose

test-all: test test-frontend test-unit test-integration ## 全てのテストを実行

# データ処理
process: ## データ処理を手動実行
	@echo "⚙️  データ処理を実行中..."
	@docker compose exec news-processor-dev python scripts/main.py

process-mock: ## モックデータで処理を実行
	@echo "⚙️  モックデータで処理を実行中..."
	@docker compose exec news-processor-dev python scripts/test_mock_api.py

# クリーンアップ
clean: ## コンテナとボリュームを削除
	@echo "🧹 クリーンアップ中..."
	@./scripts/docker-cleanup.sh --volumes

clean-all: ## 全てのリソースを削除
	@echo "🧹 全リソースをクリーンアップ中..."
	@./scripts/docker-cleanup.sh --all --force

clean-logs: ## ログファイルを削除
	@echo "🧹 ログファイルを削除中..."
	@rm -rf logs/* || true
	@echo "✅ ログファイルを削除しました"

# 開発用ユーティリティ
shell: ## Pythonコンテナにシェルアクセス
	@docker compose exec news-processor /bin/bash

shell-frontend: ## フロントエンドコンテナにシェルアクセス
	@docker compose exec frontend-dev /bin/sh

install-deps: ## Python依存関係を再インストール
	@echo "📦 Python依存関係を再インストール中..."
	@docker compose exec news-processor pip install -r requirements.txt

install-frontend-deps: ## フロントエンド依存関係を再インストール
	@echo "📦 フロントエンド依存関係を再インストール中..."
	@docker compose exec frontend-dev npm install

# 設定とセットアップ
setup: ## 初回セットアップ
	@echo "🔧 初回セットアップを実行中..."
	@mkdir -p logs frontend/public/data nginx/ssl
	@cp .env.example .env || true
	@echo "✅ セットアップ完了"
	@echo "💡 .envファイルを編集してClaude API キーを設定してください"

# ヘルスチェック
health: ## ヘルスチェックを実行
	@echo "🏥 ヘルスチェックを実行中..."
	@curl -f http://localhost/health || echo "❌ ヘルスチェック失敗"
	@curl -f http://localhost:3000/api/health || echo "❌ フロントエンドヘルスチェック失敗"

# ワンコマンドデプロイメント
deploy-full: validate ## フルデプロイ（データ収集 + Vercelデプロイ）
	@echo "🚀 ワンコマンドデプロイメントを開始中..."
	@./scripts/deploy-full.sh --env preview

deploy-full-prod: validate ## 本番環境へのフルデプロイ
	@echo "🚀 本番環境へのワンコマンドデプロイメントを開始中..."
	@./scripts/deploy-full.sh --env prod

deploy-data: validate ## データ準備のみ実行
	@echo "📊 データ準備を実行中..."
	@./scripts/deploy-data-only.sh

deploy-only: ## Vercelデプロイのみ実行（データ収集スキップ）
	@echo "🚀 Vercelデプロイのみを実行中..."
	@./scripts/deploy-vercel.sh --env preview

deploy-only-prod: ## 本番環境へのVercelデプロイのみ実行
	@echo "🚀 本番環境へのVercelデプロイのみを実行中..."
	@./scripts/deploy-vercel.sh --env prod

# 本番デプロイ用
deploy-check: validate test ## デプロイ前チェック
	@echo "🚀 デプロイ前チェックを実行中..."
	@echo "✅ 環境変数検証完了"
	@echo "✅ テスト完了"
	@echo "🎉 デプロイ準備完了"

# 開発環境のクイックスタート
quick-start: setup validate dev ## クイックスタート（初回用）

# 情報表示
info: ## システム情報を表示
	@echo "📋 AI News Aggregator システム情報"
	@echo "=================================="
	@echo "Docker version: $(shell docker --version)"
	@echo "Docker Compose version: $(shell docker compose version)"
	@echo "Python version: $(shell python3 --version)"
	@echo "Node.js version: $(shell node --version 2>/dev/null || echo 'Not installed')"
	@echo ""
	@echo "📁 プロジェクト構造:"
	@echo "  - Backend: Python + Docker"
	@echo "  - Frontend: Next.js"
	@echo "  - AI: Claude API"
	@echo "  - Proxy: Nginx"