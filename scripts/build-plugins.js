const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

/**
 * Build script for compiling external plugins
 */
function buildPlugin(pluginPath) {
  const manifestPath = path.join(pluginPath, 'manifest.json');
  const pluginFile = path.join(pluginPath, 'plugin.tsx');
  
  if (!fs.existsSync(manifestPath) || !fs.existsSync(pluginFile)) {
    console.error(`Invalid plugin structure in ${pluginPath}`);
    return false;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  const webpackConfig = {
    mode: 'production',
    entry: pluginFile,
    output: {
      path: pluginPath,
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
        }
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js']
    }
  };

  return new Promise((resolve, reject) => {
    webpack(webpackConfig, (err, stats) => {
      if (err || stats.hasErrors()) {
        console.error(`Failed to build plugin ${manifest.id}`);
        reject(err || stats.toJson().errors);
      } else {
        console.log(`Successfully built plugin ${manifest.id}`);
        resolve(true);
      }
    });
  });
}

async function buildAllPlugins() {
  const externalPluginsDir = path.join(__dirname, '..', 'example-plugins');
  
  if (!fs.existsSync(externalPluginsDir)) {
    console.log('No external plugins directory found');
    return;
  }

  const pluginDirs = fs.readdirSync(externalPluginsDir)
    .filter(dir => fs.statSync(path.join(externalPluginsDir, dir)).isDirectory());

  for (const dir of pluginDirs) {
    const pluginPath = path.join(externalPluginsDir, dir);
    try {
      await buildPlugin(pluginPath);
    } catch (error) {
      console.error(`Failed to build plugin in ${dir}:`, error);
    }
  }
}

if (require.main === module) {
  buildAllPlugins();
}

module.exports = { buildPlugin, buildAllPlugins };
