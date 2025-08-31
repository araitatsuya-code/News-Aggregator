/**
 * SEO対応のHeadコンポーネント
 */

import Head from 'next/head';
import { useRouter } from 'next/router';
import { SEOMetadata } from '../lib/utils/seo';

interface SEOHeadProps {
  metadata: SEOMetadata;
  jsonLd?: object;
}

/**
 * SEOメタデータを設定するHeadコンポーネント
 */
export function SEOHead({ metadata, jsonLd }: SEOHeadProps) {
  const router = useRouter();
  const currentUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-news-aggregator.example.com'}${router.asPath}`;
  
  return (
    <Head>
      {/* 基本メタデータ */}
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <meta name="keywords" content={metadata.keywords.join(', ')} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      
      {/* Open Graph メタデータ */}
      <meta property="og:title" content={metadata.ogTitle} />
      <meta property="og:description" content={metadata.ogDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="AI News Aggregator" />
      <meta property="og:locale" content={router.locale === 'ja' ? 'ja_JP' : 'en_US'} />
      {metadata.ogImage && (
        <meta property="og:image" content={metadata.ogImage} />
      )}
      
      {/* Twitter Card メタデータ */}
      <meta name="twitter:card" content={metadata.twitterCard} />
      <meta name="twitter:title" content={metadata.ogTitle} />
      <meta name="twitter:description" content={metadata.ogDescription} />
      {metadata.ogImage && (
        <meta name="twitter:image" content={metadata.ogImage} />
      )}
      
      {/* 正規URL */}
      <link rel="canonical" href={metadata.canonical || currentUrl} />
      
      {/* 言語切替 */}
      <link rel="alternate" hrefLang="ja" href={`${process.env.NEXT_PUBLIC_SITE_URL}/ja${router.asPath}`} />
      <link rel="alternate" hrefLang="en" href={`${process.env.NEXT_PUBLIC_SITE_URL}/en${router.asPath}`} />
      <link rel="alternate" hrefLang="x-default" href={`${process.env.NEXT_PUBLIC_SITE_URL}${router.asPath}`} />
      
      {/* ファビコン */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      
      {/* RSS フィード */}
      <link 
        rel="alternate" 
        type="application/rss+xml" 
        title="AI News Aggregator RSS Feed" 
        href="/api/rss" 
      />
      
      {/* 構造化データ */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      
      {/* プリロード重要リソース */}
      <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="" />
      
      {/* DNS プリフェッチ */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      
      {/* セキュリティヘッダー */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      
      {/* PWA対応 */}
      <meta name="theme-color" content="#1f2937" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="AI News" />
      
      {/* 検索エンジン向け */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
    </Head>
  );
}