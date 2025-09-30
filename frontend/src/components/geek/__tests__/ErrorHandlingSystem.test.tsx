import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorHandlingSystem, useErrorHandling } from '../ErrorHandlingSystem';
import { TerminalErrorInfo } from '../TerminalError';
import { CompileStep } from '../CompileFeedback';

/**
 * ErrorHandlingSystemコンポーネントのテスト
 */
describe('ErrorHandlingSystem', () => {
  const mockError: TerminalErrorInfo = {
    type: 'error',
    code: '500',
    message: 'サーバーエラーが発生しました',
    retryable: true
  };

  const mockSteps: CompileStep[] = [
    {
      id: 'step1',
      message: 'データを処理中...',
      status: 'success'
    },
    {
      id: 'step2',
      message: 'レンダリング中...',
      status: 'compiling'
    }
  ];

  it('ローディング状態を正しく表示する', () => {
    render(
      <ErrorHandlingSystem 
        state="loading" 
        loadingMessage="システム初期化中..."
      />
    );
    
    expect(screen.getByText('システム初期化中...')).toBeInTheDocument();
  });

  it('エラー状態を正しく表示する', () => {
    render(
      <ErrorHandlingSystem 
        state="error" 
        error={mockError}
      />
    );
    
    expect(screen.getByText('[ERROR]')).toBeInTheDocument();
    expect(screen.getByText('サーバーエラーが発生しました')).toBeInTheDocument();
  });

  it('処理中状態でコンパイルフィードバックを表示する', () => {
    render(
      <ErrorHandlingSystem 
        state="processing" 
        steps={mockSteps}
      />
    );
    
    expect(screen.getByText('[SUCCESS]')).toBeInTheDocument();
    expect(screen.getByText('データを処理中...')).toBeInTheDocument();
    expect(screen.getByText('[COMPILING]')).toBeInTheDocument();
    expect(screen.getByText('レンダリング中...')).toBeInTheDocument();
  });

  it('成功状態を正しく表示する', () => {
    render(<ErrorHandlingSystem state="success" />);
    
    expect(screen.getByText('[SUCCESS]')).toBeInTheDocument();
    expect(screen.getByText('処理が正常に完了しました')).toBeInTheDocument();
  });

  it('アイドル状態では何も表示しない', () => {
    const { container } = render(<ErrorHandlingSystem state="idle" />);
    
    // 空のdivのみが表示される
    expect(container.firstChild).toHaveClass('space-y-4');
    expect(container.firstChild?.childNodes).toHaveLength(0);
  });

  it('リトライ機能が動作する', () => {
    const mockRetry = jest.fn();
    render(
      <ErrorHandlingSystem 
        state="error" 
        error={mockError}
        onRetry={mockRetry}
      />
    );
    
    const retryButton = screen.getByText('$ retry --force');
    fireEvent.click(retryButton);
    
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('システムリセット機能が動作する', () => {
    const mockReset = jest.fn();
    render(
      <ErrorHandlingSystem 
        state="error" 
        error={mockError}
        onReset={mockReset}
      />
    );
    
    const resetButton = screen.getByText('$ system --reset');
    fireEvent.click(resetButton);
    
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('デバッグ情報が表示される', async () => {
    render(
      <ErrorHandlingSystem 
        state="error" 
        error={mockError}
        showDebugInfo={true}
      />
    );
    
    const debugButton = screen.getByText('デバッグ情報を表示');
    fireEvent.click(debugButton);
    
    await waitFor(() => {
      expect(screen.getByText(/タイムスタンプ:/)).toBeInTheDocument();
      expect(screen.getByText(/URL:/)).toBeInTheDocument();
    });
  });

  it('リトライ回数が表示される', () => {
    const mockRetry = jest.fn();
    render(
      <ErrorHandlingSystem 
        state="error" 
        error={mockError}
        onRetry={mockRetry}
      />
    );
    
    // 最初のリトライ
    const retryButton = screen.getByText('$ retry --force');
    fireEvent.click(retryButton);
    
    // リトライ回数が表示されることを確認
    expect(screen.getByText('リトライ回数: 1')).toBeInTheDocument();
  });

  it('カスタムローダータイプが適用される', () => {
    render(
      <ErrorHandlingSystem 
        state="loading" 
        loaderType="matrix"
        loadingMessage="マトリックスローダー"
      />
    );
    
    expect(screen.getByText('マトリックスローダー')).toBeInTheDocument();
  });
});

/**
 * useErrorHandlingフックのテスト
 */
describe('useErrorHandling', () => {
  // テスト用のコンポーネント
  const TestComponent: React.FC = () => {
    const {
      state,
      error,
      steps,
      showLoading,
      showProcessing,
      showError,
      showSuccess,
      reset
    } = useErrorHandling();

    return (
      <div>
        <div data-testid="state">{state}</div>
        <div data-testid="error">{error?.message || 'no error'}</div>
        <div data-testid="steps-count">{steps.length}</div>
        
        <button onClick={() => showLoading('テストローディング')}>
          Show Loading
        </button>
        <button onClick={() => showProcessing([
          { id: 'test', message: 'テスト処理', status: 'compiling' }
        ])}>
          Show Processing
        </button>
        <button onClick={() => showError({
          type: 'error',
          message: 'テストエラー'
        })}>
          Show Error
        </button>
        <button onClick={showSuccess}>Show Success</button>
        <button onClick={reset}>Reset</button>
      </div>
    );
  };

  it('初期状態はidleである', () => {
    render(<TestComponent />);
    
    expect(screen.getByTestId('state')).toHaveTextContent('idle');
    expect(screen.getByTestId('error')).toHaveTextContent('no error');
    expect(screen.getByTestId('steps-count')).toHaveTextContent('0');
  });

  it('ローディング状態に変更できる', () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Show Loading'));
    
    expect(screen.getByTestId('state')).toHaveTextContent('loading');
  });

  it('処理中状態に変更できる', () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Show Processing'));
    
    expect(screen.getByTestId('state')).toHaveTextContent('processing');
    expect(screen.getByTestId('steps-count')).toHaveTextContent('1');
  });

  it('エラー状態に変更できる', () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Show Error'));
    
    expect(screen.getByTestId('state')).toHaveTextContent('error');
    expect(screen.getByTestId('error')).toHaveTextContent('テストエラー');
  });

  it('成功状態に変更できる', () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Show Success'));
    
    expect(screen.getByTestId('state')).toHaveTextContent('success');
  });

  it('リセット機能が動作する', () => {
    render(<TestComponent />);
    
    // エラー状態にしてからリセット
    fireEvent.click(screen.getByText('Show Error'));
    expect(screen.getByTestId('state')).toHaveTextContent('error');
    
    fireEvent.click(screen.getByText('Reset'));
    expect(screen.getByTestId('state')).toHaveTextContent('idle');
    expect(screen.getByTestId('error')).toHaveTextContent('no error');
  });
});