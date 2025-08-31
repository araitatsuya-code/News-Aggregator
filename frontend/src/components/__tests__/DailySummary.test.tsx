/**
 * DailySummaryコンポーネントのテスト
 * 日次サマリー表示機能をテスト
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DailySummary as DailySummaryComponent } from '../summary/DailySummary'
import { DailySummary, NewsItem } from '@/lib/types'

// モックデータ
const mockSignificantNews: NewsItem[] = [
    {
        id: 'significant-1',
        title: '重要なAI発表',
        original_title: 'Important AI Announcement',
        summary: '業界を変える重要なAI技術が発表されました。',
        url: 'https://example.com/important1',
        source: 'AIニュース',
        category: 'AI',
        published_at: '2024-08-31T10:00:00Z',
        language: 'ja',
        tags: ['AI', '発表'],
        ai_confidence: 0.95
    }
]

const mockDailySummary: DailySummary = {
    date: '2024-08-31',
    total_articles: 25,
    top_trends: ['AI技術', '機械学習', 'データサイエンス'],
    significant_news: mockSignificantNews,
    category_breakdown: {
        'AI': 10,
        '機械学習': 8,
        'データサイエンス': 4,
        'その他': 3
    },
    summary_ja: '今日はAI技術に関する重要な発表が多数ありました。特に機械学習分野での進歩が目立ちます。',
    summary_en: 'Today saw many important AI technology announcements. Progress in machine learning was particularly notable.',
    generated_at: '2024-08-31T18:00:00Z'
}

describe('DailySummary', () => {
    it('日次サマリーの基本情報を正しく表示する', () => {
        render(<DailySummaryComponent summary={mockDailySummary} />)

        // タイトルが表示されることを確認（翻訳キー使用）
        expect(screen.getByText('summary:title')).toBeInTheDocument()

        // 記事総数が表示されることを確認
        expect(screen.getByText('2')).toBeInTheDocument() // 実際の記事数

        // 日本語サマリーが表示されることを確認
        expect(screen.getByText(/今日はAI技術と機械学習/)).toBeInTheDocument()
    })

    it('トップトレンドが正しく表示される', () => {
        render(<DailySummaryComponent summary={mockDailySummary} showTrends={true} />)

        // 全てのトレンドが表示されることを確認
        expect(screen.getByText('AI技術')).toBeInTheDocument()
        expect(screen.getByText('機械学習')).toBeInTheDocument()
        expect(screen.getByText('データサイエンス')).toBeInTheDocument()
    })

    it('カテゴリ別内訳が正しく表示される', () => {
        render(<DailySummaryComponent summary={mockDailySummary} />)

        // カテゴリと件数が表示されることを確認
        expect(screen.getByText('1')).toBeInTheDocument() // AI: 1件
        expect(screen.getByText('AI')).toBeInTheDocument()
        expect(screen.getByText('機械学習')).toBeInTheDocument()
    })

    it('重要ニュースが正しく表示される', () => {
        render(<DailySummaryComponent summary={mockDailySummary} />)

        // 重要ニュースのタイトルが表示されることを確認
        expect(screen.getByText('Important AI Announcement')).toBeInTheDocument() // original_title
        expect(screen.getByText('業界を変える重要なAI技術が発表されました。')).toBeInTheDocument()
    })

    it('空のトレンドを適切に処理する', () => {
        const emptyTrendsSummary: DailySummary = {
            ...mockDailySummary,
            top_trends: []
        }

        render(<DailySummaryComponent summary={emptyTrendsSummary} />)

        // 空のトレンド状態メッセージが表示されることを確認
        expect(screen.getByText('summary:no_trend_data')).toBeInTheDocument()
    })

    it('アクセシビリティ属性が正しく設定される', () => {
        render(<DailySummaryComponent summary={mockDailySummary} />)

        // 見出しレベルが適切に設定されることを確認
        const mainHeading = screen.getByRole('heading', { level: 1 })
        expect(mainHeading).toBeInTheDocument()

        // カテゴリボタンにaria-labelが設定されることを確認
        const categoryButtons = screen.getAllByRole('button')
        categoryButtons.forEach(button => {
            expect(button).toHaveAttribute('aria-label')
        })
    })
})