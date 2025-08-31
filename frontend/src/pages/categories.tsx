import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import { NewsService } from '../lib/data/newsService'
import { useDataLoader } from '../lib/hooks/useDataLoader'
import { useCategoryFilter } from '../lib/hooks/useCategoryFilter'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { DataError } from '../components/DataError'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { NewsList, CategoryFilter } from '../components/news'
import { NewsItem } from '../lib/types'

function CategoriesContent() {
  const { t } = useTranslation(['common', 'news'])
  const { data: latestNews, loading, error } = useDataLoader<NewsItem[]>(
    () => NewsService.getLatestNews(50), // Load more articles for better category distribution
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
    return <LoadingSpinner message="カテゴリ情報を読み込み中..." />
  }

  if (error) {
    return <DataError error={error} />
  }

  return (
    <div>
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
          カテゴリ別統計
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
        emptyMessage="選択されたカテゴリにはニュースがありません"
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
            カテゴリ別にAIニュースを閲覧できます
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