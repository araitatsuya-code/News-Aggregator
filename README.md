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

`.env`ファイルを編集して、Claude APIキーを設定：

```env
CLAUDE_API_KEY=your-actual-claude-api-key-here
```

#### 3. Claude APIキーの取得

1. [Anthropic Console](https://console.anthropic.com/)にアクセス
2. アカウントを作成またはログイン
3. API Keysセクションで新しいAPIキーを作成
4. 作成されたAPIキーを`.env`ファイルに設定

## 🚀 Vercelデプロイメント

### クイックデプロイ

```bash
# デプロイ準備（データ処理 + ビルド準備）
./scripts/prepare-deploy.sh

# Vercelにデプロイ
./scripts/deploy-vercel.sh --preview  # プレビュー環境
./scripts/deploy-vercel.sh --prod     # 本番環境

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
make test         # Pythonテスト実行
make test-frontend # フロントエンドテスト実行
make test-all     # 全テスト実行

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
./scripts/docker-start.sh --env dev --build

# 本番環境（最適化ビルド）
./scripts/docker-start.sh --env prod --build --detach

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
| `CLAUDE_API_KEY`    | Claude APIキー（必須） | -                       |
| `CLAUDE_MODEL`      | 使用するClaudeモデル   | claude-3-haiku-20240307 |
| `CLAUDE_MAX_TOKENS` | 最大トークン数         | 1000                    |
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

## 🔄 データ更新コマンド

### 記事データ収集
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

## 🤖 使用技術

- **Python 3.13+**: メイン言語
- **Anthropic Claude**: AI要約・翻訳
- **feedparser**: RSS解析
- **aiohttp**: 非同期HTTP通信
- **pytest**: テストフレームワーク

## 📝 ライセンス

MIT License