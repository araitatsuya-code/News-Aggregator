# AI News Aggregator

AI技術関連のニュースを自動収集・要約・翻訳するシステムです。

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 2. 環境変数の設定

`.env.example`ファイルを`.env`にコピーして、APIキーを設定してください：

```bash
cp .env.example .env
```

`.env`ファイルを編集して、Claude APIキーを設定：

```env
CLAUDE_API_KEY=your-actual-claude-api-key-here
```

### 3. Claude APIキーの取得

1. [Anthropic Console](https://console.anthropic.com/)にアクセス
2. アカウントを作成またはログイン
3. API Keysセクションで新しいAPIキーを作成
4. 作成されたAPIキーを`.env`ファイルに設定

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

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `CLAUDE_API_KEY` | Claude APIキー（必須） | - |
| `CLAUDE_MODEL` | 使用するClaudeモデル | claude-3-haiku-20240307 |
| `CLAUDE_MAX_TOKENS` | 最大トークン数 | 1000 |
| `OUTPUT_PATH` | データ出力先 | frontend/public/data |
| `RETENTION_DAYS` | データ保持日数 | 30 |
| `LOG_LEVEL` | ログレベル | INFO |

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

## 🤖 使用技術

- **Python 3.13+**: メイン言語
- **Anthropic Claude**: AI要約・翻訳
- **feedparser**: RSS解析
- **aiohttp**: 非同期HTTP通信
- **pytest**: テストフレームワーク

## 📝 ライセンス

MIT License