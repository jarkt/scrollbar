const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const isProd = process.argv.indexOf('-p') > -1;

const extractCss = new ExtractTextPlugin({
	filename: '[name].css',
	allChunks: true
});
const extractHtml = new ExtractTextPlugin({
	filename: 'demo.html'
});

const cfg = {
	context: path.resolve(__dirname, 'src'),
	resolve: {
		alias: {
			js: path.resolve(__dirname, 'src/js'),
			css: path.resolve(__dirname, 'src/css')
		}
	},
	entry: {
		scrolling: './index.js'
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].js',
		publicPath: path.resolve(__dirname, 'dist')
	},
	node: {
		global: !isProd,
		setImmediate: false
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: [{
					loader: 'babel-loader',
					options: {presets: ['env']}
				}]
			},
			{
				test: /\.css$/,
				use: extractCss.extract([
					{
						loader: 'css-loader',
						options: {
							importLoaders: 1,
							minimize: {safe: true}
						}
					},
					{
						loader: 'postcss-loader',
						options: {
							plugins: function() {
								return [
									require('postcss-import')(),
									require('postcss-cssnext')({
										features: {
											customProperties: {
												preserve: true,
												appendVariables: true
											}
										}
									})
								];
							}
						}
					}
				])
			},
			{
				test: /\.html$/,
				use: extractHtml.extract([{
					loader: 'html-loader',
					options: {
						// attrs: ['img:src', 'link:href'], // does not work?!
						minimize: true
					}
				}])
			}
		]
	},
	plugins: [
		extractCss,
		extractHtml
	],
	devtool: 'source-map'
};

module.exports = cfg;
