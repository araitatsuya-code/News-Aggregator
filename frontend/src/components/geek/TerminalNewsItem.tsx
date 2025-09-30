import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { NewsItem as NewsItemType } from '../../lib/types';

/**
 * TerminalNewsItemコンポーネントのプロパティ
 */
interface TerminalNewsItemProps {
  /** ニュース記事データ */
  article: NewsItemType;
  /** 行番号 */
  lineNumber: number;
  /** 要約を表示するかどうか */
  showSummary?: boolean;
  /** シンタックスハイライトのスタイル */
  syntax?: 'terminal' | 'code' | 'json' | 'javascript' | 'python';
  /** テーマ */
  theme?: 'matrix' | 'hacker' | 'terminal' | 'cyber' | 'vscode';
  /** ホバー時のハイライト効果を有効にするか */
  highlightOnHover?: boolean;
  /** クリック可能かどうか */
  clickable?: boolean;
  /** CSSクラス名 */
  className?: string;
}

/**
 * コードエディタ風のニュース記事表示コンポーネント
 * 行番号付きで、シンタックスハイライト風の色分けを行う
 */
export const TerminalNewsItem: React.FC<TerminalNewsItemProps> = ({
  article,
  lineNumber,
  showSummary = true,
  syntax = 'javascript',
  theme = 'vscode',
  highlightOnHover = true,
  clickable = true,
  className = '',
}) => {
  const router = useRouter();
  const { t } = useTranslation('news');
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // クライアントサイドでのマウント検出
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 画面サイズの検出
  useEffect(() => {
    if (!isClient) return;

    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isClient]);

  /**
   * 外部リンクをクリックした時の処理
   */
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!clickable) return;
    e.preventDefault();
    window.open(article.url, '_blank', 'noopener,noreferrer');
  }, [article.url, clickable]);

  /**
   * ホバー状態の管理
   */
  const handleMouseEnter = useCallback(() => {
    if (highlightOnHover) {
      setIsHovered(true);
    }
  }, [highlightOnHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);

  /**
   * タッチ操作の管理
   */
  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  /**
   * 日付をフォーマットする
   */
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD形式
  }, []);

  /**
   * 信頼度を百分率で表示
   */
  const formatConfidence = useCallback((confidence: number) => {
    return Math.round(confidence * 100);
  }, []);

  /**
   * シンタックスに応じたスタイルを取得
   */
  const getSyntaxStyles = useCallback(() => {
    switch (syntax) {
      case 'javascript':
        return {
          comment: 'syntax-comment',
          keyword: 'syntax-keyword',
          string: 'syntax-string',
          function: 'syntax-function',
          variable: 'syntax-variable',
          number: 'syntax-number',
        };
      case 'python':
        return {
          comment: 'text-green-500',
          keyword: 'text-blue-400',
          string: 'text-yellow-300',
          function: 'text-purple-400',
          variable: 'text-cyan-300',
          number: 'text-orange-400',
        };
      case 'json':
        return {
          comment: 'text-gray-500',
          keyword: 'text-blue-400',
          string: 'text-green-400',
          function: 'text-white',
          variable: 'text-cyan-400',
          number: 'text-orange-400',
        };
      case 'terminal':
        return {
          comment: 'text-terminal-text-muted',
          keyword: 'text-terminal-text-primary',
          string: 'text-terminal-text-accent',
          function: 'text-terminal-text-secondary',
          variable: 'text-terminal-text-primary',
          number: 'text-terminal-text-warning',
        };
      default:
        return {
          comment: 'syntax-comment',
          keyword: 'syntax-keyword',
          string: 'syntax-string',
          function: 'syntax-function',
          variable: 'syntax-variable',
          number: 'syntax-number',
        };
    }
  }, [syntax]);

  /**
   * テーマに応じた背景色を取得
   */
  const getThemeStyles = useCallback(() => {
    const baseStyles = 'transition-all duration-200 ease-in-out';
    
    if (isHovered && highlightOnHover) {
      switch (theme) {
        case 'matrix':
          return `${baseStyles} bg-green-900 bg-opacity-20 border-l-4 border-matrix-green`;
        case 'hacker':
          return `${baseStyles} bg-cyan-900 bg-opacity-20 border-l-4 border-cyan-400`;
        case 'cyber':
          return `${baseStyles} bg-purple-900 bg-opacity-20 border-l-4 border-cyber-purple`;
        case 'terminal':
          return `${baseStyles} bg-terminal-bg-accent border-l-4 border-terminal-border-accent`;
        default:
          return `${baseStyles} bg-editor-bg-line border-l-4 border-blue-500`;
      }
    }
    
    return baseStyles;
  }, [isHovered, highlightOnHover, theme]);

  const syntaxStyles = getSyntaxStyles();
  const themeStyles = getThemeStyles();

  // 記事が翻訳されているかどうかを判定
  const isTranslated = article.language === 'en' && article.original_title !== article.title;
  const displayTitle = isTranslated ? article.title : article.original_title;

  return (
    <div
      className={`code-card ${themeStyles} ${className} ${
        isPressed ? 'scale-98' : ''
      } ${clickable ? 'cursor-pointer' : ''} 
      responsive-terminal-card`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={clickable ? handleClick : undefined}
      role={clickable ? 'button' : 'article'}
      tabIndex={clickable ? 0 : -1}
      aria-label={clickable ? `${displayTitle} - ${t('external_link')}` : displayTitle}
    >
      {/* ファイルヘッダー風の表示 */}
      <div className="editor-header responsive-editor-header">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="flex-1 text-center px-2">
          <span className="text-gray-400 text-xs sm:text-sm truncate block">
            {article.category.toLowerCase().replace(/\s+/g, '_')}.{syntax}
          </span>
        </div>
        <div className="text-xs text-gray-500 hidden sm:block">
          {formatDate(article.published_at)}
        </div>
        {/* モバイル用の日付表示 */}
        <div className="text-xs text-gray-500 sm:hidden">
          {formatDate(article.published_at).split('-')[1]}/{formatDate(article.published_at).split('-')[2]}
        </div>
      </div>

      {/* コードブロック風のコンテンツ */}
      <div className="flex responsive-code-content">
        {/* 行番号 */}
        <div className="line-numbers responsive-line-numbers">
          <div>{String(lineNumber).padStart(3, '0')}</div>
          {showSummary && (
            <>
              <div>{String(lineNumber + 1).padStart(3, '0')}</div>
              <div>{String(lineNumber + 2).padStart(3, '0')}</div>
              <div>{String(lineNumber + 3).padStart(3, '0')}</div>
              <div>{String(lineNumber + 4).padStart(3, '0')}</div>
              <div>{String(lineNumber + 5).padStart(3, '0')}</div>
              {isTranslated && (
                <>
                  <div>{String(lineNumber + 6).padStart(3, '0')}</div>
                  <div>{String(lineNumber + 7).padStart(3, '0')}</div>
                </>
              )}
              <div>{String(lineNumber + (isTranslated ? 8 : 6)).padStart(3, '0')}</div>
            </>
          )}
        </div>

        {/* コード内容 */}
        <div className="flex-1 p-2 sm:p-4 font-mono-code text-xs sm:text-sm leading-relaxed responsive-code-text">
          {/* コメント行：カテゴリとソース */}
          <div className={`${syntaxStyles.comment} mb-2`}>
            <span>{`// ${article.category} - ${article.source}`}</span>
          </div>

          {/* メイン記事オブジェクト */}
          <div className="mb-2">
            <span className={syntaxStyles.keyword}>const</span>{' '}
            <span className={syntaxStyles.variable}>article</span>{' '}
            <span className="text-white">=</span>{' '}
            <span className="text-white">{'{'}</span>
          </div>

          {/* タイトル */}
          <div className="ml-2 sm:ml-4 mb-1">
            <span className={syntaxStyles.variable}>title</span>
            <span className="text-white">:</span>{' '}
            <span className={`${syntaxStyles.string} break-words`}>
              &quot;{displayTitle.length > 60 && isMobile 
                ? `${displayTitle.substring(0, 60)}...` 
                : displayTitle}&quot;
            </span>
            <span className="text-white">,</span>
          </div>

          {/* 翻訳記事の場合の元タイトル */}
          {isTranslated && (
            <div className="ml-2 sm:ml-4 mb-1">
              <span className={syntaxStyles.variable}>originalTitle</span>
              <span className="text-white">:</span>{' '}
              <span className={`${syntaxStyles.string} break-words`}>
                &quot;{article.original_title.length > 50 && isMobile 
                  ? `${article.original_title.substring(0, 50)}...` 
                  : article.original_title}&quot;
              </span>
              <span className="text-white">,</span>
            </div>
          )}

          {/* URL */}
          <div className="ml-2 sm:ml-4 mb-1">
            <span className={syntaxStyles.variable}>url</span>
            <span className="text-white">:</span>{' '}
            <span className={`${syntaxStyles.string} break-all`}>
              &quot;{article.url.length > 40 && isMobile 
                ? `${article.url.substring(0, 40)}...` 
                : article.url}&quot;
            </span>
            <span className="text-white">,</span>
          </div>

          {/* 要約（オプション） */}
          {showSummary && (
            <div className="ml-2 sm:ml-4 mb-1">
              <span className={syntaxStyles.variable}>summary</span>
              <span className="text-white">:</span>{' '}
              <span className={`${syntaxStyles.string} break-words`}>
                &quot;{article.summary.length > (isMobile ? 60 : 100) 
                  ? `${article.summary.substring(0, isMobile ? 60 : 100)}...` 
                  : article.summary}&quot;
              </span>
              <span className="text-white">,</span>
            </div>
          )}

          {/* メタデータ */}
          <div className="ml-2 sm:ml-4 mb-1">
            <span className={syntaxStyles.variable}>publishedAt</span>
            <span className="text-white">:</span>{' '}
            <span className={syntaxStyles.string}>&quot;{article.published_at}&quot;</span>
            <span className="text-white">,</span>
          </div>

          <div className="ml-2 sm:ml-4 mb-1">
            <span className={syntaxStyles.variable}>confidence</span>
            <span className="text-white">:</span>{' '}
            <span className={syntaxStyles.number}>{formatConfidence(article.ai_confidence)}</span>
            <span className="text-white">,</span>
          </div>

          {/* タグ配列 */}
          {article.tags && article.tags.length > 0 && (
            <div className="ml-2 sm:ml-4 mb-1">
              <span className={syntaxStyles.variable}>tags</span>
              <span className="text-white">:</span>{' '}
              <span className="text-white">[</span>
              {article.tags.slice(0, isMobile ? 2 : 3).map((tag, index) => (
                <span key={index}>
                  <span className={syntaxStyles.string}>&quot;{tag}&quot;</span>
                  {index < Math.min(article.tags.length, isMobile ? 2 : 3) - 1 && (
                    <span className="text-white">, </span>
                  )}
                </span>
              ))}
              {article.tags.length > (isMobile ? 2 : 3) && (
                <span className={syntaxStyles.comment}> {`/* +${article.tags.length - (isMobile ? 2 : 3)} more */`}</span>
              )}
              <span className="text-white">]</span>
              <span className="text-white">,</span>
            </div>
          )}

          {/* オブジェクト終了 */}
          <div>
            <span className="text-white">{'};'}</span>
          </div>

          {/* 翻訳インジケーター */}
          {isTranslated && (
            <div className={`${syntaxStyles.comment} mt-2 text-xs`}>
              <span>{'// Translated from English using AI'}</span>
            </div>
          )}
        </div>
      </div>

      {/* フッター：実行結果風の表示 */}
      <div className="border-t border-gray-700 px-2 sm:px-4 py-2 bg-editor-bg-secondary responsive-footer">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="text-green-400 hidden sm:inline">
              ✓ Compiled successfully
            </span>
            <span className="text-green-400 sm:hidden">
              ✓ OK
            </span>
            <span className="text-gray-400 hidden sm:inline">
              Confidence: {formatConfidence(article.ai_confidence)}%
            </span>
            <span className="text-gray-400 sm:hidden">
              {formatConfidence(article.ai_confidence)}%
            </span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {isTranslated && (
              <span className="bg-blue-600 text-white px-1 sm:px-2 py-1 rounded text-xs">
                <span className="hidden sm:inline">翻訳済み</span>
                <span className="sm:hidden">翻訳</span>
              </span>
            )}
            <span className="text-gray-400">
              {article.language.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 複数のTerminalNewsItemを表示するリストコンポーネント
 */
interface TerminalNewsListProps {
  /** ニュース記事の配列 */
  articles: NewsItemType[];
  /** 開始行番号 */
  startLineNumber?: number;
  /** 要約を表示するかどうか */
  showSummary?: boolean;
  /** シンタックスハイライトのスタイル */
  syntax?: 'terminal' | 'code' | 'json' | 'javascript' | 'python';
  /** テーマ */
  theme?: 'matrix' | 'hacker' | 'terminal' | 'cyber' | 'vscode';
  /** ホバー時のハイライト効果を有効にするか */
  highlightOnHover?: boolean;
  /** CSSクラス名 */
  className?: string;
}

export const TerminalNewsList: React.FC<TerminalNewsListProps> = ({
  articles,
  startLineNumber = 1,
  showSummary = true,
  syntax = 'javascript',
  theme = 'vscode',
  highlightOnHover = true,
  className = '',
}) => {
  // 各記事の行数を計算（基本7行 + 要約表示時の追加行 + 翻訳時の追加行）
  const calculateLineCount = (article: NewsItemType) => {
    let lines = 7; // 基本行数
    if (showSummary) lines += 1; // 要約行
    if (article.language === 'en' && article.original_title !== article.title) {
      lines += 1; // 翻訳時の元タイトル行
    }
    if (article.tags && article.tags.length > 0) lines += 1; // タグ行
    return lines;
  };

  let currentLineNumber = startLineNumber;

  return (
    <div className={`space-y-4 ${className}`}>
      {articles.map((article, index) => {
        const lineNumber = currentLineNumber;
        currentLineNumber += calculateLineCount(article) + 2; // 記事間の空行を考慮

        return (
          <TerminalNewsItem
            key={article.id || index}
            article={article}
            lineNumber={lineNumber}
            showSummary={showSummary}
            syntax={syntax}
            theme={theme}
            highlightOnHover={highlightOnHover}
          />
        );
      })}
    </div>
  );
};

export default TerminalNewsItem;