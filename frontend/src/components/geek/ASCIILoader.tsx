import React, { useState, useEffect } from 'react';

/**
 * ASCII ローダーのタイプ
 */
export type LoaderType = 'spinner' | 'dots' | 'bars' | 'matrix' | 'terminal';

/**
 * ASCIILoaderコンポーネントのプロパティ
 */
export interface ASCIILoaderProps {
  type?: LoaderType;
  message?: string;
  speed?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

/**
 * スピナー型のASCIIフレーム
 */
const SPINNER_FRAMES = [
  "⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"
];

/**
 * ドット型のASCIIフレーム
 */
const DOTS_FRAMES = [
  "⠁", "⠂", "⠄", "⡀", "⢀", "⠠", "⠐", "⠈"
];

/**
 * バー型のASCIIフレーム
 */
const BARS_FRAMES = [
  "▁", "▂", "▃", "▄", "▅", "▆", "▇", "█", "▇", "▆", "▅", "▄", "▃", "▂"
];

/**
 * マトリックス風のASCIIフレーム
 */
const MATRIX_FRAMES = [
  "╔══════════╗\n║ LOADING  ║\n╚══════════╝",
  "╔══════════╗\n║ LOADING. ║\n╚══════════╝",
  "╔══════════╗\n║ LOADING..║\n╚══════════╝",
  "╔══════════╗\n║ LOADING..║\n╚══════════╝"
];

/**
 * ターミナル風のASCIIフレーム
 */
const TERMINAL_FRAMES = [
  "[    ] 0%",
  "[=   ] 25%", 
  "[==  ] 50%",
  "[=== ] 75%",
  "[====] 100%",
  "[=== ] 75%",
  "[==  ] 50%",
  "[=   ] 25%"
];

/**
 * フレームセットのマッピング
 */
const FRAME_SETS = {
  spinner: SPINNER_FRAMES,
  dots: DOTS_FRAMES,
  bars: BARS_FRAMES,
  matrix: MATRIX_FRAMES,
  terminal: TERMINAL_FRAMES
};

/**
 * サイズ別のスタイル設定
 */
const SIZE_STYLES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
};

/**
 * ASCII アニメーション付きローディングコンポーネント
 * 
 * 機能:
 * - 複数種類のASCIIアニメーション
 * - カスタマイズ可能な速度とメッセージ
 * - レスポンシブサイズ対応
 */
export const ASCIILoader: React.FC<ASCIILoaderProps> = ({
  type = 'spinner',
  message = 'Loading...',
  speed = 100,
  className = '',
  size = 'md',
  color = 'text-green-400'
}) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const frames = FRAME_SETS[type];

  // アニメーション制御
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % frames.length);
    }, speed);

    return () => clearInterval(interval);
  }, [frames.length, speed]);

  const currentFrame = frames[frameIndex];
  const sizeClass = SIZE_STYLES[size];

  // マトリックス型の場合は特別な表示
  if (type === 'matrix') {
    return (
      <div 
        className={`font-mono ${sizeClass} ${color} ${className}`}
        role="status"
        aria-label={message}
      >
        <pre className="whitespace-pre-line text-center">
          {currentFrame}
        </pre>
        {message && message !== 'Loading...' && (
          <div className="text-center mt-2 text-gray-400">
            {message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`font-mono ${sizeClass} flex items-center space-x-2 ${className}`}
      role="status"
      aria-label={message}
    >
      {/* アニメーションフレーム */}
      <span className={`${color} select-none`}>
        {type === 'terminal' ? (
          currentFrame
        ) : (
          `[${currentFrame}]`
        )}
      </span>
      
      {/* メッセージ */}
      {message && (
        <span className="text-gray-300">
          {message}
        </span>
      )}
    </div>
  );
};

/**
 * 複数行のASCIIアートローダー
 */
export interface MultiLineASCIILoaderProps {
  lines: string[];
  message?: string;
  speed?: number;
  className?: string;
  color?: string;
}

export const MultiLineASCIILoader: React.FC<MultiLineASCIILoaderProps> = ({
  lines,
  message,
  speed = 150,
  className = '',
  color = 'text-green-400'
}) => {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines >= lines.length) return;

    const timer = setTimeout(() => {
      setVisibleLines(prev => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [visibleLines, lines.length, speed]);

  return (
    <div 
      className={`font-mono ${color} ${className}`}
      role="status"
      aria-label={message}
    >
      <pre className="whitespace-pre-line">
        {lines.slice(0, visibleLines).join('\n')}
        {visibleLines < lines.length && (
          <span className="animate-pulse">_</span>
        )}
      </pre>
      {message && (
        <div className="text-center mt-2 text-gray-400">
          {message}
        </div>
      )}
    </div>
  );
};

export default ASCIILoader;