var webpack = require('webpack');
var path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	devtool: 'source-map',
	devServer: {
		port: 8081.
		// disableHostCheck: true
	},
	entry: {
		'index': './src/scripts/index.js',
		'heatmap': './src/scripts/heatmap.js',
		'brushingAndLinking': './src/scripts/brushingAndLinking.js',
		// 'construction': './src/scripts/construction.js'
	},
	output: {
		publicPath: '/dist/',
		filename: '[name].bundle.js'
	},
	resolve: {
		extensions: ['', '.js']
	},
	module: {
		loaders: [{
			test: /\.(js)$/,
			loaders: ['babel-loader'],
			exclude: /node_modules/
		}, {
			test: /\.(less|css)$/,
			loader: 'style!css!less'
		}, {
			test: /\.(png|jpg|gif)$/,
			loader: 'url?limit=25000',
			include: [path.join(__dirname, 'static/images'), path.join(__dirname, 'src/less')]
		}, { test: /\.css$/, loader: 'style-loader!css-loader' },
		{ test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file" },
		{ test: /\.(woff|woff2)$/, loader:"url?prefix=font/&limit=5000" },
		{ test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/octet-stream" },
		{ test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=image/svg+xml" }]
	},
	plugins: [
		new webpack.ProvidePlugin({
			'jQuery': 'jquery',
			'$': 'jquery',
			'global.jQuery': 'jquery'
		}),
		new HtmlWebpackPlugin({
			inject: false,
			chunks: ['heatmap'],
			filename: './heatmap.html'
		}),
		new HtmlWebpackPlugin({
			inject: false,
			chunks: ['brushingAndLinking'],
			filename: './brushingAndLinking.html'
		}),
		// new HtmlWebpackPlugin({
		// 	inject: false,
		// 	chunks: ['construction'],
		// 	filename: './construction.html'
		// })
	],
	include: {
		test: /\.css$/,
		include: [
				path.resolve(__dirname, "not_exist_path")
		],
		loader: "style!css"
	}
};
