const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin');
const {
	CleanWebpackPlugin
} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CompressionWebpackPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const purgecss = require('@fullhuman/postcss-purgecss')({
	content: [
		'./src/**/*.html',
		'./src/**/*.jsx',
	],
	defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
	// Choose what to keep
	// whitelist: ['btn', 'h1','h2','h3', 'p','ol','li', 'ul', 'em'], // Ignore buttons and typography
	// whitelistPatterns: [/btn-/]
})



module.exports = env => {
	return {
		mode: 'production',
		entry: {
			main: `./src/index.jsx`,
			vendor: ['axios', 'markdown-to-jsx']
		},
		output: {
			path: __dirname + '/dist/',
			filename: 'main.[contentHash].js',
			publicPath: '/'
		},
		resolve: {
			alias: {
				'react': 'preact/compat',
				'react-dom': 'preact/compat',
			},
		},
		module: {
			rules: [{
				test: /\.(js|jsx)$/,
				exclude: /(node_modules)/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env'],
						plugins: [
							['transform-react-jsx', {
								'pragma': 'h'
							}], '@babel/plugin-syntax-dynamic-import'
						]
					}
				}
			},
			{
				test: /\.(css)$/,
				use: [
					MiniCssExtractPlugin.loader,
					"css-loader",
					{
						loader: 'postcss-loader',
						options: {
							// parser: 'sugarss',
							plugins: (loader) => [
								require('postcss-import')({
									root: loader.resourcePath
								}),
								require('postcss-preset-env')(),
								require('cssnano')(),
								require('tailwindcss'),
								purgecss
							]
						}
					}
				]
			},
			{
				test: /\.(png|gif|jpg|jpeg)$/,
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
				use: [{
					loader: "html-loader"
				},
				{
					loader: "markdown-loader",
					options: {}
				}
				],
			},
			{
				test: /\.svg$/,
				loader: 'svg-inline-loader'
			}
			],

		},
		optimization: {
			minimize: true,
			usedExports: true,
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
			],
			splitChunks: {
				cacheGroups: {
					vendor: {
						chunks: 'initial',
						test: 'vendor',
						name: 'vendor',
						enforce: true
					}
				}
			}
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
			new CompressionWebpackPlugin({ // Brotli
				filename: '[path].br[query]',
				algorithm: 'brotliCompress',
				test: /\.(js|css|html|svg)$/,
				compressionOptions: {
					level: 11
				},
				threshold: 1,
				minRatio: 0.9,
				deleteOriginalAssets: false,
			}),
			new CopyPlugin({
				patterns: [{
					from: './content',
					to: 'content'
				}, {
					from: './public',
					to: './'
				}]
			}),
			// new BundleAnalyzerPlugin()
		]
	};
};