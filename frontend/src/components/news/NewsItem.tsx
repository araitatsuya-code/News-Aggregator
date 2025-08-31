import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { NewsItem as NewsItemType } from '../../lib/types';

interface NewsItemProps {
  article: NewsItemType;
  showSummary?: boolean;
}

/**
 * ニュース記事項目コンポーネント
 * 翻訳された記事の場合は元タイトルも表示する
 * レスポンシブデザインとタッチ操作に対応
 */
export function NewsItem({ article, showSummary = true }: NewsItemProps) {
  const router = useRouter();
  const { t } = useTranslation('news');
  const locale = router.locale || 'ja';
  const [isPressed, setIsPressed] = useState(false);

  /**
   * 外部リンクをクリックした時の処理
   * 新しいタブで記事を開く
   */
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  /**
   * タッチ操作のフィードバック
   */
  const handleTouchStart = () => {
    setIsPressed(true);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  /**
   * 日付をロケールに応じてフォーマットする
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    // 24時間以内の場合は相対時間で表示
    if (diffInHours < 24) {
      if (diffInHours < 1) {
        return t('time.just_now');
      } else if (diffInHours === 1) {
        return t('time.hour_ago', { count: 1 });
      } else {
        return t('time.hours_ago', { count: diffInHours });
      }
    }
    
    // それ以外は通常の日付表示
    return date.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * 記事が翻訳されているかどうかを判定する
   */
  const isTranslated = article.language === 'en' && article.original_title !== article.title;

  /**
   * 表示するタイトルを決定する
   * 翻訳記事の場合は翻訳されたタイトルを表示
   */
  const displayTitle = isTranslated ? article.title : article.original_title;

  return (
    <article 
      className={`mobile-card p-4 sm:p-6 transition-all duration-200 ${
        isPressed ? 'scale-98 shadow-lg' : ''
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ヘッダー部分：タイトルとカテゴリ */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 space-y-2 sm:space-y-0">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex-1 sm:mr-4 leading-tight">
          <a 
            href={article.url}
            onClick={handleClick}
            className="hover-desktop hover:text-blue-600 active:text-blue-700 transition-colors duration-200 cursor-pointer touch-button block"
            title={`${displayTitle} - ${t('external_link')}`}
          >
            {displayTitle}
          </a>
        </h2>
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full whitespace-nowrap self-start sm:self-center">
          {article.category}
        </span>
      </div>
      
      {/* 翻訳記事の場合の元タイトル表示 */}
      {isTranslated && (
        <div className="mb-3 p-3 bg-blue-50 border-l-4 border-blue-200 rounded-r">
          <p className="text-sm text-blue-700 mb-1">
            <span className="font-medium">{t('original_title')}:</span>
          </p>
          <p className="text-sm text-blue-800 italic break-words">
            {article.original_title}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {t('translation_note')}
          </p>
        </div>
      )}
      
      {/* 記事要約 */}
      {showSummary && (
        <p className="text-gray-600 mb-4 leading-relaxed text-sm sm:text-base">
          {article.summary}
        </p>
      )}
      
      {/* メタデータ部分 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-500 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <span className="font-medium truncate max-w-32 sm:max-w-none">{article.source}</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-xs sm:text-sm">{formatDate(article.published_at)}</span>
        </div>
        <div className="flex items-center justify-between sm:justify-end space-x-2">
          {isTranslated && (
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">{t('translated')}</span>
              <span className="sm:hidden">翻訳</span>
            </span>
          )}
          <span className="text-xs flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {Math.round(article.ai_confidence * 100)}%
          </span>
        </div>
      </div>
      
      {/* タグ表示 */}
      {article.tags && article.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {article.tags.slice(0, 5).map((tag, index) => (
            <span 
              key={index}
              className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded hover-desktop hover:bg-gray-200 active:bg-gray-200 transition-colors duration-200 touch-button"
            >
              #{tag}
            </span>
          ))}
          {article.tags.length > 5 && (
            <span className="text-xs text-gray-400 px-2 py-1">
              +{article.tags.length - 5}
            </span>
          )}
        </div>
      )}
    </article>
  );
}