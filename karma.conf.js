//this usually worked last time
let webpackConfig = require('./webpack.config.js');
webpackConfig.entry = null;

//setup some ENV variables
process.env.CHROME_BIN = require('puppeteer').executablePath();

// Karma configuration
// Generated on Thu Jun 20 2019 03:33:12 GMT+1000 (Australian Eastern Standard Time)

module.exports = function(config) {
	config.set({
		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: '',

		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: ['jasmine'],

		// list of files / patterns to load in the browser
		files: [
			'test/client/**/*_spec.js*'
		],

		// list of files / patterns to exclude
		exclude: [
		],

		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: {
			'test/client/**/*_spec.js*': ['coverage', 'webpack']
		},

		webpack: webpackConfig('testing'),

		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: ['progress', 'coverage'],

		// web server port
		port: 9876,

		// enable / disable colors in the output (reporters and logs)
		colors: true,

		//opera takes time to start up
//		captureTimeout: 60000, // it was already there
//		browserDisconnectTimeout: 60000,
//		browserDisconnectTolerance: 1,
//		browserNoActivityTimeout: 60000,

		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,

		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: false,

		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: ['ChromeHeadless', 'FirefoxHeadless', /* 'Edge' , 'Safari' , 'OperaCustom' */ ],

		//NOTE: karma-opera-launcher, karma-safari-launcher and karma-edge-launcher have been uninstalled since they're not being used

		customLaunchers: {
			FirefoxHeadless: {
				base: 'Firefox',
				flags: ['-headless']
			},
//			OperaCustom: {
//				base: 'Opera',
//				flags: ['--ran-launcher', '--headless']
//			}
		},

		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: true,

		// Concurrency level
		// how many browser should be started simultaneous
		concurrency: Infinity
	})
}
