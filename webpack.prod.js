const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin');
const {
	CleanWebpackPlugin
} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CompressionWebpackPlugin = require('compression-webpack-plugin');


module.exports = env => {
	return {
		mode: 'production',
		entry: `./src/index${env === 'production' ? '' : '_dev'}.jsx`,
		output: {
			path: __dirname + '/dist/',
			filename: 'main.[contentHash].js',
			publicPath: '/'
		},
		module: {
			rules: [{
					test: /\.(js|jsx)$/,
					exclude: /(node_modules)/,
					use: {
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-env', '@babel/preset-react'],
							plugins: ['react-loadable/babel', '@babel/plugin-syntax-dynamic-import']
						}
					}
				},
				{
					test: /\.(css|scss|sass)$/,
					use: [
						MiniCssExtractPlugin.loader,
						"css-loader",
						"sass-loader"
					]
				},
				{
					test: /\.(svg|png|gif|jpg|jpeg)$/,
					use: [{
							loader: 'file-loader',
							options: {
								outputPath: 'images',
								publicPath: '/images',
								name: '[name].[hash].[ext]'
							}
						},
						{
							loader: 'image-webpack-loader',
							options: {
								mozjpeg: {
									progressive: true,
									quality: 65
								},
								// optipng.enabled: false will disable optipng
								optipng: {
									enabled: false,
								},
								pngquant: {
									quality: [0.65, 0.90],
									speed: 4
								},
								gifsicle: {
									interlaced: false,
								},
								// the webp option will enable WEBP
								webp: {
									quality: 75
								}
							}
						},
					]
				},
				{
					test: /\.(md)$/,
					use: {
						loader: 'file-loader',
						options: {
							outputPath: 'content',
							publicPath: '/content',
							name: '[name].[hash].[ext]'
						}
					}
				}
			],

		},
		optimization: {
			minimize: true,
			minimizer: [
				new TerserPlugin({
					terserOptions: {
						output: {
							comments: false,
						},
					},
				}),
				new HtmlWebpackPlugin({
					template: "./src/template.html",
					minify: {
						collapseWhitespace: true,
						removeComments: true,
						removeAttributeQuotes: true
					}
				}),
			]
		},
		plugins: [
			new CleanWebpackPlugin(),
			new MiniCssExtractPlugin({
				filename: "[name].[contentHash].css"
			}),
			new CompressionWebpackPlugin({
				compressionOptions: {
					level: 9,
				},
				threshold: 1
			}),
			new CopyPlugin([
				{ from: './content', to: 'content' },
				{ from: './public', to: '' },
			]),
		]
	};
};