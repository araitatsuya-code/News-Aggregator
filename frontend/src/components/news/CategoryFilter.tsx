import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  articleCounts?: Record<string, number>;
}

/**
 * カテゴリフィルターコンポーネント
 * レスポンシブデザインとタッチ操作に対応
 * デスクトップではボタン、モバイルではドロップダウンとボタンの両方を提供
 */
export function CategoryFilter({ 
  categories, 
  selectedCategory, 
  onCategoryChange,
  articleCounts = {}
}: CategoryFilterProps) {
  const { t } = useTranslation('news');
  const [isExpanded, setIsExpanded] = useState(false);

  // 表示するカテゴリ数の制限（モバイル用）
  const maxVisibleCategories = 3;
  const visibleCategories = isExpanded ? categories : categories.slice(0, maxVisibleCategories);
  const hasMoreCategories = categories.length > maxVisibleCategories;

  const getButtonClassName = (isSelected: boolean) => {
    return `touch-button px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
      isSelected
        ? 'bg-blue-600 text-white shadow-md scale-105'
        : 'bg-gray-100 text-gray-700 hover-desktop hover:bg-gray-200 active:bg-gray-200 active:scale-95'
    }`;
  };

  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
          </svg>
          {t('category_filter.title', 'カテゴリで絞り込み')}
        </h3>
        
        {/* モバイル用の展開/折りたたみボタン */}
        {hasMoreCategories && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="sm:hidden touch-button text-blue-600 text-sm flex items-center"
          >
            {isExpanded ? (
              <>
                <span className="mr-1">{t('category_filter.show_less', '少なく表示')}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                <span className="mr-1">{t('category_filter.show_more', 'もっと表示')}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>
      
      {/* デスクトップ・モバイル共通のボタン表示 */}
      <div className="flex flex-wrap gap-2">
        {/* All categories button */}
        <button
          onClick={() => onCategoryChange(null)}
          className={getButtonClassName(selectedCategory === null)}
        >
          <span className="flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            {t('category_filter.all', 'すべて')}
          </span>
          {articleCounts['all'] && (
            <span className="ml-1 text-xs opacity-75 bg-white bg-opacity-20 px-1 rounded">
              {articleCounts['all']}
            </span>
          )}
        </button>

        {/* Individual category buttons */}
        {visibleCategories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={getButtonClassName(selectedCategory === category)}
          >
            <span className="break-words">{category}</span>
            {articleCounts[category] && (
              <span className="ml-1 text-xs opacity-75 bg-white bg-opacity-20 px-1 rounded">
                {articleCounts[category]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* モバイル用のドロップダウン（補助的な選択方法として） */}
      <div className="sm:hidden mt-4">
        <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-2">
          {t('category_filter.select', 'カテゴリを選択')}
        </label>
        <div className="relative">
          <select
            id="category-select"
            value={selectedCategory || ''}
            onChange={(e) => onCategoryChange(e.target.value || null)}
            className="block w-full px-3 py-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-base touch-button"
          >
            <option value="">
              {t('category_filter.all', 'すべて')}
              {articleCounts['all'] && ` (${articleCounts['all']})`}
            </option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
                {articleCounts[category] && ` (${articleCounts[category]})`}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* 選択中のカテゴリ情報 */}
      {selectedCategory && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t('category_filter.filtered_by', 'フィルター中')}: {selectedCategory}
            </span>
            <button
              onClick={() => onCategoryChange(null)}
              className="text-blue-600 hover:text-blue-800 text-sm touch-button"
            >
              {t('category_filter.clear', 'クリア')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}