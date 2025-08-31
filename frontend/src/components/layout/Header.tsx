'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'

interface HeaderProps {
  currentLocale: string
  onLocaleChange: (locale: string) => void
}

export default function Header({ currentLocale, onLocaleChange }: HeaderProps) {
  const { t } = useTranslation('common')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLocaleChange = (locale: string) => {
    onLocaleChange(locale)
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-gray-900">
              {t('site.title')}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              {t('navigation.home')}
            </Link>
            <Link 
              href="/summary" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              {t('navigation.daily_summary')}
            </Link>
            <Link 
              href="/categories" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              {t('navigation.categories')}
            </Link>
          </nav>

          {/* Language Switcher */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => handleLocaleChange(currentLocale === 'ja' ? 'en' : 'ja')}
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium border border-gray-300 hover:border-gray-400"
            >
              {currentLocale === 'ja' ? t('language.switch_to_english') : t('language.switch_to_japanese')}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-gray-900 focus:outline-none focus:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.home')}
              </Link>
              <Link 
                href="/summary" 
                className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.daily_summary')}
              </Link>
              <Link 
                href="/categories" 
                className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.categories')}
              </Link>
              <button
                onClick={() => {
                  handleLocaleChange(currentLocale === 'ja' ? 'en' : 'ja')
                  setIsMenuOpen(false)
                }}
                className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium border border-gray-300 hover:border-gray-400 w-full text-left"
              >
                {currentLocale === 'ja' ? t('language.switch_to_english') : t('language.switch_to_japanese')}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}