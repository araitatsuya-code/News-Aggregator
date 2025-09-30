import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'next-i18next';
import { TypingAnimation } from './TypingAnimation';

/**
 * カテゴリ情報の型定義
 */
interface Category {
  /** カテゴリ名 */
  name: string;
  /** 表示名（多言語対応） */
  displayName?: string;
  /** 記事数 */
  count?: number;
  /** 有効かどうか */
  enabled?: boolean;
  /** カテゴリの色（オプション） */
  color?: string;
}

/**
 * FunctionCallFilterコンポーネントのプロパティ
 */
interface FunctionCallFilterProps {
  /** 利用可能なカテゴリ一覧 */
  categories: Category[];
  /** 選択されたカテゴリ一覧 */
  selectedCategories: string[];
  /** カテゴリ変更時のコールバック */
  onCategoryChange: (categories: string[]) => void;
  /** 複数選択を許可するか */
  allowMultiple?: boolean;
  /** 論理演算子（AND/OR） */
  logicalOperator?: 'AND' | 'OR';
  /** 論理演算子変更時のコールバック */
  onLogicalOperatorChange?: (operator: 'AND' | 'OR') => void;
  /** テーマ */
  theme?: 'javascript' | 'python' | 'typescript' | 'json';
  /** アニメーション速度 */
  animationSpeed?: number;
  /** 自動実行モード */
  autoExecute?: boolean;
  /** CSSクラス名 */
  className?: string;
  /** 無効化フラグ */
  disabled?: boolean;
}

/**
 * プログラミング言語風のカテゴリフィルターコンポーネント
 * 関数呼び出し風の表示とコード実行風のアニメーション効果を提供
 */
export const FunctionCallFilter: React.FC<FunctionCallFilterProps> = ({
  categories,
  selectedCategories,
  onCategoryChange,
  allowMultiple = true,
  logicalOperator = 'OR',
  onLogicalOperatorChange,
  theme = 'javascript',
  animationSpeed = 30,
  autoExecute = true,
  className = '',
  disabled = false,
}) => {
  const { t } = useTranslation('news');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // prefers-reduced-motionの検出
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      setPrefersReducedMotion(false);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  /**
   * テーマに応じたシンタックススタイルを取得
   */
  const getSyntaxStyles = useCallback(() => {
    switch (theme) {
      case 'javascript':
        return {
          keyword: 'text-blue-400',
          function: 'text-yellow-300',
          string: 'text-green-400',
          variable: 'text-cyan-300',
          operator: 'text-pink-400',
          comment: 'text-gray-500',
          number: 'text-orange-400',
          boolean: 'text-purple-400',
        };
      case 'python':
        return {
          keyword: 'text-blue-400',
          function: 'text-purple-400',
          string: 'text-yellow-300',
          variable: 'text-cyan-300',
          operator: 'text-pink-400',
          comment: 'text-green-500',
          number: 'text-orange-400',
          boolean: 'text-purple-400',
        };
      case 'typescript':
        return {
          keyword: 'text-blue-500',
          function: 'text-yellow-400',
          string: 'text-green-400',
          variable: 'text-cyan-400',
          operator: 'text-pink-400',
          comment: 'text-gray-500',
          number: 'text-orange-400',
          boolean: 'text-purple-500',
        };
      case 'json':
        return {
          keyword: 'text-blue-400',
          function: 'text-white',
          string: 'text-green-400',
          variable: 'text-cyan-400',
          operator: 'text-white',
          comment: 'text-gray-500',
          number: 'text-orange-400',
          boolean: 'text-purple-400',
        };
      default:
        return {
          keyword: 'text-blue-400',
          function: 'text-yellow-300',
          string: 'text-green-400',
          variable: 'text-cyan-300',
          operator: 'text-pink-400',
          comment: 'text-gray-500',
          number: 'text-orange-400',
          boolean: 'text-purple-400',
        };
    }
  }, [theme]);

  /**
   * フィルター実行のアニメーション
   */
  const executeFilter = useCallback(async (categories: string[], operator: 'AND' | 'OR' = logicalOperator) => {
    if (prefersReducedMotion) {
      // アニメーション無効時は即座に結果を表示
      const count = categories.length;
      setExecutionResult(`✓ フィルター適用完了: ${count}個のカテゴリが選択されました`);
      setShowResult(true);
      return;
    }

    setIsExecuting(true);
    setShowResult(false);
    setAnimationKey(prev => prev + 1);

    // 実行シミュレーション
    await new Promise(resolve => setTimeout(resolve, 800));

    const count = categories.length;
    const operatorText = operator === 'AND' ? '且つ' : 'または';
    
    if (count === 0) {
      setExecutionResult('// すべてのカテゴリを表示中...');
    } else if (count === 1) {
      setExecutionResult(`✓ "${categories[0]}" カテゴリでフィルタリング完了`);
    } else {
      setExecutionResult(`✓ ${count}個のカテゴリ (${operatorText}) でフィルタリング完了`);
    }

    setIsExecuting(false);
    setShowResult(true);
  }, [logicalOperator, prefersReducedMotion]);

  /**
   * カテゴリ選択時の処理
   */
  const handleCategoryToggle = useCallback((categoryName: string) => {
    if (disabled) return;

    let newSelectedCategories: string[];

    if (allowMultiple) {
      if (selectedCategories.includes(categoryName)) {
        newSelectedCategories = selectedCategories.filter(cat => cat !== categoryName);
      } else {
        newSelectedCategories = [...selectedCategories, categoryName];
      }
    } else {
      newSelectedCategories = selectedCategories.includes(categoryName) ? [] : [categoryName];
    }

    onCategoryChange(newSelectedCategories);

    // 自動実行モードの場合、実行アニメーションを開始
    if (autoExecute) {
      executeFilter(newSelectedCategories);
    }
  }, [selectedCategories, allowMultiple, disabled, onCategoryChange, autoExecute, executeFilter]);

  /**
   * 論理演算子の切り替え
   */
  const handleLogicalOperatorToggle = useCallback(() => {
    if (disabled || !onLogicalOperatorChange) return;
    
    const newOperator = logicalOperator === 'AND' ? 'OR' : 'AND';
    onLogicalOperatorChange(newOperator);

    if (autoExecute && selectedCategories.length > 1) {
      executeFilter(selectedCategories, newOperator);
    }
  }, [logicalOperator, onLogicalOperatorChange, disabled, autoExecute, selectedCategories, executeFilter]);

  /**
   * 関数呼び出し風のコードを生成
   */
  const generateFunctionCall = useMemo(() => {
    const styles = getSyntaxStyles();
    
    switch (theme) {
      case 'javascript':
        return (
          <div className="font-mono-code text-sm">
            <span className={styles.keyword}>const</span>{' '}
            <span className={styles.variable}>filteredNews</span>{' '}
            <span className="text-white">=</span>{' '}
            <span className={styles.function}>filterByCategories</span>
            <span className="text-white">(</span>
            <div className="ml-4">
              <span className={styles.variable}>articles</span>
              <span className="text-white">,</span>
            </div>
            <div className="ml-4">
              <span className="text-white">{'{'}</span>
              <div className="ml-4">
                <span className={styles.variable}>categories</span>
                <span className="text-white">:</span>{' '}
                <span className="text-white">[</span>
                {selectedCategories.map((cat, index) => (
                  <span key={cat}>
                    <span className={styles.string}>&quot;{cat}&quot;</span>
                    {index < selectedCategories.length - 1 && (
                      <span className="text-white">, </span>
                    )}
                  </span>
                ))}
                <span className="text-white">],</span>
              </div>
              {allowMultiple && selectedCategories.length > 1 && (
                <div className="ml-4">
                  <span className={styles.variable}>operator</span>
                  <span className="text-white">:</span>{' '}
                  <span className={styles.string}>&quot;{logicalOperator}&quot;</span>
                  <span className="text-white">,</span>
                </div>
              )}
              <div className="ml-4">
                <span className={styles.variable}>strict</span>
                <span className="text-white">:</span>{' '}
                <span className={styles.boolean}>true</span>
              </div>
            </div>
            <span className="text-white">{'}'}</span>
            <div>
              <span className="text-white">);</span>
            </div>
          </div>
        );

      case 'python':
        return (
          <div className="font-mono-code text-sm">
            <span className={styles.variable}>filtered_news</span>{' '}
            <span className="text-white">=</span>{' '}
            <span className={styles.function}>filter_by_categories</span>
            <span className="text-white">(</span>
            <div className="ml-4">
              <span className={styles.variable}>articles</span>
              <span className="text-white">,</span>
            </div>
            <div className="ml-4">
              <span className={styles.variable}>categories</span>
              <span className="text-white">=</span>
              <span className="text-white">[</span>
              {selectedCategories.map((cat, index) => (
                <span key={cat}>
                  <span className={styles.string}>&quot;{cat}&quot;</span>
                  {index < selectedCategories.length - 1 && (
                    <span className="text-white">, </span>
                  )}
                </span>
              ))}
              <span className="text-white">],</span>
            </div>
            {allowMultiple && selectedCategories.length > 1 && (
              <div className="ml-4">
                <span className={styles.variable}>operator</span>
                <span className="text-white">=</span>
                <span className={styles.string}>&quot;{logicalOperator.toLowerCase()}&quot;</span>
                <span className="text-white">,</span>
              </div>
            )}
            <div className="ml-4">
              <span className={styles.variable}>strict</span>
              <span className="text-white">=</span>
              <span className={styles.boolean}>True</span>
            </div>
            <div>
              <span className="text-white">)</span>
            </div>
          </div>
        );

      default:
        return (
          <div className="font-mono-code text-sm">
            <span className={styles.function}>filterByCategories</span>
            <span className="text-white">(</span>
            {selectedCategories.map((cat, index) => (
              <span key={cat}>
                <span className={styles.string}>&quot;{cat}&quot;</span>
                {index < selectedCategories.length - 1 && (
                  <span className="text-white">, </span>
                )}
              </span>
            ))}
            <span className="text-white">)</span>
          </div>
        );
    }
  }, [theme, selectedCategories, logicalOperator, allowMultiple, getSyntaxStyles]);

  const styles = getSyntaxStyles();

  return (
    <div className={`geek-filter-container ${className}`}>
      {/* コードエディタ風のヘッダー */}
      <div className="bg-gray-800 border-b border-gray-600 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-gray-400 text-sm font-mono-primary">
            category_filter.{theme}
          </div>
          <div className="text-xs text-gray-500">
            {selectedCategories.length} selected
          </div>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className="bg-gray-900 p-4">
        {/* 関数定義コメント */}
        <div className={`${styles.comment} mb-4 font-mono-code text-sm`}>
          <div>{'/**'}</div>
          <div>{' * カテゴリによるニュース記事のフィルタリング'}</div>
          <div>{' * @param articles - フィルタリング対象の記事配列'}</div>
          <div>{' * @param categories - 選択されたカテゴリ配列'}</div>
          {allowMultiple && (
            <div>{' * @param operator - 論理演算子 (AND/OR)'}</div>
          )}
          <div>{' */'}</div>
        </div>

        {/* 関数呼び出し表示 */}
        <div className="mb-6">
          {generateFunctionCall}
        </div>

        {/* カテゴリ選択UI */}
        <div className="mb-6">
          <div className={`${styles.comment} mb-2 font-mono-code text-sm`}>
            {'// 利用可能なカテゴリ一覧'}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category.name);
              
              return (
                <button
                  key={category.name}
                  onClick={() => handleCategoryToggle(category.name)}
                  disabled={disabled}
                  className={`
                    p-3 rounded-lg border-2 transition-all duration-200 font-mono-code text-sm
                    ${isSelected
                      ? 'border-green-400 bg-green-900 bg-opacity-30 text-green-400'
                      : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                  `}
                  aria-pressed={isSelected}
                  aria-label={`${category.displayName || category.name}カテゴリを${isSelected ? '選択解除' : '選択'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={styles.string}>
                      &quot;{category.displayName || category.name}&quot;
                    </span>
                    {category.count !== undefined && (
                      <span className={`${styles.number} ml-2`}>
                        {category.count}
                      </span>
                    )}
                  </div>
                  
                  {isSelected && (
                    <div className="mt-1 text-xs text-green-400">
                      ✓ selected
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 論理演算子選択（複数選択時のみ） */}
        {allowMultiple && selectedCategories.length > 1 && onLogicalOperatorChange && (
          <div className="mb-6">
            <div className={`${styles.comment} mb-2 font-mono-code text-sm`}>
              {'// 論理演算子の設定'}
            </div>
            
            <button
              onClick={handleLogicalOperatorToggle}
              disabled={disabled}
              className={`
                px-4 py-2 rounded-lg border-2 transition-all duration-200 font-mono-code text-sm
                border-blue-400 bg-blue-900 bg-opacity-30 text-blue-400
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-800'}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
              `}
              aria-label={`論理演算子を${logicalOperator === 'AND' ? 'OR' : 'AND'}に変更`}
            >
              <span className={styles.variable}>operator</span>
              <span className="text-white">:</span>{' '}
              <span className={styles.string}>&quot;{logicalOperator}&quot;</span>
              <span className="ml-2 text-xs">
                ({logicalOperator === 'AND' ? 'すべて' : 'いずれか'})
              </span>
            </button>
          </div>
        )}

        {/* 実行結果表示 */}
        <div className="border-t border-gray-700 pt-4">
          <div className={`${styles.comment} mb-2 font-mono-code text-sm`}>
            {'// 実行結果'}
          </div>
          
          <div className="bg-black rounded-lg p-3 min-h-[60px] font-mono-code text-sm">
            {isExecuting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                <TypingAnimation
                  key={`executing-${animationKey}`}
                  text="フィルターを実行中..."
                  speed={animationSpeed}
                  cursor={true}
                  className="text-yellow-400"
                />
              </div>
            ) : showResult ? (
              <TypingAnimation
                key={`result-${animationKey}`}
                text={executionResult}
                speed={animationSpeed}
                cursor={false}
                className="text-green-400"
              />
            ) : (
              <span className="text-gray-500">
                {'// カテゴリを選択してフィルターを実行'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * シンプル版のFunctionCallFilter（軽量版）
 */
interface SimpleFunctionCallFilterProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  allowMultiple?: boolean;
  className?: string;
}

export const SimpleFunctionCallFilter: React.FC<SimpleFunctionCallFilterProps> = ({
  categories,
  selectedCategories,
  onCategoryChange,
  allowMultiple = true,
  className = '',
}) => {
  const handleCategoryToggle = useCallback((categoryName: string) => {
    let newSelectedCategories: string[];

    if (allowMultiple) {
      if (selectedCategories.includes(categoryName)) {
        newSelectedCategories = selectedCategories.filter(cat => cat !== categoryName);
      } else {
        newSelectedCategories = [...selectedCategories, categoryName];
      }
    } else {
      newSelectedCategories = selectedCategories.includes(categoryName) ? [] : [categoryName];
    }

    onCategoryChange(newSelectedCategories);
  }, [selectedCategories, allowMultiple, onCategoryChange]);

  return (
    <div className={`inline-flex flex-wrap gap-2 ${className}`}>
      <span className="text-blue-400 font-mono-code text-sm">filterByCategories(</span>
      {categories.map((category, index) => {
        const isSelected = selectedCategories.includes(category);
        
        return (
          <React.Fragment key={category}>
            <button
              onClick={() => handleCategoryToggle(category)}
              className={`
                px-2 py-1 rounded font-mono-code text-sm transition-all duration-200
                ${isSelected
                  ? 'bg-green-900 bg-opacity-50 text-green-400 border border-green-400'
                  : 'bg-gray-800 text-gray-400 border border-gray-600 hover:border-gray-500'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
              `}
              aria-pressed={isSelected}
            >
              &quot;{category}&quot;
            </button>
            {index < categories.length - 1 && (
              <span className="text-white font-mono-code text-sm self-center">,</span>
            )}
          </React.Fragment>
        );
      })}
      <span className="text-blue-400 font-mono-code text-sm">)</span>
    </div>
  );
};

export default FunctionCallFilter;