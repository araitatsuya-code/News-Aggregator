# AI News Aggregator

AI関連のニュースを自動収集・要約し、日本語と英語で提供するWebアプリケーション

## プロジェクト構成

```
ai-news-aggregator/
├── shared/                 # 共通モジュール
│   ├── types.py           # データ型定義
│   ├── config.py          # 設定管理
│   ├── exceptions.py      # カスタム例外
│   └── utils/
│       └── logger.py      # ログ機能
├── scripts/               # データ処理スクリプト
│   └── main.py           # メイン処理
├── frontend/             # Next.jsフロントエンド（後で実装）
│   └── public/data/      # 生成されるJSONデータ
├── tests/                # テストファイル
├── logs/                 # ログファイル
├── requirements.txt      # Python依存関係
├── Dockerfile           # Docker設定
├── docker-compose.yml   # Docker Compose設定
└── .env.example         # 環境変数例
```

## セットアップ

### 1. 環境変数設定

```bash
cp .env.example .env
# .envファイルを編集してCLAUDE_API_KEYを設定
```

### 2. Docker使用の場合

```bash
# ビルドと実行
docker-compose up --build news-processor

# 開発環境（フロントエンド含む）
docker-compose --profile dev up
```

### 3. ローカル開発の場合

```bash
# Python依存関係インストール
pip install -r requirements.txt

# テスト実行
pytest tests/

# メイン処理実行
python scripts/main.py
```

## 環境変数

| 変数名 | 必須 | デフォルト | 説明 |
|--------|------|------------|------|
| CLAUDE_API_KEY | ✓ | - | Claude API キー |
| CLAUDE_MODEL | - | claude-3-haiku-20240307 | 使用するClaudeモデル |
| LOG_LEVEL | - | INFO | ログレベル |
| OUTPUT_PATH | - | frontend/public/data | データ出力パス |
| RETENTION_DAYS | - | 30 | データ保持日数 |

## 開発

### テスト実行

```bash
# 全テスト実行
pytest

# 特定テスト実行
pytest tests/test_basic_setup.py

# カバレッジ付きテスト
pytest --cov=shared --cov=scripts
```

### コード品質チェック

```bash
# フォーマット
black shared/ scripts/ tests/

# リント
flake8 shared/ scripts/ tests/

# 型チェック
mypy shared/ scripts/
```

## ライセンス

MIT License