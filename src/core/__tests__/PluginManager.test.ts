import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PluginManagerImpl } from '../PluginManager';
import { Plugin, PluginAPI } from '../types';

/**
 * Helper function to create a mock plugin
 */
function createMockPlugin(
  id: string,
  version: string = '1.0.0',
  dependencies?: Record<string, string>,
  options?: Partial<Plugin>
): Plugin {
  return {
    manifest: {
      id,
      name: `${id}-plugin`,
      version,
      description: `Mock plugin for testing`,
      dependencies,
    },
    initialize: vi.fn().mockResolvedValue(undefined),
    activate: vi.fn().mockResolvedValue(undefined),
    deactivate: vi.fn().mockResolvedValue(undefined),
    onConfigurationUpdate: vi.fn().mockResolvedValue(undefined),
    ...options,
  };
}

/**
 * Comprehensive unit test suite for PluginManager.ts
 * Tests cover registration, loading, unloading, dependencies, configuration,
 * extensions, services, and event subscriptions.
 */

describe('PluginManager', () => {
  let pluginManager: PluginManagerImpl;

  beforeEach(() => {
    pluginManager = new PluginManagerImpl();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==================== Plugin Registration Tests ====================

  describe('register', () => {
    it('should register a plugin successfully', () => {
      const plugin = createMockPlugin('plugin-a');

      pluginManager.register(plugin);

      expect(pluginManager.getPlugin('plugin-a')).toBe(plugin);
    });

    it('should throw error when registering duplicate plugin', () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      expect(() => {
        pluginManager.register(plugin);
      }).toThrow(`Plugin plugin-a is already registered`);
    });

    it('should initialize plugin config with defaults from constructor', () => {
      const defaultConfig = {
        'plugin-a': { setting1: 'value1' },
      };
      pluginManager = new PluginManagerImpl(defaultConfig);
      const plugin = createMockPlugin('plugin-a');

      pluginManager.register(plugin);

      expect(pluginManager.getPluginConfig('plugin-a')).toEqual({
        setting1: 'value1',
      });
    });

    it('should initialize plugin config as empty object if no defaults', () => {
      const plugin = createMockPlugin('plugin-a');

      pluginManager.register(plugin);

      expect(pluginManager.getPluginConfig('plugin-a')).toEqual({});
    });

    it('should register multiple plugins without conflict', () => {
      const pluginA = createMockPlugin('plugin-a');
      const pluginB = createMockPlugin('plugin-b');

      pluginManager.register(pluginA);
      pluginManager.register(pluginB);

      expect(pluginManager.getPlugin('plugin-a')).toBe(pluginA);
      expect(pluginManager.getPlugin('plugin-b')).toBe(pluginB);
    });
  });

  // ==================== Plugin Loading Tests ====================

  describe('load', () => {
    it('should load a simple plugin successfully', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      await pluginManager.load('plugin-a');

      expect(plugin.initialize).toHaveBeenCalled();
      expect(plugin.activate).toHaveBeenCalled();
    });

    it('should throw error when loading unregistered plugin', async () => {
      await expect(pluginManager.load('non-existent')).rejects.toThrow(
        'Plugin non-existent is not registered'
      );
    });

    it('should not load plugin twice', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      await pluginManager.load('plugin-a');
      await pluginManager.load('plugin-a');

      expect(plugin.initialize).toHaveBeenCalledTimes(1);
    });

    it('should call initialize with correct API and config', async () => {
      const plugin = createMockPlugin('plugin-a');
      const config = { key: 'value' };
      pluginManager.register(plugin);
      pluginManager.setPluginConfig('plugin-a', config);

      await pluginManager.load('plugin-a');

      expect(plugin.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          registerExtensionPoint: expect.any(Function),
          registerExtension: expect.any(Function),
          getPlugin: expect.any(Function),
          getPluginConfig: expect.any(Function),
          getService: expect.any(Function),
          registerService: expect.any(Function),
        }),
        config
      );
    });

    it('should load plugin dependencies before main plugin', async () => {
      const callOrder: string[] = [];

      const depPlugin = createMockPlugin('dep-plugin', '1.0.0', undefined, {
        initialize: vi.fn().mockImplementation(() => {
          callOrder.push('dep-plugin');
        }),
      });

      const mainPlugin = createMockPlugin('main-plugin', '1.0.0', {
        'dep-plugin': '1.0.0',
      });
      mainPlugin.initialize = vi.fn().mockImplementation(() => {
        callOrder.push('main-plugin');
      });

      pluginManager.register(depPlugin);
      pluginManager.register(mainPlugin);

      await pluginManager.load('main-plugin');

      expect(callOrder).toEqual(['dep-plugin', 'main-plugin']);
    });

    it('should handle transitive dependencies correctly', async () => {
      const callOrder: string[] = [];

      const basePlugin = createMockPlugin('base-plugin', '1.0.0', undefined, {
        initialize: vi.fn().mockImplementation(() => {
          callOrder.push('base-plugin');
        }),
      });

      const midPlugin = createMockPlugin('mid-plugin', '1.0.0', {
        'base-plugin': '1.0.0',
      });
      midPlugin.initialize = vi.fn().mockImplementation(() => {
        callOrder.push('mid-plugin');
      });

      const topPlugin = createMockPlugin('top-plugin', '1.0.0', {
        'mid-plugin': '1.0.0',
      });
      topPlugin.initialize = vi.fn().mockImplementation(() => {
        callOrder.push('top-plugin');
      });

      pluginManager.register(basePlugin);
      pluginManager.register(midPlugin);
      pluginManager.register(topPlugin);

      await pluginManager.load('top-plugin');

      expect(callOrder).toEqual(['base-plugin', 'mid-plugin', 'top-plugin']);
    });

    it('should throw error if plugin has missing dependency', async () => {
      const plugin = createMockPlugin('plugin-a', '1.0.0', {
        'missing-plugin': '1.0.0',
      });
      pluginManager.register(plugin);

      await expect(pluginManager.load('plugin-a')).rejects.toThrow(
        'Failed to resolve dependencies for plugin plugin-a'
      );
    });

    it('should throw error if dependency version does not match', async () => {
      const depPlugin = createMockPlugin('dep-plugin', '1.0.0');
      const plugin = createMockPlugin('plugin-a', '1.0.0', {
        'dep-plugin': '^2.0.0',
      });

      pluginManager.register(depPlugin);
      pluginManager.register(plugin);

      await expect(pluginManager.load('plugin-a')).rejects.toThrow(
        /Failed to resolve dependencies/
      );
    });

    it('should not call activate if plugin does not have activate method', async () => {
      const plugin = createMockPlugin('plugin-a');
      delete plugin.activate;
      pluginManager.register(plugin);

      await pluginManager.load('plugin-a');

      expect(plugin.initialize).toHaveBeenCalled();
    });

    it('should call getExtensions in load to verify extension point handling', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      await pluginManager.load('plugin-a');

      // After load, we should be able to retrieve extensions
      const extensions = pluginManager.getExtensions('layout:header');
      expect(Array.isArray(extensions)).toBe(true);
    });
  });

  // ==================== Plugin Unloading Tests ====================

  describe('unload', () => {
    it('should unload a loaded plugin successfully', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);
      await pluginManager.load('plugin-a');

      await pluginManager.unload('plugin-a');

      expect(plugin.deactivate).toHaveBeenCalled();
    });

    it('should do nothing when unloading unloaded plugin', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      await expect(pluginManager.unload('plugin-a')).resolves.not.toThrow();
      expect(plugin.deactivate).not.toHaveBeenCalled();
    });

    it('should throw error when unloading plugin with dependents', async () => {
      const depPlugin = createMockPlugin('dep-plugin', '1.0.0');
      const plugin = createMockPlugin('main-plugin', '1.0.0', {
        'dep-plugin': '1.0.0',
      });

      pluginManager.register(depPlugin);
      pluginManager.register(plugin);
      await pluginManager.load('main-plugin');

      await expect(pluginManager.unload('dep-plugin')).rejects.toThrow(
        'Cannot unload plugin dep-plugin because plugin main-plugin depends on it'
      );
    });

    it('should remove extensions provided by unloaded plugin', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);
      await pluginManager.load('plugin-a');

      // Register an extension from the plugin
      const extensions = pluginManager['extensions'].get('layout:header');
      if (extensions) {
        extensions.push({ id: 'ext-1', component: 'Test', _pluginId: 'plugin-a' });
      } else {
        pluginManager['extensions'].set('layout:header', [
          { id: 'ext-1', component: 'Test', _pluginId: 'plugin-a' },
        ]);
      }

      await pluginManager.unload('plugin-a');

      const remainingExtensions = pluginManager.getExtensions('layout:header');
      expect(remainingExtensions.length).toBe(0);
    });

    it('should remove extension points provided by unloaded plugin', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      let capturedApi: PluginAPI | null = null;
      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        capturedApi = api;
      });

      await pluginManager.load('plugin-a');

      const api = capturedApi as unknown as PluginAPI;
      api.registerExtensionPoint('plugin-a:custom-point', {
        description: 'Custom extension point',
      });

      await pluginManager.unload('plugin-a');

      // The implementation removes extension points created by the plugin on unload
      expect(pluginManager['extensionPoints'].has('plugin-a:custom-point')).toBe(
        false
      );
    });

    it('should not call deactivate if plugin does not have deactivate method', async () => {
      const plugin = createMockPlugin('plugin-a');
      delete plugin.deactivate;
      pluginManager.register(plugin);
      await pluginManager.load('plugin-a');

      await expect(pluginManager.unload('plugin-a')).resolves.not.toThrow();
    });
  });

  // ==================== Plugin Retrieval Tests ====================

  describe('getPlugin', () => {
    it('should return registered plugin', () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      expect(pluginManager.getPlugin('plugin-a')).toBe(plugin);
    });

    it('should return null for unregistered plugin', () => {
      expect(pluginManager.getPlugin('non-existent')).toBeNull();
    });
  });

  describe('getLoadedPlugins', () => {
    it('should return empty array initially', () => {
      expect(pluginManager.getLoadedPlugins()).toEqual([]);
    });

    it('should return loaded plugins only', async () => {
      const pluginA = createMockPlugin('plugin-a');
      const pluginB = createMockPlugin('plugin-b');
      pluginManager.register(pluginA);
      pluginManager.register(pluginB);

      await pluginManager.load('plugin-a');

      const loaded = pluginManager.getLoadedPlugins();
      expect(loaded).toHaveLength(1);
      expect(loaded[0]).toBe(pluginA);
    });

    it('should return all loaded plugins', async () => {
      const pluginA = createMockPlugin('plugin-a');
      const pluginB = createMockPlugin('plugin-b');
      pluginManager.register(pluginA);
      pluginManager.register(pluginB);

      await pluginManager.load('plugin-a');
      await pluginManager.load('plugin-b');

      const loaded = pluginManager.getLoadedPlugins();
      expect(loaded).toHaveLength(2);
      expect(loaded).toContain(pluginA);
      expect(loaded).toContain(pluginB);
    });
  });

  // ==================== Dependency Resolution Tests ====================

  describe('resolvePluginDependencies', () => {
    it('should resolve plugin with no dependencies', () => {
      const plugin = createMockPlugin('plugin-a');
      const result = pluginManager.resolvePluginDependencies(plugin);

      expect(result).toBe(true);
    });

    it('should resolve plugin with satisfied dependencies', () => {
      const depPlugin = createMockPlugin('dep-plugin', '1.5.0');
      pluginManager.register(depPlugin);

      const plugin = createMockPlugin('plugin-a', '1.0.0', {
        'dep-plugin': '^1.0.0',
      });

      const result = pluginManager.resolvePluginDependencies(plugin);
      expect(result).toBe(true);
    });

    it('should fail for missing dependency', () => {
      const plugin = createMockPlugin('plugin-a', '1.0.0', {
        'missing-dep': '1.0.0',
      });

      const result = pluginManager.resolvePluginDependencies(plugin);
      expect(result).toBe(false);
    });

    it('should fail for unsatisfied version dependency', () => {
      const depPlugin = createMockPlugin('dep-plugin', '1.0.0');
      pluginManager.register(depPlugin);

      const plugin = createMockPlugin('plugin-a', '1.0.0', {
        'dep-plugin': '^2.0.0',
      });

      const result = pluginManager.resolvePluginDependencies(plugin);
      expect(result).toBe(false);
    });

    it('should resolve multiple dependencies', () => {
      const dep1 = createMockPlugin('dep-1', '1.0.0');
      const dep2 = createMockPlugin('dep-2', '2.0.0');
      pluginManager.register(dep1);
      pluginManager.register(dep2);

      const plugin = createMockPlugin('plugin-a', '1.0.0', {
        'dep-1': '^1.0.0',
        'dep-2': '^2.0.0',
      });

      const result = pluginManager.resolvePluginDependencies(plugin);
      expect(result).toBe(true);
    });
  });

  // ==================== Plugin Compatibility Tests ====================

  describe('validatePluginCompatibility', () => {
    it('should validate plugin without framework version requirement', () => {
      const plugin = createMockPlugin('plugin-a');

      const result = pluginManager.validatePluginCompatibility(plugin);
      expect(result).toBe(true);
    });

    it('should validate plugin with compatible framework version', () => {
      const plugin = createMockPlugin('plugin-a');
      (plugin.manifest as any).frameworkVersion = '1.0.0';

      const result = pluginManager.validatePluginCompatibility(plugin);
      expect(result).toBe(true);
    });

    it('should fail for incompatible framework version', () => {
      const plugin = createMockPlugin('plugin-a');
      (plugin.manifest as any).frameworkVersion = '2.0.0';

      const result = pluginManager.validatePluginCompatibility(plugin);
      expect(result).toBe(false);
    });
  });

  // ==================== Configuration Management Tests ====================

  describe('setPluginConfig', () => {
    it('should set plugin configuration', () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);
      const newConfig = { setting: 'value' };

      pluginManager.setPluginConfig('plugin-a', newConfig);

      expect(pluginManager.getPluginConfig('plugin-a')).toEqual(newConfig);
    });

    it('should notify plugin-specific config listeners', () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);
      const listener = vi.fn();

      pluginManager.subscribeToPluginConfig?.('plugin-a', listener);
      pluginManager.setPluginConfig('plugin-a', { key: 'newValue' });

      expect(listener).toHaveBeenCalledWith({ key: 'newValue' });
    });

    it('should notify global config listeners', () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);
      const listener = vi.fn();

      pluginManager.subscribeToAllConfigChanges?.(listener);
      pluginManager.setPluginConfig('plugin-a', { key: 'newValue' });

      expect(listener).toHaveBeenCalledWith('plugin-a', { key: 'newValue' });
    });

    it('should update configuration for loaded plugin if has onConfigurationUpdate', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);
      await pluginManager.load('plugin-a');

      pluginManager.setPluginConfig('plugin-a', { key: 'newValue' });

      expect(plugin.onConfigurationUpdate).toHaveBeenCalledWith(
        { key: 'newValue' },
        {}
      );
    });

    it('should handle multiple config changes sequentially', () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      pluginManager.setPluginConfig('plugin-a', { v: 1 });
      pluginManager.setPluginConfig('plugin-a', { v: 2 });
      pluginManager.setPluginConfig('plugin-a', { v: 3 });

      expect(pluginManager.getPluginConfig('plugin-a')).toEqual({ v: 3 });
    });
  });

  describe('getPluginConfig', () => {
    it('should return empty object for unconfigured plugin', () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      expect(pluginManager.getPluginConfig('plugin-a')).toEqual({});
    });

    it('should return set configuration', () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);
      const config = { key: 'value', nested: { prop: 123 } };

      pluginManager.setPluginConfig('plugin-a', config);

      expect(pluginManager.getPluginConfig('plugin-a')).toEqual(config);
    });

    it('should return configuration from constructor defaults', () => {
      const defaults = { 'plugin-a': { fromDefault: true } };
      pluginManager = new PluginManagerImpl(defaults);
      const plugin = createMockPlugin('plugin-a');

      pluginManager.register(plugin);

      expect(pluginManager.getPluginConfig('plugin-a')).toEqual({
        fromDefault: true,
      });
    });
  });

  // ==================== Extension Point Registration Tests ====================

  describe('Extension Points', () => {
    it('should register core extension points on initialization', () => {
      const headerExt = pluginManager['extensionPoints'].get('layout:header');
      const footerExt = pluginManager['extensionPoints'].get('layout:footer');
      const sidebarExt = pluginManager['extensionPoints'].get('layout:sidebar');
      const viewExt = pluginManager['extensionPoints'].get('view');

      expect(headerExt).toBeDefined();
      expect(footerExt).toBeDefined();
      expect(sidebarExt).toBeDefined();
      expect(viewExt).toBeDefined();
    });

    it('should allow plugin to register custom extension point', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      let capturedApi: PluginAPI | null = null;
      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        capturedApi = api;
      });

      await pluginManager.load('plugin-a');

      const api = capturedApi as unknown as PluginAPI;
      api.registerExtensionPoint('plugin-a:custom-point', {
        description: 'Custom point',
      });

      expect(
        pluginManager['extensionPoints'].has('plugin-a:custom-point')
      ).toBe(true);
    });
  });

  // ==================== Extension Registration Tests ====================

  describe('registerExtension (via plugin API)', () => {
    it('should register extension for core extension point', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      let capturedApi: PluginAPI | null = null;
      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        capturedApi = api;
      });

      await pluginManager.load('plugin-a');

      const api = capturedApi as unknown as PluginAPI;
      api.registerExtension('layout:header', {
        id: 'header-ext',
        component: 'Header',
      });

      const extensions = pluginManager.getExtensions('layout:header');
      expect(extensions).toHaveLength(1);
      expect(extensions[0]).toMatchObject({
        id: 'header-ext',
        component: 'Header',
        _pluginId: 'plugin-a',
      });
    });

    it('should auto-create extension point if not exists', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      let capturedApi: PluginAPI | null = null;
      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        capturedApi = api;
      });

      await pluginManager.load('plugin-a');

      const api = capturedApi as unknown as PluginAPI;
      api.registerExtension('plugin-a:custom-ext', {
        id: 'custom-ext-1',
        data: 'test',
      });

      const extensions = pluginManager.getExtensions('plugin-a:custom-ext');
      expect(extensions).toHaveLength(1);
    });

    it('should generate extension ID if not provided', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      let capturedApi: PluginAPI | null = null;
      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        capturedApi = api;
      });

      await pluginManager.load('plugin-a');

      const api = capturedApi as unknown as PluginAPI;
      api.registerExtension('layout:header', {
        component: 'Header',
      });

      const extensions = pluginManager.getExtensions('layout:header');
      expect(extensions[0]._extensionId).toBeDefined();
    });

    it('should register multiple extensions to same point', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      let capturedApi: PluginAPI | null = null;
      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        capturedApi = api;
      });

      await pluginManager.load('plugin-a');

      const api = capturedApi as unknown as PluginAPI;
      api.registerExtension('layout:header', { id: 'ext-1' });
      api.registerExtension('layout:header', { id: 'ext-2' });

      const extensions = pluginManager.getExtensions('layout:header');
      expect(extensions).toHaveLength(2);
    });
  });

  // ==================== Extension Retrieval Tests ====================

  describe('getExtensions', () => {
    it('should return empty array for non-existent point', () => {
      const extensions = pluginManager.getExtensions('non-existent:point');
      expect(extensions).toEqual([]);
    });

    it('should return extensions for core point', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      let capturedApi: PluginAPI | null = null;
      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        capturedApi = api;
      });

      await pluginManager.load('plugin-a');

      const api = capturedApi as unknown as PluginAPI;
      api.registerExtension('layout:header', { id: 'ext-1' });

      const extensions = pluginManager.getExtensions('layout:header');
      expect(extensions).toHaveLength(1);
    });

    it('should aggregate view extensions from all plugins', async () => {
      const plugin1 = createMockPlugin('plugin-1');
      const plugin2 = createMockPlugin('plugin-2');
      pluginManager.register(plugin1);
      pluginManager.register(plugin2);

      let api1: PluginAPI | null = null;
      let api2: PluginAPI | null = null;

      plugin1.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        api1 = api;
      });
      plugin2.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        api2 = api;
      });

      await pluginManager.load('plugin-1');
      await pluginManager.load('plugin-2');

      const apiOne = api1 as unknown as PluginAPI;
      const apiTwo = api2 as unknown as PluginAPI;
      apiOne.registerExtension('view', { id: 'view-1', type: 'grid' });
      apiTwo.registerExtension('plugin-2:view', { id: 'view-2', type: 'kanban' });

      const viewExtensions = pluginManager.getExtensions('view');
      expect(viewExtensions.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==================== Service Registration Tests ====================

  describe('registerService (via plugin API)', () => {
    it('should register and retrieve service', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      const testService = { name: 'test', method: () => 'result' };

      let capturedApi: PluginAPI | null = null;
      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        capturedApi = api;
      });

      await pluginManager.load('plugin-a');

      const api = capturedApi as unknown as PluginAPI;
      api.registerService('test-service', testService);

      const retrieved = pluginManager['services'].get('test-service');
      expect(retrieved).toBe(testService);
    });

    it('should override existing service', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      let capturedApi: PluginAPI | null = null;
      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        capturedApi = api;
      });

      await pluginManager.load('plugin-a');

      const api = capturedApi as unknown as PluginAPI;
      api.registerService('service', { v: 1 });
      api.registerService('service', { v: 2 });

      const retrieved = pluginManager['services'].get('service');
      expect(retrieved).toEqual({ v: 2 });
    });

    it('should retrieve service via plugin API getService', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      const testService = { value: 'test' };
      let retrievedService: unknown = null;

      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        api.registerService('my-service', testService);
        retrievedService = api.getService('my-service');
      });

      await pluginManager.load('plugin-a');

      expect(retrievedService).toBe(testService);
    });

    it('should return null for non-existent service', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      let result: unknown = null;
      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        result = api.getService('non-existent');
      });

      await pluginManager.load('plugin-a');

      expect(result).toBeNull();
    });
  });

  // ==================== Configuration Subscription Tests ====================

  describe('subscribeToPluginConfig', () => {
    it('should call listener immediately with current config', () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);
      pluginManager.setPluginConfig('plugin-a', { key: 'value' });
      const listener = vi.fn();

      pluginManager.subscribeToPluginConfig?.('plugin-a', listener);

      expect(listener).toHaveBeenCalledWith({ key: 'value' });
    });

    it('should call listener on config change', () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);
      const listener = vi.fn();

      pluginManager.subscribeToPluginConfig?.('plugin-a', listener);
      pluginManager.setPluginConfig('plugin-a', { key: 'newValue' });

      expect(listener).toHaveBeenCalledTimes(2); // initial + change
      expect(listener).toHaveBeenLastCalledWith({ key: 'newValue' });
    });

    it('should return unsubscribe function', () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);
      const listener = vi.fn();

      const unsubscribe = pluginManager.subscribeToPluginConfig?.('plugin-a', listener) ?? (() => void 0);
      unsubscribe();

      pluginManager.setPluginConfig('plugin-a', { key: 'value' });

      // Should still have initial call, but not the subsequent change
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should support multiple listeners', () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      pluginManager.subscribeToPluginConfig?.('plugin-a', listener1);
      pluginManager.subscribeToPluginConfig?.('plugin-a', listener2);

      pluginManager.setPluginConfig('plugin-a', { key: 'value' });

      expect(listener1).toHaveBeenCalledWith({ key: 'value' });
      expect(listener2).toHaveBeenCalledWith({ key: 'value' });
    });

    it('should handle listener errors gracefully', () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();

      pluginManager.subscribeToPluginConfig?.('plugin-a', errorListener);
      pluginManager.subscribeToPluginConfig?.('plugin-a', normalListener);

      expect(() => {
        pluginManager.setPluginConfig('plugin-a', { key: 'value' });
      }).not.toThrow();

      expect(normalListener).toHaveBeenCalled();
    });
  });

  describe('subscribeToAllConfigChanges', () => {
    it('should call listener on any plugin config change', () => {
      const plugin1 = createMockPlugin('plugin-1');
      const plugin2 = createMockPlugin('plugin-2');
      pluginManager.register(plugin1);
      pluginManager.register(plugin2);
      const listener = vi.fn();

      pluginManager.subscribeToAllConfigChanges?.(listener);

      pluginManager.setPluginConfig('plugin-1', { k: 'v1' });
      pluginManager.setPluginConfig('plugin-2', { k: 'v2' });

      expect(listener).toHaveBeenCalledWith('plugin-1', { k: 'v1' });
      expect(listener).toHaveBeenCalledWith('plugin-2', { k: 'v2' });
    });

    it('should return unsubscribe function', () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);
      const listener = vi.fn();

      const unsubscribe = pluginManager.subscribeToAllConfigChanges?.(listener) ?? (() => void 0);
      unsubscribe();

      pluginManager.setPluginConfig('plugin-a', { key: 'value' });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();

      pluginManager.subscribeToAllConfigChanges?.(errorListener);
      pluginManager.subscribeToAllConfigChanges?.(normalListener);

      expect(() => {
        pluginManager.setPluginConfig('plugin-a', { key: 'value' });
      }).not.toThrow();

      expect(normalListener).toHaveBeenCalled();
    });
  });

  // ==================== Extension Change Subscription Tests ====================

  describe('subscribeToExtensionChanges', () => {
    it('should call listener when extension is registered', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);
      const listener = vi.fn();

      let capturedApi: PluginAPI | null = null;
      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        capturedApi = api;
      });

      await pluginManager.load('plugin-a');

      pluginManager.subscribeToExtensionChanges?.('layout:header', listener);
      const api = capturedApi as unknown as PluginAPI;
      api.registerExtension('layout:header', { id: 'ext-1' });

      expect(listener).toHaveBeenCalled();
    });

    it('should return unsubscribe function', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);
      const listener = vi.fn();

      let capturedApi: PluginAPI | null = null;
      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        capturedApi = api;
      });

      await pluginManager.load('plugin-a');

      const unsubscribe = pluginManager.subscribeToExtensionChanges?.('layout:header', listener) ?? (() => void 0);
      unsubscribe();

      const api = capturedApi as unknown as PluginAPI;
      api.registerExtension('layout:header', { id: 'ext-1' });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  // ==================== Plugin API Tests ====================

  describe('Plugin API - getPlugin', () => {
    it('should allow plugin to get another plugin reference', async () => {
      const pluginA = createMockPlugin('plugin-a');
      const pluginB = createMockPlugin('plugin-b');
      pluginManager.register(pluginA);
      pluginManager.register(pluginB);

      let retrievedPlugin: Plugin | null = null;
      pluginA.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        retrievedPlugin = api.getPlugin('plugin-b');
      });

      await pluginManager.load('plugin-a');

      expect(retrievedPlugin).toBe(pluginB);
    });

    it('should return null for non-existent plugin', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      let retrievedPlugin: Plugin | null = null;
      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        retrievedPlugin = api.getPlugin('non-existent');
      });

      await pluginManager.load('plugin-a');

      expect(retrievedPlugin).toBeNull();
    });
  });

  describe('Plugin API - getPluginConfig', () => {
    it('should allow plugin to get its own config', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);
      pluginManager.setPluginConfig('plugin-a', { key: 'value' });

      let config: unknown = null;
      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        config = api.getPluginConfig();
      });

      await pluginManager.load('plugin-a');

      expect(config).toEqual({ key: 'value' });
    });
  });

  // ==================== Edge Cases and Error Handling ====================

  describe('Edge Cases', () => {
    it('should handle async initialize method', async () => {
      const plugin = createMockPlugin('plugin-a');
      plugin.initialize = vi.fn().mockResolvedValue(undefined);

      pluginManager.register(plugin);
      await pluginManager.load('plugin-a');

      expect(plugin.initialize).toHaveBeenCalled();
    });

    it('should handle sync initialize method', async () => {
      const plugin = createMockPlugin('plugin-a');
      plugin.initialize = vi.fn().mockReturnValue(undefined);

      pluginManager.register(plugin);
      await pluginManager.load('plugin-a');

      expect(plugin.initialize).toHaveBeenCalled();
    });

    it('should handle async activate method', async () => {
      const plugin = createMockPlugin('plugin-a');
      plugin.activate = vi.fn().mockResolvedValue(undefined);

      pluginManager.register(plugin);
      await pluginManager.load('plugin-a');

      expect(plugin.activate).toHaveBeenCalled();
    });

    it('should handle plugin initialization error without throwing', async () => {
      const plugin = createMockPlugin('plugin-a');
      plugin.initialize = vi
        .fn()
        .mockRejectedValue(new Error('Init error'));

      pluginManager.register(plugin);

      await expect(pluginManager.load('plugin-a')).rejects.toThrow();
    });

    it('should handle complex nested dependencies', async () => {
      const dep1 = createMockPlugin('dep-1', '1.0.0');
      const dep2 = createMockPlugin('dep-2', '1.0.0', { 'dep-1': '1.0.0' });
      const dep3 = createMockPlugin('dep-3', '1.0.0', {
        'dep-1': '1.0.0',
        'dep-2': '1.0.0',
      });
      const main = createMockPlugin('main', '1.0.0', { 'dep-3': '1.0.0' });

      pluginManager.register(dep1);
      pluginManager.register(dep2);
      pluginManager.register(dep3);
      pluginManager.register(main);

      await expect(pluginManager.load('main')).resolves.not.toThrow();
    });

    it('should preserve extension order for multiple extensions on same point', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      let capturedApi: PluginAPI | null = null;
      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        capturedApi = api;
      });

      await pluginManager.load('plugin-a');

      const api = capturedApi as unknown as PluginAPI;
      api.registerExtension('layout:header', { id: 'ext-1', order: 1 });
      api.registerExtension('layout:header', { id: 'ext-2', order: 2 });
      api.registerExtension('layout:header', { id: 'ext-3', order: 3 });

      const extensions = pluginManager.getExtensions('layout:header');
      expect(extensions[0].id).toBe('ext-1');
      expect(extensions[1].id).toBe('ext-2');
      expect(extensions[2].id).toBe('ext-3');
    });

    it('should handle empty default config', () => {
      pluginManager = new PluginManagerImpl({});
      const plugin = createMockPlugin('plugin-a');

      pluginManager.register(plugin);

      expect(pluginManager.getPluginConfig('plugin-a')).toEqual({});
    });

    it('should handle null/undefined values in config gracefully', () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      pluginManager.setPluginConfig('plugin-a', null as unknown as Record<string, unknown>);

      // Implementation converts null to empty object
      expect(pluginManager.getPluginConfig('plugin-a')).toEqual({});
    });
  });

  // ==================== Integration Tests ====================

  describe('Integration Scenarios', () => {
    it('should handle complete lifecycle: register, load, config, unload', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);

      await pluginManager.load('plugin-a');
      pluginManager.setPluginConfig('plugin-a', { key: 'value' });
      await pluginManager.unload('plugin-a');

      expect(plugin.initialize).toHaveBeenCalled();
      expect(plugin.activate).toHaveBeenCalled();
      expect(plugin.deactivate).toHaveBeenCalled();
    });

    it('should handle multiple plugins with extensions and services', async () => {
      const plugin1 = createMockPlugin('plugin-1');
      const plugin2 = createMockPlugin('plugin-2');
      pluginManager.register(plugin1);
      pluginManager.register(plugin2);

      plugin1.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        api.registerService('service-1', { value: 1 });
        api.registerExtension('layout:header', { id: 'header-1' });
      });

      plugin2.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        api.registerService('service-2', { value: 2 });
        api.registerExtension('layout:footer', { id: 'footer-1' });
      });

      await pluginManager.load('plugin-1');
      await pluginManager.load('plugin-2');

      expect(pluginManager.getExtensions('layout:header')).toHaveLength(1);
      expect(pluginManager.getExtensions('layout:footer')).toHaveLength(1);
      expect(pluginManager['services'].get('service-1')).toBeDefined();
      expect(pluginManager['services'].get('service-2')).toBeDefined();
    });

    it('should handle dynamic config update workflow', async () => {
      const plugin = createMockPlugin('plugin-a');
      pluginManager.register(plugin);
      await pluginManager.load('plugin-a');

      const listener = vi.fn();
      pluginManager.subscribeToPluginConfig?.('plugin-a', listener);

      pluginManager.setPluginConfig('plugin-a', { v: 1 });
      pluginManager.setPluginConfig('plugin-a', { v: 2 });
      pluginManager.setPluginConfig('plugin-a', { v: 3 });

      expect(listener).toHaveBeenCalledTimes(4); // initial + 3 changes
    });

    it('should maintain plugin isolation when one fails', async () => {
      const plugin1 = createMockPlugin('plugin-1');
      const plugin2 = createMockPlugin('plugin-2');

      plugin1.initialize = vi.fn().mockRejectedValue(new Error('Init failed'));

      pluginManager.register(plugin1);
      pluginManager.register(plugin2);

      await expect(pluginManager.load('plugin-1')).rejects.toThrow();
      await expect(pluginManager.load('plugin-2')).resolves.not.toThrow();

      expect(pluginManager.getLoadedPlugins()).toHaveLength(1);
    });
  });
});
