'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/router'
import Header from './Header'
import Footer from './Footer'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const currentLocale = router.locale || 'ja'

  const handleLocaleChange = (locale: string) => {
    // この関数は後方互換性のために残しているが、実際の処理はLanguageSwitcherで行う
    console.log('Locale change requested:', locale)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header 
        currentLocale={currentLocale} 
        onLocaleChange={handleLocaleChange} 
      />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}