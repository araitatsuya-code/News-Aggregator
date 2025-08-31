import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import { NewsService } from '../lib/data/newsService'
import { useDataLoader } from '../lib/hooks/useDataLoader'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { DataError } from '../components/DataError'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { NewsList } from '../components/news'
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

  return (
    <NewsList 
      articles={latestNews || []} 
      showSummary={true}
      emptyMessage="表示するニュースがありません"
    />
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