import React, { useState } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { FunctionCallFilter, SimpleFunctionCallFilter } from '../components/geek/FunctionCallFilter';
import { SEOHead } from '../components/SEOHead';

/**
 * FunctionCallFilterコンポーネントのデモページ
 */
const FunctionCallFilterDemo: React.FC = () => {
  const { t } = useTranslation('common');
  
  // デモ用のカテゴリデータ
  const demoCategories = [
    { name: 'AI', displayName: 'AI', count: 15 },
    { name: 'ML', displayName: 'Machine Learning', count: 8 },
    { name: 'Claude', displayName: 'Claude', count: 5 },
    { name: '国内', displayName: '国内ニュース', count: 12 },
    { name: '海外', displayName: '海外ニュース', count: 20 },
    { name: 'Reddit', displayName: 'Reddit', count: 7 },
    { name: 'その他', displayName: 'その他', count: 3 },
  ];

  // フルバージョンのフィルター状態
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [logicalOperator, setLogicalOperator] = useState<'AND' | 'OR'>('OR');
  const [theme, setTheme] = useState<'javascript' | 'python' | 'typescript' | 'json'>('javascript');
  const [allowMultiple, setAllowMultiple] = useState(true);
  const [autoExecute, setAutoExecute] = useState(true);

  // シンプルバージョンのフィルター状態
  const [simpleSelectedCategories, setSimpleSelectedCategories] = useState<string[]>([]);
  const [simpleAllowMultiple, setSimpleAllowMultiple] = useState(true);

  return (
    <>
      <SEOHead
        title="Function Call Filter Demo - AI News Aggregator"
        description="プログラミング言語風カテゴリフィルターのデモページ"
        url="/function-call-filter-demo"
      />
      
      <div className="min-h-screen bg-gray-900 text-white">
        {/* ヘッダー */}
        <header className="bg-gray-800 border-b border-gray-700 p-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold font-mono-primary text-green-400 mb-2">
              Function Call Filter Demo
            </h1>
            <p className="text-gray-300 font-mono-primary">
              プログラミング言語風カテゴリフィルターのデモンストレーション
            </p>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-6 space-y-12">
          {/* フルバージョンのデモ */}
          <section>
            <h2 className="text-2xl font-bold font-mono-primary text-cyan-400 mb-6">
              Full Version Demo
            </h2>
            
            {/* 設定パネル */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold font-mono-primary text-yellow-400 mb-4">
                設定オプション
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* テーマ選択 */}
                <div>
                  <label className="block text-sm font-mono-primary text-gray-300 mb-2">
                    テーマ
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as any)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white font-mono-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="typescript">TypeScript</option>
                    <option value="json">JSON</option>
                  </select>
                </div>

                {/* 複数選択 */}
                <div>
                  <label className="block text-sm font-mono-primary text-gray-300 mb-2">
                    複数選択
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={allowMultiple}
                      onChange={(e) => setAllowMultiple(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="font-mono-primary text-sm">許可する</span>
                  </label>
                </div>

                {/* 自動実行 */}
                <div>
                  <label className="block text-sm font-mono-primary text-gray-300 mb-2">
                    自動実行
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={autoExecute}
                      onChange={(e) => setAutoExecute(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="font-mono-primary text-sm">有効</span>
                  </label>
                </div>

                {/* 論理演算子 */}
                <div>
                  <label className="block text-sm font-mono-primary text-gray-300 mb-2">
                    論理演算子
                  </label>
                  <select
                    value={logicalOperator}
                    onChange={(e) => setLogicalOperator(e.target.value as 'AND' | 'OR')}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white font-mono-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!allowMultiple}
                  >
                    <option value="OR">OR (いずれか)</option>
                    <option value="AND">AND (すべて)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* フィルターコンポーネント */}
            <FunctionCallFilter
              categories={demoCategories}
              selectedCategories={selectedCategories}
              onCategoryChange={setSelectedCategories}
              allowMultiple={allowMultiple}
              logicalOperator={logicalOperator}
              onLogicalOperatorChange={setLogicalOperator}
              theme={theme}
              autoExecute={autoExecute}
              className="mb-6"
            />

            {/* 選択状態の表示 */}
            <div className="bg-black rounded-lg p-4">
              <h4 className="text-sm font-mono-primary text-gray-400 mb-2">
                現在の選択状態:
              </h4>
              <pre className="text-green-400 font-mono-code text-sm">
                {JSON.stringify({
                  selectedCategories,
                  logicalOperator: allowMultiple ? logicalOperator : null,
                  count: selectedCategories.length,
                }, null, 2)}
              </pre>
            </div>
          </section>

          {/* シンプルバージョンのデモ */}
          <section>
            <h2 className="text-2xl font-bold font-mono-primary text-cyan-400 mb-6">
              Simple Version Demo
            </h2>
            
            {/* 設定パネル */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold font-mono-primary text-yellow-400 mb-4">
                設定オプション
              </h3>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={simpleAllowMultiple}
                    onChange={(e) => setSimpleAllowMultiple(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="font-mono-primary text-sm">複数選択を許可</span>
                </label>
              </div>
            </div>

            {/* シンプルフィルターコンポーネント */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <SimpleFunctionCallFilter
                categories={demoCategories.map(cat => cat.name)}
                selectedCategories={simpleSelectedCategories}
                onCategoryChange={setSimpleSelectedCategories}
                allowMultiple={simpleAllowMultiple}
              />
            </div>

            {/* 選択状態の表示 */}
            <div className="bg-black rounded-lg p-4">
              <h4 className="text-sm font-mono-primary text-gray-400 mb-2">
                現在の選択状態:
              </h4>
              <pre className="text-green-400 font-mono-code text-sm">
                {JSON.stringify({
                  selectedCategories: simpleSelectedCategories,
                  count: simpleSelectedCategories.length,
                }, null, 2)}
              </pre>
            </div>
          </section>

          {/* 使用例 */}
          <section>
            <h2 className="text-2xl font-bold font-mono-primary text-cyan-400 mb-6">
              使用例
            </h2>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold font-mono-primary text-yellow-400 mb-4">
                基本的な使用方法
              </h3>
              
              <pre className="bg-black rounded p-4 text-green-400 font-mono-code text-sm overflow-x-auto">
{`import { FunctionCallFilter } from '@/components/geek/FunctionCallFilter';

const categories = [
  { name: 'AI', displayName: 'AI', count: 15 },
  { name: 'ML', displayName: 'Machine Learning', count: 8 },
];

const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

<FunctionCallFilter
  categories={categories}
  selectedCategories={selectedCategories}
  onCategoryChange={setSelectedCategories}
  theme="javascript"
  allowMultiple={true}
  autoExecute={true}
/>`}
              </pre>
            </div>
          </section>

          {/* 機能説明 */}
          <section>
            <h2 className="text-2xl font-bold font-mono-primary text-cyan-400 mb-6">
              機能説明
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold font-mono-primary text-yellow-400 mb-4">
                  主な機能
                </h3>
                <ul className="space-y-2 text-gray-300 font-mono-primary text-sm">
                  <li>• 関数呼び出し風のUI表示</li>
                  <li>• 複数のプログラミング言語テーマ</li>
                  <li>• コード実行風のアニメーション</li>
                  <li>• 論理演算子の切り替え (AND/OR)</li>
                  <li>• 単一/複数選択モード</li>
                  <li>• アクセシビリティ対応</li>
                  <li>• prefers-reduced-motion対応</li>
                </ul>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold font-mono-primary text-yellow-400 mb-4">
                  対応テーマ
                </h3>
                <ul className="space-y-2 text-gray-300 font-mono-primary text-sm">
                  <li>• JavaScript (const/let構文)</li>
                  <li>• Python (snake_case構文)</li>
                  <li>• TypeScript (型注釈付き)</li>
                  <li>• JSON (オブジェクト形式)</li>
                </ul>
              </div>
            </div>
          </section>
        </main>

        {/* フッター */}
        <footer className="bg-gray-800 border-t border-gray-700 p-6 mt-12">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-gray-400 font-mono-primary text-sm">
              Function Call Filter Demo - AI News Aggregator
            </p>
          </div>
        </footer>
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

export default FunctionCallFilterDemo;