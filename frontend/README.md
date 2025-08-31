# AI News Aggregator Frontend

Next.js 14を使用したAIニュースまとめサイトのフロントエンドです。

## 🚀 Vercelデプロイメント

### クイックスタート

```bash
# 1. デプロイ準備
../scripts/prepare-deploy.sh

# 2. Vercelデプロイ
../scripts/deploy-vercel.sh --prod

# または手動デプロイ
npm install -g vercel
vercel --prod
```

### 自動デプロイ

GitHub Actionsによる自動デプロイが設定されています：

- **mainブランチへのプッシュ**: 本番環境に自動デプロイ
- **プルリクエスト**: プレビュー環境に自動デプロイ
- **手動実行**: GitHub Actionsタブから実行可能

## 🛠️ 開発環境

### 依存関係のインストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認してください。

### 利用可能なスクリプト

```bash
# 開発
npm run dev                 # 開発サーバー起動
npm run build              # 本番ビルド
npm run build:vercel       # Vercel用ビルド
npm run start              # 本番サーバー起動

# 品質チェック
npm run lint               # ESLintチェック
npm run type-check         # TypeScriptタイプチェック
npm test                   # Jestテスト実行
npm run test:watch         # テストウォッチモード
npm run test:coverage      # カバレッジ付きテスト

# E2Eテスト
npm run test:e2e           # Playwrightテスト
npm run test:e2e:ui        # テストUI表示
npm run test:e2e:headed    # ヘッド付きテスト

# ビルド分析
npm run build:analyze      # バンドルサイズ分析
npm run optimize           # 全チェック + 分析ビルド

# ユーティリティ
npm run generate-sitemap   # サイトマップ生成
npm run deploy             # Vercel本番デプロイ
npm run deploy:preview     # Vercelプレビューデプロイ
```

## 📁 プロジェクト構造

```
src/
├── components/           # Reactコンポーネント
│   ├── layout/          # レイアウトコンポーネント
│   ├── news/            # ニュース関連コンポーネント
│   ├── summary/         # サマリー関連コンポーネント
│   └── __tests__/       # コンポーネントテスト
├── lib/                 # ライブラリとユーティリティ
│   ├── data/            # データアクセス層
│   ├── hooks/           # カスタムフック
│   └── utils/           # ユーティリティ関数
├── pages/               # Next.jsページ
│   ├── api/             # APIルート
│   ├── _app.tsx         # アプリケーションルート
│   ├── _document.tsx    # ドキュメント設定
│   ├── index.tsx        # ホームページ
│   ├── categories.tsx   # カテゴリページ
│   └── summary.tsx      # サマリーページ
├── styles/              # スタイルファイル
└── locales/             # 多言語リソース
    ├── en/              # 英語リソース
    └── ja/              # 日本語リソース

public/
├── data/                # 静的データファイル
│   ├── news/            # ニュースデータ
│   ├── summaries/       # サマリーデータ
│   └── config/          # 設定ファイル
├── locales/             # 公開多言語リソース
└── static/              # 静的アセット
```

## 🔧 設定ファイル

### Next.js設定 (next.config.js)

```javascript
const nextConfig = {
  output: 'export',           // 静的エクスポート
  trailingSlash: true,        // URLにスラッシュ追加
  images: { unoptimized: true }, // 画像最適化無効
  compress: true,             // gzip圧縮有効
  poweredByHeader: false,     // X-Powered-Byヘッダー無効
}
```

### Vercel設定 (vercel.json)

```json
{
  "buildCommand": "npm run build:vercel",
  "outputDirectory": "out",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### TypeScript設定 (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 🌐 多言語対応

### サポート言語

- 日本語 (ja) - デフォルト
- 英語 (en)

### 翻訳リソース

```
src/locales/
├── ja/
│   ├── common.json      # 共通翻訳
│   ├── news.json        # ニュース関連翻訳
│   └── summary.json     # サマリー関連翻訳
└── en/
    ├── common.json
    ├── news.json
    └── summary.json
```

### 使用方法

```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation('common')
  
  return <h1>{t('title')}</h1>
}
```

## 🎨 スタイリング

### Tailwind CSS

プロジェクトはTailwind CSSを使用しています：

```bash
# Tailwind設定ファイル
tailwind.config.ts

# グローバルスタイル
src/styles/globals.css
```

### レスポンシブデザイン

```typescript
// モバイルファースト設計
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* コンテンツ */}
</div>
```

## 📊 データ管理

### データソース

フロントエンドは静的JSONファイルからデータを読み込みます：

```
public/data/
├── news/
│   ├── YYYY-MM-DD/
│   │   ├── articles.json    # 日別記事データ
│   │   └── metadata.json    # メタデータ
│   └── latest.json          # 最新記事
├── summaries/
│   ├── YYYY-MM-DD.json      # 日次サマリー
│   └── latest.json          # 最新サマリー
└── config/
    ├── categories.json      # カテゴリ設定
    └── sources.json         # ソース設定
```

### データアクセス

```typescript
import { NewsService } from '@/lib/data/newsService'

// 最新ニュースを取得
const news = await NewsService.getLatestNews(20)

// 日次サマリーを取得
const summary = await NewsService.getDailySummary('2024-08-31')
```

## 🧪 テスト

### 単体テスト (Jest)

```bash
# テスト実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジ付き
npm run test:coverage
```

### E2Eテスト (Playwright)

```bash
# E2Eテスト実行
npm run test:e2e

# テストUI表示
npm run test:e2e:ui

# ヘッド付きテスト
npm run test:e2e:headed
```

### テストファイル構造

```
src/
├── components/__tests__/    # コンポーネントテスト
├── lib/__tests__/          # ライブラリテスト
└── __tests__/              # ページテスト

e2e/                        # E2Eテスト
├── news-flow.spec.ts
├── summary-flow.spec.ts
└── responsive.spec.ts
```

## 🔍 デバッグ

### 開発ツール

```bash
# TypeScriptエラーチェック
npm run type-check

# ESLintエラーチェック
npm run lint

# バンドルサイズ分析
npm run build:analyze
```

### ログ出力

```typescript
// 開発環境でのみログ出力
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data)
}
```

## 🚀 パフォーマンス最適化

### ビルド最適化

- 静的エクスポート (`output: 'export'`)
- コード分割 (自動)
- Tree shaking (自動)
- 画像最適化 (WebP/AVIF対応)

### ランタイム最適化

- React.memo でコンポーネント最適化
- useMemo/useCallback でレンダリング最適化
- Intersection Observer で遅延読み込み

### Vercel最適化

- Edge Functions対応
- 自動CDN配信
- 画像最適化
- キャッシュ設定

## 📈 監視とログ

### Vercel Analytics

```bash
# Vercel Analyticsを有効化
vercel analytics enable
```

### エラー監視

```typescript
// エラーバウンダリでエラーキャッチ
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

## 🔐 セキュリティ

### セキュリティヘッダー

```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
      ]
    }
  ]
}
```

### データサニタイゼーション

```typescript
import DOMPurify from 'dompurify'

// HTMLサニタイゼーション
const cleanHTML = DOMPurify.sanitize(userInput)
```

## 📚 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React i18next Documentation](https://react.i18next.com/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)

## 🆘 トラブルシューティング

### よくある問題

1. **ビルドエラー**
   ```bash
   npm run type-check  # TypeScriptエラー確認
   npm run lint        # ESLintエラー確認
   ```

2. **データが表示されない**
   ```bash
   # データファイルの確認
   ls -la public/data/news/
   ls -la public/data/summaries/
   ```

3. **デプロイエラー**
   ```bash
   # デプロイ準備スクリプト実行
   ../scripts/prepare-deploy.sh --check
   ```

4. **パフォーマンス問題**
   ```bash
   # バンドルサイズ分析
   npm run build:analyze
   ```

詳細なトラブルシューティングは [デプロイメントガイド](../docs/DEPLOYMENT.md) を参照してください。