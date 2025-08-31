import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { DailySummary as DailySummaryType, NewsItem } from '../../lib/types';
import { NewsItem as NewsItemComponent } from '../news/NewsItem';

interface DailySummaryProps {
  summary: DailySummaryType;
  showTrends?: boolean;
}

/**
 * 日次サマリーを表示するコンポーネント
 * トレンド情報、カテゴリ別統計、重要ニュースを表示する
 * レスポンシブデザインとタッチ操作に対応
 */
export function DailySummary({ summary, showTrends = true }: DailySummaryProps) {
  const router = useRouter();
  const { t } = useTranslation('summary');
  const locale = router.locale || 'ja';
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getSummaryText = () => {
    return locale === 'ja' ? summary.summary_ja : summary.summary_en;
  };

  return (
    <div className="responsive-container space-y-6 sm:space-y-8 py-4 sm:py-6">
      {/* ヘッダー */}
      <div className="text-center border-b pb-4 sm:pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {t('title')}
        </h1>
        <p className="text-base sm:text-lg text-gray-600 mb-3">
          {formatDate(summary.date)}
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8 text-sm text-gray-500">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
            </svg>
            {t('articles_count')}: {summary.total_articles}
          </span>
          <span className="flex items-center text-xs sm:text-sm">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            {t('generated_at')}: {new Date(summary.generated_at).toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US')}
          </span>
        </div>
      </div>

      {/* サマリーテキスト */}
      <div className="mobile-card bg-blue-50 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          {t('today_summary')}
        </h2>
        <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
          {getSummaryText()}
        </p>
      </div>

      {/* トレンド情報 */}
      {showTrends && summary.top_trends.length > 0 && (
        <div className="mobile-card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            {t('top_trends')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {summary.top_trends.map((trend, index) => (
              <span
                key={index}
                className={`inline-block px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 touch-button ${
                  index === 0 
                    ? 'bg-red-100 text-red-800 hover-desktop hover:bg-red-200' 
                    : index === 1 
                    ? 'bg-orange-100 text-orange-800 hover-desktop hover:bg-orange-200'
                    : index === 2
                    ? 'bg-yellow-100 text-yellow-800 hover-desktop hover:bg-yellow-200'
                    : 'bg-blue-100 text-blue-800 hover-desktop hover:bg-blue-200'
                }`}
                title={`${t('rank')}: ${index + 1}`}
              >
                <span className="mr-1 text-xs opacity-75">#{index + 1}</span>
                <span className="break-words">{trend}</span>
              </span>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {summary.top_trends.length}{t('trends_detected')}
          </div>
        </div>
      )}

      {showTrends && summary.top_trends.length === 0 && (
        <div className="mobile-card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            {t('top_trends')}
          </h2>
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">{t('no_trend_data')}</p>
          </div>
        </div>
      )}

      {/* カテゴリ別統計 */}
      <div className="mobile-card p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          {t('category_breakdown')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Object.entries(summary.category_breakdown).map(([category, count]) => (
            <div 
              key={category} 
              className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg hover-desktop hover:bg-gray-100 active:bg-gray-100 transition-colors duration-200 touch-button"
              role="button"
              tabIndex={0}
              aria-label={`${category}: ${count} ${t('articles_count')}`}
            >
              <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">{count}</div>
              <div className="text-xs sm:text-sm text-gray-600 capitalize break-words">{category}</div>
            </div>
          ))}
        </div>
        {Object.keys(summary.category_breakdown).length === 0 && (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">{t('no_category_data')}</p>
          </div>
        )}
      </div>

      {/* 重要ニュース */}
      {summary.significant_news.length > 0 && (
        <div className="mobile-card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {t('significant_news')}
          </h2>
          <div className="touch-spacing">
            {summary.significant_news.map((article, index) => (
              <div 
                key={article.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <NewsItemComponent
                  article={article}
                  showSummary={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* モバイル用の下部スペース */}
      <div className="h-4 sm:hidden" />
    </div>
  );
}