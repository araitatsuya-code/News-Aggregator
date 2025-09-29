'use client'

import { useEffect, useState, useMemo } from 'react'

interface ASCIILogoProps {
  animated?: boolean
  size?: 'small' | 'medium' | 'large'
}

export default function ASCIILogo({ 
  animated = true, 
  size = 'medium' 
}: ASCIILogoProps) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)

  // ASCII アート（AI News Aggregator）
  const logoLines = useMemo(() => [
    "    ___    ____   _   _                     ",
    "   /   |  /  _/  / | / /___  _      _______",
    "  / /| |  / /   /  |/ / __ \\| | /| / / ___/",
    " / ___ |_/ /   / /|  / /_/ /| |/ |/ (__  ) ",
    "/_/  |_/___/  /_/ |_/\\____/ |__/|__/____/  ",
    "                                           ",
    "     ___                                   ",
    "    /   |  ____ _ ____ _ _____ ___   ____ _ ",
    "   / /| | / __ `// __ `// ___// _ \\ / __ `/",
    "  / ___ |/ /_/ // /_/ // /   /  __// /_/ / ",
    " /_/  |_|\\__, / \\__, //_/    \\___/ \\__, /  ",
    "        /____/ /____/             /____/   "
  ], [])

  const sizeClasses = {
    small: 'text-xs leading-3',
    medium: 'text-sm leading-4',
    large: 'text-base leading-5'
  }

  // タイピング アニメーション効果
  useEffect(() => {
    if (!animated) {
      setDisplayedLines(logoLines)
      return
    }

    if (currentLineIndex < logoLines.length) {
      const timer = setTimeout(() => {
        setDisplayedLines(prev => [...prev, logoLines[currentLineIndex]])
        setCurrentLineIndex(prev => prev + 1)
      }, 100) // 各行を100ms間隔で表示

      return () => clearTimeout(timer)
    }
  }, [currentLineIndex, animated, logoLines])

  // アニメーションなしの場合は即座に全て表示
  useEffect(() => {
    if (!animated) {
      setDisplayedLines(logoLines)
    }
  }, [animated, logoLines])

  return (
    <div className="ascii-art">
      <div className={`${sizeClasses[size]} text-terminal-text-primary`}>
        {displayedLines.map((line, index) => (
          <div 
            key={index} 
            className={`
              ${animated && index === displayedLines.length - 1 ? 'cursor-blink' : ''}
              ${animated ? 'animate-fade-in' : ''}
            `}
          >
            {line}
          </div>
        ))}
      </div>
      
      {/* サブタイトル */}
      <div className="mt-2 text-terminal-text-muted text-xs">
        <div className={animated ? 'typing-text' : ''}>
          AI-powered news aggregation system v2.0.0
        </div>
        <div className="mt-1 text-terminal-text-accent">
          Powered by Claude AI | Built with Next.js
        </div>
      </div>
    </div>
  )
}

// 小さいバージョンのロゴ（ヘッダー用）
export function ASCIILogoSmall() {
  return (
    <div className="ascii-art text-xs text-terminal-text-primary">
      <div>AI News</div>
      <div className="text-terminal-text-muted">v2.0.0</div>
    </div>
  )
}

// 大きいバージョンのロゴ（スプラッシュ用）
export function ASCIILogoLarge() {
  const largeLogoLines = [
    "  ██████╗ ██╗    ███╗   ██╗███████╗██╗    ██╗███████╗",
    " ██╔═══██╗██║    ████╗  ██║██╔════╝██║    ██║██╔════╝",
    " ██║   ██║██║    ██╔██╗ ██║█████╗  ██║ █╗ ██║███████╗",
    " ██║   ██║██║    ██║╚██╗██║██╔══╝  ██║███╗██║╚════██║",
    " ╚██████╔╝██║    ██║ ╚████║███████╗╚███╔███╔╝███████║",
    "  ╚═════╝ ╚═╝    ╚═╝  ╚═══╝╚══════╝ ╚══╝╚══╝ ╚══════╝",
    "                                                      ",
    "  █████╗  ██████╗  ██████╗ ██████╗ ███████╗ ██████╗  ",
    " ██╔══██╗██╔════╝ ██╔════╝ ██╔══██╗██╔════╝██╔════╝ ",
    " ███████║██║  ███╗██║  ███╗██████╔╝█████╗  ██║  ███╗",
    " ██╔══██║██║   ██║██║   ██║██╔══██╗██╔══╝  ██║   ██║",
    " ██║  ██║╚██████╔╝╚██████╔╝██║  ██║███████╗╚██████╔╝",
    " ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚═════╝ "
  ]

  return (
    <div className="ascii-art text-base text-terminal-text-primary glow-effect">
      {largeLogoLines.map((line, index) => (
        <div key={index}>{line}</div>
      ))}
      <div className="mt-4 text-center text-terminal-text-accent text-sm">
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      </div>
      <div className="mt-2 text-center text-terminal-text-muted text-xs">
        Next-Generation AI News Aggregation Platform
      </div>
    </div>
  )
}