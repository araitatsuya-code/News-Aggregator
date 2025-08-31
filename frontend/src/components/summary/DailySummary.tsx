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
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* ヘッダー */}
      <div className="text-center border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('title')}
        </h1>
        <p className="text-lg text-gray-600">
          {formatDate(summary.date)}
        </p>
        <div className="mt-4 flex justify-center space-x-8 text-sm text-gray-500">
          <span>
            {t('articles_count')}: {summary.total_articles}
          </span>
          <span>
            {t('generated_at')}: {new Date(summary.generated_at).toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US')}
          </span>
        </div>
      </div>

      {/* サマリーテキスト */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t('today_summary')}
        </h2>
        <p className="text-gray-700 leading-relaxed">
          {getSummaryText()}
        </p>
      </div>

      {/* トレンド情報 */}
      {showTrends && summary.top_trends.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('top_trends')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {summary.top_trends.map((trend, index) => (
              <span
                key={index}
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  index === 0 
                    ? 'bg-red-100 text-red-800' 
                    : index === 1 
                    ? 'bg-orange-100 text-orange-800'
                    : index === 2
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
                title={`${t('rank')}: ${index + 1}`}
              >
                <span className="mr-1 text-xs opacity-75">#{index + 1}</span>
                {trend}
              </span>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            {summary.top_trends.length}{t('trends_detected')}
          </div>
        </div>
      )}

      {showTrends && summary.top_trends.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('top_trends')}
          </h2>
          <div className="text-center py-8 text-gray-500">
            {t('no_trend_data')}
          </div>
        </div>
      )}

      {/* カテゴリ別統計 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t('category_breakdown')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(summary.category_breakdown).map(([category, count]) => (
            <div 
              key={category} 
              className="text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              role="button"
              tabIndex={0}
              aria-label={`${category}: ${count} ${t('articles_count')}`}
            >
              <div className="text-2xl font-bold text-blue-600">{count}</div>
              <div className="text-sm text-gray-600 capitalize">{category}</div>
            </div>
          ))}
        </div>
        {Object.keys(summary.category_breakdown).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {t('no_category_data')}
          </div>
        )}
      </div>

      {/* 重要ニュース */}
      {summary.significant_news.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('significant_news')}
          </h2>
          <div className="space-y-4">
            {summary.significant_news.map((article) => (
              <NewsItemComponent
                key={article.id}
                article={article}
                showSummary={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}