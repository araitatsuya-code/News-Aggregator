# 設計書

## 概要

AI News Aggregatorのフロントエンドを、開発者向けのギークっぽいデザインに刷新する。ターミナル風のUIとコードエディタ風の要素を組み合わせ、技術者にとって親しみやすく、機能的で美しいインターフェースを実現する。

## アーキテクチャ

### デザインシステムアーキテクチャ

```
ギークUIデザインシステム
├── テーマシステム
│   ├── ターミナルテーマ (ダーク/ライト)
│   ├── コードエディタテーマ
│   └── カラーパレット (Matrix Green, Hacker Blue, etc.)
├── コンポーネントライブラリ
│   ├── ターミナル風コンポーネント
│   ├── コードブロック風コンポーネント
│   └── ASCII アート要素
├── アニメーションシステム
│   ├── タイピングアニメーション
│   ├── コンパイル風エフェクト
│   └── ターミナル風トランジション
└── インタラクションシステム
    ├── キーボードショートカット
    ├── コマンドライン風ナビゲーション
    └── ホバーエフェクト
```

### 技術スタック

- **フレームワーク**: Next.js (既存)
- **スタイリング**: Tailwind CSS + カスタムCSS
- **フォント**: JetBrains Mono (メイン), Fira Code (コード表示)
- **アニメーション**: CSS Animations + Framer Motion
- **アイコン**: カスタムASCII アート + Lucide React
- **状態管理**: React Hooks (既存)

## コンポーネントと インターフェース

### 1. テーマシステム

#### カラーパレット

```typescript
// ターミナルテーマ
const terminalTheme = {
  background: {
    primary: '#0a0a0a',    // 深い黒
    secondary: '#1a1a1a',  // 少し明るい黒
    accent: '#2a2a2a',     // アクセント背景
  },
  text: {
    primary: '#00ff41',    // Matrix Green
    secondary: '#ffffff',  // 白
    muted: '#888888',      // グレー
    accent: '#00d4ff',     // サイバーブルー
    warning: '#ffaa00',    // オレンジ
    error: '#ff4444',      // 赤
  },
  border: {
    primary: '#333333',
    accent: '#00ff41',
    glow: 'rgba(0, 255, 65, 0.3)',
  }
}

// コードエディタテーマ
const editorTheme = {
  background: {
    primary: '#1e1e1e',    // VS Code Dark
    secondary: '#252526',
    line: '#2d2d30',
  },
  syntax: {
    keyword: '#569cd6',    // 青
    string: '#ce9178',     // オレンジ
    comment: '#6a9955',    // 緑
    function: '#dcdcaa',   // 黄
    variable: '#9cdcfe',   // 水色
  }
}
```

#### フォントシステム

```css
/* メインフォント: JetBrains Mono */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap');

/* コードフォント: Fira Code */
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600&display=swap');

.font-mono-primary {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
}

.font-mono-code {
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
}
```

### 2. レイアウトコンポーネント

#### TerminalLayout

```typescript
interface TerminalLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showPrompt?: boolean;
  theme?: 'dark' | 'light' | 'matrix';
}

// 機能:
// - ターミナル風の全体レイアウト
// - ASCII アートヘッダー
// - コマンドプロンプト風ナビゲーション
// - スキャンライン効果（オプション）
```

#### CodeEditorHeader

```typescript
interface CodeEditorHeaderProps {
  filename: string;
  language: string;
  modified?: boolean;
  onClose?: () => void;
}

// 機能:
// - ファイルタブ風のヘッダー
// - 言語表示
// - 変更状態インジケーター
// - 閉じるボタン
```

### 3. ニュース表示コンポーネント

#### TerminalNewsItem

```typescript
interface TerminalNewsItemProps {
  article: NewsItem;
  lineNumber: number;
  showSummary?: boolean;
  syntax?: 'terminal' | 'code' | 'json';
}

// 表示例:
// 001 | // AI News - Machine Learning Category
// 002 | const article = {
// 003 |   title: "新しいAI技術が発表される",
// 004 |   source: "TechCrunch",
// 005 |   published: "2025-09-29T10:00:00Z",
// 006 |   summary: "革新的なAI技術について...",
// 007 |   confidence: 0.95
// 008 | };
// 009 |
```

#### CodeBlockNewsList

```typescript
interface CodeBlockNewsListProps {
  articles: NewsItem[];
  language?: 'javascript' | 'python' | 'json';
  showLineNumbers?: boolean;
  highlightActive?: boolean;
}

// 機能:
// - コードエディタ風のニュース一覧
// - シンタックスハイライト風の色分け
// - 行番号表示
// - ホバー時のハイライト
```

### 4. フィルターコンポーネント

#### CommandLineFilter

```typescript
interface CommandLineFilterProps {
  categories: string[];
  onFilter: (command: string) => void;
  placeholder?: string;
}

// 使用例:
// $ filter --category="Machine Learning" --source="TechCrunch"
// $ search "AI" | grep "OpenAI"
// $ ls categories
// $ help filter
```

#### FunctionCallFilter

```typescript
interface FunctionCallFilterProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

// 表示例:
// filterNews({
//   categories: ["AI", "ML"],
//   dateRange: "last_week",
//   source: "all"
// });
```

### 5. アニメーションコンポーネント

#### TypingAnimation

```typescript
interface TypingAnimationProps {
  text: string;
  speed?: number;
  cursor?: boolean;
  onComplete?: () => void;
}

// 機能:
// - タイピング風のテキスト表示
// - カーソル点滅効果
// - 完了コールバック
```

#### CompileAnimation

```typescript
interface CompileAnimationProps {
  status: 'compiling' | 'success' | 'error';
  message?: string;
  duration?: number;
}

// 表示例:
// [INFO] Compiling news filters...
// [SUCCESS] 42 articles loaded successfully
// [ERROR] Failed to load category data
```

## データモデル

### テーマ設定

```typescript
interface GeekTheme {
  name: string;
  colors: {
    background: ColorPalette;
    text: ColorPalette;
    syntax: SyntaxColors;
    ui: UIColors;
  };
  fonts: {
    primary: string;
    code: string;
    ascii: string;
  };
  effects: {
    scanlines: boolean;
    glow: boolean;
    crt: boolean;
    typing: boolean;
  };
}

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
}

interface SyntaxColors {
  keyword: string;
  string: string;
  comment: string;
  function: string;
  variable: string;
  number: string;
}
```

### コマンドシステム

```typescript
interface Command {
  name: string;
  description: string;
  usage: string;
  aliases: string[];
  handler: (args: string[]) => Promise<CommandResult>;
}

interface CommandResult {
  success: boolean;
  output: string;
  data?: any;
}

// 実装するコマンド例:
// - help: ヘルプ表示
// - filter: ニュースフィルタリング
// - search: 検索
// - theme: テーマ変更
// - clear: 画面クリア
// - ls: 一覧表示
// - cat: 記事詳細表示
```

## エラーハンドリング

### ターミナル風エラー表示

```typescript
interface TerminalError {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  stack?: string;
  timestamp: Date;
}

// 表示例:
// [ERROR 404] News data not found
// at NewsService.getLatestNews (newsService.ts:42)
// at HomePage.render (index.tsx:18)
// 
// $ retry --force
// [INFO] Retrying with cached data...
// [SUCCESS] Loaded 25 articles from cache
```

### フォールバック表示

```typescript
// ASCII アート風のローディング
const loadingFrames = [
  "[ ⠋ ] Loading news...",
  "[ ⠙ ] Loading news...",
  "[ ⠹ ] Loading news...",
  "[ ⠸ ] Loading news...",
  "[ ⠼ ] Loading news...",
  "[ ⠴ ] Loading news...",
  "[ ⠦ ] Loading news...",
  "[ ⠧ ] Loading news...",
  "[ ⠇ ] Loading news...",
  "[ ⠏ ] Loading news..."
];
```

## テスト戦略

### ビジュアルリグレッションテスト

```typescript
// Storybook + Chromatic でのビジュアルテスト
describe('Geek UI Components', () => {
  test('TerminalNewsItem renders correctly', () => {
    // スナップショットテスト
  });
  
  test('Theme switching works properly', () => {
    // テーマ切り替えテスト
  });
  
  test('Animations complete successfully', () => {
    // アニメーションテスト
  });
});
```

### アクセシビリティテスト

```typescript
// Jest + Testing Library でのa11yテスト
describe('Accessibility', () => {
  test('Terminal UI is screen reader friendly', () => {
    // ARIAラベル、セマンティックHTML確認
  });
  
  test('Keyboard navigation works', () => {
    // キーボード操作テスト
  });
  
  test('Color contrast meets WCAG standards', () => {
    // コントラスト比テスト
  });
});
```

### パフォーマンステスト

```typescript
// Lighthouse CI での性能測定
describe('Performance', () => {
  test('Page load time under 3 seconds', () => {
    // ページ読み込み速度
  });
  
  test('Animation frame rate above 60fps', () => {
    // アニメーション性能
  });
  
  test('Bundle size increase under 50KB', () => {
    // バンドルサイズ影響
  });
});
```

## 実装フェーズ

### フェーズ1: 基盤システム
- テーマシステムの実装
- フォント設定
- 基本カラーパレット
- Tailwind設定拡張

### フェーズ2: コアコンポーネント
- TerminalLayout
- TerminalNewsItem
- CodeBlockNewsList
- 基本アニメーション

### フェーズ3: インタラクション
- CommandLineFilter
- キーボードショートカット
- コマンドシステム
- テーマ切り替え

### フェーズ4: 高度な機能
- ASCII アート
- 特殊エフェクト（スキャンライン等）
- パフォーマンス最適化
- アクセシビリティ改善

### フェーズ5: 統合とテスト
- 既存機能との統合
- レスポンシブ対応
- ブラウザ互換性
- 総合テスト

## パフォーマンス考慮事項

### 最適化戦略

1. **CSS-in-JS回避**: Tailwind + CSS Variables使用
2. **アニメーション最適化**: CSS Animations優先、JS最小限
3. **フォント最適化**: font-display: swap使用
4. **バンドル分割**: テーマ別コード分割
5. **プリロード**: 重要リソースのプリロード

### メモリ使用量

- アニメーション: requestAnimationFrame使用
- イベントリスナー: 適切なクリーンアップ
- DOM操作: 仮想化で大量データ対応

## セキュリティ考慮事項

### XSS対策
- ユーザー入力のサニタイズ
- dangerouslySetInnerHTML回避
- CSP設定

### プライバシー
- フォント外部読み込みの最小化
- 分析データの匿名化
- ローカルストレージの適切な使用

## 国際化対応

### 多言語サポート
- ASCII アートの言語対応
- フォント選択の地域対応
- RTL言語への配慮

### 文化的配慮
- 色の文化的意味の考慮
- 地域別のデザイン嗜好
- アクセシビリティ基準の地域差