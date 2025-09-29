'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ASCIILogo from './ASCIILogo'
import TerminalHeader from './TerminalHeader'
import TerminalPrompt from './TerminalPrompt'

interface TerminalLayoutProps {
  children: ReactNode
  showHeader?: boolean
  showPrompt?: boolean
  theme?: 'dark' | 'light' | 'matrix' | 'cyberpunk' | 'hacker'
  enableEffects?: boolean
  bootAnimation?: boolean
}

export default function TerminalLayout({ 
  children, 
  showHeader = true,
  showPrompt = true,
  theme = 'dark',
  enableEffects = true,
  bootAnimation = true
}: TerminalLayoutProps) {
  const router = useRouter()
  const [isBooted, setIsBooted] = useState(!bootAnimation)
  const [currentTime, setCurrentTime] = useState(new Date())

  // 現在時刻の更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // ブート アニメーション
  useEffect(() => {
    if (bootAnimation && !isBooted) {
      const timer = setTimeout(() => {
        setIsBooted(true)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [bootAnimation, isBooted])

  // テーマ設定
  useEffect(() => {
    if (theme !== 'dark' && theme !== 'light') {
      document.documentElement.setAttribute('data-theme', theme)
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [theme])

  if (!isBooted) {
    return (
      <div className="min-h-screen bg-terminal-bg-primary text-terminal-text-primary font-mono-primary flex items-center justify-center">
        <div className="text-center animate-terminal-boot">
          <div className="text-sm mb-4">
            <div className="typing-text">AI News Aggregator v2.0.0</div>
          </div>
          <div className="text-xs text-terminal-text-muted">
            <div className="animate-pulse">システムを初期化中...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`
        min-h-screen terminal-layout font-mono-primary
        ${enableEffects ? 'scanline-effect crt-effect' : ''}
      `}
    >
      {/* ターミナル ヘッダー */}
      {showHeader && (
        <TerminalHeader 
          currentTime={currentTime}
          theme={theme}
        />
      )}

      {/* ASCII ロゴ */}
      <div className="px-4 py-2 border-b border-terminal-border-primary">
        <ASCIILogo />
      </div>

      {/* メイン コンテンツ エリア */}
      <div className="flex-1 p-4">
        {/* プロンプト表示 */}
        {showPrompt && (
          <TerminalPrompt 
            currentPath={router.asPath}
            userName="user"
            hostName="ai-news"
          />
        )}

        {/* コンテンツ */}
        <div className="mt-4">
          {children}
        </div>
      </div>

      {/* ターミナル フッター（ステータスバー） */}
      <div className="bg-terminal-bg-secondary border-t border-terminal-border-primary px-4 py-2">
        <div className="flex items-center justify-between text-xs text-terminal-text-muted">
          <div className="flex items-center space-x-4">
            <span>Ready</span>
            <span>|</span>
            <span>Ln 1, Col 1</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>UTF-8</span>
            <span>|</span>
            <span>JavaScript</span>
            <span>|</span>
            <span className="text-terminal-text-accent">
              {currentTime.toLocaleTimeString('ja-JP')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}