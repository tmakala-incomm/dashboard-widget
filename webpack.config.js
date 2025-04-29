// Node.js 'path' module provides utilities for working with file and directory paths.
const path = require('path');
// Webpack plugin to copy files or directories to the build directory.
const CopyPlugin = require('copy-webpack-plugin');

// Webpack configuration is exported as a function to access environment variables (env) and arguments (argv).
module.exports = (env, argv) => {
  const mode = argv.mode || 'development';
  const isProduction = mode === 'production';

  console.log(`Webpack building in ${mode} mode...`);

  // Return the configuration object
  return {
    // Entry points for the bundle. Webpack starts building the dependency graph from here.
    entry: {
      widget: './src/widget.js',
      configuration: './src/configuration.js'
    },
    // Configuration for the output bundles.
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].bundle.js',
      clean: true,
      libraryTarget: 'umd',
      publicPath: '',
      globalObject: 'this'
    },
    // How modules are resolved.
    resolve: {
      extensions: ['.js', '.html'],
      fallback: {
        "path": require.resolve("path-browserify"),
      }
    },
    module: {
      rules: []
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          // Copy all HTML files from 'src' directory to 'dist' directory
          { from: 'src/*.html', to: '[name][ext]' },
          // Copy image files to 'img' subdirectory
          { from: 'img/*', to: 'img/[name][ext]', noErrorOnMissing: true },
        ],
      }),
    ],
    mode: mode,
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    target: 'web',

    externals: {
      "vss-web-extension-sdk": "SDK",
      "TFS/VersionControl/GitRestClient": "TFS.VersionControl.GitRestClient",
      "TFS/VersionControl/Contracts": "TFS.VersionControl.Contracts",
      "VSS/Service": "VSS.Service",
    },

    performance: {
      hints: isProduction ? 'warning' : false,
    },
    optimization: {
      minimize: isProduction,
    },
  };
};
