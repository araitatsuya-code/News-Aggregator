import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import { NewsService } from '../lib/data/newsService'
import { useNewsDataWithFallback } from '../lib/hooks/useDataLoaderWithFallback'
import { useCategoryFilter } from '../lib/hooks/useCategoryFilter'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { DataError } from '../components/DataError'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { NewsList, CategoryFilter } from '../components/news'
import { NewsItem } from '../lib/types'

function CategoriesContent() {
  const { t } = useTranslation(['common', 'news'])
  const { 
    data: latestNews, 
    loading, 
    error, 
    isUsingFallback,
    retry 
  } = useNewsDataWithFallback<NewsItem[]>(
    () => NewsService.getLatestNews(100), // Load all articles for better category distribution
    [], // フォールバックデータは空配列
    []
  )

  const {
    selectedCategory,
    setSelectedCategory,
    filteredArticles,
    articleCounts,
    availableCategories,
  } = useCategoryFilter(latestNews || [])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error && !isUsingFallback) {
    return (
      <DataError 
        error={error} 
        onRetry={retry}
        context="カテゴリページのニュース一覧"
        showFallback={true}
      />
    )
  }

  return (
    <div>
      {/* フォールバック使用時の通知 */}
      {isUsingFallback && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-yellow-800">
              キャッシュされたデータを表示しています。最新の情報ではない可能性があります。
            </span>
          </div>
        </div>
      )}
      
      <div className="mb-8">
        <CategoryFilter
          categories={availableCategories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          articleCounts={articleCounts}
        />
      </div>

      {/* Category Statistics */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {t('news:category_filter.title')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {availableCategories.map((category) => (
            <div
              key={category}
              className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                selectedCategory === category
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {articleCounts[category] || 0}
                </div>
                <div className="text-sm text-gray-600">{category}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <NewsList 
        articles={filteredArticles} 
        showSummary={true}
      />
    </div>
  )
}

export default function Categories() {
  const { t } = useTranslation(['common', 'news'])

  return (
    <>
      <Head>
        <title>{t('common:navigation.categories')} - {t('common:site.title')}</title>
        <meta name="description" content="AIニュースをカテゴリ別に閲覧" />
      </Head>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('common:navigation.categories')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('common:site.description')}
          </p>
        </div>
        
        <ErrorBoundary>
          <CategoriesContent />
        </ErrorBoundary>
      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'ja', ['common', 'news'])),
    },
  }
}