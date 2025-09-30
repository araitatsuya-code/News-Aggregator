import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import { 
  createNavigationAriaProps, 
  handleKeyboardNavigation,
  FocusManager
} from '../../lib/utils/accessibility';
import { useReducedMotion } from '../../lib/utils/motionPreferences';
import { getWCAGCompliantTheme, generateFocusStyles } from '../../lib/utils/colorContrast';

/**
 * ナビゲーション項目の型定義
 */
export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
  badge?: number;
  description?: string;
}

/**
 * アクセシブルなギークナビゲーションのプロパティ
 */
interface AccessibleGeekNavigationProps {
  /** 現在のページID */
  currentPage: string;
  /** ナビゲーション項目 */
  items: NavigationItem[];
  /** テーマ */
  theme?: 'dark' | 'light';
  /** ナビゲーション時のコールバック */
  onNavigate: (pageId: string) => void;
  /** 方向 */
  orientation?: 'horizontal' | 'vertical';
  /** CSSクラス名 */
  className?: string;
}

/**
 * WCAG準拠のアクセシブルなギークナビゲーションコンポーネント
 */
export const AccessibleGeekNavigation: React.FC<AccessibleGeekNavigationProps> = ({
  currentPage,
  items,
  theme = 'dark',
  onNavigate,
  orientation = 'horizontal',
  className = '',
}) => {
  const { t } = useTranslation('common');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [announceText, setAnnounceText] = useState('');
  const navRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  
  // WCAG準拠のカラーテーマを取得
  const colors = getWCAGCompliantTheme(theme);
  const focusStyles = generateFocusStyles(theme);

  /**
   * ナビゲーション項目をクリック
   */
  const handleItemClick = useCallback((item: NavigationItem) => {
    if (!item.enabled) return;
    
    onNavigate(item.id);
    setAnnounceText(`${item.label}ページに移動しました`);
  }, [onNavigate]);

  /**
   * キーボードナビゲーションの処理
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent, item: NavigationItem, index: number) => {
    const isHorizontal = orientation === 'horizontal';
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleItemClick(item);
        break;
        
      case 'ArrowRight':
        if (isHorizontal) {
          e.preventDefault();
          const nextIndex = (index + 1) % items.length;
          setFocusedIndex(nextIndex);
          // 次の有効な項目にフォーカス
          const nextItem = items[nextIndex];
          if (nextItem.enabled && navRef.current) {
            const nextButton = navRef.current.children[nextIndex] as HTMLElement;
            nextButton?.focus();
          }
        }
        break;
        
      case 'ArrowLeft':
        if (isHorizontal) {
          e.preventDefault();
          const prevIndex = index === 0 ? items.length - 1 : index - 1;
          setFocusedIndex(prevIndex);
          // 前の有効な項目にフォーカス
          const prevItem = items[prevIndex];
          if (prevItem.enabled && navRef.current) {
            const prevButton = navRef.current.children[prevIndex] as HTMLElement;
            prevButton?.focus();
          }
        }
        break;
        
      case 'ArrowDown':
        if (!isHorizontal) {
          e.preventDefault();
          const nextIndex = (index + 1) % items.length;
          setFocusedIndex(nextIndex);
          const nextItem = items[nextIndex];
          if (nextItem.enabled && navRef.current) {
            const nextButton = navRef.current.children[nextIndex] as HTMLElement;
            nextButton?.focus();
          }
        }
        break;
        
      case 'ArrowUp':
        if (!isHorizontal) {
          e.preventDefault();
          const prevIndex = index === 0 ? items.length - 1 : index - 1;
          setFocusedIndex(prevIndex);
          const prevItem = items[prevIndex];
          if (prevItem.enabled && navRef.current) {
            const prevButton = navRef.current.children[prevIndex] as HTMLElement;
            prevButton?.focus();
          }
        }
        break;
        
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        if (navRef.current) {
          const firstButton = navRef.current.children[0] as HTMLElement;
          firstButton?.focus();
        }
        break;
        
      case 'End':
        e.preventDefault();
        const lastIndex = items.length - 1;
        setFocusedIndex(lastIndex);
        if (navRef.current) {
          const lastButton = navRef.current.children[lastIndex] as HTMLElement;
          lastButton?.focus();
        }
        break;
    }
  }, [orientation, items, handleItemClick]);

  /**
   * フォーカス管理
   */
  const handleFocus = useCallback((index: number) => {
    setFocusedIndex(index);
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedIndex(-1);
  }, []);

  return (
    <>
      {/* スクリーンリーダー用のライブリージョン */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announceText}
      </div>

      <nav
        ref={navRef}
        className={`
          ${orientation === 'horizontal' ? 'flex space-x-2' : 'flex flex-col space-y-2'}
          ${className}
        `}
        role="navigation"
        aria-label="メインナビゲーション"
      >
        {items.map((item, index) => {
          const isActive = currentPage === item.id;
          const isFocused = focusedIndex === index;
          const ariaProps = createNavigationAriaProps(item.label, isActive, item.badge);

          // 動的スタイルの生成
          const buttonStyles: React.CSSProperties = {
            backgroundColor: isActive 
              ? colors.background.accent 
              : 'transparent',
            color: isActive 
              ? colors.text.accent 
              : item.enabled 
                ? colors.text.primary 
                : colors.text.muted,
            borderColor: isActive 
              ? colors.border.accent 
              : colors.border.primary,
            ...(isFocused ? focusStyles : {}),
            transition: prefersReducedMotion ? 'none' : 'all 0.2s ease-in-out',
            opacity: item.enabled ? 1 : 0.5,
            cursor: item.enabled ? 'pointer' : 'not-allowed',
          };

          return (
            <button
              key={item.id}
              className={`
                relative px-4 py-2 rounded-lg border-2 font-mono text-sm
                transition-all duration-200 focus:outline-none
                ${item.enabled ? 'hover:opacity-80' : ''}
              `}
              style={buttonStyles}
              onClick={() => handleItemClick(item)}
              onKeyDown={(e) => handleKeyDown(e, item, index)}
              onFocus={() => handleFocus(index)}
              onBlur={handleBlur}
              disabled={!item.enabled}
              {...ariaProps}
            >
              {/* アイコンとラベル */}
              <div className="flex items-center space-x-2">
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
                
                {/* バッジ */}
                {item.badge && item.badge > 0 && (
                  <span
                    className="ml-2 px-2 py-1 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: colors.text.error,
                      color: colors.background.primary,
                    }}
                    aria-label={`${item.badge}件の新着`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* ツールチップ（説明文） */}
              {item.description && (
                <div
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 pointer-events-none transition-opacity duration-200 z-10"
                  style={{
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                    border: `1px solid ${colors.border.primary}`,
                  }}
                  role="tooltip"
                  id={`tooltip-${item.id}`}
                  aria-hidden="true"
                >
                  {item.description}
                  <div
                    className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
                    style={{
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: `4px solid ${colors.border.primary}`,
                    }}
                  />
                </div>
              )}

              {/* アクティブインジケーター */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-1 rounded-t"
                  style={{ backgroundColor: colors.text.accent }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};

/**
 * モバイル用のアクセシブルなボトムナビゲーション
 */
interface AccessibleMobileGeekNavigationProps extends Omit<AccessibleGeekNavigationProps, 'orientation'> {
  /** 固定位置にするかどうか */
  fixed?: boolean;
}

export const AccessibleMobileGeekNavigation: React.FC<AccessibleMobileGeekNavigationProps> = ({
  currentPage,
  items,
  theme = 'dark',
  onNavigate,
  className = '',
  fixed = true,
}) => {
  const colors = getWCAGCompliantTheme(theme);
  const prefersReducedMotion = useReducedMotion();

  return (
    <nav
      className={`
        ${fixed ? 'fixed bottom-0 left-0 right-0' : ''}
        border-t px-4 py-2 z-50
        ${className}
      `}
      style={{
        backgroundColor: colors.background.primary,
        borderColor: colors.border.primary,
      }}
      role="navigation"
      aria-label="モバイルナビゲーション"
    >
      <div className="flex justify-around items-center max-w-md mx-auto">
        {items.map((item) => {
          const isActive = currentPage === item.id;
          const ariaProps = createNavigationAriaProps(item.label, isActive, item.badge);

          return (
            <button
              key={item.id}
              className={`
                flex flex-col items-center space-y-1 p-2 rounded-lg
                transition-all duration-200 focus:outline-none
                ${item.enabled ? 'touch-manipulation' : ''}
              `}
              style={{
                color: isActive 
                  ? colors.text.accent 
                  : item.enabled 
                    ? colors.text.primary 
                    : colors.text.muted,
                backgroundColor: isActive 
                  ? `${colors.text.accent}20` 
                  : 'transparent',
                transform: isActive && !prefersReducedMotion 
                  ? 'scale(1.1)' 
                  : 'scale(1)',
                transition: prefersReducedMotion ? 'none' : 'all 0.2s ease-in-out',
              }}
              onClick={() => item.enabled && onNavigate(item.id)}
              disabled={!item.enabled}
              {...ariaProps}
            >
              {/* アイコン */}
              <span className="text-lg" aria-hidden="true">
                {item.icon}
              </span>
              
              {/* ラベル */}
              <span className="text-xs font-mono">
                {item.label}
              </span>
              
              {/* バッジ */}
              {item.badge && item.badge > 0 && (
                <div
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: colors.text.error,
                    color: colors.background.primary,
                  }}
                  aria-label={`${item.badge}件の新着`}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default AccessibleGeekNavigation;