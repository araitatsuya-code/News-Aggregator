/**
 * Type definitions for the AI News Aggregator
 */

export interface NewsItem {
  id: string;
  title: string;
  original_title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  published_at: string;
  language: 'ja' | 'en';
  tags: string[];
  ai_confidence: number;
}

export interface DailySummary {
  date: string;
  total_articles: number;
  top_trends: string[];
  significant_news: NewsItem[];
  category_breakdown: Record<string, number>;
  summary_ja: string;
  summary_en: string;
  generated_at: string;
}

export interface RSSSource {
  url: string;
  category: string;
  language: 'ja' | 'en';
  name: string;
  enabled: boolean;
}

export interface DailyMetadata {
  total: number;
  categories: string[];
  sources: string[];
  date: string;
}