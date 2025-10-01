import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * タイピングアニメーションフックのオプション
 */
interface UseTypingAnimationOptions {
  /** タイピング速度（ミリ秒） */
  speed?: number;
  /** 開始遅延（ミリ秒） */
  startDelay?: number;
  /** 自動開始するかどうか */
  autoStart?: boolean;
  /** ループするかどうか */
  loop?: boolean;
  /** ループ時の遅延（ミリ秒） */
  loopDelay?: number;
}

/**
 * タイピングアニメーションの状態
 */
interface TypingAnimationState {
  /** 現在表示されているテキスト */
  displayedText: string;
  /** アニメーションが完了しているかどうか */
  isComplete: boolean;
  /** アニメーションが実行中かどうか */
  isTyping: boolean;
  /** 現在の文字インデックス */
  currentIndex: number;
}

/**
 * タイピングアニメーションの制御関数
 */
interface TypingAnimationControls {
  /** アニメーションを開始する */
  start: () => void;
  /** アニメーションを停止する */
  stop: () => void;
  /** アニメーションをリセットする */
  reset: () => void;
  /** アニメーションを一時停止する */
  pause: () => void;
  /** アニメーションを再開する */
  resume: () => void;
}

/**
 * タイピングアニメーションカスタムフック
 * 
 * @param text - 表示するテキスト
 * @param options - アニメーションオプション
 * @returns アニメーション状態と制御関数
 */
export function useTypingAnimation(
  text: string,
  options: UseTypingAnimationOptions = {}
): [TypingAnimationState, TypingAnimationControls] {
  const {
    speed = 50,
    startDelay = 0,
    autoStart = true,
    loop = false,
    loopDelay = 1000,
  } = options;

  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // タイマーをクリアする関数
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
  }, []);

  // アニメーションを開始する関数
  const start = useCallback(() => {
    clearTimers();
    setCurrentIndex(0);
    setDisplayedText('');
    setIsComplete(false);
    setIsTyping(true);
    setIsPaused(false);
  }, [clearTimers]);

  // アニメーションを停止する関数
  const stop = useCallback(() => {
    clearTimers();
    setIsTyping(false);
    setIsPaused(false);
  }, [clearTimers]);

  // アニメーションをリセットする関数
  const reset = useCallback(() => {
    clearTimers();
    setCurrentIndex(0);
    setDisplayedText('');
    setIsComplete(false);
    setIsTyping(false);
    setIsPaused(false);
  }, [clearTimers]);

  // アニメーションを一時停止する関数
  const pause = useCallback(() => {
    clearTimers();
    setIsPaused(true);
  }, [clearTimers]);

  // アニメーションを再開する関数
  const resume = useCallback(() => {
    if (isPaused && !isComplete) {
      setIsPaused(false);
      setIsTyping(true);
    }
  }, [isPaused, isComplete]);

  // 自動開始の処理
  useEffect(() => {
    if (!autoStart) return;

    startTimeoutRef.current = setTimeout(() => {
      start();
    }, startDelay);

    return () => {
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
      }
    };
  }, [autoStart, startDelay, start]);

  // タイピングアニメーションのメイン処理
  useEffect(() => {
    if (!isTyping || isPaused || isComplete || currentIndex >= text.length) {
      if (currentIndex >= text.length && isTyping && !isComplete) {
        setIsComplete(true);
        setIsTyping(false);

        // ループ処理
        if (loop) {
          timeoutRef.current = setTimeout(() => {
            start();
          }, loopDelay);
        }
      }
      return;
    }

    timeoutRef.current = setTimeout(() => {
      setDisplayedText(prev => prev + text[currentIndex]);
      setCurrentIndex(prev => prev + 1);
    }, speed);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, text, speed, isComplete, isTyping, isPaused, loop, loopDelay, start]);

  // コンポーネントのアンマウント時にタイマーをクリア
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const state: TypingAnimationState = {
    displayedText,
    isComplete,
    isTyping,
    currentIndex,
  };

  const controls: TypingAnimationControls = {
    start,
    stop,
    reset,
    pause,
    resume,
  };

  return [state, controls];
}

/**
 * カーソル点滅エフェクトのカスタムフック
 * 
 * @param blinkSpeed - 点滅速度（ミリ秒）
 * @param enabled - 点滅を有効にするかどうか
 * @returns カーソルの表示状態
 */
export function useCursorBlink(blinkSpeed: number = 530, enabled: boolean = true): boolean {
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setShowCursor(true);
      return;
    }

    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, blinkSpeed);

    return () => clearInterval(interval);
  }, [blinkSpeed, enabled]);

  return showCursor;
}

/**
 * 複数行タイピングアニメーションのカスタムフック
 * 
 * @param lines - 表示する行の配列
 * @param options - アニメーションオプション
 * @returns アニメーション状態と制御関数
 */
export function useMultiLineTypingAnimation(
  lines: string[],
  options: UseTypingAnimationOptions & { lineDelay?: number } = {}
) {
  const { lineDelay = 500, ...typingOptions } = options;
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [completedLines, setCompletedLines] = useState<string[]>([]);
  const [isAllComplete, setIsAllComplete] = useState(false);

  const [currentLineState, currentLineControls] = useTypingAnimation(
    lines[currentLineIndex] || '',
    { ...typingOptions, autoStart: false }
  );

  // 現在の行の完了を監視
  useEffect(() => {
    if (currentLineState.isComplete && currentLineIndex < lines.length) {
      setCompletedLines(prev => [...prev, lines[currentLineIndex]]);

      if (currentLineIndex < lines.length - 1) {
        setTimeout(() => {
          setCurrentLineIndex(prev => prev + 1);
        }, lineDelay);
      } else {
        setIsAllComplete(true);
      }
    }
  }, [currentLineState.isComplete, currentLineIndex, lines, lineDelay]);

  // 新しい行の開始
  useEffect(() => {
    if (currentLineIndex < lines.length && !isAllComplete) {
      currentLineControls.start();
    }
  }, [currentLineIndex, lines.length, isAllComplete, currentLineControls]);

  const start = useCallback(() => {
    setCurrentLineIndex(0);
    setCompletedLines([]);
    setIsAllComplete(false);
  }, []);

  const reset = useCallback(() => {
    setCurrentLineIndex(0);
    setCompletedLines([]);
    setIsAllComplete(false);
    currentLineControls.reset();
  }, [currentLineControls]);

  return {
    completedLines,
    currentLineState,
    currentLineIndex,
    isAllComplete,
    controls: {
      start,
      reset,
      pause: currentLineControls.pause,
      resume: currentLineControls.resume,
      stop: currentLineControls.stop,
    },
  };
}