const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/dist/plugin').default;
const WebpackBar = require('webpackbar');
const path = require('path');

export default{
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
        use: ['vue-loader', { loader: path.resolve(__dirname, './origin-md-loader/core.js'),options:{raw:true,preventExtract: false} }],
      }
    ],
  },
  devServer: {
    historyApiFallback: true,
    hot: true,
    open: true,
  },
  devtool: 'cheap-module-eval-source-map',
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