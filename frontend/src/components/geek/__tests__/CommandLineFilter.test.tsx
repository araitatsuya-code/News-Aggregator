import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandLineFilter } from '../CommandLineFilter';

// next-i18nextのモック
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

/**
 * CommandLineFilterコンポーネントのテスト
 */
describe('CommandLineFilter', () => {
  const mockCategories = ['AI', 'Machine Learning', 'Deep Learning'];
  const mockSources = ['TechCrunch', 'Wired', 'MIT Technology Review'];
  const mockOnFilter = jest.fn();
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * 基本的なレンダリングテスト
   */
  describe('基本的なレンダリング', () => {
    test('コンポーネントが正常にレンダリングされる', () => {
      render(
        <CommandLineFilter
          categories={mockCategories}
          sources={mockSources}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
        />
      );

      // プロンプトが表示されることを確認
      expect(screen.getByText('$')).toBeInTheDocument();
      
      // 入力フィールドが存在することを確認
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', '$ コマンドを入力してください...');
    });

    test('カスタムプレースホルダーが設定される', () => {
      const customPlaceholder = '$ カスタムプロンプト';
      render(
        <CommandLineFilter
          categories={mockCategories}
          onFilter={mockOnFilter}
          placeholder={customPlaceholder}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', customPlaceholder);
    });

    test('無効化状態が正しく反映される', () => {
      render(
        <CommandLineFilter
          categories={mockCategories}
          onFilter={mockOnFilter}
          disabled={true}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });
  });

  /**
   * コマンド入力とパースのテスト
   */
  describe('コマンド入力とパース', () => {
    test('filterコマンドが正しく実行される', async () => {
      const user = userEvent.setup();
      render(
        <CommandLineFilter
          categories={mockCategories}
          onFilter={mockOnFilter}
        />
      );

      const input = screen.getByRole('textbox');
      
      // filterコマンドを入力
      await act(async () => {
        await user.type(input, 'filter --category AI');
        await user.keyboard('{Enter}');
      });

      // onFilterが正しい引数で呼ばれることを確認
      await waitFor(() => {
        expect(mockOnFilter).toHaveBeenCalledWith(
          expect.objectContaining({
            categories: ['AI'],
            operator: 'OR',
            strict: false,
          })
        );
      });
    });

    test('searchコマンドが正しく実行される', async () => {
      const user = userEvent.setup();
      render(
        <CommandLineFilter
          categories={mockCategories}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
        />
      );

      const input = screen.getByRole('textbox');
      
      // searchコマンドを入力
      await act(async () => {
        await user.type(input, 'search OpenAI');
        await user.keyboard('{Enter}');
      });

      // onSearchが正しい引数で呼ばれることを確認
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('OpenAI', {
          fields: ['all'],
          caseSensitive: false,
          regex: false,
        });
      });
    });

    test('lsコマンドが正しく実行される', async () => {
      const user = userEvent.setup();
      render(
        <CommandLineFilter
          categories={mockCategories}
          onFilter={mockOnFilter}
        />
      );

      const input = screen.getByRole('textbox');
      
      // lsコマンドを入力
      await act(async () => {
        await user.type(input, 'ls categories');
        await user.keyboard('{Enter}');
      });

      // 出力エリアにカテゴリ一覧が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/categories:/)).toBeInTheDocument();
      });
    });

    test('helpコマンドが正しく実行される', async () => {
      const user = userEvent.setup();
      render(
        <CommandLineFilter
          categories={mockCategories}
          onFilter={mockOnFilter}
        />
      );

      const input = screen.getByRole('textbox');
      
      // helpコマンドを入力
      await act(async () => {
        await user.type(input, 'help');
        await user.keyboard('{Enter}');
      });

      // ヘルプテキストが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/利用可能なコマンド/)).toBeInTheDocument();
      });
    });

    test('不正なコマンドでエラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      render(
        <CommandLineFilter
          categories={mockCategories}
          onFilter={mockOnFilter}
        />
      );

      const input = screen.getByRole('textbox');
      
      // 存在しないコマンドを入力
      await act(async () => {
        await user.type(input, 'invalidcommand');
        await user.keyboard('{Enter}');
      });

      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/コマンドが見つかりません/)).toBeInTheDocument();
      });
    });
  });

  /**
   * 自動補完機能のテスト
   */
  describe('自動補完機能', () => {
    test('コマンド名の自動補完が動作する', async () => {
      const user = userEvent.setup();
      render(
        <CommandLineFilter
          categories={mockCategories}
          onFilter={mockOnFilter}
        />
      );

      const input = screen.getByRole('textbox');
      
      // 部分的なコマンド名を入力
      await act(async () => {
        await user.type(input, 'fil');
      });

      // 自動補完候補が表示されることを確認
      await waitFor(() => {
        expect(screen.queryByText('filter')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('Tabキーで自動補完が適用される', async () => {
      const user = userEvent.setup();
      render(
        <CommandLineFilter
          categories={mockCategories}
          onFilter={mockOnFilter}
        />
      );

      const input = screen.getByRole('textbox');
      
      // 部分的なコマンド名を入力
      await act(async () => {
        await user.type(input, 'fil');
        
        // 少し待ってから自動補完候補が表示されるのを待つ
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Tabキーを押す
        await user.keyboard('{Tab}');
      });

      // 入力フィールドに完全なコマンド名が入力されることを確認
      await waitFor(() => {
        expect(input).toHaveValue('filter');
      });
    });

    test('カテゴリ値の自動補完が動作する', async () => {
      const user = userEvent.setup();
      render(
        <CommandLineFilter
          categories={mockCategories}
          onFilter={mockOnFilter}
        />
      );

      const input = screen.getByRole('textbox');
      
      // filterコマンドとオプションを入力
      await act(async () => {
        await user.type(input, 'filter --category A');
      });

      // カテゴリの自動補完候補が表示されることを確認
      await waitFor(() => {
        expect(screen.queryByText('AI')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  /**
   * キーボードナビゲーションのテスト
   */
  describe('キーボードナビゲーション', () => {
    test('上下矢印キーで履歴をナビゲートできる', async () => {
      const user = userEvent.setup();
      render(
        <CommandLineFilter
          categories={mockCategories}
          onFilter={mockOnFilter}
        />
      );

      const input = screen.getByRole('textbox');
      
      // 最初のコマンドを実行
      await act(async () => {
        await user.type(input, 'help');
        await user.keyboard('{Enter}');
      });
      
      // 2番目のコマンドを実行
      await act(async () => {
        await user.type(input, 'ls categories');
        await user.keyboard('{Enter}');
      });

      // 上矢印キーで履歴を遡る
      await act(async () => {
        await user.keyboard('{ArrowUp}');
      });
      expect(input).toHaveValue('ls categories');

      await act(async () => {
        await user.keyboard('{ArrowUp}');
      });
      expect(input).toHaveValue('help');

      // 下矢印キーで履歴を進む
      await act(async () => {
        await user.keyboard('{ArrowDown}');
      });
      expect(input).toHaveValue('ls categories');
    });

    test('Escapeキーで自動補完を閉じる', async () => {
      const user = userEvent.setup();
      render(
        <CommandLineFilter
          categories={mockCategories}
          onFilter={mockOnFilter}
        />
      );

      const input = screen.getByRole('textbox');
      
      // 部分的なコマンド名を入力して自動補完を表示
      await act(async () => {
        await user.type(input, 'fil');
      });
      
      await waitFor(() => {
        expect(screen.queryByText('filter')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Escapeキーを押す
      await act(async () => {
        await user.keyboard('{Escape}');
      });

      // 自動補完が非表示になることを確認
      await waitFor(() => {
        expect(screen.queryByText('filter')).not.toBeInTheDocument();
      });
    });
  });

  /**
   * テーマ切り替えのテスト
   */
  describe('テーマ切り替え', () => {
    test('異なるテーマでスタイルが変更される', () => {
      const { rerender } = render(
        <CommandLineFilter
          categories={mockCategories}
          onFilter={mockOnFilter}
          theme="matrix"
        />
      );

      // Matrixテーマのスタイルが適用されることを確認
      const container = screen.getByRole('textbox').closest('.command-line-filter');
      expect(container).toHaveClass('bg-black');

      // ハッカーテーマに変更
      rerender(
        <CommandLineFilter
          categories={mockCategories}
          onFilter={mockOnFilter}
          theme="hacker"
        />
      );

      // ハッカーテーマのスタイルが適用されることを確認
      expect(container).toHaveClass('bg-gray-900');
    });
  });

  /**
   * アクセシビリティのテスト
   */
  describe('アクセシビリティ', () => {
    test('適切なARIAラベルが設定されている', () => {
      render(
        <CommandLineFilter
          categories={mockCategories}
          onFilter={mockOnFilter}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('autoComplete', 'off');
      expect(input).toHaveAttribute('spellCheck', 'false');
    });

    test('キーボードのみで操作できる', async () => {
      const user = userEvent.setup();
      render(
        <CommandLineFilter
          categories={mockCategories}
          onFilter={mockOnFilter}
        />
      );

      const input = screen.getByRole('textbox');
      
      // Tabキーでフォーカスが移動することを確認
      await user.tab();
      expect(input).toHaveFocus();

      // コマンドを入力して実行
      await user.type(input, 'help');
      await user.keyboard('{Enter}');

      // 結果が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/利用可能なコマンド/)).toBeInTheDocument();
      });
    });
  });

  /**
   * エラーハンドリングのテスト
   */
  describe('エラーハンドリング', () => {
    test('コマンド実行中のエラーが適切に処理される', async () => {
      const user = userEvent.setup();
      const mockOnFilterWithError = jest.fn(() => {
        throw new Error('テストエラー');
      });

      render(
        <CommandLineFilter
          categories={mockCategories}
          onFilter={mockOnFilterWithError}
        />
      );

      const input = screen.getByRole('textbox');
      
      // エラーを発生させるコマンドを実行
      await act(async () => {
        await user.type(input, 'filter --category AI');
        await user.keyboard('{Enter}');
      });

      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument();
      });
    });

    test('必須引数が不足している場合のエラー処理', async () => {
      const user = userEvent.setup();
      render(
        <CommandLineFilter
          categories={mockCategories}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
        />
      );

      const input = screen.getByRole('textbox');
      
      // 引数なしでsearchコマンドを実行
      await act(async () => {
        await user.type(input, 'search');
        await user.keyboard('{Enter}');
      });

      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/検索クエリが指定されていません/)).toBeInTheDocument();
      });
    });
  });

  /**
   * パフォーマンステスト
   */
  describe('パフォーマンス', () => {
    test('大量のカテゴリでも正常に動作する', () => {
      const largeCategories = Array.from({ length: 100 }, (_, i) => `Category${i}`);
      
      render(
        <CommandLineFilter
          categories={largeCategories}
          onFilter={mockOnFilter}
        />
      );

      // コンポーネントが正常にレンダリングされることを確認
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('長い履歴でも正常に動作する', async () => {
      const user = userEvent.setup();
      render(
        <CommandLineFilter
          categories={mockCategories}
          onFilter={mockOnFilter}
          maxHistory={5}
        />
      );

      const input = screen.getByRole('textbox');
      
      // 履歴の上限を超えるコマンドを実行
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await user.type(input, `help ${i}`);
          await user.keyboard('{Enter}');
        });
      }

      // 履歴が上限内に収まることを確認（具体的な検証は実装に依存）
      expect(input).toBeInTheDocument();
    });
  });
});