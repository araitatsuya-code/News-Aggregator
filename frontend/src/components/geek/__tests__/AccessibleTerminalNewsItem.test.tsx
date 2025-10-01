/**
 * AccessibleTerminalNewsItemコンポーネントのアクセシビリティテスト
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AccessibleTerminalNewsItem } from '../AccessibleTerminalNewsItem';
import { NewsItem } from '../../../lib/types';

// jest-axeのマッチャーを追加
expect.extend(toHaveNoViolations);

// next-i18nextのモック
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// next/routerのモック
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
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

// window.openのモック
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockWindowOpen,
});

describe('AccessibleTerminalNewsItem', () => {

  const mockArticle: NewsItem = {
    id: '1',
    title: 'テストニュース記事のタイトル',
    original_title: 'Test News Article Title',
    url: 'https://example.com/news/1',
    summary: 'これはテスト用のニュース記事の要約です。',
    published_at: '2025-01-01T10:00:00Z',
    source: 'TechCrunch',
    category: 'AI',
    language: 'ja',
    ai_confidence: 0.95,
    tags: ['AI', 'Machine Learning', 'Technology'],
  };

  const defaultProps = {
    article: mockArticle,
    lineNumber: 1,
    showSummary: true,
    syntax: 'javascript' as const,
    theme: 'dark' as const,
    highlightOnHover: true,
    clickable: true,
  };

  beforeEach(() => {
    mockWindowOpen.mockClear();
  });

  describe('アクセシビリティ基準', () => {
    test('WCAG準拠のアクセシビリティ違反がないこと', async () => {
      const { container } = render(<AccessibleTerminalNewsItem {...defaultProps} />);
      
      // コンポーネントが完全にレンダリングされるまで待機
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('適切なARIA属性が設定されていること', async () => {
      render(<AccessibleTerminalNewsItem {...defaultProps} />);
      
      await waitFor(() => {
        const article = screen.getByRole('button');
        expect(article).toHaveAttribute('aria-label');
        expect(article).toHaveAttribute('tabindex', '0');
        expect(article.getAttribute('aria-label')).toContain(mockArticle.original_title);
        expect(article.getAttribute('aria-label')).toContain(mockArticle.source);
      });
    });

    test('クリック不可の場合は適切なroleが設定されること', async () => {
      const { container } = render(<AccessibleTerminalNewsItem {...defaultProps} clickable={false} />);
      
      await waitFor(() => {
        const article = container.querySelector('[role="article"]');
        expect(article).toBeInTheDocument();
        expect(article).toHaveAttribute('tabindex', '-1');
      });
    });

    test('セマンティックHTMLが使用されていること', async () => {
      render(<AccessibleTerminalNewsItem {...defaultProps} />);
      
      await waitFor(() => {
        // button roleが使用されている
        expect(screen.getByRole('button')).toBeInTheDocument();
        
        // time要素が使用されている
        const timeElement = screen.getByText('2025-01-01');
        expect(timeElement.closest('time')).toHaveAttribute('datetime', mockArticle.published_at);
      });
    });

    test('ライブリージョンが設定されていること', async () => {
      render(<AccessibleTerminalNewsItem {...defaultProps} />);
      
      await waitFor(() => {
        const liveRegion = screen.getByRole('status');
        expect(liveRegion).toHaveAttribute('aria-live', 'polite');
        expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
      });
    });
  });

  describe('キーボードナビゲーション', () => {
    test('Enterキーでクリックイベントが発火すること', async () => {
      const user = userEvent.setup();
      render(<AccessibleTerminalNewsItem {...defaultProps} />);
      
      const article = await waitFor(() => screen.getByRole('button'));
      
      await act(async () => {
        await user.tab(); // フォーカスを当てる
      });
      
      await act(async () => {
        await user.keyboard('{Enter}');
      });
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        mockArticle.url,
        '_blank',
        'noopener,noreferrer'
      );
    });

    test('スペースキーでクリックイベントが発火すること', async () => {
      const user = userEvent.setup();
      render(<AccessibleTerminalNewsItem {...defaultProps} />);
      
      const article = await waitFor(() => screen.getByRole('button'));
      
      await act(async () => {
        await user.tab();
      });
      
      await act(async () => {
        await user.keyboard(' ');
      });
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        mockArticle.url,
        '_blank',
        'noopener,noreferrer'
      );
    });

    test('Escapeキーでフォーカスが外れること', async () => {
      const user = userEvent.setup();
      render(<AccessibleTerminalNewsItem {...defaultProps} />);
      
      const article = await waitFor(() => screen.getByRole('button'));
      
      await act(async () => {
        await user.tab();
      });
      expect(article).toHaveFocus();
      
      await act(async () => {
        await user.keyboard('{Escape}');
      });
      expect(article).not.toHaveFocus();
    });

    test('矢印キーでナビゲーションが動作すること', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <AccessibleTerminalNewsItem {...defaultProps} />
          <AccessibleTerminalNewsItem 
            {...defaultProps} 
            article={{ ...mockArticle, id: '2', title: '2番目の記事' }}
          />
        </div>
      );
      
      const articles = await waitFor(() => screen.getAllByRole('button'));
      
      await act(async () => {
        await user.tab();
      });
      expect(articles[0]).toHaveFocus();
      
      await act(async () => {
        await user.keyboard('{ArrowDown}');
      });
      expect(articles[1]).toHaveFocus();
      
      await act(async () => {
        await user.keyboard('{ArrowUp}');
      });
      expect(articles[0]).toHaveFocus();
    });

    test('HomeキーとEndキーが動作すること', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <AccessibleTerminalNewsItem {...defaultProps} />
          <AccessibleTerminalNewsItem 
            {...defaultProps} 
            article={{ ...mockArticle, id: '2', title: '2番目の記事' }}
          />
          <AccessibleTerminalNewsItem 
            {...defaultProps} 
            article={{ ...mockArticle, id: '3', title: '3番目の記事' }}
          />
        </div>
      );
      
      const articles = await waitFor(() => screen.getAllByRole('button'));
      
      // 2番目の記事にフォーカス
      await act(async () => {
        articles[1].focus();
      });
      expect(articles[1]).toHaveFocus();
      
      // Homeキーで最初の記事にフォーカス
      await act(async () => {
        await user.keyboard('{Home}');
      });
      expect(articles[0]).toHaveFocus();
      
      // Endキーで最後の記事にフォーカス
      await act(async () => {
        await user.keyboard('{End}');
      });
      expect(articles[2]).toHaveFocus();
    });
  });

  describe('スクリーンリーダー対応', () => {
    test('フォーカス時にスクリーンリーダー用のテキストが生成されること', async () => {
      const user = userEvent.setup();
      render(<AccessibleTerminalNewsItem {...defaultProps} />);
      
      const article = await waitFor(() => screen.getByRole('button'));
      
      await act(async () => {
        await user.tab();
      });
      
      await waitFor(() => {
        const liveRegion = screen.getByRole('status');
        expect(liveRegion.textContent).toContain(mockArticle.original_title);
        expect(liveRegion.textContent).toContain(mockArticle.source);
        expect(liveRegion.textContent).toContain('95パーセント');
      });
    });

    test('クリック時にアクション説明が表示されること', async () => {
      const user = userEvent.setup();
      render(<AccessibleTerminalNewsItem {...defaultProps} />);
      
      const article = await waitFor(() => screen.getByRole('button'));
      const liveRegion = screen.getByRole('status');
      
      await act(async () => {
        await user.click(article);
      });
      
      await waitFor(() => {
        expect(liveRegion.textContent).toContain('新しいタブで開いています');
      }, { timeout: 3000 });
    });

    test('翻訳記事の場合に適切な情報が表示されること', async () => {
      const translatedArticle = {
        ...mockArticle,
        language: 'en' as const,
        title: '翻訳されたタイトル',
        original_title: 'Original English Title',
      };
      
      render(<AccessibleTerminalNewsItem {...defaultProps} article={translatedArticle} />);
      
      await waitFor(() => {
        // 翻訳記事の場合、titleが表示される（クライアントサイドでないため即座に表示）
        expect(screen.getByText('"翻訳されたタイトル"')).toBeInTheDocument();
        expect(screen.getByText(/Original English Title/)).toBeInTheDocument();
        expect(screen.getByText('// Translated from English using AI')).toBeInTheDocument();
      });
    });
  });

  describe('カラーコントラスト', () => {
    test('ダークテーマでWCAG基準を満たすこと', async () => {
      const { container } = render(
        <AccessibleTerminalNewsItem {...defaultProps} theme="dark" />
      );
      
      await waitFor(() => {
        // 実際のカラーコントラストの検証は統合テストで行う
        // ここでは適切なスタイルが適用されていることを確認
        const article = container.querySelector('div[role="button"]');
        expect(article).toBeInTheDocument();
        expect(article).toHaveStyle('color: rgb(255, 255, 255)'); // 白文字
      });
    });

    test('ライトテーマでWCAG基準を満たすこと', async () => {
      const { container } = render(
        <AccessibleTerminalNewsItem {...defaultProps} theme="light" />
      );
      
      await waitFor(() => {
        const article = container.querySelector('div[role="button"]');
        expect(article).toBeInTheDocument();
        expect(article).toHaveStyle('color: rgb(0, 0, 0)'); // 黒文字
      });
    });
  });

  describe('モーション設定対応', () => {
    test('prefers-reduced-motionが有効な場合にアニメーションが無効化されること', async () => {
      // matchMediaのモックを更新
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { container } = render(<AccessibleTerminalNewsItem {...defaultProps} />);
      
      await waitFor(() => {
        const article = container.querySelector('div[role="button"]');
        expect(article).toBeInTheDocument();
        expect(article).toHaveStyle('transition: none');
      });
    });

    test('タイピングアニメーションがprefers-reduced-motionで制御されること', async () => {
      // reduced motionを有効にする
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(<AccessibleTerminalNewsItem {...defaultProps} />);
      
      // reduced motionが有効な場合、即座に全文が表示される（original_titleが表示される）
      await waitFor(() => {
        expect(screen.getByText(/Test News Article Title/)).toBeInTheDocument();
      });
    });
  });

  describe('フォーカス管理', () => {
    test('フォーカス時に適切なスタイルが適用されること', async () => {
      const user = userEvent.setup();
      const { container } = render(<AccessibleTerminalNewsItem {...defaultProps} />);
      
      const article = await waitFor(() => screen.getByRole('button'));
      
      await act(async () => {
        await user.tab();
      });
      
      // フォーカスインジケーターが表示される
      const focusIndicator = container.querySelector('[aria-hidden="true"]');
      expect(focusIndicator).toBeInTheDocument();
    });

    test('マウスクリックでフォーカスが当たること', async () => {
      const user = userEvent.setup();
      render(<AccessibleTerminalNewsItem {...defaultProps} />);
      
      const article = await waitFor(() => screen.getByRole('button'));
      
      await act(async () => {
        await user.pointer({ target: article, keys: '[MouseLeft]' });
      });
      
      expect(article).toHaveFocus();
    });

    test('フォーカスコールバックが呼ばれること', async () => {
      const onFocus = jest.fn();
      const onBlur = jest.fn();
      const user = userEvent.setup();
      
      render(
        <AccessibleTerminalNewsItem 
          {...defaultProps} 
          onFocus={onFocus}
          onBlur={onBlur}
        />
      );
      
      const article = await waitFor(() => screen.getByRole('button'));
      
      await act(async () => {
        await user.tab();
      });
      expect(onFocus).toHaveBeenCalled();
      
      await act(async () => {
        await user.tab();
      });
      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('エラーハンドリング', () => {
    test('無効なURLでもエラーが発生しないこと', async () => {
      const invalidArticle = {
        ...mockArticle,
        url: 'invalid-url',
      };
      
      const user = userEvent.setup();
      render(<AccessibleTerminalNewsItem {...defaultProps} article={invalidArticle} />);
      
      const article = await waitFor(() => screen.getByRole('button'));
      
      await act(async () => {
        await user.click(article);
      });
      
      // エラーが発生せず、window.openが呼ばれること
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'invalid-url',
        '_blank',
        'noopener,noreferrer'
      );
    });

    test('必須プロパティが不足していてもレンダリングされること', async () => {
      const minimalArticle = {
        ...mockArticle,
        tags: undefined,
        summary: '',
      };
      
      expect(() => {
        render(<AccessibleTerminalNewsItem {...defaultProps} article={minimalArticle} />);
      }).not.toThrow();
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });
  });
});

