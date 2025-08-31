/**
 * Webpack設定の最適化
 */

const path = require('path');

module.exports = {
  // バンドル分析用の設定
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  
  // 最適化設定
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // ベンダーライブラリを分離
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        // React関連を分離
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
        },
        // Next.js関連を分離
        nextjs: {
          test: /[\\/]node_modules[\\/]next[\\/]/,
          name: 'nextjs',
          chunks: 'all',
          priority: 15,
        },
        // 共通コンポーネントを分離
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    // 実行時チャンクを分離
    runtimeChunk: {
      name: 'runtime',
    },
  },
  
  // モジュール設定
  module: {
    rules: [
      // TypeScript/JavaScript最適化
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { 
                targets: '> 0.25%, not dead',
                useBuiltIns: 'usage',
                corejs: 3
              }],
              '@babel/preset-react',
              '@babel/preset-typescript'
            ],
            plugins: [
              // 動的インポートの最適化
              '@babel/plugin-syntax-dynamic-import',
              // Tree shaking最適化
              ['babel-plugin-transform-imports', {
                'lodash': {
                  'transform': 'lodash/${member}',
                  'preventFullImport': true
                }
              }]
            ]
          }
        }
      },
      
      // CSS最適化
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: {
                auto: true,
                localIdentName: '[name]__[local]--[hash:base64:5]'
              }
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  'tailwindcss',
                  'autoprefixer',
                  // CSS最適化
                  ['cssnano', {
                    preset: ['default', {
                      discardComments: { removeAll: true },
                      normalizeWhitespace: true,
                      minifySelectors: true
                    }]
                  }]
                ]
              }
            }
          }
        ]
      },
      
      // 画像最適化
      {
        test: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 8KB以下はインライン化
          },
        },
        generator: {
          filename: 'static/images/[name].[hash:8][ext]',
        },
        use: [
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
                quality: 80,
              },
              optipng: {
                enabled: false,
              },
              pngquant: {
                quality: [0.65, 0.90],
                speed: 4,
              },
              gifsicle: {
                interlaced: false,
              },
              webp: {
                quality: 80,
              },
            },
          },
        ],
      },
      
      // フォント最適化
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/fonts/[name].[hash:8][ext]',
        },
      },
    ],
  },
  
  // プラグイン設定
  plugins: [
    // バンドル分析（環境変数で制御）
    ...(process.env.ANALYZE === 'true' ? [
      new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)({
        analyzerMode: 'static',
        openAnalyzer: false,
        reportFilename: 'bundle-report.html',
      })
    ] : []),
    
    // 重複モジュールの除去
    new (require('webpack').optimize.DedupePlugin || function() {})(),
    
    // 圧縮設定
    ...(process.env.NODE_ENV === 'production' ? [
      new (require('compression-webpack-plugin'))({
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8,
      }),
      new (require('compression-webpack-plugin'))({
        algorithm: 'brotliCompress',
        test: /\.(js|css|html|svg)$/,
        compressionOptions: {
          level: 11,
        },
        threshold: 8192,
        minRatio: 0.8,
        filename: '[path][base].br',
      })
    ] : [])
  ],
  
  // 開発サーバー設定
  devServer: {
    compress: true,
    hot: true,
    historyApiFallback: true,
  },
  
  // パフォーマンス設定
  performance: {
    maxAssetSize: 250000,
    maxEntrypointSize: 250000,
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
  },
};