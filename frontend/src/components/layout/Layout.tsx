'use client'

import { ReactNode, useState } from 'react'
import Header from './Header'
import Footer from './Footer'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [currentLocale, setCurrentLocale] = useState('ja')

  const handleLocaleChange = (locale: string) => {
    setCurrentLocale(locale)
    // For static export, we'll handle locale switching differently
    // This will be implemented in later tasks
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