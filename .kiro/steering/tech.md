# 技術仕様とアーキテクチャ

## SSG（Static Site Generation）運用

このプロジェクトは **SSG（Static Site Generation）専用** で運用されています。

### 重要な制約事項

#### 1. サーバーサイドレンダリング（SSR）は使用しない
- `getServerSideProps`は使用禁止
- `getStaticProps`と`getStaticPaths`のみ使用可能
- 全てのページは静的生成される

#### 2. クライアントサイド専用の値の扱い
- `window`オブジェクトや`document`オブジェクトを直接参照する場合は、必ずクライアントサイドでのマウント後に実行する
- SSRとクライアントサイドでの不一致（hydration error）を避けるため、以下のパターンを使用：

```typescript
const [isClient, setIsClient] = useState(false);

useEffect(() => {
  setIsClient(true);
}, []);

// 使用例
{isClient && (
  <div>Window Width: {window.innerWidth}px</div>
)}
```

#### 3. 動的な値の表示
- 現在時刻、画面サイズ、ブラウザ情報など、実行時に変わる値は必ずクライアントサイドでのみ表示
- サーバーサイドでは固定値またはプレースホルダーを使用

#### 4. ビルド時の静的生成
- 全てのページとデータは`npm run build`時に生成される
- 動的ルーティングは`getStaticPaths`で事前に定義されたパスのみ
- APIルートは使用しない（静的JSONファイルを使用）

### 開発時の注意点

1. **Hydration Errorの回避**
   - サーバーとクライアントで異なる値を表示しない
   - 条件分岐は`isClient`フラグを使用

2. **パフォーマンス最適化**
   - 静的生成のメリットを活かし、CDN配信を前提とした設計
   - 画像最適化、CSS最適化を積極的に活用

3. **デバッグ情報**
   - 開発時のデバッグ情報は`process.env.NODE_ENV === 'development'`で制御
   - 本番ビルドには含まれないようにする

### 対応済みコンポーネント

以下のコンポーネントはSSG対応済み：
- `ResponsiveTerminalLayout`
- `TerminalNewsItem`
- `MobileGeekNavigation`
- `responsive-geek-demo`ページ

### ビルドとデプロイ

```bash
# 静的サイト生成
npm run build

# 生成されたファイルは .next/out/ に出力される（設定による）
# CDNやホスティングサービスにそのままデプロイ可能
```

## フロントエンド技術スタック

- **フレームワーク**: Next.js 14 (SSG mode)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **国際化**: next-i18next
- **ビルドツール**: Next.js built-in bundler
- **デプロイ**: 静的ファイルホスティング（Vercel、Netlify、GitHub Pages等）

## パフォーマンス要件

- **First Load JS**: 130KB以下を維持
- **CSS**: 必要最小限のインライン化
- **画像**: Next.js Image最適化を活用
- **フォント**: Google Fonts with display=swap

## 品質保証

- **TypeScript**: 厳密な型チェック
- **ESLint**: Next.js推奨設定 + カスタムルール
- **ビルド時検証**: 全ページの静的生成成功を確認
- **Hydration**: クライアントサイド不一致エラーの回避