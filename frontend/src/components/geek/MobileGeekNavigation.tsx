import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';

/**
 * モバイルギークナビゲーションのプロパティ
 */
interface MobileGeekNavigationProps {
  /** 現在のページ */
  currentPage?: string;
  /** ナビゲーション項目 */
  items: NavigationItem[];
  /** テーマ */
  theme?: 'matrix' | 'hacker' | 'terminal' | 'cyber';
  /** CSSクラス名 */
  className?: string;
  /** ナビゲーション変更時のコールバック */
  onNavigate?: (page: string) => void;
}

/**
 * ナビゲーション項目の型
 */
interface NavigationItem {
  /** 項目ID */
  id: string;
  /** 表示名 */
  label: string;
  /** アイコン（ASCII文字） */
  icon?: string;
  /** 有効かどうか */
  enabled?: boolean;
  /** バッジ（通知数など） */
  badge?: number;
}

/**
 * モバイル対応のギーク風ナビゲーションコンポーネント
 * タッチフレンドリーなインターフェースを提供
 */
export const MobileGeekNavigation: React.FC<MobileGeekNavigationProps> = ({
  currentPage = '',
  items,
  theme = 'matrix',
  className = '',
  onNavigate,
}) => {
  const { t } = useTranslation('common');
  const [isExpanded, setIsExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  /**
   * テーマに応じたスタイルを取得
   */
  const getThemeStyles = () => {
    switch (theme) {
      case 'matrix':
        return {
          background: 'bg-black',
          border: 'border-green-400',
          text: 'text-green-400',
          active: 'bg-green-900 bg-opacity-30 text-green-300',
          hover: 'hover:bg-green-900 hover:bg-opacity-20',
        };
      case 'hacker':
        return {
          background: 'bg-gray-900',
          border: 'border-cyan-400',
          text: 'text-cyan-400',
          active: 'bg-cyan-900 bg-opacity-30 text-cyan-300',
          hover: 'hover:bg-cyan-900 hover:bg-opacity-20',
        };
      case 'terminal':
        return {
          background: 'bg-gray-900',
          border: 'border-gray-400',
          text: 'text-white',
          active: 'bg-gray-700 text-gray-100',
          hover: 'hover:bg-gray-800',
        };
      case 'cyber':
        return {
          background: 'bg-purple-900',
          border: 'border-purple-400',
          text: 'text-purple-300',
          active: 'bg-purple-800 bg-opacity-50 text-purple-200',
          hover: 'hover:bg-purple-800 hover:bg-opacity-30',
        };
      default:
        return {
          background: 'bg-black',
          border: 'border-green-400',
          text: 'text-green-400',
          active: 'bg-green-900 bg-opacity-30 text-green-300',
          hover: 'hover:bg-green-900 hover:bg-opacity-20',
        };
    }
  };

  /**
   * ナビゲーション項目をクリックした時の処理
   */
  const handleItemClick = (item: NavigationItem) => {
    if (!item.enabled) return;
    
    onNavigate?.(item.id);
    setIsExpanded(false);
  };

  /**
   * タッチ操作の開始
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  /**
   * タッチ操作の終了（スワイプ検出）
   */
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    // 水平スワイプの検出
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // 右スワイプ - メニューを開く
        setIsExpanded(true);
      } else {
        // 左スワイプ - メニューを閉じる
        setIsExpanded(false);
      }
    }

    setTouchStart(null);
  };

  const styles = getThemeStyles();

  return (
    <>
      {/* ハンバーガーメニューボタン */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          fixed top-4 left-4 z-50
          ${styles.background} ${styles.border} ${styles.text}
          border-2 rounded-lg p-3
          touch-button geek-touch-button
          shadow-lg
        `}
        aria-label="メニューを開く"
      >
        <div className="font-mono-primary text-sm">
          {isExpanded ? '✕' : '≡'}
        </div>
      </button>

      {/* オーバーレイ */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsExpanded(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
      )}

      {/* ナビゲーションメニュー */}
      <div
        className={`
          fixed top-0 left-0 h-full w-80 max-w-[80vw] z-50
          ${styles.background} ${styles.border} ${styles.text}
          border-r-2 shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${isExpanded ? 'translate-x-0' : '-translate-x-full'}
          ${className}
        `}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* ヘッダー */}
        <div className={`
          px-4 py-6 border-b ${styles.border} border-opacity-30
        `}>
          <div className="flex items-center justify-between">
            <h2 className="font-mono-primary text-lg">
              {'>'} AI News Terminal
            </h2>
            <button
              onClick={() => setIsExpanded(false)}
              className={`
                ${styles.text} hover:opacity-70
                touch-button p-2
              `}
              aria-label="メニューを閉じる"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ナビゲーション項目 */}
        <nav className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            {items.map((item) => {
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  disabled={!item.enabled}
                  className={`
                    w-full text-left p-4 rounded-lg
                    font-mono-primary text-sm
                    touch-button geek-touch-button
                    transition-all duration-200
                    ${isActive 
                      ? `${styles.active} border-2 ${styles.border}` 
                      : `${styles.hover} border-2 border-transparent`
                    }
                    ${!item.enabled ? 'opacity-50 cursor-not-allowed' : ''}
                    flex items-center justify-between
                  `}
                  aria-pressed={isActive}
                  aria-label={item.label}
                >
                  <div className="flex items-center space-x-3">
                    {item.icon && (
                      <span className="text-lg w-6 text-center">
                        {item.icon}
                      </span>
                    )}
                    <span>{item.label}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`
                        px-2 py-1 rounded-full text-xs
                        bg-red-600 text-white
                        min-w-[20px] text-center
                      `}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="text-xs">{'>'}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* フッター */}
        <div className={`
          px-4 py-4 border-t ${styles.border} border-opacity-30
        `}>
          <div className="text-xs opacity-70 font-mono-primary">
            <div>Swipe right to open</div>
            <div>Swipe left to close</div>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * タブレット用のコンパクトナビゲーション
 */
interface TabletGeekNavigationProps {
  currentPage?: string;
  items: NavigationItem[];
  theme?: 'matrix' | 'hacker' | 'terminal' | 'cyber';
  className?: string;
  onNavigate?: (page: string) => void;
}

export const TabletGeekNavigation: React.FC<TabletGeekNavigationProps> = ({
  currentPage = '',
  items,
  theme = 'matrix',
  className = '',
  onNavigate,
}) => {
  const getThemeStyles = () => {
    switch (theme) {
      case 'matrix':
        return {
          background: 'bg-black',
          border: 'border-green-400',
          text: 'text-green-400',
          active: 'bg-green-900 bg-opacity-30 text-green-300',
        };
      case 'hacker':
        return {
          background: 'bg-gray-900',
          border: 'border-cyan-400',
          text: 'text-cyan-400',
          active: 'bg-cyan-900 bg-opacity-30 text-cyan-300',
        };
      case 'terminal':
        return {
          background: 'bg-gray-900',
          border: 'border-gray-400',
          text: 'text-white',
          active: 'bg-gray-700 text-gray-100',
        };
      case 'cyber':
        return {
          background: 'bg-purple-900',
          border: 'border-purple-400',
          text: 'text-purple-300',
          active: 'bg-purple-800 bg-opacity-50 text-purple-200',
        };
      default:
        return {
          background: 'bg-black',
          border: 'border-green-400',
          text: 'text-green-400',
          active: 'bg-green-900 bg-opacity-30 text-green-300',
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <nav className={`
      ${styles.background} ${styles.border} ${styles.text}
      border-2 rounded-lg p-2
      ${className}
    `}>
      <div className="flex space-x-2 overflow-x-auto">
        {items.map((item) => {
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              disabled={!item.enabled}
              className={`
                px-4 py-3 rounded-lg whitespace-nowrap
                font-mono-primary text-sm
                touch-button geek-touch-button
                transition-all duration-200
                ${isActive 
                  ? `${styles.active} border-2 ${styles.border}` 
                  : 'border-2 border-transparent hover:border-opacity-50'
                }
                ${!item.enabled ? 'opacity-50 cursor-not-allowed' : ''}
                flex items-center space-x-2
                min-w-[120px] justify-center
              `}
              aria-pressed={isActive}
            >
              {item.icon && (
                <span className="text-base">{item.icon}</span>
              )}
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`
                  px-1.5 py-0.5 rounded-full text-xs
                  bg-red-600 text-white
                  min-w-[16px] text-center
                `}>
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileGeekNavigation;