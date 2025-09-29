import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import {
    TypingAnimation,
    MultiLineTypingAnimation,
    TerminalPrompt,
    TerminalSession,
    PageLoader,
    SimpleTypingLoader,
    useTypingAnimation,
    useCursorBlink,
} from '../components/geek';

/**
 * タイピングアニメーションのデモページ
 */
const TypingDemoPage: NextPage = () => {
    const [showLoader, setShowLoader] = useState(false);
    const [theme, setTheme] = useState<'matrix' | 'hacker' | 'terminal' | 'cyber'>('matrix');

    // カスタムフックのデモ
    const [typingState, typingControls] = useTypingAnimation(
        'console.log("Hello, AI News Aggregator!");',
        { autoStart: false, speed: 80 }
    );

    const showCursor = useCursorBlink(500, true);

    // ターミナルセッションのデモデータ
    const terminalLines = [
        {
            type: 'prompt' as const,
            content: 'cd /ai-news-aggregator',
            prompt: { username: 'developer', hostname: 'localhost', directory: '~' }
        },
        {
            type: 'prompt' as const,
            content: 'npm run dev',
            prompt: { username: 'developer', hostname: 'localhost', directory: '/ai-news-aggregator' }
        },
        {
            type: 'output' as const,
            content: '> ai-news-aggregator@1.0.0 dev\n> next dev'
        },
        {
            type: 'output' as const,
            content: 'ready - started server on 0.0.0.0:3000, url: http://localhost:3000'
        },
        {
            type: 'output' as const,
            content: 'info  - Loaded env from .env.local'
        },
        {
            type: 'output' as const,
            content: 'event - compiled client and server successfully'
        }
    ];

    // 複数行タイピングのデモデータ
    const multiLineText = [
        '// AI News Aggregator - ギーク向けUI',
        'import { TypingAnimation } from "./components/geek";',
        '',
        'function App() {',
        '  return (',
        '    <TypingAnimation',
        '      text="Welcome to the Matrix..."',
        '      speed={50}',
        '      cursor={true}',
        '    />',
        '  );',
        '}'
    ];

    return (
        <>
            <Head>
                <title>タイピングアニメーション デモ | AI News Aggregator</title>
                <meta name="description" content="ギーク向けタイピングアニメーションコンポーネントのデモページ" />
            </Head>

            {/* ページローダー */}
            {showLoader && (
                <PageLoader
                    theme={theme}
                    onComplete={() => setShowLoader(false)}
                    skippable={true}
                />
            )}

            <div className="min-h-screen bg-terminal-bg-primary text-terminal-text-primary p-8">
                <div className="max-w-6xl mx-auto space-y-12">

                    {/* ヘッダー */}
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-mono-primary text-terminal-text-primary">
                            <TypingAnimation
                                text="タイピングアニメーション デモ"
                                speed={100}
                                cursor={true}
                            />
                        </h1>
                        <p className="text-terminal-text-muted font-mono-primary">
                            ギーク向けUIコンポーネントの動作確認
                        </p>
                    </div>

                    {/* テーマ切り替え */}
                    <div className="bg-terminal-bg-secondary p-6 rounded-lg border border-terminal-border-primary">
                        <h2 className="text-xl font-mono-primary text-terminal-text-accent mb-4">
                            テーマ設定
                        </h2>
                        <div className="flex flex-wrap gap-4">
                            {(['matrix', 'hacker', 'terminal', 'cyber'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className={`px-4 py-2 rounded font-mono-primary text-sm border transition-all ${theme === t
                                        ? 'bg-terminal-text-primary text-terminal-bg-primary border-terminal-text-primary'
                                        : 'bg-terminal-bg-accent text-terminal-text-primary border-terminal-border-primary hover:border-terminal-border-accent'
                                        }`}
                                >
                                    {t.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 基本的なタイピングアニメーション */}
                    <div className="bg-terminal-bg-secondary p-6 rounded-lg border border-terminal-border-primary">
                        <h2 className="text-xl font-mono-primary text-terminal-text-accent mb-4">
                            基本的なタイピングアニメーション
                        </h2>
                        <div className="space-y-4">
                            <div className="bg-terminal-bg-primary p-4 rounded border border-terminal-border-primary">
                                <TypingAnimation
                                    text="Hello, World! This is a typing animation demo."
                                    speed={50}
                                    cursor={true}
                                />
                            </div>
                            <div className="bg-terminal-bg-primary p-4 rounded border border-terminal-border-primary">
                                <TypingAnimation
                                    text="Fast typing animation with different speed."
                                    speed={20}
                                    cursor={true}
                                    cursorBlinkSpeed={300}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 複数行タイピングアニメーション */}
                    <div className="bg-terminal-bg-secondary p-6 rounded-lg border border-terminal-border-primary">
                        <h2 className="text-xl font-mono-primary text-terminal-text-accent mb-4">
                            複数行タイピングアニメーション
                        </h2>
                        <div className="bg-terminal-bg-primary p-4 rounded border border-terminal-border-primary">
                            <MultiLineTypingAnimation
                                lines={multiLineText}
                                speed={30}
                                lineDelay={300}
                                cursor={true}
                            />
                        </div>
                    </div>

                    {/* ターミナルプロンプト */}
                    <div className="bg-terminal-bg-secondary p-6 rounded-lg border border-terminal-border-primary">
                        <h2 className="text-xl font-mono-primary text-terminal-text-accent mb-4">
                            ターミナルプロンプト
                        </h2>
                        <div className="space-y-4">
                            <div className="bg-terminal-bg-primary p-4 rounded border border-terminal-border-primary">
                                <TerminalPrompt
                                    username="user"
                                    hostname="ai-news"
                                    directory="~"
                                    command="ls -la"
                                    theme={theme}
                                    useTyping={true}
                                />
                            </div>
                            <div className="bg-terminal-bg-primary p-4 rounded border border-terminal-border-primary">
                                <TerminalPrompt
                                    username="developer"
                                    hostname="localhost"
                                    directory="/projects/ai-news"
                                    command="npm start"
                                    theme={theme}
                                    useTyping={true}
                                    typingSpeed={40}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ターミナルセッション */}
                    <div className="bg-terminal-bg-secondary p-6 rounded-lg border border-terminal-border-primary">
                        <h2 className="text-xl font-mono-primary text-terminal-text-accent mb-4">
                            ターミナルセッション
                        </h2>
                        <div className="bg-terminal-bg-primary p-4 rounded border border-terminal-border-primary">
                            <TerminalSession
                                lines={terminalLines}
                                theme={theme}
                                useTyping={true}
                                lineDelay={1000}
                            />
                        </div>
                    </div>

                    {/* カスタムフックデモ */}
                    <div className="bg-terminal-bg-secondary p-6 rounded-lg border border-terminal-border-primary">
                        <h2 className="text-xl font-mono-primary text-terminal-text-accent mb-4">
                            カスタムフック制御
                        </h2>
                        <div className="space-y-4">
                            <div className="bg-terminal-bg-primary p-4 rounded border border-terminal-border-primary">
                                <div className="font-mono-primary">
                                    {typingState.displayedText}
                                    {showCursor && <span className="text-terminal-text-accent">▋</span>}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={typingControls.start}
                                    className="px-3 py-1 bg-terminal-bg-accent text-terminal-text-primary border border-terminal-border-primary rounded font-mono-primary text-sm hover:border-terminal-border-accent transition-colors"
                                >
                                    開始
                                </button>
                                <button
                                    onClick={typingControls.pause}
                                    className="px-3 py-1 bg-terminal-bg-accent text-terminal-text-primary border border-terminal-border-primary rounded font-mono-primary text-sm hover:border-terminal-border-accent transition-colors"
                                >
                                    一時停止
                                </button>
                                <button
                                    onClick={typingControls.resume}
                                    className="px-3 py-1 bg-terminal-bg-accent text-terminal-text-primary border border-terminal-border-primary rounded font-mono-primary text-sm hover:border-terminal-border-accent transition-colors"
                                >
                                    再開
                                </button>
                                <button
                                    onClick={typingControls.reset}
                                    className="px-3 py-1 bg-terminal-bg-accent text-terminal-text-primary border border-terminal-border-primary rounded font-mono-primary text-sm hover:border-terminal-border-accent transition-colors"
                                >
                                    リセット
                                </button>
                            </div>
                            <div className="text-sm font-mono-primary text-terminal-text-muted">
                                状態: {typingState.isTyping ? 'タイピング中' : typingState.isComplete ? '完了' : '停止中'} |
                                進行: {typingState.currentIndex}/{typingState.displayedText.length + (typingState.isComplete ? 0 : 1)}
                            </div>
                        </div>
                    </div>

                    {/* シンプルローダー */}
                    <div className="bg-terminal-bg-secondary p-6 rounded-lg border border-terminal-border-primary">
                        <h2 className="text-xl font-mono-primary text-terminal-text-accent mb-4">
                            シンプルローダー
                        </h2>
                        <div className="bg-terminal-bg-primary p-4 rounded border border-terminal-border-primary">
                            <SimpleTypingLoader
                                message="データを読み込み中..."
                                theme={theme}
                            />
                        </div>
                    </div>

                    {/* ページローダーテスト */}
                    <div className="bg-terminal-bg-secondary p-6 rounded-lg border border-terminal-border-primary">
                        <h2 className="text-xl font-mono-primary text-terminal-text-accent mb-4">
                            ページローダー
                        </h2>
                        <button
                            onClick={() => setShowLoader(true)}
                            className="px-6 py-3 bg-terminal-text-primary text-terminal-bg-primary rounded font-mono-primary hover:bg-terminal-text-accent transition-colors"
                        >
                            ページローダーを表示
                        </button>
                    </div>

                    {/* フッター */}
                    <div className="text-center text-terminal-text-muted font-mono-primary text-sm">
                        <TypingAnimation
                            text="Demo completed successfully. Press F5 to reload."
                            speed={30}
                            cursor={false}
                            startDelay={1000}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default TypingDemoPage;