import { NewsItem, DailySummary } from '../types';
import { fetchWithOfflineSupport, OfflineManager } from '../utils/offlineManager';

/**
 * Error class for data loading failures
 */
export class DataLoadError extends Error {
  constructor(public dataType: string, public date?: string, public isOffline: boolean = false) {
    super(`Failed to load ${dataType}${date ? ` for ${date}` : ''}${isOffline ? ' (offline)' : ''}`);
    this.name = 'DataLoadError';
  }
}

/**
 * Service class for accessing static JSON data files with offline support
 */
export class NewsService {
  private static readonly BASE_PATH = '/data';

  /**
   * Fetch JSON data with error handling and offline support
   */
  private static async fetchJSON<T>(url: string, cacheKey?: string, dataType?: string): Promise<T> {
    try {
      // オフライン対応のfetchを使用
      if (cacheKey && dataType) {
        return await fetchWithOfflineSupport<T>(url, cacheKey, dataType);
      }

      // 通常のfetch（後方互換性のため）
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      
      // キャッシュに保存
      if (cacheKey && dataType) {
        OfflineManager.saveToOfflineCache(cacheKey, data, dataType);
      }
      
      return data;
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      
      // オフライン時のエラーかチェック
      const isOffline = OfflineManager.isOffline();
      if (isOffline && cacheKey) {
        const cachedData = OfflineManager.getFromOfflineCache<T>(cacheKey);
        if (cachedData) {
          return cachedData;
        }
      }
      
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
      const articles = await this.fetchJSON<NewsItem[]>(
        `${this.BASE_PATH}/news/latest.json`,
        'latest_news',
        'latest_news'
      );
      return articles.slice(0, limit);
    } catch (error) {
      const isOffline = OfflineManager.isOffline();
      throw new DataLoadError('latest news', undefined, isOffline);
    }
  }

  /**
   * Get news articles for a specific date
   * @param date Date in YYYY-MM-DD format
   * @returns Promise<NewsItem[]>
   */
  static async getDailyNews(date: string): Promise<NewsItem[]> {
    try {
      const articles = await this.fetchJSON<NewsItem[]>(
        `${this.BASE_PATH}/news/${date}/articles.json`,
        `daily_news_${date}`,
        'daily_news'
      );
      return articles;
    } catch (error) {
      const isOffline = OfflineManager.isOffline();
      throw new DataLoadError('daily news', date, isOffline);
    }
  }

  /**
   * Get daily summary for a specific date
   * @param date Date in YYYY-MM-DD format
   * @returns Promise<DailySummary>
   */
  static async getDailySummary(date: string): Promise<DailySummary> {
    try {
      const summary = await this.fetchJSON<DailySummary>(
        `${this.BASE_PATH}/summaries/${date}.json`,
        `daily_summary_${date}`,
        'daily_summary'
      );
      return summary;
    } catch (error) {
      const isOffline = OfflineManager.isOffline();
      throw new DataLoadError('daily summary', date, isOffline);
    }
  }

  /**
   * Get the latest daily summary
   * @returns Promise<DailySummary>
   */
  static async getLatestSummary(): Promise<DailySummary> {
    try {
      const summary = await this.fetchJSON<DailySummary>(
        `${this.BASE_PATH}/summaries/latest.json`,
        'latest_summary',
        'daily_summary'
      );
      return summary;
    } catch (error) {
      const isOffline = OfflineManager.isOffline();
      throw new DataLoadError('latest summary', undefined, isOffline);
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

  /**
   * Get available dates for summaries by checking the last 30 days
   * @returns Promise<string[]> Array of available dates in YYYY-MM-DD format
   */
  static async getAvailableSummaryDates(): Promise<string[]> {
    const availableDates: string[] = [];
    const today = new Date();
    
    // 過去30日間をチェック
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      try {
        // サマリーファイルが存在するかチェック
        await this.fetchJSON<DailySummary>(`${this.BASE_PATH}/summaries/${dateString}.json`);
        availableDates.push(dateString);
      } catch (error) {
        // ファイルが存在しない場合はスキップ
        continue;
      }
    }
    
    return availableDates;
  }

  /**
   * Get available dates for news by checking the last 30 days
   * @returns Promise<string[]> Array of available dates in YYYY-MM-DD format
   */
  static async getAvailableNewsDates(): Promise<string[]> {
    const availableDates: string[] = [];
    const today = new Date();
    
    // 過去30日間をチェック
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      try {
        // ニュースファイルが存在するかチェック
        await this.fetchJSON<NewsItem[]>(`${this.BASE_PATH}/news/${dateString}/articles.json`);
        availableDates.push(dateString);
      } catch (error) {
        // ファイルが存在しない場合はスキップ
        continue;
      }
    }
    
    return availableDates;
  }
}