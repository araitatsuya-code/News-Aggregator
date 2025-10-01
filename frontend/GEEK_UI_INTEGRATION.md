# ギーク向けUI統合ドキュメント

## 概要

このドキュメントでは、AI News Aggregatorのギーク向けUI統合について説明します。既存の機能を維持しながら、ターミナル風・コードエディタ風のUIを提供する新しいデザインシステムが実装されています。

## 実装された機能

### 1. 新しいギーク向けページ

#### `/geek-index` - ギーク向けホームページ
- ターミナル風レイアウトでニュース一覧を表示
- 関数呼び出し風とコマンドライン風の2つのフィルターモード
- リアルタイム統計情報の表示
- ASCII アートロゴとシステム情報

#### `/geek-summary` - ギーク向けサマリーページ
- コードブロック風の日次サマリー表示
- 関数風の日付ナビゲーション
- トレンド分析のオブジェクト表示
- インタラクティブな日付選択

#### `/geek-categories` - ギーク向けカテゴリページ
- カテゴリ統計のオブジェクト表示
- クリック可能なカテゴリ選択
- パフォーマンス統計の表示
- 高度なフィルター機能

### 2. モード切り替え機能

#### `GeekModeToggle` コンポーネント
- 通常モードとギークモードの切り替え
- ローカルストレージでの設定保存
- 自動ページリダイレクト
- レスポンシブ対応

#### `useGeekMode` フック
- モード状態の管理
- URLベースのモード検出
- 設定の永続化

#### `GeekModeRedirect` コンポーネント
- 自動的なページリダイレクト
- モード設定に基づく適切なページ表示

### 3. 既存機能との統合

#### データ取得
- 既存の`NewsService`を使用
- `useNewsDataWithFallback`でエラーハンドリング
- `useCategoryFilter`でフィルタリング機能
- `useDateNavigation`で日付ナビゲーション

#### 多言語対応
- 既存の`next-i18next`システムを継承
- 日本語・英語の両方でギークUIを提供
- 翻訳キーの再利用

#### SEO機能
- 既存のSEOユーティリティを使用
- ギークモード専用のメタデータ
- 構造化データの維持

#### エラーハンドリング
- `ErrorBoundary`コンポーネントの活用
- ターミナル風エラー表示
- フォールバック機能の継承

## アーキテクチャ

### コンポーネント構造

```
src/
├── components/
│   ├── geek/
│   │   ├── GeekModeToggle.tsx          # モード切り替え
│   │   ├── ResponsiveTerminalLayout.tsx # レスポンシブレイアウト
│   │   ├── TerminalNewsItem.tsx        # ニュース表示
│   │   ├── FunctionCallFilter.tsx      # 関数風フィルター
│   │   ├── CommandLineFilter.tsx       # コマンドライン風フィルター
│   │   ├── ASCIILoader.tsx            # ローディング表示
│   │   ├── TerminalError.tsx          # エラー表示
│   │   └── ErrorHandlingSystem.tsx    # エラーハンドリング
│   └── layout/
│       └── Header.tsx                  # ヘッダー（モード切り替え追加）
├── pages/
│   ├── geek-index.tsx                 # ギーク向けホーム
│   ├── geek-summary.tsx               # ギーク向けサマリー
│   └── geek-categories.tsx            # ギーク向けカテゴリ
└── styles/
    └── globals.css                    # ギーク向けスタイル
```

### テーマシステム

#### CSS変数ベースのテーマ
```css
:root {
  /* ターミナルテーマ */
  --terminal-bg-primary: #0a0a0a;
  --terminal-text-primary: #00ff41;
  --terminal-border-accent: #00ff41;
  
  /* エディタテーマ */
  --editor-bg-primary: #1e1e1e;
  --editor-syntax-keyword: #569cd6;
  --editor-syntax-string: #ce9178;
}
```

#### 利用可能なテーマ
- `matrix` - Matrix風グリーンテーマ
- `hacker` - ハッカー風サイアンテーマ
- `cyber` - サイバーパンク風パープルテーマ
- `terminal` - 標準ターミナルテーマ

### レスポンシブ対応

#### ブレークポイント
- モバイル: `< 640px`
- タブレット: `640px - 1024px`
- デスクトップ: `> 1024px`

#### モバイル最適化
- タッチフレンドリーなボタンサイズ（44px以上）
- 簡略化されたASCII アート
- コンパクトなコードブロック表示
- スワイプジェスチャー対応

## アクセシビリティ

### WCAG 2.1 AA準拠

#### キーボードナビゲーション
- すべてのインタラクティブ要素がキーボードでアクセス可能
- 適切なフォーカス表示
- タブオーダーの最適化

#### スクリーンリーダー対応
- セマンティックHTMLの使用
- 適切なARIAラベル
- ライブリージョンでの動的コンテンツ通知

#### カラーコントラスト
- WCAG AA基準（4.5:1）以上のコントラスト比
- 高コントラストモード対応
- カラーブラインド対応（色以外の情報伝達手段）

#### アニメーション制御
- `prefers-reduced-motion`の尊重
- アニメーション無効化オプション
- 重要なフィードバックアニメーションの保持

## パフォーマンス

### 最適化戦略

#### バンドルサイズ
- 既存のFirst Load JS: 130KB以下を維持
- ギーク向けコンポーネントの遅延読み込み
- CSS-in-JSの回避（Tailwind + CSS Variables使用）

#### レンダリング最適化
- React.memoによるコンポーネント最適化
- useCallbackによるイベントハンドラー最適化
- 仮想化による大量データ対応

#### アニメーション最適化
- CSS Animationsの優先使用
- requestAnimationFrameによるJSアニメーション
- GPU加速の活用

## テスト戦略

### テストカバレッジ

#### 単体テスト
- コンポーネントの基本機能
- アクセシビリティ準拠
- エラーハンドリング
- パフォーマンス

#### 統合テスト
- ページ全体の動作
- データフロー
- ユーザーインタラクション
- 多言語対応

#### アクセシビリティテスト
- jest-axeによる自動テスト
- キーボードナビゲーション
- スクリーンリーダー対応
- カラーコントラスト

### テスト実行

```bash
# 単体テスト
npm run test -- --testPathPattern=geek --watchAll=false

# 統合テスト
npm run test -- --testPathPattern=integration --watchAll=false

# アクセシビリティテスト
npm run test -- --testPathPattern=accessibility --watchAll=false

# 全テスト
npm run test -- --watchAll=false
```

## 使用方法

### 基本的な使用方法

1. **モード切り替え**
   - ヘッダーの「geek()」ボタンをクリック
   - 自動的にギーク向けページにリダイレクト

2. **フィルター機能**
   - 関数呼び出し風フィルター: `filterNews({ category: "AI" })`
   - コマンドライン風フィルター: `$ filter --category="AI"`

3. **ナビゲーション**
   - キーボードショートカット対応
   - タッチジェスチャー対応

### 開発者向け使用方法

#### 新しいギーク向けコンポーネントの作成

```tsx
import { ResponsiveTerminalLayout } from '@/components/geek';

export const MyGeekComponent = () => {
  return (
    <ResponsiveTerminalLayout
      theme="matrix"
      showHeader={true}
      showPrompt={true}
    >
      {/* コンテンツ */}
    </ResponsiveTerminalLayout>
  );
};
```

#### カスタムテーマの追加

```css
[data-theme="custom"] {
  --terminal-bg-primary: #your-color;
  --terminal-text-primary: #your-color;
  /* その他の変数 */
}
```

## トラブルシューティング

### よくある問題

#### 1. Hydration エラー
**問題**: サーバーとクライアントでの表示差異
**解決策**: `isClient`フラグを使用してクライアントサイド専用の表示を制御

```tsx
const [isClient, setIsClient] = useState(false);

useEffect(() => {
  setIsClient(true);
}, []);

return (
  <div>
    {isClient && <ClientOnlyComponent />}
  </div>
);
```

#### 2. パフォーマンス問題
**問題**: 大量データでの描画遅延
**解決策**: 仮想化とメモ化の活用

```tsx
const MemoizedNewsItem = React.memo(TerminalNewsItem);

// 仮想化の実装
const virtualizedList = useMemo(() => {
  return articles.slice(0, visibleCount);
}, [articles, visibleCount]);
```

#### 3. アクセシビリティ問題
**問題**: スクリーンリーダーでの読み上げ問題
**解決策**: 適切なARIAラベルとセマンティックHTML

```tsx
<button
  aria-label="ギークモードに切り替え"
  role="button"
  tabIndex={0}
>
  geek()
</button>
```

### デバッグ方法

#### 1. コンソールログ
```tsx
// 開発環境でのみログ出力
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

#### 2. React Developer Tools
- コンポーネントの状態確認
- パフォーマンスプロファイリング
- メモリリーク検出

#### 3. アクセシビリティ検証
```bash
# jest-axeでの自動テスト
npm run test -- --testPathPattern=accessibility

# 手動検証ツール
# - WAVE (Web Accessibility Evaluation Tool)
# - axe DevTools
# - Lighthouse
```

## 今後の拡張予定

### Phase 1: 追加機能
- [ ] カスタムテーマエディター
- [ ] キーボードショートカットカスタマイズ
- [ ] 音響効果の追加
- [ ] より多くのASCII アートパターン

### Phase 2: 高度な機能
- [ ] ターミナルコマンド履歴
- [ ] マクロ機能
- [ ] プラグインシステム
- [ ] AI支援コマンド

### Phase 3: 統合強化
- [ ] 他のページへのギークUI拡張
- [ ] PWA対応
- [ ] オフライン機能
- [ ] パフォーマンス監視

## 貢献ガイドライン

### コードスタイル
- TypeScriptの厳密な型チェック
- ESLintルールの遵守
- Prettierによるフォーマット
- 日本語コメントの使用

### テスト要件
- 新機能には対応するテストを作成
- アクセシビリティテストの実装
- パフォーマンステストの追加
- 80%以上のテストカバレッジ

### ドキュメント更新
- 新機能の使用方法を記載
- トラブルシューティング情報の追加
- アクセシビリティガイドラインの更新

## 参考資料

### 技術仕様
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### デザインインスピレーション
- [Terminal.css](https://terminalcss.xyz/)
- [Matrix Digital Rain](https://github.com/akinuri/js-matrix-digital-rain)
- [Cyberpunk UI](https://github.com/topics/cyberpunk-ui)

### アクセシビリティリソース
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)