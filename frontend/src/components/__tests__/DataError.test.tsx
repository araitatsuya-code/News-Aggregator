/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataError } from '../DataError';
import { DataLoadError } from '../../lib/data/newsService';

describe('DataError', () => {
  it('一般的なエラーメッセージを表示する', () => {
    const error = new Error('Test error');
    
    render(<DataError error={error} />);

    expect(screen.getByText('データの読み込み中にエラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText('予期しないエラーが発生しました。')).toBeInTheDocument();
  });

  it('DataLoadErrorの場合は適切なメッセージを表示する', () => {
    const error = new DataLoadError('latest news');
    
    render(<DataError error={error} />);

    expect(screen.getByText('最新ニュースの読み込みに失敗しました')).toBeInTheDocument();
  });

  it('ネットワークエラーの場合は適切なメッセージを表示する', () => {
    const error = new Error('Network error occurred');
    
    render(<DataError error={error} />);

    expect(screen.getByText('ネットワーク接続エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText('インターネット接続を確認してから再試行してください。')).toBeInTheDocument();
  });

  it('タイムアウトエラーの場合は適切なメッセージを表示する', () => {
    const error = new Error('Request timeout');
    
    render(<DataError error={error} />);

    expect(screen.getByText('データの読み込みがタイムアウトしました')).toBeInTheDocument();
  });

  it('再試行ボタンが提供された場合は表示される', async () => {
    const error = new Error('Test error');
    const onRetry = jest.fn().mockResolvedValue(undefined);
    
    render(<DataError error={error} onRetry={onRetry} />);

    const retryButton = screen.getByText(/再試行/);
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(onRetry).toHaveBeenCalled();
    });
  });

  it('詳細情報の表示/非表示を切り替えできる', () => {
    const error = new Error('Test error');
    
    render(<DataError error={error} context="test context" />);

    const detailsButton = screen.getByText('詳細を表示');
    fireEvent.click(detailsButton);

    expect(screen.getByText('詳細を隠す')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByText('test context')).toBeInTheDocument();
  });

  it('解決方法の提案が表示される', () => {
    const error = new Error('Network error');
    
    render(<DataError error={error} />);

    expect(screen.getByText('解決方法:')).toBeInTheDocument();
    expect(screen.getByText('インターネット接続を確認してください')).toBeInTheDocument();
  });

  it('エラーの重要度に応じて適切なスタイルが適用される', () => {
    const networkError = new Error('Network error');
    const { container, rerender } = render(<DataError error={networkError} />);

    // ネットワークエラーは警告レベル
    expect(container.firstChild).toHaveClass('bg-yellow-50');

    const dataError = new DataLoadError('latest news');
    rerender(<DataError error={dataError} />);

    // データロードエラーはエラーレベル
    expect(container.firstChild).toHaveClass('bg-red-50');
  });
});