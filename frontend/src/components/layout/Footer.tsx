'use client'

import { useTranslation } from 'next-i18next'

export default function Footer() {
  const { t } = useTranslation('common')

  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-gray-600">
            {t('footer.copyright')}
          </div>
          <div className="text-sm text-gray-600">
            {t('footer.powered_by')}
          </div>
        </div>
      </div>
    </footer>
  )
}