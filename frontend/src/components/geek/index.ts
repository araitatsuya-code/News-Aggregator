/**
 * ギーク向けUIコンポーネントのエクスポート
 */

// タイピングアニメーション関連
export { TypingAnimation, MultiLineTypingAnimation } from './TypingAnimation';

// ターミナルプロンプト関連
export { TerminalPrompt, TerminalSession } from './TerminalPrompt';

// ページローダー関連
export { PageLoader, SimpleTypingLoader } from './PageLoader';

// ニュース表示関連
export { TerminalNewsItem, TerminalNewsList } from './TerminalNewsItem';

// フィルター関連
export { FunctionCallFilter, SimpleFunctionCallFilter } from './FunctionCallFilter';

// コマンドライン関連
export { CommandLineFilter } from './CommandLineFilter';
export { CommandLineNavigation } from './CommandLineNavigation';

// エラーハンドリング関連
export { TerminalError } from './TerminalError';
export { CompileFeedback } from './CompileFeedback';
export { ASCIILoader, MultiLineASCIILoader } from './ASCIILoader';
export { ErrorHandlingSystem, useErrorHandling } from './ErrorHandlingSystem';

// 型定義のエクスポート
export type { TerminalErrorInfo, ErrorType } from './TerminalError';
export type { CompileStep, CompileStatus } from './CompileFeedback';
export type { LoaderType } from './ASCIILoader';
export type { SystemState } from './ErrorHandlingSystem';

// レスポンシブ対応コンポーネント
export { ResponsiveTerminalLayout, CompactTerminalLayout } from './ResponsiveTerminalLayout';
export { MobileGeekNavigation, TabletGeekNavigation } from './MobileGeekNavigation';

// モード切り替え
export { GeekModeToggle, GeekModeRedirect, useGeekMode } from './GeekModeToggle';

// カスタムフック
export {
  useTypingAnimation,
  useCursorBlink,
  useMultiLineTypingAnimation,
} from '../../lib/hooks/useTypingAnimation';

export {
  useKeyboardShortcuts,
  commonShortcuts,
  geekShortcuts,
} from '../../lib/hooks/useKeyboardShortcuts';