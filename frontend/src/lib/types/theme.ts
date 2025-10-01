/**
 * ギーク向けテーマシステムの型定義
 */

// テーマの種類
export type ThemeName = 'dark' | 'light' | 'matrix' | 'cyberpunk' | 'hacker';

// カラーパレット
export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
}

// シンタックスハイライト用カラー
export interface SyntaxColors {
  keyword: string;
  string: string;
  comment: string;
  function: string;
  variable: string;
  number: string;
}

// UI要素用カラー
export interface UIColors {
  background: ColorPalette;
  text: ColorPalette & {
    warning: string;
    error: string;
  };
  border: ColorPalette & {
    glow: string;
  };
}

// フォント設定
export interface FontConfig {
  primary: string;
  code: string;
  ascii: string;
}

// エフェクト設定
export interface EffectConfig {
  scanlines: boolean;
  glow: boolean;
  crt: boolean;
  typing: boolean;
  matrixRain: boolean;
}

// テーマ設定
export interface GeekTheme {
  name: ThemeName;
  displayName: string;
  description: string;
  colors: {
    terminal: UIColors;
    editor: {
      background: ColorPalette;
      syntax: SyntaxColors;
    };
  };
  fonts: FontConfig;
  effects: EffectConfig;
}

// テーマコンテキスト
export interface ThemeContextType {
  currentTheme: ThemeName;
  theme: GeekTheme;
  setTheme: (theme: ThemeName) => void;
  toggleEffect: (effect: keyof EffectConfig) => void;
  resetTheme: () => void;
}

// アニメーション設定
export interface AnimationConfig {
  duration: number;
  easing: string;
  respectReducedMotion: boolean;
}

// テーマプリセット
export const THEME_PRESETS: Record<ThemeName, Partial<GeekTheme>> = {
  dark: {
    name: 'dark',
    displayName: 'ダークテーマ',
    description: '標準的なダークテーマ',
    effects: {
      scanlines: false,
      glow: false,
      crt: false,
      typing: true,
      matrixRain: false,
    },
  },
  light: {
    name: 'light',
    displayName: 'ライトテーマ',
    description: '明るい背景のテーマ',
    effects: {
      scanlines: false,
      glow: false,
      crt: false,
      typing: true,
      matrixRain: false,
    },
  },
  matrix: {
    name: 'matrix',
    displayName: 'Matrixテーマ',
    description: 'Matrix映画風の緑色テーマ',
    effects: {
      scanlines: true,
      glow: true,
      crt: true,
      typing: true,
      matrixRain: true,
    },
  },
  cyberpunk: {
    name: 'cyberpunk',
    displayName: 'サイバーパンクテーマ',
    description: 'ネオンカラーのサイバーパンク風テーマ',
    effects: {
      scanlines: true,
      glow: true,
      crt: false,
      typing: true,
      matrixRain: false,
    },
  },
  hacker: {
    name: 'hacker',
    displayName: 'ハッカーテーマ',
    description: 'クラシックなハッカー風テーマ',
    effects: {
      scanlines: false,
      glow: true,
      crt: false,
      typing: true,
      matrixRain: false,
    },
  },
};

// CSS変数名の定数
export const CSS_VARIABLES = {
  // ターミナルテーマ
  TERMINAL_BG_PRIMARY: '--terminal-bg-primary',
  TERMINAL_BG_SECONDARY: '--terminal-bg-secondary',
  TERMINAL_BG_ACCENT: '--terminal-bg-accent',
  TERMINAL_TEXT_PRIMARY: '--terminal-text-primary',
  TERMINAL_TEXT_SECONDARY: '--terminal-text-secondary',
  TERMINAL_TEXT_MUTED: '--terminal-text-muted',
  TERMINAL_TEXT_ACCENT: '--terminal-text-accent',
  TERMINAL_TEXT_WARNING: '--terminal-text-warning',
  TERMINAL_TEXT_ERROR: '--terminal-text-error',
  TERMINAL_BORDER_PRIMARY: '--terminal-border-primary',
  TERMINAL_BORDER_ACCENT: '--terminal-border-accent',
  TERMINAL_BORDER_GLOW: '--terminal-border-glow',
  
  // エディタテーマ
  EDITOR_BG_PRIMARY: '--editor-bg-primary',
  EDITOR_BG_SECONDARY: '--editor-bg-secondary',
  EDITOR_BG_LINE: '--editor-bg-line',
  EDITOR_SYNTAX_KEYWORD: '--editor-syntax-keyword',
  EDITOR_SYNTAX_STRING: '--editor-syntax-string',
  EDITOR_SYNTAX_COMMENT: '--editor-syntax-comment',
  EDITOR_SYNTAX_FUNCTION: '--editor-syntax-function',
  EDITOR_SYNTAX_VARIABLE: '--editor-syntax-variable',
  EDITOR_SYNTAX_NUMBER: '--editor-syntax-number',
} as const;

// アクセシビリティ設定
export interface AccessibilityConfig {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
}

// テーマ設定の永続化用
export interface ThemeSettings {
  theme: ThemeName;
  effects: Partial<EffectConfig>;
  accessibility: Partial<AccessibilityConfig>;
  customColors?: Partial<UIColors>;
}