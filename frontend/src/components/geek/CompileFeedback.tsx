import React, { useState, useEffect } from 'react';

/**
 * コンパイル状態の種類
 */
export type CompileStatus = 'compiling' | 'success' | 'error' | 'warning';

/**
 * コンパイルステップの情報
 */
export interface CompileStep {
  id: string;
  message: string;
  status: CompileStatus;
  duration?: number;
  details?: string;
}

/**
 * CompileFeedbackコンポーネントのプロパティ
 */
export interface CompileFeedbackProps {
  steps: CompileStep[];
  currentStep?: string;
  onComplete?: (success: boolean) => void;
  className?: string;
  showProgress?: boolean;
  autoScroll?: boolean;
}

/**
 * ステータス別のスタイル設定
 */
const STATUS_STYLES = {
  compiling: {
    icon: '⚙️',
    color: 'text-yellow-400',
    prefix: '[COMPILING]'
  },
  success: {
    icon: '✅',
    color: 'text-green-400', 
    prefix: '[SUCCESS]'
  },
  error: {
    icon: '❌',
    color: 'text-red-400',
    prefix: '[ERROR]'
  },
  warning: {
    icon: '⚠️',
    color: 'text-yellow-400',
    prefix: '[WARNING]'
  }
};

/**
 * コンパイル風フィードバックメッセージコンポーネント
 * 
 * 機能:
 * - コンパイル進行状況の表示
 * - ステップ別の成功/失敗表示
 * - プログレスバー
 * - 自動スクロール
 */
export const CompileFeedback: React.FC<CompileFeedbackProps> = ({
  steps,
  currentStep,
  onComplete,
  className = '',
  showProgress = true,
  autoScroll = true
}) => {
  const [visibleSteps, setVisibleSteps] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // ステップの表示アニメーション
  useEffect(() => {
    if (steps.length === 0) return;

    const timer = setTimeout(() => {
      const newVisibleSteps = steps.map(step => step.id);
      setVisibleSteps(newVisibleSteps);
    }, 100);

    return () => clearTimeout(timer);
  }, [steps]);

  // 完了状態の監視
  useEffect(() => {
    const allCompleted = steps.every(step => 
      step.status === 'success' || step.status === 'error' || step.status === 'warning'
    );
    
    if (allCompleted && !isComplete && steps.length > 0) {
      setIsComplete(true);
      const hasErrors = steps.some(step => step.status === 'error');
      onComplete?.(!hasErrors);
    }
  }, [steps, isComplete, onComplete]);

  // プログレス計算
  const completedSteps = steps.filter(step => 
    step.status !== 'compiling'
  ).length;
  const progressPercentage = steps.length > 0 
    ? (completedSteps / steps.length) * 100 
    : 0;

  return (
    <div className={`font-mono text-sm ${className}`}>
      {/* プログレスバー */}
      {showProgress && steps.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>コンパイル進行状況</span>
            <span>{completedSteps}/{steps.length}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-400 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* コンパイルステップ一覧 */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {steps.map((step, index) => {
          const style = STATUS_STYLES[step.status];
          const isVisible = visibleSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          
          return (
            <div
              key={step.id}
              className={`
                flex items-start space-x-3 p-2 rounded
                ${isCurrent ? 'bg-gray-800/50 border-l-2 border-green-400' : ''}
                ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
                transition-all duration-300 ease-out
              `}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {/* ステータスアイコン */}
              <div className="flex-shrink-0 mt-0.5">
                {step.status === 'compiling' ? (
                  <div className="animate-spin text-yellow-400">⚙️</div>
                ) : (
                  <span>{style.icon}</span>
                )}
              </div>

              {/* メッセージ内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className={`font-bold ${style.color}`}>
                    {style.prefix}
                  </span>
                  <span className="text-gray-300">
                    {step.message}
                  </span>
                  {step.duration && (
                    <span className="text-gray-500 text-xs">
                      ({step.duration}ms)
                    </span>
                  )}
                </div>
                
                {/* 詳細情報 */}
                {step.details && (
                  <div className="mt-1 text-xs text-gray-400 pl-4 border-l border-gray-600">
                    {step.details}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 完了メッセージ */}
      {isComplete && (
        <div className="mt-4 p-3 border border-green-500/30 bg-green-900/20 rounded">
          <div className="flex items-center space-x-2">
            <span className="text-green-400">✨</span>
            <span className="text-green-400 font-bold">
              [BUILD COMPLETE]
            </span>
            <span className="text-gray-300">
              {steps.some(s => s.status === 'error') 
                ? 'エラーが発生しましたが処理を完了しました'
                : 'すべての処理が正常に完了しました'
              }
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            総ステップ数: {steps.length} | 
            成功: {steps.filter(s => s.status === 'success').length} | 
            警告: {steps.filter(s => s.status === 'warning').length} | 
            エラー: {steps.filter(s => s.status === 'error').length}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompileFeedback;