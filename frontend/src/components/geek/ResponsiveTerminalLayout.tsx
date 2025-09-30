import React, { useState, useEffect } from 'react';
import { TerminalPrompt } from './TerminalPrompt';

/**
 * レスポンシブターミナルレイアウトのプロパティ
 */
interface ResponsiveTerminalLayoutProps {
  /** 子要素 */
  children: React.ReactNode;
  /** ヘッダーを表示するかどうか */
  showHeader?: boolean;
  /** プロンプトを表示するかどうか */
  showPrompt?: boolean;
  /** テーマ */
  theme?: 'matrix' | 'hacker' | 'terminal' | 'cyber';
  /** タイトル */
  title?: string;
  /** CSSクラス名 */
  className?: string;
  /** モバイル用の簡略表示 */
  mobileSimplified?: boolean;
}

/**
 * レスポンシブ対応のターミナル風レイアウトコンポーネント
 * 画面サイズに応じて表示を最適化する
 */
export const ResponsiveTerminalLayout: React.FC<ResponsiveTerminalLayoutProps> = ({
  children,
  showHeader = true,
  showPrompt = true,
  theme = 'matrix',
  title = 'AI News Terminal',
  className = '',
  mobileSimplified = true,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // クライアントサイドでのマウント検出
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 画面サイズの検出
  useEffect(() => {
    if (!isClient) return;

    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isClient]);

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
          header: 'bg-green-900 bg-opacity-20',
        };
      case 'hacker':
        return {
          background: 'bg-gray-900',
          border: 'border-cyan-400',
          text: 'text-cyan-400',
          header: 'bg-cyan-900 bg-opacity-20',
        };
      case 'terminal':
        return {
          background: 'bg-gray-900',
          border: 'border-gray-400',
          text: 'text-white',
          header: 'bg-gray-800',
        };
      case 'cyber':
        return {
          background: 'bg-purple-900',
          border: 'border-purple-400',
          text: 'text-purple-300',
          header: 'bg-purple-800 bg-opacity-50',
        };
      default:
        return {
          background: 'bg-black',
          border: 'border-green-400',
          text: 'text-green-400',
          header: 'bg-green-900 bg-opacity-20',
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div className={`
      terminal-layout responsive-terminal-layout
      ${styles.background} ${styles.text} ${styles.border}
      ${isMobile ? 'mobile-terminal' : ''}
      ${isTablet ? 'tablet-terminal' : ''}
      ${className}
    `}>
      {/* ヘッダー */}
      {showHeader && (
        <div className={`
          terminal-header responsive-terminal-header
          ${styles.header}
          ${isMobile ? 'px-3 py-2' : 'px-4 py-3'}
        `}>
          <div className="flex items-center justify-between">
            {/* ウィンドウコントロール */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500 ${isMobile ? 'hidden' : ''}`}></div>
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500 ${isMobile ? 'hidden' : ''}`}></div>
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500 ${isMobile ? 'hidden' : ''}`}></div>
            </div>

            {/* タイトル */}
            <div className="flex-1 text-center">
              <span className={`font-mono-primary ${isMobile ? 'text-sm' : 'text-base'}`}>
                {isMobile && mobileSimplified ? 'AI News' : title}
              </span>
            </div>

            {/* ステータス表示 */}
            {isClient && (
              <div className={`text-xs ${styles.text} opacity-70`}>
                <span className="hidden sm:inline">
                  {new Date().toLocaleTimeString()}
                </span>
                <span className="sm:hidden">
                  {new Date().toLocaleTimeString().split(':').slice(0, 2).join(':')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* プロンプト */}
      {showPrompt && (
        <div className={`
          terminal-prompt-section
          ${isMobile ? 'px-3 py-2' : 'px-4 py-3'}
          border-b ${styles.border} border-opacity-30
        `}>
          <TerminalPrompt
            username={isMobile ? 'user' : 'developer'}
            hostname={isMobile ? 'ai' : 'ai-news'}
            directory={isMobile ? '~' : '~/ai-news'}
            theme={theme}
            useTyping={!isMobile} // モバイルではタイピングアニメーション無効
            className={isMobile ? 'text-sm' : 'text-base'}
          />
        </div>
      )}

      {/* メインコンテンツ */}
      <div className={`
        terminal-content responsive-terminal-content
        ${isMobile ? 'p-2' : isTablet ? 'p-4' : 'p-6'}
        overflow-auto
      `}>
        {children}
      </div>

      {/* モバイル用のフッター */}
      {isMobile && (
        <div className={`
          terminal-footer
          ${styles.header}
          px-3 py-2 border-t ${styles.border} border-opacity-30
          text-xs text-center
        `}>
          <span className="opacity-70">
            Tap to interact • Swipe to navigate
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * モバイル専用のコンパクトターミナルレイアウト
 */
interface CompactTerminalLayoutProps {
  children: React.ReactNode;
  title?: string;
  theme?: 'matrix' | 'hacker' | 'terminal' | 'cyber';
  className?: string;
}

export const CompactTerminalLayout: React.FC<CompactTerminalLayoutProps> = ({
  children,
  title = 'AI News',
  theme = 'matrix',
  className = '',
}) => {
  const getThemeStyles = () => {
    switch (theme) {
      case 'matrix':
        return {
          background: 'bg-black',
          border: 'border-green-400',
          text: 'text-green-400',
          accent: 'text-green-300',
        };
      case 'hacker':
        return {
          background: 'bg-gray-900',
          border: 'border-cyan-400',
          text: 'text-cyan-400',
          accent: 'text-cyan-300',
        };
      case 'terminal':
        return {
          background: 'bg-gray-900',
          border: 'border-gray-400',
          text: 'text-white',
          accent: 'text-gray-300',
        };
      case 'cyber':
        return {
          background: 'bg-purple-900',
          border: 'border-purple-400',
          text: 'text-purple-300',
          accent: 'text-purple-200',
        };
      default:
        return {
          background: 'bg-black',
          border: 'border-green-400',
          text: 'text-green-400',
          accent: 'text-green-300',
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div className={`
      ${styles.background} ${styles.text}
      border ${styles.border} rounded-lg
      shadow-lg overflow-hidden
      ${className}
    `}>
      {/* シンプルヘッダー */}
      <div className={`
        px-3 py-2 border-b ${styles.border} border-opacity-30
        flex items-center justify-between
      `}>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="font-mono-primary text-sm">{title}</span>
        </div>
        <div className={`text-xs ${styles.accent}`}>
          {typeof window !== 'undefined' ? new Date().toLocaleTimeString().split(':').slice(0, 2).join(':') : '--:--'}
        </div>
      </div>

      {/* コンテンツ */}
      <div className="p-3">
        {children}
      </div>
    </div>
  );
};

export default ResponsiveTerminalLayout;