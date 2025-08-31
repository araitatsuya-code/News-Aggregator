import React from 'react';
import { useTranslation } from 'next-i18next';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

/**
 * Loading spinner component
 */
export function LoadingSpinner({ 
  size = 'md', 
  message, 
  className = '' 
}: LoadingSpinnerProps) {
  const { t } = useTranslation('news');
  const defaultMessage = message || t('loading');
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}
      />
      {defaultMessage && (
        <p className="mt-2 text-sm text-gray-600">{defaultMessage}</p>
      )}
    </div>
  );
}

/**
 * Full page loading component
 */
export function PageLoading({ message }: { message?: string }) {
  const { t } = useTranslation('common');
  const loadingMessage = message || t('loading', 'ページを読み込んでいます...');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" message={loadingMessage} />
    </div>
  );
}

/**
 * Inline loading component for smaller sections
 */
export function InlineLoading({ message }: { message?: string }) {
  const { t } = useTranslation('news');
  const loadingMessage = message || t('loading');
  
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner size="sm" message={loadingMessage} />
    </div>
  );
}