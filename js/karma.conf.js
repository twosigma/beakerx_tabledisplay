// var webpackConfig =  require('./webpack.config.js');
// var webpack = require('webpack');
// var path = require('path');
// const process = require('process');
process.env.LANGUAGE = 'en_US';
process.env.TZ = 'UTC';

module.exports = function(config) {
  config.set({
    browsers: ['ChromeHeadless'],
    frameworks: ['mocha', 'karma-typescript'],
    reporters: ['progress', 'coverage', 'karma-typescript'],
    files: [
      { pattern: 'src/**/*.ts' },
      { pattern: 'test/**/*.ts' },
    ],
    preprocessors: {
      'src/**/!(Sanitize).ts': ['karma-typescript', "coverage"],
      'src/**/Sanitize.ts': ['karma-typescript'],
      'test/**/*.ts': ['karma-typescript'],
    },
    karmaTypescriptConfig: {
      bundlerOptions: {
        transforms: [require("karma-typescript-es6-transform")()],
      }
    },
    // webpack: {
    //   mode: 'development',
    //   module: {
    //     rules: webpackConfig[2].module.rules.concat({
    //       test: /\.ts$/,
    //       use: 'ts-loader'
    //     }, {
    //       test: /\.ts$/,
    //       exclude: [ path.resolve(__dirname, "src", "test") ],
    //       enforce: 'post',
    //       use: {
    //         loader: 'istanbul-instrumenter-loader',
    //         options: { esModules: true }
    //       }
    //     })
    //   },
    //   devtool: "inline-source-map",
    //   resolve: {
    //     extensions: [".ts"],
    //   }
    // },
    // webpackMiddleware: {
    //   noInfo: true,
    // },
    // coverageIstanbulReporter: {
    //   reports: [ 'html', 'text-summary', 'lcovonly' ],
    //   dir: path.join(__dirname, 'coverage'),
    //   fixWebpackSourcePaths: true,
    //   'report-config': {
    //     html: { outdir: 'html' }
    //   }
    // },
    singleRun: true,
  });
};
