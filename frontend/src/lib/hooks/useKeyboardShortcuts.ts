import { useEffect, useCallback, useRef } from 'react';

/**
 * キーボードショートカットの定義
 */
interface KeyboardShortcut {
  /** ショートカットキーの組み合わせ */
  key: string;
  /** 修飾キー */
  modifiers?: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  };
  /** 実行する関数 */
  handler: (event: KeyboardEvent) => void;
  /** 説明 */
  description?: string;
  /** 有効かどうか */
  enabled?: boolean;
  /** デフォルトの動作を防ぐかどうか */
  preventDefault?: boolean;
  /** イベントの伝播を停止するかどうか */
  stopPropagation?: boolean;
}

/**
 * キーボードショートカットのオプション
 */
interface UseKeyboardShortcutsOptions {
  /** ショートカットが有効かどうか */
  enabled?: boolean;
  /** 特定の要素にのみ適用するかどうか */
  target?: HTMLElement | null;
  /** 入力フィールドでも有効にするかどうか */
  enableInInputs?: boolean;
}

/**
 * キーの正規化（大文字小文字、特殊キーの統一）
 */
const normalizeKey = (key: string): string => {
  const keyMap: Record<string, string> = {
    ' ': 'Space',
    'Esc': 'Escape',
    'Del': 'Delete',
    'Ins': 'Insert',
    'PgUp': 'PageUp',
    'PgDn': 'PageDown',
    'Home': 'Home',
    'End': 'End',
    'Up': 'ArrowUp',
    'Down': 'ArrowDown',
    'Left': 'ArrowLeft',
    'Right': 'ArrowRight',
  };

  return keyMap[key] || key.toLowerCase();
};

/**
 * 修飾キーの状態をチェック
 */
const checkModifiers = (
  event: KeyboardEvent,
  modifiers?: KeyboardShortcut['modifiers']
): boolean => {
  if (!modifiers) return true;

  return (
    (modifiers.ctrl === undefined || event.ctrlKey === modifiers.ctrl) &&
    (modifiers.alt === undefined || event.altKey === modifiers.alt) &&
    (modifiers.shift === undefined || event.shiftKey === modifiers.shift) &&
    (modifiers.meta === undefined || event.metaKey === modifiers.meta)
  );
};

/**
 * 入力要素かどうかをチェック
 */
const isInputElement = (element: Element): boolean => {
  const tagName = element.tagName.toLowerCase();
  const inputTypes = ['input', 'textarea', 'select'];
  
  if (inputTypes.includes(tagName)) return true;
  
  // contenteditable要素もチェック
  if (element.getAttribute('contenteditable') === 'true') return true;
  
  return false;
};

/**
 * キーボードショートカットを管理するカスタムフック
 */
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const {
    enabled = true,
    target = null,
    enableInInputs = false,
  } = options;

  const shortcutsRef = useRef<KeyboardShortcut[]>([]);
  const optionsRef = useRef<UseKeyboardShortcutsOptions>({});

  // 最新の値を保持
  shortcutsRef.current = shortcuts;
  optionsRef.current = options;

  /**
   * キーボードイベントハンドラー
   */
  const handleKeyDown = useCallback((event: Event) => {
    const keyboardEvent = event as KeyboardEvent;
    const currentShortcuts = shortcutsRef.current;
    const currentOptions = optionsRef.current;

    // 無効化されている場合は何もしない
    if (!currentOptions.enabled) return;

    // 入力要素でのショートカットが無効化されている場合
    if (!currentOptions.enableInInputs && keyboardEvent.target && isInputElement(keyboardEvent.target as Element)) {
      return;
    }

    const normalizedKey = normalizeKey(keyboardEvent.key);

    // マッチするショートカットを検索
    for (const shortcut of currentShortcuts) {
      if (shortcut.enabled === false) continue;

      const shortcutKey = normalizeKey(shortcut.key);
      
      if (shortcutKey === normalizedKey && checkModifiers(keyboardEvent, shortcut.modifiers)) {
        // デフォルトの動作を防ぐ
        if (shortcut.preventDefault !== false) {
          keyboardEvent.preventDefault();
        }
        
        // イベントの伝播を停止
        if (shortcut.stopPropagation) {
          keyboardEvent.stopPropagation();
        }

        // ハンドラーを実行
        try {
          shortcut.handler(keyboardEvent);
        } catch (error) {
          console.error('キーボードショートカットの実行中にエラーが発生しました:', error);
        }
        
        // 最初にマッチしたショートカットのみ実行
        break;
      }
    }
  }, []);

  /**
   * イベントリスナーの設定
   */
  useEffect(() => {
    if (!enabled) return;

    const targetElement = target || document;
    
    targetElement.addEventListener('keydown', handleKeyDown);
    
    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, target, handleKeyDown]);

  /**
   * ショートカットの説明を取得
   */
  const getShortcutDescription = useCallback((shortcut: KeyboardShortcut): string => {
    const modifierKeys: string[] = [];
    
    if (shortcut.modifiers?.ctrl) modifierKeys.push('Ctrl');
    if (shortcut.modifiers?.alt) modifierKeys.push('Alt');
    if (shortcut.modifiers?.shift) modifierKeys.push('Shift');
    if (shortcut.modifiers?.meta) modifierKeys.push('Cmd');
    
    const keyString = [...modifierKeys, shortcut.key].join(' + ');
    
    return shortcut.description ? `${keyString}: ${shortcut.description}` : keyString;
  }, []);

  /**
   * すべてのショートカットの説明を取得
   */
  const getAllShortcutDescriptions = useCallback((): string[] => {
    return shortcuts
      .filter(shortcut => shortcut.enabled !== false)
      .map(getShortcutDescription);
  }, [shortcuts, getShortcutDescription]);

  return {
    getShortcutDescription,
    getAllShortcutDescriptions,
  };
};

/**
 * 一般的なキーボードショートカットのプリセット
 */
export const commonShortcuts = {
  /**
   * コマンドパレット表示
   */
  commandPalette: (handler: () => void): KeyboardShortcut => ({
    key: 'k',
    modifiers: { ctrl: true },
    handler,
    description: 'コマンドパレットを開く',
  }),

  /**
   * 検索
   */
  search: (handler: () => void): KeyboardShortcut => ({
    key: 'f',
    modifiers: { ctrl: true },
    handler,
    description: '検索',
  }),

  /**
   * ヘルプ表示
   */
  help: (handler: () => void): KeyboardShortcut => ({
    key: '?',
    modifiers: { shift: true },
    handler,
    description: 'ヘルプを表示',
  }),

  /**
   * エスケープ（モーダルを閉じる等）
   */
  escape: (handler: () => void): KeyboardShortcut => ({
    key: 'Escape',
    handler,
    description: 'キャンセル/閉じる',
  }),

  /**
   * リフレッシュ
   */
  refresh: (handler: () => void): KeyboardShortcut => ({
    key: 'r',
    modifiers: { ctrl: true },
    handler,
    description: 'リフレッシュ',
  }),

  /**
   * 新規作成
   */
  new: (handler: () => void): KeyboardShortcut => ({
    key: 'n',
    modifiers: { ctrl: true },
    handler,
    description: '新規作成',
  }),

  /**
   * 保存
   */
  save: (handler: () => void): KeyboardShortcut => ({
    key: 's',
    modifiers: { ctrl: true },
    handler,
    description: '保存',
  }),

  /**
   * 元に戻す
   */
  undo: (handler: () => void): KeyboardShortcut => ({
    key: 'z',
    modifiers: { ctrl: true },
    handler,
    description: '元に戻す',
  }),

  /**
   * やり直し
   */
  redo: (handler: () => void): KeyboardShortcut => ({
    key: 'y',
    modifiers: { ctrl: true },
    handler,
    description: 'やり直し',
  }),

  /**
   * 全選択
   */
  selectAll: (handler: () => void): KeyboardShortcut => ({
    key: 'a',
    modifiers: { ctrl: true },
    handler,
    description: '全選択',
  }),

  /**
   * コピー
   */
  copy: (handler: () => void): KeyboardShortcut => ({
    key: 'c',
    modifiers: { ctrl: true },
    handler,
    description: 'コピー',
  }),

  /**
   * 貼り付け
   */
  paste: (handler: () => void): KeyboardShortcut => ({
    key: 'v',
    modifiers: { ctrl: true },
    handler,
    description: '貼り付け',
  }),

  /**
   * 切り取り
   */
  cut: (handler: () => void): KeyboardShortcut => ({
    key: 'x',
    modifiers: { ctrl: true },
    handler,
    description: '切り取り',
  }),
};

/**
 * ギーク向けのキーボードショートカットプリセット
 */
export const geekShortcuts = {
  /**
   * ターミナルを開く
   */
  terminal: (handler: () => void): KeyboardShortcut => ({
    key: '`',
    modifiers: { ctrl: true },
    handler,
    description: 'ターミナルを開く',
  }),

  /**
   * コマンドライン実行
   */
  executeCommand: (handler: () => void): KeyboardShortcut => ({
    key: 'Enter',
    modifiers: { ctrl: true },
    handler,
    description: 'コマンドを実行',
  }),

  /**
   * Vimスタイルの移動（j: 下）
   */
  moveDown: (handler: () => void): KeyboardShortcut => ({
    key: 'j',
    handler,
    description: '下に移動',
  }),

  /**
   * Vimスタイルの移動（k: 上）
   */
  moveUp: (handler: () => void): KeyboardShortcut => ({
    key: 'k',
    handler,
    description: '上に移動',
  }),

  /**
   * Vimスタイルの移動（h: 左）
   */
  moveLeft: (handler: () => void): KeyboardShortcut => ({
    key: 'h',
    handler,
    description: '左に移動',
  }),

  /**
   * Vimスタイルの移動（l: 右）
   */
  moveRight: (handler: () => void): KeyboardShortcut => ({
    key: 'l',
    handler,
    description: '右に移動',
  }),

  /**
   * Vimスタイルの移動（gg: 最初に移動）
   */
  moveToTop: (handler: () => void): KeyboardShortcut => ({
    key: 'g',
    handler,
    description: '最初に移動',
  }),

  /**
   * Vimスタイルの移動（G: 最後に移動）
   */
  moveToBottom: (handler: () => void): KeyboardShortcut => ({
    key: 'G',
    modifiers: { shift: true },
    handler,
    description: '最後に移動',
  }),

  /**
   * フィルターモード
   */
  filterMode: (handler: () => void): KeyboardShortcut => ({
    key: '/',
    handler,
    description: 'フィルターモード',
  }),

  /**
   * コマンドモード
   */
  commandMode: (handler: () => void): KeyboardShortcut => ({
    key: ':',
    modifiers: { shift: true },
    handler,
    description: 'コマンドモード',
  }),

  /**
   * デバッグモード切り替え
   */
  toggleDebug: (handler: () => void): KeyboardShortcut => ({
    key: 'd',
    modifiers: { ctrl: true, shift: true },
    handler,
    description: 'デバッグモード切り替え',
  }),

  /**
   * テーマ切り替え
   */
  toggleTheme: (handler: () => void): KeyboardShortcut => ({
    key: 't',
    modifiers: { ctrl: true, shift: true },
    handler,
    description: 'テーマ切り替え',
  }),
};

export default useKeyboardShortcuts;