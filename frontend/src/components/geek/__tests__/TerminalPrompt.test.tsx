import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TerminalPrompt, TerminalSession } from '../TerminalPrompt';

// タイマーをモック化
jest.useFakeTimers();

describe('TerminalPrompt', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test('基本的なプロンプトが正しく表示される', () => {
    render(
      <TerminalPrompt
        username="testuser"
        hostname="testhost"
        directory="/test"
        promptSymbol="$"
        command="ls -la"
        useTyping={false}
      />
    );

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('@')).toBeInTheDocument();
    expect(screen.getByText('testhost')).toBeInTheDocument();
    expect(screen.getByText(':')).toBeInTheDocument();
    expect(screen.getByText('/test')).toBeInTheDocument();
    expect(screen.getByText('$')).toBeInTheDocument();
    expect(screen.getByText('ls -la')).toBeInTheDocument();
  });

  test('デフォルト値が正しく適用される', () => {
    render(<TerminalPrompt />);

    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('ai-news')).toBeInTheDocument();
    expect(screen.getByText('~')).toBeInTheDocument();
    expect(screen.getByText('$')).toBeInTheDocument();
  });

  test('コマンドなしでも正しく表示される', () => {
    render(
      <TerminalPrompt
        username="user"
        hostname="host"
        directory="~"
        useTyping={false}
      />
    );

    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('host')).toBeInTheDocument();
    expect(screen.getByText('~')).toBeInTheDocument();
    expect(screen.getByText('$')).toBeInTheDocument();
  });

  test('カスタムプロンプト記号が使用される', () => {
    render(
      <TerminalPrompt
        promptSymbol="#"
        useTyping={false}
      />
    );

    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.queryByText('$')).not.toBeInTheDocument();
  });

  test('テーマ別のスタイルクラスが適用される', () => {
    const { rerender } = render(
      <TerminalPrompt theme="matrix" useTyping={false} />
    );

    const userElement = screen.getByText('user');
    expect(userElement).toHaveClass('text-green-400');

    rerender(<TerminalPrompt theme="hacker" useTyping={false} />);
    expect(userElement).toHaveClass('text-cyan-400');

    rerender(<TerminalPrompt theme="cyber" useTyping={false} />);
    expect(userElement).toHaveClass('text-purple-400');

    rerender(<TerminalPrompt theme="terminal" useTyping={false} />);
    expect(userElement).toHaveClass('text-white');
  });

  test('カスタムCSSクラスが適用される', () => {
    const customClass = 'custom-prompt-class';
    const { container } = render(
      <TerminalPrompt className={customClass} useTyping={false} />
    );

    expect(container.firstChild).toHaveClass(customClass);
    expect(container.firstChild).toHaveClass('font-mono-primary');
  });

  test('タイピングアニメーションが有効な場合にTypingAnimationコンポーネントが使用される', () => {
    render(
      <TerminalPrompt
        command="test command"
        useTyping={true}
        typingSpeed={100}
      />
    );

    // TypingAnimationコンポーネントが使用されていることを間接的に確認
    // タイピング中の状態を確認
    expect(screen.getByLabelText(/タイピング中:/)).toBeInTheDocument();
  });
});

describe('TerminalSession', () => {
  const mockLines = [
    {
      type: 'prompt' as const,
      content: 'ls',
      prompt: { username: 'user', hostname: 'test' }
    },
    {
      type: 'output' as const,
      content: 'file1.txt\nfile2.txt'
    },
    {
      type: 'prompt' as const,
      content: 'cat file1.txt',
      prompt: { username: 'user', hostname: 'test' }
    },
    {
      type: 'output' as const,
      content: 'Hello World'
    },
    {
      type: 'error' as const,
      content: 'Permission denied'
    },
    {
      type: 'comment' as const,
      content: '# This is a comment'
    }
  ];

  afterEach(() => {
    jest.clearAllTimers();
  });

  test('タイピングなしで全ての行が表示される', () => {
    render(
      <TerminalSession
        lines={mockLines}
        useTyping={false}
      />
    );

    expect(screen.getByText('ls')).toBeInTheDocument();
    expect(screen.getAllByText((content, element) => {
      return element?.textContent === 'file1.txt\nfile2.txt';
    })[0]).toBeInTheDocument();
    expect(screen.getByText('cat file1.txt')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByText('Permission denied')).toBeInTheDocument();
    expect(screen.getByText('# This is a comment')).toBeInTheDocument();
  });

  test('行タイプ別のスタイルが適用される', () => {
    render(
      <TerminalSession
        lines={mockLines}
        useTyping={false}
      />
    );

    const outputElements = screen.getAllByText((content, element) => {
      return element?.textContent === 'file1.txt\nfile2.txt';
    });
    // 実際のテキスト要素を取得（親のflexコンテナではなく）
    const textElement = outputElements.find(el => el.classList.contains('text-gray-300'));
    expect(textElement).toHaveClass('text-gray-300');

    const errorElement = screen.getByText('Permission denied');
    expect(errorElement).toHaveClass('text-red-400');

    const commentElement = screen.getByText('# This is a comment');
    expect(commentElement).toHaveClass('text-gray-500');
  });

  test('カスタムCSSクラスが適用される', () => {
    const customClass = 'custom-session-class';
    const { container } = render(
      <TerminalSession
        lines={mockLines}
        className={customClass}
        useTyping={false}
      />
    );

    expect(container.firstChild).toHaveClass(customClass);
    expect(container.firstChild).toHaveClass('font-mono-primary');
  });

  test('空の行配列でもエラーが発生しない', () => {
    expect(() => {
      render(<TerminalSession lines={[]} useTyping={false} />);
    }).not.toThrow();
  });

  test('テーマが子コンポーネントに正しく渡される', () => {
    render(
      <TerminalSession
        lines={[{
          type: 'prompt',
          content: 'test',
          prompt: { username: 'user' }
        }]}
        theme="hacker"
        useTyping={false}
      />
    );

    const userElement = screen.getByText('user');
    expect(userElement).toHaveClass('text-cyan-400');
  });
});

describe('アクセシビリティ', () => {
  test('TerminalPromptに適切なセマンティック構造がある', () => {
    render(
      <TerminalPrompt
        command="test command"
        useTyping={false}
      />
    );

    const container = screen.getByText('test command').closest('div');
    expect(container).toHaveClass('font-mono-primary');
  });

  test('TerminalSessionに適切なセマンティック構造がある', () => {
    const lines = [
      { type: 'output' as const, content: 'test output' }
    ];

    render(<TerminalSession lines={lines} useTyping={false} />);

    const outputElement = screen.getByText('test output');
    expect(outputElement).toBeInTheDocument();
    
    // TerminalSessionのルートコンテナを確認
    const container = outputElement.closest('.font-mono-primary');
    expect(container).toBeInTheDocument();
  });

  test('エラーメッセージが適切にマークアップされる', () => {
    const lines = [
      { type: 'error' as const, content: 'Error message' }
    ];

    render(<TerminalSession lines={lines} useTyping={false} />);

    const errorElement = screen.getByText('Error message');
    expect(errorElement).toHaveClass('text-red-400');
  });
});

describe('エラーハンドリング', () => {
  test('不正な行タイプでもエラーが発生しない', () => {
    const invalidLines = [
      { type: 'invalid' as any, content: 'test' }
    ];

    expect(() => {
      render(<TerminalSession lines={invalidLines} useTyping={false} />);
    }).not.toThrow();
  });

  test('プロンプト設定なしでもエラーが発生しない', () => {
    const lines = [
      { type: 'prompt' as const, content: 'test' }
    ];

    expect(() => {
      render(<TerminalSession lines={lines} useTyping={false} />);
    }).not.toThrow();
  });

  test('空のコンテンツでもエラーが発生しない', () => {
    const lines = [
      { type: 'output' as const, content: '' }
    ];

    expect(() => {
      render(<TerminalSession lines={lines} useTyping={false} />);
    }).not.toThrow();
  });
});