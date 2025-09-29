import React, { useState, useEffect, useCallback } from 'react';

/**
 * タイピングアニメーションのプロパティ
 */
interface TypingAnimationProps {
  /** 表示するテキスト */
  text: string;
  /** タイピング速度（ミリ秒） */
  speed?: number;
  /** カーソルを表示するかどうか */
  cursor?: boolean;
  /** カーソルの点滅速度（ミリ秒） */
  cursorBlinkSpeed?: number;
  /** アニメーション完了時のコールバック */
  onComplete?: () => void;
  /** 開始遅延（ミリ秒） */
  startDelay?: number;
  /** CSSクラス名 */
  className?: string;
  /** 自動開始するかどうか */
  autoStart?: boolean;
}

/**
 * ターミナル風のタイピングアニメーションコンポーネント
 * 文字を一文字ずつ表示し、カーソル点滅エフェクトを提供する
 */
export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  text,
  speed = 50,
  cursor = true,
  cursorBlinkSpeed = 530,
  onComplete,
  startDelay = 0,
  className = '',
  autoStart = true,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // prefers-reduced-motionの検出
  useEffect(() => {
    // window.matchMediaが利用できない環境（テスト環境など）では無効化
    if (typeof window === 'undefined' || !window.matchMedia) {
      setPrefersReducedMotion(false);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // カーソル点滅エフェクト
  useEffect(() => {
    if (!cursor) return;

    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, cursorBlinkSpeed);

    return () => clearInterval(interval);
  }, [cursor, cursorBlinkSpeed]);

  // タイピングアニメーションの開始
  const startTyping = useCallback(() => {
    setIsStarted(true);
    setCurrentIndex(0);
    setDisplayedText('');
    setIsComplete(false);
  }, []);

  // 自動開始の処理
  useEffect(() => {
    if (!autoStart) return;

    const timer = setTimeout(() => {
      startTyping();
    }, startDelay);

    return () => clearTimeout(timer);
  }, [autoStart, startDelay, startTyping]);

  // タイピングアニメーションのメイン処理
  useEffect(() => {
    if (!isStarted || isComplete || currentIndex >= text.length) {
      if (currentIndex >= text.length && !isComplete) {
        setIsComplete(true);
        onComplete?.();
      }
      return;
    }

    // prefers-reduced-motionが有効な場合は即座に全テキストを表示
    if (prefersReducedMotion) {
      setDisplayedText(text);
      setCurrentIndex(text.length);
      setIsComplete(true);
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedText(prev => prev + text[currentIndex]);
      setCurrentIndex(prev => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [currentIndex, text, speed, isComplete, isStarted, onComplete, prefersReducedMotion]);

  // アニメーション完了後のカーソル表示制御
  const shouldShowCursor = cursor && (showCursor || !isComplete);

  return (
    <span 
      className={`font-mono-primary ${className}`}
      role="status"
      aria-live="polite"
      aria-label={isComplete ? `タイピング完了: ${text}` : `タイピング中: ${displayedText}`}
    >
      {displayedText}
      {shouldShowCursor && (
        <span className="animate-pulse text-green-400" aria-hidden="true">▋</span>
      )}
    </span>
  );
};

/**
 * 複数行のタイピングアニメーションコンポーネント
 */
interface MultiLineTypingAnimationProps {
  /** 表示する行の配列 */
  lines: string[];
  /** 各行のタイピング速度（ミリ秒） */
  speed?: number;
  /** 行間の遅延（ミリ秒） */
  lineDelay?: number;
  /** カーソルを表示するかどうか */
  cursor?: boolean;
  /** アニメーション完了時のコールバック */
  onComplete?: () => void;
  /** 開始遅延（ミリ秒） */
  startDelay?: number;
  /** CSSクラス名 */
  className?: string;
}

export const MultiLineTypingAnimation: React.FC<MultiLineTypingAnimationProps> = ({
  lines,
  speed = 50,
  lineDelay = 500,
  cursor = true,
  onComplete,
  startDelay = 0,
  className = '',
}) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [completedLines, setCompletedLines] = useState<string[]>([]);
  const [isAllComplete, setIsAllComplete] = useState(false);

  // 現在の行のタイピング完了時の処理
  const handleLineComplete = useCallback(() => {
    setCompletedLines(prev => [...prev, lines[currentLineIndex]]);
    
    if (currentLineIndex < lines.length - 1) {
      setTimeout(() => {
        setCurrentLineIndex(prev => prev + 1);
      }, lineDelay);
    } else {
      setIsAllComplete(true);
      onComplete?.();
    }
  }, [currentLineIndex, lines, lineDelay, onComplete]);

  return (
    <div className={`font-mono-primary ${className}`}>
      {/* 完了した行を表示 */}
      {completedLines.map((line, index) => (
        <div key={index} className="text-green-400">
          {line}
        </div>
      ))}
      
      {/* 現在タイピング中の行 */}
      {currentLineIndex < lines.length && !isAllComplete && (
        <div>
          <TypingAnimation
            text={lines[currentLineIndex]}
            speed={speed}
            cursor={cursor}
            onComplete={handleLineComplete}
            startDelay={currentLineIndex === 0 ? startDelay : 0}
            autoStart={true}
          />
        </div>
      )}
    </div>
  );
};

export default TypingAnimation;