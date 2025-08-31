module.exports = {
  plugins: {
    // Tailwind CSS
    tailwindcss: {},
    
    // ベンダープレフィックス自動追加
    autoprefixer: {},
    
    // 本番環境でのCSS最適化
    ...(process.env.NODE_ENV === 'production' && {
      // CSS最適化
      cssnano: {
        preset: ['default', {
          // コメント削除
          discardComments: { removeAll: true },
          // 空白正規化
          normalizeWhitespace: true,
          // セレクタ最適化
          minifySelectors: true,
          // 重複ルール削除
          discardDuplicates: true,
          // 未使用ルール削除
          discardUnused: true,
          // カラー値最適化
          colormin: true,
          // フォント最適化
          minifyFontValues: true,
          // グラデーション最適化
          minifyGradients: true,
          // パラメータ最適化
          minifyParams: true,
          // セレクタソート
          sortMediaQueries: true,
        }]
      },
      
      // 未使用CSS削除（PurgeCSS）
      '@fullhuman/postcss-purgecss': {
        content: [
          './src/pages/**/*.{js,ts,jsx,tsx}',
          './src/components/**/*.{js,ts,jsx,tsx}',
          './src/lib/**/*.{js,ts,jsx,tsx}',
        ],
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
        safelist: {
          // 動的に生成されるクラス名を保護
          standard: [
            /^animate-/,
            /^transition-/,
            /^duration-/,
            /^ease-/,
            /^delay-/,
            /^hover:/,
            /^focus:/,
            /^active:/,
            /^group-hover:/,
            /^sm:/,
            /^md:/,
            /^lg:/,
            /^xl:/,
            /^2xl:/,
          ],
          deep: [
            // React Transition Group用
            /enter/,
            /exit/,
            /appear/,
            // カスタムアニメーション用
            /slide/,
            /fade/,
            /scale/,
          ],
          greedy: [
            // 動的に生成される可能性のあるクラス
            /data-/,
            /aria-/,
          ]
        }
      }
    })
  },
}