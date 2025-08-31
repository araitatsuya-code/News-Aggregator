import React, { useState, useEffect } from 'react';
import { DataLoadError } from '../data/newsService';

interface UseDataLoaderState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook for loading data with error handling
 * @param loadFn Function that returns a Promise with the data
 * @param deps Dependency array for re-triggering the load
 * @returns Object with data, loading state, and error
 */
export function useDataLoader<T>(
  loadFn: () => Promise<T>,
  deps: React.DependencyList = []
): UseDataLoaderState<T> {
  const [state, setState] = useState<UseDataLoaderState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const data = await loadFn();
        
        if (!isCancelled) {
          setState({ data, loading: false, error: null });
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Data loading error:', error);
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error : new Error('Unknown error occurred'),
          });
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

/**
 * Custom hook specifically for news data with fallback handling
 */
export function useNewsData<T>(
  loadFn: () => Promise<T>,
  fallbackData?: T,
  deps: React.DependencyList = []
): UseDataLoaderState<T> & { hasFallback: boolean } {
  const { data, loading, error } = useDataLoader(loadFn, deps);
  
  const hasFallback = error instanceof DataLoadError && fallbackData !== undefined;
  const finalData = hasFallback ? fallbackData : data;

  return {
    data: finalData,
    loading,
    error: hasFallback ? null : error,
    hasFallback,
  };
}