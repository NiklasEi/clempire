const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: ['babel-polyfill','./src/app.js'],
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: 'clempire.bundle.js',
  },
  // devtool: 'source-map',
  devtool: false,
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/, '/clempire.bundle.*'],
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },

  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
    writeToDisk: true,
    open: true,
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'index.html',
        },
        {
          from: 'overlay.js',
        },
        {
          from: 'soundWorker.js',
        },
        {
          from: 'assets/**/*',
        },
      ],
    })],

  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        output: {
          comments: false,
        },
      },
      extractComments: false,
    })]
  },
}
