import React from 'react';
import { DailySummary as DailySummaryType, NewsItem } from '../../lib/types';
import { NewsItem as NewsItemComponent } from '../news/NewsItem';

interface DailySummaryProps {
  summary: DailySummaryType;
  showTrends?: boolean;
  locale?: string;
}

/**
 * 日次サマリーを表示するコンポーネント
 * トレンド情報、カテゴリ別統計、重要ニュースを表示する
 */
export function DailySummary({ summary, showTrends = true, locale = 'ja' }: DailySummaryProps) {
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
          {locale === 'ja' ? '日次サマリー' : 'Daily Summary'}
        </h1>
        <p className="text-lg text-gray-600">
          {formatDate(summary.date)}
        </p>
        <div className="mt-4 flex justify-center space-x-8 text-sm text-gray-500">
          <span>
            {locale === 'ja' ? '記事数' : 'Articles'}: {summary.total_articles}
          </span>
          <span>
            {locale === 'ja' ? '生成日時' : 'Generated'}: {new Date(summary.generated_at).toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US')}
          </span>
        </div>
      </div>

      {/* サマリーテキスト */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {locale === 'ja' ? '今日のまとめ' : "Today's Summary"}
        </h2>
        <p className="text-gray-700 leading-relaxed">
          {getSummaryText()}
        </p>
      </div>

      {/* トレンド情報 */}
      {showTrends && summary.top_trends.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {locale === 'ja' ? 'トップトレンド' : 'Top Trends'}
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
                title={`${locale === 'ja' ? '順位' : 'Rank'}: ${index + 1}`}
              >
                <span className="mr-1 text-xs opacity-75">#{index + 1}</span>
                {trend}
              </span>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            {locale === 'ja' 
              ? `${summary.top_trends.length}個のトレンドを検出` 
              : `${summary.top_trends.length} trends detected`
            }
          </div>
        </div>
      )}

      {showTrends && summary.top_trends.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {locale === 'ja' ? 'トップトレンド' : 'Top Trends'}
          </h2>
          <div className="text-center py-8 text-gray-500">
            {locale === 'ja' ? 'トレンドデータがありません' : 'No trend data available'}
          </div>
        </div>
      )}

      {/* カテゴリ別統計 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {locale === 'ja' ? 'カテゴリ別内訳' : 'Category Breakdown'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(summary.category_breakdown).map(([category, count]) => (
            <div 
              key={category} 
              className="text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              role="button"
              tabIndex={0}
              aria-label={`${category}: ${count} ${locale === 'ja' ? '件' : 'articles'}`}
            >
              <div className="text-2xl font-bold text-blue-600">{count}</div>
              <div className="text-sm text-gray-600 capitalize">{category}</div>
            </div>
          ))}
        </div>
        {Object.keys(summary.category_breakdown).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {locale === 'ja' ? 'カテゴリデータがありません' : 'No category data available'}
          </div>
        )}
      </div>

      {/* 重要ニュース */}
      {summary.significant_news.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {locale === 'ja' ? '重要ニュース' : 'Significant News'}
          </h2>
          <div className="space-y-4">
            {summary.significant_news.map((article) => (
              <NewsItemComponent
                key={article.id}
                article={article}
                showSummary={true}
                locale={locale}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}