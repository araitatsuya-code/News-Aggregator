/**
 * SEOメタデータ管理用のカスタムフック
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { SEOMetadata } from '../utils/seo';

/**
 * SEOメタデータを動的に設定するフック
 */
export function useSEO(metadata: SEOMetadata) {
  const router = useRouter();
  
  useEffect(() => {
    // ページタイトルを動的に更新
    document.title = metadata.title;
    
    // メタタグを動的に更新
    updateMetaTag('description', metadata.description);
    updateMetaTag('keywords', metadata.keywords.join(', '));
    updateMetaTag('og:title', metadata.ogTitle);
    updateMetaTag('og:description', metadata.ogDescription);
    updateMetaTag('twitter:card', metadata.twitterCard);
    
    if (metadata.ogImage) {
      updateMetaTag('og:image', metadata.ogImage);
    }
    
    if (metadata.canonical) {
      updateLinkTag('canonical', metadata.canonical);
    }
  }, [metadata, router.asPath]);
}

/**
 * メタタグを更新するヘルパー関数
 */
function updateMetaTag(name: string, content: string) {
  const isProperty = name.startsWith('og:') || name.startsWith('twitter:');
  const attribute = isProperty ? 'property' : 'name';
  
  let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  
  element.content = content;
}

/**
 * リンクタグを更新するヘルパー関数
 */
function updateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  
  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }
  
  element.href = href;
}

/**
 * 構造化データを追加するフック
 */
export function useStructuredData(jsonLd: object) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    script.id = 'structured-data';
    
    // 既存の構造化データスクリプトを削除
    const existingScript = document.getElementById('structured-data');
    if (existingScript) {
      existingScript.remove();
    }
    
    document.head.appendChild(script);
    
    return () => {
      const scriptToRemove = document.getElementById('structured-data');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [jsonLd]);
}