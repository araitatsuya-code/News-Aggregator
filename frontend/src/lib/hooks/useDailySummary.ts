import { useState, useEffect } from 'react';
import { DailySummary } from '../types';
import { NewsService, DataLoadError } from '../data/newsService';

interface UseDailySummaryResult {
  summary: DailySummary | null;
  loading: boolean;
  error: string | null;
  availableDates: string[];
  refetch: () => Promise<void>;
}

/**
 * 日次サマリーデータを管理するカスタムフック
 * 指定された日付のサマリーデータを取得し、状態を管理する
 */
export function useDailySummary(date?: string): UseDailySummaryResult {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let summaryData: DailySummary;
      
      if (date) {
        // 指定された日付のサマリーを取得
        summaryData = await NewsService.getDailySummary(date);
      } else {
        // 最新のサマリーを取得
        summaryData = await NewsService.getLatestSummary();
      }
      
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to fetch daily summary:', err);
      
      if (err instanceof DataLoadError) {
        setError(`サマリーデータの読み込みに失敗しました: ${err.message}`);
      } else {
        setError('サマリーデータの読み込み中にエラーが発生しました');
      }
      
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDates = async () => {
    try {
      const dates = await NewsService.getAvailableSummaryDates();
      setAvailableDates(dates);
    } catch (err) {
      console.error('Failed to fetch available dates:', err);
      // 利用可能な日付の取得に失敗した場合は、過去30日間を生成
      const fallbackDates: string[] = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        fallbackDates.push(date.toISOString().split('T')[0]);
      }
      setAvailableDates(fallbackDates);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [date]);

  useEffect(() => {
    fetchAvailableDates();
  }, []);

  return {
    summary,
    loading,
    error,
    availableDates,
    refetch: fetchSummary,
  };
}