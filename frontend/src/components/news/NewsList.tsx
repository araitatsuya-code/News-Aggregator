import React from 'react';
import { NewsItem as NewsItemType } from '../../lib/types';
import { NewsItem } from './NewsItem';

interface NewsListProps {
  articles: NewsItemType[];
  showSummary?: boolean;
  categoryFilter?: string;
  emptyMessage?: string;
}

export function NewsList({ 
  articles, 
  showSummary = true, 
  categoryFilter,
  emptyMessage = "表示するニュースがありません"
}: NewsListProps) {
  // Filter articles by category if specified
  const filteredArticles = categoryFilter 
    ? articles.filter(article => article.category === categoryFilter)
    : articles;

  if (!filteredArticles || filteredArticles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{emptyMessage}</p>
        {categoryFilter && (
          <p className="text-sm text-gray-400 mt-2">
            カテゴリ「{categoryFilter}」にはニュースがありません
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categoryFilter && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            カテゴリ: {categoryFilter}
          </h2>
          <p className="text-sm text-gray-600">
            {filteredArticles.length}件のニュース
          </p>
        </div>
      )}
      
      {filteredArticles.map((article) => (
        <NewsItem 
          key={article.id} 
          article={article} 
          showSummary={showSummary}
        />
      ))}
    </div>
  );
}