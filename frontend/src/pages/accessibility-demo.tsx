import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';

// アクセシブルなコンポーネントのインポート
import { AccessibleTerminalNewsItem } from '../components/geek/AccessibleTerminalNewsItem';
import { AccessibleGeekNavigation, AccessibleMobileGeekNavigation } from '../components/geek/AccessibleGeekNavigation';

// ユーティリティのインポート
import { useReducedMotion } from '../lib/utils/motionPreferences';
import { getWCAGCompliantTheme, validateColorAccessibility } from '../lib/utils/colorContrast';
import { generateScreenReaderText } from '../lib/utils/accessibility';

// 型定義
import { NewsItem } from '../lib/types';

/**
 * アクセシビリティデモページ
 */
const AccessibilityDemo: React.FC = () => {
    const { t } = useTranslation('common');
    const [currentPage, setCurrentPage] = useState('accessibility');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
    const [isClient, setIsClient] = useState(false);
    const [announceText, setAnnounceText] = useState('');
    const [colorValidation, setColorValidation] = useState<Record<string, any>>({});

    const prefersReducedMotion = useReducedMotion();

    // クライアントサイドでのマウント検出
    useEffect(() => {
        setIsClient(true);
    }, []);

    // 画面サイズの検出
    useEffect(() => {
        if (!isClient) return;

        const checkScreenSize = () => {
            const width = window.innerWidth;
            if (width < 640) {
                setScreenSize('mobile');
            } else if (width < 1024) {
                setScreenSize('tablet');
            } else {
                setScreenSize('desktop');
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, [isClient]);

    // カラーバリデーションの実行
    useEffect(() => {
        const colors = getWCAGCompliantTheme(theme);
        const validation = validateColorAccessibility(
            {
                primary: colors.text.primary,
                secondary: colors.text.secondary,
                muted: colors.text.muted,
                accent: colors.text.accent,
                link: colors.text.link,
                warning: colors.text.warning,
                error: colors.text.error,
                success: colors.text.success,
            },
            colors.background.primary
        );
        setColorValidation(validation);
    }, [theme]);

    // サンプルデータ
    const sampleNews: NewsItem[] = [
        {
            id: '1',
            title: 'アクセシビリティ対応のAIニュースアグリゲーター',
            original_title: 'Accessible AI News Aggregator',
            url: 'https://example.com/news/1',
            summary: 'WCAG 2.1 AA基準に準拠したアクセシブルなニュースリーダーの実装について説明します。',
            published_at: '2025-01-01T10:00:00Z',
            source: 'Accessibility Today',
            category: 'Accessibility',
            language: 'ja',
            ai_confidence: 0.98,
            tags: ['Accessibility', 'WCAG', 'Screen Reader', 'Keyboard Navigation'],
        },
        {
            id: '2',
            title: 'スクリーンリーダー対応のWebアプリケーション設計',
            original_title: 'Screen Reader Friendly Web Application Design',
            url: 'https://example.com/news/2',
            summary: 'ARIAラベル、セマンティックHTML、フォーカス管理などの重要な要素について解説します。',
            published_at: '2025-01-01T09:30:00Z',
            source: 'Web Standards Weekly',
            category: 'Web Development',
            language: 'ja',
            ai_confidence: 0.94,
            tags: ['ARIA', 'Semantic HTML', 'Focus Management', 'Web Standards'],
        },
        {
            id: '3',
            title: 'カラーコントラストとユーザビリティ',
            original_title: 'Color Contrast and Usability',
            url: 'https://example.com/news/3',
            summary: 'WCAG基準を満たすカラーコントラストの重要性と実装方法について詳しく説明します。',
            published_at: '2025-01-01T08:45:00Z',
            source: 'UX Design Journal',
            category: 'UX Design',
            language: 'ja',
            ai_confidence: 0.91,
            tags: ['Color Contrast', 'WCAG', 'Visual Design', 'Usability'],
        },
    ];

    const navigationItems = [
        {
            id: 'accessibility',
            label: 'アクセシビリティ',
            icon: '♿',
            enabled: true,
            description: 'アクセシビリティ機能のデモ'
        },
        {
            id: 'keyboard',
            label: 'キーボード',
            icon: '⌨️',
            enabled: true,
            description: 'キーボードナビゲーションのテスト'
        },
        {
            id: 'contrast',
            label: 'コントラスト',
            icon: '🎨',
            enabled: true,
            description: 'カラーコントラストの検証'
        },
        {
            id: 'motion',
            label: 'モーション',
            icon: '🎬',
            enabled: true,
            description: 'アニメーション設定のテスト'
        },
        {
            id: 'screen-reader',
            label: 'スクリーンリーダー',
            icon: '🔊',
            enabled: true,
            description: 'スクリーンリーダー対応のテスト'
        },
    ];

    // WCAG準拠のカラーテーマを取得
    const colors = getWCAGCompliantTheme(theme);

    const renderContent = () => {
        switch (currentPage) {
            case 'accessibility':
                return (
                    <div className="space-y-6">
                        <section>
                            <h2 className="text-2xl font-mono mb-4" style={{ color: colors.text.accent }}>
                                アクセシビリティ機能デモ
                            </h2>
                            <div className="space-y-4">
                                <div className="p-4 rounded-lg border" style={{
                                    backgroundColor: colors.background.secondary,
                                    borderColor: colors.border.primary
                                }}>
                                    <h3 className="text-lg font-mono mb-2" style={{ color: colors.text.primary }}>
                                        実装済み機能
                                    </h3>
                                    <ul className="space-y-2 text-sm" style={{ color: colors.text.secondary }}>
                                        <li>✅ WCAG 2.1 AA準拠のカラーコントラスト</li>
                                        <li>✅ ARIAラベルとセマンティックHTML</li>
                                        <li>✅ キーボードナビゲーション対応</li>
                                        <li>✅ スクリーンリーダー対応</li>
                                        <li>✅ prefers-reduced-motion対応</li>
                                        <li>✅ フォーカス管理とインジケーター</li>
                                        <li>✅ ライブリージョンによる動的コンテンツ通知</li>
                                    </ul>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-mono" style={{ color: colors.text.primary }}>
                                        アクセシブルなニュース記事
                                    </h3>
                                    {sampleNews.map((article, index) => (
                                        <AccessibleTerminalNewsItem
                                            key={article.id}
                                            article={article}
                                            lineNumber={(index + 1) * 10}
                                            theme={theme}
                                            showSummary={screenSize !== 'mobile'}
                                            onFocus={() => setAnnounceText(`記事 ${index + 1} にフォーカスしました`)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                );

            case 'keyboard':
                return (
                    <div className="space-y-6">
                        <section>
                            <h2 className="text-2xl font-mono mb-4" style={{ color: colors.text.accent }}>
                                キーボードナビゲーション
                            </h2>
                            <div className="p-4 rounded-lg border mb-6" style={{
                                backgroundColor: colors.background.secondary,
                                borderColor: colors.border.primary
                            }}>
                                <h3 className="text-lg font-mono mb-2" style={{ color: colors.text.primary }}>
                                    キーボードショートカット
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ color: colors.text.secondary }}>
                                    <div>
                                        <strong>基本操作:</strong>
                                        <ul className="mt-2 space-y-1">
                                            <li><kbd className="px-2 py-1 bg-gray-700 rounded">Tab</kbd> - 次の要素へ</li>
                                            <li><kbd className="px-2 py-1 bg-gray-700 rounded">Shift+Tab</kbd> - 前の要素へ</li>
                                            <li><kbd className="px-2 py-1 bg-gray-700 rounded">Enter</kbd> - アクティベート</li>
                                            <li><kbd className="px-2 py-1 bg-gray-700 rounded">Space</kbd> - アクティベート</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <strong>ナビゲーション:</strong>
                                        <ul className="mt-2 space-y-1">
                                            <li><kbd className="px-2 py-1 bg-gray-700 rounded">↑↓</kbd> - 縦方向移動</li>
                                            <li><kbd className="px-2 py-1 bg-gray-700 rounded">←→</kbd> - 横方向移動</li>
                                            <li><kbd className="px-2 py-1 bg-gray-700 rounded">Home</kbd> - 最初の要素へ</li>
                                            <li><kbd className="px-2 py-1 bg-gray-700 rounded">End</kbd> - 最後の要素へ</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p style={{ color: colors.text.secondary }}>
                                    以下のニュース記事でキーボードナビゲーションをテストしてください：
                                </p>
                                {sampleNews.slice(0, 2).map((article, index) => (
                                    <AccessibleTerminalNewsItem
                                        key={article.id}
                                        article={article}
                                        lineNumber={(index + 1) * 10}
                                        theme={theme}
                                        showSummary={false}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>
                );

            case 'contrast':
                return (
                    <div className="space-y-6">
                        <section>
                            <h2 className="text-2xl font-mono mb-4" style={{ color: colors.text.accent }}>
                                カラーコントラスト検証
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 rounded-lg border" style={{
                                    backgroundColor: colors.background.secondary,
                                    borderColor: colors.border.primary
                                }}>
                                    <h3 className="text-lg font-mono mb-4" style={{ color: colors.text.primary }}>
                                        現在のテーマ: {theme === 'dark' ? 'ダーク' : 'ライト'}
                                    </h3>

                                    <div className="space-y-2 text-sm">
                                        {Object.entries(colorValidation).map(([colorName, validation]) => (
                                            <div key={colorName} className="flex items-center justify-between">
                                                <span style={{ color: colors.text.secondary }}>
                                                    {colorName}:
                                                </span>
                                                <div className="flex items-center space-x-2">
                                                    <span style={{ color: validation.passes ? colors.text.success : colors.text.error }}>
                                                        {validation.passes ? '✅' : '❌'}
                                                    </span>
                                                    <span style={{ color: colors.text.muted }}>
                                                        {validation.ratio.toFixed(2)}:1
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg border" style={{
                                    backgroundColor: colors.background.secondary,
                                    borderColor: colors.border.primary
                                }}>
                                    <h3 className="text-lg font-mono mb-4" style={{ color: colors.text.primary }}>
                                        テーマ切り替え
                                    </h3>

                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setTheme('dark')}
                                            className={`w-full p-3 rounded-lg border-2 font-mono text-sm transition-all ${theme === 'dark' ? 'border-green-400' : 'border-gray-600'
                                                }`}
                                            style={{
                                                backgroundColor: theme === 'dark' ? colors.background.accent : 'transparent',
                                                color: colors.text.primary,
                                            }}
                                        >
                                            🌙 ダークテーマ
                                        </button>

                                        <button
                                            onClick={() => setTheme('light')}
                                            className={`w-full p-3 rounded-lg border-2 font-mono text-sm transition-all ${theme === 'light' ? 'border-blue-400' : 'border-gray-600'
                                                }`}
                                            style={{
                                                backgroundColor: theme === 'light' ? colors.background.accent : 'transparent',
                                                color: colors.text.primary,
                                            }}
                                        >
                                            ☀️ ライトテーマ
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                );

            case 'motion':
                return (
                    <div className="space-y-6">
                        <section>
                            <h2 className="text-2xl font-mono mb-4" style={{ color: colors.text.accent }}>
                                モーション設定
                            </h2>

                            <div className="p-4 rounded-lg border mb-6" style={{
                                backgroundColor: colors.background.secondary,
                                borderColor: colors.border.primary
                            }}>
                                <h3 className="text-lg font-mono mb-2" style={{ color: colors.text.primary }}>
                                    現在の設定
                                </h3>
                                <div className="text-sm" style={{ color: colors.text.secondary }}>
                                    <p>
                                        prefers-reduced-motion: {' '}
                                        <span style={{ color: prefersReducedMotion ? colors.text.warning : colors.text.success }}>
                                            {prefersReducedMotion ? '有効 (アニメーション軽減)' : '無効 (通常アニメーション)'}
                                        </span>
                                    </p>
                                    <p className="mt-2">
                                        この設定はブラウザまたはOSの設定で変更できます。
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-mono" style={{ color: colors.text.primary }}>
                                    アニメーションテスト
                                </h3>
                                <AccessibleTerminalNewsItem
                                    article={sampleNews[0]}
                                    lineNumber={1}
                                    theme={theme}
                                    showSummary={true}
                                />
                            </div>
                        </section>
                    </div>
                );

            case 'screen-reader':
                return (
                    <div className="space-y-6">
                        <section>
                            <h2 className="text-2xl font-mono mb-4" style={{ color: colors.text.accent }}>
                                スクリーンリーダー対応
                            </h2>

                            <div className="p-4 rounded-lg border mb-6" style={{
                                backgroundColor: colors.background.secondary,
                                borderColor: colors.border.primary
                            }}>
                                <h3 className="text-lg font-mono mb-2" style={{ color: colors.text.primary }}>
                                    実装機能
                                </h3>
                                <ul className="space-y-2 text-sm" style={{ color: colors.text.secondary }}>
                                    <li>• ARIAラベルによる要素の説明</li>
                                    <li>• ライブリージョンによる動的コンテンツの通知</li>
                                    <li>• セマンティックHTMLによる構造の明確化</li>
                                    <li>• フォーカス時の詳細情報提供</li>
                                    <li>• 操作結果のフィードバック</li>
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <p style={{ color: colors.text.secondary }}>
                                    以下の記事にフォーカスすると、スクリーンリーダー用の詳細情報が読み上げられます：
                                </p>
                                {sampleNews.map((article, index) => (
                                    <AccessibleTerminalNewsItem
                                        key={article.id}
                                        article={article}
                                        lineNumber={(index + 1) * 10}
                                        theme={theme}
                                        showSummary={false}
                                        onFocus={() => {
                                            const screenReaderText = generateScreenReaderText.newsArticle(
                                                article.title,
                                                article.source,
                                                article.published_at,
                                                article.category,
                                                article.ai_confidence
                                            );
                                            setAnnounceText(screenReaderText);
                                        }}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>
                );

            default:
                return <div>ページが見つかりません</div>;
        }
    };

    return (
        <>
            <Head>
                <title>アクセシビリティデモ | AI News Aggregator</title>
                <meta name="description" content="WCAG準拠のアクセシブルなギーク風UIのデモページ" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <div
                className="min-h-screen"
                style={{
                    backgroundColor: colors.background.primary,
                    color: colors.text.primary
                }}
            >
                {/* スクリーンリーダー用のライブリージョン */}
                <div
                    aria-live="polite"
                    aria-atomic="true"
                    className="sr-only"
                >
                    {announceText}
                </div>

                {/* スキップリンク */}
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 px-4 py-2 rounded-lg font-mono text-sm z-50"
                    style={{
                        backgroundColor: colors.background.accent,
                        color: colors.text.primary,
                    }}
                >
                    メインコンテンツにスキップ
                </a>

                {/* ナビゲーション */}
                <header className="p-6 border-b" style={{ borderColor: colors.border.primary }}>
                    <h1 className="text-3xl font-mono mb-6" style={{ color: colors.text.accent }}>
                        アクセシビリティデモ
                    </h1>

                    {screenSize === 'mobile' ? (
                        <AccessibleMobileGeekNavigation
                            currentPage={currentPage}
                            items={navigationItems}
                            theme={theme}
                            onNavigate={setCurrentPage}
                            fixed={false}
                        />
                    ) : (
                        <AccessibleGeekNavigation
                            currentPage={currentPage}
                            items={navigationItems}
                            theme={theme}
                            onNavigate={setCurrentPage}
                            orientation={screenSize === 'tablet' ? 'vertical' : 'horizontal'}
                        />
                    )}
                </header>

                {/* メインコンテンツ */}
                <main id="main-content" className="p-6">
                    {renderContent()}
                </main>

                {/* デバッグ情報（開発時のみ） */}
                {process.env.NODE_ENV === 'development' && isClient && (
                    <div
                        className="fixed bottom-4 right-4 p-3 rounded-lg border text-xs font-mono z-50"
                        style={{
                            backgroundColor: colors.background.secondary,
                            borderColor: colors.border.primary,
                            color: colors.text.muted,
                        }}
                    >
                        <div>Screen: {screenSize}</div>
                        <div>Theme: {theme}</div>
                        <div>Reduced Motion: {prefersReducedMotion ? 'ON' : 'OFF'}</div>
                        <div>Width: {window.innerWidth}px</div>
                    </div>
                )}
            </div>
        </>
    );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
    return {
        props: {
            ...(await serverSideTranslations(locale ?? 'ja', ['common', 'news'])),
        },
    };
};

export default AccessibilityDemo;