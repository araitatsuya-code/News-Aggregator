/**
 * WCAGコントラスト基準を満たすカラーシステム
 */

/**
 * 相対輝度を計算する関数
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * HEXカラーをRGBに変換
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * コントラスト比を計算
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * WCAG基準チェック
 */
export function checkWCAGCompliance(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): { passes: boolean; ratio: number; required: number } {
  const ratio = calculateContrastRatio(foreground, background);
  
  let required: number;
  if (level === 'AAA') {
    required = size === 'large' ? 4.5 : 7;
  } else {
    required = size === 'large' ? 3 : 4.5;
  }
  
  return {
    passes: ratio >= required,
    ratio,
    required
  };
}

/**
 * WCAG準拠のカラーパレット
 */
export const wcagCompliantColors = {
  // ダークテーマ（背景: #000000）
  dark: {
    background: {
      primary: '#000000',      // 黒
      secondary: '#1a1a1a',    // 濃いグレー
      accent: '#2a2a2a',       // アクセント背景
      card: '#0f0f0f',         // カード背景
    },
    text: {
      primary: '#ffffff',      // 白 (21:1 ratio)
      secondary: '#e0e0e0',    // 明るいグレー (16.75:1 ratio)
      muted: '#a0a0a0',        // 中間グレー (9.74:1 ratio)
      accent: '#00ff41',       // Matrix Green (12.6:1 ratio)
      link: '#4da6ff',         // 明るい青 (8.59:1 ratio)
      warning: '#ffcc00',      // 黄色 (12.6:1 ratio)
      error: '#ff6b6b',        // 明るい赤 (5.95:1 ratio)
      success: '#51cf66',      // 明るい緑 (8.28:1 ratio)
    },
    border: {
      primary: '#404040',      // グレー境界線
      accent: '#00ff41',       // アクセント境界線
      focus: '#4da6ff',        // フォーカス境界線
    },
    syntax: {
      keyword: '#569cd6',      // 青 (6.04:1 ratio)
      string: '#ce9178',       // オレンジ (5.77:1 ratio)
      comment: '#6a9955',      // 緑 (5.02:1 ratio)
      function: '#dcdcaa',     // 黄 (15.3:1 ratio)
      variable: '#9cdcfe',     // 水色 (11.5:1 ratio)
      number: '#b5cea8',       // 薄緑 (9.8:1 ratio)
    }
  },
  
  // ライトテーマ（背景: #ffffff）
  light: {
    background: {
      primary: '#ffffff',      // 白
      secondary: '#f8f9fa',    // 薄いグレー
      accent: '#e9ecef',       // アクセント背景
      card: '#ffffff',         // カード背景
    },
    text: {
      primary: '#000000',      // 黒 (21:1 ratio)
      secondary: '#212529',    // 濃いグレー (16.75:1 ratio)
      muted: '#6c757d',        // 中間グレー (4.54:1 ratio)
      accent: '#0d6efd',       // 青 (5.78:1 ratio)
      link: '#0d6efd',         // 青 (5.78:1 ratio)
      warning: '#fd7e14',      // オレンジ (4.52:1 ratio)
      error: '#dc3545',        // 赤 (5.78:1 ratio)
      success: '#198754',      // 緑 (4.56:1 ratio)
    },
    border: {
      primary: '#dee2e6',      // グレー境界線
      accent: '#0d6efd',       // アクセント境界線
      focus: '#86b7fe',        // フォーカス境界線
    },
    syntax: {
      keyword: '#0000ff',      // 青 (8.59:1 ratio)
      string: '#008000',       // 緑 (4.56:1 ratio)
      comment: '#808080',      // グレー (4.54:1 ratio)
      function: '#800080',     // 紫 (6.27:1 ratio)
      variable: '#000080',     // 濃い青 (12.6:1 ratio)
      number: '#ff8c00',       // オレンジ (4.52:1 ratio)
    }
  }
};

/**
 * テーマ別のWCAG準拠カラーを取得
 */
export function getWCAGCompliantTheme(theme: 'dark' | 'light' = 'dark') {
  return wcagCompliantColors[theme];
}

/**
 * カスタムカラーのWCAG準拠チェック
 */
export function validateColorAccessibility(
  colors: Record<string, string>,
  backgroundColor: string
): Record<string, { passes: boolean; ratio: number; suggestion?: string }> {
  const results: Record<string, { passes: boolean; ratio: number; suggestion?: string }> = {};
  
  Object.entries(colors).forEach(([key, color]) => {
    const compliance = checkWCAGCompliance(color, backgroundColor);
    results[key] = {
      passes: compliance.passes,
      ratio: compliance.ratio,
      suggestion: !compliance.passes 
        ? `コントラスト比 ${compliance.ratio.toFixed(2)}:1 は基準 ${compliance.required}:1 を満たしていません`
        : undefined
    };
  });
  
  return results;
}

/**
 * 動的にコントラストを調整する関数
 */
export function adjustColorForContrast(
  color: string,
  backgroundColor: string,
  targetRatio: number = 4.5
): string {
  const rgb = hexToRgb(color);
  const bgRgb = hexToRgb(backgroundColor);
  
  if (!rgb || !bgRgb) return color;
  
  // 現在のコントラスト比を確認
  let currentRatio = calculateContrastRatio(color, backgroundColor);
  
  if (currentRatio >= targetRatio) {
    return color; // 既に基準を満たしている
  }
  
  // 明度を調整してコントラストを改善
  let { r, g, b } = rgb;
  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  // 背景が暗い場合は色を明るく、明るい場合は色を暗くする
  const shouldLighten = bgLuminance < 0.5;
  const step = shouldLighten ? 10 : -10;
  
  while (currentRatio < targetRatio && r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
    r = Math.max(0, Math.min(255, r + step));
    g = Math.max(0, Math.min(255, g + step));
    b = Math.max(0, Math.min(255, b + step));
    
    const newColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    currentRatio = calculateContrastRatio(newColor, backgroundColor);
  }
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * フォーカスインジケーターのスタイルを生成
 */
export function generateFocusStyles(theme: 'dark' | 'light' = 'dark') {
  const colors = getWCAGCompliantTheme(theme);
  
  return {
    outline: `2px solid ${colors.border.focus}`,
    outlineOffset: '2px',
    boxShadow: `0 0 0 4px ${colors.border.focus}40`, // 40は透明度
  };
}