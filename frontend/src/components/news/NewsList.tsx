import React from 'react';
import { useTranslation } from 'next-i18next';
import { NewsItem as NewsItemType } from '../../lib/types';
import { NewsItem } from './NewsItem';

interface NewsListProps {
  articles: NewsItemType[];
  showSummary?: boolean;
  categoryFilter?: string;
}

/**
 * ニュース一覧表示コンポーネント
 * カテゴリフィルタリングと多言語対応を提供
 */
export function NewsList({ 
  articles, 
  showSummary = true, 
  categoryFilter
}: NewsListProps) {
  const { t } = useTranslation('news');
  // カテゴリが指定されている場合はフィルタリング
  const filteredArticles = categoryFilter 
    ? articles.filter(article => article.category === categoryFilter)
    : articles;

  // 記事がない場合の表示
  if (!filteredArticles || filteredArticles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {t('no_articles')}
          </h3>
          {categoryFilter && (
            <p className="mt-2 text-sm text-gray-500">
              {t('category_filter.select')}: {categoryFilter}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* カテゴリフィルタが適用されている場合のヘッダー */}
      {categoryFilter && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-blue-900 mb-1">
                {t('category')}: {categoryFilter}
              </h2>
              <p className="text-sm text-blue-700">
                {filteredArticles.length}件のニュース
              </p>
            </div>
            <div className="text-blue-600">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      )}
      
      {/* ニュース記事一覧 */}
      <div className="space-y-6">
        {filteredArticles.map((article) => (
          <NewsItem 
            key={article.id} 
            article={article} 
            showSummary={showSummary}
          />
        ))}
      </div>
    </div>
  );
}