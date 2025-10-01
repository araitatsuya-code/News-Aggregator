import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // ターミナルテーマカラー
        terminal: {
          bg: {
            primary: 'var(--terminal-bg-primary)',
            secondary: 'var(--terminal-bg-secondary)',
            accent: 'var(--terminal-bg-accent)',
          },
          text: {
            primary: 'var(--terminal-text-primary)',
            secondary: 'var(--terminal-text-secondary)',
            muted: 'var(--terminal-text-muted)',
            accent: 'var(--terminal-text-accent)',
            warning: 'var(--terminal-text-warning)',
            error: 'var(--terminal-text-error)',
          },
          border: {
            primary: 'var(--terminal-border-primary)',
            accent: 'var(--terminal-border-accent)',
            glow: 'var(--terminal-border-glow)',
          },
        },
        // コードエディタテーマカラー
        editor: {
          bg: {
            primary: 'var(--editor-bg-primary)',
            secondary: 'var(--editor-bg-secondary)',
            line: 'var(--editor-bg-line)',
          },
          syntax: {
            keyword: 'var(--editor-syntax-keyword)',
            string: 'var(--editor-syntax-string)',
            comment: 'var(--editor-syntax-comment)',
            function: 'var(--editor-syntax-function)',
            variable: 'var(--editor-syntax-variable)',
            number: 'var(--editor-syntax-number)',
          },
        },
        // Matrix風カラー
        matrix: {
          green: '#00ff41',
          'green-dark': '#00cc33',
          'green-light': '#66ff80',
          'green-glow': 'rgba(0, 255, 65, 0.3)',
        },
        // サイバーパンク風カラー
        cyber: {
          blue: '#00d4ff',
          purple: '#b300ff',
          pink: '#ff0080',
          orange: '#ff6600',
        },
      },
      fontFamily: {
        // モノスペースフォント
        'mono-primary': ['JetBrains Mono', 'Courier New', 'monospace'],
        'mono-code': ['Fira Code', 'JetBrains Mono', 'monospace'],
        'mono-ascii': ['Courier New', 'monospace'],
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        // ギーク向けアニメーション
        'typing': 'typing 3s steps(40, end)',
        'blink': 'blink 1s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scanline': 'scanline 2s linear infinite',
        'matrix-rain': 'matrixRain 20s linear infinite',
        'compile': 'compile 2s ease-in-out',
        'terminal-boot': 'terminalBoot 1s ease-out',
        // コマンドライン専用アニメーション
        'fade-in-out': 'fadeInOut 3s ease-in-out',
        'slide-up-enter': 'slideUpEnter 0.3s ease-out',
        'slide-down-exit': 'slideDownExit 0.3s ease-in',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'cursor-blink': 'cursorBlink 1s step-end infinite',
        'command-execute': 'commandExecute 0.8s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        // ギーク向けキーフレーム
        typing: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        glow: {
          '0%': { 
            boxShadow: '0 0 5px var(--terminal-text-primary), 0 0 10px var(--terminal-text-primary)',
          },
          '100%': { 
            boxShadow: '0 0 10px var(--terminal-text-primary), 0 0 20px var(--terminal-text-primary), 0 0 30px var(--terminal-text-primary)',
          },
        },
        scanline: {
          '0%': { transform: 'translateY(-100vh)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        matrixRain: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        compile: {
          '0%': { width: '0%' },
          '50%': { width: '100%' },
          '100%': { width: '100%', backgroundColor: 'var(--terminal-text-primary)' },
        },
        terminalBoot: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '50%': { opacity: '0.5' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // コマンドライン専用キーフレーム
        fadeInOut: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '10%, 90%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-10px)' },
        },
        slideUpEnter: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDownExit: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(20px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px var(--terminal-border-glow)' },
          '50%': { boxShadow: '0 0 20px var(--terminal-border-glow), 0 0 30px var(--terminal-border-glow)' },
        },
        cursorBlink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        commandExecute: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    // アクセシビリティ対応のプラグイン
    function({ addUtilities, theme }: any) {
      const newUtilities = {
        // スクリーンリーダー専用クラス
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        },
        '.sr-only:focus': {
          position: 'static',
          width: 'auto',
          height: 'auto',
          padding: 'inherit',
          margin: 'inherit',
          overflow: 'visible',
          clip: 'auto',
          whiteSpace: 'normal',
        },
        // フォーカス可視化
        '.focus-visible': {
          outline: '2px solid var(--terminal-border-accent)',
          outlineOffset: '2px',
        },
        // タッチターゲットサイズ
        '.touch-target': {
          minHeight: '44px',
          minWidth: '44px',
        },
        // 高コントラストモード対応
        '.high-contrast': {
          '@media (prefers-contrast: high)': {
            borderWidth: '2px',
            fontWeight: 'bold',
          },
        },
        // モーション軽減対応
        '.motion-safe': {
          '@media (prefers-reduced-motion: no-preference)': {
            animation: 'inherit',
            transition: 'inherit',
          },
        },
        '.motion-reduce': {
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
            transition: 'none',
          },
        },
        // カラーコントラスト対応
        '.contrast-more': {
          '@media (prefers-contrast: more)': {
            filter: 'contrast(1.5)',
          },
        },
        // フォーカストラップ
        '.focus-trap': {
          '&:focus-within': {
            outline: '2px solid var(--terminal-border-accent)',
            outlineOffset: '2px',
          },
        },
        // アクセシブルなボタンスタイル
        '.btn-accessible': {
          minHeight: '44px',
          minWidth: '44px',
          padding: '0.5rem 1rem',
          border: '2px solid transparent',
          borderRadius: '0.375rem',
          fontSize: '1rem',
          fontWeight: '500',
          lineHeight: '1.5',
          textAlign: 'center',
          textDecoration: 'none',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:focus': {
            outline: '2px solid var(--terminal-border-accent)',
            outlineOffset: '2px',
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
          },
        },
        // アクセシブルなリンクスタイル
        '.link-accessible': {
          color: 'var(--terminal-text-accent)',
          textDecoration: 'underline',
          textUnderlineOffset: '2px',
          '&:hover': {
            textDecorationThickness: '2px',
          },
          '&:focus': {
            outline: '2px solid var(--terminal-border-accent)',
            outlineOffset: '2px',
            borderRadius: '2px',
          },
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
          },
        },
        // スキップリンク
        '.skip-link': {
          position: 'absolute',
          top: '-40px',
          left: '6px',
          background: 'var(--terminal-bg-primary)',
          color: 'var(--terminal-text-primary)',
          padding: '8px',
          textDecoration: 'none',
          borderRadius: '4px',
          border: '2px solid var(--terminal-border-accent)',
          zIndex: '1000',
          '&:focus': {
            top: '6px',
          },
        },
        // ライブリージョン
        '.live-region': {
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        },
        // 高コントラストボーダー
        '.border-accessible': {
          '@media (prefers-contrast: high)': {
            borderWidth: '2px',
            borderStyle: 'solid',
          },
        },
      }
      
      addUtilities(newUtilities)
    },
  ],
}
export default config