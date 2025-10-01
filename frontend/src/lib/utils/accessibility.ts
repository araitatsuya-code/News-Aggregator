/**
 * アクセシビリティ関連のユーティリティ関数
 */

/**
 * ARIA属性を生成するためのヘルパー関数
 */
export interface AriaProps {
  /** 要素の役割 */
  role?: string;
  /** アクセシブルな名前 */
  'aria-label'?: string;
  /** 詳細な説明 */
  'aria-describedby'?: string;
  /** 展開状態 */
  'aria-expanded'?: boolean;
  /** 選択状態 */
  'aria-selected'?: boolean;
  /** チェック状態 */
  'aria-checked'?: boolean;
  /** 自動補完 */
  'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
  /** 無効状態 */
  'aria-disabled'?: boolean;
  /** 現在の値 */
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean;
  /** ライブリージョン */
  'aria-live'?: 'off' | 'polite' | 'assertive';
  /** 原子性 */
  'aria-atomic'?: boolean;
  /** 関連要素 */
  'aria-controls'?: string;
  /** ラベル付け */
  'aria-labelledby'?: string;
  /** 隠し状態 */
  'aria-hidden'?: boolean;
  /** タブインデックス */
  tabIndex?: number;
}

/**
 * ニュース記事のARIA属性を生成
 */
export const createNewsItemAriaProps = (
  title: string,
  source: string,
  publishedAt: string,
  isClickable: boolean = true
): AriaProps => {
  const formattedDate = new Date(publishedAt).toLocaleDateString('ja-JP');
  
  return {
    role: isClickable ? 'button' : 'article',
    'aria-label': `${title} - ${source}より、${formattedDate}に公開${isClickable ? '、クリックして詳細を表示' : ''}`,
    tabIndex: isClickable ? 0 : -1,
  };
};

/**
 * ナビゲーション項目のARIA属性を生成
 */
export const createNavigationAriaProps = (
  label: string,
  isActive: boolean,
  badge?: number
): AriaProps => {
  return {
    role: 'button',
    'aria-label': `${label}${badge ? ` (${badge}件の新着)` : ''}`,
    'aria-current': isActive ? 'page' : false,
    tabIndex: 0,
  };
};

/**
 * フィルターコントロールのARIA属性を生成
 */
export const createFilterAriaProps = (
  categoryName: string,
  isSelected: boolean,
  count?: number
): AriaProps => {
  return {
    role: 'checkbox',
    'aria-label': `${categoryName}カテゴリ${count ? ` (${count}件)` : ''}`,
    'aria-checked': isSelected,
    tabIndex: 0,
  };
};

/**
 * コマンドライン入力のARIA属性を生成
 */
export const createCommandLineAriaProps = (
  placeholder: string,
  hasAutocomplete: boolean = true
): AriaProps => {
  return {
    role: 'combobox',
    'aria-label': 'コマンドライン入力',
    'aria-describedby': 'command-help',
    'aria-expanded': hasAutocomplete,
    'aria-autocomplete': hasAutocomplete ? 'list' : 'none',
    tabIndex: 0,
  };
};

/**
 * ライブリージョンのARIA属性を生成
 */
export const createLiveRegionAriaProps = (
  politeness: 'polite' | 'assertive' = 'polite'
): AriaProps => {
  return {
    'aria-live': politeness,
    'aria-atomic': true,
    role: 'status',
  };
};

/**
 * キーボードナビゲーション用のイベントハンドラー
 */
export const handleKeyboardNavigation = (
  event: React.KeyboardEvent,
  onActivate: () => void,
  onEscape?: () => void
) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      onActivate();
      break;
    case 'Escape':
      if (onEscape) {
        event.preventDefault();
        onEscape();
      }
      break;
  }
};

/**
 * フォーカス管理のユーティリティ
 */
export class FocusManager {
  private static focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([aria-disabled="true"])',
    '[role="checkbox"]:not([aria-disabled="true"])',
    '[role="combobox"]:not([aria-disabled="true"])',
  ].join(', ');

  /**
   * 指定された要素内のフォーカス可能な要素を取得
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableSelectors));
  }

  /**
   * 次のフォーカス可能な要素にフォーカスを移動
   */
  static focusNext(container: HTMLElement, currentElement: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(currentElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    focusableElements[nextIndex]?.focus();
  }

  /**
   * 前のフォーカス可能な要素にフォーカスを移動
   */
  static focusPrevious(container: HTMLElement, currentElement: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(currentElement);
    const previousIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
    focusableElements[previousIndex]?.focus();
  }

  /**
   * 最初のフォーカス可能な要素にフォーカスを移動
   */
  static focusFirst(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    focusableElements[0]?.focus();
  }

  /**
   * 最後のフォーカス可能な要素にフォーカスを移動
   */
  static focusLast(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    focusableElements[focusableElements.length - 1]?.focus();
  }
}

/**
 * スクリーンリーダー用のテキスト生成
 */
export const generateScreenReaderText = {
  /**
   * ニュース記事の詳細情報を生成
   */
  newsArticle: (
    title: string,
    source: string,
    publishedAt: string,
    category: string,
    confidence: number
  ): string => {
    const date = new Date(publishedAt).toLocaleDateString('ja-JP');
    return `記事タイトル: ${title}。ソース: ${source}。公開日: ${date}。カテゴリ: ${category}。AI信頼度: ${Math.round(confidence * 100)}パーセント。`;
  },

  /**
   * フィルター状態の説明を生成
   */
  filterStatus: (selectedCategories: string[], totalArticles: number): string => {
    if (selectedCategories.length === 0) {
      return `全カテゴリ表示中。${totalArticles}件の記事があります。`;
    }
    return `${selectedCategories.join('、')}カテゴリでフィルタリング中。${totalArticles}件の記事が表示されています。`;
  },

  /**
   * 検索結果の説明を生成
   */
  searchResults: (query: string, resultCount: number): string => {
    return `「${query}」の検索結果: ${resultCount}件の記事が見つかりました。`;
  },
};