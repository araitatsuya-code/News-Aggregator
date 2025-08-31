# データアクセス層 (Data Access Layer)

このディレクトリには、AI News Aggregatorのフロントエンドで使用するデータアクセス層の実装が含まれています。

## 概要

データアクセス層は、静的JSONファイルからニュースデータを読み込み、エラーハンドリングを提供する責任を持ちます。

## 主要コンポーネント

### NewsService

`NewsService`クラスは、すべてのデータアクセス機能を提供するメインサービスです。

#### 主要メソッド

- `getLatestNews(limit?: number)`: 最新ニュースを取得
- `getDailyNews(date: string)`: 指定日のニュースを取得
- `getDailySummary(date: string)`: 指定日のサマリーを取得
- `getLatestSummary()`: 最新のサマリーを取得
- `getNewsByCategory(category: string)`: カテゴリ別ニュースを取得
- `getCategories()`: 利用可能なカテゴリ一覧を取得
- `getSources()`: ニュースソース一覧を取得

#### 使用例

```typescript
import { NewsService } from '../lib/data/newsService';

// 最新ニュース20件を取得
const latestNews = await NewsService.getLatestNews(20);

// 特定日のニュースを取得
const dailyNews = await NewsService.getDailyNews('2025-08-31');

// カテゴリ別ニュースを取得
const redditNews = await NewsService.getNewsByCategory('Reddit');
```

### DataLoadError

カスタムエラークラスで、データ読み込み失敗時の詳細情報を提供します。

```typescript
export class DataLoadError extends Error {
  constructor(public dataType: string, public date?: string) {
    super(`Failed to load ${dataType}${date ? ` for ${date}` : ''}`);
  }
}
```

## React統合

### useDataLoader Hook

データ読み込みとローディング状態管理を簡素化するカスタムフックです。

```typescript
import { useDataLoader } from '../lib/hooks/useDataLoader';
import { NewsService } from '../lib/data/newsService';

function MyComponent() {
  const { data, loading, error } = useDataLoader(
    () => NewsService.getLatestNews(),
    [] // 依存配列
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <DataError error={error} />;
  
  return <div>{/* データを表示 */}</div>;
}
```

### useNewsData Hook

ニュースデータ専用のフック。フォールバックデータをサポートします。

```typescript
const { data, loading, error, hasFallback } = useNewsData(
  () => NewsService.getLatestNews(),
  fallbackData, // オプション: エラー時のフォールバックデータ
  []
);
```

## エラーハンドリング

### DataError コンポーネント

データ読み込みエラーを表示するためのコンポーネントです。

```typescript
import { DataError } from '../components/DataError';

function MyComponent() {
  const { data, loading, error } = useDataLoader(loadFunction);
  
  if (error) {
    return <DataError error={error} onRetry={() => window.location.reload()} />;
  }
  
  // ...
}
```

### ErrorBoundary

Reactエラーをキャッチするためのエラーバウンダリです。

```typescript
import { ErrorBoundary } from '../components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## データ構造

### NewsItem

```typescript
interface NewsItem {
  id: string;
  title: string;
  original_title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  published_at: string;
  language: 'ja' | 'en';
  tags: string[];
  ai_confidence: number;
}
```

### DailySummary

```typescript
interface DailySummary {
  date: string;
  total_articles: number;
  top_trends: string[];
  significant_news: NewsItem[];
  category_breakdown: Record<string, number>;
  summary_ja: string;
  summary_en: string;
  generated_at: string;
}
```

## ファイル構造

```
frontend/public/data/
├── news/
│   ├── latest.json           # 最新ニュース
│   └── YYYY-MM-DD/
│       ├── articles.json     # 日別ニュース
│       └── metadata.json     # メタデータ
├── summaries/
│   ├── latest.json           # 最新サマリー
│   └── YYYY-MM-DD.json       # 日別サマリー
└── config/
    ├── categories.json       # カテゴリ一覧
    └── sources.json          # ソース一覧
```

## テスト

テストファイルは `__tests__` ディレクトリに配置されています。

```bash
# テスト実行
npm test newsService.test.ts
```

## パフォーマンス考慮事項

- データは静的JSONファイルとして提供されるため、CDNキャッシュが効果的
- `useDataLoader`フックは依存配列を使用してリクエストを最適化
- エラー時のフォールバック機能により、ユーザー体験を向上

## 今後の拡張

- キャッシュ機能の追加
- オフライン対応
- リアルタイム更新機能
- 検索機能の追加