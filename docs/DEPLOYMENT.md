# Vercelデプロイメントガイド

AI News AggregatorをVercelにデプロイするための完全ガイドです。

## 🚀 クイックデプロイ

### 1. 前提条件

- Node.js 18以上がインストールされていること
- npmまたはyarnがインストールされていること
- Vercelアカウントを持っていること

### 2. 自動デプロイスクリプト使用

```bash
# デプロイスクリプトに実行権限を付与
chmod +x scripts/deploy-vercel.sh

# プレビュー環境にデプロイ
./scripts/deploy-vercel.sh --preview

# 本番環境にデプロイ
./scripts/deploy-vercel.sh --prod

# ビルドのみ実行
./scripts/deploy-vercel.sh --build-only

# デプロイ前チェックのみ
./scripts/deploy-vercel.sh --check
```

### 3. 手動デプロイ

```bash
# Vercel CLIをインストール
npm install -g vercel

# プロジェクトルートでVercelにログイン
vercel login

# 初回デプロイ（プレビュー）
vercel

# 本番デプロイ
vercel --prod
```

## ⚙️ 設定ファイル

### vercel.json

プロジェクトルートの`vercel.json`でVercel固有の設定を管理：

```json
{
  "version": 2,
  "name": "ai-news-aggregator",
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "out"
      }
    }
  ],
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/out",
  "installCommand": "cd frontend && npm install"
}
```

### 主要設定項目

- **buildCommand**: ビルドコマンド
- **outputDirectory**: 出力ディレクトリ
- **installCommand**: 依存関係インストールコマンド
- **headers**: セキュリティヘッダー設定
- **rewrites**: URLリライト設定
- **redirects**: リダイレクト設定

## 🔧 環境変数設定

### Vercelダッシュボードでの設定

1. [Vercelダッシュボード](https://vercel.com/dashboard)にアクセス
2. プロジェクトを選択
3. Settings → Environment Variables
4. 以下の環境変数を設定：

| 変数名 | 値 | 環境 |
|--------|-----|------|
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.vercel.app` | Production, Preview |
| `NODE_ENV` | `production` | Production |

### CLI経由での設定

```bash
# 本番環境変数を設定
vercel env add NEXT_PUBLIC_SITE_URL production

# プレビュー環境変数を設定
vercel env add NEXT_PUBLIC_SITE_URL preview

# 環境変数一覧を確認
vercel env ls
```

## 📁 ファイル構成

### デプロイ対象ファイル

```
├── vercel.json                 # Vercel設定
├── frontend/
│   ├── package.json           # 依存関係
│   ├── next.config.js         # Next.js設定
│   ├── .vercelignore          # 除外ファイル
│   ├── src/                   # ソースコード
│   ├── public/                # 静的ファイル
│   │   └── data/              # JSONデータ
│   └── out/                   # ビルド出力（自動生成）
└── scripts/
    └── deploy-vercel.sh       # デプロイスクリプト
```

### .vercelignore

デプロイ時に除外するファイルを指定：

```
node_modules
.next
coverage
*.log
.env.local
__tests__
*.test.*
e2e/
```

## 🔄 手動デプロイパイプライン

### GitHub Actionsとの連携

```yaml
# .github/workflows/deploy-vercel.yml
name: Deploy to Vercel

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'デプロイ環境'
        required: true
        default: 'preview'
        type: choice
        options:
          - preview
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: cd frontend && npm ci
      
      - name: Run tests
        run: cd frontend && npm test
      
      - name: Build project
        run: cd frontend && npm run build:vercel
      
      - name: Vercelデプロイ
        run: |
          vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### 必要なシークレット

GitHub Repositoryの Settings → Secrets で設定：

- `VERCEL_TOKEN`: Vercel APIトークン
- `VERCEL_ORG_ID`: Vercel組織ID（オプション）
- `VERCEL_PROJECT_ID`: VercelプロジェクトID（オプション）

### 手動実行方法

1. GitHubリポジトリの「Actions」タブを開く
2. 「Deploy to Vercel」ワークフローを選択
3. 「Run workflow」をクリック
4. デプロイ環境（preview/production）を選択
5. 「Run workflow」で実行開始

## 🚨 トラブルシューティング

### よくある問題と解決方法

#### 1. ビルドエラー

```bash
# TypeScriptエラーの確認
cd frontend && npm run type-check

# ESLintエラーの確認
cd frontend && npm run lint

# 依存関係の再インストール
cd frontend && rm -rf node_modules package-lock.json && npm install
```

#### 2. データファイルが見つからない

```bash
# データ処理パイプラインを実行
python scripts/main.py

# データファイルの確認
ls -la frontend/public/data/
```

#### 3. 環境変数の問題

```bash
# 環境変数の確認
vercel env ls

# 環境変数の追加
vercel env add VARIABLE_NAME
```

#### 4. デプロイ権限エラー

```bash
# Vercelに再ログイン
vercel logout
vercel login

# プロジェクトの再リンク
vercel link
```

## 📊 パフォーマンス最適化

### ビルド最適化

```javascript
// next.config.js
const nextConfig = {
  output: 'export',
  compress: true,
  poweredByHeader: false,
  
  // 画像最適化
  images: { 
    unoptimized: true,
    formats: ['image/webp', 'image/avif']
  },
  
  // コンパイラ最適化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  
  // Webpack最適化
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  }
}
```

### キャッシュ設定

```json
{
  "headers": [
    {
      "source": "/data/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, s-maxage=3600"
        }
      ]
    },
    {
      "source": "/_next/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## 🔐 セキュリティ設定

### セキュリティヘッダー

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### HTTPS強制

Vercelでは自動的にHTTPSが有効になりますが、カスタムドメインの場合は設定を確認してください。

## 📈 監視とログ

### Vercel Analytics

```bash
# Vercel Analyticsを有効化
vercel analytics enable
```

### ログの確認

```bash
# 関数ログの確認
vercel logs

# リアルタイムログ
vercel logs --follow
```

## 🌐 カスタムドメイン設定

### ドメインの追加

1. Vercelダッシュボードでプロジェクトを選択
2. Settings → Domains
3. カスタムドメインを追加
4. DNSレコードを設定

### DNS設定例

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.19.61
```

## 📚 参考リンク

- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## 🆘 サポート

問題が発生した場合：

1. このドキュメントのトラブルシューティングセクションを確認
2. [Vercel Community](https://github.com/vercel/vercel/discussions)で質問
3. プロジェクトのIssueを作成

---

**注意**: デプロイ前に必ずデータ処理パイプラインを実行して、最新のニュースデータを生成してください。