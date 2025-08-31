/**
 * サイトマップ生成スクリプト
 * ビルド時に実行されて、静的なサイトマップファイルを生成する
 */

const fs = require('fs');
const path = require('path');

// サイトマップ生成関数を直接定義
function generateSitemap(urls) {
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

function getStaticSitemapUrls() {
  const now = new Date().toISOString();
  
  return [
    { loc: '/', lastmod: now, changefreq: 'daily', priority: 1.0 },
    { loc: '/summary', lastmod: now, changefreq: 'daily', priority: 0.9 },
    { loc: '/categories', lastmod: now, changefreq: 'weekly', priority: 0.8 },
    { loc: '/en', lastmod: now, changefreq: 'daily', priority: 0.9 },
    { loc: '/en/summary', lastmod: now, changefreq: 'daily', priority: 0.8 },
    { loc: '/en/categories', lastmod: now, changefreq: 'weekly', priority: 0.7 }
  ];
}

function getNewsSitemapUrls(articles) {
  return articles.map(article => ({
    loc: `/news/${article.id}`,
    lastmod: new Date(article.published_at).toISOString(),
    changefreq: 'never',
    priority: 0.6
  }));
}

function getSummarySitemapUrls(summaries) {
  return summaries.map(summary => ({
    loc: `/summary/${summary.date}`,
    lastmod: new Date(summary.generated_at).toISOString(),
    changefreq: 'never',
    priority: 0.7
  }));
}

function getCategorySitemapUrls(categories) {
  const now = new Date().toISOString();
  
  return categories.flatMap(category => [
    {
      loc: `/categories/${encodeURIComponent(category)}`,
      lastmod: now,
      changefreq: 'daily',
      priority: 0.7
    },
    {
      loc: `/en/categories/${encodeURIComponent(category)}`,
      lastmod: now,
      changefreq: 'daily',
      priority: 0.6
    }
  ]);
}

function generateRSSFeed(articles, locale = 'ja') {
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

function generateRobotsTxt() {
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

/**
 * JSONファイルからデータを読み込む
 */
function loadJSONFile(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', 'public', 'data', filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn(`Failed to load ${filePath}:`, error.message);
  }
  return null;
}

/**
 * 利用可能な日付一覧を取得
 */
function getAvailableDates() {
  const newsDir = path.join(__dirname, '..', 'public', 'data', 'news');
  const dates = [];
  
  try {
    if (fs.existsSync(newsDir)) {
      const entries = fs.readdirSync(newsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(entry.name)) {
          dates.push(entry.name);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to read news directory:', error.message);
  }
  
  return dates.sort().reverse(); // 新しい順にソート
}

/**
 * 利用可能なカテゴリ一覧を取得
 */
function getAvailableCategories() {
  const categories = loadJSONFile('config/categories.json');
  return categories || ['国内', '海外', 'Reddit', 'その他'];
}

/**
 * 全ての記事を収集
 */
function getAllArticles() {
  const dates = getAvailableDates();
  const allArticles = [];
  
  for (const date of dates.slice(0, 30)) { // 最新30日分のみ
    const articles = loadJSONFile(`news/${date}/articles.json`);
    if (articles && Array.isArray(articles)) {
      allArticles.push(...articles);
    }
  }
  
  return allArticles;
}

/**
 * 全てのサマリーを収集
 */
function getAllSummaries() {
  const dates = getAvailableDates();
  const allSummaries = [];
  
  for (const date of dates.slice(0, 30)) { // 最新30日分のみ
    const summary = loadJSONFile(`summaries/${date}.json`);
    if (summary) {
      allSummaries.push(summary);
    }
  }
  
  return allSummaries;
}

/**
 * メインのサイトマップ生成処理
 */
async function generateSitemapFiles() {
  console.log('🗺️  サイトマップ生成を開始...');
  
  try {
    // データを収集
    const articles = getAllArticles();
    const summaries = getAllSummaries();
    const categories = getAvailableCategories();
    
    console.log(`📰 記事数: ${articles.length}`);
    console.log(`📊 サマリー数: ${summaries.length}`);
    console.log(`📂 カテゴリ数: ${categories.length}`);
    
    // サイトマップURLを生成
    const staticUrls = getStaticSitemapUrls();
    const newsUrls = getNewsSitemapUrls(articles);
    const summaryUrls = getSummarySitemapUrls(summaries);
    const categoryUrls = getCategorySitemapUrls(categories);
    
    const allUrls = [
      ...staticUrls,
      ...newsUrls,
      ...summaryUrls,
      ...categoryUrls
    ];
    
    // サイトマップXMLを生成
    const sitemapXml = generateSitemap(allUrls);
    
    // ファイルに保存
    const publicDir = path.join(__dirname, '..', 'public');
    
    // sitemap.xml
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml);
    console.log('✅ sitemap.xml を生成しました');
    
    // robots.txt
    const robotsTxt = generateRobotsTxt();
    fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt);
    console.log('✅ robots.txt を生成しました');
    
    // RSSフィード（日本語）
    const rssJa = generateRSSFeed(articles.slice(0, 20), 'ja');
    fs.writeFileSync(path.join(publicDir, 'rss.xml'), rssJa);
    console.log('✅ rss.xml (日本語) を生成しました');
    
    // RSSフィード（英語）
    const rssEn = generateRSSFeed(articles.slice(0, 20), 'en');
    fs.writeFileSync(path.join(publicDir, 'rss-en.xml'), rssEn);
    console.log('✅ rss-en.xml (英語) を生成しました');
    
    // 統計情報を出力
    console.log('\n📈 生成統計:');
    console.log(`   総URL数: ${allUrls.length}`);
    console.log(`   静的ページ: ${staticUrls.length}`);
    console.log(`   ニュース記事: ${newsUrls.length}`);
    console.log(`   日次サマリー: ${summaryUrls.length}`);
    console.log(`   カテゴリページ: ${categoryUrls.length}`);
    
    console.log('\n🎉 サイトマップ生成が完了しました！');
    
  } catch (error) {
    console.error('❌ サイトマップ生成中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合
if (require.main === module) {
  generateSitemapFiles();
}

module.exports = { generateSitemapFiles };