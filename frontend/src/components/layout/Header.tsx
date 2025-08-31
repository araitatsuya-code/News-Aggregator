'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import LanguageSwitcher from './LanguageSwitcher'

interface HeaderProps {
  currentLocale: string
  onLocaleChange: (locale: string) => void
}

export default function Header({ currentLocale, onLocaleChange }: HeaderProps) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // スクロール状態の監視（ヘッダーの影の調整用）
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ルート変更時にモバイルメニューを閉じる
  useEffect(() => {
    const handleRouteChange = () => {
      setIsMenuOpen(false)
    }

    router.events.on('routeChangeStart', handleRouteChange)
    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [router.events])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // 現在のページかどうかを判定する関数
  const isCurrentPage = (path: string) => {
    return router.pathname === path
  }

  // ナビゲーションリンクのスタイルを取得する関数
  const getLinkClassName = (path: string, isMobile: boolean = false) => {
    const baseClasses = isMobile 
      ? "block px-3 py-3 rounded-md text-base font-medium transition-colors duration-200 touch-button"
      : "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 touch-button"
    
    const activeClasses = isCurrentPage(path)
      ? "text-blue-600 bg-blue-50"
      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100"
    
    return `${baseClasses} ${activeClasses}`
  }

  return (
    <header className={`bg-white border-b sticky top-0 z-50 transition-shadow duration-200 ${
      isScrolled ? 'shadow-md' : 'shadow-sm'
    }`}>
      <div className="responsive-container">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link 
              href="/" 
              className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors duration-200"
            >
              {t('site.title')}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-2">
            <Link 
              href="/" 
              className={getLinkClassName('/')}
            >
              {t('navigation.home')}
            </Link>
            <Link 
              href="/summary" 
              className={getLinkClassName('/summary')}
            >
              {t('navigation.daily_summary')}
            </Link>
            <Link 
              href="/categories" 
              className={getLinkClassName('/categories')}
            >
              {t('navigation.categories')}
            </Link>
          </nav>

          {/* Desktop Language Switcher */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher variant="dropdown" />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="touch-button text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? t('navigation.close_menu') : t('navigation.open_menu')}
            >
              <svg 
                className="h-6 w-6 transition-transform duration-200" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                style={{ transform: isMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-2 pt-2 pb-3 space-y-1 border-t bg-gray-50 rounded-b-lg">
            <Link 
              href="/" 
              className={getLinkClassName('/', true)}
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {t('navigation.home')}
              </div>
            </Link>
            <Link 
              href="/summary" 
              className={getLinkClassName('/summary', true)}
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {t('navigation.daily_summary')}
              </div>
            </Link>
            <Link 
              href="/categories" 
              className={getLinkClassName('/categories', true)}
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {t('navigation.categories')}
              </div>
            </Link>
            
            {/* Mobile Language Switcher */}
            <div className="px-3 py-2 border-t border-gray-200 mt-2 pt-4">
              <div className="text-sm text-gray-600 mb-2">{t('navigation.language')}</div>
              <LanguageSwitcher variant="button" className="w-full justify-center" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}