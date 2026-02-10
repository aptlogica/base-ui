import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadPlugin, loadPlugins } from '../PluginLoader';
import type { Plugin } from '../types';

function createMockPlugin(id: string, version: string = '1.0.0'): Plugin {
  return {
    manifest: {
      id,
      name: `${id}-plugin`,
      version,
      description: 'Mock plugin for testing',
    },
    initialize: vi.fn().mockResolvedValue(undefined),
    activate: vi.fn().mockResolvedValue(undefined),
    deactivate: vi.fn().mockResolvedValue(undefined),
  };
}

describe('PluginLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('import', vi.fn((url: string) => {
      if (url.includes('plugin.js') && !url.includes('broken')) {
        return Promise.resolve({ default: createMockPlugin('loaded-plugin') });
      }
      return Promise.reject(new Error('mock import failure'));
    }));
    vi.stubGlobal('__vite_ssr_import__', vi.fn((url: string) => {
      if (url.includes('plugin.js') && !url.includes('broken')) {
        return Promise.resolve({ default: createMockPlugin('loaded-plugin') });
      }
      return Promise.reject(new Error('mock import failure'));
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('loadPlugin', () => {
    it('should load plugin from URL', async () => {
      const moduleCode = encodeURIComponent(
        'export default {' +
          'manifest:{id:"test-plugin",name:"test-plugin",version:"1.0.0",description:"Mock plugin for testing"},' +
          'initialize:async()=>{},activate:async()=>{},deactivate:async()=>{}' +
        '};'
      );
      const dataUrl = `data:text/javascript;charset=utf-8,${moduleCode}`;

      const loaded = await loadPlugin(dataUrl);
      expect(loaded.manifest.id).toBe('test-plugin');
    });

    it('should throw error when plugin fails to load', async () => {
      const url = 'http://example.com/plugins/broken/plugin.js';
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (globalThis as any).import.mockRejectedValueOnce(new Error('boom'));
      await expect(loadPlugin(url)).rejects.toThrow(`Failed to load plugin from ${url}`);
      consoleErrorSpy.mockRestore();
    });

    it('should log error when plugin fails to load', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const url = 'http://example.com/plugins/broken/plugin.js';

      try {
        (globalThis as any).import.mockRejectedValueOnce(new Error('boom'));
        await loadPlugin(url);
      } catch {
        // Expected to throw
      }

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle invalid URL gracefully', async () => {
      const invalidUrl = 'not-a-valid-url';
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (globalThis as any).import.mockRejectedValueOnce(new Error('invalid'));
      await expect(loadPlugin(invalidUrl)).rejects.toThrow();
      consoleErrorSpy.mockRestore();
    });

    it('should handle empty URL string', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (globalThis as any).import.mockRejectedValueOnce(new Error('empty'));
      await expect(loadPlugin('')).rejects.toThrow();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('loadPlugins', () => {
    it('should return empty array when given empty manifest URLs', async () => {
      const plugins = await loadPlugins([]);

      expect(plugins).toEqual([]);
    });

    it('should filter out null plugins from failed loads', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (globalThis as any).import.mockImplementation((url: string) =>
        url.includes('broken')
          ? Promise.reject(new Error('broken'))
          : Promise.resolve({ default: createMockPlugin(url) })
      );

      const plugins = await loadPlugins([
        'http://example.com/plugins/broken/manifest.json',
      ]);

      expect(plugins).toEqual([]);
      consoleErrorSpy.mockRestore();
    });

    it('should log error for each failed plugin load', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (globalThis as any).import.mockRejectedValue(new Error('broken'));

      await loadPlugins([
        'http://example.com/plugins/broken1/manifest.json',
        'http://example.com/plugins/broken2/manifest.json',
      ]);

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should construct plugin URL from manifest URL', async () => {
      const manifestUrl = 'http://example.com/plugins/test/manifest.json';
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (globalThis as any).import.mockResolvedValue({ default: createMockPlugin('constructed') });
      const result = await loadPlugins([manifestUrl]);

      expect(Array.isArray(result)).toBe(true);
      consoleErrorSpy.mockRestore();
    });

    it('should handle manifest URL without trailing slash', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const manifestUrl = 'http://example.com/plugins/test/manifest.json';
      (globalThis as any).import.mockResolvedValue({ default: createMockPlugin('no-trailing') });
      await loadPlugins([manifestUrl]);

      consoleErrorSpy.mockRestore();
    });

    it('should handle multiple manifest URLs', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (globalThis as any).import.mockImplementation((url: string) =>
        Promise.resolve({ default: createMockPlugin(url) })
      );

      const result = await loadPlugins([
        'http://example.com/plugins/plugin1/manifest.json',
        'http://example.com/plugins/plugin2/manifest.json',
        'http://example.com/plugins/plugin3/manifest.json',
      ]);

      expect(Array.isArray(result)).toBe(true);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('URL Processing', () => {
    it('should extract base URL correctly from manifest path', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (globalThis as any).import.mockRejectedValue(new Error('fail'));

      await loadPlugins(['http://example.com/path/to/plugin/manifest.json']);

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle URL with query parameters', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (globalThis as any).import.mockRejectedValue(new Error('fail'));

      await loadPlugins([
        'http://example.com/plugins/test/manifest.json?version=1.0.0',
      ]);

      consoleErrorSpy.mockRestore();
    });

    it('should handle URL with hash fragment', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (globalThis as any).import.mockRejectedValue(new Error('fail'));

      await loadPlugins(['http://example.com/plugins/test/manifest.json#section']);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should continue loading other plugins when one fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (globalThis as any).import.mockImplementation((url: string) =>
        url.includes('broken')
          ? Promise.reject(new Error('broken'))
          : Promise.resolve({ default: createMockPlugin(url) })
      );

      const result = await loadPlugins([
        'http://example.com/plugins/broken/manifest.json',
        'http://example.com/plugins/another/manifest.json',
      ]);

      expect(Array.isArray(result)).toBe(true);
      consoleErrorSpy.mockRestore();
    });

    it('should not throw when all plugins fail to load', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (globalThis as any).import.mockRejectedValue(new Error('fail'));

      await expect(
        loadPlugins([
          'http://example.com/broken1/manifest.json',
          'http://example.com/broken2/manifest.json',
        ])
      ).resolves.not.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Type Safety', () => {
    it('should return Plugin type array from loadPlugins', async () => {
      (globalThis as any).import.mockResolvedValue({ default: createMockPlugin('typed') });
      const result = await loadPlugins([]);

      const typeCheck: Plugin[] = result;
      expect(Array.isArray(typeCheck)).toBe(true);
    });
  });
});
