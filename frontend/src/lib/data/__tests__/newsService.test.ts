/**
 * NewsServiceクラスのテスト
 * データアクセス層の機能をテスト
 */

import { NewsService } from '../newsService'
import { NewsItem, DailySummary } from '@/lib/types'

// fetchのモック
global.fetch = jest.fn()

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

const mockDailySummary: DailySummary = {
  date: '2024-08-31',
  total_articles: 2,
  top_trends: ['AI', '機械学習'],
  significant_news: [mockNewsItems[0]],
  category_breakdown: { 'AI': 1, '機械学習': 1 },
  summary_ja: '今日はAIと機械学習に関する記事が投稿されました。',
  summary_en: 'Today saw articles about AI and machine learning.',
  generated_at: '2024-08-31T18:00:00Z'
}

describe('NewsService', () => {
  beforeEach(() => {
    // 各テスト前にfetchモックをリセット
    jest.clearAllMocks()
  })

  describe('getLatestNews', () => {
    it('最新ニュースを正しく取得する', async () => {
      // fetchのモックレスポンスを設定
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNewsItems
      })

      const result = await NewsService.getLatestNews()

      expect(result).toEqual(mockNewsItems)
    })

    it('件数制限が正しく適用される', async () => {
      const manyItems = Array.from({ length: 30 }, (_, i) => ({
        ...mockNewsItems[0],
        id: `test-${i}`,
        title: `記事 ${i}`
      }))

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => manyItems
      })

      const result = await NewsService.getLatestNews(10)

      expect(result).toHaveLength(10)
    })
  })

  describe('getDailyNews', () => {
    it('指定日のニュースを正しく取得する', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNewsItems
      })

      const result = await NewsService.getDailyNews('2024-08-31')

      expect(result).toEqual(mockNewsItems)
    })

    it('存在しない日付のデータでエラーを投げる', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Not found'))

      await expect(NewsService.getDailyNews('2024-01-01')).rejects.toThrow('Failed to load daily news for 2024-01-01')
    })
  })

  describe('getDailySummary', () => {
    it('指定日のサマリーを正しく取得する', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDailySummary
      })

      const result = await NewsService.getDailySummary('2024-08-31')

      expect(result).toEqual(mockDailySummary)
    })

    it('存在しない日付のサマリーでオフラインデータを返す', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Not found'))

      // オフライン機能により、エラーではなくオフライン用のサマリーが返される
      const result = await NewsService.getDailySummary('2024-01-01')
      expect(result).toBeDefined()
      expect(result.summary_ja).toContain('オフライン状態')
    })
  })

  describe('getNewsByCategory', () => {
    it('カテゴリ別ニュースを正しく取得する', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNewsItems
      })

      const result = await NewsService.getNewsByCategory('AI')

      // 最新ニュースを取得してフィルタリング
      expect(fetch).toHaveBeenCalledWith('/data/news/latest.json')
      expect(result).toHaveLength(1)
      expect(result[0].category).toBe('AI')
    })

    it('存在しないカテゴリで空配列を返す', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNewsItems
      })

      const result = await NewsService.getNewsByCategory('存在しないカテゴリ')

      expect(result).toEqual([])
    })
  })

  describe('getCategories', () => {
    it('カテゴリ一覧を正しく取得する', async () => {
      const mockCategories = ['AI', '機械学習', 'データサイエンス']

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories
      })

      const result = await NewsService.getCategories()

      expect(result).toEqual(mockCategories)
    })
  })
})