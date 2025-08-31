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

        // 日付が表示されることを確認
        expect(screen.getByText('2024年8月31日のまとめ')).toBeInTheDocument()

        // 記事総数が表示されることを確認
        expect(screen.getByText('25件の記事')).toBeInTheDocument()

        // 日本語サマリーが表示されることを確認
        expect(screen.getByText(/今日はAI技術に関する重要な発表/)).toBeInTheDocument()
    })

    it('トップトレンドが正しく表示される', () => {
        render(<DailySummaryComponent summary={mockDailySummary} showTrends={true} />)

        // 全てのトレンドが表示されることを確認
        expect(screen.getByText('AI技術')).toBeInTheDocument()
        expect(screen.getByText('機械学習')).toBeInTheDocument()
        expect(screen.getByText('データサイエンス')).toBeInTheDocument()
    })

    it('カテゴリ別内訳が正しく表示される', () => {
        render(<DailySummaryComponent summary={mockDailySummary} showCategoryBreakdown={true} />)

        // カテゴリと件数が表示されることを確認
        expect(screen.getByText('AI: 10件')).toBeInTheDocument()
        expect(screen.getByText('機械学習: 8件')).toBeInTheDocument()
        expect(screen.getByText('データサイエンス: 4件')).toBeInTheDocument()
        expect(screen.getByText('その他: 3件')).toBeInTheDocument()
    })

    it('重要ニュースが正しく表示される', () => {
        render(<DailySummaryComponent summary={mockDailySummary} showSignificantNews={true} />)

        // 重要ニュースのタイトルが表示されることを確認
        expect(screen.getByText('重要なAI発表')).toBeInTheDocument()
        expect(screen.getByText('業界を変える重要なAI技術が発表されました。')).toBeInTheDocument()
    })

    it('言語切替が正しく動作する', () => {
        render(<DailySummaryComponent summary={mockDailySummary} />)

        // 初期状態では日本語サマリーが表示
        expect(screen.getByText(/今日はAI技術に関する重要な発表/)).toBeInTheDocument()

        // 英語切替ボタンをクリック
        const englishButton = screen.getByText('English')
        fireEvent.click(englishButton)

        // 英語サマリーが表示されることを確認
        expect(screen.getByText(/Today saw many important AI technology announcements/)).toBeInTheDocument()
    })

    it('空のサマリーを適切に処理する', () => {
        const emptySummary: DailySummary = {
            ...mockDailySummary,
            total_articles: 0,
            top_trends: [],
            significant_news: [],
            category_breakdown: {},
            summary_ja: '',
            summary_en: ''
        }

        render(<DailySummaryComponent summary={emptySummary} />)

        // 空の状態メッセージが表示されることを確認
        expect(screen.getByText(/この日はニュースがありませんでした/)).toBeInTheDocument()
    })

    it('生成日時が正しく表示される', () => {
        render(<DailySummaryComponent summary={mockDailySummary} showGeneratedAt={true} />)

        // 生成日時が表示されることを確認
        expect(screen.getByText(/2024年8月31日 18:00に生成/)).toBeInTheDocument()
    })

    it('カテゴリ別内訳のチャート表示が正しく動作する', () => {
        render(<DailySummaryComponent summary={mockDailySummary} showChart={true} />)

        // チャート要素が存在することを確認
        const chartContainer = screen.getByTestId('category-chart')
        expect(chartContainer).toBeInTheDocument()
    })

    it('重要ニュースクリック時のコールバックが正しく動作する', () => {
        const mockOnNewsClick = jest.fn()
        render(
            <DailySummaryComponent
                summary={mockDailySummary}
                showSignificantNews={true}
                onNewsClick={mockOnNewsClick}
            />
        )

        // 重要ニュースをクリック
        const newsItem = screen.getByText('重要なAI発表')
        fireEvent.click(newsItem)

        // コールバックが呼ばれることを確認
        expect(mockOnNewsClick).toHaveBeenCalledWith(mockSignificantNews[0])
    })

    it('トレンドクリック時のフィルタリングが正しく動作する', () => {
        const mockOnTrendClick = jest.fn()
        render(
            <DailySummaryComponent
                summary={mockDailySummary}
                showTrends={true}
                onTrendClick={mockOnTrendClick}
            />
        )

        // トレンドをクリック
        const trendItem = screen.getByText('AI技術')
        fireEvent.click(trendItem)

        // コールバックが呼ばれることを確認
        expect(mockOnTrendClick).toHaveBeenCalledWith('AI技術')
    })

    it('レスポンシブデザインのクラスが適用される', () => {
        render(<DailySummaryComponent summary={mockDailySummary} />)

        // レスポンシブクラスが適用されることを確認
        const container = screen.getByRole('main')
        expect(container).toHaveClass('grid', 'gap-6', 'md:grid-cols-2', 'lg:grid-cols-3')
    })

    it('アクセシビリティ属性が正しく設定される', () => {
        render(<DailySummaryComponent summary={mockDailySummary} />)

        // ARIA属性が正しく設定されることを確認
        const summarySection = screen.getByRole('region', { name: /日次サマリー/ })
        expect(summarySection).toBeInTheDocument()

        // 見出しレベルが適切に設定されることを確認
        const mainHeading = screen.getByRole('heading', { level: 1 })
        expect(mainHeading).toBeInTheDocument()
    })

    it('統計情報の計算が正しく行われる', () => {
        render(<DailySummaryComponent summary={mockDailySummary} showStats={true} />)

        // 統計情報が正しく計算されて表示されることを確認
        expect(screen.getByText('平均信頼度: 95%')).toBeInTheDocument()
        expect(screen.getByText('最多カテゴリ: AI')).toBeInTheDocument()
    })

    it('エクスポート機能が正しく動作する', () => {
        const mockOnExport = jest.fn()
        render(
            <DailySummaryComponent
                summary={mockDailySummary}
                showExportButton={true}
                onExport={mockOnExport}
            />
        )

        // エクスポートボタンをクリック
        const exportButton = screen.getByText('エクスポート')
        fireEvent.click(exportButton)

        // コールバックが呼ばれることを確認
        expect(mockOnExport).toHaveBeenCalledWith(mockDailySummary)
    })
})