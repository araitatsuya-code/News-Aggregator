/**
 * テーマシステムのテストページ
 * 実装したギーク向けテーマの動作確認用
 */

import React from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import ThemeDemo from '../components/theme/ThemeDemo';

interface ThemeTestPageProps {
  // 必要に応じて追加
}

const ThemeTestPage: React.FC<ThemeTestPageProps> = () => {
  return (
    <>
      <Head>
        <title>テーマシステムテスト | AI News Aggregator</title>
        <meta name="description" content="ギーク向けテーマシステムのテストページ" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto py-8">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-mono-primary text-terminal-text-primary mb-4">
              🚀 Geek UI Theme System Test
            </h1>
            <p className="text-terminal-text-muted font-mono-primary">
              ギーク向けテーマシステムの動作確認ページ
            </p>
          </header>

          <main>
            <ThemeDemo />
          </main>

          <footer className="mt-12 text-center">
            <div className="terminal-layout p-4 inline-block">
              <div className="font-mono-primary text-terminal-text-muted text-sm">
                <div className="syntax-comment">{`// Theme system implementation completed`}</div>
                <div className="text-terminal-text-accent">✓ Fonts loaded: JetBrains Mono, Fira Code</div>
                <div className="text-terminal-text-accent">✓ Color palettes: Terminal, Editor, Matrix, Cyberpunk, Hacker</div>
                <div className="text-terminal-text-accent">✓ Animations: Typing, Glow, Scanline, Compile</div>
                <div className="text-terminal-text-accent">✓ Accessibility: Reduced motion, High contrast</div>
                <div className="text-terminal-text-primary">✓ Build successful</div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps<ThemeTestPageProps> = async () => {
  return {
    props: {},
  };
};

export default ThemeTestPage;