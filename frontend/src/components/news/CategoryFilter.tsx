import React from 'react';
import { useTranslation } from 'next-i18next';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  articleCounts?: Record<string, number>;
}

export function CategoryFilter({ 
  categories, 
  selectedCategory, 
  onCategoryChange,
  articleCounts = {}
}: CategoryFilterProps) {
  const { t } = useTranslation('news');

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        {t('category_filter.title', 'カテゴリで絞り込み')}
      </h3>
      
      <div className="flex flex-wrap gap-2">
        {/* All categories button */}
        <button
          onClick={() => onCategoryChange(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
            selectedCategory === null
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('category_filter.all', 'すべて')}
          {articleCounts['all'] && (
            <span className="ml-1 text-xs opacity-75">
              ({articleCounts['all']})
            </span>
          )}
        </button>

        {/* Individual category buttons */}
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
              selectedCategory === category
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
            {articleCounts[category] && (
              <span className="ml-1 text-xs opacity-75">
                ({articleCounts[category]})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Mobile dropdown for smaller screens */}
      <div className="md:hidden mt-4">
        <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-2">
          {t('category_filter.select', 'カテゴリを選択')}
        </label>
        <select
          id="category-select"
          value={selectedCategory || ''}
          onChange={(e) => onCategoryChange(e.target.value || null)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
      </div>
    </div>
  );
}