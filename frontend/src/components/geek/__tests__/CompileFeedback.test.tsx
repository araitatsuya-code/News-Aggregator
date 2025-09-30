import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CompileFeedback, CompileStep } from '../CompileFeedback';

/**
 * CompileFeedbackコンポーネントのテスト
 */
describe('CompileFeedback', () => {
  const mockSteps: CompileStep[] = [
    {
      id: 'step1',
      message: 'データを読み込み中...',
      status: 'success',
      duration: 150
    },
    {
      id: 'step2', 
      message: 'フィルターを適用中...',
      status: 'compiling'
    },
    {
      id: 'step3',
      message: 'エラーが発生しました',
      status: 'error',
      details: '接続がタイムアウトしました'
    }
  ];

  it('コンパイルステップを正しく表示する', () => {
    render(<CompileFeedback steps={mockSteps} />);
    
    expect(screen.getByText('[SUCCESS]')).toBeInTheDocument();
    expect(screen.getByText('データを読み込み中...')).toBeInTheDocument();
    expect(screen.getByText('[COMPILING]')).toBeInTheDocument();
    expect(screen.getByText('フィルターを適用中...')).toBeInTheDocument();
    expect(screen.getByText('[ERROR]')).toBeInTheDocument();
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
  });

  it('プログレスバーが正しく表示される', () => {
    render(<CompileFeedback steps={mockSteps} showProgress={true} />);
    
    expect(screen.getByText('コンパイル進行状況')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument(); // 完了したステップ数
  });

  it('実行時間が表示される', () => {
    render(<CompileFeedback steps={mockSteps} />);
    
    expect(screen.getByText('(150ms)')).toBeInTheDocument();
  });

  it('詳細情報が表示される', () => {
    render(<CompileFeedback steps={mockSteps} />);
    
    expect(screen.getByText('接続がタイムアウトしました')).toBeInTheDocument();
  });

  it('現在のステップがハイライトされる', () => {
    const { container } = render(
      <CompileFeedback steps={mockSteps} currentStep="step2" />
    );
    
    // 現在のステップに特別なスタイルが適用されているかチェック
    const currentStepElement = container.querySelector('.border-l-2.border-green-400');
    expect(currentStepElement).toBeInTheDocument();
  });

  it('完了時にサマリーが表示される', async () => {
    const completedSteps: CompileStep[] = [
      { id: 'step1', message: 'ステップ1', status: 'success' },
      { id: 'step2', message: 'ステップ2', status: 'warning' },
      { id: 'step3', message: 'ステップ3', status: 'error' }
    ];

    const mockOnComplete = jest.fn();
    render(
      <CompileFeedback 
        steps={completedSteps} 
        onComplete={mockOnComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('[BUILD COMPLETE]')).toBeInTheDocument();
      expect(screen.getByText(/総ステップ数: 3/)).toBeInTheDocument();
      expect(screen.getByText(/成功: 1/)).toBeInTheDocument();
      expect(screen.getByText(/警告: 1/)).toBeInTheDocument();
      expect(screen.getByText(/エラー: 1/)).toBeInTheDocument();
    });

    expect(mockOnComplete).toHaveBeenCalledWith(false); // エラーがあるのでfalse
  });

  it('空のステップ配列でも正常に動作する', () => {
    render(<CompileFeedback steps={[]} />);
    
    // エラーが発生しないことを確認
    expect(screen.queryByText('[BUILD COMPLETE]')).not.toBeInTheDocument();
  });

  it('プログレスバーを非表示にできる', () => {
    render(<CompileFeedback steps={mockSteps} showProgress={false} />);
    
    expect(screen.queryByText('コンパイル進行状況')).not.toBeInTheDocument();
  });
});