'use client'

import { useTranslation } from 'next-i18next'

export default function Footer() {
  const { t } = useTranslation('common')

  return (
    <footer className="bg-gray-50 border-t mt-auto">
      <div className="responsive-container py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <div className="text-sm text-gray-600 text-center sm:text-left">
            {t('footer.copyright')}
          </div>
          <div className="text-sm text-gray-600 text-center sm:text-right">
            {t('footer.powered_by')}
          </div>
        </div>
        
        {/* モバイル用の追加情報 */}
        <div className="mt-4 pt-4 border-t border-gray-200 sm:hidden">
          <div className="text-xs text-gray-500 text-center space-y-1">
            <div>{t('footer.mobile_optimized')}</div>
            <div className="flex justify-center items-center space-x-4">
              <span className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                {t('footer.responsive')}
              </span>
              <span className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                PWA Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}