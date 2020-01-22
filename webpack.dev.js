/**
 * Webpack Development
 */
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = env => {
	return {
		entry: ['react-hot-loader/patch', `./src/index_dev.jsx`],
		output: {
			path: __dirname + '/dist/',
			filename: 'app.bundle.[name].js',
			sourceMapFilename: 'app.bundle.js.[name].map',
			publicPath: '/'
		},
		devServer: {
			contentBase: path.join(__dirname, 'dist/'),
			compress: false,
			port: 3001,
			proxy: {
				'/api/': 'http://localhost:3000/',
				'/news/': 'http://localhost:3000/'
			},
			overlay: {
				errors: true
			},
			host: 'localhost',
			disableHostCheck: true,
			historyApiFallback: true,
			hot: true
		},
		devtool: 'source-map',
		module: {
			rules: [{
					test: /(\.js$|\.jsx$)/,
					exclude: /(node_modules)/,
					use: {
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-env', '@babel/preset-react'],
							plugins: ['react-hot-loader/babel', 'react-loadable/babel', '@babel/plugin-syntax-dynamic-import']
						}
					}
				},
				{
					test: /\.html$/,
					use: {
						loader: 'html-loader',
						options: {}
					}
				},
				{
					test: /\.(css|scss|sass)$/,
					use: [
						"style-loader",
						"css-loader",
						"sass-loader"
					]
				},
				{
					test: /\.(svg|png|gif|jpg|jpeg)$/,
					use: {
						loader: 'file-loader',
						options: {
							outputPath: 'images',
							publicPath: '/images',
							name: '[name].[hash].[ext]'
						}
					}
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
			]
		},
		resolve: {
			alias: {
				'react-dom': '@hot-loader/react-dom',
			},
		},
		optimization: {
			minimize: env === 'production',
			minimizer: [
				new TerserPlugin({
					terserOptions: {
						output: {
							comments: false,
						},
					},
				})
			]
		},
		plugins: [
			new HtmlWebpackPlugin({
				template: "./src/template.html"
			}),
			new CopyPlugin([
				{ from: './content', to: 'content' },
				{ from: './public', to: '' },
			]),
		]
	};
};