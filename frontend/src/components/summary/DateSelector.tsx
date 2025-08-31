import React, { useState, useEffect } from 'react';

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  availableDates?: string[];
  locale?: string;
}

/**
 * 日付選択コンポーネント
 * 過去のデータを選択できる機能を提供する
 */
export function DateSelector({ 
  selectedDate, 
  onDateChange, 
  availableDates = [], 
  locale = 'ja' 
}: DateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 今日の日付を取得
  const today = new Date().toISOString().split('T')[0];

  // 過去30日間の日付を生成（利用可能な日付がない場合のフォールバック）
  const generateRecentDates = (days: number = 30): string[] => {
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const datesToShow = availableDates.length > 0 ? availableDates : generateRecentDates();

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isToday = (dateString: string) => {
    return dateString === today;
  };

  const handleDateSelect = (date: string) => {
    onDateChange(date);
    setIsOpen(false);
  };

  // 外部クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.date-selector')) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative date-selector">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={locale === 'ja' ? '日付を選択' : 'Select date'}
      >
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-medium text-gray-700">
          {formatDateForDisplay(selectedDate)}
          {isToday(selectedDate) && (
            <span className="ml-1 text-blue-600">
              ({locale === 'ja' ? '今日' : 'Today'})
            </span>
          )}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
          role="listbox"
          aria-label={locale === 'ja' ? '利用可能な日付' : 'Available dates'}
        >
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">
              {locale === 'ja' ? '日付を選択' : 'Select Date'}
            </div>
            {datesToShow.map((date) => (
              <button
                key={date}
                onClick={() => handleDateSelect(date)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleDateSelect(date);
                  }
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center justify-between ${
                  date === selectedDate ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
                role="option"
                aria-selected={date === selectedDate}
              >
                <span>{formatDateForDisplay(date)}</span>
                {isToday(date) && (
                  <span className="text-xs text-blue-600 font-medium">
                    {locale === 'ja' ? '今日' : 'Today'}
                  </span>
                )}
              </button>
            ))}
            {datesToShow.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                {locale === 'ja' ? '利用可能な日付がありません' : 'No dates available'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}