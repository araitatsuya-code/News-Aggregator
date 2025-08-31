import { NewsItem, DailySummary } from '../types';

/**
 * Error class for data loading failures
 */
export class DataLoadError extends Error {
  constructor(public dataType: string, public date?: string) {
    super(`Failed to load ${dataType}${date ? ` for ${date}` : ''}`);
    this.name = 'DataLoadError';
  }
}

/**
 * Service class for accessing static JSON data files
 */
export class NewsService {
  private static readonly BASE_PATH = '/data';

  /**
   * Fetch JSON data with error handling
   */
  private static async fetchJSON<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      throw error;
    }
  }

  /**
   * Get the latest news articles (up to specified limit)
   * @param limit Maximum number of articles to return (default: 20)
   * @returns Promise<NewsItem[]>
   */
  static async getLatestNews(limit: number = 20): Promise<NewsItem[]> {
    try {
      const articles = await this.fetchJSON<NewsItem[]>(`${this.BASE_PATH}/news/latest.json`);
      return articles.slice(0, limit);
    } catch (error) {
      throw new DataLoadError('latest news', undefined);
    }
  }

  /**
   * Get news articles for a specific date
   * @param date Date in YYYY-MM-DD format
   * @returns Promise<NewsItem[]>
   */
  static async getDailyNews(date: string): Promise<NewsItem[]> {
    try {
      const articles = await this.fetchJSON<NewsItem[]>(`${this.BASE_PATH}/news/${date}/articles.json`);
      return articles;
    } catch (error) {
      throw new DataLoadError('daily news', date);
    }
  }

  /**
   * Get daily summary for a specific date
   * @param date Date in YYYY-MM-DD format
   * @returns Promise<DailySummary>
   */
  static async getDailySummary(date: string): Promise<DailySummary> {
    try {
      const summary = await this.fetchJSON<DailySummary>(`${this.BASE_PATH}/summaries/${date}.json`);
      return summary;
    } catch (error) {
      throw new DataLoadError('daily summary', date);
    }
  }

  /**
   * Get the latest daily summary
   * @returns Promise<DailySummary>
   */
  static async getLatestSummary(): Promise<DailySummary> {
    try {
      const summary = await this.fetchJSON<DailySummary>(`${this.BASE_PATH}/summaries/latest.json`);
      return summary;
    } catch (error) {
      throw new DataLoadError('latest summary', undefined);
    }
  }

  /**
   * Get news articles filtered by category
   * @param category Category to filter by
   * @returns Promise<NewsItem[]>
   */
  static async getNewsByCategory(category: string): Promise<NewsItem[]> {
    try {
      const articles = await this.getLatestNews();
      return articles.filter(article => article.category === category);
    } catch (error) {
      throw new DataLoadError('news by category', category);
    }
  }

  /**
   * Get available categories
   * @returns Promise<string[]>
   */
  static async getCategories(): Promise<string[]> {
    try {
      const categories = await this.fetchJSON<string[]>(`${this.BASE_PATH}/config/categories.json`);
      return categories;
    } catch (error) {
      throw new DataLoadError('categories', undefined);
    }
  }

  /**
   * Get available news sources
   * @returns Promise<any[]>
   */
  static async getSources(): Promise<any[]> {
    try {
      const sources = await this.fetchJSON<any[]>(`${this.BASE_PATH}/config/sources.json`);
      return sources;
    } catch (error) {
      throw new DataLoadError('sources', undefined);
    }
  }

  /**
   * Get metadata for a specific date
   * @param date Date in YYYY-MM-DD format
   * @returns Promise<any>
   */
  static async getDailyMetadata(date: string): Promise<any> {
    try {
      const metadata = await this.fetchJSON<any>(`${this.BASE_PATH}/news/${date}/metadata.json`);
      return metadata;
    } catch (error) {
      throw new DataLoadError('daily metadata', date);
    }
  }
}