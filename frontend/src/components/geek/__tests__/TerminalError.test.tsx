import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TerminalError, TerminalErrorInfo } from '../TerminalError';

/**
 * TerminalErrorコンポーネントのテスト
 */
describe('TerminalError', () => {
  const mockError: TerminalErrorInfo = {
    type: 'error',
    code: '404',
    message: 'データが見つかりません',
    timestamp: new Date('2025-09-30T10:00:00Z'),
    retryable: true
  };

  it('エラー情報を正しく表示する', () => {
    render(<TerminalError error={mockError} />);
    
    expect(screen.getByText('[ERROR]')).toBeInTheDocument();
    expect(screen.getByText('[404]')).toBeInTheDocument();
    expect(screen.getByText('データが見つかりません')).toBeInTheDocument();
  });

  it('ローディング状態を正しく表示する', () => {
    render(<TerminalError isLoading={true} />);
    
    expect(screen.getByText('処理中...')).toBeInTheDocument();
  });

  it('リトライボタンが機能する', () => {
    const mockRetry = jest.fn();
    render(<TerminalError error={mockError} onRetry={mockRetry} />);
    
    const retryButton = screen.getByText('$ retry --force');
    fireEvent.click(retryButton);
    
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('エラータイプに応じて適切なスタイルが適用される', () => {
    const warningError: TerminalErrorInfo = {
      type: 'warning',
      message: '警告メッセージ'
    };
    
    render(<TerminalError error={warningError} />);
    
    expect(screen.getByText('[WARNING]')).toBeInTheDocument();
    expect(screen.getByText('警告メッセージ')).toBeInTheDocument();
  });

  it('スタックトレースが表示される', async () => {
    const errorWithStack: TerminalErrorInfo = {
      type: 'error',
      message: 'エラーが発生しました',
      stack: 'Error: Test error\n  at test.js:1:1'
    };
    
    render(<TerminalError error={errorWithStack} />);
    
    const detailsButton = screen.getByText('スタックトレースを表示');
    fireEvent.click(detailsButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Error: Test error/)).toBeInTheDocument();
    });
  });

  it('エラーがない場合は何も表示しない', () => {
    const { container } = render(<TerminalError />);
    expect(container.firstChild).toBeNull();
  });

  it('タイムスタンプが表示される', () => {
    render(<TerminalError error={mockError} showTimestamp={true} />);
    
    // タイムスタンプの形式をチェック（時:分:秒）
    expect(screen.getByText(/\d{1,2}:\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it('アニメーションが無効化できる', () => {
    const { container } = render(
      <TerminalError error={mockError} animated={false} />
    );
    
    // アニメーションクラスが適用されていないことを確認
    const errorElement = container.querySelector('[role="alert"]');
    expect(errorElement).not.toHaveClass('transition-all');
  });
});