/**
 * Intersection Observer用のカスタムフック
 */

import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
  triggerOnce?: boolean;
}

interface UseIntersectionObserverReturn {
  elementRef: React.RefObject<HTMLDivElement>;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

/**
 * 要素の表示状態を監視するフック
 */
export function useIntersectionObserver({
  threshold = 0,
  rootMargin = '0px',
  root = null,
  triggerOnce = true
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverReturn {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    // Intersection Observerがサポートされていない場合は常にtrueを返す
    if (!window.IntersectionObserver) {
      setIsIntersecting(true);
      return;
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setEntry(entry);
        
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          
          // 一度だけトリガーする場合は監視を停止
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsIntersecting(false);
        }
      },
      {
        threshold,
        rootMargin,
        root
      }
    );
    
    observer.observe(element);
    
    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, root, triggerOnce]);
  
  return {
    elementRef,
    isIntersecting,
    entry
  };
}