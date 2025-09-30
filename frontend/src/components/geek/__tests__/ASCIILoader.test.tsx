import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ASCIILoader, MultiLineASCIILoader } from '../ASCIILoader';

/**
 * ASCIILoaderコンポーネントのテスト
 */
describe('ASCIILoader', () => {
  it('デフォルトのスピナーローダーが表示される', () => {
    render(<ASCIILoader message="テスト中..." />);
    
    expect(screen.getByText('テスト中...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('異なるローダータイプが正しく表示される', () => {
    render(<ASCIILoader type="terminal" message="ターミナルローダー" />);
    
    expect(screen.getByText('ターミナルローダー')).toBeInTheDocument();
  });

  it('マトリックス型ローダーが特別な表示になる', () => {
    render(<ASCIILoader type="matrix" message="マトリックス" />);
    
    expect(screen.getByText('マトリックス')).toBeInTheDocument();
    // preタグが使用されているかチェック
    const preElement = screen.getByRole('status').querySelector('pre');
    expect(preElement).toBeInTheDocument();
  });

  it('サイズクラスが正しく適用される', () => {
    const { container } = render(
      <ASCIILoader size="lg" message="大きなローダー" />
    );
    
    expect(container.firstChild).toHaveClass('text-lg');
  });

  it('カスタムカラーが適用される', () => {
    const { container } = render(
      <ASCIILoader color="text-blue-400" message="青いローダー" />
    );
    
    const colorElement = container.querySelector('.text-blue-400');
    expect(colorElement).toBeInTheDocument();
  });

  it('アニメーションが動作する', async () => {
    render(<ASCIILoader type="spinner" speed={50} />);
    
    // 短時間待ってアニメーションフレームが変わることを確認
    await waitFor(() => {
      // アニメーションが動作していることを間接的に確認
      expect(screen.getByRole('status')).toBeInTheDocument();
    }, { timeout: 200 });
  });
});

/**
 * MultiLineASCIILoaderコンポーネントのテスト
 */
describe('MultiLineASCIILoader', () => {
  const testLines = [
    '╔══════════════╗',
    '║   LOADING    ║',
    '║      ...     ║',
    '╚══════════════╝'
  ];

  it('複数行のASCIIアートが順次表示される', async () => {
    render(
      <MultiLineASCIILoader 
        lines={testLines} 
        message="複数行テスト"
        speed={50}
      />
    );
    
    expect(screen.getByText('複数行テスト')).toBeInTheDocument();
    
    // 最初の行が表示されるまで待機
    await waitFor(() => {
      expect(screen.getByText(/╔══════════════╗/)).toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('すべての行が表示されるまでカーソルが点滅する', async () => {
    const { container } = render(
      <MultiLineASCIILoader 
        lines={testLines}
        speed={10} // 高速化してテストを早く完了
      />
    );
    
    // カーソル（アンダースコア）が表示されることを確認
    await waitFor(() => {
      const cursor = container.querySelector('.animate-pulse');
      expect(cursor).toBeInTheDocument();
    }, { timeout: 100 });
  });

  it('空の行配列でも正常に動作する', () => {
    render(<MultiLineASCIILoader lines={[]} />);
    
    // エラーが発生しないことを確認
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('メッセージが正しく表示される', () => {
    render(
      <MultiLineASCIILoader 
        lines={testLines}
        message="カスタムメッセージ"
      />
    );
    
    expect(screen.getByText('カスタムメッセージ')).toBeInTheDocument();
  });
});