import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { TerminalError, TerminalErrorInfo } from '../components/geek/TerminalError';
import { ASCIILoader, MultiLineASCIILoader } from '../components/geek/ASCIILoader';
import { CompileFeedback, CompileStep } from '../components/geek/CompileFeedback';

/**
 * エラーハンドリングデモページ
 * ターミナル風エラーハンドリングシステムの動作確認用
 */
const ErrorHandlingDemo: NextPage = () => {
  const [currentDemo, setCurrentDemo] = useState<'error' | 'loading' | 'compile'>('error');
  const [isLoading, setIsLoading] = useState(false);
  const [compileSteps, setCompileSteps] = useState<CompileStep[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('');

  // サンプルエラー情報
  const sampleErrors: TerminalErrorInfo[] = [
    {
      type: 'error',
      code: '404',
      message: 'ニュースデータが見つかりません',
      stack: 'at NewsService.getLatestNews (newsService.ts:42)\nat HomePage.render (index.tsx:18)',
      timestamp: new Date(),
      retryable: true
    },
    {
      type: 'warning',
      code: 'CACHE',
      message: 'キャッシュデータが古い可能性があります',
      timestamp: new Date(),
      retryable: false
    },
    {
      type: 'info',
      message: 'キャッシュから25件の記事を読み込みました',
      timestamp: new Date(),
      retryable: false
    }
  ];

  // ASCII アートサンプル
  const asciiArt = [
    "╔══════════════════════════════╗",
    "║        AI NEWS SYSTEM        ║",
    "║                              ║",
    "║  [████████████████████████]  ║",
    "║                              ║",
    "║     システム初期化中...      ║",
    "╚══════════════════════════════╝"
  ];

  // コンパイルデモの実行
  const runCompileDemo = () => {
    const steps: CompileStep[] = [
      {
        id: 'init',
        message: 'システムを初期化しています...',
        status: 'compiling'
      },
      {
        id: 'fetch',
        message: 'ニュースデータを取得しています...',
        status: 'compiling'
      },
      {
        id: 'process',
        message: 'データを処理しています...',
        status: 'compiling'
      },
      {
        id: 'render',
        message: 'UIをレンダリングしています...',
        status: 'compiling'
      }
    ];

    setCompileSteps(steps);
    setCurrentStep('init');

    // ステップを順次完了させる
    const completeStep = (stepId: string, status: 'success' | 'error' | 'warning', delay: number) => {
      setTimeout(() => {
        setCompileSteps(prev => prev.map(step => 
          step.id === stepId 
            ? { ...step, status, duration: Math.floor(Math.random() * 500) + 100 }
            : step
        ));
      }, delay);
    };

    completeStep('init', 'success', 1000);
    setTimeout(() => setCurrentStep('fetch'), 1000);
    
    completeStep('fetch', 'success', 2000);
    setTimeout(() => setCurrentStep('process'), 2000);
    
    completeStep('process', 'warning', 3000);
    setTimeout(() => setCurrentStep('render'), 3000);
    
    completeStep('render', 'success', 4000);
    setTimeout(() => setCurrentStep(''), 4000);
  };

  // ローディングデモの実行
  const runLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 5000);
  };

  const handleRetry = () => {
    console.log('リトライが実行されました');
    // 実際のリトライ処理をここに実装
  };

  return (
    <>
      <Head>
        <title>エラーハンドリングデモ - AI News Aggregator</title>
        <meta name="description" content="ターミナル風エラーハンドリングシステムのデモ" />
      </Head>

      <div className="min-h-screen bg-black text-green-400 p-8">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="mb-8">
            <h1 className="text-2xl font-mono mb-4">
              $ ./error-handling-demo --interactive
            </h1>
            <p className="text-gray-400 font-mono">
              ターミナル風エラーハンドリングシステムのデモンストレーション
            </p>
          </div>

          {/* デモ選択 */}
          <div className="mb-8">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setCurrentDemo('error')}
                className={`
                  px-4 py-2 font-mono border rounded
                  ${currentDemo === 'error' 
                    ? 'border-green-400 bg-green-400/10 text-green-400' 
                    : 'border-gray-600 text-gray-400 hover:border-gray-400'
                  }
                  transition-colors duration-200
                `}
              >
                エラー表示
              </button>
              <button
                onClick={() => setCurrentDemo('loading')}
                className={`
                  px-4 py-2 font-mono border rounded
                  ${currentDemo === 'loading' 
                    ? 'border-green-400 bg-green-400/10 text-green-400' 
                    : 'border-gray-600 text-gray-400 hover:border-gray-400'
                  }
                  transition-colors duration-200
                `}
              >
                ローディング
              </button>
              <button
                onClick={() => setCurrentDemo('compile')}
                className={`
                  px-4 py-2 font-mono border rounded
                  ${currentDemo === 'compile' 
                    ? 'border-green-400 bg-green-400/10 text-green-400' 
                    : 'border-gray-600 text-gray-400 hover:border-gray-400'
                  }
                  transition-colors duration-200
                `}
              >
                コンパイル
              </button>
            </div>
          </div>

          {/* デモ内容 */}
          <div className="space-y-6">
            {currentDemo === 'error' && (
              <div>
                <h2 className="text-lg font-mono mb-4 text-green-400">
                  # TerminalError コンポーネント
                </h2>
                <div className="space-y-4">
                  {sampleErrors.map((error, index) => (
                    <TerminalError
                      key={index}
                      error={error}
                      onRetry={error.retryable ? handleRetry : undefined}
                      animated={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {currentDemo === 'loading' && (
              <div>
                <h2 className="text-lg font-mono mb-4 text-green-400">
                  # ASCIILoader コンポーネント
                </h2>
                
                <div className="space-y-6">
                  {/* 基本ローダー */}
                  <div className="space-y-4">
                    <h3 className="font-mono text-gray-300">基本ローダー:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ASCIILoader type="spinner" message="スピナー読み込み中..." />
                      <ASCIILoader type="dots" message="ドット読み込み中..." />
                      <ASCIILoader type="bars" message="バー読み込み中..." />
                      <ASCIILoader type="terminal" message="ターミナル読み込み中..." />
                    </div>
                  </div>

                  {/* マトリックスローダー */}
                  <div>
                    <h3 className="font-mono text-gray-300 mb-4">マトリックスローダー:</h3>
                    <ASCIILoader type="matrix" message="システム初期化中..." />
                  </div>

                  {/* 複数行ASCIIローダー */}
                  <div>
                    <h3 className="font-mono text-gray-300 mb-4">複数行ASCIIローダー:</h3>
                    <button
                      onClick={runLoadingDemo}
                      className="mb-4 px-4 py-2 border border-green-400 text-green-400 hover:bg-green-400/10 rounded font-mono"
                      disabled={isLoading}
                    >
                      {isLoading ? '実行中...' : 'デモ実行'}
                    </button>
                    {isLoading && (
                      <MultiLineASCIILoader
                        lines={asciiArt}
                        message="AI News Systemを起動しています..."
                        speed={200}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentDemo === 'compile' && (
              <div>
                <h2 className="text-lg font-mono mb-4 text-green-400">
                  # CompileFeedback コンポーネント
                </h2>
                
                <button
                  onClick={runCompileDemo}
                  className="mb-6 px-4 py-2 border border-green-400 text-green-400 hover:bg-green-400/10 rounded font-mono"
                >
                  コンパイルデモ実行
                </button>

                {compileSteps.length > 0 && (
                  <CompileFeedback
                    steps={compileSteps}
                    currentStep={currentStep}
                    onComplete={(success) => {
                      console.log('コンパイル完了:', success);
                    }}
                    showProgress={true}
                    autoScroll={true}
                  />
                )}
              </div>
            )}
          </div>

          {/* フッター */}
          <div className="mt-12 pt-8 border-t border-gray-700">
            <p className="text-gray-500 font-mono text-sm">
              $ exit # デモを終了するには戻るボタンを使用してください
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ErrorHandlingDemo;