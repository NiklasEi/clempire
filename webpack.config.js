var webpack = require('webpack');
// const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  mode: 'development',
  entry: ['babel-polyfill','./src/app.js'],
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: 'clempire.bundle.js',
    publicPath: ''
  },
  devtool: 'source-map',
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
  watchOptions: {
    ignored: ['dist', 'node_modules', 'index.html']
  },
  optimization: {
    minimize: true
  },
  // plugins: [
  //   new HtmlWebpackPlugin({
  //     title: 'Setting up webpack 4',
  //     template: 'dist/index.html',
  //     inject: false,
  //     minify: {
  //       removeComments: false,
  //       collapseWhitespace: false
  //     }
  //   })
  // ]
}
