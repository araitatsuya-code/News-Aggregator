import { renderHook, act } from '@testing-library/react';
import {
  useTypingAnimation,
  useCursorBlink,
  useMultiLineTypingAnimation,
} from '../useTypingAnimation';

// タイマーをモック化
jest.useFakeTimers();

describe.skip('useTypingAnimation', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  test('基本的なタイピングアニメーションが動作する', () => {
    const { result } = renderHook(() =>
      useTypingAnimation('Hello', { autoStart: true, speed: 50 })
    );

    const [state, controls] = result.current;

    // 初期状態
    expect(state.displayedText).toBe('');
    expect(state.isComplete).toBe(false);
    expect(state.isTyping).toBe(true);

    // 1文字目
    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(result.current[0].displayedText).toBe('H');
    expect(result.current[0].currentIndex).toBe(1);

    // 全文字完了
    act(() => {
      jest.advanceTimersByTime(50 * 4); // 残り4文字
    });

    expect(result.current[0].displayedText).toBe('Hello');
    expect(result.current[0].isComplete).toBe(true);
    expect(result.current[0].isTyping).toBe(false);
  });

  test('手動制御が正しく動作する', () => {
    const { result } = renderHook(() =>
      useTypingAnimation('Test', { autoStart: false, speed: 50 })
    );

    const [initialState, controls] = result.current;

    // 自動開始しない
    expect(initialState.isTyping).toBe(false);

    // 手動開始
    act(() => {
      controls.start();
    });

    expect(result.current[0].isTyping).toBe(true);

    // 一時停止
    act(() => {
      jest.advanceTimersByTime(100); // 2文字分
      controls.pause();
    });

    const pausedText = result.current[0].displayedText;
    
    act(() => {
      jest.advanceTimersByTime(100); // 時間が経過しても進まない
    });

    expect(result.current[0].displayedText).toBe(pausedText);

    // 再開
    act(() => {
      controls.resume();
      jest.advanceTimersByTime(100); // 残りの文字
    });

    expect(result.current[0].displayedText).toBe('Test');
  });

  test('リセット機能が動作する', () => {
    const { result } = renderHook(() =>
      useTypingAnimation('Reset', { autoStart: true, speed: 50 })
    );

    // 途中まで進める
    act(() => {
      jest.advanceTimersByTime(150); // 3文字分
    });

    expect(result.current[0].displayedText).toBe('Res');

    // リセット
    act(() => {
      result.current[1].reset();
    });

    expect(result.current[0].displayedText).toBe('');
    expect(result.current[0].currentIndex).toBe(0);
    expect(result.current[0].isComplete).toBe(false);
    expect(result.current[0].isTyping).toBe(false);
  });

  test('ループ機能が動作する', () => {
    const { result } = renderHook(() =>
      useTypingAnimation('Loop', { 
        autoStart: true, 
        speed: 50, 
        loop: true, 
        loopDelay: 100 
      })
    );

    // 最初のループ完了
    act(() => {
      jest.advanceTimersByTime(50 * 4); // "Loop"
    });

    expect(result.current[0].displayedText).toBe('Loop');
    expect(result.current[0].isComplete).toBe(true);

    // ループ遅延後に再開
    act(() => {
      jest.advanceTimersByTime(100 + 50); // 遅延 + 1文字
    });

    expect(result.current[0].displayedText).toBe('L');
    expect(result.current[0].isComplete).toBe(false);
  });

  test('開始遅延が動作する', () => {
    const { result } = renderHook(() =>
      useTypingAnimation('Delay', { 
        autoStart: true, 
        speed: 50, 
        startDelay: 200 
      })
    );

    // 遅延時間前
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current[0].isTyping).toBe(false);

    // 遅延時間後
    act(() => {
      jest.advanceTimersByTime(100 + 50); // 遅延 + 1文字
    });

    expect(result.current[0].isTyping).toBe(true);
    expect(result.current[0].displayedText).toBe('D');
  });
});

describe('useCursorBlink', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  test('カーソルが点滅する', () => {
    const { result } = renderHook(() => useCursorBlink(500, true));

    // 初期状態
    expect(result.current).toBe(true);

    // 点滅間隔後
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe(false);

    // さらに点滅間隔後
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe(true);
  });

  test('無効化時は常にtrueを返す', () => {
    const { result } = renderHook(() => useCursorBlink(500, false));

    expect(result.current).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(true);
  });

  test('点滅速度を変更できる', () => {
    const { result, rerender } = renderHook(
      ({ speed }) => useCursorBlink(speed, true),
      { initialProps: { speed: 1000 } }
    );

    // 初期速度での点滅
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(false);

    // 速度変更
    rerender({ speed: 200 });

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe(true);
  });
});

describe.skip('useMultiLineTypingAnimation', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  test('複数行のタイピングが順次実行される', () => {
    const lines = ['Line 1', 'Line 2'];
    const { result } = renderHook(() =>
      useMultiLineTypingAnimation(lines, { 
        autoStart: true, 
        speed: 50, 
        lineDelay: 100 
      })
    );

    // 初期状態
    expect(result.current.currentLineIndex).toBe(0);
    expect(result.current.completedLines).toEqual([]);

    // 最初の行完了
    act(() => {
      jest.advanceTimersByTime(50 * 6); // "Line 1"
    });

    expect(result.current.currentLineState.isComplete).toBe(true);

    // 行間遅延後に次の行開始
    act(() => {
      jest.advanceTimersByTime(100 + 50); // 遅延 + 1文字
    });

    expect(result.current.completedLines).toEqual(['Line 1']);
    expect(result.current.currentLineIndex).toBe(1);
    expect(result.current.currentLineState.displayedText).toBe('L');

    // 全行完了
    act(() => {
      jest.advanceTimersByTime(50 * 5); // 残り5文字
    });

    expect(result.current.completedLines).toEqual(['Line 1', 'Line 2']);
    expect(result.current.isAllComplete).toBe(true);
  });

  test('手動制御が動作する', () => {
    const lines = ['Manual', 'Control'];
    const { result } = renderHook(() =>
      useMultiLineTypingAnimation(lines, { autoStart: false })
    );

    // 自動開始しない
    expect(result.current.currentLineState.isTyping).toBe(false);

    // 手動開始
    act(() => {
      result.current.controls.start();
    });

    expect(result.current.currentLineIndex).toBe(0);
    expect(result.current.completedLines).toEqual([]);
  });

  test('リセット機能が動作する', () => {
    const lines = ['Reset', 'Test'];
    const { result } = renderHook(() =>
      useMultiLineTypingAnimation(lines, { autoStart: true, speed: 50 })
    );

    // 途中まで進める
    act(() => {
      jest.advanceTimersByTime(50 * 3); // "Res"
    });

    expect(result.current.currentLineState.displayedText).toBe('Res');

    // リセット
    act(() => {
      result.current.controls.reset();
    });

    expect(result.current.currentLineIndex).toBe(0);
    expect(result.current.completedLines).toEqual([]);
    expect(result.current.isAllComplete).toBe(false);
  });

  test('空の行配列でもエラーが発生しない', () => {
    expect(() => {
      renderHook(() => useMultiLineTypingAnimation([]));
    }).not.toThrow();
  });
});

describe('エラーハンドリング', () => {
  test('無効なオプションでもエラーが発生しない', () => {
    expect(() => {
      renderHook(() =>
        useTypingAnimation('Test', {
          speed: -1,
          startDelay: -1,
          loopDelay: -1,
        })
      );
    }).not.toThrow();
  });

  test('空文字列でもエラーが発生しない', () => {
    expect(() => {
      renderHook(() => useTypingAnimation(''));
    }).not.toThrow();
  });
});