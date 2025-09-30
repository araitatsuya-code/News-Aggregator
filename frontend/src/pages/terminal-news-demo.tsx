import React, { useState } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { TerminalNewsItem, TerminalNewsList } from '../components/geek/TerminalNewsItem';
import { NewsItem } from '../lib/types';

// デモ用のサンプルデータ
const sampleArticles: NewsItem[] = [
  {
    id: 'demo-1',
    title: 'OpenAIが新しいGPTモデルを発表',
    original_title: 'OpenAI Announces New GPT Model',
    summary: 'OpenAIは本日、従来のモデルを大幅に上回る性能を持つ新しいGPTモデルを発表しました。このモデルは、より自然な対話能力と高度な推論能力を備えており、様々な分野での応用が期待されています。',
    url: 'https://example.com/openai-new-gpt',
    source: 'TechCrunch',
    category: 'AI Research',
    published_at: '2025-09-29T10:00:00Z',
    language: 'ja',
    tags: ['OpenAI', 'GPT', 'Language Model', 'AI Research'],
    ai_confidence: 0.98,
  },
  {
    id: 'demo-2',
    title: '機械学習による医療診断の精度向上',
    original_title: 'Machine Learning Improves Medical Diagnosis Accuracy',
    summary: '最新の研究により、機械学習アルゴリズムを使用した医療診断システムが、従来の手法と比較して診断精度を20%向上させることが明らかになりました。',
    url: 'https://example.com/ml-medical-diagnosis',
    source: 'Nature AI',
    category: 'Healthcare AI',
    published_at: '2025-09-29T08:30:00Z',
    language: 'ja',
    tags: ['Machine Learning', 'Healthcare', 'Diagnosis', 'Medical AI'],
    ai_confidence: 0.92,
  },
  {
    id: 'demo-3',
    title: 'Autonomous Vehicle Technology Breakthrough',
    original_title: 'Autonomous Vehicle Technology Breakthrough',
    summary: 'A major breakthrough in autonomous vehicle technology has been achieved with the development of a new sensor fusion algorithm that significantly improves object detection in adverse weather conditions.',
    url: 'https://example.com/autonomous-vehicle-breakthrough',
    source: 'IEEE Spectrum',
    category: 'Autonomous Systems',
    published_at: '2025-09-29T06:15:00Z',
    language: 'en',
    tags: ['Autonomous Vehicles', 'Sensor Fusion', 'Computer Vision', 'Transportation'],
    ai_confidence: 0.89,
  },
  {
    id: 'demo-4',
    title: '量子コンピューティングとAIの融合',
    original_title: 'Quantum Computing Meets AI',
    summary: '量子コンピューティング技術とAIの融合により、従来のコンピューターでは解決困難だった最適化問題を効率的に解決する新しいアプローチが開発されました。',
    url: 'https://example.com/quantum-ai-fusion',
    source: 'Quantum Magazine',
    category: 'Quantum AI',
    published_at: '2025-09-28T14:20:00Z',
    language: 'ja',
    tags: ['Quantum Computing', 'AI', 'Optimization', 'Quantum AI'],
    ai_confidence: 0.85,
  },
];

/**
 * TerminalNewsItemコンポーネントのデモページ
 */
export default function TerminalNewsDemo() {
  const { t } = useTranslation('common');
  const [selectedSyntax, setSelectedSyntax] = useState<'javascript' | 'python' | 'json' | 'terminal'>('javascript');
  const [selectedTheme, setSelectedTheme] = useState<'matrix' | 'hacker' | 'terminal' | 'cyber' | 'vscode'>('vscode');
  const [showSummary, setShowSummary] = useState(true);
  const [highlightOnHover, setHighlightOnHover] = useState(true);

  return (
    <div className="min-h-screen bg-editor-bg-primary text-white">
      {/* ヘッダー */}
      <div className="bg-editor-bg-secondary border-b border-gray-700 px-6 py-4">
        <h1 className="text-2xl font-mono-primary text-terminal-text-primary">
          Terminal News Item Demo
        </h1>
        <p className="text-gray-400 mt-2 font-mono-code text-sm">
          コードエディタ風ニュース表示コンポーネントのデモンストレーション
        </p>
      </div>

      {/* コントロールパネル */}
      <div className="bg-editor-bg-secondary border-b border-gray-700 px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* シンタックス選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Syntax Theme
            </label>
            <select
              value={selectedSyntax}
              onChange={(e) => setSelectedSyntax(e.target.value as any)}
              className="w-full bg-editor-bg-primary border border-gray-600 rounded px-3 py-2 text-white font-mono-code text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="json">JSON</option>
              <option value="terminal">Terminal</option>
            </select>
          </div>

          {/* テーマ選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Color Theme
            </label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value as any)}
              className="w-full bg-editor-bg-primary border border-gray-600 rounded px-3 py-2 text-white font-mono-code text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="vscode">VS Code Dark</option>
              <option value="matrix">Matrix</option>
              <option value="hacker">Hacker</option>
              <option value="terminal">Terminal</option>
              <option value="cyber">Cyberpunk</option>
            </select>
          </div>

          {/* オプション */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Options
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showSummary}
                  onChange={(e) => setShowSummary(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-300">Show Summary</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={highlightOnHover}
                  onChange={(e) => setHighlightOnHover(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-300">Highlight on Hover</span>
              </label>
            </div>
          </div>

          {/* 統計情報 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Statistics
            </label>
            <div className="text-sm text-gray-400 space-y-1">
              <div>Articles: {sampleArticles.length}</div>
              <div>Languages: {new Set(sampleArticles.map(a => a.language)).size}</div>
              <div>Categories: {new Set(sampleArticles.map(a => a.category)).size}</div>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 単一記事のデモ */}
          <section className="mb-12">
            <h2 className="text-xl font-mono-primary text-terminal-text-primary mb-6">
              Single Article Demo
            </h2>
            <div className="bg-editor-bg-secondary rounded-lg p-1">
              <TerminalNewsItem
                article={sampleArticles[0]}
                lineNumber={1}
                showSummary={showSummary}
                syntax={selectedSyntax}
                theme={selectedTheme}
                highlightOnHover={highlightOnHover}
                clickable={true}
              />
            </div>
          </section>

          {/* 複数記事のリストデモ */}
          <section className="mb-12">
            <h2 className="text-xl font-mono-primary text-terminal-text-primary mb-6">
              Article List Demo
            </h2>
            <div className="bg-editor-bg-secondary rounded-lg p-1">
              <TerminalNewsList
                articles={sampleArticles}
                startLineNumber={1}
                showSummary={showSummary}
                syntax={selectedSyntax}
                theme={selectedTheme}
                highlightOnHover={highlightOnHover}
              />
            </div>
          </section>

          {/* 異なるテーマの比較 */}
          <section className="mb-12">
            <h2 className="text-xl font-mono-primary text-terminal-text-primary mb-6">
              Theme Comparison
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(['matrix', 'hacker', 'cyber', 'vscode'] as const).map((theme) => (
                <div key={theme} className="bg-editor-bg-secondary rounded-lg p-1">
                  <div className="text-center text-sm text-gray-400 mb-4 font-mono-code">
                    {theme.charAt(0).toUpperCase() + theme.slice(1)} Theme
                  </div>
                  <TerminalNewsItem
                    article={sampleArticles[1]}
                    lineNumber={1}
                    showSummary={false}
                    syntax={selectedSyntax}
                    theme={theme}
                    highlightOnHover={highlightOnHover}
                    clickable={true}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* 異なるシンタックスの比較 */}
          <section>
            <h2 className="text-xl font-mono-primary text-terminal-text-primary mb-6">
              Syntax Comparison
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(['javascript', 'python', 'json', 'terminal'] as const).map((syntax) => (
                <div key={syntax} className="bg-editor-bg-secondary rounded-lg p-1">
                  <div className="text-center text-sm text-gray-400 mb-4 font-mono-code">
                    {syntax.charAt(0).toUpperCase() + syntax.slice(1)} Syntax
                  </div>
                  <TerminalNewsItem
                    article={sampleArticles[2]}
                    lineNumber={1}
                    showSummary={false}
                    syntax={syntax}
                    theme={selectedTheme}
                    highlightOnHover={highlightOnHover}
                    clickable={true}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* フッター */}
      <div className="bg-editor-bg-secondary border-t border-gray-700 px-6 py-4 mt-12">
        <div className="text-center text-sm text-gray-400 font-mono-code">
          <p>TerminalNewsItem Component Demo - Built with React & TypeScript</p>
          <p className="mt-1">
            Features: Syntax Highlighting, Multiple Themes, Hover Effects, Accessibility Support
          </p>
        </div>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'ja', ['common', 'news'])),
    },
  };
};