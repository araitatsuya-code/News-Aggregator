import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'next-i18next';
import { TypingAnimation } from './TypingAnimation';

/**
 * コマンド定義の型
 */
interface Command {
  /** コマンド名 */
  name: string;
  /** コマンドの説明 */
  description: string;
  /** 使用方法 */
  usage: string;
  /** エイリアス */
  aliases: string[];
  /** 引数の定義 */
  args?: CommandArg[];
  /** オプションの定義 */
  options?: CommandOption[];
}

/**
 * コマンド引数の型
 */
interface CommandArg {
  /** 引数名 */
  name: string;
  /** 必須かどうか */
  required: boolean;
  /** 説明 */
  description: string;
  /** 可能な値（自動補完用） */
  values?: string[];
}

/**
 * コマンドオプションの型
 */
interface CommandOption {
  /** オプション名（--option形式） */
  name: string;
  /** 短縮形（-o形式） */
  short?: string;
  /** 説明 */
  description: string;
  /** 値を取るかどうか */
  hasValue: boolean;
  /** 可能な値（自動補完用） */
  values?: string[];
}

/**
 * コマンド実行結果の型
 */
interface CommandResult {
  /** 成功かどうか */
  success: boolean;
  /** 出力メッセージ */
  output: string;
  /** 実行されたコマンド */
  command: string;
  /** 実行時刻 */
  timestamp: Date;
  /** 追加データ */
  data?: any;
}

/**
 * 自動補完候補の型
 */
interface AutocompleteSuggestion {
  /** 候補テキスト */
  text: string;
  /** 表示用の説明 */
  description?: string;
  /** 候補の種類 */
  type: 'command' | 'option' | 'value' | 'file';
  /** 挿入位置の開始インデックス */
  startIndex: number;
  /** 挿入位置の終了インデックス */
  endIndex: number;
}

/**
 * CommandLineFilterコンポーネントのプロパティ
 */
interface CommandLineFilterProps {
  /** 利用可能なカテゴリ一覧 */
  categories: string[];
  /** ニュースソース一覧 */
  sources?: string[];
  /** フィルター実行時のコールバック */
  onFilter: (filters: FilterOptions) => void;
  /** 検索実行時のコールバック */
  onSearch?: (query: string, options?: SearchOptions) => void;
  /** プレースホルダーテキスト */
  placeholder?: string;
  /** 初期コマンド */
  initialCommand?: string;
  /** テーマ */
  theme?: 'matrix' | 'hacker' | 'terminal' | 'cyber';
  /** 履歴の最大保存数 */
  maxHistory?: number;
  /** CSSクラス名 */
  className?: string;
  /** 無効化フラグ */
  disabled?: boolean;
  /** デバッグモード */
  debug?: boolean;
}

/**
 * フィルターオプションの型
 */
interface FilterOptions {
  /** カテゴリフィルター */
  categories?: string[];
  /** ソースフィルター */
  sources?: string[];
  /** 日付範囲 */
  dateRange?: string;
  /** 論理演算子 */
  operator?: 'AND' | 'OR';
  /** 厳密モード */
  strict?: boolean;
}

/**
 * 検索オプションの型
 */
interface SearchOptions {
  /** 検索対象フィールド */
  fields?: string[];
  /** 大文字小文字を区別するか */
  caseSensitive?: boolean;
  /** 正規表現を使用するか */
  regex?: boolean;
}

/**
 * コマンドライン風のフィルターコンポーネント
 * ターミナル風のインターフェースでニュースのフィルタリングと検索を提供
 */
export const CommandLineFilter: React.FC<CommandLineFilterProps> = ({
  categories,
  sources = [],
  onFilter,
  onSearch,
  placeholder = '$ コマンドを入力してください...',
  initialCommand = '',
  theme = 'matrix',
  maxHistory = 50,
  className = '',
  disabled = false,
  debug = false,
}) => {
  const { t } = useTranslation('news');
  
  // 状態管理
  const [input, setInput] = useState(initialCommand);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [output, setOutput] = useState<CommandResult[]>([]);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  /**
   * 利用可能なコマンド定義
   */
  const commands: Command[] = useMemo(() => [
    {
      name: 'filter',
      description: 'ニュース記事をフィルタリングします',
      usage: 'filter [options]',
      aliases: ['f'],
      options: [
        {
          name: 'category',
          short: 'c',
          description: 'カテゴリでフィルタリング',
          hasValue: true,
          values: categories,
        },
        {
          name: 'source',
          short: 's',
          description: 'ソースでフィルタリング',
          hasValue: true,
          values: sources,
        },
        {
          name: 'date',
          short: 'd',
          description: '日付範囲でフィルタリング',
          hasValue: true,
          values: ['today', 'yesterday', 'last_week', 'last_month'],
        },
        {
          name: 'operator',
          short: 'o',
          description: '論理演算子を指定',
          hasValue: true,
          values: ['AND', 'OR'],
        },
        {
          name: 'strict',
          description: '厳密モードを有効にする',
          hasValue: false,
        },
      ],
    },
    {
      name: 'search',
      description: 'ニュース記事を検索します',
      usage: 'search <query> [options]',
      aliases: ['s', 'grep'],
      args: [
        {
          name: 'query',
          required: true,
          description: '検索クエリ',
        },
      ],
      options: [
        {
          name: 'field',
          short: 'f',
          description: '検索対象フィールド',
          hasValue: true,
          values: ['title', 'summary', 'content', 'all'],
        },
        {
          name: 'case-sensitive',
          short: 'i',
          description: '大文字小文字を区別する',
          hasValue: false,
        },
        {
          name: 'regex',
          short: 'r',
          description: '正規表現を使用する',
          hasValue: false,
        },
      ],
    },
    {
      name: 'ls',
      description: '利用可能なカテゴリやソースを一覧表示します',
      usage: 'ls [type]',
      aliases: ['list'],
      args: [
        {
          name: 'type',
          required: false,
          description: '一覧表示する種類',
          values: ['categories', 'sources', 'commands'],
        },
      ],
    },
    {
      name: 'clear',
      description: '出力をクリアします',
      usage: 'clear',
      aliases: ['cls'],
    },
    {
      name: 'help',
      description: 'ヘルプを表示します',
      usage: 'help [command]',
      aliases: ['h', 'man'],
      args: [
        {
          name: 'command',
          required: false,
          description: 'ヘルプを表示するコマンド',
          values: ['filter', 'search', 'ls', 'clear', 'help'],
        },
      ],
    },
    {
      name: 'history',
      description: 'コマンド履歴を表示します',
      usage: 'history',
      aliases: ['hist'],
    },
  ], [categories, sources]);

  /**
   * テーマに応じたスタイルを取得
   */
  const getThemeStyles = useCallback(() => {
    switch (theme) {
      case 'matrix':
        return {
          background: 'bg-black',
          border: 'border-green-400',
          text: 'text-green-400',
          prompt: 'text-green-500',
          input: 'bg-black text-green-400 border-green-400',
          suggestion: 'bg-green-900 bg-opacity-30 border-green-400',
          output: 'text-green-300',
          error: 'text-red-400',
          success: 'text-green-400',
          info: 'text-cyan-400',
        };
      case 'hacker':
        return {
          background: 'bg-gray-900',
          border: 'border-cyan-400',
          text: 'text-cyan-400',
          prompt: 'text-cyan-500',
          input: 'bg-gray-900 text-cyan-400 border-cyan-400',
          suggestion: 'bg-cyan-900 bg-opacity-30 border-cyan-400',
          output: 'text-cyan-300',
          error: 'text-red-400',
          success: 'text-cyan-400',
          info: 'text-yellow-400',
        };
      case 'terminal':
        return {
          background: 'bg-gray-900',
          border: 'border-gray-400',
          text: 'text-white',
          prompt: 'text-gray-300',
          input: 'bg-gray-900 text-white border-gray-400',
          suggestion: 'bg-gray-800 border-gray-400',
          output: 'text-gray-300',
          error: 'text-red-400',
          success: 'text-green-400',
          info: 'text-blue-400',
        };
      case 'cyber':
        return {
          background: 'bg-purple-900',
          border: 'border-purple-400',
          text: 'text-purple-300',
          prompt: 'text-purple-400',
          input: 'bg-purple-900 text-purple-300 border-purple-400',
          suggestion: 'bg-purple-800 bg-opacity-50 border-purple-400',
          output: 'text-purple-200',
          error: 'text-red-400',
          success: 'text-green-400',
          info: 'text-pink-400',
        };
      default:
        return {
          background: 'bg-black',
          border: 'border-green-400',
          text: 'text-green-400',
          prompt: 'text-green-500',
          input: 'bg-black text-green-400 border-green-400',
          suggestion: 'bg-green-900 bg-opacity-30 border-green-400',
          output: 'text-green-300',
          error: 'text-red-400',
          success: 'text-green-400',
          info: 'text-cyan-400',
        };
    }
  }, [theme]);

  /**
   * コマンドをパースする
   */
  const parseCommand = useCallback((commandLine: string) => {
    // 引用符を考慮した分割
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < commandLine.length; i++) {
      const char = commandLine[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current.trim()) {
          parts.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      parts.push(current.trim());
    }

    if (parts.length === 0) return null;

    const commandName = parts[0];
    const args = parts.slice(1);

    // コマンドまたはエイリアスを検索
    const command = commands.find(cmd => 
      cmd.name === commandName || cmd.aliases.includes(commandName)
    );

    if (!command) {
      return null;
    }

    // オプションと引数をパース
    const parsedOptions: Record<string, string | boolean> = {};
    const parsedArgs: string[] = [];

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        // 長いオプション形式 (--option=value または --option value)
        if (arg.includes('=')) {
          const [optionName, value] = arg.substring(2).split('=', 2);
          const option = command.options?.find(opt => opt.name === optionName);
          if (option) {
            parsedOptions[optionName] = value;
          }
        } else {
          const optionName = arg.substring(2);
          const option = command.options?.find(opt => opt.name === optionName);
          
          if (option) {
            if (option.hasValue && i + 1 < args.length) {
              parsedOptions[optionName] = args[++i];
            } else {
              parsedOptions[optionName] = true;
            }
          }
        }
      } else if (arg.startsWith('-') && arg.length === 2) {
        // 短いオプション形式
        const shortName = arg.substring(1);
        const option = command.options?.find(opt => opt.short === shortName);
        
        if (option) {
          if (option.hasValue && i + 1 < args.length) {
            parsedOptions[option.name] = args[++i];
          } else {
            parsedOptions[option.name] = true;
          }
        }
      } else {
        // 通常の引数
        parsedArgs.push(arg);
      }
    }

    return {
      command,
      args: parsedArgs,
      options: parsedOptions,
    };
  }, [commands]);

  /**
   * 自動補完候補を生成する
   */
  const generateSuggestions = useCallback((input: string, cursorPos: number): AutocompleteSuggestion[] => {
    const beforeCursor = input.substring(0, cursorPos);
    const parts = beforeCursor.split(/\s+/);
    
    if (parts.length === 0) return [];

    const suggestions: AutocompleteSuggestion[] = [];

    // 最初の単語（コマンド名）の補完
    if (parts.length === 1) {
      const partial = parts[0].toLowerCase();
      
      commands.forEach(cmd => {
        // コマンド名の補完
        if (cmd.name.toLowerCase().startsWith(partial)) {
          suggestions.push({
            text: cmd.name,
            description: cmd.description,
            type: 'command',
            startIndex: 0,
            endIndex: parts[0].length,
          });
        }
        
        // エイリアスの補完
        cmd.aliases.forEach(alias => {
          if (alias.toLowerCase().startsWith(partial)) {
            suggestions.push({
              text: alias,
              description: `${cmd.description} (alias for ${cmd.name})`,
              type: 'command',
              startIndex: 0,
              endIndex: parts[0].length,
            });
          }
        });
      });
    } else {
      // コマンドが確定している場合のオプション・引数補完
      const commandName = parts[0];
      const command = commands.find(cmd => 
        cmd.name === commandName || cmd.aliases.includes(commandName)
      );

      if (command) {
        const currentPart = parts[parts.length - 1];
        const startIndex = beforeCursor.lastIndexOf(currentPart);

        // オプションの補完
        if (currentPart.startsWith('-')) {
          command.options?.forEach(option => {
            const longForm = `--${option.name}`;
            const shortForm = option.short ? `-${option.short}` : '';

            if (longForm.startsWith(currentPart)) {
              suggestions.push({
                text: longForm,
                description: option.description,
                type: 'option',
                startIndex,
                endIndex: startIndex + currentPart.length,
              });
            }

            if (shortForm && shortForm.startsWith(currentPart)) {
              suggestions.push({
                text: shortForm,
                description: option.description,
                type: 'option',
                startIndex,
                endIndex: startIndex + currentPart.length,
              });
            }
          });
        } else {
          // 値の補完
          const prevPart = parts.length > 1 ? parts[parts.length - 2] : '';
          
          if (prevPart.startsWith('-')) {
            // 前の部分がオプションの場合、そのオプションの値を補完
            const optionName = prevPart.startsWith('--') 
              ? prevPart.substring(2)
              : command.options?.find(opt => opt.short === prevPart.substring(1))?.name;

            if (optionName) {
              const option = command.options?.find(opt => opt.name === optionName);
              
              if (option?.values) {
                option.values.forEach(value => {
                  if (value.toLowerCase().includes(currentPart.toLowerCase())) {
                    suggestions.push({
                      text: value,
                      description: `${option.description}: ${value}`,
                      type: 'value',
                      startIndex,
                      endIndex: startIndex + currentPart.length,
                    });
                  }
                });
              }
            }
          } else {
            // 引数の補完
            const argIndex = parts.length - 2; // コマンド名を除く
            const arg = command.args?.[argIndex];
            
            if (arg?.values) {
              arg.values.forEach(value => {
                if (value.toLowerCase().includes(currentPart.toLowerCase())) {
                  suggestions.push({
                    text: value,
                    description: `${arg.description}: ${value}`,
                    type: 'value',
                    startIndex,
                    endIndex: startIndex + currentPart.length,
                  });
                }
              });
            }
          }
        }
      }
    }

    return suggestions.slice(0, 10); // 最大10件
  }, [commands]);

  /**
   * コマンドを実行する
   */
  const executeCommand = useCallback(async (commandLine: string): Promise<CommandResult> => {
    const parsed = parseCommand(commandLine);
    
    if (!parsed) {
      return {
        success: false,
        output: `コマンドが見つかりません: ${commandLine.split(' ')[0]}`,
        command: commandLine,
        timestamp: new Date(),
      };
    }

    const { command, args, options } = parsed;

    try {
      switch (command.name) {
        case 'filter': {
          const filters: FilterOptions = {
            categories: options.category ? [options.category as string] : undefined,
            sources: options.source ? [options.source as string] : undefined,
            dateRange: options.date as string,
            operator: (options.operator as 'AND' | 'OR') || 'OR',
            strict: !!options.strict,
          };

          onFilter(filters);

          const filterDesc = [];
          if (filters.categories) filterDesc.push(`カテゴリ: ${filters.categories.join(', ')}`);
          if (filters.sources) filterDesc.push(`ソース: ${filters.sources.join(', ')}`);
          if (filters.dateRange) filterDesc.push(`日付: ${filters.dateRange}`);

          return {
            success: true,
            output: `フィルターを適用しました\n${filterDesc.join('\n')}`,
            command: commandLine,
            timestamp: new Date(),
            data: filters,
          };
        }

        case 'search': {
          if (args.length === 0) {
            return {
              success: false,
              output: '検索クエリが指定されていません',
              command: commandLine,
              timestamp: new Date(),
            };
          }

          const query = args.join(' ');
          const searchOptions: SearchOptions = {
            fields: options.field ? [options.field as string] : ['all'],
            caseSensitive: !!options['case-sensitive'],
            regex: !!options.regex,
          };

          if (onSearch) {
            onSearch(query, searchOptions);
          }

          return {
            success: true,
            output: `検索を実行しました: "${query}"`,
            command: commandLine,
            timestamp: new Date(),
            data: { query, options: searchOptions },
          };
        }

        case 'ls': {
          const type = args[0] || 'categories';
          
          let listItems: string[] = [];
          switch (type) {
            case 'categories':
              listItems = categories;
              break;
            case 'sources':
              listItems = sources;
              break;
            case 'commands':
              listItems = commands.map(cmd => `${cmd.name} - ${cmd.description}`);
              break;
            default:
              return {
                success: false,
                output: `不明な種類: ${type}`,
                command: commandLine,
                timestamp: new Date(),
              };
          }

          return {
            success: true,
            output: `${type}:\n${listItems.map(item => `  ${item}`).join('\n')}`,
            command: commandLine,
            timestamp: new Date(),
          };
        }

        case 'clear': {
          setOutput([]);
          return {
            success: true,
            output: '',
            command: commandLine,
            timestamp: new Date(),
          };
        }

        case 'help': {
          const helpCommand = args[0];
          
          if (helpCommand) {
            const cmd = commands.find(c => c.name === helpCommand || c.aliases.includes(helpCommand));
            if (!cmd) {
              return {
                success: false,
                output: `コマンドが見つかりません: ${helpCommand}`,
                command: commandLine,
                timestamp: new Date(),
              };
            }

            let helpText = `${cmd.name} - ${cmd.description}\n\n使用方法: ${cmd.usage}`;
            
            if (cmd.aliases.length > 0) {
              helpText += `\nエイリアス: ${cmd.aliases.join(', ')}`;
            }

            if (cmd.args && cmd.args.length > 0) {
              helpText += '\n\n引数:';
              cmd.args.forEach(arg => {
                helpText += `\n  ${arg.name}${arg.required ? ' (必須)' : ' (オプション)'} - ${arg.description}`;
              });
            }

            if (cmd.options && cmd.options.length > 0) {
              helpText += '\n\nオプション:';
              cmd.options.forEach(opt => {
                const shortForm = opt.short ? `, -${opt.short}` : '';
                helpText += `\n  --${opt.name}${shortForm} - ${opt.description}`;
              });
            }

            return {
              success: true,
              output: helpText,
              command: commandLine,
              timestamp: new Date(),
            };
          } else {
            const helpText = `利用可能なコマンド:\n${commands.map(cmd => 
              `  ${cmd.name} - ${cmd.description}`
            ).join('\n')}\n\n詳細なヘルプ: help <command>`;

            return {
              success: true,
              output: helpText,
              command: commandLine,
              timestamp: new Date(),
            };
          }
        }

        case 'history': {
          const historyText = history.length > 0 
            ? history.map((cmd, index) => `  ${index + 1}  ${cmd}`).join('\n')
            : '履歴がありません';

          return {
            success: true,
            output: `コマンド履歴:\n${historyText}`,
            command: commandLine,
            timestamp: new Date(),
          };
        }

        default:
          return {
            success: false,
            output: `実装されていないコマンド: ${command.name}`,
            command: commandLine,
            timestamp: new Date(),
          };
      }
    } catch (error) {
      return {
        success: false,
        output: `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
        command: commandLine,
        timestamp: new Date(),
      };
    }
  }, [parseCommand, onFilter, onSearch, categories, sources, commands, history]);

  /**
   * 入力変更時の処理
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setCursorPosition(e.target.selectionStart || 0);

    // 自動補完候補を更新
    const newSuggestions = generateSuggestions(value, e.target.selectionStart || 0);
    setSuggestions(newSuggestions);
    setShowSuggestions(newSuggestions.length > 0);
    setSelectedSuggestionIndex(-1);
  }, [generateSuggestions]);

  /**
   * キーボードイベントの処理
   */
  const handleKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (showSuggestions && selectedSuggestionIndex >= 0) {
          // 自動補完を適用
          const suggestion = suggestions[selectedSuggestionIndex];
          const newInput = input.substring(0, suggestion.startIndex) + 
                          suggestion.text + 
                          input.substring(suggestion.endIndex);
          setInput(newInput);
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          
          // カーソル位置を更新
          setTimeout(() => {
            if (inputRef.current) {
              const newCursorPos = suggestion.startIndex + suggestion.text.length;
              inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
              setCursorPosition(newCursorPos);
            }
          }, 0);
        } else if (input.trim()) {
          // コマンドを実行
          setIsExecuting(true);
          setShowSuggestions(false);
          
          const result = await executeCommand(input.trim());
          
          // 履歴に追加
          setHistory(prev => {
            const newHistory = [input.trim(), ...prev.filter(cmd => cmd !== input.trim())];
            return newHistory.slice(0, maxHistory);
          });
          
          // 出力に追加
          if (result.output) {
            setOutput(prev => [result, ...prev].slice(0, 100)); // 最大100件
          }
          
          setInput('');
          setHistoryIndex(-1);
          setIsExecuting(false);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (showSuggestions) {
          setSelectedSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
        } else if (history.length > 0) {
          const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
          setHistoryIndex(newIndex);
          setInput(history[newIndex] || '');
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (showSuggestions) {
          setSelectedSuggestionIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
        } else if (historyIndex >= 0) {
          const newIndex = historyIndex > 0 ? historyIndex - 1 : -1;
          setHistoryIndex(newIndex);
          setInput(newIndex >= 0 ? history[newIndex] : '');
        }
        break;

      case 'Tab':
        e.preventDefault();
        if (showSuggestions && suggestions.length > 0) {
          const suggestion = suggestions[selectedSuggestionIndex >= 0 ? selectedSuggestionIndex : 0];
          const newInput = input.substring(0, suggestion.startIndex) + 
                          suggestion.text + 
                          input.substring(suggestion.endIndex);
          setInput(newInput);
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          
          // カーソル位置を更新
          setTimeout(() => {
            if (inputRef.current) {
              const newCursorPos = suggestion.startIndex + suggestion.text.length;
              inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
              setCursorPosition(newCursorPos);
            }
          }, 0);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  }, [input, showSuggestions, selectedSuggestionIndex, suggestions, history, historyIndex, maxHistory, executeCommand]);

  /**
   * 自動補完候補をクリックした時の処理
   */
  const handleSuggestionClick = useCallback((suggestion: AutocompleteSuggestion) => {
    const newInput = input.substring(0, suggestion.startIndex) + 
                    suggestion.text + 
                    input.substring(suggestion.endIndex);
    setInput(newInput);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    
    // フォーカスを戻す
    if (inputRef.current) {
      inputRef.current.focus();
      const newCursorPos = suggestion.startIndex + suggestion.text.length;
      inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      setCursorPosition(newCursorPos);
    }
  }, [input]);

  // カーソル位置の更新
  useEffect(() => {
    const handleSelectionChange = () => {
      if (inputRef.current && document.activeElement === inputRef.current) {
        setCursorPosition(inputRef.current.selectionStart || 0);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const styles = getThemeStyles();

  return (
    <div className={`command-line-filter ${styles.background} ${className} responsive-command-line`}>
      {/* 出力エリア */}
      <div className="output-area max-h-48 sm:max-h-64 overflow-y-auto mb-4 font-mono-primary text-xs sm:text-sm">
        {output.map((result, index) => (
          <div key={index} className="mb-2">
            {/* コマンドプロンプト */}
            <div className={`${styles.prompt} flex items-center flex-wrap sm:flex-nowrap`}>
              <span>$</span>
              <span className="ml-2 break-all flex-1 min-w-0">{result.command}</span>
              <span className="text-xs opacity-60 mt-1 sm:mt-0 sm:ml-auto flex-shrink-0">
                {result.timestamp.toLocaleTimeString()}
              </span>
            </div>
            
            {/* 出力 */}
            {result.output && (
              <div className={`ml-2 sm:ml-4 mt-1 whitespace-pre-wrap break-words ${
                result.success ? styles.output : styles.error
              }`}>
                {result.output}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 入力エリア */}
      <div className="input-area relative">
        {/* プロンプト */}
        <div className="flex items-center">
          <span className={`${styles.prompt} mr-2 font-mono-primary flex-shrink-0`}>$</span>
          
          {/* 入力フィールド */}
          <div className="flex-1 relative min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isExecuting}
              className={`
                w-full bg-transparent border-none outline-none font-mono-primary text-xs sm:text-sm
                ${styles.text} placeholder-gray-500
                ${disabled || isExecuting ? 'opacity-50 cursor-not-allowed' : ''}
                min-h-[44px] py-2
              `}
              autoComplete="off"
              spellCheck={false}
            />
            
            {/* 実行中インジケーター */}
            {isExecuting && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full opacity-60"></div>
              </div>
            )}
          </div>
        </div>

        {/* 自動補完候補 */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className={`
              absolute top-full left-4 sm:left-6 right-0 mt-1 z-50
              ${styles.background} ${styles.border} border rounded-lg
              max-h-40 sm:max-h-48 overflow-y-auto shadow-lg
              responsive-suggestions
            `}
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`
                  px-3 py-2 cursor-pointer font-mono-primary text-sm
                  flex items-center justify-between
                  ${index === selectedSuggestionIndex 
                    ? `${styles.suggestion} bg-opacity-50` 
                    : 'hover:bg-gray-800 hover:bg-opacity-50'
                  }
                  ${index === 0 ? 'rounded-t-lg' : ''}
                  ${index === suggestions.length - 1 ? 'rounded-b-lg' : ''}
                `}
              >
                <div className="flex items-center space-x-2">
                  <span className={styles.text}>{suggestion.text}</span>
                  <span className="text-xs opacity-60">
                    {suggestion.type}
                  </span>
                </div>
                {suggestion.description && (
                  <span className="text-xs opacity-60 ml-2 truncate">
                    {suggestion.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* デバッグ情報 */}
      {debug && (
        <div className="debug-info mt-4 p-2 bg-gray-800 rounded text-xs font-mono-primary">
          <div>カーソル位置: {cursorPosition}</div>
          <div>履歴インデックス: {historyIndex}</div>
          <div>候補数: {suggestions.length}</div>
          <div>選択候補: {selectedSuggestionIndex}</div>
        </div>
      )}
    </div>
  );
};

export default CommandLineFilter;