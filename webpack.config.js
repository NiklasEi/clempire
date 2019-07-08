var webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: ['babel-polyfill','./src/app.js'],
  output: {
    path: __dirname,
    filename: 'clempire.bundle.js',
    publicPath: ''
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
  optimization: {
    minimize: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Setting up webpack 4',
      template: 'index.html',
      inject: false,
      minify: {
        removeComments: false,
        collapseWhitespace: false
      }
    })
  ]
}
