import React from 'react';
import { useTranslation } from 'next-i18next';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

/**
 * ページングコンポーネント
 * デフォルト20件表示でページネーション機能を提供
 * レスポンシブデザインとタッチ操作に対応
 */
export function Pagination({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange 
}: PaginationProps) {
  const { t } = useTranslation('news');
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // ページが1ページしかない場合は表示しない
  if (totalPages <= 1) {
    return null;
  }
  
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  // 表示するページ番号を計算
  const getVisiblePages = () => {
    const delta = 2; // 現在のページの前後に表示するページ数
    const range = [];
    const rangeWithDots = [];
    
    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }
    
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }
    
    rangeWithDots.push(...range);
    
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }
    }
    
    return rangeWithDots;
  };
  
  const visiblePages = getVisiblePages();
  
  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage) {
      onPageChange(page);
      // ページトップにスクロール
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  return (
    <div className="bg-white px-4 py-3 sm:px-6 border-t border-gray-200">
      {/* アイテム数表示 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-700 mb-4 sm:mb-0">
          <span>
            {t('pagination.showing', { 
              start: startItem, 
              end: endItem, 
              total: totalItems 
            })}
          </span>
        </div>
        
        {/* ページネーション */}
        <div className="flex items-center justify-center sm:justify-end space-x-1">
          {/* 前へボタン */}
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className={`
              relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium
              ${currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50 touch-button'
              }
            `}
            aria-label={t('pagination.previous')}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          {/* ページ番号 */}
          {visiblePages.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  ...
                </span>
              ) : (
                <button
                  onClick={() => handlePageClick(page)}
                  className={`
                    relative inline-flex items-center px-4 py-2 border text-sm font-medium touch-button
                    ${page === currentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }
                  `}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
          
          {/* 次へボタン */}
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className={`
              relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium
              ${currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50 touch-button'
              }
            `}
            aria-label={t('pagination.next')}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* モバイル用ページジャンプ */}
      <div className="mt-4 sm:hidden">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-sm text-gray-700">{t('pagination.page')}</span>
          <select
            value={currentPage}
            onChange={(e) => handlePageClick(parseInt(e.target.value))}
            className="form-select text-sm border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <option key={page} value={page}>
                {page}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-700">
            / {totalPages}
          </span>
        </div>
      </div>
    </div>
  );
}