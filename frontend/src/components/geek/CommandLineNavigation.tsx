import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import { CommandLineFilter } from './CommandLineFilter';
import { useKeyboardShortcuts, commonShortcuts, geekShortcuts } from '../../lib/hooks/useKeyboardShortcuts';

/**
 * ナビゲーションモードの定義
 */
type NavigationMode = 'normal' | 'command' | 'filter' | 'help';

/**
 * フィルターオプションの型（CommandLineFilterから再利用）
 */
interface FilterOptions {
  categories?: string[];
  sources?: string[];
  dateRange?: string;
  operator?: 'AND' | 'OR';
  strict?: boolean;
}

/**
 * 検索オプションの型（CommandLineFilterから再利用）
 */
interface SearchOptions {
  fields?: string[];
  caseSensitive?: boolean;
  regex?: boolean;
}

/**
 * CommandLineNavigationコンポーネントのプロパティ
 */
interface CommandLineNavigationProps {
  /** 利用可能なカテゴリ一覧 */
  categories: string[];
  /** ニュースソース一覧 */
  sources?: string[];
  /** フィルター実行時のコールバック */
  onFilter: (filters: FilterOptions) => void;
  /** 検索実行時のコールバック */
  onSearch?: (query: string, options?: SearchOptions) => void;
  /** ナビゲーション実行時のコールバック */
  onNavigate?: (path: string) => void;
  /** テーマ変更時のコールバック */
  onThemeChange?: (theme: string) => void;
  /** 現在のテーマ */
  currentTheme?: 'matrix' | 'hacker' | 'terminal' | 'cyber';
  /** 初期表示状態 */
  initialVisible?: boolean;
  /** CSSクラス名 */
  className?: string;
  /** 無効化フラグ */
  disabled?: boolean;
  /** デバッグモード */
  debug?: boolean;
}

/**
 * ヘルプ情報の型
 */
interface HelpSection {
  title: string;
  items: Array<{
    key: string;
    description: string;
  }>;
}

/**
 * コマンドライン風ナビゲーションシステム
 * キーボードショートカットとコマンドラインインターフェースを統合
 */
export const CommandLineNavigation: React.FC<CommandLineNavigationProps> = ({
  categories,
  sources = [],
  onFilter,
  onSearch,
  onNavigate,
  onThemeChange,
  currentTheme = 'matrix',
  initialVisible = false,
  className = '',
  disabled = false,
  debug = false,
}) => {
  const { t } = useTranslation('news');
  
  // 状態管理
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [mode, setMode] = useState<NavigationMode>(initialVisible ? 'command' : 'normal');
  const [helpContent, setHelpContent] = useState<HelpSection[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const commandLineRef = useRef<HTMLDivElement>(null);

  /**
   * ステータスメッセージを表示
   */
  const showStatus = useCallback((message: string, duration: number = 3000) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(''), duration);
  }, []);

  /**
   * アニメーション付きでモード変更
   */
  const changeMode = useCallback((newMode: NavigationMode) => {
    if (newMode === mode) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setMode(newMode);
      setIsAnimating(false);
    }, 150);
  }, [mode]);

  /**
   * コマンドラインを表示/非表示
   */
  const toggleCommandLine = useCallback(() => {
    const newVisible = !isVisible;
    setIsVisible(newVisible);
    if (newVisible) {
      changeMode('command');
      showStatus('コマンドラインモードを開始');
    } else {
      changeMode('normal');
      showStatus('コマンドラインモードを終了');
    }
  }, [isVisible, changeMode, showStatus]);

  /**
   * フィルターモードに切り替え
   */
  const enterFilterMode = useCallback(() => {
    if (!isVisible) {
      setIsVisible(true);
    }
    changeMode('filter');
    showStatus('フィルターモードを開始 (/ でフィルター、: でコマンド)');
  }, [isVisible, changeMode, showStatus]);

  /**
   * コマンドモードに切り替え
   */
  const enterCommandMode = useCallback(() => {
    if (!isVisible) {
      setIsVisible(true);
    }
    changeMode('command');
    showStatus('コマンドモードを開始');
  }, [isVisible, changeMode, showStatus]);

  /**
   * ヘルプモードに切り替え
   */
  const enterHelpMode = useCallback(() => {
    if (!isVisible) {
      setIsVisible(true);
    }
    changeMode('help');
    showStatus('ヘルプを表示中');
  }, [isVisible, changeMode, showStatus]);

  /**
   * ノーマルモードに戻る
   */
  const exitToNormalMode = useCallback(() => {
    changeMode('normal');
    setIsVisible(false);
    showStatus('ノーマルモードに戻りました');
  }, [changeMode, showStatus]);

  /**
   * テーマを切り替え
   */
  const cycleTheme = useCallback(() => {
    const themes = ['matrix', 'hacker', 'terminal', 'cyber'] as const;
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    
    if (onThemeChange) {
      onThemeChange(nextTheme);
      showStatus(`テーマを ${nextTheme} に変更しました`);
    }
  }, [currentTheme, onThemeChange, showStatus]);

  /**
   * デバッグ情報を表示
   */
  const showDebugInfo = useCallback(() => {
    const debugInfo = {
      mode,
      theme: currentTheme,
      visible: isVisible,
      categories: categories.length,
      sources: sources.length,
    };
    
    console.log('CommandLineNavigation Debug Info:', debugInfo);
    showStatus(`デバッグ情報をコンソールに出力しました`);
  }, [mode, currentTheme, isVisible, categories.length, sources.length, showStatus]);

  /**
   * ナビゲーション（Vimスタイル）
   */
  const handleVimNavigation = useCallback((direction: 'up' | 'down' | 'left' | 'right' | 'top' | 'bottom') => {
    // 実際のナビゲーション処理はここに実装
    // 例: スクロール、フォーカス移動、ページ遷移など
    
    switch (direction) {
      case 'up':
        window.scrollBy(0, -100);
        break;
      case 'down':
        window.scrollBy(0, 100);
        break;
      case 'top':
        window.scrollTo(0, 0);
        break;
      case 'bottom':
        window.scrollTo(0, document.body.scrollHeight);
        break;
      default:
        break;
    }
    
    if (debug) {
      showStatus(`Vim navigation: ${direction}`);
    }
  }, [debug, showStatus]);

  /**
   * キーボードショートカットの定義
   */
  const shortcuts = [
    // 基本的なショートカット
    commonShortcuts.escape(exitToNormalMode),
    
    // ギーク向けショートカット
    geekShortcuts.terminal(toggleCommandLine),
    geekShortcuts.filterMode(enterFilterMode),
    geekShortcuts.commandMode(enterCommandMode),
    geekShortcuts.toggleTheme(cycleTheme),
    geekShortcuts.toggleDebug(showDebugInfo),
    
    // Vimスタイルナビゲーション（コマンドライン非表示時のみ）
    {
      ...geekShortcuts.moveUp(() => handleVimNavigation('up')),
      enabled: !isVisible,
    },
    {
      ...geekShortcuts.moveDown(() => handleVimNavigation('down')),
      enabled: !isVisible,
    },
    {
      ...geekShortcuts.moveLeft(() => handleVimNavigation('left')),
      enabled: !isVisible,
    },
    {
      ...geekShortcuts.moveRight(() => handleVimNavigation('right')),
      enabled: !isVisible,
    },
    {
      ...geekShortcuts.moveToTop(() => handleVimNavigation('top')),
      enabled: !isVisible,
    },
    {
      ...geekShortcuts.moveToBottom(() => handleVimNavigation('bottom')),
      enabled: !isVisible,
    },
    
    // ヘルプ表示
    {
      key: '?',
      modifiers: { shift: true },
      handler: enterHelpMode,
      description: 'ヘルプを表示',
      enabled: !isVisible,
    },
  ];

  // キーボードショートカットを有効化
  const { getAllShortcutDescriptions } = useKeyboardShortcuts(shortcuts, {
    enabled: !disabled,
    enableInInputs: false,
  });

  /**
   * ヘルプコンテンツを生成
   */
  useEffect(() => {
    const helpSections: HelpSection[] = [
      {
        title: 'ナビゲーション',
        items: [
          { key: 'Ctrl + `', description: 'コマンドラインを開く/閉じる' },
          { key: '/', description: 'フィルターモードに入る' },
          { key: ':', description: 'コマンドモードに入る' },
          { key: '?', description: 'このヘルプを表示' },
          { key: 'Esc', description: 'ノーマルモードに戻る' },
        ],
      },
      {
        title: 'Vimスタイル移動（ノーマルモード時）',
        items: [
          { key: 'j', description: '下にスクロール' },
          { key: 'k', description: '上にスクロール' },
          { key: 'g g', description: 'ページの最初に移動' },
          { key: 'G', description: 'ページの最後に移動' },
        ],
      },
      {
        title: 'コマンド',
        items: [
          { key: 'filter --category="AI"', description: 'カテゴリでフィルタリング' },
          { key: 'search "OpenAI"', description: 'キーワード検索' },
          { key: 'ls categories', description: 'カテゴリ一覧を表示' },
          { key: 'clear', description: '出力をクリア' },
          { key: 'help', description: 'コマンドヘルプを表示' },
        ],
      },
      {
        title: 'その他',
        items: [
          { key: 'Ctrl + Shift + T', description: 'テーマを切り替え' },
          { key: 'Ctrl + Shift + D', description: 'デバッグ情報を表示' },
          { key: 'Tab', description: 'コマンド自動補完' },
          { key: '↑/↓', description: 'コマンド履歴' },
        ],
      },
    ];
    
    setHelpContent(helpSections);
  }, []);

  /**
   * テーマに応じたスタイルを取得
   */
  const getThemeStyles = useCallback(() => {
    switch (currentTheme) {
      case 'matrix':
        return {
          background: 'bg-black bg-opacity-95',
          border: 'border-green-400',
          text: 'text-green-400',
          accent: 'text-green-300',
          glow: 'shadow-green-400/20',
        };
      case 'hacker':
        return {
          background: 'bg-gray-900 bg-opacity-95',
          border: 'border-cyan-400',
          text: 'text-cyan-400',
          accent: 'text-cyan-300',
          glow: 'shadow-cyan-400/20',
        };
      case 'terminal':
        return {
          background: 'bg-gray-900 bg-opacity-95',
          border: 'border-gray-400',
          text: 'text-white',
          accent: 'text-gray-300',
          glow: 'shadow-gray-400/20',
        };
      case 'cyber':
        return {
          background: 'bg-purple-900 bg-opacity-95',
          border: 'border-purple-400',
          text: 'text-purple-300',
          accent: 'text-purple-200',
          glow: 'shadow-purple-400/20',
        };
      default:
        return {
          background: 'bg-black bg-opacity-95',
          border: 'border-green-400',
          text: 'text-green-400',
          accent: 'text-green-300',
          glow: 'shadow-green-400/20',
        };
    }
  }, [currentTheme]);

  const styles = getThemeStyles();

  return (
    <>
      {/* ステータスメッセージ */}
      {statusMessage && (
        <div className={`
          fixed top-4 right-4 z-50 px-4 py-2 rounded-lg
          ${styles.background} ${styles.border} border
          ${styles.text} font-mono-primary text-sm
          shadow-lg ${styles.glow}
          animate-fade-in-out
        `}>
          {statusMessage}
        </div>
      )}

      {/* メインコマンドラインインターフェース */}
      {isVisible && (
        <div
          ref={containerRef}
          className={`
            fixed inset-x-0 bottom-0 z-40
            ${styles.background} ${styles.border} border-t
            shadow-2xl ${styles.glow}
            transition-all duration-300 ease-in-out
            ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
            ${className}
          `}
        >
          {/* ヘッダー */}
          <div className={`
            flex items-center justify-between px-4 py-2
            ${styles.border} border-b ${styles.accent}
          `}>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              
              <span className="font-mono-primary text-sm">
                {mode === 'command' && 'Command Line'}
                {mode === 'filter' && 'Filter Mode'}
                {mode === 'help' && 'Help'}
                {mode === 'normal' && 'Terminal'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="font-mono-primary text-xs opacity-60">
                Theme: {currentTheme}
              </span>
              
              <button
                onClick={exitToNormalMode}
                className={`
                  ${styles.text} hover:${styles.accent}
                  transition-colors duration-200
                `}
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>
          </div>

          {/* コンテンツエリア */}
          <div className="max-h-96 overflow-y-auto">
            {mode === 'command' || mode === 'filter' ? (
              <div ref={commandLineRef}>
                <CommandLineFilter
                  categories={categories}
                  sources={sources}
                  onFilter={onFilter}
                  onSearch={onSearch}
                  theme={currentTheme}
                  disabled={disabled}
                  debug={debug}
                  className="border-none"
                />
              </div>
            ) : mode === 'help' ? (
              <div className="p-4">
                <div className={`${styles.text} font-mono-primary`}>
                  <div className="mb-4">
                    <h2 className="text-lg font-bold mb-2">キーボードショートカット & コマンドヘルプ</h2>
                    <p className="text-sm opacity-80 mb-4">
                      AI News Aggregatorのギーク向けナビゲーションシステム
                    </p>
                  </div>

                  {helpContent.map((section, index) => (
                    <div key={index} className="mb-6">
                      <h3 className={`text-base font-semibold mb-3 ${styles.accent}`}>
                        {section.title}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {section.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center justify-between py-1">
                            <code className={`
                              px-2 py-1 rounded text-xs
                              ${styles.background} ${styles.border} border
                            `}>
                              {item.key}
                            </code>
                            <span className="text-sm opacity-80 ml-4 flex-1">
                              {item.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="mt-6 pt-4 border-t border-gray-600">
                    <p className="text-xs opacity-60">
                      Tip: Escキーでいつでもノーマルモードに戻れます
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* デバッグ情報 */}
      {debug && (
        <div className={`
          fixed bottom-4 left-4 z-30 p-2 rounded
          ${styles.background} ${styles.border} border
          ${styles.text} font-mono-primary text-xs
          max-w-xs
        `}>
          <div>Mode: {mode}</div>
          <div>Visible: {isVisible.toString()}</div>
          <div>Theme: {currentTheme}</div>
          <div>Shortcuts: {shortcuts.filter(s => s.enabled !== false).length}</div>
        </div>
      )}
    </>
  );
};

export default CommandLineNavigation;