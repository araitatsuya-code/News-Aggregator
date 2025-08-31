import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface UseDateNavigationResult {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  availableDates: string[];
  setAvailableDates: (dates: string[]) => void;
}

/**
 * 日付ナビゲーション機能を管理するカスタムフック
 * URLパラメータとの同期と日付選択状態を管理する
 */
export function useDateNavigation(): UseDateNavigationResult {
  const router = useRouter();
  const [selectedDate, setSelectedDateState] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // 今日の日付を取得
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // URLパラメータから日付を初期化
  useEffect(() => {
    if (router.isReady) {
      const dateParam = router.query.date as string;
      const initialDate = dateParam || getTodayString();
      setSelectedDateState(initialDate);
    }
  }, [router.isReady, router.query.date]);

  // 日付変更時にURLを更新
  const setSelectedDate = (date: string) => {
    setSelectedDateState(date);
    
    // URLパラメータを更新（今日の場合はパラメータを削除）
    const today = getTodayString();
    if (date === today) {
      // 今日の場合はdateパラメータを削除
      const { date: _, ...query } = router.query;
      router.push({
        pathname: router.pathname,
        query,
      }, undefined, { shallow: true });
    } else {
      // 過去の日付の場合はdateパラメータを設定
      router.push({
        pathname: router.pathname,
        query: { ...router.query, date },
      }, undefined, { shallow: true });
    }
  };

  return {
    selectedDate,
    setSelectedDate,
    availableDates,
    setAvailableDates,
  };
}