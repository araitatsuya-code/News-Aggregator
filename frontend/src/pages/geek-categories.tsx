import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { NewsService } from '../lib/data/newsService'
import { useNewsDataWithFallback } from '../lib/hooks/useDataLoaderWithFallback'
import { useCategoryFilter } from '../lib/hooks/useCategoryFilter'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { NewsItem } from '../lib/types'

// ギーク向けコンポーネントのインポート
import {
  ResponsiveTerminalLayout,
  TerminalNewsList,
  FunctionCallFilter,
  ASCIILoader,
  TerminalError,
  ErrorHandlingSystem,
} from '../components/geek'

/**
 * ギーク向けカテゴリ統計表示
 */
function GeekCategoryStats({
  availableCategories,
  articleCounts,
  selectedCategory,
  onCategoryChange,
}: {
  availableCategories: string[]
  articleCounts: Record<string, number>
  selectedCategory: string | null
  onCategoryChange: (category: string | null) => void
}) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="bg-terminal-bg-secondary p-4 rounded border border-terminal-border-primary">
        <div className="font-mono-code text-sm text-terminal-text-muted">
          Loading category statistics...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-terminal-bg-secondary p-4 rounded border border-terminal-border-primary">
      <div className="font-mono-code text-sm">
        {/* カテゴリ統計ヘッダー */}
        <div className="text-terminal-text-accent mb-3">
          {/* カテゴリ別記事統計 */}
        </div>
        
        <div className="text-terminal-text-primary mb-3">
          <span className="text-terminal-text-accent">const</span>{' '}
          <span className="text-terminal-text-variable">categoryStats</span>{' '}
          <span className="text-white">=</span>{' '}
          <span className="text-white">{'{'}</span>
        </div>

        {/* 統計情報 */}
        <div className="ml-4 mb-3 space-y-1">
          <div>
            <span className="text-terminal-text-variable">totalCategories</span>
            <span className="text-white">:</span>{' '}
            <span className="text-terminal-text-number">{availableCategories.length}</span>
            <span className="text-white">,</span>
          </div>
          <div>
            <span className="text-terminal-text-variable">totalArticles</span>
            <span className="text-white">:</span>{' '}
            <span className="text-terminal-text-number">
              {Object.values(articleCounts).reduce((sum, count) => sum + count, 0)}
            </span>
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
            <span className="text-terminal-text-variable">categories</span>
            <span className="text-white">:</span>{' '}
            <span className="text-white">[</span>
          </div>
        </div>

        {/* カテゴリ一覧（クリック可能） */}
        <div className="ml-8 space-y-1 max-h-60 overflow-y-auto">
          {availableCategories.map((category, index) => (
            <div key={category} className="group">
              <button
                onClick={() => onCategoryChange(category === selectedCategory ? null : category)}
                className={`w-full text-left transition-all duration-200 rounded px-2 py-1 ${
                  selectedCategory === category
                    ? 'bg-terminal-text-accent text-terminal-bg-primary'
                    : 'hover:bg-terminal-bg-accent text-terminal-text-primary'
                }`}
              >
                <span className="text-white">{'{'}</span>
                <div className="ml-4 inline-block">
                  <span className="text-terminal-text-variable">name</span>
                  <span className="text-white">:</span>{' '}
                  <span className="text-terminal-text-string">&quot;{category}&quot;</span>
                  <span className="text-white">,</span>{' '}
                  <span className="text-terminal-text-variable">count</span>
                  <span className="text-white">:</span>{' '}
                  <span className="text-terminal-text-number">{articleCounts[category] || 0}</span>
                </div>
                <span className="text-white">
                  {'}'}
                  {index < availableCategories.length - 1 ? ',' : ''}
                </span>
              </button>
            </div>
          ))}
        </div>

        <div className="ml-4 text-white">]</div>
        <div className="text-white">{'};'}</div>

        {/* 実行ボタン風の表示 */}
        <div className="mt-4 pt-3 border-t border-terminal-border-primary">
          <div className="text-terminal-text-muted text-xs">
            <span className="text-terminal-text-accent">{/* */}</span> クリックしてカテゴリを選択
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <button
              onClick={() => onCategoryChange(null)}
              className="geek-touch-button bg-terminal-bg-accent border-terminal-border-primary text-terminal-text-primary hover:bg-terminal-text-primary hover:text-terminal-bg-primary px-3 py-1 text-xs"
            >
              <span className="font-mono-code">showAll()</span>
            </button>
            {selectedCategory && (
              <div className="text-xs text-terminal-text-accent">
                → Filtering by: {selectedCategory}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * ギーク向けカテゴリページのコンテンツ
 */
function GeekCategoriesContent() {
  const { t } = useTranslation(['common', 'news'])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const { 
    data: latestNews, 
    loading, 
    error, 
    isUsingFallback,
    retry 
  } = useNewsDataWithFallback<NewsItem[]>(
    () => NewsService.getLatestNews(100), // すべての記事を読み込んでカテゴリ分布を改善
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
    return (
      <div className="flex justify-center items-center py-12">
        <ASCIILoader 
          type="spinner"
          message="カテゴリデータを読み込み中..."
        />
      </div>
    )
  }

  if (error && !isUsingFallback) {
    return (
      <TerminalError
        error={{
          type: 'error',
          code: 'CATEGORY_FETCH_ERROR',
          message: error.message,
          timestamp: new Date(),
          stack: error.stack,
        }}
        onRetry={retry}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* フォールバック使用時の通知 */}
      {isUsingFallback && (
        <div className="terminal-layout bg-yellow-900 bg-opacity-20 border-yellow-400 p-4 rounded">
          <div className="flex items-center">
            <span className="text-yellow-400 mr-2 font-mono-primary">⚠</span>
            <span className="text-sm text-yellow-300 font-mono-primary">
              キャッシュされたデータを表示しています。最新の情報ではない可能性があります。
            </span>
          </div>
        </div>
      )}
      
      {/* カテゴリ統計 */}
      <GeekCategoryStats
        availableCategories={availableCategories}
        articleCounts={articleCounts}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* 関数呼び出し風フィルター */}
      <div className="bg-terminal-bg-secondary p-4 rounded border border-terminal-border-primary">
        <div className="font-mono-code text-sm mb-4">
          <div className="text-terminal-text-accent mb-2">
            {/* 高度なカテゴリフィルター */}
          </div>
        </div>
        
        <FunctionCallFilter
          categories={availableCategories.map(cat => ({
            name: cat,
            count: articleCounts[cat] || 0,
            description: `${cat}関連のニュース記事`,
          }))}
          selectedCategories={selectedCategory ? [selectedCategory] : []}
          onCategoryChange={(categories) => {
            setSelectedCategory(categories.length > 0 ? categories[0] : null)
          }}
          allowMultiple={false}
        />
      </div>

      {/* 記事一覧 */}
      {filteredArticles.length > 0 ? (
        <div>
          <div className="bg-terminal-bg-secondary p-3 rounded-t border border-terminal-border-primary border-b-0">
            <div className="font-mono-code text-sm">
              <div className="text-terminal-text-accent">
                {/* 記事一覧 ({filteredArticles.length} 件) */}
              </div>
              {selectedCategory && (
                <div className="text-terminal-text-muted text-xs mt-1">
                  Filtered by: {selectedCategory}
                </div>
              )}
            </div>
          </div>
          
          <div className="border border-terminal-border-primary border-t-0 rounded-b">
            <TerminalNewsList
              articles={filteredArticles}
              showSummary={true}
              syntax="javascript"
              theme="vscode"
              highlightOnHover={true}
              startLineNumber={1}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="font-mono-code text-terminal-text-muted">
            <div className="text-4xl mb-4">{'{ }'}</div>
            <div className="text-base mb-2">
              選択されたカテゴリに記事がありません
            </div>
            {selectedCategory && (
              <div className="text-sm">
                Category: {selectedCategory}
              </div>
            )}
            <button
              onClick={() => setSelectedCategory(null)}
              className="mt-4 geek-touch-button bg-terminal-bg-accent border-terminal-border-primary text-terminal-text-primary hover:bg-terminal-text-primary hover:text-terminal-bg-primary px-4 py-2 text-sm"
            >
              <span className="font-mono-code">showAll()</span>
            </button>
          </div>
        </div>
      )}

      {/* パフォーマンス統計 */}
      {isClient && filteredArticles.length > 0 && (
        <div className="bg-terminal-bg-secondary p-4 rounded border border-terminal-border-primary">
          <div className="font-mono-code text-sm">
            <div className="text-terminal-text-accent mb-2">
              {/* パフォーマンス統計 */}
            </div>
            <div className="text-terminal-text-primary">
              <span className="text-terminal-text-accent">const</span>{' '}
              <span className="text-terminal-text-variable">performance</span>{' '}
              <span className="text-white">=</span>{' '}
              <span className="text-white">{'{'}</span>
            </div>
            <div className="ml-4 space-y-1">
              <div>
                <span className="text-terminal-text-variable">renderTime</span>
                <span className="text-white">:</span>{' '}
                <span className="text-terminal-text-string">&quot;{Date.now() % 1000}ms&quot;</span>
                <span className="text-white">,</span>
              </div>
              <div>
                <span className="text-terminal-text-variable">memoryUsage</span>
                <span className="text-white">:</span>{' '}
                <span className="text-terminal-text-string">
                  &quot;{Math.round(filteredArticles.length * 0.5)}KB&quot;
                </span>
                <span className="text-white">,</span>
              </div>
              <div>
                <span className="text-terminal-text-variable">filterEfficiency</span>
                <span className="text-white">:</span>{' '}
                <span className="text-terminal-text-number">
                  {Math.round((filteredArticles.length / (latestNews?.length || 1)) * 100)}%
                </span>
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
 * ギーク向けカテゴリページ
 */
export default function GeekCategories() {
  const { t } = useTranslation(['common', 'news'])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <>
      <Head>
        <title>{t('common:navigation.categories')} - Geek Mode - {t('common:site.title')}</title>
        <meta name="description" content="AIニュースをカテゴリ別に閲覧 - ターミナル風UI" />
      </Head>
      
      <ErrorBoundary>
        <ResponsiveTerminalLayout
          showHeader={true}
          showPrompt={true}
          theme="matrix"
          title="AI News Categories Terminal"
          mobileSimplified={true}
        >
          {/* ヘッダーセクション */}
          <div className="mb-6">
            <div className="font-mono-code text-sm">
              {/* ASCII アートロゴ（カテゴリ版） */}
              <div className="text-terminal-text-accent mb-4 text-center">
                <pre className="ascii-art text-xs sm:text-sm">
{`  ____      _                       _           
 / ___|__ _| |_ ___  __ _  ___  _ __(_) ___  ___ 
| |   / _\` | __/ _ \\/ _\` |/ _ \\| '__| |/ _ \\/ __|
| |__| (_| | ||  __/ (_| | (_) | |  | |  __/\\__ \\
 \\____\\__,_|\\__\\___|\\__, |\\___/|_|  |_|\\___||___/
                    |___/                        `}
                </pre>
              </div>

              {/* システム情報 */}
              <div className="text-terminal-text-muted mb-4">
                <div className="text-xs">
                  <span className="text-terminal-text-accent">Module:</span> CategoryBrowser v1.0.0
                </div>
                <div className="text-xs">
                  <span className="text-terminal-text-accent">Description:</span> {t('common:site.description')}
                </div>
                {isClient && (
                  <div className="text-xs mt-1">
                    <span className="text-terminal-text-accent">Initialized:</span>{' '}
                    {new Date().toLocaleString('ja-JP')}
                  </div>
                )}
              </div>

              {/* 起動メッセージ */}
              <div className="bg-terminal-bg-secondary p-3 rounded border border-terminal-border-primary mb-6">
                <div className="text-xs">
                  <div className="text-green-400">
                    <span className="animate-pulse">●</span> カテゴリシステム起動完了
                  </div>
                  <div className="text-terminal-text-muted mt-1">
                    カテゴリ別ニュースを分析中...
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* メインコンテンツ */}
          <ErrorBoundary>
            <GeekCategoriesContent />
          </ErrorBoundary>
          
          {/* フッター情報 */}
          {isClient && (
            <div className="mt-8 pt-4 border-t border-terminal-border-primary">
              <div className="font-mono-code text-xs text-terminal-text-muted">
                <div className="text-terminal-text-accent mb-2">
                  {/* 利用可能なコマンド */}
                </div>
                <div className="space-y-1">
                  <div>
                    <kbd className="bg-terminal-bg-accent px-1 rounded">Ctrl+A</kbd>{' '}
                    全カテゴリ表示
                  </div>
                  <div>
                    <kbd className="bg-terminal-bg-accent px-1 rounded">Ctrl+F</kbd>{' '}
                    フィルター切り替え
                  </div>
                  <div>
                    <kbd className="bg-terminal-bg-accent px-1 rounded">Ctrl+R</kbd>{' '}
                    リロード
                  </div>
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