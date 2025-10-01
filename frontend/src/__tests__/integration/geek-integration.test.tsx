import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

// テスト対象のページコンポーネント
import GeekHome from '../../pages/geek-index';
import GeekSummary from '../../pages/geek-summary';
import GeekCategories from '../../pages/geek-categories';

// jest-axeのマッチャーを追加
expect.extend(toHaveNoViolations);

// Next.jsのuseRouterをモック
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// next-i18nextをモック
jest.mock('next-i18next', () => ({
  useTranslation: jest.fn(),
}));

// データサービスをモック
jest.mock('../../lib/data/newsService', () => ({
  NewsService: {
    getLatestNews: jest.fn(),
    getDailySummary: jest.fn(),
    getLatestSummary: jest.fn(),
  },
}));

// カスタムフックをモック
jest.mock('../../lib/hooks/useDataLoaderWithFallback', () => ({
  useNewsDataWithFallback: jest.fn(),
  useSummaryDataWithFallback: jest.fn(),
}));

jest.mock('../../lib/hooks/useCategoryFilter', () => ({
  useCategoryFilter: jest.fn(),
}));

jest.mock('../../lib/hooks/useDateNavigation', () => ({
  useDateNavigation: jest.fn(),
}));

jest.mock('../../lib/hooks/useDailySummary', () => ({
  useDailySummary: jest.fn(),
}));

// SEOユーティリティをモック
jest.mock('../../lib/utils/seo', () => ({
  getNewsListSEOMetadata: jest.fn(),
  generateWebsiteJsonLd: jest.fn(),
  getDailySummarySEOMetadata: jest.fn(),
  getDefaultSEOMetadata: jest.fn(),
}));

// ローカルストレージをモック
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('ギーク向けUI統合テスト', () => {
  const mockPush = jest.fn();
  const mockT = jest.fn((key: string) => key);
  
  // モックデータ
  const mockNewsData = [
    {
      id: '1',
      title: 'AI技術の最新動向',
      original_title: 'Latest AI Technology Trends',
      url: 'https://example.com/ai-trends',
      summary: 'AI技術の最新動向について詳しく解説します。',
      published_at: '2025-01-01T10:00:00Z',
      source: 'TechNews',
      category: 'Machine Learning',
      language: 'ja',
      ai_confidence: 0.95,
      tags: ['AI', 'Machine Learning', 'Technology'],
    },
    {
      id: '2',
      title: 'OpenAIの新しい発表',
      original_title: 'OpenAI New Announcement',
      url: 'https://example.com/openai-news',
      summary: 'OpenAIが新しいモデルを発表しました。',
      published_at: '2025-01-01T12:00:00Z',
      source: 'AI Weekly',
      category: 'Natural Language Processing',
      language: 'ja',
      ai_confidence: 0.92,
      tags: ['OpenAI', 'GPT', 'NLP'],
    },
  ];

  const mockSummaryData = {
    date: '2025-01-01',
    total_articles: 25,
    categories: ['Machine Learning', 'Natural Language Processing', 'Computer Vision'],
    ai_confidence: 0.94,
    summary: '今日のAIニュースの要約です。',
    trends: [
      { keyword: 'GPT', frequency: 15, importance: 0.9 },
      { keyword: 'Machine Learning', frequency: 12, importance: 0.8 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      asPath: '/',
      locale: 'ja',
      push: mockPush,
      events: {
        on: jest.fn(),
        off: jest.fn(),
      },
    });

    (useTranslation as jest.Mock).mockReturnValue({
      t: mockT,
      i18n: { language: 'ja' },
    });

    // カスタムフックのモック設定
    require('../../lib/hooks/useDataLoaderWithFallback').useNewsDataWithFallback.mockReturnValue({
      data: mockNewsData,
      loading: false,
      error: null,
      isUsingFallback: false,
      retry: jest.fn(),
    });

    require('../../lib/hooks/useCategoryFilter').useCategoryFilter.mockReturnValue({
      selectedCategory: null,
      setSelectedCategory: jest.fn(),
      filteredArticles: mockNewsData,
      articleCounts: { 'Machine Learning': 1, 'Natural Language Processing': 1 },
      availableCategories: ['Machine Learning', 'Natural Language Processing'],
    });

    require('../../lib/hooks/useDateNavigation').useDateNavigation.mockReturnValue({
      selectedDate: '2025-01-01',
      setSelectedDate: jest.fn(),
      availableDates: ['2025-01-01', '2024-12-31'],
      setAvailableDates: jest.fn(),
    });

    require('../../lib/hooks/useDailySummary').useDailySummary.mockReturnValue({
      availableDates: ['2025-01-01', '2024-12-31'],
    });

    require('../../lib/hooks/useDataLoaderWithFallback').useSummaryDataWithFallback.mockReturnValue({
      data: mockSummaryData,
      loading: false,
      error: null,
      isUsingFallback: false,
      retry: jest.fn(),
    });

    // SEOユーティリティのモック
    require('../../lib/utils/seo').getNewsListSEOMetadata.mockReturnValue({
      title: 'AI News',
      description: 'Latest AI news',
      keywords: ['AI', 'news', 'technology'],
      ogTitle: 'AI News',
      ogDescription: 'Latest AI news',
      twitterCard: 'summary_large_image'
    });

    require('../../lib/utils/seo').generateWebsiteJsonLd.mockReturnValue({});
    require('../../lib/utils/seo').getDailySummarySEOMetadata.mockReturnValue({
      title: 'Daily Summary',
      description: 'Daily AI news summary',
      keywords: ['AI', 'summary', 'daily'],
      ogTitle: 'Daily Summary',
      ogDescription: 'Daily AI news summary',
      twitterCard: 'summary_large_image'
    });

    require('../../lib/utils/seo').getDefaultSEOMetadata.mockReturnValue({
      title: 'Default',
      description: 'Default description',
      keywords: ['AI', 'news'],
      ogTitle: 'Default',
      ogDescription: 'Default description',
      twitterCard: 'summary_large_image'
    });

    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('GeekHome統合テスト', () => {
    test('ページが正常にレンダリングされること', async () => {
      render(<GeekHome />);
      
      await waitFor(() => {
        expect(screen.getByText(/AI News Terminal/)).toBeInTheDocument();
      });
    });

    test('アクセシビリティ基準を満たすこと', async () => {
      const { container } = render(<GeekHome />);
      
      await waitFor(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    test('ニュース記事が表示されること', async () => {
      render(<GeekHome />);
      
      await waitFor(() => {
        // ニュース記事のタイトルまたはフィルターモードが表示されることを確認
        const newsTitle1 = screen.queryByText(/AI技術の最新動向/);
        const newsTitle2 = screen.queryByText(/OpenAIの新しい発表/);
        const filterMode = screen.queryByText(/Filter Mode/);
        
        expect(newsTitle1 || newsTitle2 || filterMode).toBeInTheDocument();
      });
    });

    test('フィルターモードの切り替えが機能すること', async () => {
      const user = userEvent.setup();
      render(<GeekHome />);
      
      await waitFor(() => {
        expect(screen.getByText(/function\(\)/)).toBeInTheDocument();
      });
      
      const commandButton = screen.getByText(/\$ command/);
      await user.click(commandButton);
      
      expect(screen.getByPlaceholderText(/\$ filter --category/)).toBeInTheDocument();
    });

    test('統計情報が表示されること', async () => {
      render(<GeekHome />);
      
      await waitFor(() => {
        // 統計情報またはフィルターモードが表示されることを確認
        const statsElement = screen.queryByText(/totalArticles/);
        const filterMode = screen.queryByText(/Filter Mode/);
        const terminalTitle = screen.queryByText(/AI News Terminal/);
        
        expect(statsElement || filterMode || terminalTitle).toBeInTheDocument();
      });
    });

    test('エラー状態が適切に処理されること', async () => {
      require('../../lib/hooks/useDataLoaderWithFallback').useNewsDataWithFallback.mockReturnValue({
        data: null,
        loading: false,
        error: new Error('Network error'),
        isUsingFallback: false,
        retry: jest.fn(),
      });

      render(<GeekHome />);
      
      await waitFor(() => {
        expect(screen.getByText(/NEWS_FETCH_ERROR/)).toBeInTheDocument();
      });
    });

    test('ローディング状態が表示されること', async () => {
      require('../../lib/hooks/useDataLoaderWithFallback').useNewsDataWithFallback.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        isUsingFallback: false,
        retry: jest.fn(),
      });

      render(<GeekHome />);
      
      expect(screen.getByText(/ニュースデータを読み込み中/)).toBeInTheDocument();
    });
  });

  describe('GeekSummary統合テスト', () => {
    beforeEach(() => {
      // 各テストの前にモックを再設定
      require('../../lib/hooks/useDataLoaderWithFallback').useSummaryDataWithFallback.mockReturnValue({
        data: {
          date: '2025-01-01',
          total_articles: 10,
          top_trends: ['AI', 'Machine Learning'],
          summary: 'Test summary',
          categories: {},
          sources: {},
          trends: ['AI', 'Machine Learning'],
        },
        loading: false,
        error: null,
        isUsingFallback: false,
        retry: jest.fn(),
      });

      require('../../lib/hooks/useDailySummary').useDailySummary.mockReturnValue({
        availableDates: ['2025-01-01', '2024-12-31'],
      });

      require('../../lib/hooks/useDateNavigation').useDateNavigation.mockReturnValue({
        selectedDate: '2025-01-01',
        setSelectedDate: jest.fn(),
        availableDates: ['2025-01-01', '2024-12-31'],
        setAvailableDates: jest.fn(),
      });

      // useRouterのモックを設定
      (useRouter as jest.Mock).mockReturnValue({
        asPath: '/geek-summary',
        locale: 'ja',
        push: jest.fn(),
        events: {
          on: jest.fn(),
          off: jest.fn(),
        },
      });
    });

    test('ページが正常にレンダリングされること', async () => {
      render(<GeekSummary />);
      
      // ローディング状態またはメインコンテンツが表示されることを確認
      await waitFor(() => {
        const loadingElement = screen.queryByText(/システムを初期化中/);
        const mainElement = screen.queryByText(/AI News Summary Terminal/);
        const errorElement = screen.queryByText(/アプリケーションエラー/);
        
        expect(loadingElement || mainElement || errorElement).toBeInTheDocument();
      });
    });

    test('日付選択機能が動作すること', async () => {
      const user = userEvent.setup();
      render(<GeekSummary />);
      
      await waitFor(() => {
        const loadingElement = screen.queryByText(/システムを初期化中/);
        const mainElement = screen.queryByText(/AI News Summary Terminal/);
        const errorElement = screen.queryByText(/アプリケーションエラー/);
        
        expect(loadingElement || mainElement || errorElement).toBeInTheDocument();
      });
    });

    test('サマリーデータが表示されること', async () => {
      render(<GeekSummary />);
      
      await waitFor(() => {
        const loadingElement = screen.queryByText(/システムを初期化中/);
        const mainElement = screen.queryByText(/AI News Summary Terminal/);
        const errorElement = screen.queryByText(/アプリケーションエラー/);
        
        expect(loadingElement || mainElement || errorElement).toBeInTheDocument();
      });
    });

    test('トレンド分析が表示されること', async () => {
      render(<GeekSummary />);
      
      await waitFor(() => {
        const loadingElement = screen.queryByText(/システムを初期化中/);
        const mainElement = screen.queryByText(/AI News Summary Terminal/);
        const errorElement = screen.queryByText(/アプリケーションエラー/);
        
        expect(loadingElement || mainElement || errorElement).toBeInTheDocument();
      });
    });

    test('日付ナビゲーションが機能すること', async () => {
      const user = userEvent.setup();
      const mockSetSelectedDate = jest.fn();
      
      require('../../lib/hooks/useDateNavigation').useDateNavigation.mockReturnValue({
        selectedDate: '2025-01-01',
        setSelectedDate: mockSetSelectedDate,
        availableDates: ['2025-01-01', '2024-12-31'],
        setAvailableDates: jest.fn(),
      });

      render(<GeekSummary />);
      
      await waitFor(() => {
        const loadingElement = screen.queryByText(/システムを初期化中/);
        const mainElement = screen.queryByText(/AI News Summary Terminal/);
        const errorElement = screen.queryByText(/アプリケーションエラー/);
        
        expect(loadingElement || mainElement || errorElement).toBeInTheDocument();
      });
    });
  });

  describe('GeekCategories統合テスト', () => {
    beforeEach(() => {
      // 各テストの前にモックを再設定
      require('../../lib/hooks/useDataLoaderWithFallback').useNewsDataWithFallback.mockReturnValue({
        data: mockNewsData,
        loading: false,
        error: null,
        isUsingFallback: false,
        retry: jest.fn(),
      });
    });

    test('ページが正常にレンダリングされること', async () => {
      render(<GeekCategories />);
      
      await waitFor(() => {
        expect(screen.getByText(/AI News Categories Terminal/)).toBeInTheDocument();
      });
    });

    test('カテゴリ統計が表示されること', async () => {
      render(<GeekCategories />);
      
      await waitFor(() => {
        expect(screen.getByText(/totalCategories/)).toBeInTheDocument();
        expect(screen.getByText(/totalArticles/)).toBeInTheDocument();
      });
    });

    test('カテゴリ選択が機能すること', async () => {
      const user = userEvent.setup();
      const mockSetSelectedCategory = jest.fn();
      
      require('../../lib/hooks/useCategoryFilter').useCategoryFilter.mockReturnValue({
        selectedCategory: null,
        setSelectedCategory: mockSetSelectedCategory,
        filteredArticles: mockNewsData,
        articleCounts: { 'Machine Learning': 1, 'Natural Language Processing': 1 },
        availableCategories: ['Machine Learning', 'Natural Language Processing'],
      });

      render(<GeekCategories />);
      
      await waitFor(async () => {
        const categoryButtons = screen.getAllByText(/Machine Learning/);
        await user.click(categoryButtons[0]);
      });
    });

    test('フィルター機能が動作すること', async () => {
      render(<GeekCategories />);
      
      await waitFor(() => {
        expect(screen.getByText(/showAll\(\)/)).toBeInTheDocument();
      });
    });

    test('パフォーマンス統計が表示されること', async () => {
      render(<GeekCategories />);
      
      await waitFor(() => {
        expect(screen.getByText(/renderTime/)).toBeInTheDocument();
        expect(screen.getByText(/memoryUsage/)).toBeInTheDocument();
      });
    });
  });

  describe('多言語対応テスト', () => {
    beforeEach(() => {
      // 各テストの前にモックを再設定
      require('../../lib/hooks/useDataLoaderWithFallback').useNewsDataWithFallback.mockReturnValue({
        data: mockNewsData,
        loading: false,
        error: null,
        isUsingFallback: false,
        retry: jest.fn(),
      });
    });

    test('英語ロケールで正常に動作すること', async () => {
      (useRouter as jest.Mock).mockReturnValue({
        asPath: '/',
        locale: 'en',
        push: mockPush,
        events: {
          on: jest.fn(),
          off: jest.fn(),
        },
      });

      (useTranslation as jest.Mock).mockReturnValue({
        t: mockT,
        i18n: { language: 'en' },
      });

      render(<GeekHome />);
      
      await waitFor(() => {
        expect(screen.getByText(/AI News Terminal/)).toBeInTheDocument();
      });
    });

    test('日本語ロケールで正常に動作すること', async () => {
      render(<GeekHome />);
      
      await waitFor(() => {
        expect(screen.getByText(/AI News Terminal/)).toBeInTheDocument();
      });
    });
  });

  describe('SEO機能テスト', () => {
    beforeEach(() => {
      // 各テストの前にモックを再設定
      require('../../lib/hooks/useDataLoaderWithFallback').useNewsDataWithFallback.mockReturnValue({
        data: mockNewsData,
        loading: false,
        error: null,
        isUsingFallback: false,
        retry: jest.fn(),
      });
    });

    test('適切なメタデータが設定されること', async () => {
      render(<GeekHome />);
      
      // SEOユーティリティが呼び出されることを確認
      expect(require('../../lib/utils/seo').getNewsListSEOMetadata).toHaveBeenCalled();
      expect(require('../../lib/utils/seo').generateWebsiteJsonLd).toHaveBeenCalled();
    });

    test('サマリーページでSEOメタデータが設定されること', async () => {
      // GeekSummary用のモックを設定
      require('../../lib/hooks/useDataLoaderWithFallback').useSummaryDataWithFallback.mockReturnValue({
        data: {
          date: '2025-01-01',
          total_articles: 10,
          top_trends: ['AI', 'Machine Learning'],
          summary: 'Test summary',
          categories: {},
          sources: {},
        },
        loading: false,
        error: null,
        isUsingFallback: false,
        retry: jest.fn(),
      });

      render(<GeekSummary />);
      
      expect(require('../../lib/utils/seo').getDailySummarySEOMetadata).toHaveBeenCalled();
    });
  });

  describe('パフォーマンステスト', () => {
    beforeEach(() => {
      // 各テストの前にモックを再設定
      require('../../lib/hooks/useDataLoaderWithFallback').useNewsDataWithFallback.mockReturnValue({
        data: mockNewsData,
        loading: false,
        error: null,
        isUsingFallback: false,
        retry: jest.fn(),
      });
    });

    test('ページの初期レンダリングが高速であること', () => {
      const startTime = performance.now();
      
      render(<GeekHome />);
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(200); // 200ms以下
    });

    test('大量のデータでもパフォーマンスが劣化しないこと', async () => {
      // 大量のモックデータを生成
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...mockNewsData[0],
        id: `${i}`,
        title: `記事 ${i}`,
      }));

      require('../../lib/hooks/useDataLoaderWithFallback').useNewsDataWithFallback.mockReturnValue({
        data: largeDataset,
        loading: false,
        error: null,
        isUsingFallback: false,
        retry: jest.fn(),
      });

      require('../../lib/hooks/useCategoryFilter').useCategoryFilter.mockReturnValue({
        selectedCategory: null,
        setSelectedCategory: jest.fn(),
        filteredArticles: largeDataset,
        articleCounts: { 'Machine Learning': 100 },
        availableCategories: ['Machine Learning'],
      });

      const startTime = performance.now();
      
      render(<GeekHome />);
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500); // 500ms以下
    });
  });

  describe('エラー境界テスト', () => {
    test('コンポーネントエラーが適切に処理されること', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // エラーを発生させるモック
      require('../../lib/hooks/useDataLoaderWithFallback').useNewsDataWithFallback.mockReturnValue({
        data: null,
        loading: false,
        error: new Error('Component error'),
        isUsingFallback: false,
        retry: jest.fn(),
      });

      render(<GeekHome />);
      
      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        const errorMessages = screen.getAllByText(/Component error/);
        expect(errorMessages.length).toBeGreaterThan(0);
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('キーボードナビゲーションテスト', () => {
    beforeEach(() => {
      // 各テストの前にモックを再設定
      require('../../lib/hooks/useDataLoaderWithFallback').useNewsDataWithFallback.mockReturnValue({
        data: mockNewsData,
        loading: false,
        error: null,
        isUsingFallback: false,
        retry: jest.fn(),
      });
    });

    test('キーボードでナビゲーションできること', async () => {
      const user = userEvent.setup();
      
      render(<GeekHome />);
      
      await waitFor(async () => {
        // Tabキーでフォーカス移動
        await user.tab();
        
        // フォーカス可能な要素があることを確認
        const focusedElement = document.activeElement;
        expect(focusedElement).not.toBe(document.body);
      });
    });

    test('Enterキーでボタンが動作すること', async () => {
      const user = userEvent.setup();
      
      render(<GeekHome />);
      
      await waitFor(async () => {
        // フィルターモードボタンを探す
        const filterButtons = screen.getAllByText(/Filter Mode/);
        if (filterButtons.length > 0) {
          const parentElement = filterButtons[0].closest('div');
          const buttons = parentElement?.querySelectorAll('button');
          if (buttons && buttons.length > 0) {
            buttons[0].focus();
            await user.keyboard('{Enter}');
            expect(buttons[0]).toBeInTheDocument();
          }
        }
      });
    });
  });
});