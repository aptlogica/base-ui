import { describe, it, expect, beforeEach, vi } from 'vitest';
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

describe('PluginRegistry', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  describe('registerPlugin', () => {
    it('should register a plugin and expose it via getRegisteredPlugins', async () => {
      const { registerPlugin, getRegisteredPlugins } = await import('../PluginRegistry');
      const plugin = createMockPlugin('plugin-a');

      registerPlugin(plugin);

      const list = getRegisteredPlugins();
      expect(list).toHaveLength(1);
      expect(list[0]).toBe(plugin);
    });

    it('should not register duplicate plugin with same id', async () => {
      const { registerPlugin, getRegisteredPlugins } = await import('../PluginRegistry');
      const plugin1 = createMockPlugin('plugin-a');
      const plugin2 = createMockPlugin('plugin-a');

      registerPlugin(plugin1);
      registerPlugin(plugin2);

      const list = getRegisteredPlugins();
      expect(list).toHaveLength(1);
      expect(list[0]).toBe(plugin1);
    });

    it('should register multiple plugins with different ids', async () => {
      const { registerPlugin, getRegisteredPlugins } = await import('../PluginRegistry');
      const pluginA = createMockPlugin('plugin-a');
      const pluginB = createMockPlugin('plugin-b');

      registerPlugin(pluginA);
      registerPlugin(pluginB);

      const list = getRegisteredPlugins();
      expect(list).toHaveLength(2);
      expect(list).toContain(pluginA);
      expect(list).toContain(pluginB);
    });

    it('should do nothing when registering same plugin instance twice', async () => {
      const { registerPlugin, getRegisteredPlugins } = await import('../PluginRegistry');
      const plugin = createMockPlugin('plugin-a');

      registerPlugin(plugin);
      registerPlugin(plugin);

      const list = getRegisteredPlugins();
      expect(list).toHaveLength(1);
    });
  });

  describe('getRegisteredPlugins', () => {
    it('should return empty array when no plugins registered', async () => {
      const { getRegisteredPlugins } = await import('../PluginRegistry');

      const list = getRegisteredPlugins();

      expect(list).toEqual([]);
    });

    it('should return plugins in registration order', async () => {
      const { registerPlugin, getRegisteredPlugins } = await import('../PluginRegistry');
      const plugin1 = createMockPlugin('plugin-1');
      const plugin2 = createMockPlugin('plugin-2');
      const plugin3 = createMockPlugin('plugin-3');

      registerPlugin(plugin1);
      registerPlugin(plugin2);
      registerPlugin(plugin3);

      const list = getRegisteredPlugins();

      expect(list[0]).toBe(plugin1);
      expect(list[1]).toBe(plugin2);
      expect(list[2]).toBe(plugin3);
    });

    it('should return a new array each time', async () => {
      const { registerPlugin, getRegisteredPlugins } = await import('../PluginRegistry');
      registerPlugin(createMockPlugin('plugin-a'));

      const list1 = getRegisteredPlugins();
      const list2 = getRegisteredPlugins();

      expect(list1).not.toBe(list2);
      expect(list1).toEqual(list2);
    });
  });

  describe('Singleton behavior', () => {
    it('should use same registry instance for registerPlugin and getRegisteredPlugins', async () => {
      const { registerPlugin, getRegisteredPlugins } = await import('../PluginRegistry');
      const plugin = createMockPlugin('plugin-a');

      registerPlugin(plugin);

      expect(getRegisteredPlugins()).toContain(plugin);
    });
  });

  describe('Edge cases', () => {
    it('should handle plugin with minimal manifest', async () => {
      const { registerPlugin, getRegisteredPlugins } = await import('../PluginRegistry');
      const plugin: Plugin = {
        manifest: {
          id: 'minimal',
          name: 'Minimal',
          version: '0.0.1',
        },
        initialize: vi.fn(),
      };

      registerPlugin(plugin);

      const list = getRegisteredPlugins();
      expect(list).toHaveLength(1);
      expect(list[0].manifest.id).toBe('minimal');
    });

    it('should handle plugin with optional manifest fields', async () => {
      const { registerPlugin, getRegisteredPlugins } = await import('../PluginRegistry');
      const plugin: Plugin = {
        manifest: {
          id: 'full',
          name: 'Full',
          version: '1.0.0',
          description: 'Desc',
          author: 'Author',
          dependencies: { dep: '1.0.0' },
        },
        initialize: vi.fn(),
        activate: vi.fn(),
        deactivate: vi.fn(),
      };

      registerPlugin(plugin);

      const list = getRegisteredPlugins();
      expect(list[0].manifest.description).toBe('Desc');
      expect(list[0].manifest.dependencies).toEqual({ dep: '1.0.0' });
    });

    it('should isolate state after vi.resetModules', async () => {
      const mod1 = await import('../PluginRegistry');
      mod1.registerPlugin(createMockPlugin('plugin-a'));
      expect(mod1.getRegisteredPlugins()).toHaveLength(1);

      vi.resetModules();

      const mod2 = await import('../PluginRegistry');
      expect(mod2.getRegisteredPlugins()).toHaveLength(0);
    });
  });
});
