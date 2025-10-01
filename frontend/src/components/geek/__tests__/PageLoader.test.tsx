import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PageLoader, SimpleTypingLoader } from '../PageLoader';

// タイマーをモック化
jest.useFakeTimers();

describe('PageLoader', () => {
  const defaultMessages = [
    'Initializing AI News Aggregator...',
    'Loading neural networks...',
    'Connecting to data sources...',
    'Parsing RSS feeds...',
    'Analyzing content with AI...',
    'Rendering interface...',
    'Ready to serve the latest AI news!'
  ];

  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  test('基本的なローダーが正しく表示される', () => {
    const onComplete = jest.fn();
    
    render(
      <PageLoader
        onComplete={onComplete}
        duration={1000}
      />
    );

    // ASCII アートロゴが表示される
    expect(screen.getByText(/Aggregator Loading/)).toBeInTheDocument();

    // タイピングアニメーションの状態を確認（aria-labelで）
    expect(screen.getByLabelText(/タイピング中:/)).toBeInTheDocument();

    // プログレスバーが表示される
    expect(screen.getByText(/\d+% Complete/)).toBeInTheDocument();
  });

  test('カスタムメッセージが使用される', () => {
    const customMessages = ['Custom message 1', 'Custom message 2'];
    
    render(
      <PageLoader
        messages={customMessages}
        duration={1000}
      />
    );

    // タイピングアニメーションでカスタムメッセージが使用されていることを確認
    expect(screen.getByLabelText(/タイピング中:/)).toBeInTheDocument();
  });

  test('テーマ別のスタイルが適用される', () => {
    const { rerender } = render(
      <PageLoader theme="matrix" duration={1000} />
    );

    let container = screen.getByText(/Aggregator Loading/).closest('div');
    expect(container).toHaveClass('text-green-400');

    rerender(<PageLoader theme="hacker" duration={1000} />);
    container = screen.getByText(/Aggregator Loading/).closest('div');
    expect(container).toHaveClass('text-cyan-400');

    rerender(<PageLoader theme="cyber" duration={1000} />);
    container = screen.getByText(/Aggregator Loading/).closest('div');
    expect(container).toHaveClass('text-purple-300');

    rerender(<PageLoader theme="terminal" duration={1000} />);
    container = screen.getByText(/Aggregator Loading/).closest('div');
    expect(container).toHaveClass('text-white');
  });

  test('プログレスバーが時間とともに進行する', () => {
    render(<PageLoader duration={1000} />);

    // 初期状態
    expect(screen.getByText('0% Complete')).toBeInTheDocument();

    // 時間経過後
    React.act(() => {
      jest.advanceTimersByTime(500); // 50%
    });

    expect(screen.getByText(/50% Complete/)).toBeInTheDocument();
  });

  test('ステップが時間とともに進行する', () => {
    render(
      <PageLoader
        messages={['Step 1', 'Step 2']}
        duration={1000}
      />
    );

    // 最初のステップのタイピングアニメーション
    expect(screen.getByLabelText(/タイピング中:/)).toBeInTheDocument();

    // 次のステップに進む
    React.act(() => {
      jest.advanceTimersByTime(500); // 50%経過
    });

    // 2つ目のステップが開始されている
    const typingElements = screen.getAllByLabelText(/タイピング/);
    expect(typingElements.length).toBeGreaterThan(0);
  });

  test('完了時にonCompleteが呼ばれる', async () => {
    const onComplete = jest.fn();
    
    render(
      <PageLoader
        onComplete={onComplete}
        duration={1000}
        messages={['Only message']}
      />
    );

    // 完了まで時間を進める
    React.act(() => {
      jest.advanceTimersByTime(1000); // duration
    });

    // さらに完了後の遅延を進める
    React.act(() => {
      jest.advanceTimersByTime(500); // 完了後の遅延
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  test('ESCキーでスキップできる', () => {
    const onComplete = jest.fn();
    
    render(
      <PageLoader
        onComplete={onComplete}
        skippable={true}
      />
    );

    // ESCキーを押す
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('スペースキーでスキップできる', () => {
    const onComplete = jest.fn();
    
    render(
      <PageLoader
        onComplete={onComplete}
        skippable={true}
      />
    );

    // スペースキーを押す
    fireEvent.keyDown(window, { key: ' ' });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('スキップ無効時はキーが無視される', () => {
    const onComplete = jest.fn();
    
    render(
      <PageLoader
        onComplete={onComplete}
        skippable={false}
      />
    );

    // ESCキーを押しても無視される
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onComplete).not.toHaveBeenCalled();
  });

  test('完了後にコンポーネントが非表示になる', async () => {
    const { container } = render(
      <PageLoader duration={100} />
    );

    // 初期状態では表示されている
    expect(container.firstChild).toBeInTheDocument();

    // 完了後は非表示になる
    React.act(() => {
      jest.advanceTimersByTime(100); // duration
    });

    React.act(() => {
      jest.advanceTimersByTime(500); // 完了後の遅延
    });

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  test('カスタムCSSクラスが適用される', () => {
    const customClass = 'custom-loader-class';
    
    render(
      <PageLoader
        className={customClass}
        duration={1000}
      />
    );

    // PageLoaderのルート要素（dialog）にクラスが適用されることを確認
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass(customClass);
  });

  test('スキップ可能時にスキップ指示が表示される', () => {
    render(
      <PageLoader
        skippable={true}
        duration={1000}
      />
    );

    // スキップ指示のテキストを確認（テキストが複数の要素に分かれているため、部分的に確認）
    expect(screen.getByText(/Press/)).toBeInTheDocument();
    expect(screen.getByText('ESC')).toBeInTheDocument();
    // "or"は複数の場所に存在するため、より具体的に検索
    const skipInstructions = screen.getByText((content, element) => {
      return element?.textContent === 'Press ESC or SPACE to skip';
    });
    expect(skipInstructions).toBeInTheDocument();
    expect(screen.getByText('SPACE')).toBeInTheDocument();
  });

  test('スキップ不可時にスキップ指示が表示されない', () => {
    render(
      <PageLoader
        skippable={false}
        duration={1000}
      />
    );

    expect(screen.queryByText(/Press.*ESC.*or.*SPACE.*to skip/)).not.toBeInTheDocument();
  });
});

describe('SimpleTypingLoader', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  test('基本的なローダーが表示される', () => {
    render(<SimpleTypingLoader message="Loading..." />);

    // タイピングアニメーションの状態を確認
    expect(screen.getByLabelText(/タイピング中:/)).toBeInTheDocument();
  });

  test('デフォルトメッセージが使用される', () => {
    render(<SimpleTypingLoader />);

    // タイピングアニメーションの状態を確認
    expect(screen.getByLabelText(/タイピング中:/)).toBeInTheDocument();
  });

  test('テーマ別のスタイルが適用される', () => {
    const { rerender } = render(
      <SimpleTypingLoader theme="matrix" message="Test" />
    );

    let container = screen.getByLabelText(/タイピング中:/).closest('div');
    expect(container).toHaveClass('text-green-400');

    rerender(<SimpleTypingLoader theme="hacker" message="Test" />);
    container = screen.getByLabelText(/タイピング中:/).closest('div');
    expect(container).toHaveClass('text-cyan-400');

    rerender(<SimpleTypingLoader theme="cyber" message="Test" />);
    container = screen.getByLabelText(/タイピング中:/).closest('div');
    expect(container).toHaveClass('text-purple-400');

    rerender(<SimpleTypingLoader theme="terminal" message="Test" />);
    container = screen.getByLabelText(/タイピング中:/).closest('div');
    expect(container).toHaveClass('text-white');
  });

  test('完了時にonCompleteが呼ばれる', async () => {
    const onComplete = jest.fn();
    
    render(
      <SimpleTypingLoader
        message="Short"
        onComplete={onComplete}
      />
    );

    // タイピング完了まで時間を進める
    React.act(() => {
      jest.advanceTimersByTime(50 * 5 + 100); // 文字数 * 速度 + バッファ
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  test('カスタムCSSクラスが適用される', () => {
    const customClass = 'custom-simple-loader-class';
    
    render(
      <SimpleTypingLoader
        className={customClass}
        message="Test"
      />
    );

    const container = screen.getByLabelText(/タイピング中:/).closest('div');
    expect(container).toHaveClass(customClass);
    expect(container).toHaveClass('font-mono-primary');
  });
});

describe('アクセシビリティ', () => {
  test('PageLoaderが適切なARIA属性を持つ', () => {
    render(<PageLoader duration={1000} />);

    const container = screen.getByRole('dialog', { hidden: true });
    expect(container).toBeInTheDocument();
  });

  test('ローディング状態が適切に伝達される', () => {
    render(<PageLoader duration={1000} />);

    // ローディング状態を示すテキストが存在する
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });

  test('プログレス情報が適切に提供される', () => {
    render(<PageLoader duration={1000} />);

    // プログレス情報が表示される
    expect(screen.getByText(/\d+% Complete/)).toBeInTheDocument();
  });
});

describe('エラーハンドリング', () => {
  test('空のメッセージ配列でもエラーが発生しない', () => {
    expect(() => {
      render(<PageLoader messages={[]} duration={1000} />);
    }).not.toThrow();
  });

  test('無効なduration値でもエラーが発生しない', () => {
    expect(() => {
      render(<PageLoader duration={-1} />);
    }).not.toThrow();
  });

  test('onCompleteなしでもエラーが発生しない', () => {
    expect(() => {
      render(<PageLoader duration={100} />);
    }).not.toThrow();
  });

  test('SimpleTypingLoaderで空メッセージでもエラーが発生しない', () => {
    expect(() => {
      render(<SimpleTypingLoader message="" />);
    }).not.toThrow();
  });
});