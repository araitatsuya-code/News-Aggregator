/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '../ErrorBoundary';

// テスト用のエラーを投げるコンポーネント
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // コンソールエラーを抑制
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('エラーが発生しない場合は子コンポーネントを表示する', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('エラーが発生した場合はエラーフォールバックを表示する', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument();
    expect(screen.getByText(/予期しないエラーが発生しました/)).toBeInTheDocument();
  });

  it('再試行ボタンが表示され、クリックできる', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText(/再試行/);
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    // 再試行後も同じエラーが発生するため、エラー表示は継続
    expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument();
  });

  it('リセットボタンが表示され、クリックできる', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const resetButton = screen.getByText('リセット');
    expect(resetButton).toBeInTheDocument();
    
    fireEvent.click(resetButton);
    // リセット後も同じエラーが発生するため、エラー表示は継続
    expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument();
  });

  it('カスタムフォールバックが提供された場合はそれを表示する', () => {
    const customFallback = <div>Custom error message</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('isolateプロパティが設定された場合は分離されたエラー表示になる', () => {
    render(
      <ErrorBoundary isolate={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('コンポーネントエラー')).toBeInTheDocument();
  });

  it('エラー詳細の表示/非表示を切り替えできる', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const detailsButton = screen.getByText('エラー詳細を表示');
    fireEvent.click(detailsButton);

    expect(screen.getByText('詳細を隠す')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('エラーレポート送信ボタンが機能する', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reportButton = screen.getByText('エラーレポートを送信');
    fireEvent.click(reportButton);

    expect(screen.getByText('レポートを送信しました')).toBeInTheDocument();
  });
});