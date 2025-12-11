const path = require('path');

module.exports = {
  mode: 'production',
  entry: './plugin.tsx',
  output: {
    path: path.resolve(__dirname),
    filename: 'plugin.js',
    library: 'Plugin',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }
};
