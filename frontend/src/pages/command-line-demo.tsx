import React, { useState, useCallback } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { CommandLineNavigation } from '../components/geek/CommandLineNavigation';
import { TerminalNewsItem } from '../components/geek/TerminalNewsItem';

/**
 * フィルターオプションの型
 */
interface FilterOptions {
  categories?: string[];
  sources?: string[];
  dateRange?: string;
  operator?: 'AND' | 'OR';
  strict?: boolean;
}

/**
 * 検索オプションの型
 */
interface SearchOptions {
  fields?: string[];
  caseSensitive?: boolean;
  regex?: boolean;
}

/**
 * サンプルニュースデータ
 */
const sampleNews = [
  {
    id: '1',
    title: 'OpenAI、新しいGPTモデルを発表',
    summary: 'OpenAIが次世代のGPTモデルを発表し、より高度な推論能力を実現したと発表しました。',
    url: 'https://example.com/news/1',
    source: 'TechCrunch',
    category: 'AI',
    published_at: '2025-09-30T10:00:00Z',
    confidence: 0.95,
  },
  {
    id: '2',
    title: 'Google、機械学習の新しいフレームワークを公開',
    summary: 'Googleが開発者向けに新しい機械学習フレームワークを公開し、より簡単にAIアプリケーションを構築できるようになりました。',
    url: 'https://example.com/news/2',
    source: 'Google AI Blog',
    category: 'Machine Learning',
    published_at: '2025-09-30T09:30:00Z',
    confidence: 0.88,
  },
  {
    id: '3',
    title: 'Meta、VRとAIを組み合わせた新技術を発表',
    summary: 'Metaが仮想現実とAIを組み合わせた革新的な技術を発表し、メタバースの体験を大幅に向上させると発表しました。',
    url: 'https://example.com/news/3',
    source: 'Meta AI',
    category: 'VR/AR',
    published_at: '2025-09-30T08:45:00Z',
    confidence: 0.92,
  },
  {
    id: '4',
    title: 'Microsoft、Azure AIサービスを拡張',
    summary: 'MicrosoftがAzure AIサービスに新機能を追加し、企業向けのAIソリューションをより包括的に提供すると発表しました。',
    url: 'https://example.com/news/4',
    source: 'Microsoft Blog',
    category: 'Cloud AI',
    published_at: '2025-09-30T07:15:00Z',
    confidence: 0.90,
  },
  {
    id: '5',
    title: 'Tesla、自動運転技術の最新アップデートを公開',
    summary: 'Teslaが自動運転技術の最新アップデートを公開し、より安全で効率的な自動運転を実現したと発表しました。',
    url: 'https://example.com/news/5',
    source: 'Tesla Blog',
    category: 'Autonomous Driving',
    published_at: '2025-09-30T06:30:00Z',
    confidence: 0.87,
  },
];

/**
 * コマンドライン風ナビゲーションのデモページ
 */
const CommandLineDemoPage: React.FC = () => {
  const { t } = useTranslation('news');
  
  // 状態管理
  const [filteredNews, setFilteredNews] = useState(sampleNews);
  const [currentTheme, setCurrentTheme] = useState<'matrix' | 'hacker' | 'terminal' | 'cyber'>('matrix');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});
  const [debugMode, setDebugMode] = useState(false);

  // 利用可能なカテゴリとソース
  const categories = Array.from(new Set(sampleNews.map(news => news.category)));
  const sources = Array.from(new Set(sampleNews.map(news => news.source)));

  /**
   * フィルター処理
   */
  const handleFilter = useCallback((filters: FilterOptions) => {
    console.log('フィルター適用:', filters);
    setActiveFilters(filters);

    let filtered = [...sampleNews];

    // カテゴリフィルター
    if (filters.categories && filters.categories.length > 0) {
      if (filters.operator === 'AND') {
        // AND演算子の場合、すべてのカテゴリに一致する記事（実際には1つの記事は1つのカテゴリのみ）
        filtered = filtered.filter(news => 
          filters.categories!.includes(news.category)
        );
      } else {
        // OR演算子の場合、いずれかのカテゴリに一致する記事
        filtered = filtered.filter(news => 
          filters.categories!.includes(news.category)
        );
      }
    }

    // ソースフィルター
    if (filters.sources && filters.sources.length > 0) {
      filtered = filtered.filter(news => 
        filters.sources!.includes(news.source)
      );
    }

    // 日付フィルター（簡易実装）
    if (filters.dateRange) {
      const now = new Date();
      const newsDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          // 今日の記事のみ（デモでは全て表示）
          break;
        case 'yesterday':
          // 昨日の記事のみ（デモでは全て表示）
          break;
        case 'last_week':
          // 先週の記事のみ（デモでは全て表示）
          break;
        case 'last_month':
          // 先月の記事のみ（デモでは全て表示）
          break;
      }
    }

    setFilteredNews(filtered);
  }, []);

  /**
   * 検索処理
   */
  const handleSearch = useCallback((query: string, options?: SearchOptions) => {
    console.log('検索実行:', { query, options });
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredNews(sampleNews);
      return;
    }

    const searchFields = options?.fields || ['title', 'summary'];
    const caseSensitive = options?.caseSensitive || false;
    const useRegex = options?.regex || false;

    let filtered = sampleNews.filter(news => {
      const searchText = caseSensitive ? query : query.toLowerCase();
      
      return searchFields.some(field => {
        let fieldValue = '';
        
        switch (field) {
          case 'title':
            fieldValue = news.title;
            break;
          case 'summary':
            fieldValue = news.summary;
            break;
          case 'source':
            fieldValue = news.source;
            break;
          case 'category':
            fieldValue = news.category;
            break;
          case 'all':
            fieldValue = `${news.title} ${news.summary} ${news.source} ${news.category}`;
            break;
          default:
            fieldValue = news.title;
        }

        if (!caseSensitive) {
          fieldValue = fieldValue.toLowerCase();
        }

        if (useRegex) {
          try {
            const regex = new RegExp(searchText, caseSensitive ? 'g' : 'gi');
            return regex.test(fieldValue);
          } catch (error) {
            // 正規表現が無効な場合は通常の検索にフォールバック
            return fieldValue.includes(searchText);
          }
        } else {
          return fieldValue.includes(searchText);
        }
      });
    });

    setFilteredNews(filtered);
  }, []);

  /**
   * ナビゲーション処理
   */
  const handleNavigate = useCallback((path: string) => {
    console.log('ナビゲーション:', path);
    // 実際のナビゲーション処理をここに実装
  }, []);

  /**
   * テーマ変更処理
   */
  const handleThemeChange = useCallback((theme: string) => {
    setCurrentTheme(theme as typeof currentTheme);
  }, []);

  /**
   * テーマに応じたスタイルを取得
   */
  const getThemeStyles = useCallback(() => {
    switch (currentTheme) {
      case 'matrix':
        return {
          background: 'bg-black',
          text: 'text-green-400',
          accent: 'text-green-300',
          border: 'border-green-400',
        };
      case 'hacker':
        return {
          background: 'bg-gray-900',
          text: 'text-cyan-400',
          accent: 'text-cyan-300',
          border: 'border-cyan-400',
        };
      case 'terminal':
        return {
          background: 'bg-gray-900',
          text: 'text-white',
          accent: 'text-gray-300',
          border: 'border-gray-400',
        };
      case 'cyber':
        return {
          background: 'bg-purple-900',
          text: 'text-purple-300',
          accent: 'text-purple-200',
          border: 'border-purple-400',
        };
      default:
        return {
          background: 'bg-black',
          text: 'text-green-400',
          accent: 'text-green-300',
          border: 'border-green-400',
        };
    }
  }, [currentTheme]);

  const styles = getThemeStyles();

  return (
    <>
      <Head>
        <title>Command Line Navigation Demo - AI News Aggregator</title>
        <meta name="description" content="コマンドライン風ナビゲーションシステムのデモ" />
      </Head>

      <div className={`min-h-screen ${styles.background} ${styles.text} font-mono-primary`}>
        {/* ヘッダー */}
        <header className={`${styles.border} border-b p-4`}>
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold mb-2">
              Command Line Navigation Demo
            </h1>
            <p className={`${styles.accent} text-sm`}>
              キーボードショートカットとコマンドラインでニュースを操作
            </p>
            
            {/* 使用方法 */}
            <div className="mt-4 p-3 bg-gray-800 bg-opacity-50 rounded">
              <h2 className="text-sm font-semibold mb-2">クイックスタート:</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div><code className="bg-gray-700 px-1 rounded">Ctrl + `</code> コマンドライン表示</div>
                <div><code className="bg-gray-700 px-1 rounded">/</code> フィルターモード</div>
                <div><code className="bg-gray-700 px-1 rounded">:</code> コマンドモード</div>
                <div><code className="bg-gray-700 px-1 rounded">?</code> ヘルプ表示</div>
                <div><code className="bg-gray-700 px-1 rounded">j/k</code> Vim風スクロール</div>
                <div><code className="bg-gray-700 px-1 rounded">Ctrl+Shift+T</code> テーマ切り替え</div>
              </div>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="container mx-auto p-4">
          {/* 現在の状態表示 */}
          <div className="mb-6 p-4 bg-gray-800 bg-opacity-30 rounded">
            <h2 className="text-lg font-semibold mb-3">現在の状態</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className={styles.accent}>テーマ:</span> {currentTheme}
              </div>
              <div>
                <span className={styles.accent}>表示記事数:</span> {filteredNews.length} / {sampleNews.length}
              </div>
              <div>
                <span className={styles.accent}>検索クエリ:</span> {searchQuery || '(なし)'}
              </div>
            </div>
            
            {/* アクティブフィルター */}
            {Object.keys(activeFilters).length > 0 && (
              <div className="mt-3">
                <span className={styles.accent}>アクティブフィルター:</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {activeFilters.categories?.map(cat => (
                    <span key={cat} className="px-2 py-1 bg-blue-900 bg-opacity-50 rounded text-xs">
                      カテゴリ: {cat}
                    </span>
                  ))}
                  {activeFilters.sources?.map(source => (
                    <span key={source} className="px-2 py-1 bg-green-900 bg-opacity-50 rounded text-xs">
                      ソース: {source}
                    </span>
                  ))}
                  {activeFilters.dateRange && (
                    <span className="px-2 py-1 bg-purple-900 bg-opacity-50 rounded text-xs">
                      日付: {activeFilters.dateRange}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ニュース一覧 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              AI News ({filteredNews.length}件)
            </h2>
            
            {filteredNews.length > 0 ? (
              filteredNews.map((news, index) => (
                <TerminalNewsItem
                  key={news.id}
                  article={news}
                  lineNumber={index + 1}
                  showSummary={true}
                  syntax="terminal"
                  theme={currentTheme}
                />
              ))
            ) : (
              <div className={`text-center py-8 ${styles.accent}`}>
                <p>フィルター条件に一致する記事が見つかりませんでした。</p>
                <p className="text-sm mt-2">
                  コマンドライン（Ctrl + `）で「clear」を実行してフィルターをリセットできます。
                </p>
              </div>
            )}
          </div>

          {/* デバッグ情報 */}
          {debugMode && (
            <div className="mt-8 p-4 bg-gray-800 bg-opacity-50 rounded">
              <h3 className="text-lg font-semibold mb-3">デバッグ情報</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify({
                  theme: currentTheme,
                  totalNews: sampleNews.length,
                  filteredNews: filteredNews.length,
                  searchQuery,
                  activeFilters,
                  categories,
                  sources,
                }, null, 2)}
              </pre>
            </div>
          )}
        </main>

        {/* コマンドラインナビゲーション */}
        <CommandLineNavigation
          categories={categories}
          sources={sources}
          onFilter={handleFilter}
          onSearch={handleSearch}
          onNavigate={handleNavigate}
          onThemeChange={handleThemeChange}
          currentTheme={currentTheme}
          debug={debugMode}
        />
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

export default CommandLineDemoPage;