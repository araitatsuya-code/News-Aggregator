import React, { useState, useEffect } from 'react';
import { TerminalSession } from './TerminalPrompt';
import { TypingAnimation } from './TypingAnimation';

/**
 * ページローダーのプロパティ
 */
interface PageLoaderProps {
  /** ローディング完了時のコールバック */
  onComplete?: () => void;
  /** ローディングメッセージのカスタマイズ */
  messages?: string[];
  /** ローディング時間（ミリ秒） */
  duration?: number;
  /** テーマ */
  theme?: 'matrix' | 'hacker' | 'terminal' | 'cyber';
  /** CSSクラス名 */
  className?: string;
  /** スキップ可能かどうか */
  skippable?: boolean;
}

/**
 * ターミナル風のページローダーコンポーネント
 * ページ読み込み時にタイピングアニメーションでローディング状態を表示
 */
export const PageLoader: React.FC<PageLoaderProps> = ({
  onComplete,
  messages = [
    'Initializing AI News Aggregator...',
    'Loading neural networks...',
    'Connecting to data sources...',
    'Parsing RSS feeds...',
    'Analyzing content with AI...',
    'Rendering interface...',
    'Ready to serve the latest AI news!'
  ],
  duration = 3000,
  theme = 'matrix',
  className = '',
  skippable = true,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  // プログレスバーの更新
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (duration / 100));
        return Math.min(newProgress, 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration]);

  // ステップの自動進行
  useEffect(() => {
    if (currentStep >= messages.length) {
      setIsComplete(true);
      setTimeout(() => {
        onComplete?.();
      }, 500);
      return;
    }

    const stepDuration = duration / messages.length;
    const timer = setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, stepDuration);

    return () => clearTimeout(timer);
  }, [currentStep, messages.length, duration, onComplete]);

  // スキップ機能
  const handleSkip = () => {
    if (skippable) {
      setIsComplete(true);
      onComplete?.();
    }
  };

  // キーボードでのスキップ
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === ' ') {
        handleSkip();
      }
    };

    if (skippable) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [skippable]);

  // テーマ別のスタイル
  const getThemeStyles = () => {
    switch (theme) {
      case 'matrix':
        return {
          bg: 'bg-black',
          text: 'text-green-400',
          accent: 'text-green-300',
          progress: 'bg-green-500',
          progressBg: 'bg-green-900',
        };
      case 'hacker':
        return {
          bg: 'bg-gray-900',
          text: 'text-cyan-400',
          accent: 'text-cyan-300',
          progress: 'bg-cyan-500',
          progressBg: 'bg-cyan-900',
        };
      case 'terminal':
        return {
          bg: 'bg-black',
          text: 'text-white',
          accent: 'text-gray-400',
          progress: 'bg-white',
          progressBg: 'bg-gray-700',
        };
      case 'cyber':
        return {
          bg: 'bg-purple-900',
          text: 'text-purple-300',
          accent: 'text-pink-400',
          progress: 'bg-purple-500',
          progressBg: 'bg-purple-800',
        };
      default:
        return {
          bg: 'bg-black',
          text: 'text-green-400',
          accent: 'text-green-300',
          progress: 'bg-green-500',
          progressBg: 'bg-green-900',
        };
    }
  };

  const styles = getThemeStyles();

  if (isComplete) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center ${styles.bg} ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="loader-title"
      aria-describedby="loader-progress"
    >
      <div className="w-full max-w-2xl px-8">
        {/* ASCII アートロゴ */}
        <div className={`${styles.text} text-center mb-8 font-mono-primary text-sm`}>
          <pre className="whitespace-pre" id="loader-title" aria-label="AI News Aggregator Loading">
{`
    ___    ____   _   __                     
   /   |  /  _/  / | / /___  _      _______
  / /| |  / /   /  |/ / __ \\| | /| / / ___/
 / ___ |_/ /   / /|  / /_/ /| |/ |/ (__  ) 
/_/  |_/___/  /_/ |_/\\____/ |__/|__/____/  
                                           
        Aggregator Loading...
`}
          </pre>
        </div>

        {/* ローディングメッセージ */}
        <div className="space-y-2 mb-8">
          {messages.slice(0, currentStep + 1).map((message, index) => (
            <div key={index} className={`${styles.text} font-mono-primary`}>
              <span className={styles.accent}>[{String(index + 1).padStart(2, '0')}]</span>
              {' '}
              {index === currentStep ? (
                <TypingAnimation
                  text={message}
                  speed={30}
                  cursor={true}
                />
              ) : (
                <span>{message}</span>
              )}
              {index < currentStep && (
                <span className="text-green-500 ml-2">✓</span>
              )}
            </div>
          ))}
        </div>

        {/* プログレスバー */}
        <div className="mb-4">
          <div className={`w-full h-2 ${styles.progressBg} rounded-full overflow-hidden`}>
            <div
              className={`h-full ${styles.progress} transition-all duration-300 ease-out`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div 
            className={`${styles.accent} font-mono-primary text-sm mt-2 text-center`}
            id="loader-progress"
            aria-live="polite"
          >
            {Math.round(progress)}% Complete
          </div>
        </div>

        {/* スキップボタン */}
        {skippable && (
          <div className={`${styles.accent} font-mono-primary text-sm text-center`}>
            Press <span className={styles.text}>ESC</span> or{' '}
            <span className={styles.text}>SPACE</span> to skip
          </div>
        )}

        {/* スキャンライン効果 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent animate-pulse" />
        </div>
      </div>
    </div>
  );
};

/**
 * シンプルなタイピングローダーコンポーネント
 */
interface SimpleTypingLoaderProps {
  /** 表示するメッセージ */
  message?: string;
  /** ローディング完了時のコールバック */
  onComplete?: () => void;
  /** テーマ */
  theme?: 'matrix' | 'hacker' | 'terminal' | 'cyber';
  /** CSSクラス名 */
  className?: string;
}

export const SimpleTypingLoader: React.FC<SimpleTypingLoaderProps> = ({
  message = 'Loading...',
  onComplete,
  theme = 'matrix',
  className = '',
}) => {
  const getThemeColor = () => {
    switch (theme) {
      case 'matrix':
        return 'text-green-400';
      case 'hacker':
        return 'text-cyan-400';
      case 'terminal':
        return 'text-white';
      case 'cyber':
        return 'text-purple-400';
      default:
        return 'text-green-400';
    }
  };

  return (
    <div className={`font-mono-primary ${getThemeColor()} ${className}`}>
      <TypingAnimation
        text={message}
        speed={50}
        cursor={true}
        onComplete={onComplete}
      />
    </div>
  );
};

export default PageLoader;