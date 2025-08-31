/**
 * サイトマップ生成ユーティリティ
 */

import { NewsItem, DailySummary } from '../types';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * XMLサイトマップを生成
 */
export function generateSitemap(urls: SitemapUrl[]): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-news-aggregator.example.com';
  
  const urlElements = urls.map(url => `
  <url>
    <loc>${baseUrl}${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlElements}
</urlset>`;
}

/**
 * 基本ページのサイトマップURLを生成
 */
export function getStaticSitemapUrls(): SitemapUrl[] {
  const now = new Date().toISOString();
  
  return [
    {
      loc: '/',
      lastmod: now,
      changefreq: 'daily',
      priority: 1.0
    },
    {
      loc: '/summary',
      lastmod: now,
      changefreq: 'daily',
      priority: 0.9
    },
    {
      loc: '/categories',
      lastmod: now,
      changefreq: 'weekly',
      priority: 0.8
    },
    // 多言語対応
    {
      loc: '/en',
      lastmod: now,
      changefreq: 'daily',
      priority: 0.9
    },
    {
      loc: '/en/summary',
      lastmod: now,
      changefreq: 'daily',
      priority: 0.8
    },
    {
      loc: '/en/categories',
      lastmod: now,
      changefreq: 'weekly',
      priority: 0.7
    }
  ];
}

/**
 * ニュース記事のサイトマップURLを生成
 */
export function getNewsSitemapUrls(articles: NewsItem[]): SitemapUrl[] {
  return articles.map(article => ({
    loc: `/news/${article.id}`,
    lastmod: new Date(article.published_at).toISOString(),
    changefreq: 'never' as const,
    priority: 0.6
  }));
}

/**
 * 日次サマリーのサイトマップURLを生成
 */
export function getSummarySitemapUrls(summaries: DailySummary[]): SitemapUrl[] {
  return summaries.map(summary => ({
    loc: `/summary/${summary.date}`,
    lastmod: new Date(summary.generated_at).toISOString(),
    changefreq: 'never' as const,
    priority: 0.7
  }));
}

/**
 * カテゴリページのサイトマップURLを生成
 */
export function getCategorySitemapUrls(categories: string[]): SitemapUrl[] {
  const now = new Date().toISOString();
  
  return categories.flatMap(category => [
    {
      loc: `/categories/${encodeURIComponent(category)}`,
      lastmod: now,
      changefreq: 'daily' as const,
      priority: 0.7
    },
    {
      loc: `/en/categories/${encodeURIComponent(category)}`,
      lastmod: now,
      changefreq: 'daily' as const,
      priority: 0.6
    }
  ]);
}

/**
 * RSSフィード用のXMLを生成
 */
export function generateRSSFeed(articles: NewsItem[], locale: string = 'ja'): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-news-aggregator.example.com';
  const isJapanese = locale === 'ja';
  
  const title = isJapanese ? 'AIニュースまとめ' : 'AI News Aggregator';
  const description = isJapanese 
    ? 'AI・機械学習に関する最新ニュースを自動収集・要約'
    : 'Latest AI and machine learning news with automatic summaries';
  
  const items = articles.slice(0, 20).map(article => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <description><![CDATA[${article.summary}]]></description>
      <link>${article.url}</link>
      <guid isPermaLink="false">${article.id}</guid>
      <pubDate>${new Date(article.published_at).toUTCString()}</pubDate>
      <category><![CDATA[${article.category}]]></category>
      <source url="${baseUrl}">${title}</source>
    </item>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${title}]]></title>
    <description><![CDATA[${description}]]></description>
    <link>${baseUrl}</link>
    <language>${locale}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml" />
    <generator>AI News Aggregator</generator>
    <webMaster>admin@ai-news-aggregator.example.com</webMaster>
    <managingEditor>admin@ai-news-aggregator.example.com</managingEditor>
    <ttl>60</ttl>
${items}
  </channel>
</rss>`;
}

/**
 * robots.txtを生成
 */
export function generateRobotsTxt(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-news-aggregator.example.com';
  
  return `User-agent: *
Allow: /

# サイトマップ
Sitemap: ${baseUrl}/sitemap.xml

# クロール頻度の制限
Crawl-delay: 1

# 除外パス
Disallow: /api/
Disallow: /_next/
Disallow: /static/

# 検索エンジン向けの追加情報
# Google
User-agent: Googlebot
Allow: /

# Bing
User-agent: Bingbot
Allow: /

# Yahoo
User-agent: Slurp
Allow: /`;
}