import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

/**
 * ギークモード切り替えコンポーネントのプロパティ
 */
interface GeekModeToggleProps {
  /** 現在のモード */
  currentMode?: 'normal' | 'geek';
  /** モード変更時のコールバック */
  onModeChange?: (mode: 'normal' | 'geek') => void;
  /** 表示位置 */
  position?: 'header' | 'footer' | 'floating';
  /** テーマ */
  theme?: 'matrix' | 'hacker' | 'terminal' | 'cyber';
  /** CSSクラス名 */
  className?: string;
}

/**
 * ギークモードと通常モードを切り替えるコンポーネント
 */
export const GeekModeToggle: React.FC<GeekModeToggleProps> = ({
  currentMode = 'normal',
  onModeChange,
  position = 'header',
  theme = 'matrix',
  className = '',
}) => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [isClient, setIsClient] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // クライアントサイドでのマウント検出
  useEffect(() => {
    setIsClient(true);
  }, []);

  /**
   * モードを切り替える
   */
  const toggleMode = async () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    try {
      const newMode = currentMode === 'normal' ? 'geek' : 'normal';
      
      // ローカルストレージに設定を保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('ui-mode', newMode);
      }
      
      // コールバック実行
      if (onModeChange) {
        onModeChange(newMode);
      }
      
      // ページ遷移（ギークモード専用ページがある場合）
      const currentPath = router.asPath;
      let targetPath = currentPath;
      
      if (newMode === 'geek') {
        // 通常ページからギークページへの変換
        if (currentPath === '/' || currentPath === '/index') {
          targetPath = '/geek-index';
        } else if (currentPath === '/summary') {
          targetPath = '/geek-summary';
        } else if (currentPath === '/categories') {
          targetPath = '/geek-categories';
        }
      } else {
        // ギークページから通常ページへの変換
        if (currentPath === '/geek-index') {
          targetPath = '/';
        } else if (currentPath === '/geek-summary') {
          targetPath = '/summary';
        } else if (currentPath === '/geek-categories') {
          targetPath = '/categories';
        }
      }
      
      if (targetPath !== currentPath) {
        await router.push(targetPath);
      }
      
    } catch (error) {
      console.error('Mode toggle error:', error);
    } finally {
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

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
          hover: 'hover:bg-green-900 hover:bg-opacity-20',
        };
      case 'hacker':
        return {
          background: 'bg-gray-900',
          border: 'border-cyan-400',
          text: 'text-cyan-400',
          hover: 'hover:bg-cyan-900 hover:bg-opacity-20',
        };
      case 'terminal':
        return {
          background: 'bg-gray-900',
          border: 'border-gray-400',
          text: 'text-white',
          hover: 'hover:bg-gray-800',
        };
      case 'cyber':
        return {
          background: 'bg-purple-900',
          border: 'border-purple-400',
          text: 'text-purple-300',
          hover: 'hover:bg-purple-800 hover:bg-opacity-50',
        };
      default:
        return {
          background: 'bg-black',
          border: 'border-green-400',
          text: 'text-green-400',
          hover: 'hover:bg-green-900 hover:bg-opacity-20',
        };
    }
  };

  /**
   * 位置に応じたスタイルを取得
   */
  const getPositionStyles = () => {
    switch (position) {
      case 'floating':
        return 'fixed bottom-4 right-4 z-50';
      case 'footer':
        return 'inline-flex';
      case 'header':
      default:
        return 'inline-flex';
    }
  };

  const styles = getThemeStyles();
  const positionStyles = getPositionStyles();

  if (!isClient) {
    return null; // SSR時は何も表示しない
  }

  return (
    <button
      onClick={toggleMode}
      disabled={isAnimating}
      className={`
        ${positionStyles}
        ${styles.background} ${styles.border} ${styles.text} ${styles.hover}
        ${className}
        geek-touch-button
        border-2 rounded-lg px-3 py-2
        font-mono-primary text-sm
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-opacity-50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isAnimating ? 'animate-pulse' : ''}
      `}
      aria-label={currentMode === 'normal' ? 'ギークモードに切り替え' : '通常モードに切り替え'}
      title={currentMode === 'normal' ? 'Switch to Geek Mode' : 'Switch to Normal Mode'}
    >
      <div className="flex items-center space-x-2">
        {/* アイコン */}
        <div className="relative">
          {currentMode === 'normal' ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <div className="w-4 h-4 font-mono-code text-xs flex items-center justify-center">
              {'</>'}
            </div>
          )}
          
          {/* アニメーション効果 */}
          {isAnimating && (
            <div className="absolute inset-0 border border-current rounded animate-ping opacity-75"></div>
          )}
        </div>

        {/* テキスト */}
        <span className="hidden sm:inline">
          {currentMode === 'normal' ? (
            <span className="font-mono-code">geek()</span>
          ) : (
            <span>Normal</span>
          )}
        </span>

        {/* モバイル用の短縮テキスト */}
        <span className="sm:hidden">
          {currentMode === 'normal' ? 'G' : 'N'}
        </span>
      </div>

      {/* ホバー時のツールチップ効果 */}
      <div className="sr-only">
        {currentMode === 'normal' 
          ? 'ターミナル風UIに切り替え' 
          : '通常のUIに切り替え'
        }
      </div>
    </button>
  );
};

/**
 * ギークモード検出フック
 */
export const useGeekMode = () => {
  const [mode, setMode] = useState<'normal' | 'geek'>('normal');
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    
    // ローカルストレージから設定を読み込み
    const savedMode = localStorage.getItem('ui-mode') as 'normal' | 'geek' | null;
    if (savedMode) {
      setMode(savedMode);
    }
    
    // URLからモードを判定
    const path = router.asPath;
    if (path.startsWith('/geek-')) {
      setMode('geek');
    }
  }, [router.asPath]);

  const toggleMode = (newMode: 'normal' | 'geek') => {
    setMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ui-mode', newMode);
    }
  };

  return {
    mode,
    isClient,
    toggleMode,
    isGeekMode: mode === 'geek',
  };
};

/**
 * ギークモード自動リダイレクトコンポーネント
 */
interface GeekModeRedirectProps {
  children: React.ReactNode;
}

export const GeekModeRedirect: React.FC<GeekModeRedirectProps> = ({ children }) => {
  const { mode, isClient } = useGeekMode();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isClient) return;

    const currentPath = router.asPath;
    const isGeekPage = currentPath.startsWith('/geek-');
    const shouldBeGeekPage = mode === 'geek';

    if (shouldBeGeekPage && !isGeekPage) {
      // 通常ページにいるがギークモードが有効な場合
      setIsRedirecting(true);
      let targetPath = currentPath;
      
      if (currentPath === '/' || currentPath === '/index') {
        targetPath = '/geek-index';
      } else if (currentPath === '/summary') {
        targetPath = '/geek-summary';
      } else if (currentPath === '/categories') {
        targetPath = '/geek-categories';
      }
      
      if (targetPath !== currentPath) {
        router.replace(targetPath);
      } else {
        setIsRedirecting(false);
      }
    } else if (!shouldBeGeekPage && isGeekPage) {
      // ギークページにいるが通常モードが有効な場合
      setIsRedirecting(true);
      let targetPath = currentPath;
      
      if (currentPath === '/geek-index') {
        targetPath = '/';
      } else if (currentPath === '/geek-summary') {
        targetPath = '/summary';
      } else if (currentPath === '/geek-categories') {
        targetPath = '/categories';
      }
      
      if (targetPath !== currentPath) {
        router.replace(targetPath);
      } else {
        setIsRedirecting(false);
      }
    }
  }, [mode, isClient, router]);

  if (!isClient || isRedirecting) {
    return (
      <div className="min-h-screen bg-terminal-bg-primary flex items-center justify-center">
        <div className="font-mono-primary text-terminal-text-primary">
          <div className="animate-pulse">Initializing UI mode...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default GeekModeToggle;