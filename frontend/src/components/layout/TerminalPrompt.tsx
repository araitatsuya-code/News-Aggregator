'use client'

import { useState, useEffect } from 'react'

interface TerminalPromptProps {
  currentPath: string
  userName?: string
  hostName?: string
  showInput?: boolean
  onCommand?: (command: string) => void
}

export default function TerminalPrompt({ 
  currentPath, 
  userName = 'user',
  hostName = 'ai-news',
  showInput = false,
  onCommand
}: TerminalPromptProps) {
  const [command, setCommand] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // パスを短縮表示用に変換
  const getShortPath = (path: string) => {
    if (path === '/') return '~'
    if (path.startsWith('/')) return `~${path}`
    return `~/${path}`
  }

  // コマンド実行
  const handleCommand = (cmd: string) => {
    if (cmd.trim()) {
      setCommandHistory(prev => [...prev, cmd])
      onCommand?.(cmd)
    }
    setCommand('')
    setHistoryIndex(-1)
  }

  // キーボード操作
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(command)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setCommand(commandHistory[commandHistory.length - 1 - newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCommand(commandHistory[commandHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setCommand('')
      }
    }
  }

  return (
    <div className="space-y-2">
      {/* メインプロンプト */}
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-terminal-text-accent font-medium">
          {userName}@{hostName}
        </span>
        <span className="text-terminal-text-muted">:</span>
        <span className="text-terminal-text-primary">
          {getShortPath(currentPath)}
        </span>
        <span className="text-terminal-text-accent">$</span>
        
        {showInput ? (
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none outline-none text-terminal-text-primary font-mono-primary flex-1"
            placeholder="コマンドを入力..."
            autoFocus
          />
        ) : (
          <span className="text-terminal-text-primary cursor-blink">
            ls -la news/
          </span>
        )}
      </div>

      {/* 情報表示 */}
      <div className="text-xs text-terminal-text-muted space-y-1">
        <div>Last login: {new Date().toLocaleString('ja-JP')}</div>
        <div className="flex items-center space-x-4">
          <span>📁 {currentPath === '/' ? 'ホーム' : currentPath}</span>
          <span>🔗 接続済み</span>
          <span>⚡ システム正常</span>
        </div>
      </div>

      {/* コマンドヘルプ（初回表示時） */}
      {commandHistory.length === 0 && (
        <div className="mt-4 p-3 bg-terminal-bg-accent rounded border border-terminal-border-primary">
          <div className="text-xs text-terminal-text-muted mb-2">
            💡 利用可能なコマンド:
          </div>
          <div className="text-xs text-terminal-text-secondary space-y-1 font-mono-primary">
            <div><span className="text-terminal-text-accent">help</span> - ヘルプを表示</div>
            <div><span className="text-terminal-text-accent">ls</span> - ニュース一覧を表示</div>
            <div><span className="text-terminal-text-accent">cat [id]</span> - 記事詳細を表示</div>
            <div><span className="text-terminal-text-accent">filter [category]</span> - カテゴリでフィルター</div>
            <div><span className="text-terminal-text-accent">search [keyword]</span> - キーワード検索</div>
            <div><span className="text-terminal-text-accent">theme [name]</span> - テーマ変更</div>
            <div><span className="text-terminal-text-accent">clear</span> - 画面をクリア</div>
          </div>
        </div>
      )}
    </div>
  )
}

// シンプルバージョン（表示のみ）
export function TerminalPromptSimple({ currentPath, userName = 'user', hostName = 'ai-news' }: {
  currentPath: string
  userName?: string
  hostName?: string
}) {
  return (
    <div className="flex items-center space-x-2 text-sm text-terminal-text-primary">
      <span className="text-terminal-text-accent">{userName}@{hostName}</span>
      <span className="text-terminal-text-muted">:</span>
      <span>{currentPath === '/' ? '~' : `~${currentPath}`}</span>
      <span className="text-terminal-text-accent">$</span>
      <span className="cursor-blink">_</span>
    </div>
  )
}

// インタラクティブバージョン（コマンド入力可能）
export function TerminalPromptInteractive({ 
  currentPath, 
  onCommand,
  userName = 'user',
  hostName = 'ai-news'
}: {
  currentPath: string
  onCommand: (command: string) => void
  userName?: string
  hostName?: string
}) {
  return (
    <TerminalPrompt
      currentPath={currentPath}
      userName={userName}
      hostName={hostName}
      showInput={true}
      onCommand={onCommand}
    />
  )
}