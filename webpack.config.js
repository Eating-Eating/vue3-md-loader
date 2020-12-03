const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/dist/plugin').default;
const WebpackBar = require('webpackbar');
const path = require('path');

module.exports = {
  mode:"development",
  entry: {
    app: './examples/index.js',
  },
  module: {
    rules: [
      {
        test: /\.(vue|md)$/,
        loader: 'vue-loader',
        exclude: /\.(en-US.md|zh-CN.md)$/,
      },
      {
        test: /\.(en-US.md|zh-CN.md)$/,
        use: ['vue-loader', { loader: path.resolve(__dirname, './md-demo/temp_try_3/origin-md-loader/core.js'),options:{raw:true,preventExtract: false} }],
      }
    ],
  },
  devServer: {
    historyApiFallback: true,
    hot: true,
    open: true,
    port:8001
  },
  devtool: 'eval-cheap-module-source-map',  
  resolve: {
    alias: {
      'vue': 'vue/dist/vue.esm-bundler.js'
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'examples/index.html',
      filename: 'index.html',
      inject: true,
    }),
    new VueLoaderPlugin(),
    new WebpackBar(),
  ],
}