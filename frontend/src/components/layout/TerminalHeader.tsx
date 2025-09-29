'use client'

import { useState, useEffect } from 'react'
import { ASCIILogoSmall } from './ASCIILogo'

interface TerminalHeaderProps {
  currentTime: Date
  theme?: string
  showControls?: boolean
}

export default function TerminalHeader({ 
  currentTime, 
  theme = 'dark',
  showControls = true 
}: TerminalHeaderProps) {
  const [systemInfo, setSystemInfo] = useState({
    uptime: '00:00:00',
    memory: '0MB',
    cpu: '0%'
  })

  // システム情報の模擬更新
  useEffect(() => {
    const updateSystemInfo = () => {
      const now = new Date()
      const startTime = new Date(now.getTime() - Math.random() * 3600000) // 最大1時間前
      const uptime = Math.floor((now.getTime() - startTime.getTime()) / 1000)
      
      const hours = Math.floor(uptime / 3600)
      const minutes = Math.floor((uptime % 3600) / 60)
      const seconds = uptime % 60

      setSystemInfo({
        uptime: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        memory: `${Math.floor(Math.random() * 512 + 256)}MB`,
        cpu: `${Math.floor(Math.random() * 30 + 5)}%`
      })
    }

    updateSystemInfo()
    const interval = setInterval(updateSystemInfo, 5000) // 5秒ごとに更新

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="terminal-header">
      <div className="flex items-center justify-between w-full">
        {/* 左側: ロゴとタイトル */}
        <div className="flex items-center space-x-4">
          {/* ターミナル制御ボタン（装飾用） */}
          {showControls && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          )}
          
          <ASCIILogoSmall />
          
          <div className="text-terminal-text-secondary">
            <span className="font-medium">ai-news-terminal</span>
            <span className="text-terminal-text-muted ml-2">~</span>
          </div>
        </div>

        {/* 中央: システム情報 */}
        <div className="hidden md:flex items-center space-x-6 text-xs text-terminal-text-muted">
          <div className="flex items-center space-x-2">
            <span className="text-terminal-text-accent">↑</span>
            <span>uptime: {systemInfo.uptime}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-terminal-text-accent">⚡</span>
            <span>cpu: {systemInfo.cpu}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-terminal-text-accent">💾</span>
            <span>mem: {systemInfo.memory}</span>
          </div>
        </div>

        {/* 右側: 時刻とテーマ情報 */}
        <div className="flex items-center space-x-4 text-xs">
          <div className="text-terminal-text-muted">
            theme: <span className="text-terminal-text-accent">{theme}</span>
          </div>
          <div className="text-terminal-text-primary font-mono-primary">
            {currentTime.toLocaleString('ja-JP', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>
      </div>

      {/* プログレスバー（装飾用） */}
      <div className="mt-2 h-1 bg-terminal-bg-accent rounded-full overflow-hidden">
        <div 
          className="h-full bg-terminal-text-primary transition-all duration-1000 ease-in-out"
          style={{ 
            width: `${Math.min(100, (currentTime.getSeconds() / 60) * 100)}%` 
          }}
        ></div>
      </div>
    </div>
  )
}

// シンプルバージョン（モバイル用）
export function TerminalHeaderSimple({ currentTime }: { currentTime: Date }) {
  return (
    <div className="terminal-header">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
          <span className="text-terminal-text-primary text-sm font-medium">AI News</span>
        </div>
        <div className="text-terminal-text-muted text-xs">
          {currentTime.toLocaleTimeString('ja-JP')}
        </div>
      </div>
    </div>
  )
}