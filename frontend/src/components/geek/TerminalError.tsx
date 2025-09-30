import React, { useState, useEffect } from 'react';

/**
 * エラーの種類を定義
 */
export type ErrorType = 'error' | 'warning' | 'info' | 'loading';

/**
 * ターミナル風エラー情報の型定義
 */
export interface TerminalErrorInfo {
  type: ErrorType;
  code?: string;
  message: string;
  stack?: string;
  timestamp?: Date;
  retryable?: boolean;
}

/**
 * TerminalErrorコンポーネントのプロパティ
 */
export interface TerminalErrorProps {
  error?: TerminalErrorInfo;
  isLoading?: boolean;
  onRetry?: () => void;
  className?: string;
  showTimestamp?: boolean;
  animated?: boolean;
}

/**
 * ASCII アニメーションフレーム（ローディング用）
 */
const LOADING_FRAMES = [
  "[ ⠋ ]",
  "[ ⠙ ]", 
  "[ ⠹ ]",
  "[ ⠸ ]",
  "[ ⠼ ]",
  "[ ⠴ ]",
  "[ ⠦ ]",
  "[ ⠧ ]",
  "[ ⠇ ]",
  "[ ⠏ ]"
];

/**
 * エラータイプ別のプレフィックスとスタイル
 */
const ERROR_STYLES = {
  error: {
    prefix: '[ERROR]',
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-500/30'
  },
  warning: {
    prefix: '[WARNING]',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-500/30'
  },
  info: {
    prefix: '[INFO]',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-500/30'
  },
  loading: {
    prefix: '[LOADING]',
    color: 'text-green-400',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-500/30'
  }
};

/**
 * ターミナル風エラーハンドリングコンポーネント
 * 
 * 機能:
 * - ターミナル風のエラーメッセージ表示
 * - ASCII アニメーション付きローディング
 * - コンパイル風のフィードバックメッセージ
 * - リトライ機能
 */
export const TerminalError: React.FC<TerminalErrorProps> = ({
  error,
  isLoading = false,
  onRetry,
  className = '',
  showTimestamp = true,
  animated = true
}) => {
  const [loadingFrame, setLoadingFrame] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // ローディングアニメーション
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setLoadingFrame(prev => (prev + 1) % LOADING_FRAMES.length);
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading]);

  // 表示アニメーション
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [animated]);

  // ローディング状態の表示
  if (isLoading) {
    return (
      <div className={`font-mono text-sm ${className}`}>
        <div className="flex items-center space-x-2 text-green-400">
          <span className="animate-pulse">{LOADING_FRAMES[loadingFrame]}</span>
          <span>処理中...</span>
        </div>
      </div>
    );
  }

  // エラーがない場合は何も表示しない
  if (!error) return null;

  const style = ERROR_STYLES[error.type];
  const timestamp = error.timestamp || new Date();

  return (
    <div 
      className={`
        font-mono text-sm border-l-4 p-4 rounded-r-md
        ${style.bgColor} ${style.borderColor}
        ${animated ? 'transition-all duration-300 ease-in-out' : ''}
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* エラーヘッダー */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className={`font-bold ${style.color}`}>
            {style.prefix}
          </span>
          {error.code && (
            <span className="text-gray-400">
              [{error.code}]
            </span>
          )}
          {showTimestamp && (
            <span className="text-gray-500 text-xs">
              {timestamp.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* エラーメッセージ */}
      <div className={`${style.color} mb-2`}>
        {error.message}
      </div>

      {/* スタックトレース（エラータイプの場合のみ） */}
      {error.stack && error.type === 'error' && (
        <details className="mt-2">
          <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
            スタックトレースを表示
          </summary>
          <pre className="mt-2 text-xs text-gray-500 whitespace-pre-wrap bg-black/30 p-2 rounded">
            {error.stack}
          </pre>
        </details>
      )}

      {/* リトライボタン */}
      {error.retryable && onRetry && (
        <div className="mt-3 flex items-center space-x-2">
          <button
            onClick={onRetry}
            className="
              px-3 py-1 text-xs border border-green-500/50 
              text-green-400 hover:bg-green-500/10 
              rounded transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-green-500/50
            "
          >
            $ retry --force
          </button>
          <span className="text-gray-500 text-xs">
            コマンドを再実行
          </span>
        </div>
      )}
    </div>
  );
};

export default TerminalError;