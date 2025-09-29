/**
 * テーマシステムのテストページ
 * 実装したギーク向けテーマの動作確認用
 */

import React, { useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import ThemeDemo from '../components/theme/ThemeDemo';
import TerminalLayout from '../components/layout/TerminalLayout';
import { ASCIILogoLarge } from '../components/layout/ASCIILogo';

interface ThemeTestPageProps {
  // 必要に応じて追加
}

const ThemeTestPage: React.FC<ThemeTestPageProps> = () => {
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light' | 'matrix' | 'cyberpunk' | 'hacker'>('dark');
  const [useTerminalLayout, setUseTerminalLayout] = useState(true);

  const handleThemeChange = (theme: typeof currentTheme) => {
    setCurrentTheme(theme);
  };

  const content = (
    <>
      <div className="space-y-8">
        {/* テーマ切り替えコントロール */}
        <div className="code-card p-4">
          <div className="text-terminal-text-primary font-mono-primary text-sm mb-4">
            <span className="syntax-comment">{`// テーマ選択`}</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {(['dark', 'light', 'matrix', 'cyberpunk', 'hacker'] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                className={`
                  terminal-button text-xs
                  ${currentTheme === theme ? 'bg-terminal-text-primary text-terminal-bg-primary' : ''}
                `}
              >
                {theme}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-terminal-text-secondary text-sm">
              <input
                type="checkbox"
                checked={useTerminalLayout}
                onChange={(e) => setUseTerminalLayout(e.target.checked)}
                className="form-checkbox"
              />
              <span>ターミナルレイアウトを使用</span>
            </label>
          </div>
        </div>

        {/* ASCII ロゴデモ */}
        <div className="code-card p-6">
          <div className="text-terminal-text-primary font-mono-primary text-sm mb-4">
            <span className="syntax-comment">{`// ASCII Logo Demo`}</span>
          </div>
          <ASCIILogoLarge />
        </div>

        {/* 既存のテーマデモ */}
        <div className="code-card p-4">
          <div className="text-terminal-text-primary font-mono-primary text-sm mb-4">
            <span className="syntax-comment">{`// Theme Components Demo`}</span>
          </div>
          <ThemeDemo />
        </div>

        {/* ターミナル風要素のデモ */}
        <div className="code-card p-4">
          <div className="text-terminal-text-primary font-mono-primary text-sm mb-4">
            <span className="syntax-comment">{`// Terminal Elements Demo`}</span>
          </div>
          <div className="space-y-4">
            {/* コードブロック風表示 */}
            <div className="bg-editor-bg-primary border border-gray-700 rounded p-4 font-mono-code text-sm">
              <div className="flex">
                <div className="line-numbers">1</div>
                <div className="pl-4">
                  <span className="syntax-keyword">const</span>{' '}
                  <span className="syntax-variable">newsData</span>{' '}
                  <span className="text-white">=</span>{' '}
                  <span className="text-white">{'{'}</span>
                </div>
              </div>
              <div className="flex">
                <div className="line-numbers">2</div>
                <div className="pl-4">
                  {'  '}<span className="syntax-string">&quot;title&quot;</span>
                  <span className="text-white">:</span>{' '}
                  <span className="syntax-string">&quot;AI技術の最新動向&quot;</span>
                  <span className="text-white">,</span>
                </div>
              </div>
              <div className="flex">
                <div className="line-numbers">3</div>
                <div className="pl-4">
                  {'  '}<span className="syntax-string">&quot;category&quot;</span>
                  <span className="text-white">:</span>{' '}
                  <span className="syntax-string">&quot;Machine Learning&quot;</span>
                  <span className="text-white">,</span>
                </div>
              </div>
              <div className="flex">
                <div className="line-numbers">4</div>
                <div className="pl-4">
                  {'  '}<span className="syntax-string">&quot;confidence&quot;</span>
                  <span className="text-white">:</span>{' '}
                  <span className="syntax-number">0.95</span>
                </div>
              </div>
              <div className="flex">
                <div className="line-numbers">5</div>
                <div className="pl-4">
                  <span className="text-white">{'}'}</span>
                </div>
              </div>
            </div>

            {/* アニメーション効果デモ */}
            <div className="space-y-2">
              <div className="typing-text text-terminal-text-primary">
                システムを初期化中...
              </div>
              <div className="text-terminal-text-accent cursor-blink">
                Ready for input
              </div>
              <div className="compile-progress">
                <div className="compile-progress-bar"></div>
              </div>
            </div>

            {/* ボタンデモ */}
            <div className="flex flex-wrap gap-2">
              <button className="terminal-button">Execute</button>
              <button className="terminal-button">Compile</button>
              <button className="terminal-button">Debug</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Head>
        <title>ターミナルレイアウトテスト | AI News Aggregator</title>
        <meta name="description" content="ギーク向けターミナルレイアウトのテストページ" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {useTerminalLayout ? (
        <TerminalLayout 
          theme={currentTheme}
          enableEffects={true}
          bootAnimation={false}
        >
          {content}
        </TerminalLayout>
      ) : (
        <div className="min-h-screen bg-background text-foreground p-8">
          <div className="container mx-auto">
            <header className="mb-8 text-center">
              <h1 className="text-3xl font-mono-primary text-terminal-text-primary mb-4">
                🚀 Terminal Layout Test
              </h1>
              <p className="text-terminal-text-muted font-mono-primary">
                ターミナル風レイアウトの動作確認ページ
              </p>
            </header>
            <main>{content}</main>
          </div>
        </div>
      )}
    </>
  );
};

export const getStaticProps: GetStaticProps<ThemeTestPageProps> = async () => {
  return {
    props: {},
  };
};

export default ThemeTestPage;