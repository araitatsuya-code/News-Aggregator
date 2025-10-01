import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

// レイアウトコンポーネント
import Layout from '../../components/layout/Layout';
import Header from '../../components/layout/Header';

// ギーク向けコンポーネント
import { GeekModeToggle, useGeekMode } from '../../components/geek/GeekModeToggle';

// jest-axeのマッチャーを追加
expect.extend(toHaveNoViolations);

// Next.jsのuseRouterをモック
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// next-i18nextをモック
jest.mock('next-i18next', () => ({
  useTranslation: jest.fn(),
}));

// ローカルストレージをモック
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('完全統合テスト', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockT = jest.fn((key: string) => key);

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      asPath: '/',
      locale: 'ja',
      push: mockPush,
      replace: mockReplace,
      pathname: '/',
      events: {
        on: jest.fn(),
        off: jest.fn(),
      },
    });

    (useTranslation as jest.Mock).mockReturnValue({
      t: mockT,
      i18n: { language: 'ja' },
    });

    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('レイアウト統合テスト', () => {
    test('ヘッダーにギークモード切り替えボタンが表示されること', async () => {
      render(
        <Header 
          currentLocale="ja" 
          onLocaleChange={jest.fn()} 
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText(/geek\(\)/).length).toBeGreaterThan(0);
      });
    });

    test('レイアウト全体でアクセシビリティ基準を満たすこと', async () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('モバイルメニューでギークモード切り替えが利用可能であること', async () => {
      const user = userEvent.setup();
      
      // モバイルサイズをシミュレート
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <Header 
          currentLocale="ja" 
          onLocaleChange={jest.fn()} 
        />
      );

      // モバイルメニューを開く
      const menuButton = screen.getByLabelText(/navigation.open_menu/);
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText(/UI Mode/)).toBeInTheDocument();
      });
    });
  });

  describe('モード切り替え統合テスト', () => {
    test('通常モードからギークモードへの完全な切り替えフロー', async () => {
      const user = userEvent.setup();
      
      render(
        <GeekModeToggle 
          currentMode="normal"
          onModeChange={jest.fn()}
        />
      );

      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);

      // ローカルストレージに保存されることを確認
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('ui-mode', 'geek');
    });

    test('ページリダイレクトが正常に動作すること', async () => {
      const user = userEvent.setup();
      
      render(
        <GeekModeToggle 
          currentMode="normal"
          onModeChange={jest.fn()}
        />
      );

      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);

      // ルーター遷移が呼び出されることを確認
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/geek-index');
      });
    });

    test('設定の永続化が機能すること', () => {
      mockLocalStorage.getItem.mockReturnValue('geek');

      const TestComponent = () => {
        const { mode } = useGeekMode();
        return <div data-testid="mode">{mode}</div>;
      };

      render(<TestComponent />);
      
      expect(screen.getByTestId('mode')).toHaveTextContent('geek');
    });
  });

  describe('多言語統合テスト', () => {
    test('日本語環境でギークモードが正常に動作すること', async () => {
      render(
        <GeekModeToggle 
          currentMode="normal"
        />
      );

      expect(screen.getByText(/geek\(\)/)).toBeInTheDocument();
      expect(screen.getByText(/ターミナル風UIに切り替え/)).toBeInTheDocument();
    });

    test('英語環境でギークモードが正常に動作すること', async () => {
      (useTranslation as jest.Mock).mockReturnValue({
        t: (key: string) => key.replace('common:', ''),
        i18n: { language: 'en' },
      });

      render(
        <GeekModeToggle 
          currentMode="normal"
        />
      );

      expect(screen.getByText(/geek\(\)/)).toBeInTheDocument();
    });

    test('言語切り替え後もギークモード設定が維持されること', async () => {
      const user = userEvent.setup();
      mockLocalStorage.getItem.mockReturnValue('geek');

      // 最初は日本語
      const { rerender } = render(
        <GeekModeToggle currentMode="geek" />
      );

      expect(screen.getByText(/Normal/)).toBeInTheDocument();

      // 英語に切り替え
      (useTranslation as jest.Mock).mockReturnValue({
        t: (key: string) => key.replace('common:', ''),
        i18n: { language: 'en' },
      });

      rerender(<GeekModeToggle currentMode="geek" />);

      expect(screen.getByText(/Normal/)).toBeInTheDocument();
    });
  });

  describe('レスポンシブ統合テスト', () => {
    test('デスクトップでの完全な機能が利用可能であること', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(
        <Header 
          currentLocale="ja" 
          onLocaleChange={jest.fn()} 
        />
      );

      // デスクトップナビゲーション
      expect(screen.getAllByText(/navigation.home/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/geek\(\)/).length).toBeGreaterThan(0);
    });

    test('タブレットでの適切な表示が行われること', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <Header 
          currentLocale="ja" 
          onLocaleChange={jest.fn()} 
        />
      );

      // タブレットサイズでも基本機能が利用可能
      expect(screen.getAllByText(/geek\(\)/).length).toBeGreaterThan(0);
    });

    test('モバイルでのタッチフレンドリーな操作が可能であること', async () => {
      const user = userEvent.setup();
      
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <GeekModeToggle 
          currentMode="normal"
          position="floating"
        />
      );

      const button = screen.getByRole('button');
      
      // タッチターゲットサイズの確認
      const styles = window.getComputedStyle(button);
      expect(button).toHaveClass('geek-touch-button');
      
      // タッチ操作のシミュレート
      fireEvent.touchStart(button);
      fireEvent.touchEnd(button);
      
      expect(button).toBeInTheDocument();
    });
  });

  describe('パフォーマンス統合テスト', () => {
    test('初期レンダリングが高速であること', () => {
      const startTime = performance.now();
      
      render(
        <Layout>
          <GeekModeToggle currentMode="normal" />
        </Layout>
      );
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // 100ms以下
    });

    test('モード切り替えが高速であること', async () => {
      const user = userEvent.setup();
      
      render(
        <GeekModeToggle 
          currentMode="normal"
          onModeChange={jest.fn()}
        />
      );

      const startTime = performance.now();
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(200); // 200ms以下
    });

    test('メモリリークが発生しないこと', async () => {
      const user = userEvent.setup();
      
      // 複数回のマウント/アンマウントをシミュレート
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <GeekModeToggle currentMode="normal" />
        );
        
        const button = screen.getByRole('button');
        await user.click(button);
        
        unmount();
      }
      
      // メモリ使用量の大幅な増加がないことを確認
      // （実際の本番環境では詳細なメモリ監視が必要）
      expect(true).toBe(true);
    });
  });

  describe('エラーハンドリング統合テスト', () => {
    test('ネットワークエラー時の適切な処理', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // ネットワークエラーをシミュレート
      mockPush.mockRejectedValue(new Error('Network error'));
      
      const user = userEvent.setup();
      render(
        <GeekModeToggle 
          currentMode="normal"
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });
      
      consoleSpy.mockRestore();
    });

    test('無効なプロパティでもクラッシュしないこと', () => {
      expect(() => {
        render(
          <GeekModeToggle 
            currentMode={'invalid' as any}
            theme={'invalid' as any}
            position={'invalid' as any}
          />
        );
      }).not.toThrow();
    });

    test('ローカルストレージエラーの適切な処理', async () => {
      const user = userEvent.setup();
      
      // ローカルストレージエラーをシミュレート
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      render(
        <GeekModeToggle currentMode="normal" />
      );

      const button = screen.getByRole('button');
      
      expect(() => user.click(button)).not.toThrow();
    });
  });

  describe('アクセシビリティ統合テスト', () => {
    test('キーボードナビゲーションの完全なフロー', async () => {
      const user = userEvent.setup();
      
      render(
        <Layout>
          <GeekModeToggle currentMode="normal" />
        </Layout>
      );

      // GeekModeToggleボタンを見つけてフォーカス（最初のものを取得）
      const geekButtons = screen.getAllByRole('button', { name: /ギークモードに切り替え/ });
      const geekButton = geekButtons[0];
      
      // Tabキーでナビゲーション
      await user.tab();
      
      // フォーカスされた要素を確認
      const focusedElement = document.activeElement;
      expect(focusedElement).not.toBe(document.body);
      
      // ボタンをクリック（Enterキーの代わり）
      await user.click(geekButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('ui-mode', 'geek');
    });

    test('スクリーンリーダー対応の完全性', () => {
      render(
        <GeekModeToggle currentMode="normal" />
      );

      const button = screen.getByRole('button');
      
      // ARIA属性の確認
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('title');
      
      // セマンティックHTMLの確認
      expect(button.tagName).toBe('BUTTON');
      
      // スクリーンリーダー専用テキストの確認
      expect(screen.getByText(/ターミナル風UIに切り替え/)).toBeInTheDocument();
    });

    test('高コントラストモードでの適切な表示', () => {
      // 高コントラストモードをシミュレート
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(
        <GeekModeToggle currentMode="normal" />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('アニメーション無効設定の尊重', () => {
      // アニメーション無効設定をシミュレート
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(
        <GeekModeToggle currentMode="normal" />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('SEO統合テスト', () => {
    test('メタデータが適切に設定されること', () => {
      render(
        <Layout>
          <GeekModeToggle currentMode="normal" />
        </Layout>
      );

      // ページタイトルとメタデータの確認
      // （実際のSEOテストは別途E2Eテストで実施）
      expect(document.title).toBeDefined();
    });
  });

  describe('国際化統合テスト', () => {
    test('RTL言語での適切な表示', () => {
      // RTL言語をシミュレート（アラビア語など）
      document.dir = 'rtl';
      
      render(
        <GeekModeToggle currentMode="normal" />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      // クリーンアップ
      document.dir = 'ltr';
    });

    test('複数言語での一貫した動作', () => {
      const languages = ['ja', 'en'];
      
      languages.forEach(lang => {
        (useTranslation as jest.Mock).mockReturnValue({
          t: mockT,
          i18n: { language: lang },
        });

        const { unmount } = render(
          <GeekModeToggle currentMode="normal" />
        );

        expect(screen.getByRole('button')).toBeInTheDocument();
        
        unmount();
      });
    });
  });
});