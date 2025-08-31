/**
 * Tests for NewsService
 * Note: These are basic tests. In a real environment, you'd want to mock fetch
 * and test various scenarios including network failures.
 */

import { NewsService, DataLoadError } from '../newsService';

// Mock fetch for testing
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('NewsService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getLatestNews', () => {
    it('should fetch and return latest news', async () => {
      const mockNews = [
        {
          id: '1',
          title: 'Test News',
          original_title: 'Test News',
          summary: 'Test summary',
          url: 'https://example.com',
          source: 'Test Source',
          category: 'テスト',
          published_at: '2025-08-31T00:00:00Z',
          language: 'ja' as const,
          tags: ['test'],
          ai_confidence: 0.9,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNews,
      } as Response);

      const result = await NewsService.getLatestNews();
      
      expect(mockFetch).toHaveBeenCalledWith('/data/news/latest.json');
      expect(result).toEqual(mockNews);
    });

    it('should limit results when limit is specified', async () => {
      const mockNews = Array.from({ length: 30 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Test News ${i + 1}`,
        original_title: `Test News ${i + 1}`,
        summary: 'Test summary',
        url: 'https://example.com',
        source: 'Test Source',
        category: 'テスト',
        published_at: '2025-08-31T00:00:00Z',
        language: 'ja' as const,
        tags: ['test'],
        ai_confidence: 0.9,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNews,
      } as Response);

      const result = await NewsService.getLatestNews(10);
      
      expect(result).toHaveLength(10);
    });

    it('should throw DataLoadError when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(NewsService.getLatestNews()).rejects.toThrow(DataLoadError);
    });
  });

  describe('getDailyNews', () => {
    it('should fetch daily news for specified date', async () => {
      const mockNews = [
        {
          id: '1',
          title: 'Daily News',
          original_title: 'Daily News',
          summary: 'Daily summary',
          url: 'https://example.com',
          source: 'Test Source',
          category: 'テスト',
          published_at: '2025-08-31T00:00:00Z',
          language: 'ja' as const,
          tags: ['test'],
          ai_confidence: 0.9,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNews,
      } as Response);

      const result = await NewsService.getDailyNews('2025-08-31');
      
      expect(mockFetch).toHaveBeenCalledWith('/data/news/2025-08-31/articles.json');
      expect(result).toEqual(mockNews);
    });
  });

  describe('getDailySummary', () => {
    it('should fetch daily summary for specified date', async () => {
      const mockSummary = {
        date: '2025-08-31',
        total_articles: 10,
        top_trends: ['AI', 'ML'],
        significant_news: [],
        category_breakdown: { 'テスト': 10 },
        summary_ja: 'テストサマリー',
        summary_en: 'Test summary',
        generated_at: '2025-08-31T12:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary,
      } as Response);

      const result = await NewsService.getDailySummary('2025-08-31');
      
      expect(mockFetch).toHaveBeenCalledWith('/data/summaries/2025-08-31.json');
      expect(result).toEqual(mockSummary);
    });
  });

  describe('getNewsByCategory', () => {
    it('should filter news by category', async () => {
      const mockNews = [
        {
          id: '1',
          title: 'Reddit News',
          original_title: 'Reddit News',
          summary: 'Reddit summary',
          url: 'https://example.com',
          source: 'Reddit',
          category: 'Reddit',
          published_at: '2025-08-31T00:00:00Z',
          language: 'ja' as const,
          tags: ['test'],
          ai_confidence: 0.9,
        },
        {
          id: '2',
          title: 'Tech News',
          original_title: 'Tech News',
          summary: 'Tech summary',
          url: 'https://example.com',
          source: 'TechCrunch',
          category: '海外',
          published_at: '2025-08-31T00:00:00Z',
          language: 'ja' as const,
          tags: ['test'],
          ai_confidence: 0.9,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNews,
      } as Response);

      const result = await NewsService.getNewsByCategory('Reddit');
      
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('Reddit');
    });
  });

  describe('error handling', () => {
    it('should throw DataLoadError with correct message', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await NewsService.getLatestNews();
      } catch (error) {
        expect(error).toBeInstanceOf(DataLoadError);
        expect((error as DataLoadError).dataType).toBe('latest news');
        expect(error.message).toBe('Failed to load latest news');
      }
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect(NewsService.getDailyNews('2025-08-31')).rejects.toThrow(DataLoadError);
    });
  });
});