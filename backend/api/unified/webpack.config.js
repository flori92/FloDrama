const path = require('path');

module.exports = {
  entry: './flodrama-content-api.js',
  target: 'webworker',
  output: {
    filename: 'worker.js',
    path: path.join(__dirname, 'dist'),
  },
  mode: process.env.NODE_ENV || 'production',
  optimization: {
    usedExports: true,
  },
  performance: {
    hints: false,
  },
  resolve: {
    fallback: {
      fs: false,
      path: false,
    },
  },
};
