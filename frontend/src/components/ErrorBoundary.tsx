import React, { Component, ReactNode } from 'react';
import { reportError } from './GlobalErrorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  isolate?: boolean; // エラーを分離するかどうか
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

/**
 * 強化されたエラーバウンダリコンポーネント
 * React エラーの捕捉、報告、フォールバック表示を行う
 */
export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // エラー情報を状態に保存
    this.setState({ errorInfo });

    // エラー報告
    reportError('react_error_boundary', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
      retryCount: this.retryCount,
      isolate: this.props.isolate,
    });

    // カスタムエラーハンドラーを呼び出し
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined,
        errorId: undefined 
      });
    }
  };

  handleReset = () => {
    this.retryCount = 0;
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined 
    });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ErrorFallback 
          error={this.state.error} 
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onRetry={this.retryCount < this.maxRetries ? this.handleRetry : undefined}
          onReset={this.handleReset}
          retryCount={this.retryCount}
          maxRetries={this.maxRetries}
          isolate={this.props.isolate}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
  onRetry?: () => void;
  onReset?: () => void;
  retryCount?: number;
  maxRetries?: number;
  isolate?: boolean;
}

/**
 * 強化されたエラーフォールバックコンポーネント
 */
export function ErrorFallback({ 
  error, 
  errorInfo, 
  errorId,
  onRetry, 
  onReset,
  retryCount = 0,
  maxRetries = 3,
  isolate = false
}: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const [reportSent, setReportSent] = React.useState(false);

  const handleSendReport = async () => {
    try {
      // エラーレポートの送信（実際の実装では外部サービスに送信）
      reportError('user_reported_error', error, {
        errorInfo,
        errorId,
        retryCount,
        userAction: 'manual_report'
      });
      setReportSent(true);
    } catch (reportError) {
      console.error('Failed to send error report:', reportError);
    }
  };

  const getErrorSeverity = () => {
    if (isolate) return 'low';
    if (error?.name === 'ChunkLoadError') return 'medium';
    if (error?.message?.includes('Network')) return 'medium';
    return 'high';
  };

  const getErrorMessage = () => {
    if (error?.name === 'ChunkLoadError') {
      return 'アプリケーションの更新が必要です。ページを再読み込みしてください。';
    }
    if (error?.message?.includes('Network')) {
      return 'ネットワーク接続に問題があります。接続を確認してから再試行してください。';
    }
    return '予期しないエラーが発生しました。';
  };

  const getSuggestions = () => {
    const suggestions = [];
    
    if (error?.name === 'ChunkLoadError') {
      suggestions.push('ブラウザのキャッシュをクリアしてください');
      suggestions.push('ページを強制再読み込み（Ctrl+F5）してください');
    } else if (error?.message?.includes('Network')) {
      suggestions.push('インターネット接続を確認してください');
      suggestions.push('VPNを使用している場合は無効にしてみてください');
    } else {
      suggestions.push('ブラウザを最新版に更新してください');
      suggestions.push('他のタブを閉じてメモリを解放してください');
    }
    
    return suggestions;
  };

  const containerClass = isolate 
    ? "bg-red-50 border border-red-200 rounded-lg p-4 my-4"
    : "min-h-screen flex items-center justify-center bg-gray-50";

  const cardClass = isolate
    ? ""
    : "max-w-md w-full bg-white shadow-lg rounded-lg p-6";

  return (
    <div className={containerClass}>
      <div className={cardClass}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className={`h-8 w-8 ${getErrorSeverity() === 'high' ? 'text-red-500' : 'text-yellow-500'}`}
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
            <h3 className="text-sm font-medium text-gray-800">
              {isolate ? 'コンポーネントエラー' : 'アプリケーションエラー'}
            </h3>
            <div className="mt-2 text-sm text-gray-600">
              <p>{getErrorMessage()}</p>
              
              {/* 提案事項 */}
              <div className="mt-3">
                <p className="font-medium text-gray-700 mb-2">解決方法:</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                  {getSuggestions().map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>

              {/* エラー詳細 */}
              {error && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    {showDetails ? '詳細を隠す' : 'エラー詳細を表示'}
                  </button>
                  {showDetails && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                      <div className="mb-2">
                        <strong>エラー:</strong> {error.name}
                      </div>
                      <div className="mb-2">
                        <strong>メッセージ:</strong> {error.message}
                      </div>
                      {errorId && (
                        <div className="mb-2">
                          <strong>エラーID:</strong> {errorId}
                        </div>
                      )}
                      {retryCount > 0 && (
                        <div className="mb-2">
                          <strong>再試行回数:</strong> {retryCount}/{maxRetries}
                        </div>
                      )}
                      {process.env.NODE_ENV === 'development' && error.stack && (
                        <details className="mt-2">
                          <summary className="cursor-pointer">スタックトレース</summary>
                          <pre className="mt-1 text-xs whitespace-pre-wrap overflow-auto max-h-32">
                            {error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="mt-4 space-y-2">
          <div className="flex space-x-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                再試行 ({maxRetries - retryCount}回残り)
              </button>
            )}
            {onReset && (
              <button
                onClick={onReset}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                リセット
              </button>
            )}
          </div>
          
          {!isolate && (
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ページを再読み込み
            </button>
          )}

          {/* エラー報告ボタン */}
          <div className="flex justify-center">
            <button
              onClick={handleSendReport}
              disabled={reportSent}
              className="text-xs text-gray-500 hover:text-gray-700 underline disabled:no-underline disabled:text-gray-400"
            >
              {reportSent ? 'レポートを送信しました' : 'エラーレポートを送信'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode
): React.ComponentType<T> {
  return function ErrorBoundaryWrapper(props: T) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}