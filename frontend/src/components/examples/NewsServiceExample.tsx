import React, { useState } from 'react';
import { NewsService } from '../../lib/data/newsService';
import { useDataLoader } from '../../lib/hooks/useDataLoader';
import { LoadingSpinner } from '../LoadingSpinner';
import { DataError } from '../DataError';
import { NewsItem, DailySummary } from '../../lib/types';

/**
 * Example component demonstrating NewsService usage
 * This component shows how to use the data access layer
 */
export function NewsServiceExample() {
  const [selectedDate, setSelectedDate] = useState('2025-08-31');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Load latest news
  const { 
    data: latestNews, 
    loading: loadingLatest, 
    error: latestError 
  } = useDataLoader<NewsItem[]>(() => NewsService.getLatestNews(10), []);

  // Load daily summary
  const { 
    data: dailySummary, 
    loading: loadingSummary, 
    error: summaryError 
  } = useDataLoader<DailySummary>(() => NewsService.getLatestSummary(), []);

  // Load categories
  const { 
    data: categories, 
    loading: loadingCategories, 
    error: categoriesError 
  } = useDataLoader<string[]>(() => NewsService.getCategories(), []);

  // Load filtered news by category
  const { 
    data: categoryNews, 
    loading: loadingCategoryNews, 
    error: categoryError 
  } = useDataLoader<NewsItem[]>(
    () => selectedCategory ? NewsService.getNewsByCategory(selectedCategory) : Promise.resolve([]),
    [selectedCategory]
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">NewsService Example</h1>
      
      {/* Latest News Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">最新ニュース (10件)</h2>
        {loadingLatest && <LoadingSpinner message="最新ニュースを読み込み中..." />}
        {latestError && <DataError error={latestError} />}
        {latestNews && (
          <div className="space-y-4">
            {latestNews.map((article) => (
              <div key={article.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{article.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{article.summary}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{article.source} - {article.category}</span>
                  <span>{new Date(article.published_at).toLocaleDateString('ja-JP')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Daily Summary Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">日次サマリー</h2>
        {loadingSummary && <LoadingSpinner message="サマリーを読み込み中..." />}
        {summaryError && <DataError error={summaryError} />}
        {dailySummary && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              {dailySummary.date} のサマリー
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-sm text-blue-700">総記事数:</span>
                <span className="ml-2 font-medium">{dailySummary.total_articles}</span>
              </div>
              <div>
                <span className="text-sm text-blue-700">生成日時:</span>
                <span className="ml-2 font-medium">
                  {new Date(dailySummary.generated_at).toLocaleString('ja-JP')}
                </span>
              </div>
            </div>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">カテゴリ別内訳:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(dailySummary.category_breakdown).map(([category, count]) => (
                  <span
                    key={category}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    {category}: {count}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">サマリー:</h4>
              <p className="text-sm text-blue-700">{dailySummary.summary_ja}</p>
            </div>
          </div>
        )}
      </section>

      {/* Category Filter Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">カテゴリ別ニュース</h2>
        
        {/* Category Selection */}
        <div className="mb-4">
          {loadingCategories && <LoadingSpinner size="sm" message="カテゴリを読み込み中..." />}
          {categoriesError && <DataError error={categoriesError} />}
          {categories && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1 rounded text-sm ${
                  selectedCategory === ''
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                すべて
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category News Results */}
        {selectedCategory && (
          <>
            {loadingCategoryNews && <LoadingSpinner message={`${selectedCategory}のニュースを読み込み中...`} />}
            {categoryError && <DataError error={categoryError} />}
            {categoryNews && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  {selectedCategory}カテゴリ: {categoryNews.length}件
                </p>
                {categoryNews.map((article) => (
                  <div key={article.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 text-sm mb-1">{article.title}</h4>
                    <p className="text-xs text-gray-600 mb-2">{article.summary}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{article.source}</span>
                      <span>{new Date(article.published_at).toLocaleDateString('ja-JP')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}