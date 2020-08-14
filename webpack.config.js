const { resolve } = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  target: 'node',
  context: resolve(__dirname, 'src'),
  entry: {
    app: './app.js',
    monitor: './monitor.js',
  },
  output: {
//    filename: 'hotloader.js',
    filename: '[name].js',
    // the output bundle
    path: resolve(__dirname, 'dist'),
    publicPath: '/'
  },
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".ts", ".tsx", ".js", ".json"]
  },
  devServer: {
    host: '127.0.0.1',
    port: '8080',
    // Change it if other port needs to be used
    hot: false,
    // enable HMR on the server
    noInfo: true,
    quiet: false,
    // minimize the output to terminal.
    contentBase: resolve(__dirname, 'src'),
    // match the output path
    publicPath: '/',
    // match the output `publicPath`
    /*
    proxy: {
      '/**': {
        target: 'https://www.loft2rent.ru/',
        secure: false,
      }
    }
     */
  },
  module: {
  },
  plugins: [
  ],
};