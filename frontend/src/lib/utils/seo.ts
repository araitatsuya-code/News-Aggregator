/**
 * SEO対応のメタデータ生成ユーティリティ
 */

import { NewsItem, DailySummary } from '../types';

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
  twitterCard: 'summary' | 'summary_large_image';
  canonical?: string;
}

/**
 * デフォルトのSEOメタデータを生成
 */
export function getDefaultSEOMetadata(locale: string = 'ja'): SEOMetadata {
  const isJapanese = locale === 'ja';
  
  return {
    title: isJapanese 
      ? 'AIニュースまとめ - 最新のAI関連ニュースを日本語で'
      : 'AI News Aggregator - Latest AI News in Japanese and English',
    description: isJapanese
      ? 'AI・機械学習に関する最新ニュースを自動収集し、日本語要約でお届けします。海外の重要なAI情報も翻訳してわかりやすく提供。'
      : 'Automatically collect and summarize the latest AI and machine learning news. Get important AI information from overseas translated into Japanese.',
    keywords: isJapanese
      ? ['AI', '人工知能', '機械学習', 'ニュース', '要約', '翻訳', 'テクノロジー']
      : ['AI', 'artificial intelligence', 'machine learning', 'news', 'summary', 'translation', 'technology'],
    ogTitle: isJapanese
      ? 'AIニュースまとめ'
      : 'AI News Aggregator',
    ogDescription: isJapanese
      ? 'AI・機械学習の最新ニュースを日本語要約でお届け'
      : 'Latest AI and ML news with Japanese summaries',
    twitterCard: 'summary_large_image'
  };
}

/**
 * ニュース一覧ページ用のSEOメタデータを生成
 */
export function getNewsListSEOMetadata(
  articles: NewsItem[], 
  category?: string,
  locale: string = 'ja'
): SEOMetadata {
  const isJapanese = locale === 'ja';
  const defaultMeta = getDefaultSEOMetadata(locale);
  
  const categoryText = category 
    ? (isJapanese ? `${category}カテゴリの` : `${category} category `)
    : '';
  
  const title = isJapanese
    ? `${categoryText}AIニュース一覧 - AIニュースまとめ`
    : `${categoryText}AI News List - AI News Aggregator`;
    
  const description = isJapanese
    ? `${categoryText}AI・機械学習に関する最新ニュース${articles.length}件を掲載。自動要約と翻訳で効率的に情報収集できます。`
    : `${categoryText}Latest ${articles.length} AI and machine learning news articles with automatic summaries and translations.`;
  
  return {
    ...defaultMeta,
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    keywords: category 
      ? [...defaultMeta.keywords, category.toLowerCase()]
      : defaultMeta.keywords
  };
}

/**
 * 日次サマリーページ用のSEOメタデータを生成
 */
export function getDailySummarySEOMetadata(
  summary: DailySummary,
  locale: string = 'ja'
): SEOMetadata {
  const isJapanese = locale === 'ja';
  const defaultMeta = getDefaultSEOMetadata(locale);
  
  const dateStr = new Date(summary.date).toLocaleDateString(
    isJapanese ? 'ja-JP' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );
  
  const title = isJapanese
    ? `${dateStr}のAIニュースまとめ - 日次サマリー`
    : `AI News Summary for ${dateStr} - Daily Summary`;
    
  const description = isJapanese
    ? `${dateStr}のAI関連ニュース${summary.total_articles}件をまとめました。主要トレンド: ${summary.top_trends.slice(0, 3).join('、')}`
    : `Summary of ${summary.total_articles} AI news articles for ${dateStr}. Top trends: ${summary.top_trends.slice(0, 3).join(', ')}`;
  
  return {
    ...defaultMeta,
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    keywords: [...defaultMeta.keywords, ...summary.top_trends.slice(0, 5)]
  };
}

/**
 * 構造化データ（JSON-LD）を生成
 */
export function generateNewsArticleJsonLd(article: NewsItem): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary,
    url: article.url,
    datePublished: article.published_at,
    author: {
      '@type': 'Organization',
      name: article.source
    },
    publisher: {
      '@type': 'Organization',
      name: 'AI News Aggregator'
    },
    articleSection: article.category,
    keywords: article.tags.join(', '),
    inLanguage: article.language
  };
}

/**
 * サイト全体の構造化データを生成
 */
export function generateWebsiteJsonLd(locale: string = 'ja'): object {
  const isJapanese = locale === 'ja';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: isJapanese ? 'AIニュースまとめ' : 'AI News Aggregator',
    description: isJapanese
      ? 'AI・機械学習に関する最新ニュースを自動収集・要約するサイト'
      : 'Automated AI and machine learning news aggregation and summarization site',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-news-aggregator.example.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-news-aggregator.example.com'}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}