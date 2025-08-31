import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { DailySummary, DateSelector } from '../components/summary'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { DataError } from '../components/DataError'
import { useDailySummary } from '../lib/hooks/useDailySummary'
import { useDateNavigation } from '../lib/hooks/useDateNavigation'

export default function Summary() {
  const { t, i18n } = useTranslation(['common', 'summary'])
  const { selectedDate, setSelectedDate, availableDates, setAvailableDates } = useDateNavigation()
  const { summary, loading, error, availableDates: fetchedDates, refetch } = useDailySummary(selectedDate)
  const [showDatePicker, setShowDatePicker] = useState(false)

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

  // 日付ナビゲーション関数
  const navigateDate = (direction: 'prev' | 'next') => {
    const currentIndex = availableDates.indexOf(selectedDate);
    if (direction === 'prev' && currentIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[currentIndex + 1]);
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedDate(availableDates[currentIndex - 1]);
    }
  };

  const canNavigatePrev = availableDates.length > 0 && availableDates.indexOf(selectedDate) < availableDates.length - 1;
  const canNavigateNext = availableDates.length > 0 && availableDates.indexOf(selectedDate) > 0;

  return (
    <>
      <Head>
        <title>{t('summary:title')} - {t('common:site.title')}</title>
        <meta name="description" content={t('summary:description')} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="responsive-container py-4 sm:py-6 lg:py-8">
          {/* ヘッダーと日付選択 */}
          <div className="mb-6 sm:mb-8">
            {/* モバイル用のコンパクトヘッダー */}
            <div className="sm:hidden">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900">
                  {t('summary:title')}
                </h1>
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="touch-button flex items-center space-x-1 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">日付選択</span>
                </button>
              </div>
              
              {/* 現在の日付表示 */}
              {selectedDate && (
                <div className="text-center mb-4">
                  <p className="text-lg font-medium text-gray-700">
                    {formatDateForDisplay(selectedDate)}
                  </p>
                </div>
              )}
              
              {/* モバイル用日付ナビゲーション */}
              <div className="flex items-center justify-center space-x-4 mb-4">
                <button
                  onClick={() => navigateDate('prev')}
                  disabled={!canNavigatePrev}
                  className="touch-button p-3 rounded-full bg-white border border-gray-300 hover-desktop hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-100 transition-all duration-200"
                  aria-label="前日"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="text-sm text-gray-500 px-4">
                  {availableDates.indexOf(selectedDate) + 1} / {availableDates.length}
                </div>
                
                <button
                  onClick={() => navigateDate('next')}
                  disabled={!canNavigateNext}
                  className="touch-button p-3 rounded-full bg-white border border-gray-300 hover-desktop hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-100 transition-all duration-200"
                  aria-label="翌日"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* モバイル用日付選択ドロップダウン */}
              {showDatePicker && (
                <div className="mb-4 animate-slide-down">
                  <DateSelector
                    selectedDate={selectedDate}
                    onDateChange={(date) => {
                      setSelectedDate(date);
                      setShowDatePicker(false);
                    }}
                    availableDates={availableDates}
                    locale={i18n.language}
                  />
                </div>
              )}
            </div>

            {/* デスクトップ用のヘッダー */}
            <div className="hidden sm:flex sm:items-center sm:justify-between">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t('summary:title')}
              </h1>
              {selectedDate && (
                <div className="flex items-center space-x-4">
                  {/* 日付ナビゲーション */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigateDate('prev')}
                      disabled={!canNavigatePrev}
                      className="touch-button p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={i18n.language === 'ja' ? '前日' : 'Previous day'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => navigateDate('next')}
                      disabled={!canNavigateNext}
                      className="touch-button p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          </div>

          {/* コンテンツ */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
              <LoadingSpinner />
              <p className="mt-4 text-gray-600 text-sm sm:text-base">
                {t('summary:loading')}
              </p>
            </div>
          )}

          {error && (
            <div className="max-w-2xl mx-auto py-4">
              <DataError
                error={new Error(error)}
                onRetry={handleRetry}
              />
            </div>
          )}

          {!summary && !loading && !error && (
            <div className="text-center py-8 sm:py-12">
              <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div className="text-gray-500 text-base sm:text-lg mb-2">
                {t('summary:no_summary')}
              </div>
              {selectedDate && (
                <p className="text-gray-400 text-sm sm:text-base">
                  {formatDateForDisplay(selectedDate)}
                </p>
              )}
            </div>
          )}

          {summary && !loading && !error && (
            <DailySummary
              summary={summary}
              showTrends={true}
            />
          )}
        </div>
        
        {/* モバイル用フローティングナビゲーション */}
        {selectedDate && (
          <div className="fixed bottom-4 left-4 right-4 sm:hidden z-40">
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigateDate('prev')}
                disabled={!canNavigatePrev}
                className="touch-button bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-100 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                前日
              </button>
              <button
                onClick={() => navigateDate('next')}
                disabled={!canNavigateNext}
                className="touch-button bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-100 transition-all duration-200"
              >
                翌日
                <svg className="w-4 h-4 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
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