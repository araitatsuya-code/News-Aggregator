import React from 'react';
import { NewsItem as NewsItemType } from '../../lib/types';

interface NewsItemProps {
  article: NewsItemType;
  showSummary?: boolean;
}

export function NewsItem({ article, showSummary = true }: NewsItemProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // External link navigation - opens in new tab
    e.preventDefault();
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 flex-1 mr-4">
          <a 
            href={article.url}
            onClick={handleClick}
            className="hover:text-blue-600 transition-colors duration-200 cursor-pointer"
            title={`${article.title} - 外部リンクで開く`}
          >
            {article.title}
          </a>
        </h2>
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
          {article.category}
        </span>
      </div>
      
      {article.language === 'en' && article.original_title !== article.title && (
        <p className="text-sm text-gray-500 mb-2 italic">
          原題: {article.original_title}
        </p>
      )}
      
      {showSummary && (
        <p className="text-gray-600 mb-4 leading-relaxed">
          {article.summary}
        </p>
      )}
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span className="font-medium">{article.source}</span>
          <span>•</span>
          <span>{formatDate(article.published_at)}</span>
        </div>
        <div className="flex items-center space-x-2">
          {article.language === 'en' && (
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
              翻訳済み
            </span>
          )}
          <span className="text-xs">
            信頼度: {Math.round(article.ai_confidence * 100)}%
          </span>
        </div>
      </div>
      
      {article.tags && article.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {article.tags.map((tag, index) => (
            <span 
              key={index}
              className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}