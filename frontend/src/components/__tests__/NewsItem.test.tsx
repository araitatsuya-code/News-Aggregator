/**
 * NewsItemコンポーネントのテスト
 * 個別ニュース項目の表示機能をテスト
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { NewsItem as NewsItemComponent } from '../news/NewsItem'
import { NewsItem } from '@/lib/types'

// モックデータ
const mockNewsItem: NewsItem = {
  id: 'test-1',
  title: 'AI技術の革新的進歩',
  original_title: 'Revolutionary AI Technology Advances',
  summary: 'AI技術が革新的な進歩を遂げ、業界に大きな変化をもたらしています。この技術により、従来不可能だった複雑なタスクの自動化が実現されました。',
  url: 'https://example.com/article1',
  source: 'テクノロジーニュース',
  category: 'AI',
  published_at: '2024-08-31T12:30:00Z',
  language: 'ja',
  tags: ['AI', '技術革新', '自動化'],
  ai_confidence: 0.92
}

describe('NewsItem', () => {
  it('ニュース項目の基本情報を正しく表示する', () => {
    render(<NewsItemComponent article={mockNewsItem} />)
    
    // タイトルが表示されることを確認（original_titleが表示される）
    expect(screen.getByText('Revolutionary AI Technology Advances')).toBeInTheDocument()
    
    // 要約が表示されることを確認
    expect(screen.getByText(/AI技術が革新的な進歩を遂げ/)).toBeInTheDocument()
    
    // ソースが表示されることを確認
    expect(screen.getByText('テクノロジーニュース')).toBeInTheDocument()
    
    // カテゴリが表示されることを確認
    expect(screen.getByText('AI')).toBeInTheDocument()
  })
  
  it('翻訳記事の場合に翻訳情報が表示される', () => {
    // 翻訳記事のテストデータ
    const translatedArticle = {
      ...mockNewsItem,
      language: 'en',
      title: 'AI技術の革新的進歩', // 翻訳されたタイトル
      original_title: 'Revolutionary AI Technology Advances' // 元のタイトル
    }
    
    render(<NewsItemComponent article={translatedArticle} />)
    
    // 翻訳されたタイトルが表示されることを確認
    expect(screen.getByText('AI技術の革新的進歩')).toBeInTheDocument()
    
    // 元タイトルも表示されることを確認
    expect(screen.getByText('Revolutionary AI Technology Advances')).toBeInTheDocument()
  })
  
  it('公開日時が正しくフォーマットされる', () => {
    render(<NewsItemComponent article={mockNewsItem} />)
    
    // 相対時間または絶対時間が表示されることを確認
    const dateElements = screen.getAllByText(/Aug|8月|時間前|just_now|hour_ago|hours_ago/)
    expect(dateElements.length).toBeGreaterThan(0)
  })
  
  it('タグが正しく表示される', () => {
    render(<NewsItemComponent article={mockNewsItem} />)
    
    // 全てのタグが表示されることを確認
    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(screen.getByText('技術革新')).toBeInTheDocument()
    expect(screen.getByText('自動化')).toBeInTheDocument()
  })
  
  it('信頼度スコアが正しく表示される', () => {
    render(<NewsItemComponent article={mockNewsItem} />)
    
    // 信頼度が百分率で表示されることを確認
    expect(screen.getByText('92%')).toBeInTheDocument()
  })
  
  it('記事クリック時に外部リンクが開く', () => {
    // window.openをモック
    const mockOpen = jest.fn()
    Object.defineProperty(window, 'open', {
      value: mockOpen,
      writable: true
    })
    
    render(<NewsItemComponent article={mockNewsItem} />)
    
    // 記事のリンクをクリック
    const articleLink = screen.getByText('Revolutionary AI Technology Advances')
    fireEvent.click(articleLink)
    
    // 外部リンクが開かれることを確認
    expect(mockOpen).toHaveBeenCalledWith('https://example.com/article1', '_blank', 'noopener,noreferrer')
  })
  
  it('タッチ操作のフィードバックが正しく動作する', () => {
    render(<NewsItemComponent article={mockNewsItem} />)
    
    const article = screen.getByRole('article')
    
    // タッチ開始時にクラスが追加されることを確認
    fireEvent.touchStart(article)
    expect(article).toHaveClass('scale-98', 'shadow-lg')
    
    // タッチ終了時にクラスが削除されることを確認
    fireEvent.touchEnd(article)
    expect(article).not.toHaveClass('scale-98', 'shadow-lg')
  })
  
  it('要約の表示/非表示が正しく制御される', () => {
    const { rerender } = render(<NewsItemComponent article={mockNewsItem} showSummary={false} />)
    
    // 要約が表示されないことを確認
    expect(screen.queryByText(/AI技術が革新的な進歩を遂げ/)).not.toBeInTheDocument()
    
    // showSummary=trueで再レンダリング
    rerender(<NewsItemComponent article={mockNewsItem} showSummary={true} />)
    
    // 要約が表示されることを確認
    expect(screen.getByText(/AI技術が革新的な進歩を遂げ/)).toBeInTheDocument()
  })
  

  
  it('アクセシビリティ属性が正しく設定される', () => {
    render(<NewsItemComponent article={mockNewsItem} />)
    
    const article = screen.getByRole('article')
    
    // article要素として認識されることを確認
    expect(article.tagName).toBe('ARTICLE')
    
    // リンクにtitle属性が設定されることを確認
    const link = screen.getByText('Revolutionary AI Technology Advances')
    expect(link).toHaveAttribute('title')
  })
})