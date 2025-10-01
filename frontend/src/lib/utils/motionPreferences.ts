/**
 * prefers-reduced-motion対応のアニメーション制御ユーティリティ
 */

import { useEffect, useState } from 'react';

/**
 * ユーザーのモーション設定を検出するカスタムフック
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // SSR対応: クライアントサイドでのみ実行
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // モダンブラウザ対応
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // 古いブラウザ対応
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * アニメーション設定の型定義
 */
export interface AnimationConfig {
  /** アニメーション継続時間（ミリ秒） */
  duration: number;
  /** イージング関数 */
  easing: string;
  /** 遅延時間（ミリ秒） */
  delay?: number;
  /** 繰り返し回数 */
  iterations?: number | 'infinite';
  /** アニメーション方向 */
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
}

/**
 * 標準アニメーション設定
 */
export const animationPresets = {
  // 通常のアニメーション
  normal: {
    typing: {
      duration: 50,
      easing: 'linear',
    },
    fadeIn: {
      duration: 300,
      easing: 'ease-out',
    },
    slideIn: {
      duration: 400,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
    bounce: {
      duration: 600,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    pulse: {
      duration: 1000,
      easing: 'ease-in-out',
      iterations: 'infinite' as const,
      direction: 'alternate' as const,
    },
    spin: {
      duration: 1000,
      easing: 'linear',
      iterations: 'infinite' as const,
    },
    glow: {
      duration: 2000,
      easing: 'ease-in-out',
      iterations: 'infinite' as const,
      direction: 'alternate' as const,
    },
  },
  
  // 軽減されたアニメーション
  reduced: {
    typing: {
      duration: 0, // 即座に表示
      easing: 'linear',
    },
    fadeIn: {
      duration: 100, // 短縮
      easing: 'ease-out',
    },
    slideIn: {
      duration: 150, // 短縮
      easing: 'ease-out',
    },
    bounce: {
      duration: 200, // 短縮、バウンス効果なし
      easing: 'ease-out',
    },
    pulse: {
      duration: 0, // 無効化
      easing: 'linear',
      iterations: 1,
    },
    spin: {
      duration: 0, // 無効化
      easing: 'linear',
      iterations: 1,
    },
    glow: {
      duration: 0, // 無効化
      easing: 'linear',
      iterations: 1,
    },
  },
};

/**
 * モーション設定に基づいてアニメーション設定を取得
 */
export function getAnimationConfig(
  animationType: keyof typeof animationPresets.normal,
  prefersReducedMotion: boolean
): AnimationConfig {
  return prefersReducedMotion 
    ? animationPresets.reduced[animationType]
    : animationPresets.normal[animationType];
}

/**
 * CSS変数としてアニメーション設定を生成
 */
export function generateAnimationCSSVars(prefersReducedMotion: boolean): Record<string, string> {
  const preset = prefersReducedMotion ? animationPresets.reduced : animationPresets.normal;
  
  const cssVars: Record<string, string> = {};
  
  Object.entries(preset).forEach(([key, config]) => {
    cssVars[`--animation-${key}-duration`] = `${config.duration}ms`;
    cssVars[`--animation-${key}-easing`] = config.easing;
    if ('delay' in config && config.delay) {
      cssVars[`--animation-${key}-delay`] = `${config.delay}ms`;
    }
    if ('iterations' in config && config.iterations) {
      cssVars[`--animation-${key}-iterations`] = config.iterations.toString();
    }
    if ('direction' in config && config.direction) {
      cssVars[`--animation-${key}-direction`] = config.direction as string;
    }
  });
  
  return cssVars;
}

/**
 * アニメーション対応のスタイルクラスを生成
 */
export function createMotionSafeClasses(prefersReducedMotion: boolean) {
  const baseClasses = {
    // フェードイン
    fadeIn: prefersReducedMotion 
      ? 'opacity-100' 
      : 'animate-fade-in',
    
    // スライドイン
    slideInLeft: prefersReducedMotion 
      ? 'transform-none' 
      : 'animate-slide-in-left',
    
    slideInRight: prefersReducedMotion 
      ? 'transform-none' 
      : 'animate-slide-in-right',
    
    slideInUp: prefersReducedMotion 
      ? 'transform-none' 
      : 'animate-slide-in-up',
    
    // パルス効果
    pulse: prefersReducedMotion 
      ? '' 
      : 'animate-pulse',
    
    // スピン効果
    spin: prefersReducedMotion 
      ? '' 
      : 'animate-spin',
    
    // バウンス効果
    bounce: prefersReducedMotion 
      ? '' 
      : 'animate-bounce',
    
    // グロー効果
    glow: prefersReducedMotion 
      ? '' 
      : 'animate-glow',
  };
  
  return baseClasses;
}

/**
 * タイピングアニメーション用のカスタムフック
 */
export function useTypingAnimation(
  text: string,
  speed: number = 50,
  enabled: boolean = true
): { displayText: string; isComplete: boolean } {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!enabled || prefersReducedMotion) {
      // アニメーション無効時は即座に全文表示
      setDisplayText(text);
      setIsComplete(true);
      return;
    }

    setDisplayText('');
    setIsComplete(false);
    
    let currentIndex = 0;
    const timer = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, enabled, prefersReducedMotion]);

  return { displayText, isComplete };
}

/**
 * スクロールアニメーション用のカスタムフック
 */
export function useScrollAnimation(threshold: number = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const elementRef = (node: HTMLElement | null) => {
    if (!node || prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  };

  return { isVisible, elementRef };
}

/**
 * アニメーション遅延を計算
 */
export function calculateAnimationDelay(
  index: number,
  baseDelay: number = 100,
  prefersReducedMotion: boolean = false
): number {
  return prefersReducedMotion ? 0 : index * baseDelay;
}

/**
 * CSS-in-JSスタイルでアニメーションを適用
 */
export function applyMotionSafeStyles(
  baseStyles: React.CSSProperties,
  animationStyles: React.CSSProperties,
  prefersReducedMotion: boolean
): React.CSSProperties {
  return {
    ...baseStyles,
    ...(prefersReducedMotion ? {} : animationStyles),
  };
}