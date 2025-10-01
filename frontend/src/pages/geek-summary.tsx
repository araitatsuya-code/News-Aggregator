import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { DailySummary } from '../components/summary'
import { SEOHead } from '../components/SEOHead'
import { useDailySummary } from '../lib/hooks/useDailySummary'
import { useDateNavigation } from '../lib/hooks/useDateNavigation'
import { useSummaryDataWithFallback } from '../lib/hooks/useDataLoaderWithFallback'
import { NewsService } from '../lib/data/newsService'
import { getDailySummarySEOMetadata, getDefaultSEOMetadata } from '../lib/utils/seo'

// ギーク向けコンポーネントのインポート
import {
  ResponsiveTerminalLayout,
  ASCIILoader,
  TerminalError,
  ErrorHandlingSystem,
  CommandLineNavigation,
} from '../components/geek'
import { ErrorBoundary } from '../components/ErrorBoundary'

/**
 * ギーク向け日付選択コンポーネント
 */
function GeekDateSelector({
  selectedDate,
  availableDates,
  onDateChange,
  locale,
}: {
  selectedDate: string
  availableDates: string[]
  onDateChange: (date: string) => void
  locale: string
}) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentIndex = availableDates.indexOf(selectedDate)
    if (direction === 'prev' && currentIndex < availableDates.length - 1) {
      onDateChange(availableDates[currentIndex + 1])
    } else if (direction === 'next' && currentIndex > 0) {
      onDateChange(availableDates[currentIndex - 1])
    }
  }

  const canNavigatePrev = availableDates.length > 0 && availableDates.indexOf(selectedDate) < availableDates.length - 1
  const canNavigateNext = availableDates.length > 0 && availableDates.indexOf(selectedDate) > 0

  if (!isClient) {
    return (
      <div className="bg-terminal-bg-secondary p-3 rounded border border-terminal-border-primary">
        <div className="font-mono-code text-sm text-terminal-text-muted">
          Loading date selector...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-terminal-bg-secondary p-4 rounded border border-terminal-border-primary">
      <div className="font-mono-code text-sm">
        {/* 日付ナビゲーション関数風の表示 */}
        <div className="text-terminal-text-accent mb-2">
          {/* 日付ナビゲーション */}
        </div>
        <div className="text-terminal-text-primary mb-3">
          <span className="text-terminal-text-accent">function</span>{' '}
          <span className="text-terminal-text-function">navigateDate</span>
          <span className="text-white">(</span>
          <span className="text-terminal-text-variable">direction</span>
          <span className="text-white">:</span>{' '}
          <span className="text-terminal-text-accent">&apos;prev&apos;</span>{' '}
          <span className="text-white">|</span>{' '}
          <span className="text-terminal-text-accent">&apos;next&apos;</span>
          <span className="text-white">) {'{'}</span>
        </div>

        {/* 現在の日付表示 */}
        <div className="ml-4 mb-3">
          <div className="text-terminal-text-primary">
            <span className="text-terminal-text-accent">const</span>{' '}
            <span className="text-terminal-text-variable">currentDate</span>{' '}
            <span className="text-white">=</span>{' '}
            <span className="text-terminal-text-string">
              &quot;{formatDateForDisplay(selectedDate)}&quot;
            </span>
            <span className="text-white">;</span>
          </div>
          <div className="text-terminal-text-primary">
            <span className="text-terminal-text-variable">dateIndex</span>{' '}
            <span className="text-white">=</span>{' '}
            <span className="text-terminal-text-number">
              {availableDates.indexOf(selectedDate) + 1}
            </span>{' '}
            <span className="text-terminal-text-muted">
              / {availableDates.length}
            </span>
            <span className="text-white">;</span>
          </div>
        </div>

        {/* ナビゲーションボタン */}
        <div className="ml-4 mb-3 flex items-center space-x-2">
          <button
            onClick={() => navigateDate('prev')}
            disabled={!canNavigatePrev}
            className="geek-touch-button bg-terminal-bg-accent border-terminal-border-primary text-terminal-text-primary hover:bg-terminal-text-primary hover:text-terminal-bg-primary disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 text-xs"
            aria-label="前日"
          >
            <span className="font-mono-code">prev()</span>
          </button>
          
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="geek-touch-button bg-terminal-bg-accent border-terminal-border-primary text-terminal-text-accent hover:bg-terminal-text-accent hover:text-terminal-bg-primary px-3 py-1 text-xs"
          >
            <span className="font-mono-code">select()</span>
          </button>
          
          <button
            onClick={() => navigateDate('next')}
            disabled={!canNavigateNext}
            className="geek-touch-button bg-terminal-bg-accent border-terminal-border-primary text-terminal-text-primary hover:bg-terminal-text-primary hover:text-terminal-bg-primary disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 text-xs"
            aria-label="翌日"
          >
            <span className="font-mono-code">next()</span>
          </button>
        </div>

        {/* 日付選択ドロップダウン */}
        {showDatePicker && (
          <div className="ml-4 mb-3 animate-slide-down">
            <div className="bg-terminal-bg-primary border border-terminal-border-primary rounded p-2 max-h-40 overflow-y-auto">
              <div className="text-terminal-text-accent text-xs mb-2">
                {/* 利用可能な日付 */}
              </div>
              {availableDates.map((date, index) => (
                <button
                  key={date}
                  onClick={() => {
                    onDateChange(date)
                    setShowDatePicker(false)
                  }}
                  className={`block w-full text-left px-2 py-1 text-xs font-mono-code rounded transition-colors duration-200 ${
                    date === selectedDate
                      ? 'bg-terminal-text-accent text-terminal-bg-primary'
                      : 'text-terminal-text-primary hover:bg-terminal-bg-accent'
                  }`}
                >
                  <span className="text-terminal-text-muted">
                    [{String(index + 1).padStart(2, '0')}]
                  </span>{' '}
                  {formatDateForDisplay(date)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="text-white">{'}'}</div>
      </div>
    </div>
  )
}

/**
 * ギーク向けサマリー表示コンポーネント
 */
function GeekSummaryDisplay({ summary }: { summary: any }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <ASCIILoader 
        type="dots"
        message="サマリーを準備中..."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* サマリーヘッダー */}
      <div className="bg-terminal-bg-secondary p-4 rounded border border-terminal-border-primary">
        <div className="font-mono-code text-sm">
          <div className="text-terminal-text-accent mb-2">
            {/* 日次サマリー オブジェクト */}
          </div>
          <div className="text-terminal-text-primary">
            <span className="text-terminal-text-accent">const</span>{' '}
            <span className="text-terminal-text-variable">dailySummary</span>{' '}
            <span className="text-white">=</span>{' '}
            <span className="text-white">{'{'}</span>
          </div>
          <div className="ml-4 space-y-1">
            <div>
              <span className="text-terminal-text-variable">date</span>
              <span className="text-white">:</span>{' '}
              <span className="text-terminal-text-string">&quot;{summary.date}&quot;</span>
              <span className="text-white">,</span>
            </div>
            <div>
              <span className="text-terminal-text-variable">totalArticles</span>
              <span className="text-white">:</span>{' '}
              <span className="text-terminal-text-number">{summary.total_articles || 0}</span>
              <span className="text-white">,</span>
            </div>
            <div>
              <span className="text-terminal-text-variable">categories</span>
              <span className="text-white">:</span>{' '}
              <span className="text-terminal-text-number">{summary.categories?.length || 0}</span>
              <span className="text-white">,</span>
            </div>
            <div>
              <span className="text-terminal-text-variable">confidence</span>
              <span className="text-white">:</span>{' '}
              <span className="text-terminal-text-number">
                {Math.round((summary.ai_confidence || 0) * 100)}%
              </span>
            </div>
          </div>
          <div className="text-white">{'};'}</div>
        </div>
      </div>

      {/* 従来のサマリーコンポーネントをラップ */}
      <div className="bg-terminal-bg-primary border border-terminal-border-primary rounded p-4">
        <DailySummary
          summary={summary}
          showTrends={true}
        />
      </div>

      {/* トレンド分析（コード風） */}
      {summary.trends && (
        <div className="bg-terminal-bg-secondary p-4 rounded border border-terminal-border-primary">
          <div className="font-mono-code text-sm">
            <div className="text-terminal-text-accent mb-2">
              {/* トレンド分析 */}
            </div>
            <div className="text-terminal-text-primary">
              <span className="text-terminal-text-accent">const</span>{' '}
              <span className="text-terminal-text-variable">trends</span>{' '}
              <span className="text-white">=</span>{' '}
              <span className="text-white">[</span>
            </div>
            {summary.trends.slice(0, 5).map((trend: any, index: number) => (
              <div key={index} className="ml-4">
                <div className="text-white">{'{'}</div>
                <div className="ml-4 space-y-1">
                  <div>
                    <span className="text-terminal-text-variable">keyword</span>
                    <span className="text-white">:</span>{' '}
                    <span className="text-terminal-text-string">&quot;{trend.keyword}&quot;</span>
                    <span className="text-white">,</span>
                  </div>
                  <div>
                    <span className="text-terminal-text-variable">frequency</span>
                    <span className="text-white">:</span>{' '}
                    <span className="text-terminal-text-number">{trend.frequency}</span>
                    <span className="text-white">,</span>
                  </div>
                  <div>
                    <span className="text-terminal-text-variable">importance</span>
                    <span className="text-white">:</span>{' '}
                    <span className="text-terminal-text-number">
                      {Math.round((trend.importance || 0) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="text-white">
                  {'}'}
                  {index < Math.min(summary.trends.length, 5) - 1 ? ',' : ''}
                </div>
              </div>
            ))}
            <div className="text-white">];</div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * ギーク向けサマリーページ
 */
export default function GeekSummary() {
  const { t, i18n } = useTranslation(['common', 'summary'])
  const router = useRouter()
  const { selectedDate, setSelectedDate, availableDates, setAvailableDates } = useDateNavigation()
  const [isClient, setIsClient] = useState(false)
  
  // クライアントサイドでのマウント検出
  useEffect(() => {
    setIsClient(true)
  }, [])

  // フォールバック機能付きのデータローダーを使用
  const { 
    data: summary, 
    loading, 
    error, 
    isUsingFallback,
    retry 
  } = useSummaryDataWithFallback(
    () => selectedDate ? NewsService.getDailySummary(selectedDate) : NewsService.getLatestSummary(),
    undefined,
    [selectedDate]
  )
  
  // 利用可能な日付の取得
  const { availableDates: fetchedDates } = useDailySummary(selectedDate)

  const handleRetry = () => {
    retry()
  }

  // 取得した利用可能な日付をナビゲーションフックに設定
  useEffect(() => {
    if (fetchedDates.length > 0) {
      setAvailableDates(fetchedDates)
    }
  }, [fetchedDates, setAvailableDates])

  // SEOメタデータを生成
  const seoMetadata = summary 
    ? getDailySummarySEOMetadata(summary, router.locale || 'ja')
    : getDefaultSEOMetadata(router.locale || 'ja')

  // クライアントサイドマウント前はローディング表示
  if (!isClient) {
    return (
      <>
        <SEOHead metadata={seoMetadata} />
        <div className="min-h-screen bg-terminal-bg-primary flex items-center justify-center">
          <ASCIILoader 
            type="spinner"
            message="システムを初期化中..."
          />
        </div>
      </>
    )
  }

  return (
    <>
      <SEOHead metadata={{
        ...seoMetadata,
        title: `${seoMetadata.title} - Geek Mode`,
        description: `${seoMetadata.description} ターミナル風UIでサマリーを閲覧。`,
      }} />
      
      <ErrorBoundary>
        <ResponsiveTerminalLayout
          showHeader={true}
          showPrompt={true}
          theme="matrix"
          title="AI News Summary Terminal"
          mobileSimplified={true}
        >
          {/* ヘッダーセクション */}
          <div className="mb-6">
            <div className="font-mono-code text-sm">
              {/* システム情報 */}
              <div className="text-terminal-text-accent mb-2">
                {/* 日次サマリーシステム */}
              </div>
              <div className="text-terminal-text-muted mb-4">
                <div className="text-xs">
                  <span className="text-terminal-text-accent">Module:</span> DailySummaryViewer v1.0.0
                </div>
                <div className="text-xs">
                  <span className="text-terminal-text-accent">Status:</span>{' '}
                  {loading ? (
                    <span className="text-yellow-400 animate-pulse">Loading...</span>
                  ) : error && !isUsingFallback ? (
                    <span className="text-red-400">Error</span>
                  ) : (
                    <span className="text-green-400">Ready</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 日付選択 */}
          {availableDates.length > 0 && (
            <div className="mb-6">
              <GeekDateSelector
                selectedDate={selectedDate}
                availableDates={availableDates}
                onDateChange={setSelectedDate}
                locale={i18n.language}
              />
            </div>
          )}

          {/* コンテンツ */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
              <ASCIILoader 
                type="dots"
                message={t('summary:loading')}
              />
            </div>
          )}

          {error && !isUsingFallback && (
            <div className="max-w-2xl mx-auto py-4">
              <TerminalError
                error={{
                  type: 'error',
                  code: 'SUMMARY_FETCH_ERROR',
                  message: error.message,
                  timestamp: new Date(),
                  stack: error.stack,
                }}
                onRetry={handleRetry}
              />
            </div>
          )}

          {/* フォールバック使用時の通知 */}
          {isUsingFallback && summary && (
            <div className="max-w-2xl mx-auto mb-4">
              <div className="terminal-layout bg-yellow-900 bg-opacity-20 border-yellow-400 p-4 rounded">
                <div className="flex items-center">
                  <span className="text-yellow-400 mr-2 font-mono-primary">⚠</span>
                  <span className="text-sm text-yellow-300 font-mono-primary">
                    キャッシュされたサマリーを表示しています。最新の情報ではない可能性があります。
                  </span>
                </div>
              </div>
            </div>
          )}

          {!summary && !loading && !error && (
            <div className="text-center py-8 sm:py-12">
              <div className="font-mono-code text-terminal-text-muted">
                <div className="text-4xl mb-4">¯\_(ツ)_/¯</div>
                <div className="text-base mb-2">
                  {t('summary:no_summary')}
                </div>
                {selectedDate && (
                  <div className="text-sm">
                    Date: {selectedDate}
                  </div>
                )}
              </div>
            </div>
          )}

          {summary && !loading && !error && (
            <GeekSummaryDisplay summary={summary} />
          )}

          {/* コマンドヘルプ */}
          <div className="mt-8 pt-4 border-t border-terminal-border-primary">
            <div className="font-mono-code text-xs text-terminal-text-muted">
              <div className="text-terminal-text-accent mb-2">
                {/* 利用可能なコマンド */}
              </div>
              <div className="space-y-1">
                <div>
                  <kbd className="bg-terminal-bg-accent px-1 rounded">Ctrl+←</kbd>{' '}
                  前日のサマリー
                </div>
                <div>
                  <kbd className="bg-terminal-bg-accent px-1 rounded">Ctrl+→</kbd>{' '}
                  翌日のサマリー
                </div>
                <div>
                  <kbd className="bg-terminal-bg-accent px-1 rounded">Ctrl+R</kbd>{' '}
                  リロード
                </div>
              </div>
            </div>
          </div>
        </ResponsiveTerminalLayout>
      </ErrorBoundary>
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