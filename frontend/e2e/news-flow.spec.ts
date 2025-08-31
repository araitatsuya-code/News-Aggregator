/**
 * ニュースフローのE2Eテスト
 * ユーザーがニュースを閲覧し、サマリーを確認する一連の流れをテスト
 */

import { test, expect, Page } from '@playwright/test'

// テストデータのセットアップ
const mockNewsData = [
  {
    id: 'test-1',
    title: 'AI技術の革新的進歩',
    original_title: 'Revolutionary AI Technology Advances',
    summary: 'AI技術が革新的な進歩を遂げ、業界に大きな変化をもたらしています。',
    url: 'https://example.com/article1',
    source: 'テクノロジーニュース',
    category: 'AI',
    published_at: '2024-08-31T12:00:00Z',
    language: 'ja',
    tags: ['AI', '技術革新'],
    ai_confidence: 0.92
  },
  {
    id: 'test-2',
    title: '機械学習の医療応用',
    original_title: 'Machine Learning in Healthcare',
    summary: '機械学習技術が医療分野で新たな応用を見せています。',
    url: 'https://example.com/article2',
    source: '医療AI情報',
    category: '機械学習',
    published_at: '2024-08-31T13:00:00Z',
    language: 'ja',
    tags: ['機械学習', '医療'],
    ai_confidence: 0.88
  }
]

const mockDailySummary = {
  date: '2024-08-31',
  total_articles: 2,
  top_trends: ['AI技術', '機械学習', '医療応用'],
  significant_news: [mockNewsData[0]],
  category_breakdown: { 'AI': 1, '機械学習': 1 },
  summary_ja: '今日はAI技術と機械学習の医療応用に関する重要な記事が投稿されました。',
  summary_en: 'Today saw important articles about AI technology and machine learning applications in healthcare.',
  generated_at: '2024-08-31T18:00:00Z'
}

test.describe('ニュースフロー', () => {
  test.beforeEach(async ({ page }) => {
    // APIレスポンスをモック
    await page.route('/data/news/latest.json', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockNewsData)
      })
    })

    await page.route('/data/summaries/latest.json', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDailySummary)
      })
    })

    await page.route('/data/config/categories.json', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(['AI', '機械学習', 'データサイエンス'])
      })
    })
  })

  test('ユーザーがニュース一覧を閲覧し、サマリーを確認できる', async ({ page }) => {
    // トップページにアクセス
    await page.goto('/')

    // ページタイトルが正しく表示されることを確認
    await expect(page).toHaveTitle(/AIニュースまとめ/)

    // ニュース一覧が表示されることを確認
    await expect(page.locator('[data-testid="news-list"]')).toBeVisible()

    // 記事が表示されることを確認
    await expect(page.locator('text=AI技術の革新的進歩')).toBeVisible()
    await expect(page.locator('text=機械学習の医療応用')).toBeVisible()

    // 記事の詳細情報が表示されることを確認
    await expect(page.locator('text=テクノロジーニュース')).toBeVisible()
    await expect(page.locator('text=92%')).toBeVisible() // 信頼度

    // 日次サマリーページに移動
    await page.click('[data-testid="daily-summary-link"]')

    // サマリーページが表示されることを確認
    await expect(page.locator('[data-testid="daily-summary"]')).toBeVisible()

    // サマリー内容が表示されることを確認
    await expect(page.locator('text=2024年8月31日のまとめ')).toBeVisible()
    await expect(page.locator('text=2件の記事')).toBeVisible()
    await expect(page.locator('text=今日はAI技術と機械学習')).toBeVisible()

    // トレンドが表示されることを確認
    await expect(page.locator('text=AI技術')).toBeVisible()
    await expect(page.locator('text=機械学習')).toBeVisible()
  })

  test('カテゴリフィルタリングが正しく動作する', async ({ page }) => {
    await page.goto('/')

    // 初期状態では全ての記事が表示される
    await expect(page.locator('text=AI技術の革新的進歩')).toBeVisible()
    await expect(page.locator('text=機械学習の医療応用')).toBeVisible()

    // AIカテゴリでフィルタリング
    await page.click('[data-testid="category-filter-ai"]')

    // AIカテゴリの記事のみ表示されることを確認
    await expect(page.locator('text=AI技術の革新的進歩')).toBeVisible()
    await expect(page.locator('text=機械学習の医療応用')).not.toBeVisible()

    // URLにカテゴリパラメータが反映されることを確認
    await expect(page).toHaveURL(/category=AI/)

    // フィルタをクリア
    await page.click('[data-testid="clear-filter"]')

    // 全ての記事が再び表示されることを確認
    await expect(page.locator('text=AI技術の革新的進歩')).toBeVisible()
    await expect(page.locator('text=機械学習の医療応用')).toBeVisible()
  })

  test('言語切替が正しく動作する', async ({ page }) => {
    await page.goto('/')

    // 初期状態では日本語が表示される
    await expect(page.locator('text=AIニュースまとめ')).toBeVisible()

    // 英語に切り替え
    await page.click('[data-testid="language-toggle-en"]')

    // 英語UIが表示されることを確認
    await expect(page.locator('text=AI News Aggregator')).toBeVisible()

    // 記事の元タイトルが表示されることを確認
    await expect(page.locator('text=Revolutionary AI Technology Advances')).toBeVisible()

    // 日本語に戻す
    await page.click('[data-testid="language-toggle-ja"]')

    // 日本語UIが表示されることを確認
    await expect(page.locator('text=AIニュースまとめ')).toBeVisible()
  })

  test('記事クリック時に外部リンクが開く', async ({ page }) => {
    await page.goto('/')

    // 新しいページが開かれることを監視
    const [newPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('[data-testid="news-item-test-1"]')
    ])

    // 正しいURLが開かれることを確認
    await expect(newPage).toHaveURL('https://example.com/article1')
  })

  test('レスポンシブデザインが正しく動作する', async ({ page }) => {
    // デスクトップサイズでテスト
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.goto('/')

    // デスクトップレイアウトが適用されることを確認
    await expect(page.locator('[data-testid="desktop-layout"]')).toBeVisible()

    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 })

    // モバイルレイアウトが適用されることを確認
    await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible()

    // ハンバーガーメニューが表示されることを確認
    await expect(page.locator('[data-testid="hamburger-menu"]')).toBeVisible()

    // ハンバーガーメニューをクリック
    await page.click('[data-testid="hamburger-menu"]')

    // ナビゲーションメニューが表示されることを確認
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()
  })

  test('エラー状態が適切に処理される', async ({ page }) => {
    // APIエラーをシミュレート
    await page.route('/data/news/latest.json', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    })

    await page.goto('/')

    // エラーメッセージが表示されることを確認
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('text=ニュースの読み込みに失敗しました')).toBeVisible()

    // リトライボタンが表示されることを確認
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
  })

  test('検索機能が正しく動作する', async ({ page }) => {
    await page.goto('/')

    // 検索ボックスに入力
    await page.fill('[data-testid="search-input"]', 'AI技術')

    // 検索ボタンをクリック
    await page.click('[data-testid="search-button"]')

    // 検索結果が表示されることを確認
    await expect(page.locator('text=AI技術の革新的進歩')).toBeVisible()
    await expect(page.locator('text=機械学習の医療応用')).not.toBeVisible()

    // 検索をクリア
    await page.click('[data-testid="clear-search"]')

    // 全ての記事が再び表示されることを確認
    await expect(page.locator('text=AI技術の革新的進歩')).toBeVisible()
    await expect(page.locator('text=機械学習の医療応用')).toBeVisible()
  })

  test('日付選択機能が正しく動作する', async ({ page }) => {
    // 過去の日付のデータをモック
    await page.route('/data/summaries/2024-08-30.json', async route => {
      const pastSummary = {
        ...mockDailySummary,
        date: '2024-08-30',
        summary_ja: '昨日はデータサイエンス関連の記事が多く投稿されました。'
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(pastSummary)
      })
    })

    await page.goto('/summary')

    // 日付選択ドロップダウンをクリック
    await page.click('[data-testid="date-selector"]')

    // 過去の日付を選択
    await page.click('[data-testid="date-option-2024-08-30"]')

    // 過去の日付のサマリーが表示されることを確認
    await expect(page.locator('text=2024年8月30日のまとめ')).toBeVisible()
    await expect(page.locator('text=昨日はデータサイエンス関連')).toBeVisible()
  })

  test('アクセシビリティが適切に実装されている', async ({ page }) => {
    await page.goto('/')

    // キーボードナビゲーションをテスト
    await page.keyboard.press('Tab')
    
    // フォーカスが最初の記事に移動することを確認
    await expect(page.locator('[data-testid="news-item-test-1"]')).toBeFocused()

    // Enterキーで記事を開く
    const [newPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.keyboard.press('Enter')
    ])

    await expect(newPage).toHaveURL('https://example.com/article1')

    // ARIA属性が正しく設定されていることを確認
    await expect(page.locator('[role="main"]')).toBeVisible()
    await expect(page.locator('[role="article"]')).toHaveCount(2)
    await expect(page.locator('[aria-label]')).toHaveCount.greaterThan(0)
  })

  test('パフォーマンスが適切である', async ({ page }) => {
    // パフォーマンス測定を開始
    await page.goto('/')

    // ページロード時間を測定
    const loadTime = await page.evaluate(() => {
      return performance.timing.loadEventEnd - performance.timing.navigationStart
    })

    // ページロード時間が3秒以内であることを確認
    expect(loadTime).toBeLessThan(3000)

    // 画像の遅延読み込みが動作することを確認
    await expect(page.locator('[data-testid="lazy-image"]')).toHaveAttribute('loading', 'lazy')
  })
})