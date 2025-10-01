/**
 * テーマシステム管理用ユーティリティ関数
 */

import { ThemeName, CSS_VARIABLES, ThemeSettings, AccessibilityConfig } from '../types/theme';

// ローカルストレージのキー
const THEME_STORAGE_KEY = 'geek-ui-theme';
const ACCESSIBILITY_STORAGE_KEY = 'geek-ui-accessibility';

/**
 * テーマをHTMLのdata属性に適用する
 */
export function applyTheme(theme: ThemeName): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    
    // ローカルストレージに保存
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
}

/**
 * 保存されたテーマを取得する
 */
export function getSavedTheme(): ThemeName {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName;
    if (saved && ['dark', 'light', 'matrix', 'cyberpunk', 'hacker'].includes(saved)) {
      return saved;
    }
  }
  
  // デフォルトはシステム設定に従う
  return getSystemTheme();
}

/**
 * システムのテーマ設定を取得する
 */
export function getSystemTheme(): ThemeName {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

/**
 * CSS変数を動的に設定する
 */
export function setCSSVariable(variable: string, value: string): void {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty(variable, value);
  }
}

/**
 * CSS変数を取得する
 */
export function getCSSVariable(variable: string): string {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  }
  return '';
}

/**
 * フォントの読み込み状態を管理する
 */
export class FontLoader {
  private static instance: FontLoader;
  private loadedFonts: Set<string> = new Set();
  
  static getInstance(): FontLoader {
    if (!FontLoader.instance) {
      FontLoader.instance = new FontLoader();
    }
    return FontLoader.instance;
  }
  
  /**
   * フォントを読み込む
   */
  async loadFont(fontFamily: string, fontUrl?: string): Promise<boolean> {
    if (this.loadedFonts.has(fontFamily)) {
      return true;
    }
    
    try {
      if (fontUrl) {
        // 外部フォントの読み込み
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = fontUrl;
        document.head.appendChild(link);
      }
      
      // フォントの読み込み完了を待つ
      if ('fonts' in document) {
        await document.fonts.load(`1em ${fontFamily}`);
      }
      
      this.loadedFonts.add(fontFamily);
      return true;
    } catch (error) {
      console.warn(`フォント ${fontFamily} の読み込みに失敗しました:`, error);
      return false;
    }
  }
  
  /**
   * 必要なフォントをすべて読み込む
   */
  async loadGeekFonts(): Promise<void> {
    const fonts = [
      { family: 'JetBrains Mono', url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap' },
      { family: 'Fira Code', url: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap' }
    ];
    
    // フォント読み込み中のクラスを追加
    document.body.classList.add('font-loading');
    
    try {
      await Promise.all(
        fonts.map(font => this.loadFont(font.family, font.url))
      );
    } finally {
      // フォント読み込み完了後にクラスを削除
      document.body.classList.remove('font-loading');
    }
  }
}

/**
 * アクセシビリティ設定を管理する
 */
export class AccessibilityManager {
  private settings: AccessibilityConfig;
  
  constructor() {
    this.settings = this.loadSettings();
    this.applySettings();
    this.setupMediaQueryListeners();
  }
  
  /**
   * 設定を読み込む
   */
  private loadSettings(): AccessibilityConfig {
    const defaultSettings: AccessibilityConfig = {
      highContrast: false,
      reducedMotion: false,
      screenReaderOptimized: false,
      keyboardNavigation: true,
    };
    
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
        if (saved) {
          return { ...defaultSettings, ...JSON.parse(saved) };
        }
      } catch (error) {
        console.warn('アクセシビリティ設定の読み込みに失敗しました:', error);
      }
    }
    
    return defaultSettings;
  }
  
  /**
   * 設定を保存する
   */
  private saveSettings(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(this.settings));
      } catch (error) {
        console.warn('アクセシビリティ設定の保存に失敗しました:', error);
      }
    }
  }
  
  /**
   * 設定を適用する
   */
  private applySettings(): void {
    if (typeof document === 'undefined') return;
    
    const { documentElement } = document;
    
    // 高コントラスト
    documentElement.classList.toggle('high-contrast', this.settings.highContrast);
    
    // アニメーション削減
    documentElement.classList.toggle('reduced-motion', this.settings.reducedMotion);
    
    // スクリーンリーダー最適化
    documentElement.classList.toggle('screen-reader-optimized', this.settings.screenReaderOptimized);
    
    // キーボードナビゲーション
    documentElement.classList.toggle('keyboard-navigation', this.settings.keyboardNavigation);
  }
  
  /**
   * メディアクエリリスナーを設定する
   */
  private setupMediaQueryListeners(): void {
    if (typeof window === 'undefined') return;
    
    // prefers-reduced-motion
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      this.settings.reducedMotion = e.matches;
      this.applySettings();
    };
    
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    handleReducedMotionChange(reducedMotionQuery as any);
    
    // prefers-contrast
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      this.settings.highContrast = e.matches;
      this.applySettings();
    };
    
    highContrastQuery.addEventListener('change', handleHighContrastChange);
    handleHighContrastChange(highContrastQuery as any);
  }
  
  /**
   * 設定を更新する
   */
  updateSetting<K extends keyof AccessibilityConfig>(
    key: K,
    value: AccessibilityConfig[K]
  ): void {
    this.settings[key] = value;
    this.applySettings();
    this.saveSettings();
  }
  
  /**
   * 現在の設定を取得する
   */
  getSettings(): AccessibilityConfig {
    return { ...this.settings };
  }
}

/**
 * テーマ設定を管理するクラス
 */
export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: ThemeName;
  private accessibilityManager: AccessibilityManager;
  
  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }
  
  constructor() {
    this.currentTheme = getSavedTheme();
    this.accessibilityManager = new AccessibilityManager();
    this.initialize();
  }
  
  /**
   * 初期化
   */
  private initialize(): void {
    this.applyTheme(this.currentTheme);
    
    // フォントを読み込む
    FontLoader.getInstance().loadGeekFonts();
  }
  
  /**
   * テーマを適用する
   */
  applyTheme(theme: ThemeName): void {
    this.currentTheme = theme;
    applyTheme(theme);
  }
  
  /**
   * 現在のテーマを取得する
   */
  getCurrentTheme(): ThemeName {
    return this.currentTheme;
  }
  
  /**
   * アクセシビリティマネージャーを取得する
   */
  getAccessibilityManager(): AccessibilityManager {
    return this.accessibilityManager;
  }
}

/**
 * カラーコントラスト比を計算する
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  // 簡易的な実装（実際のプロダクションではより正確な計算が必要）
  const getLuminance = (color: string): number => {
    // HEXカラーからRGBに変換
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // 相対輝度を計算
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };
  
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG AA基準を満たすかチェックする
 */
export function isWCAGCompliant(foreground: string, background: string): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  return ratio >= 4.5; // WCAG AA基準
}

/**
 * デバッグ用：現在のテーマ情報を出力する
 */
export function debugTheme(): void {
  if (typeof console !== 'undefined') {
    const theme = ThemeManager.getInstance().getCurrentTheme();
    const variables = Object.values(CSS_VARIABLES).map(variable => ({
      name: variable,
      value: getCSSVariable(variable)
    }));
    
    console.group('🎨 Geek UI Theme Debug');
    console.log('Current Theme:', theme);
    console.table(variables);
    console.groupEnd();
  }
}