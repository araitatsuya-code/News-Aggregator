import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';

// ギークコンポーネントのインポート
import { ResponsiveTerminalLayout, CompactTerminalLayout } from '../components/geek/ResponsiveTerminalLayout';
import { MobileGeekNavigation, TabletGeekNavigation } from '../components/geek/MobileGeekNavigation';
import { TerminalNewsItem, TerminalNewsList } from '../components/geek/TerminalNewsItem';
import { FunctionCallFilter } from '../components/geek/FunctionCallFilter';
import { CommandLineFilter } from '../components/geek/CommandLineFilter';

// 型定義
import { NewsItem } from '../lib/types';

/**
 * レスポンシブギークデザインのデモページ
 */
const ResponsiveGeekDemo: React.FC = () => {
  const { t } = useTranslation('common');
  const [currentPage, setCurrentPage] = useState('news');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [theme, setTheme] = useState<'matrix' | 'hacker' | 'terminal' | 'cyber'>('matrix');
  const [isClient, setIsClient] = useState(false);

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

  // サンプルデータ
  const sampleNews: NewsItem[] = [
    {
      id: '1',
      title: 'OpenAI、新しいGPTモデルを発表',
      original_title: 'OpenAI Announces New GPT Model',
      url: 'https://example.com/news/1',
      summary: 'OpenAIが最新のGPTモデルを発表し、従来モデルより大幅な性能向上を実現したと発表しました。',
      published_at: '2025-01-01T10:00:00Z',
      source: 'TechCrunch',
      category: 'AI',
      language: 'ja',
      ai_confidence: 0.95,
      tags: ['OpenAI', 'GPT', 'AI', 'Machine Learning'],
    },
    {
      id: '2',
      title: 'Google、量子コンピューティングで新たな突破口',
      original_title: 'Google Achieves Quantum Computing Breakthrough',
      url: 'https://example.com/news/2',
      summary: 'Googleの研究チームが量子コンピューティング分野で重要な進歩を遂げ、実用化に向けた大きな一歩を踏み出しました。',
      published_at: '2025-01-01T09:30:00Z',
      source: 'Nature',
      category: 'Quantum Computing',
      language: 'ja',
      ai_confidence: 0.88,
      tags: ['Google', 'Quantum', 'Computing', 'Research'],
    },
    {
      id: '3',
      title: 'Meta、新しいVRヘッドセットを発表',
      original_title: 'Meta Unveils New VR Headset',
      url: 'https://example.com/news/3',
      summary: 'Metaが次世代VRヘッドセットを発表し、より軽量で高解像度のディスプレイを搭載していることを明らかにしました。',
      published_at: '2025-01-01T08:45:00Z',
      source: 'The Verge',
      category: 'VR/AR',
      language: 'ja',
      ai_confidence: 0.92,
      tags: ['Meta', 'VR', 'Headset', 'Technology'],
    },
  ];

  const categories = [
    { name: 'AI', displayName: 'Artificial Intelligence', count: 15 },
    { name: 'ML', displayName: 'Machine Learning', count: 12 },
    { name: 'Quantum Computing', displayName: 'Quantum Computing', count: 8 },
    { name: 'VR/AR', displayName: 'Virtual/Augmented Reality', count: 6 },
    { name: 'Robotics', displayName: 'Robotics', count: 10 },
    { name: 'Blockchain', displayName: 'Blockchain', count: 4 },
  ];

  const navigationItems = [
    { id: 'news', label: 'ニュース', icon: '📰', enabled: true, badge: 3 },
    { id: 'categories', label: 'カテゴリ', icon: '📁', enabled: true },
    { id: 'search', label: '検索', icon: '🔍', enabled: true },
    { id: 'settings', label: '設定', icon: '⚙️', enabled: true },
    { id: 'about', label: 'About', icon: 'ℹ️', enabled: true },
  ];

  const handleFilter = (filters: any) => {
    console.log('フィルター適用:', filters);
  };

  const handleSearch = (query: string, options?: any) => {
    console.log('検索実行:', query, options);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'news':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-mono-primary text-green-400 mb-4">
              {'>'} Latest AI News
            </h2>
            <TerminalNewsList
              articles={sampleNews}
              theme={theme}
              syntax="javascript"
              showSummary={screenSize !== 'mobile'}
            />
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-mono-primary text-green-400 mb-4">
              {'>'} Category Filter
            </h2>
            <FunctionCallFilter
              categories={categories}
              selectedCategories={selectedCategories}
              onCategoryChange={setSelectedCategories}
              theme="javascript"
              allowMultiple={true}
              autoExecute={true}
            />
          </div>
        );

      case 'search':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-mono-primary text-green-400 mb-4">
              {'>'} Command Line Search
            </h2>
            <CommandLineFilter
              categories={categories.map(c => c.name)}
              sources={['TechCrunch', 'Nature', 'The Verge', 'ArXiv']}
              onFilter={handleFilter}
              onSearch={handleSearch}
              theme={theme}
              placeholder="$ コマンドを入力してください..."
            />
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-mono-primary text-green-400 mb-4">
              {'>'} Theme Settings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['matrix', 'hacker', 'terminal', 'cyber'] as const).map((themeOption) => (
                <button
                  key={themeOption}
                  onClick={() => setTheme(themeOption)}
                  className={`
                    p-4 rounded-lg border-2 font-mono-code text-sm
                    transition-all duration-200 touch-button
                    ${theme === themeOption
                      ? 'border-green-400 bg-green-900 bg-opacity-30 text-green-400'
                      : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="text-lg mb-2">
                      {themeOption === 'matrix' && '🟢'}
                      {themeOption === 'hacker' && '🔵'}
                      {themeOption === 'terminal' && '⚪'}
                      {themeOption === 'cyber' && '🟣'}
                    </div>
                    <div className="capitalize">{themeOption}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-mono-primary text-green-400 mb-4">
              {'>'} About This Demo
            </h2>
            <div className="font-mono-code text-sm space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-green-400 mb-2">{`// レスポンシブギークデザインの特徴`}</div>
                <div className="text-gray-300">
                  <div>• モバイル対応のターミナル風UI</div>
                  <div>• タッチフレンドリーなインタラクション</div>
                  <div>• 画面サイズ別の最適化</div>
                  <div>• アクセシビリティ対応</div>
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-cyan-400 mb-2">{`// 現在の画面サイズ`}</div>
                <div className="text-white">
                  Screen Size: <span className="text-yellow-400">{screenSize}</span>
                </div>
                {isClient && (
                  <div className="text-white">
                    Window Width: <span className="text-yellow-400">{window.innerWidth}px</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <>
      <Head>
        <title>レスポンシブギークデザイン デモ | AI News Aggregator</title>
        <meta name="description" content="レスポンシブ対応のギーク風UIデザインのデモページ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-black text-green-400">
        {/* ナビゲーション */}
        {screenSize === 'mobile' ? (
          <MobileGeekNavigation
            currentPage={currentPage}
            items={navigationItems}
            theme={theme}
            onNavigate={setCurrentPage}
          />
        ) : screenSize === 'tablet' ? (
          <div className="p-4">
            <TabletGeekNavigation
              currentPage={currentPage}
              items={navigationItems}
              theme={theme}
              onNavigate={setCurrentPage}
            />
          </div>
        ) : (
          <div className="p-6">
            <nav className="flex space-x-4 mb-6">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`
                    px-4 py-2 rounded-lg font-mono-primary text-sm
                    transition-all duration-200
                    ${currentPage === item.id
                      ? 'bg-green-900 bg-opacity-30 text-green-300 border-2 border-green-400'
                      : 'text-gray-400 hover:text-green-400 border-2 border-transparent'
                    }
                  `}
                >
                  {item.icon} {item.label}
                  {item.badge && (
                    <span className="ml-2 px-2 py-1 bg-red-600 text-white rounded-full text-xs">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* メインコンテンツ */}
        {screenSize === 'mobile' ? (
          <div className="pt-16 pb-4">
            <CompactTerminalLayout theme={theme}>
              {renderContent()}
            </CompactTerminalLayout>
          </div>
        ) : (
          <ResponsiveTerminalLayout
            theme={theme}
            title="AI News Terminal - Responsive Demo"
            showHeader={true}
            showPrompt={screenSize !== 'tablet'}
            mobileSimplified={false}
            className={screenSize === 'tablet' ? 'mx-4' : 'mx-6'}
          >
            {renderContent()}
          </ResponsiveTerminalLayout>
        )}

        {/* デバッグ情報（開発時のみ） */}
        {process.env.NODE_ENV === 'development' && isClient && (
          <div className="fixed bottom-4 right-4 bg-gray-900 bg-opacity-90 border border-gray-600 rounded-lg p-3 text-xs font-mono-primary text-gray-300">
            <div>Screen: {screenSize}</div>
            <div>Theme: {theme}</div>
            <div>Page: {currentPage}</div>
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

export default ResponsiveGeekDemo;