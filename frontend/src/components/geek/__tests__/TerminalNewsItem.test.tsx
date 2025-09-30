import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { TerminalNewsItem, TerminalNewsList } from '../TerminalNewsItem';
import { NewsItem } from '../../../lib/types';

// モック設定
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-i18next', () => ({
  useTranslation: jest.fn(),
}));

// window.openのモック
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseTranslation = useTranslation as jest.MockedFunction<typeof useTranslation>;

// テスト用のニュースデータ
const mockArticle: NewsItem = {
  id: 'test-1',
  title: 'テストニュースタイトル',
  original_title: 'Test News Title',
  summary: 'これはテスト用のニュース記事の要約です。AIに関する重要な情報が含まれています。',
  url: 'https://example.com/test-news',
  source: 'Test Source',
  category: 'Machine Learning',
  published_at: '2025-09-29T10:00:00Z',
  language: 'ja',
  tags: ['AI', 'Machine Learning', 'Technology'],
  ai_confidence: 0.95,
};

const mockTranslatedArticle: NewsItem = {
  ...mockArticle,
  id: 'test-2',
  title: '翻訳されたニュースタイトル',
  original_title: 'Original English Title',
  language: 'en',
};

describe('TerminalNewsItem', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      locale: 'ja',
      push: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
      route: '/',
      basePath: '',
      isLocaleDomain: true,
      isReady: true,
      isPreview: false,
      back: jest.fn(),
      beforePopState: jest.fn(),
      prefetch: jest.fn(),
      reload: jest.fn(),
      replace: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    });

    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'external_link': '外部リンク',
          'translated': '翻訳済み',
        };
        return translations[key] || key;
      },
      i18n: {
        language: 'ja',
        changeLanguage: jest.fn(),
      },
    } as any);

    mockWindowOpen.mockClear();
  });

  describe('基本的なレンダリング', () => {
    test('記事情報が正しく表示される', () => {
      const { container } = render(
        <TerminalNewsItem
          article={mockArticle}
          lineNumber={1}
        />
      );

      // タイトルが表示されることを確認（original_titleが使用される）
      expect(container.textContent).toContain('Test News Title');
      
      // カテゴリが表示されることを確認
      expect(container.textContent).toContain('Machine Learning');
      expect(container.textContent).toContain('Test Source');
      
      // 要約が表示されることを確認
      expect(container.textContent).toContain('これはテスト用のニュース記事の要約です');
      
      // 信頼度が表示されることを確認
      expect(container.textContent).toContain('95');
    });

    test('行番号が正しく表示される', () => {
      render(
        <TerminalNewsItem
          article={mockArticle}
          lineNumber={5}
        />
      );

      // 行番号が正しく表示されることを確認
      expect(screen.getByText('005')).toBeInTheDocument();
    });

    test('翻訳記事の場合、元タイトルが表示される', () => {
      render(
        <TerminalNewsItem
          article={mockTranslatedArticle}
          lineNumber={1}
        />
      );

      // 翻訳されたタイトルが表示されることを確認
      expect(screen.getByText(/翻訳されたニュースタイトル/)).toBeInTheDocument();
      
      // 元タイトルが表示されることを確認
      expect(screen.getByText(/Original English Title/)).toBeInTheDocument();
      
      // 翻訳インジケーターが表示されることを確認
      expect(screen.getByText(/Translated from English using AI/)).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    test('クリック時に外部リンクが開かれる', async () => {
      render(
        <TerminalNewsItem
          article={mockArticle}
          lineNumber={1}
          clickable={true}
        />
      );

      const articleElement = screen.getByRole('button');
      fireEvent.click(articleElement);

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith(
          'https://example.com/test-news',
          '_blank',
          'noopener,noreferrer'
        );
      });
    });

    test('clickable=falseの場合、クリックイベントが発生しない', () => {
      render(
        <TerminalNewsItem
          article={mockArticle}
          lineNumber={1}
          clickable={false}
        />
      );

      const articleElement = screen.getByRole('article');
      fireEvent.click(articleElement);

      expect(mockWindowOpen).not.toHaveBeenCalled();
    });

    test('ホバー時にハイライト効果が適用される', () => {
      render(
        <TerminalNewsItem
          article={mockArticle}
          lineNumber={1}
          highlightOnHover={true}
          theme="matrix"
        />
      );

      const articleElement = screen.getByRole('button');
      
      // ホバー前の状態を確認
      expect(articleElement).not.toHaveClass('bg-green-900');
      
      // ホバーイベントを発生
      fireEvent.mouseEnter(articleElement);
      
      // ホバー後の状態を確認（CSSクラスの変更）
      expect(articleElement).toHaveClass('bg-green-900');
      
      // ホバー終了
      fireEvent.mouseLeave(articleElement);
    });
  });

  describe('テーマとスタイル', () => {
    test('異なるシンタックステーマが適用される', () => {
      const { rerender } = render(
        <TerminalNewsItem
          article={mockArticle}
          lineNumber={1}
          syntax="javascript"
        />
      );

      // JavaScript構文のキーワードが表示されることを確認
      expect(screen.getByText('const')).toHaveClass('syntax-keyword');

      // Python構文に変更
      rerender(
        <TerminalNewsItem
          article={mockArticle}
          lineNumber={1}
          syntax="python"
        />
      );

      // Python構文のスタイルが適用されることを確認
      expect(screen.getByText('const')).toHaveClass('text-blue-400');
    });

    test('異なるテーマが適用される', () => {
      const themes = ['matrix', 'hacker', 'cyber', 'terminal', 'vscode'] as const;
      
      themes.forEach(theme => {
        const { unmount } = render(
          <TerminalNewsItem
            article={mockArticle}
            lineNumber={1}
            theme={theme}
          />
        );
        
        // 各テーマでコンポーネントが正常にレンダリングされることを確認
        expect(screen.getByRole('button')).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('アクセシビリティ', () => {
    test('適切なARIAラベルが設定される', () => {
      render(
        <TerminalNewsItem
          article={mockArticle}
          lineNumber={1}
          clickable={true}
        />
      );

      const articleElement = screen.getByRole('button');
      expect(articleElement).toHaveAttribute(
        'aria-label',
        'Test News Title - 外部リンク'
      );
    });

    test('キーボードナビゲーションが可能', () => {
      render(
        <TerminalNewsItem
          article={mockArticle}
          lineNumber={1}
          clickable={true}
        />
      );

      const articleElement = screen.getByRole('button');
      expect(articleElement).toHaveAttribute('tabIndex', '0');
    });

    test('clickable=falseの場合、フォーカス不可', () => {
      render(
        <TerminalNewsItem
          article={mockArticle}
          lineNumber={1}
          clickable={false}
        />
      );

      const articleElement = screen.getByRole('article');
      expect(articleElement).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('オプション表示', () => {
    test('showSummary=falseの場合、要約が表示されない', () => {
      render(
        <TerminalNewsItem
          article={mockArticle}
          lineNumber={1}
          showSummary={false}
        />
      );

      // 要約が表示されないことを確認
      expect(screen.queryByText(/これはテスト用のニュース記事の要約です/)).not.toBeInTheDocument();
    });

    test('タグが正しく表示される', () => {
      render(
        <TerminalNewsItem
          article={mockArticle}
          lineNumber={1}
        />
      );

      // タグが表示されることを確認
      expect(screen.getByText('"AI"')).toBeInTheDocument();
      expect(screen.getByText('"Machine Learning"')).toBeInTheDocument();
      expect(screen.getByText('"Technology"')).toBeInTheDocument();
    });
  });
});

describe('TerminalNewsList', () => {
  const mockArticles: NewsItem[] = [
    mockArticle,
    { ...mockArticle, id: 'test-2', title: '2番目のニュース', original_title: '2番目のニュース' },
    { ...mockArticle, id: 'test-3', title: '3番目のニュース', original_title: '3番目のニュース' },
  ];

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      locale: 'ja',
    } as any);

    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
    } as any);
  });

  test('複数の記事が正しく表示される', () => {
    const { container } = render(
      <TerminalNewsList
        articles={mockArticles}
        startLineNumber={1}
      />
    );

    // 全ての記事タイトルが表示されることを確認（original_titleが使用される）
    expect(container.textContent).toContain('Test News Title');
    expect(container.textContent).toContain('2番目のニュース');
    expect(container.textContent).toContain('3番目のニュース');
  });

  test('行番号が正しく計算される', () => {
    render(
      <TerminalNewsList
        articles={mockArticles.slice(0, 2)}
        startLineNumber={10}
      />
    );

    // 最初の記事の行番号
    expect(screen.getByText('010')).toBeInTheDocument();
    
    // 2番目の記事の行番号（1番目の記事の行数 + 空行を考慮）
    // 基本7行 + 要約1行 + タグ1行 + 空行2行 = 11行後
    expect(screen.getByText('021')).toBeInTheDocument();
  });

  test('空の配列の場合、何も表示されない', () => {
    const { container } = render(
      <TerminalNewsList
        articles={[]}
        startLineNumber={1}
      />
    );

    expect(container.firstChild?.childNodes).toHaveLength(0);
  });
});