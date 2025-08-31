import { useState, useEffect, useCallback, useRef } from 'react';
import { DataLoadError } from '../data/newsService';

interface UseDataLoaderWithFallbackState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
  retryCount: number;
}

interface UseDataLoaderWithFallbackOptions<T> {
  fallbackData?: T;
  maxRetries?: number;
  retryDelay?: number;
  enableCache?: boolean;
  cacheKey?: string;
  cacheTTL?: number; // キャッシュの有効期限（ミリ秒）
}

/**
 * フォールバック機能付きデータローダーフック
 * エラー時の自動リトライ、キャッシュ、フォールバックデータの提供を行う
 */
export function useDataLoaderWithFallback<T>(
  loadFn: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseDataLoaderWithFallbackOptions<T> = {}
): UseDataLoaderWithFallbackState<T> & {
  retry: () => void;
  clearCache: () => void;
} {
  const {
    fallbackData,
    maxRetries = 3,
    retryDelay = 1000,
    enableCache = true,
    cacheKey,
    cacheTTL = 5 * 60 * 1000, // 5分
  } = options;

  const [state, setState] = useState<UseDataLoaderWithFallbackState<T>>({
    data: null,
    loading: true,
    error: null,
    isUsingFallback: false,
    retryCount: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // キャッシュ管理
  const getCacheKey = useCallback(() => {
    return cacheKey || `data_cache_${JSON.stringify(deps)}`;
  }, [cacheKey, deps]);

  const getCachedData = useCallback((): T | null => {
    if (!enableCache) return null;
    
    try {
      const cached = localStorage.getItem(getCacheKey());
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < cacheTTL) {
          return data;
        } else {
          localStorage.removeItem(getCacheKey());
        }
      }
    } catch (error) {
      console.warn('Failed to read cache:', error);
    }
    
    return null;
  }, [enableCache, getCacheKey, cacheTTL]);

  const setCachedData = useCallback((data: T) => {
    if (!enableCache) return;
    
    try {
      localStorage.setItem(getCacheKey(), JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn('Failed to write cache:', error);
    }
  }, [enableCache, getCacheKey]);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(getCacheKey());
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }, [getCacheKey]);

  const loadData = useCallback(async (retryCount = 0) => {
    // 前回のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null,
        retryCount
      }));

      // キャッシュからデータを取得
      const cachedData = getCachedData();
      if (cachedData && retryCount === 0) {
        setState(prev => ({
          ...prev,
          data: cachedData,
          loading: false,
          isUsingFallback: false,
        }));
        
        // バックグラウンドで最新データを取得
        try {
          const freshData = await loadFn();
          if (!abortControllerRef.current?.signal.aborted) {
            setCachedData(freshData);
            setState(prev => ({
              ...prev,
              data: freshData,
            }));
          }
        } catch (error) {
          // バックグラウンド更新の失敗は無視
          console.warn('Background data update failed:', error);
        }
        
        return;
      }

      const data = await loadFn();
      
      if (!abortControllerRef.current?.signal.aborted) {
        setCachedData(data);
        setState({
          data,
          loading: false,
          error: null,
          isUsingFallback: false,
          retryCount,
        });
      }
    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('Data loading error:', error);

      // リトライ可能かチェック
      const canRetry = retryCount < maxRetries && 
                      (error instanceof DataLoadError || 
                       error instanceof TypeError || 
                       (error as any)?.name === 'NetworkError');

      if (canRetry) {
        // 指数バックオフでリトライ
        const delay = retryDelay * Math.pow(2, retryCount);
        retryTimeoutRef.current = setTimeout(() => {
          loadData(retryCount + 1);
        }, delay);
        return;
      }

      // フォールバックデータまたはキャッシュデータを使用
      const cachedData = getCachedData();
      const dataToUse = fallbackData || cachedData;

      setState({
        data: dataToUse,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
        isUsingFallback: !!dataToUse,
        retryCount,
      });
    }
  }, [loadFn, maxRetries, retryDelay, fallbackData, getCachedData, setCachedData]);

  const retry = useCallback(() => {
    loadData(0);
  }, [loadData]);

  useEffect(() => {
    loadData(0);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    ...state,
    retry,
    clearCache,
  };
}

/**
 * ニュースデータ専用のフォールバック付きローダー
 */
export function useNewsDataWithFallback<T>(
  loadFn: () => Promise<T>,
  fallbackData?: T,
  deps: React.DependencyList = []
) {
  return useDataLoaderWithFallback(loadFn, deps, {
    fallbackData,
    maxRetries: 3,
    retryDelay: 2000,
    enableCache: true,
    cacheTTL: 10 * 60 * 1000, // 10分
  });
}

/**
 * サマリーデータ専用のフォールバック付きローダー
 */
export function useSummaryDataWithFallback<T>(
  loadFn: () => Promise<T>,
  fallbackData?: T,
  deps: React.DependencyList = []
) {
  return useDataLoaderWithFallback(loadFn, deps, {
    fallbackData,
    maxRetries: 2,
    retryDelay: 3000,
    enableCache: true,
    cacheTTL: 30 * 60 * 1000, // 30分
  });
}