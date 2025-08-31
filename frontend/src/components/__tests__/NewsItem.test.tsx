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
    
    // タイトルが表示されることを確認
    expect(screen.getByText('AI技術の革新的進歩')).toBeInTheDocument()
    
    // 要約が表示されることを確認
    expect(screen.getByText(/AI技術が革新的な進歩を遂げ/)).toBeInTheDocument()
    
    // ソースが表示されることを確認
    expect(screen.getByText('テクノロジーニュース')).toBeInTheDocument()
    
    // カテゴリが表示されることを確認
    expect(screen.getByText('AI')).toBeInTheDocument()
  })
  
  it('元タイトルが正しく表示される', () => {
    render(<NewsItemComponent article={mockNewsItem} showOriginalTitle={true} />)
    
    // 元の英語タイトルが表示されることを確認
    expect(screen.getByText('Revolutionary AI Technology Advances')).toBeInTheDocument()
  })
  
  it('公開日時が正しくフォーマットされる', () => {
    render(<NewsItemComponent article={mockNewsItem} />)
    
    // 日本語フォーマットの日時が表示されることを確認
    expect(screen.getByText(/2024年8月31日/)).toBeInTheDocument()
    expect(screen.getByText(/12:30/)).toBeInTheDocument()
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
  
  it('記事クリック時にコールバックが呼ばれる', () => {
    const mockOnClick = jest.fn()
    render(<NewsItemComponent article={mockNewsItem} onClick={mockOnClick} />)
    
    // 記事をクリック
    const article = screen.getByRole('article')
    fireEvent.click(article)
    
    // コールバックが呼ばれることを確認
    expect(mockOnClick).toHaveBeenCalledWith(mockNewsItem)
  })
  
  it('キーボードナビゲーションが正しく動作する', () => {
    const mockOnClick = jest.fn()
    render(<NewsItemComponent article={mockNewsItem} onClick={mockOnClick} />)
    
    const article = screen.getByRole('article')
    
    // Enterキーでクリックイベントが発火することを確認
    fireEvent.keyDown(article, { key: 'Enter', code: 'Enter' })
    expect(mockOnClick).toHaveBeenCalledWith(mockNewsItem)
    
    // Spaceキーでクリックイベントが発火することを確認
    fireEvent.keyDown(article, { key: ' ', code: 'Space' })
    expect(mockOnClick).toHaveBeenCalledTimes(2)
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
  
  it('コンパクトモードが正しく動作する', () => {
    render(<NewsItemComponent article={mockNewsItem} compact={true} />)
    
    // コンパクトモードのクラスが適用されることを確認
    const article = screen.getByRole('article')
    expect(article).toHaveClass('compact')
  })
  
  it('信頼度に基づく視覚的表示が正しく動作する', () => {
    // 高信頼度の記事
    const { rerender } = render(<NewsItemComponent article={mockNewsItem} />)
    let article = screen.getByRole('article')
    expect(article).toHaveClass('high-confidence')
    
    // 低信頼度の記事
    const lowConfidenceItem = { ...mockNewsItem, ai_confidence: 0.3 }
    rerender(<NewsItemComponent article={lowConfidenceItem} />)
    article = screen.getByRole('article')
    expect(article).toHaveClass('low-confidence')
  })
  
  it('長い要約が適切に切り詰められる', () => {
    const longSummaryItem = {
      ...mockNewsItem,
      summary: 'これは非常に長い要約文です。'.repeat(20) // 非常に長い要約
    }
    
    render(<NewsItemComponent article={longSummaryItem} maxSummaryLength={100} />)
    
    // 要約が切り詰められることを確認
    const summaryElement = screen.getByText(/これは非常に長い要約文です/)
    expect(summaryElement.textContent!.length).toBeLessThanOrEqual(103) // "..." を含む
  })
  
  it('アクセシビリティ属性が正しく設定される', () => {
    render(<NewsItemComponent article={mockNewsItem} />)
    
    const article = screen.getByRole('article')
    
    // ARIA属性が正しく設定されることを確認
    expect(article).toHaveAttribute('tabIndex', '0')
    expect(article).toHaveAttribute('aria-label')
    expect(article).toHaveAttribute('role', 'article')
  })
  
  it('カテゴリ別の色分けが正しく適用される', () => {
    const { rerender } = render(<NewsItemComponent article={mockNewsItem} />)
    
    // AIカテゴリの色が適用されることを確認
    let categoryElement = screen.getByText('AI')
    expect(categoryElement).toHaveClass('category-ai')
    
    // 異なるカテゴリでテスト
    const mlItem = { ...mockNewsItem, category: '機械学習' }
    rerender(<NewsItemComponent article={mlItem} />)
    categoryElement = screen.getByText('機械学習')
    expect(categoryElement).toHaveClass('category-ml')
  })
})