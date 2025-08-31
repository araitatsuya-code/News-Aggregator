import React, { useState, useEffect } from 'react';
import { DataLoadError } from '../lib/data/newsService';
import { reportError } from './GlobalErrorHandler';

interface DataErrorProps {
  error: Error;
  onRetry?: () => void;
  className?: string;
  showFallback?: boolean;
  fallbackData?: any;
  context?: string;
}

/**
 * 強化されたデータエラー表示コンポーネント
 * フォールバック機能と詳細なエラー情報を提供
 */
export function DataError({ 
  error, 
  onRetry, 
  className = '', 
  showFallback = false,
  fallbackData,
  context
}: DataErrorProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const maxRetries = 3;
  
  const isDataLoadError = error instanceof DataLoadError;
  const isNetworkError = error.message.includes('fetch') || error.message.includes('Network');
  const isTimeoutError = error.message.includes('timeout');

  useEffect(() => {
    // エラーを報告
    reportError('data_load_error', error, {
      context,
      retryCount,
      isDataLoadError,
      isNetworkError,
      isTimeoutError,
      dataType: isDataLoadError ? (error as DataLoadError).dataType : 'unknown'
    });
  }, [error, context, retryCount, isDataLoadError, isNetworkError, isTimeoutError]);
  
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
    
    if (isNetworkError) {
      return 'ネットワーク接続エラーが発生しました';
    }
    
    if (isTimeoutError) {
      return 'データの読み込みがタイムアウトしました';
    }
    
    return 'データの読み込み中にエラーが発生しました';
  };

  const getErrorDescription = () => {
    if (isNetworkError) {
      return 'インターネット接続を確認してから再試行してください。';
    }
    
    if (isTimeoutError) {
      return 'サーバーの応答が遅くなっています。しばらく待ってから再試行してください。';
    }
    
    if (isDataLoadError) {
      return 'データファイルが見つからないか、読み込みに失敗しました。';
    }
    
    return '予期しないエラーが発生しました。';
  };

  const getSuggestions = () => {
    const suggestions = [];
    
    if (isNetworkError) {
      suggestions.push('インターネット接続を確認してください');
      suggestions.push('VPNを使用している場合は無効にしてみてください');
      suggestions.push('ファイアウォールの設定を確認してください');
    } else if (isTimeoutError) {
      suggestions.push('しばらく時間をおいてから再試行してください');
      suggestions.push('他のタブを閉じてリソースを解放してください');
    } else if (isDataLoadError) {
      suggestions.push('ページを再読み込みしてください');
      suggestions.push('ブラウザのキャッシュをクリアしてください');
    }
    
    return suggestions;
  };

  const handleRetry = async () => {
    if (retryCount >= maxRetries || !onRetry) return;
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      await onRetry();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorSeverity = () => {
    if (isNetworkError || isTimeoutError) return 'warning';
    if (isDataLoadError) return 'error';
    return 'error';
  };

  const severityColors = {
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-400',
      text: 'text-yellow-800',
      button: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-400',
      text: 'text-red-800',
      button: 'bg-red-100 hover:bg-red-200 text-red-800'
    }
  };

  const colors = severityColors[getErrorSeverity()];

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className={`h-5 w-5 ${colors.icon}`}
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
          <h3 className={`text-sm font-medium ${colors.text}`}>
            {getErrorMessage()}
          </h3>
          <div className={`mt-2 text-sm ${colors.text.replace('800', '700')}`}>
            <p>{getErrorDescription()}</p>
            
            {/* 提案事項 */}
            {getSuggestions().length > 0 && (
              <div className="mt-3">
                <p className="font-medium mb-2">解決方法:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  {getSuggestions().map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* アクションボタン */}
          <div className="mt-3 flex flex-wrap gap-2">
            {onRetry && retryCount < maxRetries && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className={`${colors.button} text-sm font-medium py-1 px-3 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRetrying ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    再試行中...
                  </span>
                ) : (
                  `再試行 (${maxRetries - retryCount}回残り)`
                )}
              </button>
            )}
            
            {showFallback && fallbackData && (
              <button
                onClick={() => {/* フォールバックデータを表示する処理 */}}
                className={`${colors.button} text-sm font-medium py-1 px-3 rounded-md transition-colors duration-200`}
              >
                キャッシュデータを表示
              </button>
            )}
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              {showDetails ? '詳細を隠す' : '詳細を表示'}
            </button>
          </div>
          
          {/* 詳細情報 */}
          {showDetails && (
            <div className="mt-3 p-3 bg-white bg-opacity-50 rounded border">
              <div className="text-xs space-y-2">
                <div>
                  <strong>エラータイプ:</strong> {error.name}
                </div>
                <div>
                  <strong>メッセージ:</strong> {error.message}
                </div>
                {context && (
                  <div>
                    <strong>コンテキスト:</strong> {context}
                  </div>
                )}
                {retryCount > 0 && (
                  <div>
                    <strong>再試行回数:</strong> {retryCount}/{maxRetries}
                  </div>
                )}
                <div>
                  <strong>発生時刻:</strong> {new Date().toLocaleString('ja-JP')}
                </div>
                
                {process.env.NODE_ENV === 'development' && error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">スタックトレース</summary>
                    <pre className="mt-1 text-xs whitespace-pre-wrap overflow-auto max-h-32 bg-gray-100 p-2 rounded">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
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