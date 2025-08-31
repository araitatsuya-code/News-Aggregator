import type { AppProps } from 'next/app'
import { appWithTranslation } from 'next-i18next'
import { useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler'
import '@/styles/globals.css'

function App({ Component, pageProps }: AppProps) {
  // グローバルエラーハンドラーの設定
  useEffect(() => {
    // 未処理のPromise拒否をキャッチ
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      // エラー報告サービスに送信（本番環境では実装）
      if (process.env.NODE_ENV === 'production') {
        // reportError('unhandled_promise_rejection', event.reason)
      }
    }

    // 未処理のJavaScriptエラーをキャッチ
    const handleError = (event: ErrorEvent) => {
      console.error('Unhandled error:', event.error)
      // エラー報告サービスに送信（本番環境では実装）
      if (process.env.NODE_ENV === 'production') {
        // reportError('unhandled_error', event.error)
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  return (
    <ErrorBoundary>
      <GlobalErrorHandler>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </GlobalErrorHandler>
    </ErrorBoundary>
  )
}

export default appWithTranslation(App)