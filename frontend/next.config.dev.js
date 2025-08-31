/** @type {import('next').NextConfig} */
const nextConfig = {
  // 開発環境では静的エクスポートを無効化
  // output: 'export',
  trailingSlash: true,
  
  // 画像最適化設定（開発環境では簡素化）
  images: { 
    unoptimized: true,
  },
  
  // コンパイラ最適化（開発環境では無効化）
  compiler: {
    removeConsole: false,
    styledComponents: true,
  },
  
  // 実験的機能（開発環境では無効化）
  experimental: {
    optimizeCss: false,
    optimizePackageImports: [],
  },
  
  // パフォーマンス最適化（開発環境では無効化）
  compress: false,
  poweredByHeader: false,
  
  // セキュリティヘッダー（開発環境では簡素化）
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          }
        ]
      }
    ];
  },
  
  // Webpack設定（開発環境では簡素化）
  webpack: (config, { dev, isServer }) => {
    return config;
  },
  
  // 環境変数
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  }
}

module.exports = nextConfig