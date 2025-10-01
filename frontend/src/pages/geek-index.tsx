import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { NewsService } from '../lib/data/newsService'
import { useNewsDataWithFallback } from '../lib/hooks/useDataLoaderWithFallback'
import { useCategoryFilter } from '../lib/hooks/useCategoryFilter'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { SEOHead } from '../components/SEOHead'
import { NewsItem } from '../lib/types'
import { getNewsListSEOMetadata, generateWebsiteJsonLd } from '../lib/utils/seo'

// ギーク向けコンポーネントのインポート
import {
  ResponsiveTerminalLayout,
  TerminalNewsList,
  FunctionCallFilter,
  CommandLineFilter,
  ASCIILoader,
  TerminalError,
  ErrorHandlingSystem,
} from '../components/geek'

/**
 * ギーク向けニュース一覧セクション
 */
function GeekNewsListSection({ 
  latestNews, 
  loading, 
  error, 
  isUsingFallback, 
  retry 
}: {
  latestNews: NewsItem[] | null
  loading: boolean
  error: Error | null
  isUsingFallback: boolean
  retry: () => void
}) {
  const { t } = useTranslation(['common', 'news'])
  const [filterMode, setFilterMode] = useState<'function' | 'command'>('function')
  const [isClient, setIsClient] = useState(false)

  // クライアントサイドでのマウント検出
  useEffect(() => {
    setIsClient(true)
  }, [])

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
        <ASCIILoader 
          type="spinner"
          message="ニュースデータを読み込み中..."
        />
      </div>
    )
  }

  if (error && !isUsingFallback) {
    return (
      <div className="py-8 sm:py-12">
        <TerminalError
          error={{
            type: 'error',
            code: 'NEWS_FETCH_ERROR',
            message: error.message,
            timestamp: new Date(),
            stack: error.stack,
          }}
          onRetry={retry}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* フォールバック使用時の通知 */}
      {isUsingFallback && (
        <div className="terminal-layout bg-yellow-900 bg-opacity-20 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center">
            <span className="text-yellow-400 mr-2 font-mono-primary">⚠</span>
            <span className="text-sm text-yellow-300 font-mono-primary">
              {t('common:fallback_notice')}
            </span>
          </div>
        </div>
      )}
      
      {/* フィルターモード切り替え */}
      {isClient && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-terminal-text-muted font-mono-primary text-sm">
              Filter Mode:
            </span>
            <button
              onClick={() => setFilterMode('function')}
              className={`px-3 py-1 rounded font-mono-code text-sm transition-all duration-200 ${
                filterMode === 'function'
                  ? 'bg-terminal-text-accent text-terminal-bg-primary'
                  : 'bg-terminal-bg-accent text-terminal-text-muted hover:text-terminal-text-primary'
              }`}
            >
              function()
            </button>
            <button
              onClick={() => setFilterMode('command')}
              className={`px-3 py-1 rounded font-mono-code text-sm transition-all duration-200 ${
                filterMode === 'command'
                  ? 'bg-terminal-text-accent text-terminal-bg-primary'
                  : 'bg-terminal-bg-accent text-terminal-text-muted hover:text-terminal-text-primary'
              }`}
            >
              $ command
            </button>
          </div>
        </div>
      )}

      {/* カテゴリフィルター */}
      {filterMode === 'function' ? (
        <FunctionCallFilter
          categories={availableCategories.map(cat => ({
            name: cat,
            count: articleCounts[cat] || 0,
            description: `${cat}関連のニュース`,
          }))}
          selectedCategories={selectedCategory ? [selectedCategory] : []}
          onCategoryChange={(categories) => {
            setSelectedCategory(categories.length > 0 ? categories[0] : null)
          }}
          allowMultiple={false}
        />
      ) : (
        <CommandLineFilter
          categories={availableCategories}
          onFilter={(filters) => {
            // コマンドラインフィルターの処理
            if (filters.categories && filters.categories.length > 0) {
              const category = filters.categories[0]
              if (availableCategories.includes(category)) {
                setSelectedCategory(category)
              }
            } else {
              setSelectedCategory(null)
            }
          }}
          placeholder="$ filter --category='Machine Learning' | grep 'OpenAI'"
        />
      )}

      {/* ニュース一覧 */}
      <TerminalNewsList
        articles={filteredArticles}
        showSummary={true}
        syntax="javascript"
        theme="vscode"
        highlightOnHover={true}
        startLineNumber={1}
      />

      {/* 統計情報 */}
      {isClient && filteredArticles.length > 0 && (
        <div className="terminal-layout bg-terminal-bg-secondary p-4 rounded-lg mt-6">
          <div className="font-mono-code text-sm">
            <div className="text-terminal-text-accent mb-2">
              {/* 統計情報 */}
            </div>
            <div className="text-terminal-text-primary">
              <span className="text-terminal-text-accent">const</span>{' '}
              <span className="text-terminal-text-variable">stats</span>{' '}
              <span className="text-white">=</span>{' '}
              <span className="text-white">{'{'}</span>
            </div>
            <div className="ml-4 text-terminal-text-primary">
              <div>
                <span className="text-terminal-text-variable">totalArticles</span>
                <span className="text-white">:</span>{' '}
                <span className="text-terminal-text-number">{latestNews?.length || 0}</span>
                <span className="text-white">,</span>
              </div>
              <div>
                <span className="text-terminal-text-variable">filteredArticles</span>
                <span className="text-white">:</span>{' '}
                <span className="text-terminal-text-number">{filteredArticles.length}</span>
                <span className="text-white">,</span>
              </div>
              <div>
                <span className="text-terminal-text-variable">selectedCategory</span>
                <span className="text-white">:</span>{' '}
                <span className="text-terminal-text-string">
                  &quot;{selectedCategory || 'all'}&quot;
                </span>
                <span className="text-white">,</span>
              </div>
              <div>
                <span className="text-terminal-text-variable">availableCategories</span>
                <span className="text-white">:</span>{' '}
                <span className="text-terminal-text-number">{availableCategories.length}</span>
              </div>
            </div>
            <div className="text-white">{'};'}</div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * ギーク向けホームページ
 */
export default function GeekHome() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  
  // クライアントサイドでのマウント検出
  useEffect(() => {
    setIsClient(true)
  }, [])

  // ニュースデータを取得（SEO用）
  const { 
    data: latestNews, 
    loading, 
    error, 
    isUsingFallback 
  } = useNewsDataWithFallback<NewsItem[]>(
    () => NewsService.getLatestNews(100),
    [], // フォールバックデータは空配列
    []
  )

  const {
    selectedCategory,
    filteredArticles,
  } = useCategoryFilter(latestNews || [])

  // SEOメタデータを生成
  const seoMetadata = getNewsListSEOMetadata(
    filteredArticles,
    selectedCategory || undefined,
    router.locale || 'ja'
  )
  
  // 構造化データを生成
  const websiteJsonLd = generateWebsiteJsonLd(router.locale || 'ja')

  return (
    <>
      <SEOHead 
        metadata={{
          ...seoMetadata,
          title: `${seoMetadata.title} - Geek Mode`,
          description: `${seoMetadata.description} ターミナル風UIでAIニュースを閲覧。`,
        }}
        jsonLd={websiteJsonLd}
      />
      
      <ErrorBoundary>
        <ResponsiveTerminalLayout
          showHeader={true}
          showPrompt={true}
          theme="matrix"
          title="AI News Terminal v2.0.0"
          mobileSimplified={true}
        >
          {/* ヘッダーセクション */}
          <div className="mb-6 sm:mb-8">
            <div className="font-mono-code text-sm sm:text-base">
              {/* ASCII アートロゴ（簡略版） */}
              <div className="text-terminal-text-accent mb-4 text-center">
                <pre className="ascii-art text-xs sm:text-sm">
{`    _    ___   _   _                     
   / \\  |_ _| | \\ | | _____      _____  
  / _ \\  | |  |  \\| |/ _ \\ \\ /\\ / / __| 
 / ___ \\ | |  | |\\  |  __/\\ V  V /\\__ \\ 
/_/   \\_|___| |_| \\_|\\___| \\_/\\_/ |___/ `}
                </pre>
              </div>

              {/* システム情報 */}
              <div className="text-terminal-text-muted mb-4">
                <div className="text-xs sm:text-sm">
                  <span className="text-terminal-text-accent">{/* */}</span> {t('site.description')}
                </div>
                {isClient && (
                  <div className="text-xs mt-1">
                    <span className="text-terminal-text-accent">System:</span>{' '}
                    AI News Aggregator v2.0.0 | {new Date().toLocaleString('ja-JP')}
                  </div>
                )}
              </div>

              {/* 起動メッセージ */}
              <div className="bg-terminal-bg-secondary p-3 rounded border border-terminal-border-primary mb-6">
                <div className="text-xs sm:text-sm">
                  <div className="text-green-400">
                    <span className="animate-pulse">●</span> システム起動完了
                  </div>
                  <div className="text-terminal-text-muted mt-1">
                    最新のAIニュースを取得しています...
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* メインコンテンツ */}
          <ErrorBoundary>
            <GeekNewsListSection 
              latestNews={latestNews}
              loading={loading}
              error={error}
              isUsingFallback={isUsingFallback}
              retry={() => window.location.reload()}
            />
          </ErrorBoundary>
          
          {/* フッター情報 */}
          {isClient && (
            <div className="mt-8 pt-4 border-t border-terminal-border-primary">
              <div className="font-mono-code text-xs text-terminal-text-muted text-center">
                <div>
                  Press <kbd className="bg-terminal-bg-accent px-1 rounded">Ctrl+H</kbd> for help |{' '}
                  <kbd className="bg-terminal-bg-accent px-1 rounded">Ctrl+R</kbd> to refresh |{' '}
                  <kbd className="bg-terminal-bg-accent px-1 rounded">Ctrl+T</kbd> to toggle theme
                </div>
              </div>
            </div>
          )}
        </ResponsiveTerminalLayout>
      </ErrorBoundary>
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