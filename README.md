# AI News Aggregator

AI技術関連のニュースを自動収集・要約・翻訳するシステムです。Pythonによるデータ処理とNext.jsによるフロントエンドを組み合わせ、Docker化された統合環境で動作します。

## 🚀 クイックスタート

### Docker環境での起動（推奨）

```bash
# 初回セットアップ
make setup

# 環境変数ファイルを編集してClaude APIキーを設定
# .envファイルのCLAUDE_API_KEYを実際の値に変更

# 開発環境を起動
make dev

# または、バックグラウンドで起動
make dev-bg
```

### 手動セットアップ

#### 1. 依存関係のインストール

```bash
pip install -r requirements.txt
```

#### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env`ファイルを編集して、少なくとも1つのAI APIキーを設定：

```env
# 推奨：OpenAI（高速・安価）
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# または Claude（高品質）
CLAUDE_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 複数設定でフォールバック機能を活用
PREFERRED_PROVIDERS=openai,claude,gemini
```

#### 3. AI APIキーの取得

**OpenAI（推奨）**:
1. [OpenAI Platform](https://platform.openai.com/)にアクセス
2. API Keysセクションで新しいAPIキーを作成

**Claude**:
1. [Anthropic Console](https://console.anthropic.com/)にアクセス
2. API Keysセクションで新しいAPIキーを作成

**Gemini**:
1. [Google AI Studio](https://aistudio.google.com/)にアクセス
2. API Keyを作成

## 🚀 ワンコマンドデプロイメント

### 新機能：統合デプロイメント

記事収集からVercelデプロイまでを1つのコマンドで実行できます。

### スクリプト構造

```
scripts/
├── deploy/          # デプロイ関連スクリプト
│   ├── deploy-full.sh       # フルデプロイメント
│   ├── deploy-data-only.sh  # データ準備のみ
│   ├── deploy-vercel.sh     # Vercelデプロイのみ
│   └── prepare-deploy.sh    # デプロイ準備
├── core/            # メイン処理スクリプト
│   ├── main.py             # データ収集メイン処理
│   ├── update_latest.py    # latest.json更新
│   ├── validate_env.py     # 環境検証
│   └── demo_full_pipeline.py # デモ用パイプライン
├── test/            # テスト関連スクリプト
│   └── test_*.py           # 各種テストスクリプト
├── docker/          # Docker関連スクリプト
│   ├── docker-start.sh     # Docker起動
│   └── docker-cleanup.sh   # Docker クリーンアップ
└── utils/           # ユーティリティスクリプト
    ├── venv-manager.sh     # 仮想環境管理
    ├── progress-logger.sh  # 進行状況表示
    ├── time-tracker.sh     # 実行時間計測
    ├── error-handler.sh    # エラーハンドリング
    └── detailed-logger.sh  # 詳細ログ出力
```

```bash
# プレビュー環境への完全デプロイ
make deploy-full

# 本番環境への完全デプロイ
make deploy-full-prod

# データ準備のみ（デプロイ前の確認用）
make deploy-data

# Vercelデプロイのみ（データ収集スキップ）
make deploy-only          # プレビュー環境
make deploy-only-prod     # 本番環境
```

### 詳細なデプロイオプション

```bash
# フルデプロイ（全ワークフロー実行）
./scripts/deploy/deploy-full.sh --env preview    # プレビュー環境
./scripts/deploy/deploy-full.sh --env prod       # 本番環境

# オプション付きフルデプロイ
./scripts/deploy/deploy-full.sh --prod --backup  # バックアップ付き本番デプロイ
./scripts/deploy/deploy-full.sh --skip-data      # データ収集スキップ
./scripts/deploy/deploy-full.sh --verbose        # 詳細ログ出力

# データ準備のみ
./scripts/deploy/deploy-data-only.sh             # 基本実行
./scripts/deploy/deploy-data-only.sh --verbose   # 詳細ログ付き
./scripts/deploy/deploy-data-only.sh --backup    # バックアップ付き

# Vercelデプロイのみ
./scripts/deploy/deploy-vercel.sh --preview      # プレビュー環境
./scripts/deploy/deploy-vercel.sh --prod         # 本番環境
```

### 従来のデプロイ方法

```bash
# 手動ステップ実行
source venv/bin/activate
python3 scripts/core/main.py
./scripts/deploy/deploy-vercel.sh --prod

# 手動Vercelデプロイ
npm install -g vercel
vercel          # プレビュー
vercel --prod   # 本番
```

### GitHub Actions手動デプロイ

- **手動実行**: GitHub Actionsタブから「Deploy to Vercel」を実行
- **環境選択**: プレビューまたは本番環境を選択可能

詳細は [デプロイメントガイド](docs/DEPLOYMENT.md) を参照してください。

## 🐳 Docker環境

### 利用可能なコマンド

```bash
# ヘルプを表示
make help

# 環境変数の検証
make validate

# 開発環境
make dev          # フォアグラウンドで起動
make dev-bg       # バックグラウンドで起動

# 本番環境
make prod         # フォアグラウンドで起動
make prod-bg      # バックグラウンドで起動

# サービス管理
make up           # サービス起動
make down         # サービス停止
make restart      # サービス再起動
make logs         # ログ表示
make status       # 状態確認

# テスト
make test                    # Pythonテスト実行
make test-frontend          # フロントエンドテスト実行
make test-unit              # 単体テスト実行
make test-integration       # 統合テスト実行
make test-integration-verbose # 統合テスト（詳細出力）
make test-all               # 全テスト実行

# ワンコマンドデプロイメント
make deploy-full      # フルデプロイ（プレビュー環境）
make deploy-full-prod # フルデプロイ（本番環境）
make deploy-data      # データ準備のみ
make deploy-only      # Vercelデプロイのみ（プレビュー）
make deploy-only-prod # Vercelデプロイのみ（本番）

# クリーンアップ
make clean        # コンテナとボリューム削除
make clean-all    # 全リソース削除
```

### Docker Compose構成

- **news-processor**: Pythonデータ処理コンテナ
- **frontend-dev**: Next.js開発サーバー
- **frontend-prod**: Next.js本番サーバー
- **nginx**: リバースプロキシ（本番環境）
- **redis**: キャッシュサーバー（オプション）

### 環境別起動方法

```bash
# 開発環境（ホットリロード有効）
./scripts/docker/docker-start.sh --env dev --build

# 本番環境（最適化ビルド）
./scripts/docker/docker-start.sh --env prod --build --detach

# Docker Secretsを使用
./scripts/docker-start.sh --env prod --secrets

# 環境変数検証のみ
./scripts/docker-start.sh --validate
```

## 🧪 テスト実行

### 基本テスト

```bash
# 全テストを実行
python -m pytest tests/ -v

# DataManagerのテスト
python -m pytest tests/test_data_manager.py -v

# AI要約器のテスト
python -m pytest tests/test_claude_summarizer.py -v
```

### 単体テスト

```bash
# 単体テストを実行
make test-unit

# または直接実行
./tests/unit/run_all_unit_tests.sh
```

### 統合テスト

```bash
# 統合テストを実行
make test-integration

# 詳細出力で実行
make test-integration-verbose

# キャッシュクリア後に実行
make test-integration-clean

# または直接実行
./tests/integration/run_integration_tests.sh --verbose
```

### デモスクリプト

```bash
# モックデータでのデモ
python scripts/test_data_manager.py

# リアルAPIテスト（APIキー必須）
python scripts/test_real_api.py

# クリーンアップ機能テスト
python scripts/test_cleanup.py
```

## 📁 プロジェクト構造

```
├── shared/                 # 共通モジュール
│   ├── ai/                # AI関連（Claude要約器）
│   ├── collectors/        # データ収集（RSS）
│   ├── data/             # データ管理
│   └── utils/            # ユーティリティ
├── tests/                # テストファイル
├── scripts/              # デモ・テストスクリプト
├── frontend/public/data/ # 出力データ（JSON）
└── logs/                 # ログファイル
```

## 🔧 設定オプション

`.env`ファイルで以下の設定が可能です：

| 変数名              | 説明                   | デフォルト値            |
| ------------------- | ---------------------- | ----------------------- |
| `OPENAI_API_KEY`    | OpenAI APIキー（推奨） | -                       |
| `CLAUDE_API_KEY`    | Claude APIキー         | -                       |
| `GEMINI_API_KEY`    | Gemini APIキー         | -                       |
| `PREFERRED_PROVIDERS` | プロバイダー優先順位 | openai,claude,gemini,local |
| `OPENAI_MODEL`      | OpenAIモデル           | gpt-4o                  |
| `CLAUDE_MODEL`      | Claudeモデル           | claude-3-haiku-20240307 |
| `OUTPUT_PATH`       | データ出力先           | frontend/public/data    |
| `RETENTION_DAYS`    | データ保持日数         | 30                      |
| `LOG_LEVEL`         | ログレベル             | INFO                    |

## 📊 出力データ形式

システムは以下の構造でJSONデータを出力します：

```
frontend/public/data/
├── news/
│   ├── YYYY-MM-DD/
│   │   ├── articles.json      # 日別記事データ
│   │   └── metadata.json      # 統計情報
│   └── latest.json            # 最新記事
├── summaries/
│   ├── YYYY-MM-DD.json        # 日次サマリー
│   └── latest.json            # 最新サマリー
├── config/
│   ├── categories.json        # カテゴリ設定
│   └── sources.json          # RSS源設定
└── metrics/
    └── metrics_*.json         # 処理メトリクス
```

## 🔄 データ更新とデプロイワークフロー

### ワンコマンドデプロイの実行ステップ

`make deploy-full` または `./scripts/deploy-full.sh` を実行すると、以下のステップが自動実行されます：

1. **環境確認** (約5秒)
   - 仮想環境の存在確認と有効化
   - 必要なファイルとディレクトリの確認

2. **データ収集** (約45-60分)
   - RSS記事の収集
   - AI要約の生成
   - 翻訳処理

3. **データコピー** (約2秒)
   - latest.jsonファイルの更新
   - データファイルの整理

4. **Vercelデプロイ** (約2-3分)
   - フロントエンドのビルド
   - Vercelへのデプロイ

**総実行時間**: 約50-65分

### 記事データ収集（従来の方法）
```bash
# 仮想環境を有効化
source venv/bin/activate

# データ収集実行（約60分）
python3 scripts/main.py
```

### latest.json手動更新
フロントエンドで最新データが表示されない場合：

```bash
# 最新の記事データをlatest.jsonにコピー
cp frontend/public/data/news/$(date +%Y-%m-%d)/articles.json frontend/public/data/news/latest.json

# サマリーデータも更新
cp frontend/public/data/summaries/$(date +%Y-%m-%d).json frontend/public/data/summaries/latest.json

# 更新スクリプト使用（推奨）
source venv/bin/activate
python3 scripts/update_latest.py --limit 100
```

### フロントエンド開発サーバー起動
```bash
cd frontend
npm run dev
```

## 🤖 GitHub Actions自動更新

毎日午前9時（JST）に自動でニュースデータを更新するGitHub Actionsワークフローを設定済みです。

### CLAUDE_API_KEYの設定
GitHub Actionsで自動更新を有効にするには、リポジトリシークレットにClaude APIキーを設定する必要があります。

#### 設定手順：
1. GitHubリポジトリのページに移動
2. **Settings** タブをクリック
3. 左側のサイドバーから **Secrets and variables** → **Actions** を選択
4. **New repository secret** をクリック
5. 以下の情報を入力：
   - **Name**: `CLAUDE_API_KEY`
   - **Secret**: あなたのClaude APIキー（`sk-ant-api03-...`形式）
6. **Add secret** をクリックして保存

### ワークフローの実行
- **自動実行**: 毎日午前9時（JST）= UTC 0時に自動実行
- **手動実行**: GitHub Actionsタブから「Daily News Update」を手動実行可能
  - `force_update`オプション：既存のデータがあっても強制的に更新

### ワークフローの機能
- ✅ Claude APIキーの検証
- 📊 既存データのチェック（50記事以上あればスキップ）
- 📰 ニュース収集と要約（最大1.5時間でタイムアウト）
- 🗺️ サイトマップとRSSフィードの生成
- 📝 自動コミット・プッシュ
- 📋 実行ログのアーティファクト保存

### トラブルシューティング
- ワークフローが失敗する場合は、GitHub Actionsタブでログを確認
- CLAUDE_API_KEYが正しく設定されているか確認
- Claude APIの利用制限に達していないか確認

## 🔧 ワンコマンドデプロイのトラブルシューティング

### よくある問題と解決方法

#### 1. 仮想環境エラー
```bash
# エラー: 仮想環境が見つからない
# 解決方法: 仮想環境を作成
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 2. データ収集エラー
```bash
# エラー: APIキーが設定されていない
# 解決方法: .envファイルを確認
cp .env.example .env
# .envファイルを編集してAPIキーを設定

# エラー: データ収集が長時間実行される
# 解決方法: ログを確認
tail -f logs/deploy-full-*.log
```

#### 3. Vercelデプロイエラー
```bash
# エラー: Vercel CLIがインストールされていない
# 解決方法: Vercel CLIをインストール
npm install -g vercel

# エラー: データファイルが見つからない
# 解決方法: データ準備を先に実行
make deploy-data
```

#### 4. バックアップ・復元機能
```bash
# 利用可能なバックアップを確認
./scripts/deploy-full.sh --list-backups

# バックアップから復元
./scripts/deploy-full.sh --restore backup-20240115_143022

# バックアップ付きデプロイ
./scripts/deploy-full.sh --prod --backup
```

#### 5. ログファイルの確認
```bash
# 最新のログファイルを確認
ls -la logs/deploy-full-*.log | tail -1

# リアルタイムログ監視
tail -f logs/deploy-full-$(date +%Y%m%d)*.log

# エラーログのみ表示
grep -i error logs/deploy-full-*.log
```

#### 6. 段階的デプロイ
問題が発生した場合は、段階的にデプロイを実行してください：

```bash
# ステップ1: データ準備のみ
make deploy-data

# ステップ2: データ確認
ls -la frontend/public/data/news/latest.json

# ステップ3: Vercelデプロイのみ
make deploy-only
```

## 🤖 マルチプロバイダーAIシステム

本システムは複数のAIプロバイダーを使い分けることで、レート制限の回避とコスト最適化を実現しています。

### 対応プロバイダー

| プロバイダー | 特徴 | レート制限 | 推奨用途 |
|------------|------|-----------|----------|
| **OpenAI GPT-4o** | 高速・安価 | 500req/min | メイン処理（推奨） |
| **Claude** | 高品質 | 50req/min | 重要記事・分析 |
| **Google Gemini** | 大容量 | 300req/min | 長文処理 |
| **ローカルモデル** | 無料 | 無制限 | 開発・テスト |

### 設定例

```bash
# 最小設定（OpenAIのみ）
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# マルチプロバイダー設定
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLAUDE_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# プロバイダー優先順位
PREFERRED_PROVIDERS=openai,claude,gemini,local
```

### 自動フォールバック機能

- プロバイダーがレート制限に達すると自動で別のプロバイダーに切り替え
- エラー発生時の自動リトライ機能
- 記事を複数プロバイダーに分散して並行処理

詳細は [マルチプロバイダーAIシステム](docs/multi-provider-ai-system.md) を参照してください。

## 🤖 使用技術

- **Python 3.13+**: メイン言語
- **OpenAI GPT-4o**: 高速AI要約・翻訳（推奨）
- **Anthropic Claude**: 高品質AI要約・翻訳
- **Google Gemini**: 大容量AI処理
- **feedparser**: RSS解析
- **aiohttp**: 非同期HTTP通信
- **pytest**: テストフレームワーク

## 📝 ライセンス

MIT License