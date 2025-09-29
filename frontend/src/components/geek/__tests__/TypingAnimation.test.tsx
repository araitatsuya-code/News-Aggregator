import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TypingAnimation, MultiLineTypingAnimation } from '../TypingAnimation';

// タイマーをモック化
jest.useFakeTimers();

describe('TypingAnimation', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  test('基本的なタイピングアニメーションが正しく動作する', async () => {
    const testText = 'Hello World';
    const onComplete = jest.fn();

    render(
      <TypingAnimation
        text={testText}
        speed={50}
        cursor={true}
        onComplete={onComplete}
        autoStart={true}
      />
    );

    // 初期状態では何も表示されていない
    expect(screen.queryByText(testText)).not.toBeInTheDocument();

    // タイマーを進めて文字が表示されることを確認
    act(() => {
      jest.advanceTimersByTime(50); // 1文字目
    });

    expect(screen.getByText('H')).toBeInTheDocument();

    // 全ての文字が表示されるまでタイマーを進める
    act(() => {
      jest.advanceTimersByTime(50 * (testText.length - 1));
    });

    expect(screen.getByText(testText)).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('カーソルが正しく表示される', () => {
    render(
      <TypingAnimation
        text="Test"
        cursor={true}
        autoStart={true}
      />
    );

    // カーソルが表示されることを確認
    const cursor = screen.getByText('▋');
    expect(cursor).toBeInTheDocument();
    expect(cursor).toHaveClass('animate-pulse', 'text-green-400');
  });

  test('カーソルを無効にできる', () => {
    render(
      <TypingAnimation
        text="Test"
        cursor={false}
        autoStart={true}
      />
    );

    // カーソルが表示されないことを確認
    expect(screen.queryByText('▋')).not.toBeInTheDocument();
  });

  test('開始遅延が正しく動作する', () => {
    const testText = 'Delayed';
    
    render(
      <TypingAnimation
        text={testText}
        startDelay={1000}
        speed={50}
        autoStart={true}
      />
    );

    // 遅延時間前は何も表示されない
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.queryByText(/D/)).not.toBeInTheDocument();

    // 遅延時間後にタイピングが開始される
    act(() => {
      jest.advanceTimersByTime(500 + 50);
    });
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  test('自動開始を無効にできる', () => {
    const testText = 'Manual Start';
    
    render(
      <TypingAnimation
        text={testText}
        autoStart={false}
        speed={50}
      />
    );

    // 時間が経過しても何も表示されない
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.queryByText(/M/)).not.toBeInTheDocument();
  });

  test('カスタムCSSクラスが適用される', () => {
    const customClass = 'custom-typing-class';
    
    render(
      <TypingAnimation
        text="Test"
        className={customClass}
        autoStart={true}
      />
    );

    const element = screen.getByText('Test').closest('span');
    expect(element).toHaveClass(customClass);
    expect(element).toHaveClass('font-mono-primary');
  });
});

describe('MultiLineTypingAnimation', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  test('複数行のタイピングアニメーションが正しく動作する', async () => {
    const lines = ['Line 1', 'Line 2', 'Line 3'];
    const onComplete = jest.fn();

    render(
      <MultiLineTypingAnimation
        lines={lines}
        speed={50}
        lineDelay={100}
        onComplete={onComplete}
      />
    );

    // 最初の行がタイピングされる
    act(() => {
      jest.advanceTimersByTime(50 * lines[0].length);
    });
    expect(screen.getByText(lines[0])).toBeInTheDocument();

    // 行間遅延後に次の行が開始される
    act(() => {
      jest.advanceTimersByTime(100 + 50 * lines[1].length);
    });
    expect(screen.getByText(lines[1])).toBeInTheDocument();

    // 全ての行が完了する
    act(() => {
      jest.advanceTimersByTime(100 + 50 * lines[2].length);
    });
    expect(screen.getByText(lines[2])).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('完了した行が正しく表示される', () => {
    const lines = ['Completed Line', 'Current Line'];

    render(
      <MultiLineTypingAnimation
        lines={lines}
        speed={50}
        lineDelay={100}
      />
    );

    // 最初の行を完了させる
    act(() => {
      jest.advanceTimersByTime(50 * lines[0].length + 100);
    });

    // 完了した行が表示されることを確認
    expect(screen.getByText(lines[0])).toBeInTheDocument();
    
    // 現在の行の一部が表示されることを確認
    act(() => {
      jest.advanceTimersByTime(50 * 3); // "Cur" まで
    });
    expect(screen.getByText('Cur')).toBeInTheDocument();
  });

  test('カスタムCSSクラスが適用される', () => {
    const customClass = 'custom-multiline-class';
    const lines = ['Test Line'];

    const { container } = render(
      <MultiLineTypingAnimation
        lines={lines}
        className={customClass}
      />
    );

    const element = container.firstChild;
    expect(element).toHaveClass(customClass);
    expect(element).toHaveClass('font-mono-primary');
  });
});

describe('アクセシビリティ', () => {
  test('適切なARIA属性が設定される', () => {
    render(
      <TypingAnimation
        text="Accessible Text"
        autoStart={true}
      />
    );

    const element = screen.getByText('Accessible Text').closest('span');
    expect(element).toHaveAttribute('role', 'status');
    expect(element).toHaveAttribute('aria-live', 'polite');
  });

  test('prefers-reduced-motionが尊重される', () => {
    // reduced-motionメディアクエリをモック
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(
      <TypingAnimation
        text="Reduced Motion"
        autoStart={true}
      />
    );

    // reduced-motionが有効な場合、即座に全テキストが表示される
    expect(screen.getByText('Reduced Motion')).toBeInTheDocument();
  });
});

describe('エラーハンドリング', () => {
  test('空のテキストでもエラーが発生しない', () => {
    expect(() => {
      render(
        <TypingAnimation
          text=""
          autoStart={true}
        />
      );
    }).not.toThrow();
  });

  test('無効なspeed値でもエラーが発生しない', () => {
    expect(() => {
      render(
        <TypingAnimation
          text="Test"
          speed={-1}
          autoStart={true}
        />
      );
    }).not.toThrow();
  });

  test('空の行配列でもエラーが発生しない', () => {
    expect(() => {
      render(
        <MultiLineTypingAnimation
          lines={[]}
        />
      );
    }).not.toThrow();
  });
});