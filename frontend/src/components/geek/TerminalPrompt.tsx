import React from 'react';
import { TypingAnimation } from './TypingAnimation';

/**
 * ターミナルプロンプトのプロパティ
 */
interface TerminalPromptProps {
  /** ユーザー名 */
  username?: string;
  /** ホスト名 */
  hostname?: string;
  /** 現在のディレクトリ */
  directory?: string;
  /** プロンプト記号 */
  promptSymbol?: string;
  /** コマンドテキスト */
  command?: string;
  /** タイピングアニメーションを使用するかどうか */
  useTyping?: boolean;
  /** タイピング速度 */
  typingSpeed?: number;
  /** CSSクラス名 */
  className?: string;
  /** プロンプトの色テーマ */
  theme?: 'matrix' | 'hacker' | 'terminal' | 'cyber';
}

/**
 * ターミナル風のプロンプト表示コンポーネント
 */
export const TerminalPrompt: React.FC<TerminalPromptProps> = ({
  username = 'user',
  hostname = 'ai-news',
  directory = '~',
  promptSymbol = '$',
  command = '',
  useTyping = true,
  typingSpeed = 50,
  className = '',
  theme = 'matrix',
}) => {
  // テーマ別のスタイル設定
  const getThemeStyles = () => {
    switch (theme) {
      case 'matrix':
        return {
          user: 'text-green-400',
          at: 'text-green-300',
          host: 'text-green-500',
          colon: 'text-green-300',
          directory: 'text-blue-400',
          prompt: 'text-green-400',
          command: 'text-white',
        };
      case 'hacker':
        return {
          user: 'text-cyan-400',
          at: 'text-cyan-300',
          host: 'text-cyan-500',
          colon: 'text-cyan-300',
          directory: 'text-yellow-400',
          prompt: 'text-cyan-400',
          command: 'text-white',
        };
      case 'terminal':
        return {
          user: 'text-white',
          at: 'text-gray-400',
          host: 'text-white',
          colon: 'text-gray-400',
          directory: 'text-blue-300',
          prompt: 'text-white',
          command: 'text-white',
        };
      case 'cyber':
        return {
          user: 'text-purple-400',
          at: 'text-purple-300',
          host: 'text-purple-500',
          colon: 'text-purple-300',
          directory: 'text-pink-400',
          prompt: 'text-purple-400',
          command: 'text-white',
        };
      default:
        return {
          user: 'text-green-400',
          at: 'text-green-300',
          host: 'text-green-500',
          colon: 'text-green-300',
          directory: 'text-blue-400',
          prompt: 'text-green-400',
          command: 'text-white',
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div className={`font-mono-primary flex items-center ${className}`}>
      {/* ユーザー@ホスト:ディレクトリ */}
      <span className={styles.user}>{username}</span>
      <span className={styles.at}>@</span>
      <span className={styles.host}>{hostname}</span>
      <span className={styles.colon}>:</span>
      <span className={styles.directory}>{directory}</span>
      
      {/* プロンプト記号 */}
      <span className={`${styles.prompt} ml-1`}>{promptSymbol}</span>
      
      {/* コマンド部分 */}
      {command && (
        <span className={`${styles.command} ml-2`}>
          {useTyping ? (
            <TypingAnimation
              text={command}
              speed={typingSpeed}
              cursor={true}
              cursorBlinkSpeed={530}
            />
          ) : (
            command
          )}
        </span>
      )}
    </div>
  );
};

/**
 * 複数行のターミナルセッション表示コンポーネント
 */
interface TerminalSessionProps {
  /** セッションの行データ */
  lines: Array<{
    type: 'prompt' | 'output' | 'error' | 'comment';
    content: string;
    prompt?: Partial<TerminalPromptProps>;
  }>;
  /** タイピングアニメーションを使用するかどうか */
  useTyping?: boolean;
  /** 行間の遅延（ミリ秒） */
  lineDelay?: number;
  /** CSSクラス名 */
  className?: string;
  /** テーマ */
  theme?: 'matrix' | 'hacker' | 'terminal' | 'cyber';
}

export const TerminalSession: React.FC<TerminalSessionProps> = ({
  lines,
  useTyping = true,
  lineDelay = 800,
  className = '',
  theme = 'matrix',
}) => {
  const [visibleLines, setVisibleLines] = React.useState<number>(0);

  React.useEffect(() => {
    if (!useTyping) {
      setVisibleLines(lines.length);
      return;
    }

    const timer = setTimeout(() => {
      if (visibleLines < lines.length) {
        setVisibleLines(prev => prev + 1);
      }
    }, lineDelay);

    return () => clearTimeout(timer);
  }, [visibleLines, lines.length, useTyping, lineDelay]);

  const getLineStyles = (type: string) => {
    switch (type) {
      case 'output':
        return 'text-gray-300';
      case 'error':
        return 'text-red-400';
      case 'comment':
        return 'text-gray-500';
      default:
        return '';
    }
  };

  return (
    <div className={`font-mono-primary space-y-1 ${className}`}>
      {lines.slice(0, visibleLines).map((line, index) => (
        <div key={index} className="flex">
          {line.type === 'prompt' ? (
            <TerminalPrompt
              {...line.prompt}
              command={line.content}
              useTyping={useTyping && index === visibleLines - 1}
              theme={theme}
            />
          ) : (
            <div className={`${getLineStyles(line.type)} whitespace-pre-wrap`}>
              {useTyping && index === visibleLines - 1 ? (
                <TypingAnimation
                  text={line.content}
                  speed={30}
                  cursor={true}
                />
              ) : (
                line.content
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TerminalPrompt;