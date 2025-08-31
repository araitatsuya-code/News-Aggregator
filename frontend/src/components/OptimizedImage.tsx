/**
 * 最適化された画像コンポーネント
 */

import { useState, useEffect } from 'react';
import { useIntersectionObserver } from '../lib/hooks/useIntersectionObserver';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  quality?: number;
}

/**
 * 遅延読み込みと最適化機能を持つ画像コンポーネント
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  sizes = '100vw',
  quality = 75
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  
  // 遅延読み込み用のIntersection Observer
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });
  
  // 画像の読み込み判定
  const shouldLoad = priority || isIntersecting;
  
  useEffect(() => {
    if (shouldLoad && !currentSrc) {
      setCurrentSrc(src);
    }
  }, [shouldLoad, src, currentSrc]);
  
  // WebP対応の確認
  const supportsWebP = () => {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  };
  
  // 最適化されたsrcを生成
  const getOptimizedSrc = (originalSrc: string) => {
    if (!originalSrc) return '';
    
    // 外部URLの場合はそのまま返す
    if (originalSrc.startsWith('http')) {
      return originalSrc;
    }
    
    // 内部画像の場合は最適化パラメータを追加
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality !== 75) params.set('q', quality.toString());
    
    // WebP対応の場合はフォーマットを指定
    if (supportsWebP()) {
      params.set('f', 'webp');
    }
    
    const queryString = params.toString();
    return queryString ? `${originalSrc}?${queryString}` : originalSrc;
  };
  
  // プレースホルダー画像の生成
  const generatePlaceholder = (w: number = 400, h: number = 300) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // グラデーション背景
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, '#f3f4f6');
      gradient.addColorStop(1, '#e5e7eb');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      
      // アイコン描画
      ctx.fillStyle = '#9ca3af';
      ctx.font = `${Math.min(w, h) / 8}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📷', w / 2, h / 2);
    }
    
    return canvas.toDataURL();
  };
  
  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };
  
  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };
  
  // エラー時のフォールバック画像
  const fallbackSrc = generatePlaceholder(width, height);
  
  return (
    <div 
      ref={elementRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* プレースホルダー */}
      {placeholder === 'blur' && !isLoaded && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{
            backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(10px)'
          }}
        />
      )}
      
      {/* メイン画像 */}
      {currentSrc && (
        <img
          src={hasError ? fallbackSrc : getOptimizedSrc(currentSrc)}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          className={`
            transition-opacity duration-300
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${width && height ? '' : 'w-full h-auto'}
          `}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
      
      {/* 読み込み中インジケーター */}
      {!isLoaded && !hasError && currentSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {/* エラー表示 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
          <div className="text-center">
            <div className="text-2xl mb-2">📷</div>
            <div className="text-sm">画像を読み込めませんでした</div>
          </div>
        </div>
      )}
    </div>
  );
}