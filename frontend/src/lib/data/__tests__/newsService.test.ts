/**
 * @jest-environment jsdom
 */
import { NewsService, DataLoadError } from '../newsService';
import { NewsItem, DailySummary } from '../../types';

// fetchのモック
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// localStorageのモック
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('NewsService', () => {
    beforeEach(() => {
        mockFetch.mockClear();
        localStorageMock.getItem.mockClear();
        localStorageMock.setItem.mockClear();
        localStorageMock.removeItem.mockClear();
        // オンライン状態にリセット
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true,
        });
    });

    describe('getLatestNews', () => {
        it('should fetch and return latest news when online', async () => {
            const mockNews: NewsItem[] = [
                {
                    id: '1',
                    title: 'Test News 1',
                    original_title: 'Test News 1',
                    summary: 'Test summary 1',
                    url: 'https://example.com/1',
                    source: 'Test Source',
                    category: 'AI',
                    published_at: '2025-08-31T10:00:00Z',
                    language: 'ja',
                    tags: ['test'],
                    ai_confidence: 0.9
                }
            ];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockNews,
            } as Response);

            const result = await NewsService.getLatestNews();

            expect(result).toEqual(mockNews);
        });

        it('should return fallback data when offline', async () => {
            // オフライン状態に設定
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false,
            });

            // キャッシュなし
            localStorageMock.getItem.mockReturnValue(null);

            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await NewsService.getLatestNews();

            // フォールバックデータが返されることを確認
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });

        it('should use cached data when available', async () => {
            const cachedData = [
                {
                    id: 'cached_1',
                    title: 'Cached News',
                    original_title: 'Cached News',
                    summary: 'Cached summary',
                    url: 'https://example.com/cached',
                    source: 'Cache',
                    category: 'AI',
                    published_at: '2025-08-31T10:00:00Z',
                    language: 'ja',
                    tags: ['cached'],
                    ai_confidence: 0.9
                }
            ];

            // キャッシュデータを設定（有効期限内）
            localStorageMock.getItem.mockReturnValue(JSON.stringify({
                data: cachedData,
                timestamp: Date.now(),
            }));

            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await NewsService.getLatestNews();
            expect(result).toEqual(cachedData);
        });
    });

    describe('error handling', () => {
        it('should handle network errors gracefully', async () => {
            // オフライン状態に設定
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false,
            });

            // キャッシュなし
            localStorageMock.getItem.mockReturnValue(null);

            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await NewsService.getLatestNews();

            // フォールバックデータが返されることを確認
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });

        it('should throw DataLoadError for unsupported data types', async () => {
            // オフライン状態に設定
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false,
            });

            // キャッシュなし
            localStorageMock.getItem.mockReturnValue(null);

            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(NewsService.getDailyNews('2025-08-31')).rejects.toThrow(DataLoadError);
        });
    });

    describe('offline functionality', () => {
        it('should provide fallback data for latest news', async () => {
            // オフライン状態に設定
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false,
            });

            // キャッシュなし
            localStorageMock.getItem.mockReturnValue(null);

            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await NewsService.getLatestNews();

            expect(result).toBeDefined();
            expect(result[0].title).toBe('オフライン時のサンプルニュース');
        });

        it('should provide fallback data for daily summary', async () => {
            // オフライン状態に設定
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false,
            });

            // キャッシュなし
            localStorageMock.getItem.mockReturnValue(null);

            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await NewsService.getLatestSummary();

            expect(result).toBeDefined();
            expect(result.summary_ja).toBe('オフライン状態のため、最新のサマリーを表示できません。');
        });
    });
});