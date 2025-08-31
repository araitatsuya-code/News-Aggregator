import React, { useState, useMemo } from 'react';
import { useTranslation } from 'next-i18next';
import { NewsItem as NewsItemType } from '../../lib/types';
import { NewsItem } from './NewsItem';
import { Pagination } from './Pagination';

interface NewsListProps {
  articles: NewsItemType[];
  showSummary?: boolean;
  categoryFilter?: string;
  itemsPerPage?: number;
}

/**
 * ニュース一覧表示コンポーネント
 * カテゴリフィルタリング、ページング、多言語対応を提供
 * レスポンシブデザインとタッチ操作に対応
 */
export function NewsList({ 
  articles, 
  showSummary = true, 
  categoryFilter,
  itemsPerPage = 20
}: NewsListProps) {
  const { t } = useTranslation('news');
  const [currentPage, setCurrentPage] = useState(1);
  
  // カテゴリが指定されている場合はフィルタリング
  const filteredArticles = useMemo(() => 
    categoryFilter 
      ? articles.filter(article => article.category === categoryFilter)
      : articles,
    [articles, categoryFilter]
  );
  
  // ページング用の記事を計算
  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredArticles.slice(startIndex, endIndex);
  }, [filteredArticles, currentPage, itemsPerPage]);
  
  // カテゴリが変更された時はページをリセット
  React.useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter]);

  // 記事がない場合の表示
  if (!filteredArticles || filteredArticles.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="max-w-md mx-auto px-4">
          <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <h3 className="mt-4 text-lg sm:text-xl font-medium text-gray-900">
            {t('no_articles')}
          </h3>
          {categoryFilter && (
            <p className="mt-2 text-sm sm:text-base text-gray-500">
              {t('category_filter.select')}: {categoryFilter}
            </p>
          )}
          <div className="mt-6">
            <button 
              onClick={() => window.location.reload()}
              className="touch-button bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              {t('refresh')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* カテゴリフィルタが適用されている場合のヘッダー */}
      {categoryFilter && (
        <div className="mobile-card p-4 sm:p-6 mb-4 sm:mb-6 bg-blue-50 border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-blue-900 mb-1">
                {t('category')}: {categoryFilter}
              </h2>
              <p className="text-sm text-blue-700">
                {filteredArticles.length}件のニュース
              </p>
            </div>
            <div className="text-blue-600 self-start sm:self-center">
              <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      )}
      
      {/* ニュース記事一覧 */}
      <div className="touch-spacing">
        {paginatedArticles.map((article, index) => (
          <div 
            key={article.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <NewsItem 
              article={article} 
              showSummary={showSummary}
            />
          </div>
        ))}
      </div>
      
      {/* ページング */}
      {filteredArticles.length > itemsPerPage && (
        <div className="mt-6 sm:mt-8">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredArticles.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
      
      {/* モバイル用のページ下部スペース（フローティング要素との重複回避） */}
      <div className="h-4 sm:hidden" />
    </div>
  );
}