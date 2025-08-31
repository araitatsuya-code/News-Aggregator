/**
 * オフライン対応とキャッシュ管理のユーティリティ
 */

export interface OfflineData {
  timestamp: number;
  data: any;
  type: string;
}

export class OfflineManager {
  private static readonly CACHE_PREFIX = 'ai_news_offline_';
  private static readonly MAX_CACHE_SIZE = 50; // 最大キャッシュ数
  private static readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24時間

  /**
   * データをオフラインキャッシュに保存
   */
  static saveToOfflineCache(key: string, data: any, type: string): void {
    try {
      const cacheKey = this.CACHE_PREFIX + key;
      const offlineData: OfflineData = {
        timestamp: Date.now(),
        data,
        type,
      };

      localStorage.setItem(cacheKey, JSON.stringify(offlineData));
      this.cleanupExpiredCache();
    } catch (error) {
      console.warn('Failed to save offline cache:', error);
    }
  }

  /**
   * オフラインキャッシュからデータを取得
   */
  static getFromOfflineCache<T>(key: string): T | null {
    try {
      const cacheKey = this.CACHE_PREFIX + key;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const offlineData: OfflineData = JSON.parse(cached);
        
        // 期限切れチェック
        if (Date.now() - offlineData.timestamp < this.CACHE_EXPIRY) {
          return offlineData.data;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.warn('Failed to read offline cache:', error);
    }
    
    return null;
  }

  /**
   * 期限切れのキャッシュをクリーンアップ
   */
  static cleanupExpiredCache(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.CACHE_PREFIX)
      );

      const validCaches: Array<{ key: string; timestamp: number }> = [];

      keys.forEach(key => {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const offlineData: OfflineData = JSON.parse(cached);
            
            if (Date.now() - offlineData.timestamp < this.CACHE_EXPIRY) {
              validCaches.push({ key, timestamp: offlineData.timestamp });
            } else {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // 破損したキャッシュを削除
          localStorage.removeItem(key);
        }
      });

      // キャッシュサイズ制限
      if (validCaches.length > this.MAX_CACHE_SIZE) {
        validCaches
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, validCaches.length - this.MAX_CACHE_SIZE)
          .forEach(cache => localStorage.removeItem(cache.key));
      }
    } catch (error) {
      console.warn('Failed to cleanup cache:', error);
    }
  }

  /**
   * 全てのオフラインキャッシュをクリア
   */
  static clearAllOfflineCache(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.CACHE_PREFIX)
      );
      
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear offline cache:', error);
    }
  }

  /**
   * オフライン状態かどうかを判定
   */
  static isOffline(): boolean {
    return !navigator.onLine;
  }

  /**
   * ネットワーク接続をテスト
   */
  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors',
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * オフライン時のフォールバックデータを取得
   */
  static getOfflineFallbackData(dataType: string): any {
    const fallbackData = {
      'latest_news': [
        {
          id: 'offline_1',
          title: 'オフライン時のサンプルニュース',
          summary: 'インターネット接続が復旧したら最新のニュースが表示されます。',
          url: '#',
          source: 'オフライン',
          category: 'システム',
          published_at: new Date().toISOString(),
          language: 'ja',
          tags: ['オフライン'],
          ai_confidence: 0.0,
          original_title: 'Offline Sample News'
        }
      ],
      'daily_summary': {
        date: new Date().toISOString().split('T')[0],
        total_articles: 0,
        top_trends: ['オフライン状態'],
        significant_news: [],
        category_breakdown: { 'システム': 1 },
        summary_ja: 'オフライン状態のため、最新のサマリーを表示できません。',
        summary_en: 'Cannot display latest summary due to offline status.',
        generated_at: new Date().toISOString()
      }
    };

    return fallbackData[dataType as keyof typeof fallbackData] || null;
  }

  /**
   * キャッシュ統計を取得
   */
  static getCacheStats(): {
    totalItems: number;
    totalSize: number;
    oldestItem: Date | null;
    newestItem: Date | null;
  } {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(this.CACHE_PREFIX)
    );

    let totalSize = 0;
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;

    keys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          totalSize += cached.length;
          const offlineData: OfflineData = JSON.parse(cached);
          oldestTimestamp = Math.min(oldestTimestamp, offlineData.timestamp);
          newestTimestamp = Math.max(newestTimestamp, offlineData.timestamp);
        }
      } catch (error) {
        // 破損したキャッシュは無視
      }
    });

    return {
      totalItems: keys.length,
      totalSize,
      oldestItem: oldestTimestamp === Infinity ? null : new Date(oldestTimestamp),
      newestItem: newestTimestamp === 0 ? null : new Date(newestTimestamp),
    };
  }
}

/**
 * オフライン対応のfetch関数
 */
export async function fetchWithOfflineSupport<T>(
  url: string,
  cacheKey: string,
  dataType: string
): Promise<T> {
  try {
    // オンライン時は通常のfetch
    if (!OfflineManager.isOffline()) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      
      // 成功時はキャッシュに保存
      OfflineManager.saveToOfflineCache(cacheKey, data, dataType);
      return data;
    }
  } catch (error) {
    console.warn(`Fetch failed for ${url}:`, error);
  }

  // オフライン時またはfetch失敗時はキャッシュから取得
  const cachedData = OfflineManager.getFromOfflineCache<T>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // キャッシュもない場合はフォールバックデータ
  const fallbackData = OfflineManager.getOfflineFallbackData(dataType);
  if (fallbackData) {
    return fallbackData;
  }

  throw new Error(`No data available for ${dataType} in offline mode`);
}