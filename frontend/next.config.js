/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静的エクスポート設定
  output: 'export',
  trailingSlash: true,
  distDir: 'out',

  // 静的エクスポート用の設定
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',

  // 画像最適化設定
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // コンパイラ最適化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    styledComponents: true,
  },

  // 実験的機能
  experimental: {
    optimizeCss: process.env.NODE_ENV === 'production',
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
    // Vercel環境での追加最適化
    ...(process.env.VERCEL && {
      serverComponentsExternalPackages: ['sharp'],
    }),
  },

  // パフォーマンス最適化
  compress: true,
  poweredByHeader: false,

  // 静的エクスポートではheadersは使用できないため削除

  // Webpack設定の最適化
  webpack: (config, { dev, isServer }) => {
    // 本番環境での最適化
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }

    // バンドルサイズ分析
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      );
    }

    return config;
  },

  // 環境変数
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-news-aggregator.vercel.app',
  },

  // Vercel最適化は実験的機能に統合済み
}

module.exports = nextConfig