import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import { useEffect } from 'react'
import { DailySummary, DateSelector } from '../components/summary'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { DataError } from '../components/DataError'
import { useDailySummary } from '../lib/hooks/useDailySummary'
import { useDateNavigation } from '../lib/hooks/useDateNavigation'

export default function Summary() {
  const { t, i18n } = useTranslation(['common', 'summary'])
  const { selectedDate, setSelectedDate, availableDates, setAvailableDates } = useDateNavigation()
  const { summary, loading, error, availableDates: fetchedDates, refetch } = useDailySummary(selectedDate)

  const handleRetry = () => {
    refetch()
  }

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 取得した利用可能な日付をナビゲーションフックに設定
  useEffect(() => {
    if (fetchedDates.length > 0) {
      setAvailableDates(fetchedDates)
    }
  }, [fetchedDates, setAvailableDates])

  return (
    <>
      <Head>
        <title>{t('summary:title')} - {t('common:site.title')}</title>
        <meta name="description" content={t('summary:description')} />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ヘッダーと日付選択 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">
              {t('summary:title')}
            </h1>
            {selectedDate && (
              <div className="flex items-center space-x-4">
                {/* 日付ナビゲーション */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const currentIndex = availableDates.indexOf(selectedDate);
                      if (currentIndex < availableDates.length - 1) {
                        setSelectedDate(availableDates[currentIndex + 1]);
                      }
                    }}
                    disabled={!availableDates.length || availableDates.indexOf(selectedDate) >= availableDates.length - 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={i18n.language === 'ja' ? '前日' : 'Previous day'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const currentIndex = availableDates.indexOf(selectedDate);
                      if (currentIndex > 0) {
                        setSelectedDate(availableDates[currentIndex - 1]);
                      }
                    }}
                    disabled={!availableDates.length || availableDates.indexOf(selectedDate) <= 0}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={i18n.language === 'ja' ? '翌日' : 'Next day'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                <DateSelector
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  availableDates={availableDates}
                  locale={i18n.language}
                />
              </div>
            )}
          </div>

          {/* コンテンツ */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner />
              <p className="mt-4 text-gray-600">
                {t('summary:loading')}
              </p>
            </div>
          )}

          {error && (
            <div className="max-w-2xl mx-auto">
              <DataError
                message={error}
                onRetry={handleRetry}
              />
            </div>
          )}

          {!summary && !loading && !error && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">
                {t('summary:no_summary')}
              </div>
              <p className="mt-2 text-gray-400">
                {selectedDate && formatDateForDisplay(selectedDate)}
              </p>
            </div>
          )}

          {summary && !loading && !error && (
            <DailySummary
              summary={summary}
              showTrends={true}
              locale={i18n.language}
            />
          )}
        </div>
      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'ja', ['common', 'summary'])),
    },
  }
}