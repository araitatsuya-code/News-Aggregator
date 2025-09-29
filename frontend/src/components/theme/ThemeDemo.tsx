/**
 * テーマシステムのデモンストレーション用コンポーネント
 * 実装したテーマとスタイルの動作確認に使用
 */

import React, { useState, useEffect } from 'react';
import { ThemeName } from '../../lib/types/theme';
import { ThemeManager } from '../../lib/utils/theme';

interface ThemeDemoProps {
  className?: string;
}

export const ThemeDemo: React.FC<ThemeDemoProps> = ({ className = '' }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('dark');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const themeManager = ThemeManager.getInstance();
    setCurrentTheme(themeManager.getCurrentTheme());
  }, []);

  const handleThemeChange = (theme: ThemeName) => {
    const themeManager = ThemeManager.getInstance();
    themeManager.applyTheme(theme);
    setCurrentTheme(theme);
  };

  const startTypingDemo = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 3000);
  };

  const themes: { value: ThemeName; label: string }[] = [
    { value: 'dark', label: 'ダーク' },
    { value: 'light', label: 'ライト' },
    { value: 'matrix', label: 'Matrix' },
    { value: 'cyberpunk', label: 'サイバーパンク' },
    { value: 'hacker', label: 'ハッカー' },
  ];

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* テーマ選択 */}
      <div className="space-y-4">
        <h2 className="text-xl font-mono-primary text-terminal-text-primary">
          🎨 テーマシステムデモ
        </h2>
        
        <div className="flex flex-wrap gap-2">
          {themes.map((theme) => (
            <button
              key={theme.value}
              onClick={() => handleThemeChange(theme.value)}
              className={`terminal-button ${
                currentTheme === theme.value ? 'glow-effect' : ''
              }`}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </div>

      {/* ターミナル風レイアウトデモ */}
      <div className="terminal-layout p-4 space-y-3">
        <div className="terminal-header">
          <span className="text-terminal-text-muted">terminal@geek-ui:~</span>
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="terminal-prompt">
            <span className="text-terminal-text-secondary">
              {isTyping ? (
                <span className="typing-text cursor-blink">
                  npm run dev -- --port 3000
                </span>
              ) : (
                'npm run dev -- --port 3000'
              )}
            </span>
          </div>
          
          <div className="text-terminal-text-muted text-sm">
            <div className="syntax-comment">{`// AI News Aggregator starting...`}</div>
            <div className="text-terminal-text-accent">✓ Server ready on http://localhost:3000</div>
            <div className="text-terminal-text-primary">✓ Theme system loaded</div>
          </div>
        </div>
      </div>

      {/* コードエディタ風デモ */}
      <div className="editor-layout">
        <div className="editor-header">
          <span className="text-gray-300">📄 news-item.tsx</span>
          <span className="text-gray-500">TypeScript React</span>
        </div>
        
        <div className="flex">
          <div className="line-numbers">
            <div>1</div>
            <div>2</div>
            <div>3</div>
            <div>4</div>
            <div>5</div>
            <div>6</div>
          </div>
          
          <div className="flex-1 p-4 text-sm">
            <div>
              <span className="syntax-keyword">interface</span>{' '}
              <span className="syntax-function">NewsItemProps</span> {'{'}
            </div>
            <div className="ml-4">
              <span className="syntax-variable">title</span>: <span className="syntax-keyword">string</span>;
            </div>
            <div className="ml-4">
              <span className="syntax-variable">category</span>: <span className="syntax-keyword">string</span>;
            </div>
            <div className="ml-4">
              <span className="syntax-comment">{`// 公開日時`}</span>
            </div>
            <div className="ml-4">
              <span className="syntax-variable">publishedAt</span>: <span className="syntax-keyword">Date</span>;
            </div>
            <div>{'}'}</div>
          </div>
        </div>
      </div>

      {/* エフェクトデモ */}
      <div className="space-y-4">
        <h3 className="text-lg font-mono-primary text-terminal-text-primary">
          ✨ エフェクトデモ
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* グロー効果 */}
          <div className="code-card p-4">
            <div className="text-terminal-text-primary glow-effect">
              グロー効果のテキスト
            </div>
          </div>
          
          {/* Matrix風テキスト */}
          <div className="code-card p-4">
            <div className="matrix-text">
              Matrix風のテキスト
            </div>
          </div>
          
          {/* サイバーパンク風アクセント */}
          <div className="code-card p-4">
            <div className="cyber-accent text-lg font-bold">
              サイバーパンク風
            </div>
          </div>
          
          {/* ASCII アート */}
          <div className="code-card p-4">
            <div className="ascii-art text-xs">
{`  _____ _____
 |  _  |     |
 |     |-   -|
 |__|__|_____|`}
            </div>
          </div>
        </div>
      </div>

      {/* アニメーションデモ */}
      <div className="space-y-4">
        <h3 className="text-lg font-mono-primary text-terminal-text-primary">
          🎬 アニメーションデモ
        </h3>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={startTypingDemo}
            className="terminal-button"
          >
            タイピングアニメーション開始
          </button>
          
          <div className="compile-progress w-48">
            <div className="compile-progress-bar"></div>
          </div>
        </div>
      </div>

      {/* カラーパレット表示 */}
      <div className="space-y-4">
        <h3 className="text-lg font-mono-primary text-terminal-text-primary">
          🎨 カラーパレット
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono-primary">
          <div className="bg-terminal-bg-primary border border-terminal-border-primary p-2 rounded">
            Primary BG
          </div>
          <div className="bg-terminal-bg-secondary border border-terminal-border-primary p-2 rounded">
            Secondary BG
          </div>
          <div className="bg-terminal-text-primary text-terminal-bg-primary p-2 rounded">
            Primary Text
          </div>
          <div className="bg-terminal-text-accent text-terminal-bg-primary p-2 rounded">
            Accent Text
          </div>
        </div>
      </div>

      {/* フォントデモ */}
      <div className="space-y-4">
        <h3 className="text-lg font-mono-primary text-terminal-text-primary">
          🔤 フォントデモ
        </h3>
        
        <div className="space-y-2">
          <div className="font-mono-primary text-terminal-text-primary">
            JetBrains Mono: The quick brown fox jumps over the lazy dog
          </div>
          <div className="font-mono-code text-terminal-text-secondary">
            Fira Code: const message = &quot;Hello, World!&quot;; // =&gt; != &gt;= &lt;=
          </div>
          <div className="font-mono-ascii text-terminal-text-muted">
            ASCII Font: |_|_|_| [===] {'{'}...{'}'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeDemo;