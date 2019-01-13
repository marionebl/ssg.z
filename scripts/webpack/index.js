const path = require('path')

const webpack = require('webpack')
const WebpackBar = require('webpackbar')
const FixStyleOnlyEntriesPlugin = require('webpack-fix-style-only-entries')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const mdImages = require('../mdMods.js').mdImages

const dev = process.env.NODE_ENV == 'development'

const site = require(path.resolve('./content/data.json'))

var config = {
  entry: {
    // TODO: change to include a main requires which imports ALL html pages
    main: dev ? ['webpack/hot/dev-server', 'webpack-hot-middleware/client'] : [],
  },
  mode: process.env.NODE_ENV,
  watch: dev,
  context: path.resolve(__dirname, '../../src/'),
  output: {
    path: path.resolve(__dirname, '../../', dev ? './dist' : './build'),
    filename: dev ? '[name].js' : '[name].[contenthash].js',
  },
  devtool: dev ? 'source-map' : 'hidden-source-map',
  module: {
    rules: [
      {
        test: /\.(gif|png|jpe?g)$/,
        exclude: /node_modules/,
        use: [
          '../scripts/webpack/loaders/sqip-loader.js',
          {
            loader: 'url-loader',
            options: {
              fallback: {
                loader: 'responsive-loader',
                options: {
                  sizes: [300, 600, 1200, 2000],
                  name: 'images/[name]-[hash]-[width].[ext]',
                  format: 'png',
                  disable: dev,
                  adapter: require('responsive-loader/sharp'),
                },
              },
              limit: 40960,
            },
          },
        ],
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'eslint-loader',
            options: {
              failOnError: true,
            },
          },
          {
            loader: 'prettier-loader',
            options: {
              parser: 'babylon',
            },
          },
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        enforce: 'pre',
        test: /\.sss/,
        exclude: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
          'postcss-loader',
          {
            loader: 'prettier-loader',
            options: {
              parser: 'css',
            },
          },
        ],
      },
      {
        test: /\.html/,
        exclude: /node_modules/,
        use: [
          // TODO: change to save as per where required from - eliminates html-webpack-plugin, will need to return a link to emmited file
          // 'file-loader',
          // 'extract-loader',
          {
            loader: 'html-loader',
            options: {
              interpolate: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    ...(dev ? [new webpack.HotModuleReplacementPlugin()] : []),
    new WebpackBar(),
    new FixStyleOnlyEntriesPlugin({ extensions: ['sss', 'css'] }),
    new MiniCssExtractPlugin({
      filename: dev ? '[name].css' : '[name].[hash].css',
    }),
    new webpack.BannerPlugin(
      `[name]-[file]-[hash]-${new Date().toISOString().slice(0, 10)}\n Copyright ${site.siteName}`,
    ),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        styles: {
          name: 'styles.[hash].css',
          test: /\.css$/,
          chunks: 'all',
          enforce: true,
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
        },
      },
    },
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: true,
      }),
      new OptimizeCssAssetsPlugin({
        cssProcessorOptions: {},
        cssProcessorPluginOptions: {
          preset: ['default', { discardComments: { removeAll: true } }],
        },
        canPrint: true,
      }),
    ],
  },
  performance: {
    assetFilter: assetFilename => {
      return !/\.(map|gif|png|jpe?g)/.test(assetFilename)
    },
  },
}

module.exports = { config: config }
