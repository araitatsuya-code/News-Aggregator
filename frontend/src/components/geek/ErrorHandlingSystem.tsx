import React, { useState, useEffect } from 'react';
import { TerminalError, TerminalErrorInfo, ErrorType } from './TerminalError';
import { CompileFeedback, CompileStep, CompileStatus } from './CompileFeedback';
import { ASCIILoader, LoaderType } from './ASCIILoader';

/**
 * エラーハンドリングシステムの状態
 */
export type SystemState = 'idle' | 'loading' | 'processing' | 'error' | 'success';

/**
 * ErrorHandlingSystemコンポーネントのプロパティ
 */
export interface ErrorHandlingSystemProps {
  state: SystemState;
  error?: TerminalErrorInfo;
  steps?: CompileStep[];
  loadingMessage?: string;
  loaderType?: LoaderType;
  onRetry?: () => void;
  onReset?: () => void;
  className?: string;
  showDebugInfo?: boolean;
}

/**
 * デバッグ情報の型定義
 */
interface DebugInfo {
  timestamp: string;
  userAgent: string;
  url: string;
  memory?: string;
}

/**
 * 統合エラーハンドリングシステムコンポーネント
 * 
 * 機能:
 * - 状態に応じた適切なUI表示
 * - ローディング、エラー、成功状態の管理
 * - デバッグ情報の表示
 * - 自動リトライ機能
 */
export const ErrorHandlingSystem: React.FC<ErrorHandlingSystemProps> = ({
  state,
  error,
  steps = [],
  loadingMessage = 'システムを初期化中...',
  loaderType = 'spinner',
  onRetry,
  onReset,
  className = '',
  showDebugInfo = false
}) => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // デバッグ情報の収集
  useEffect(() => {
    if (showDebugInfo && (state === 'error' || state === 'loading')) {
      const info: DebugInfo = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // メモリ使用量の取得（対応ブラウザのみ）
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        info.memory = `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB / ${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`;
      }

      setDebugInfo(info);
    }
  }, [state, showDebugInfo]);

  // リトライ処理
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    onRetry?.();
  };

  // リセット処理
  const handleReset = () => {
    setRetryCount(0);
    setDebugInfo(null);
    onReset?.();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ローディング状態 */}
      {state === 'loading' && (
        <div className="text-center py-8">
          <ASCIILoader
            type={loaderType}
            message={loadingMessage}
            className="justify-center"
          />
        </div>
      )}

      {/* 処理中状態（コンパイルフィードバック） */}
      {state === 'processing' && steps.length > 0 && (
        <CompileFeedback
          steps={steps}
          showProgress={true}
          autoScroll={true}
        />
      )}

      {/* エラー状態 */}
      {state === 'error' && error && (
        <div className="space-y-4">
          <TerminalError
            error={error}
            onRetry={error.retryable ? handleRetry : undefined}
            showTimestamp={true}
            animated={true}
          />

          {/* リトライ回数の表示 */}
          {retryCount > 0 && (
            <div className="text-xs text-gray-500 font-mono">
              リトライ回数: {retryCount}
            </div>
          )}

          {/* デバッグ情報 */}
          {showDebugInfo && debugInfo && (
            <details className="font-mono text-xs">
              <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
                デバッグ情報を表示
              </summary>
              <div className="mt-2 p-3 bg-black/30 rounded border border-gray-700">
                <div className="space-y-1 text-gray-400">
                  <div>タイムスタンプ: {debugInfo.timestamp}</div>
                  <div>URL: {debugInfo.url}</div>
                  {debugInfo.memory && (
                    <div>メモリ使用量: {debugInfo.memory}</div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    User Agent: {debugInfo.userAgent}
                  </div>
                </div>
              </div>
            </details>
          )}

          {/* システムリセットボタン */}
          {onReset && (
            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="
                  px-4 py-2 text-sm font-mono border border-red-500/50 
                  text-red-400 hover:bg-red-500/10 rounded
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-red-500/50
                "
              >
                $ system --reset
              </button>
            </div>
          )}
        </div>
      )}

      {/* 成功状態 */}
      {state === 'success' && (
        <div className="text-center py-4">
          <div className="font-mono text-green-400 flex items-center justify-center space-x-2">
            <span>✅</span>
            <span>[SUCCESS]</span>
            <span className="text-gray-300">処理が正常に完了しました</span>
          </div>
        </div>
      )}

      {/* アイドル状態（何も表示しない） */}
      {state === 'idle' && null}
    </div>
  );
};

/**
 * エラーハンドリングシステム用のカスタムフック
 */
export const useErrorHandling = () => {
  const [state, setState] = useState<SystemState>('idle');
  const [error, setError] = useState<TerminalErrorInfo | undefined>();
  const [steps, setSteps] = useState<CompileStep[]>([]);

  const showLoading = (message?: string) => {
    setState('loading');
    setError(undefined);
  };

  const showProcessing = (processSteps: CompileStep[]) => {
    setState('processing');
    setSteps(processSteps);
    setError(undefined);
  };

  const showError = (errorInfo: TerminalErrorInfo) => {
    setState('error');
    setError(errorInfo);
  };

  const showSuccess = () => {
    setState('success');
    setError(undefined);
  };

  const reset = () => {
    setState('idle');
    setError(undefined);
    setSteps([]);
  };

  return {
    state,
    error,
    steps,
    showLoading,
    showProcessing,
    showError,
    showSuccess,
    reset
  };
};

export default ErrorHandlingSystem;