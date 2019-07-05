var webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
        entry: './app/audio.js'
    },
    output: {
        path: __dirname,
        filename: 'clempire.bundle.js',
        publicPath: ''
    },
    // module: {
    //   rules: [
    //     {
    //       test: /\.js$/,
    //       exclude: /node_modules/,
    //       use: {
    //         loader: "babel-loader"
    //       }
    //     }
    //   ]
    // },
    optimization: {
      minimize: true
    },  
    plugins: [
      new HtmlWebpackPlugin({
        title: 'Setting up webpack 4',
        template: 'index.html',
        inject: true,
        minify: {
          removeComments: true,
          collapseWhitespace: true
        },
      })
    ]
}