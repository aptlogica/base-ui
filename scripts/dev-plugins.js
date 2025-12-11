const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');

/**
 * Development server for serving plugins with hot reload
 */
function startPluginDevServer(port = 3001) {
  const app = express();
  
  // Enable CORS for plugin loading
  app.use((req, res, next) => {
    console.log(req,res,next)
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  // Serve static plugin files
  const pluginsDir = path.join(__dirname, '..', 'example-plugins');
  app.use('/plugins', express.static(pluginsDir));

  // API endpoint to list available plugins
  app.get('/api/plugins', (req, res) => {
    const plugins = [];
    
    if (fs.existsSync(pluginsDir)) {
      const pluginDirs = fs.readdirSync(pluginsDir)
        .filter(dir => fs.statSync(path.join(pluginsDir, dir)).isDirectory());

      for (const dir of pluginDirs) {
        const manifestPath = path.join(pluginsDir, dir, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          plugins.push({
            ...manifest,
            manifestUrl: `http://localhost:${port}/plugins/${dir}/manifest.json`,
            pluginUrl: `http://localhost:${port}/plugins/${dir}/plugin.js`
          });
        }
      }
    }

    res.json({ plugins });
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const server = app.listen(port, () => {
    console.log(`Plugin development server running on http://localhost:${port}`);
    console.log(`Available endpoints:`);
    console.log(`  - GET /api/plugins - List available plugins`);
    console.log(`  - GET /plugins/{plugin-id}/manifest.json - Plugin manifest`);
    console.log(`  - GET /plugins/{plugin-id}/plugin.js - Plugin code`);
  });

  return server;
}

if (require.main === module) {
  startPluginDevServer();
}

module.exports = { startPluginDevServer };
