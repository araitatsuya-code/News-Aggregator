/**
 * NewsListコンポーネントのテスト
 * ニュース一覧表示機能をテスト
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { NewsList } from '../news/NewsList'
import { NewsItem } from '@/lib/types'

// モックデータ
const mockNewsItems: NewsItem[] = [
  {
    id: 'test-1',
    title: 'AI技術の進歩',
    original_title: 'AI Technology Advances',
    summary: 'AI技術が大幅に進歩しています。',
    url: 'https://example.com/article1',
    source: 'テストソース1',
    category: 'AI',
    published_at: '2024-08-31T12:00:00Z',
    language: 'ja',
    tags: ['AI', '技術'],
    ai_confidence: 0.9
  },
  {
    id: 'test-2',
    title: '機械学習の応用',
    original_title: 'Machine Learning Applications',
    summary: '機械学習の新しい応用分野が発見されました。',
    url: 'https://example.com/article2',
    source: 'テストソース2',
    category: '機械学習',
    published_at: '2024-08-31T13:00:00Z',
    language: 'ja',
    tags: ['機械学習', '応用'],
    ai_confidence: 0.85
  }
]

describe('NewsList', () => {
  it('ニュース記事を正しく表示する', () => {
    render(<NewsList articles={mockNewsItems} />)
    
    // 記事タイトルが表示されることを確認（original_titleが表示される）
    expect(screen.getByText('AI Technology Advances')).toBeInTheDocument()
    expect(screen.getByText('Machine Learning Applications')).toBeInTheDocument()
    
    // 記事要約が表示されることを確認
    expect(screen.getByText('AI技術が大幅に進歩しています。')).toBeInTheDocument()
    expect(screen.getByText('機械学習の新しい応用分野が発見されました。')).toBeInTheDocument()
  })
  
  it('空のニュースリストを適切に処理する', () => {
    render(<NewsList articles={[]} />)
    
    // 空の状態メッセージが表示されることを確認（翻訳後のテキスト）
    expect(screen.getByText('no_articles')).toBeInTheDocument()
  })
  
  it('カテゴリフィルタが正しく動作する', () => {
    render(<NewsList articles={mockNewsItems} categoryFilter="AI" />)
    
    // AIカテゴリの記事のみ表示されることを確認
    expect(screen.getByText('AI Technology Advances')).toBeInTheDocument()
    expect(screen.queryByText('Machine Learning Applications')).not.toBeInTheDocument()
  })
  
  it('記事クリック時に外部リンクが開く', () => {
    // window.openをモック
    const mockOpen = jest.fn()
    Object.defineProperty(window, 'open', {
      value: mockOpen,
      writable: true
    })
    
    render(<NewsList articles={mockNewsItems} />)
    
    // 最初の記事のリンクをクリック
    const firstArticleLink = screen.getByText('AI Technology Advances')
    fireEvent.click(firstArticleLink)
    
    // 外部リンクが開かれることを確認
    expect(mockOpen).toHaveBeenCalledWith('https://example.com/article1', '_blank', 'noopener,noreferrer')
  })
  
  it('要約表示オプションが正しく動作する', () => {
    render(<NewsList articles={mockNewsItems} showSummary={false} />)
    
    // 要約が表示されないことを確認
    expect(screen.queryByText('AI技術が大幅に進歩しています。')).not.toBeInTheDocument()
  })
  
  it('タグが正しく表示される', () => {
    render(<NewsList articles={mockNewsItems} />)
    
    // タグが表示されることを確認（#付きで表示される）
    expect(screen.getByText('#AI')).toBeInTheDocument()
    expect(screen.getByText('#技術')).toBeInTheDocument()
    expect(screen.getByText('#機械学習')).toBeInTheDocument()
    expect(screen.getByText('#応用')).toBeInTheDocument()
  })
  
  it('公開日時が正しくフォーマットされる', () => {
    render(<NewsList articles={mockNewsItems} />)
    
    // 日時が適切にフォーマットされて表示されることを確認（相対時間または絶対時間）
    // 実装では相対時間（hours_ago）または絶対時間が表示される
    const dateElements = screen.getAllByText(/Aug|8月|時間前|just_now|hour_ago|hours_ago/)
    expect(dateElements.length).toBeGreaterThan(0)
  })
  
  it('信頼度スコアが表示される', () => {
    render(<NewsList articles={mockNewsItems} />)
    
    // 信頼度スコアが表示されることを確認
    expect(screen.getByText('90%')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
  })
  
  it('レスポンシブデザインのクラスが適用される', () => {
    render(<NewsList articles={mockNewsItems} />)
    
    // レスポンシブクラスが適用されることを確認
    const container = screen.getByText('AI Technology Advances').closest('div').parentElement.parentElement.parentElement.parentElement
    expect(container).toHaveClass('space-y-4', 'sm:space-y-6')
  })
  
  it('アクセシビリティ属性が正しく設定される', () => {
    render(<NewsList articles={mockNewsItems} />)
    
    // ARIA属性が正しく設定されることを確認
    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(2)
    
    // 各記事がarticle要素として認識されることを確認
    articles.forEach(article => {
      expect(article.tagName).toBe('ARTICLE')
    })
  })
})