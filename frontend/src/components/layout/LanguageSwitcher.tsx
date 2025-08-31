'use client'

import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'

interface LanguageSwitcherProps {
  className?: string
  variant?: 'button' | 'dropdown'
}

/**
 * 言語切替コンポーネント
 * 日本語と英語の切り替えを提供する
 */
export default function LanguageSwitcher({
  className = '',
  variant = 'button'
}: LanguageSwitcherProps) {
  const router = useRouter()
  const { t } = useTranslation('common')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const currentLocale = router.locale || 'ja'
  const otherLocale = currentLocale === 'ja' ? 'en' : 'ja'

  /**
   * 言語を切り替える
   * 現在のパスを維持しながら言語のみを変更
   */
  const switchLanguage = (locale: string) => {
    const { pathname } = router

    // 静的エクスポート用の言語切替処理
    // 実際のルーティングではなく、ローカルストレージに保存して再読み込み
    localStorage.setItem('preferred-locale', locale)

    // カテゴリフィルターをクリアして言語切り替え（エラー回避）
    // クエリパラメータを含めると同一URL遷移エラーが発生するため除外
    router.push(pathname, pathname, { locale })

    setIsDropdownOpen(false)
  }

  const getLanguageLabel = (locale: string) => {
    return locale === 'ja' ? '日本語' : 'English'
  }

  const getLanguageFlag = (locale: string) => {
    return locale === 'ja' ? '🇯🇵' : '🇺🇸'
  }

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label={t('language.switch_language')}
        >
          <span>{getLanguageFlag(currentLocale)}</span>
          <span>{getLanguageLabel(currentLocale)}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
            <div className="py-1">
              <button
                onClick={() => switchLanguage('ja')}
                className={`flex items-center space-x-2 w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${currentLocale === 'ja' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
              >
                <span>🇯🇵</span>
                <span>日本語</span>
                {currentLocale === 'ja' && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => switchLanguage('en')}
                className={`flex items-center space-x-2 w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${currentLocale === 'en' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
              >
                <span>🇺🇸</span>
                <span>English</span>
                {currentLocale === 'en' && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ドロップダウンを閉じるためのオーバーレイ */}
        {isDropdownOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
      </div>
    )
  }

  // デフォルトのボタンバリアント
  return (
    <button
      onClick={() => switchLanguage(otherLocale)}
      className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${className}`}
      aria-label={currentLocale === 'ja' ? t('language.switch_to_english') : t('language.switch_to_japanese')}
      title={currentLocale === 'ja' ? t('language.switch_to_english') : t('language.switch_to_japanese')}
    >
      <span>{getLanguageFlag(otherLocale)}</span>
      <span>{getLanguageLabel(otherLocale)}</span>
    </button>
  )
}