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

function NewsListSection() {
  const { data: latestNews, loading, error } = useDataLoader<NewsItem[]>(
    () => NewsService.getLatestNews(20),
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
    return (
      <div className="flex justify-center items-center py-12 sm:py-16">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 sm:py-12">
        <DataError error={error} />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <CategoryFilter
        categories={availableCategories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        articleCounts={articleCounts}
      />
      <NewsList 
        articles={filteredArticles} 
        showSummary={true}
      />
    </div>
  )
}

export default function Home() {
  const { t } = useTranslation('common')

  return (
    <>
      <Head>
        <title>{t('site.title')}</title>
        <meta name="description" content={t('site.description')} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </Head>
      
      <div className="responsive-container py-4 sm:py-6 lg:py-8">
        {/* ヘッダーセクション */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            {t('site.title')}
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {t('site.description')}
          </p>
          
          {/* モバイル用の統計情報 */}
          <div className="mt-4 sm:hidden">
            <div className="flex justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                毎日更新
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                AI要約
              </div>
            </div>
          </div>
        </div>
        
        {/* メインコンテンツ */}
        <ErrorBoundary>
          <NewsListSection />
        </ErrorBoundary>
        
        {/* フローティングアクションボタン（モバイル用） */}
        <div className="fixed bottom-4 right-4 sm:hidden z-40">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="touch-button bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200"
            aria-label="ページトップに戻る"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
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