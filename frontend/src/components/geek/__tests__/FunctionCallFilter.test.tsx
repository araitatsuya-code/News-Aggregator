import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FunctionCallFilter, SimpleFunctionCallFilter } from '../FunctionCallFilter';

// next-i18nextのモック
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// matchMediaのモック
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('FunctionCallFilter', () => {
  const mockCategories = [
    { name: 'AI', displayName: 'AI', count: 10 },
    { name: 'ML', displayName: 'Machine Learning', count: 5 },
    { name: 'Claude', displayName: 'Claude', count: 3 },
    { name: '国内', displayName: '国内ニュース', count: 8 },
  ];

  const defaultProps = {
    categories: mockCategories,
    selectedCategories: [],
    onCategoryChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本的なレンダリング', () => {
    test('コンポーネントが正常にレンダリングされる', () => {
      render(<FunctionCallFilter {...defaultProps} />);
      
      expect(screen.getByText('category_filter.javascript')).toBeInTheDocument();
      expect(screen.getByText('0 selected')).toBeInTheDocument();
      // テキストが複数の要素に分かれているため、部分マッチを使用
      expect(screen.getByText(/カテゴリによるニュース記事のフィルタリング/)).toBeInTheDocument();
    });

    test('すべてのカテゴリが表示される', () => {
      render(<FunctionCallFilter {...defaultProps} />);
      
      mockCategories.forEach(category => {
        expect(screen.getByText(`"${category.displayName}"`)).toBeInTheDocument();
        if (category.count !== undefined) {
          expect(screen.getByText(category.count.toString())).toBeInTheDocument();
        }
      });
    });

    test('テーマに応じたファイル拡張子が表示される', () => {
      const { rerender } = render(<FunctionCallFilter {...defaultProps} theme="python" />);
      expect(screen.getByText('category_filter.python')).toBeInTheDocument();

      rerender(<FunctionCallFilter {...defaultProps} theme="typescript" />);
      expect(screen.getByText('category_filter.typescript')).toBeInTheDocument();
    });
  });

  describe('カテゴリ選択機能', () => {
    test('カテゴリをクリックすると選択される', async () => {
      const user = userEvent.setup();
      const onCategoryChange = jest.fn();
      
      render(
        <FunctionCallFilter 
          {...defaultProps} 
          onCategoryChange={onCategoryChange}
        />
      );
      
      const aiCategory = screen.getByRole('button', { name: /AIカテゴリを選択/ });
      await user.click(aiCategory);
      
      expect(onCategoryChange).toHaveBeenCalledWith(['AI']);
    });

    test('選択されたカテゴリが視覚的にハイライトされる', async () => {
      const user = userEvent.setup();
      
      render(
        <FunctionCallFilter 
          {...defaultProps} 
          selectedCategories={['AI']}
        />
      );
      
      const aiCategory = screen.getByRole('button', { name: /AIカテゴリを選択解除/ });
      expect(aiCategory).toHaveClass('border-green-400', 'bg-green-900');
      expect(screen.getByText('✓')).toBeInTheDocument();
      expect(screen.getByText('selected')).toBeInTheDocument();
    });

    test('複数選択が有効な場合、複数のカテゴリを選択できる', async () => {
      const user = userEvent.setup();
      const onCategoryChange = jest.fn();
      
      render(
        <FunctionCallFilter 
          {...defaultProps} 
          onCategoryChange={onCategoryChange}
          selectedCategories={['AI']}
          allowMultiple={true}
        />
      );
      
      const mlCategory = screen.getByRole('button', { name: /Machine Learningカテゴリを選択/ });
      await user.click(mlCategory);
      
      expect(onCategoryChange).toHaveBeenCalledWith(['AI', 'ML']);
    });

    test('単一選択モードでは一つのカテゴリのみ選択可能', async () => {
      const user = userEvent.setup();
      const onCategoryChange = jest.fn();
      
      render(
        <FunctionCallFilter 
          {...defaultProps} 
          onCategoryChange={onCategoryChange}
          selectedCategories={['AI']}
          allowMultiple={false}
        />
      );
      
      const mlCategory = screen.getByRole('button', { name: /Machine Learningカテゴリを選択/ });
      await user.click(mlCategory);
      
      expect(onCategoryChange).toHaveBeenCalledWith(['ML']);
    });

    test('選択されたカテゴリを再度クリックすると選択解除される', async () => {
      const user = userEvent.setup();
      const onCategoryChange = jest.fn();
      
      render(
        <FunctionCallFilter 
          {...defaultProps} 
          onCategoryChange={onCategoryChange}
          selectedCategories={['AI']}
        />
      );
      
      const aiCategory = screen.getByRole('button', { name: /AIカテゴリを選択解除/ });
      await user.click(aiCategory);
      
      expect(onCategoryChange).toHaveBeenCalledWith([]);
    });
  });

  describe('論理演算子機能', () => {
    test('複数選択時に論理演算子ボタンが表示される', () => {
      render(
        <FunctionCallFilter 
          {...defaultProps} 
          selectedCategories={['AI', 'ML']}
          allowMultiple={true}
          onLogicalOperatorChange={jest.fn()}
        />
      );
      
      // 複数の"OR"テキストがあるため、より具体的なセレクターを使用
      expect(screen.getByText('(いずれか)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /論理演算子をANDに変更/ })).toBeInTheDocument();
    });

    test('論理演算子ボタンをクリックするとANDとORが切り替わる', async () => {
      const user = userEvent.setup();
      const onLogicalOperatorChange = jest.fn();
      
      render(
        <FunctionCallFilter 
          {...defaultProps} 
          selectedCategories={['AI', 'ML']}
          allowMultiple={true}
          logicalOperator="OR"
          onLogicalOperatorChange={onLogicalOperatorChange}
        />
      );
      
      const operatorButton = screen.getByRole('button', { name: /論理演算子をANDに変更/ });
      await user.click(operatorButton);
      
      expect(onLogicalOperatorChange).toHaveBeenCalledWith('AND');
    });

    test('単一選択時は論理演算子ボタンが表示されない', () => {
      render(
        <FunctionCallFilter 
          {...defaultProps} 
          selectedCategories={['AI']}
          allowMultiple={true}
          onLogicalOperatorChange={jest.fn()}
        />
      );
      
      expect(screen.queryByText('(いずれか)')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /論理演算子を/ })).not.toBeInTheDocument();
    });
  });

  describe('無効化状態', () => {
    test('disabled=trueの場合、すべてのボタンが無効化される', () => {
      render(
        <FunctionCallFilter 
          {...defaultProps} 
          disabled={true}
        />
      );
      
      const categoryButtons = screen.getAllByRole('button');
      categoryButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('アニメーション機能', () => {
    test('autoExecute=trueの場合、カテゴリ選択時に実行アニメーションが開始される', async () => {
      const user = userEvent.setup();
      
      render(
        <FunctionCallFilter 
          {...defaultProps} 
          autoExecute={true}
        />
      );
      
      const aiCategory = screen.getByRole('button', { name: /AIカテゴリを選択/ });
      await user.click(aiCategory);
      
      // スピナーアイコンの存在を確認（テキストはTypingAnimationで非同期表示されるため）
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('実行完了後に結果メッセージが表示される', async () => {
      const user = userEvent.setup();
      
      render(
        <FunctionCallFilter 
          {...defaultProps} 
          autoExecute={true}
          animationSpeed={1} // 高速化
        />
      );
      
      const aiCategory = screen.getByRole('button', { name: /AIカテゴリを選択/ });
      await user.click(aiCategory);
      
      await waitFor(() => {
        expect(screen.getByText(/フィルタリング完了/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('テーマ別のコード生成', () => {
    test('JavaScriptテーマでconst文が生成される', () => {
      render(
        <FunctionCallFilter 
          {...defaultProps} 
          theme="javascript"
          selectedCategories={['AI']}
        />
      );
      
      expect(screen.getByText('const')).toBeInTheDocument();
      expect(screen.getByText('filteredNews')).toBeInTheDocument();
      expect(screen.getByText('filterByCategories')).toBeInTheDocument();
    });

    test('Pythonテーマでpython風の構文が生成される', () => {
      render(
        <FunctionCallFilter 
          {...defaultProps} 
          theme="python"
          selectedCategories={['AI']}
        />
      );
      
      expect(screen.getByText('filtered_news')).toBeInTheDocument();
      expect(screen.getByText('filter_by_categories')).toBeInTheDocument();
      expect(screen.getByText('True')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    test('適切なARIAラベルが設定されている', () => {
      render(<FunctionCallFilter {...defaultProps} />);
      
      const aiCategory = screen.getByRole('button', { name: /AIカテゴリを選択/ });
      expect(aiCategory).toHaveAttribute('aria-pressed', 'false');
    });

    test('選択状態がaria-pressedで表現される', () => {
      render(
        <FunctionCallFilter 
          {...defaultProps} 
          selectedCategories={['AI']}
        />
      );
      
      const aiCategory = screen.getByRole('button', { name: /AIカテゴリを選択解除/ });
      expect(aiCategory).toHaveAttribute('aria-pressed', 'true');
    });

    test('キーボードナビゲーションが機能する', async () => {
      const user = userEvent.setup();
      const onCategoryChange = jest.fn();
      
      render(
        <FunctionCallFilter 
          {...defaultProps} 
          onCategoryChange={onCategoryChange}
        />
      );
      
      const aiCategory = screen.getByRole('button', { name: /AIカテゴリを選択/ });
      aiCategory.focus();
      
      await user.keyboard('{Enter}');
      expect(onCategoryChange).toHaveBeenCalledWith(['AI']);
    });
  });
});

describe('SimpleFunctionCallFilter', () => {
  const mockCategories = ['AI', 'ML', 'Claude', '国内'];
  
  const defaultProps = {
    categories: mockCategories,
    selectedCategories: [],
    onCategoryChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('シンプル版が正常にレンダリングされる', () => {
    render(<SimpleFunctionCallFilter {...defaultProps} />);
    
    expect(screen.getByText('filterByCategories(')).toBeInTheDocument();
    mockCategories.forEach(category => {
      expect(screen.getByText(`"${category}"`)).toBeInTheDocument();
    });
  });

  test('カテゴリ選択が機能する', async () => {
    const user = userEvent.setup();
    const onCategoryChange = jest.fn();
    
    render(
      <SimpleFunctionCallFilter 
        {...defaultProps} 
        onCategoryChange={onCategoryChange}
      />
    );
    
    // 最初のカテゴリボタンを取得
    const aiCategory = screen.getByText('"AI"').closest('button');
    expect(aiCategory).toBeInTheDocument();
    
    if (aiCategory) {
      await user.click(aiCategory);
      expect(onCategoryChange).toHaveBeenCalled();
    }
  });

  test('選択されたカテゴリがハイライトされる', () => {
    render(
      <SimpleFunctionCallFilter 
        {...defaultProps} 
        selectedCategories={['AI']}
      />
    );
    
    const aiButton = screen.getByRole('button', { pressed: true });
    expect(aiButton).toHaveClass('bg-green-900', 'text-green-400');
  });
});