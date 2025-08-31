import React, { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';

interface GlobalErrorHandlerProps {
  children: ReactNode;
}

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
}

/**
 * グローバルエラーハンドラーコンポーネント
 * ネットワーク状態の監視とオフライン対応を提供
 */
export function GlobalErrorHandler({ children }: GlobalErrorHandlerProps) {
  const { t } = useTranslation('common');
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
    isSlowConnection: false,
  });
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    // ネットワーク状態の初期化
    setNetworkStatus({
      isOnline: navigator.onLine,
      isSlowConnection: false,
    });

    // オンライン/オフライン状態の監視
    const handleOnline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: true }));
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: false }));
      setShowOfflineMessage(true);
    };

    // 接続速度の監視（利用可能な場合）
    const checkConnectionSpeed = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const isSlowConnection = connection.effectiveType === 'slow-2g' || 
                                connection.effectiveType === '2g';
        setNetworkStatus(prev => ({ ...prev, isSlowConnection }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // 接続状態の定期チェック
    const connectionCheckInterval = setInterval(checkConnectionSpeed, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectionCheckInterval);
    };
  }, []);

  // オフライン時の自動復旧チェック
  useEffect(() => {
    if (!networkStatus.isOnline) {
      const retryInterval = setInterval(() => {
        // 簡単な接続テスト
        fetch('/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-cache',
          mode: 'no-cors'
        })
        .then(() => {
          if (!navigator.onLine) {
            // ブラウザのオンライン状態を手動で更新
            setNetworkStatus(prev => ({ ...prev, isOnline: true }));
            setShowOfflineMessage(false);
          }
        })
        .catch(() => {
          // 接続失敗時は何もしない
        });
      }, 10000); // 10秒ごとにチェック

      return () => clearInterval(retryInterval);
    }
  }, [networkStatus.isOnline]);

  return (
    <>
      {children}
      
      {/* オフライン通知バナー */}
      {showOfflineMessage && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-2 text-center text-sm animate-slide-down">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>
              インターネット接続がありません。一部の機能が制限される場合があります。
            </span>
          </div>
        </div>
      )}

      {/* 低速接続警告 */}
      {networkStatus.isOnline && networkStatus.isSlowConnection && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-yellow-600 text-white px-4 py-2 text-center text-sm">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>
              接続速度が遅いため、読み込みに時間がかかる場合があります。
            </span>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * エラー報告用のユーティリティ関数
 * 本番環境では外部サービス（Sentry等）に送信
 */
export function reportError(type: string, error: any, context?: any) {
  const errorReport = {
    type,
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // 開発環境ではコンソールに出力
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Report:', errorReport);
  }

  // 本番環境では外部サービスに送信
  if (process.env.NODE_ENV === 'production') {
    // 例: Sentry、LogRocket、独自のエラー収集サービス等
    // Sentry.captureException(error, { extra: context });
    
    // または独自のAPIエンドポイントに送信
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport)
    // }).catch(() => {
    //   // エラー報告の送信に失敗した場合はローカルストレージに保存
    //   const storedErrors = JSON.parse(localStorage.getItem('pendingErrors') || '[]');
    //   storedErrors.push(errorReport);
    //   localStorage.setItem('pendingErrors', JSON.stringify(storedErrors.slice(-10))); // 最新10件のみ保持
    // });
  }
}