import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import { NewsService } from '../lib/data/newsService'
import { useDataLoader } from '../lib/hooks/useDataLoader'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { DataError } from '../components/DataError'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { NewsItem } from '../lib/types'

function NewsListSection() {
  const { data: latestNews, loading, error } = useDataLoader<NewsItem[]>(
    () => NewsService.getLatestNews(20),
    []
  )

  if (loading) {
    return <LoadingSpinner message="最新ニュースを読み込み中..." />
  }

  if (error) {
    return <DataError error={error} />
  }

  if (!latestNews || latestNews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">表示するニュースがありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {latestNews.map((article) => (
        <article key={article.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex-1 mr-4">
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-600 transition-colors duration-200"
              >
                {article.title}
              </a>
            </h2>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
              {article.category}
            </span>
          </div>
          
          <p className="text-gray-600 mb-4 leading-relaxed">
            {article.summary}
          </p>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>{article.source}</span>
              <span>•</span>
              <span>{new Date(article.published_at).toLocaleDateString('ja-JP')}</span>
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
      ))}
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
      </Head>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('site.title')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('site.description')}
          </p>
        </div>
        
        <ErrorBoundary>
          <NewsListSection />
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