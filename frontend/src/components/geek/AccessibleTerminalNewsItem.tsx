import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { NewsItem as NewsItemType } from '../../lib/types';
import { 
  createNewsItemAriaProps, 
  handleKeyboardNavigation,
  generateScreenReaderText,
  FocusManager
} from '../../lib/utils/accessibility';
import { useReducedMotion, useTypingAnimation } from '../../lib/utils/motionPreferences';
import { getWCAGCompliantTheme, generateFocusStyles } from '../../lib/utils/colorContrast';

/**
 * アクセシブルなTerminalNewsItemコンポーネントのプロパティ
 */
interface AccessibleTerminalNewsItemProps {
  /** ニュース記事データ */
  article: NewsItemType;
  /** 行番号 */
  lineNumber: number;
  /** 要約を表示するかどうか */
  showSummary?: boolean;
  /** シンタックスハイライトのスタイル */
  syntax?: 'terminal' | 'code' | 'json' | 'javascript' | 'python';
  /** テーマ */
  theme?: 'dark' | 'light';
  /** ホバー時のハイライト効果を有効にするか */
  highlightOnHover?: boolean;
  /** クリック可能かどうか */
  clickable?: boolean;
  /** CSSクラス名 */
  className?: string;
  /** フォーカス時のコールバック */
  onFocus?: () => void;
  /** ブラー時のコールバック */
  onBlur?: () => void;
}

/**
 * WCAG準拠のアクセシブルなターミナル風ニュース記事コンポーネント
 */
export const AccessibleTerminalNewsItem: React.FC<AccessibleTerminalNewsItemProps> = ({
  article,
  lineNumber,
  showSummary = true,
  syntax = 'javascript',
  theme = 'dark',
  highlightOnHover = true,
  clickable = true,
  className = '',
  onFocus,
  onBlur,
}) => {
  const router = useRouter();
  const { t } = useTranslation('news');
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [announceText, setAnnounceText] = useState('');
  
  const elementRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  
  // 記事が翻訳されているかどうかを判定
  const isTranslated = article.language === 'en' && article.original_title !== article.title;
  const displayTitle = isTranslated ? article.title : article.original_title;

  // タイピングアニメーション（アクセシビリティ対応）
  const { displayText: typedTitle, isComplete } = useTypingAnimation(
    displayTitle,
    50,
    isClient && !prefersReducedMotion
  );

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
    
    // スクリーンリーダー用のアナウンス
    setAnnounceText(`${displayTitle}の記事を新しいタブで開いています`);
    
    window.open(article.url, '_blank', 'noopener,noreferrer');
  }, [article.url, article.title, clickable]);

  /**
   * キーボードナビゲーションの処理
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    handleKeyboardNavigation(
      e,
      () => {
        if (clickable) {
          handleClick(e as any);
        }
      },
      () => {
        // Escapeキーでフォーカスを外す
        if (elementRef.current) {
          elementRef.current.blur();
        }
      }
    );

    // 矢印キーでのナビゲーション
    if (elementRef.current?.parentElement) {
      const container = elementRef.current.parentElement;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          FocusManager.focusNext(container, elementRef.current);
          break;
        case 'ArrowUp':
          e.preventDefault();
          FocusManager.focusPrevious(container, elementRef.current);
          break;
        case 'Home':
          e.preventDefault();
          FocusManager.focusFirst(container);
          break;
        case 'End':
          e.preventDefault();
          FocusManager.focusLast(container);
          break;
      }
    }
  }, [clickable, handleClick]);

  /**
   * フォーカス状態の管理
   */
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    
    // スクリーンリーダー用の詳細情報をアナウンス
    const screenReaderText = generateScreenReaderText.newsArticle(
      displayTitle,
      article.source,
      article.published_at,
      article.category,
      article.ai_confidence
    );
    setAnnounceText(screenReaderText);
    
    onFocus?.();
  }, [displayTitle, article.source, article.published_at, article.category, article.ai_confidence, onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setIsPressed(false);
    onBlur?.();
  }, [onBlur]);

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
    return date.toISOString().split('T')[0];
  }, []);

  /**
   * 信頼度を百分率で表示
   */
  const formatConfidence = useCallback((confidence: number) => {
    return Math.round(confidence * 100);
  }, []);

  // WCAG準拠のカラーテーマを取得
  const colors = getWCAGCompliantTheme(theme);
  
  // フォーカススタイルを生成
  const focusStyles = generateFocusStyles(theme);

  // ARIA属性を生成
  const ariaProps = createNewsItemAriaProps(
    displayTitle,
    article.source,
    article.published_at,
    clickable
  );

  // 動的スタイルの生成
  const dynamicStyles: React.CSSProperties = {
    backgroundColor: colors.background.card,
    color: colors.text.primary,
    borderColor: colors.border.primary,
    ...(isFocused ? focusStyles : {}),
    ...(isHovered && highlightOnHover ? {
      backgroundColor: colors.background.accent,
      borderLeftColor: colors.border.accent,
      borderLeftWidth: '4px',
    } : {}),
    transition: prefersReducedMotion ? 'none' : 'all 0.2s ease-in-out',
    transform: isPressed && !prefersReducedMotion ? 'scale(0.98)' : 'scale(1)',
  };

  return (
    <>
      {/* スクリーンリーダー用のライブリージョン */}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
      >
        {announceText}
      </div>

      <div
        ref={elementRef}
        className={`
          relative border rounded-lg p-4 font-mono transition-all duration-200
          ${clickable ? 'cursor-pointer' : ''}
          ${className}
        `}
        style={dynamicStyles}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={clickable ? handleClick : undefined}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...ariaProps}
      >
        {/* ファイルヘッダー風の表示 */}
        <header className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: colors.border.primary }}>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-500" aria-hidden="true"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500" aria-hidden="true"></div>
              <div className="w-3 h-3 rounded-full bg-green-500" aria-hidden="true"></div>
            </div>
            <span className="text-sm" style={{ color: colors.text.muted }}>
              {article.category.toLowerCase().replace(/\s+/g, '_')}.{syntax}
            </span>
          </div>
          <time 
            dateTime={article.published_at}
            className="text-sm"
            style={{ color: colors.text.muted }}
          >
            {formatDate(article.published_at)}
          </time>
        </header>

        {/* コードブロック風のコンテンツ */}
        <div className="flex">
          {/* 行番号 */}
          <div 
            className="flex flex-col text-right pr-4 text-sm select-none"
            style={{ color: colors.text.muted }}
            aria-hidden="true"
          >
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
              </>
            )}
          </div>

          {/* コード内容 */}
          <div className="flex-1 text-sm leading-relaxed">
            {/* コメント行：カテゴリとソース */}
            <div className="mb-2" style={{ color: colors.syntax.comment }}>
              <span>// {article.category} - {article.source}</span>
            </div>

            {/* メイン記事オブジェクト */}
            <div className="mb-2">
              <span style={{ color: colors.syntax.keyword }}>const</span>{' '}
              <span style={{ color: colors.syntax.variable }}>article</span>{' '}
              <span style={{ color: colors.text.primary }}>=</span>{' '}
              <span style={{ color: colors.text.primary }}>{'{'}</span>
            </div>

            {/* タイトル */}
            <div className="ml-4 mb-1">
              <span style={{ color: colors.syntax.variable }}>title</span>
              <span style={{ color: colors.text.primary }}>:</span>{' '}
              <span style={{ color: colors.syntax.string }} className="break-words">
                &quot;{!isClient || prefersReducedMotion ? displayTitle : (isComplete ? displayTitle : typedTitle || displayTitle)}&quot;
              </span>
              <span style={{ color: colors.text.primary }}>,</span>
            </div>

            {/* 翻訳記事の場合の元タイトル */}
            {isTranslated && (
              <div className="ml-4 mb-1">
                <span style={{ color: colors.syntax.variable }}>originalTitle</span>
                <span style={{ color: colors.text.primary }}>:</span>{' '}
                <span style={{ color: colors.syntax.string }} className="break-words">
                  &quot;{article.original_title}&quot;
                </span>
                <span style={{ color: colors.text.primary }}>,</span>
              </div>
            )}

            {/* URL */}
            <div className="ml-4 mb-1">
              <span style={{ color: colors.syntax.variable }}>url</span>
              <span style={{ color: colors.text.primary }}>:</span>{' '}
              <span style={{ color: colors.syntax.string }} className="break-all">
                &quot;{article.url}&quot;
              </span>
              <span style={{ color: colors.text.primary }}>,</span>
            </div>

            {/* 要約（オプション） */}
            {showSummary && (
              <div className="ml-4 mb-1">
                <span style={{ color: colors.syntax.variable }}>summary</span>
                <span style={{ color: colors.text.primary }}>:</span>{' '}
                <span style={{ color: colors.syntax.string }} className="break-words">
                  &quot;{article.summary}&quot;
                </span>
                <span style={{ color: colors.text.primary }}>,</span>
              </div>
            )}

            {/* メタデータ */}
            <div className="ml-4 mb-1">
              <span style={{ color: colors.syntax.variable }}>publishedAt</span>
              <span style={{ color: colors.text.primary }}>:</span>{' '}
              <span style={{ color: colors.syntax.string }}>&quot;{article.published_at}&quot;</span>
              <span style={{ color: colors.text.primary }}>,</span>
            </div>

            <div className="ml-4 mb-1">
              <span style={{ color: colors.syntax.variable }}>confidence</span>
              <span style={{ color: colors.text.primary }}>:</span>{' '}
              <span style={{ color: colors.syntax.number }}>{formatConfidence(article.ai_confidence)}</span>
              <span style={{ color: colors.text.primary }}>,</span>
            </div>

            {/* タグ配列 */}
            {article.tags && article.tags.length > 0 && (
              <div className="ml-4 mb-1">
                <span style={{ color: colors.syntax.variable }}>tags</span>
                <span style={{ color: colors.text.primary }}>:</span>{' '}
                <span style={{ color: colors.text.primary }}>[</span>
                {article.tags.slice(0, 3).map((tag, index) => (
                  <span key={index}>
                    <span style={{ color: colors.syntax.string }}>&quot;{tag}&quot;</span>
                    {index < Math.min(article.tags.length, 3) - 1 && (
                      <span style={{ color: colors.text.primary }}>, </span>
                    )}
                  </span>
                ))}
                {article.tags.length > 3 && (
                  <span style={{ color: colors.syntax.comment }}> {`/* +${article.tags.length - 3} more */`}</span>
                )}
                <span style={{ color: colors.text.primary }}>]</span>
                <span style={{ color: colors.text.primary }}>,</span>
              </div>
            )}

            {/* オブジェクト終了 */}
            <div>
              <span style={{ color: colors.text.primary }}>{'};'}</span>
            </div>

            {/* 翻訳インジケーター */}
            {isTranslated && (
              <div className="mt-2 text-xs" style={{ color: colors.syntax.comment }}>
                <span>{'// Translated from English using AI'}</span>
              </div>
            )}
          </div>
        </div>

        {/* フッター：実行結果風の表示 */}
        <footer 
          className="mt-4 pt-2 border-t flex items-center justify-between text-xs"
          style={{ borderColor: colors.border.primary }}
        >
          <div className="flex items-center space-x-4">
            <span style={{ color: colors.text.success }}>
              ✓ Compiled successfully
            </span>
            <span style={{ color: colors.text.muted }}>
              Confidence: {formatConfidence(article.ai_confidence)}%
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {isTranslated && (
              <span 
                className="px-2 py-1 rounded text-xs"
                style={{ 
                  backgroundColor: colors.text.accent,
                  color: colors.background.primary 
                }}
              >
                翻訳済み
              </span>
            )}
            <span style={{ color: colors.text.muted }}>
              {article.language.toUpperCase()}
            </span>
          </div>
        </footer>

        {/* フォーカスインジケーター（視覚的） */}
        {isFocused && (
          <div
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              outline: focusStyles.outline,
              outlineOffset: focusStyles.outlineOffset,
            }}
            aria-hidden="true"
          />
        )}
      </div>
    </>
  );
};

export default AccessibleTerminalNewsItem;