# 設計書

## 概要

AIニュースまとめサイトは、Pythonによるデータ処理バックエンドとNext.jsによるフロントエンドを組み合わせた静的サイト生成システムです。Docker化されたPython処理システムがRSSフィードからニュースを収集し、Claude APIで要約・翻訳を行い、静的JSONファイルとして出力します。Next.jsフロントエンドはこのJSONデータを読み込んで表示します。

## アーキテクチャ

### システム全体構成

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Python Docker     │    │   Static JSON Files  │    │   Next.js Frontend  │
│   Container         │───▶│   (Data Layer)       │───▶│   (Presentation)    │
│                     │    │                      │    │                     │
│ • RSS Collection    │    │ • news/YYYY-MM-DD/   │    │ • React Components  │
│ • AI Summarization  │    │ • summaries/         │    │ • Static Generation │
│ • Translation       │    │ • trends/            │    │ • Responsive UI     │
│ • Trend Analysis    │    │                      │    │ • Multi-language    │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
```

### データフロー

1. **収集フェーズ**: RSSCollectorが複数のソースから記事を取得
2. **処理フェーズ**: ClaudeSummarizerが要約・翻訳・トレンド分析を実行
3. **出力フェーズ**: DataManagerが構造化されたJSONファイルを生成
4. **表示フェーズ**: Next.jsがJSONを読み込み、静的サイトとして配信

## コンポーネントとインターフェース

### Pythonデータ処理システム

#### RSSCollector
```python
class RSSCollector:
    def __init__(self, sources: List[RSSSource])
    async def collect_all(self) -> List[RawNewsItem]
    def parse_feed(self, url: str) -> List[RawNewsItem]
    def normalize_article(self, entry: Any, source: RSSSource) -> RawNewsItem
    def deduplicate(self, articles: List[RawNewsItem]) -> List[RawNewsItem]
```

#### ClaudeSummarizer
```python
class ClaudeSummarizer:
    def __init__(self, api_key: str, batch_size: int = 5)
    async def summarize_article(self, article: RawNewsItem) -> NewsItem
    async def translate_to_japanese(self, text: str) -> str
    async def analyze_daily_trends(self, articles: List[NewsItem]) -> DailySummary
    def batch_process(self, articles: List[RawNewsItem]) -> List[NewsItem]
```

#### DataManager
```python
class DataManager:
    def __init__(self, output_path: str)
    def save_daily_news(self, date: str, articles: List[NewsItem]) -> None
    def save_daily_summary(self, summary: DailySummary) -> None
    def load_existing_data(self, date: str) -> Optional[List[NewsItem]]
    def cleanup_old_data(self, retention_days: int) -> None
```

### Next.jsフロントエンドシステム

#### データアクセス層
```typescript
// lib/data/newsService.ts
export class NewsService {
  static async getLatestNews(limit: number = 20): Promise<NewsItem[]>
  static async getDailyNews(date: string): Promise<NewsItem[]>
  static async getDailySummary(date: string): Promise<DailySummary>
  static async getNewsByCategory(category: string): Promise<NewsItem[]>
}
```

#### コンポーネント層
```typescript
// components/news/NewsList.tsx
interface NewsListProps {
  articles: NewsItem[]
  showSummary?: boolean
  categoryFilter?: string
}

// components/summary/DailySummary.tsx
interface DailySummaryProps {
  summary: DailySummary
  showTrends?: boolean
}

// components/layout/Header.tsx
interface HeaderProps {
  currentLocale: string
  onLocaleChange: (locale: string) => void
}
```

## データモデル

### 共通データ型

```python
# shared/types.py
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional, Dict, Literal

@dataclass
class RSSSource:
    url: str
    category: str
    language: Literal['ja', 'en']
    name: str
    enabled: bool = True

@dataclass
class RawNewsItem:
    title: str
    url: str
    published_at: datetime
    source: RSSSource
    content: Optional[str] = None
    
@dataclass
class NewsItem:
    id: str
    title: str
    original_title: str
    summary: str
    url: str
    source: str
    category: str
    published_at: datetime
    language: Literal['ja', 'en']
    tags: List[str]
    ai_confidence: float

@dataclass
class DailySummary:
    date: str
    total_articles: int
    top_trends: List[str]
    significant_news: List[NewsItem]
    category_breakdown: Dict[str, int]
    summary_ja: str
    summary_en: str
    generated_at: datetime
```

### JSONファイル構造

```
frontend/public/data/
├── news/
│   ├── 2024-08-31/
│   │   ├── articles.json      # NewsItem[]
│   │   └── metadata.json      # { total: number, categories: string[] }
│   └── latest.json            # 最新20件のNewsItem[]
├── summaries/
│   ├── 2024-08-31.json        # DailySummary
│   └── latest.json            # 最新のDailySummary
└── config/
    ├── categories.json        # カテゴリ一覧
    └── sources.json          # ソース一覧
```

## エラーハンドリング

### Python処理システム

#### RSS収集エラー
```python
class RSSCollectionError(Exception):
    def __init__(self, source: str, reason: str):
        self.source = source
        self.reason = reason
        super().__init__(f"RSS collection failed for {source}: {reason}")

# エラーハンドリング戦略
try:
    articles = await collector.collect_all()
except RSSCollectionError as e:
    logger.warning(f"Source {e.source} failed: {e.reason}")
    # 他のソースは継続処理
except Exception as e:
    logger.error(f"Critical error in collection: {e}")
    # 前日データで継続 or 処理停止
```

#### AI処理エラー
```python
class AIProcessingError(Exception):
    pass

# リトライ機能付きエラーハンドリング
async def summarize_with_retry(article: RawNewsItem, max_retries: int = 3) -> Optional[NewsItem]:
    for attempt in range(max_retries):
        try:
            return await summarizer.summarize_article(article)
        except AIProcessingError as e:
            if attempt == max_retries - 1:
                logger.error(f"Failed to process article {article.id} after {max_retries} attempts")
                return None
            await asyncio.sleep(2 ** attempt)  # Exponential backoff
```

### Next.jsフロントエンド

#### データ読み込みエラー
```typescript
// lib/data/errorHandling.ts
export class DataLoadError extends Error {
  constructor(public dataType: string, public date?: string) {
    super(`Failed to load ${dataType}${date ? ` for ${date}` : ''}`)
  }
}

// エラーバウンダリ
export function withErrorBoundary<T>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return function ErrorBoundaryWrapper(props: T) {
    return (
      <ErrorBoundary fallback={<ErrorFallback />}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
```

## テスト戦略

### Pythonシステムテスト

#### 単体テスト
```python
# tests/test_rss_collector.py
class TestRSSCollector:
    def test_parse_feed_valid_rss(self):
        # 正常なRSSフィードの解析テスト
        
    def test_parse_feed_invalid_rss(self):
        # 不正なRSSフィードのエラーハンドリングテスト
        
    def test_deduplicate_articles(self):
        # 重複記事除去のテスト

# tests/test_claude_summarizer.py  
class TestClaudeSummarizer:
    @pytest.mark.asyncio
    async def test_summarize_article(self):
        # 記事要約機能のテスト
        
    def test_batch_processing(self):
        # バッチ処理のテスト
```

#### 統合テスト
```python
# tests/integration/test_full_pipeline.py
class TestFullPipeline:
    @pytest.mark.asyncio
    async def test_end_to_end_processing(self):
        # RSS収集からJSON出力までの全体テスト
        
    def test_error_recovery(self):
        # エラー発生時の復旧テスト
```

### Next.jsフロントエンドテスト

#### コンポーネントテスト
```typescript
// __tests__/components/NewsList.test.tsx
describe('NewsList', () => {
  it('renders news articles correctly', () => {
    // ニュース一覧の表示テスト
  })
  
  it('handles empty news list', () => {
    // 空のニュースリストの処理テスト
  })
  
  it('filters by category', () => {
    // カテゴリフィルタのテスト
  })
})
```

#### E2Eテスト
```typescript
// e2e/news-flow.spec.ts
test('user can browse news and view summaries', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-testid="news-list"]')).toBeVisible()
  await page.click('[data-testid="daily-summary-link"]')
  await expect(page.locator('[data-testid="daily-summary"]')).toBeVisible()
})
```

## パフォーマンス考慮事項

### Pythonデータ処理

#### API使用量最適化
- Claude APIのバッチ処理（5記事/回）
- レート制限対応（指数バックオフ）
- キャッシュ機能（既処理記事のスキップ）

#### メモリ使用量最適化
```python
# ストリーミング処理でメモリ使用量を抑制
async def process_articles_stream(articles: AsyncIterator[RawNewsItem]) -> AsyncIterator[NewsItem]:
    async for article in articles:
        processed = await summarizer.summarize_article(article)
        if processed:
            yield processed
```

### Next.jsフロントエンド

#### 静的生成最適化
```typescript
// next.config.js
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: {
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  }
}
```

#### 画像とアセット最適化
- WebP形式の画像使用
- CSS/JSの最小化
- 遅延読み込み（Intersection Observer）

## セキュリティ考慮事項

### API キー管理
```python
# 環境変数からの安全な読み込み
import os
from typing import Optional

class Config:
    @staticmethod
    def get_claude_api_key() -> Optional[str]:
        key = os.getenv('CLAUDE_API_KEY')
        if not key:
            raise ValueError("CLAUDE_API_KEY environment variable is required")
        return key
```

### データ検証
```python
# 入力データの検証
from pydantic import BaseModel, HttpUrl, validator

class RSSSourceModel(BaseModel):
    url: HttpUrl
    category: str
    language: str
    
    @validator('language')
    def validate_language(cls, v):
        if v not in ['ja', 'en']:
            raise ValueError('Language must be ja or en')
        return v
```

### XSS対策
```typescript
// DOMPurifyを使用したサニタイゼーション
import DOMPurify from 'dompurify'

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
    ALLOWED_ATTR: []
  })
}
```

## 国際化対応

### Next.js i18n設定
```typescript
// next-i18next.config.js
module.exports = {
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
  },
  fallbackLng: {
    default: ['ja'],
  },
  interpolation: {
    escapeValue: false,
  },
}
```

### 多言語リソース構造
```
frontend/src/locales/
├── ja/
│   ├── common.json
│   ├── news.json
│   └── summary.json
└── en/
    ├── common.json
    ├── news.json
    └── summary.json
```

## デプロイメント戦略

### Docker化
```dockerfile
# docker/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# システム依存関係
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python依存関係
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーション
COPY scripts/ ./scripts/
COPY shared/ ./shared/

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

CMD ["python", "scripts/main.py"]
```

### CI/CD パイプライン
```yaml
# .github/workflows/deploy.yml
name: Deploy AI News Aggregator

on:
  schedule:
    - cron: '0 17 * * *'  # 毎日17時に実行
  workflow_dispatch:

jobs:
  process-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run data processing
        run: |
          docker-compose up --build news-processor
      - name: Upload processed data
        uses: actions/upload-artifact@v3
        with:
          name: processed-data
          path: frontend/public/data/
          
  deploy-frontend:
    needs: process-data
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Download processed data
        uses: actions/download-artifact@v3
        with:
          name: processed-data
          path: frontend/public/data/
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 監視とログ

### ログ設定
```python
# scripts/utils/logger.py
import logging
import sys
from datetime import datetime

def setup_logger(name: str, level: str = "INFO") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))
    
    # コンソールハンドラ
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(
        logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    )
    logger.addHandler(console_handler)
    
    # ファイルハンドラ
    file_handler = logging.FileHandler(f'logs/{name}_{datetime.now().strftime("%Y%m%d")}.log')
    file_handler.setFormatter(
        logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
        )
    )
    logger.addHandler(file_handler)
    
    return logger
```

### メトリクス収集
```python
# scripts/utils/metrics.py
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Any

@dataclass
class ProcessingMetrics:
    start_time: datetime
    end_time: datetime
    articles_collected: int
    articles_processed: int
    articles_failed: int
    api_calls_made: int
    errors: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'duration_seconds': (self.end_time - self.start_time).total_seconds(),
            'success_rate': self.articles_processed / max(self.articles_collected, 1),
            'articles_collected': self.articles_collected,
            'articles_processed': self.articles_processed,
            'articles_failed': self.articles_failed,
            'api_calls_made': self.api_calls_made,
            'error_count': len(self.errors)
        }
```