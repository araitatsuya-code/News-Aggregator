/**
 * SEOユーティリティのテスト
 */

import {
  getDefaultSEOMetadata,
  getNewsListSEOMetadata,
  getDailySummarySEOMetadata,
  generateNewsArticleJsonLd,
  generateWebsiteJsonLd
} from '../seo';
import { NewsItem, DailySummary } from '../../types';

// モックデータ
const mockNewsItem: NewsItem = {
  id: 'test-1',
  title: 'テストニュース',
  original_title: 'Test News',
  summary: 'これはテスト用のニュース要約です。',
  url: 'https://example.com/news/1',
  source: 'Test Source',
  category: '国内',
  published_at: new Date('2025-08-31T10:00:00Z'),
  language: 'ja',
  tags: ['AI', 'テスト'],
  ai_confidence: 0.95
};

const mockDailySummary: DailySummary = {
  date: '2025-08-31',
  total_articles: 10,
  top_trends: ['AI', '機械学習', 'ChatGPT'],
  significant_news: [mockNewsItem],
  category_breakdown: { '国内': 5, '海外': 3, 'Reddit': 2 },
  summary_ja: '今日のAI関連ニュースのまとめです。',
  summary_en: 'Summary of today\'s AI-related news.',
  generated_at: new Date('2025-08-31T12:00:00Z')
};

describe('SEO Utils', () => {
  describe('getDefaultSEOMetadata', () => {
    it('日本語のデフォルトメタデータを生成する', () => {
      const metadata = getDefaultSEOMetadata('ja');
      
      expect(metadata.title).toContain('AIニュースまとめ');
      expect(metadata.description).toContain('AI・機械学習');
      expect(metadata.keywords).toContain('AI');
      expect(metadata.keywords).toContain('人工知能');
      expect(metadata.twitterCard).toBe('summary_large_image');
    });

    it('英語のデフォルトメタデータを生成する', () => {
      const metadata = getDefaultSEOMetadata('en');
      
      expect(metadata.title).toContain('AI News Aggregator');
      expect(metadata.description).toContain('machine learning');
      expect(metadata.keywords).toContain('AI');
      expect(metadata.keywords).toContain('artificial intelligence');
    });
  });

  describe('getNewsListSEOMetadata', () => {
    it('ニュース一覧のメタデータを生成する', () => {
      const articles = [mockNewsItem];
      const metadata = getNewsListSEOMetadata(articles, undefined, 'ja');
      
      expect(metadata.title).toContain('AIニュース一覧');
      expect(metadata.description).toContain('1件');
      expect(metadata.ogTitle).toContain('AIニュース一覧');
    });

    it('カテゴリ付きニュース一覧のメタデータを生成する', () => {
      const articles = [mockNewsItem];
      const metadata = getNewsListSEOMetadata(articles, '国内', 'ja');
      
      expect(metadata.title).toContain('国内カテゴリの');
      expect(metadata.keywords).toContain('国内');
    });
  });

  describe('getDailySummarySEOMetadata', () => {
    it('日次サマリーのメタデータを生成する', () => {
      const metadata = getDailySummarySEOMetadata(mockDailySummary, 'ja');
      
      expect(metadata.title).toContain('2025年8月31日');
      expect(metadata.title).toContain('AIニュースまとめ');
      expect(metadata.description).toContain('10件');
      expect(metadata.description).toContain('AI');
      expect(metadata.keywords).toContain('AI');
      expect(metadata.keywords).toContain('機械学習');
    });
  });

  describe('generateNewsArticleJsonLd', () => {
    it('ニュース記事の構造化データを生成する', () => {
      const jsonLd = generateNewsArticleJsonLd(mockNewsItem);
      
      expect(jsonLd).toHaveProperty('@context', 'https://schema.org');
      expect(jsonLd).toHaveProperty('@type', 'NewsArticle');
      expect(jsonLd).toHaveProperty('headline', mockNewsItem.title);
      expect(jsonLd).toHaveProperty('description', mockNewsItem.summary);
      expect(jsonLd).toHaveProperty('url', mockNewsItem.url);
      expect(jsonLd).toHaveProperty('datePublished', mockNewsItem.published_at);
      expect(jsonLd).toHaveProperty('articleSection', mockNewsItem.category);
      expect(jsonLd).toHaveProperty('keywords', 'AI, テスト');
      expect(jsonLd).toHaveProperty('inLanguage', mockNewsItem.language);
    });
  });

  describe('generateWebsiteJsonLd', () => {
    it('ウェブサイトの構造化データを生成する', () => {
      const jsonLd = generateWebsiteJsonLd('ja');
      
      expect(jsonLd).toHaveProperty('@context', 'https://schema.org');
      expect(jsonLd).toHaveProperty('@type', 'WebSite');
      expect(jsonLd).toHaveProperty('name', 'AIニュースまとめ');
      expect(jsonLd).toHaveProperty('description');
      expect(jsonLd).toHaveProperty('url');
      expect(jsonLd).toHaveProperty('potentialAction');
    });

    it('英語版のウェブサイト構造化データを生成する', () => {
      const jsonLd = generateWebsiteJsonLd('en');
      
      expect(jsonLd).toHaveProperty('name', 'AI News Aggregator');
    });
  });
});