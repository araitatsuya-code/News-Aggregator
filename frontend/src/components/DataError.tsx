import React from 'react';
import { DataLoadError } from '../lib/data/newsService';

interface DataErrorProps {
  error: Error;
  onRetry?: () => void;
  className?: string;
}

/**
 * Component for displaying data loading errors
 */
export function DataError({ error, onRetry, className = '' }: DataErrorProps) {
  const isDataLoadError = error instanceof DataLoadError;
  
  const getErrorMessage = () => {
    if (isDataLoadError) {
      const dataLoadError = error as DataLoadError;
      switch (dataLoadError.dataType) {
        case 'latest news':
          return '最新ニュースの読み込みに失敗しました';
        case 'daily news':
          return `${dataLoadError.date}のニュースの読み込みに失敗しました`;
        case 'daily summary':
          return `${dataLoadError.date}のサマリーの読み込みに失敗しました`;
        case 'latest summary':
          return '最新サマリーの読み込みに失敗しました';
        case 'news by category':
          return `カテゴリ「${dataLoadError.date}」のニュースの読み込みに失敗しました`;
        case 'categories':
          return 'カテゴリ一覧の読み込みに失敗しました';
        case 'sources':
          return 'ソース一覧の読み込みに失敗しました';
        default:
          return 'データの読み込みに失敗しました';
      }
    }
    return 'エラーが発生しました';
  };

  const getErrorDescription = () => {
    if (isDataLoadError) {
      return 'ネットワーク接続を確認するか、しばらく時間をおいてから再試行してください。';
    }
    return '予期しないエラーが発生しました。';
  };

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {getErrorMessage()}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{getErrorDescription()}</p>
          </div>
          {onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className="bg-red-100 hover:bg-red-200 text-red-800 text-sm font-medium py-1 px-3 rounded-md transition-colors duration-200"
              >
                再試行
              </button>
            </div>
          )}
        </div>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-red-600">
            開発者向け詳細情報
          </summary>
          <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap bg-red-100 p-2 rounded">
            {error.stack || error.message}
          </pre>
        </details>
      )}
    </div>
  );
}

/**
 * Inline error component for smaller sections
 */
export function InlineDataError({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-center py-8">
      <DataError error={error} onRetry={onRetry} className="max-w-md" />
    </div>
  );
}