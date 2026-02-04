import { describe, it, expect, vi } from 'vitest';
import type {
  PluginManifest,
  Plugin,
  PluginAPI,
  PluginManager,
} from '../types';

describe('types', () => {
  describe('PluginManifest', () => {
    it('should accept minimal manifest with required fields', () => {
      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
      };

      expect(manifest.id).toBe('test-plugin');
      expect(manifest.name).toBe('Test Plugin');
      expect(manifest.version).toBe('1.0.0');
    });

    it('should accept manifest with all optional fields', () => {
      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        dependencies: { 'other-plugin': '^1.0.0' },
        configSchema: { type: 'object' },
      };

      expect(manifest.description).toBe('A test plugin');
      expect(manifest.author).toBe('Test Author');
      expect(manifest.dependencies).toEqual({ 'other-plugin': '^1.0.0' });
      expect(manifest.configSchema).toEqual({ type: 'object' });
    });

    it('should accept manifest with empty dependencies', () => {
      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        dependencies: {},
      };

      expect(manifest.dependencies).toEqual({});
    });

    it('should accept manifest with multiple dependencies', () => {
      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        dependencies: {
          'plugin-a': '^1.0.0',
          'plugin-b': '~2.0.0',
          'plugin-c': '>=3.0.0',
        },
      };

      expect(Object.keys(manifest.dependencies || {}).length).toBe(3);
    });
  });

  describe('Plugin', () => {
    it('should accept plugin with required fields only', () => {
      const plugin: Plugin = {
        manifest: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
        },
        initialize: vi.fn(),
      };

      expect(plugin.manifest.id).toBe('test-plugin');
      expect(typeof plugin.initialize).toBe('function');
    });

    it('should accept plugin with all lifecycle methods', () => {
      const plugin: Plugin = {
        manifest: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
        },
        initialize: vi.fn(),
        activate: vi.fn(),
        deactivate: vi.fn(),
        onConfigurationUpdate: vi.fn(),
      };

      expect(typeof plugin.activate).toBe('function');
      expect(typeof plugin.deactivate).toBe('function');
      expect(typeof plugin.onConfigurationUpdate).toBe('function');
    });

    it('should allow async initialize function', async () => {
      const plugin: Plugin = {
        manifest: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
        },
        initialize: vi.fn().mockResolvedValue(undefined),
      };

      const result = plugin.initialize({} as PluginAPI, {});
      expect(result).toBeInstanceOf(Promise);
    });

    it('should allow sync initialize function', () => {
      const plugin: Plugin = {
        manifest: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
        },
        initialize: vi.fn().mockReturnValue(undefined),
      };

      const result = plugin.initialize({} as PluginAPI, {});
      expect(result).toBeUndefined();
    });

    it('should allow async activate function', async () => {
      const plugin: Plugin = {
        manifest: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
        },
        initialize: vi.fn(),
        activate: vi.fn().mockResolvedValue(undefined),
      };

      const result = plugin.activate?.();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should allow async deactivate function', async () => {
      const plugin: Plugin = {
        manifest: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
        },
        initialize: vi.fn(),
        deactivate: vi.fn().mockResolvedValue(undefined),
      };

      const result = plugin.deactivate?.();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should allow async onConfigurationUpdate function', async () => {
      const plugin: Plugin = {
        manifest: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
        },
        initialize: vi.fn(),
        onConfigurationUpdate: vi.fn().mockResolvedValue(undefined),
      };

      const result = plugin.onConfigurationUpdate?.({}, {});
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('PluginAPI', () => {
    it('should define all required API methods', () => {
      const api: PluginAPI = {
        registerExtensionPoint: vi.fn(),
        registerExtension: vi.fn(),
        getPlugin: vi.fn().mockReturnValue(null),
        getPluginConfig: vi.fn().mockReturnValue({}),
        getService: vi.fn().mockReturnValue(null),
        registerService: vi.fn(),
      };

      expect(typeof api.registerExtensionPoint).toBe('function');
      expect(typeof api.registerExtension).toBe('function');
      expect(typeof api.getPlugin).toBe('function');
      expect(typeof api.getPluginConfig).toBe('function');
      expect(typeof api.getService).toBe('function');
      expect(typeof api.registerService).toBe('function');
    });

    it('should allow registerExtensionPoint with optional schema', () => {
      const api: PluginAPI = {
        registerExtensionPoint: vi.fn(),
        registerExtension: vi.fn(),
        getPlugin: vi.fn().mockReturnValue(null),
        getPluginConfig: vi.fn().mockReturnValue({}),
        getService: vi.fn().mockReturnValue(null),
        registerService: vi.fn(),
      };

      api.registerExtensionPoint('test:point');
      api.registerExtensionPoint('test:point2', { type: 'object' });

      expect(api.registerExtensionPoint).toHaveBeenCalledTimes(2);
    });

    it('should support generic type for getService', () => {
      interface TestService {
        getValue: () => string;
      }

      const testService: TestService = { getValue: () => 'test' };
      const api: PluginAPI = {
        registerExtensionPoint: vi.fn(),
        registerExtension: vi.fn(),
        getPlugin: vi.fn().mockReturnValue(null),
        getPluginConfig: vi.fn().mockReturnValue({}),
        getService: vi.fn().mockReturnValue(testService),
        registerService: vi.fn(),
      };

      const service = api.getService<TestService>('test-service');
      expect(service).toBe(testService);
    });

    it('should support generic type for registerService', () => {
      interface TestService {
        getValue: () => string;
      }

      const testService: TestService = { getValue: () => 'test' };
      const api: PluginAPI = {
        registerExtensionPoint: vi.fn(),
        registerExtension: vi.fn(),
        getPlugin: vi.fn().mockReturnValue(null),
        getPluginConfig: vi.fn().mockReturnValue({}),
        getService: vi.fn().mockReturnValue(null),
        registerService: vi.fn(),
      };

      api.registerService<TestService>('test-service', testService);
      expect(api.registerService).toHaveBeenCalledWith('test-service', testService);
    });
  });

  describe('PluginManager', () => {
    it('should define all required manager methods', () => {
      const manager: PluginManager = {
        register: vi.fn(),
        load: vi.fn().mockResolvedValue(undefined),
        unload: vi.fn().mockResolvedValue(undefined),
        getPlugin: vi.fn().mockReturnValue(null),
        getLoadedPlugins: vi.fn().mockReturnValue([]),
        resolvePluginDependencies: vi.fn().mockReturnValue(true),
        validatePluginCompatibility: vi.fn().mockReturnValue(true),
        setPluginConfig: vi.fn(),
        getPluginConfig: vi.fn().mockReturnValue({}),
        getExtensions: vi.fn().mockReturnValue([]),
        registerCoreExtensionPoint: vi.fn(),
        registerCoreExtension: vi.fn(),
      };

      expect(typeof manager.register).toBe('function');
      expect(typeof manager.load).toBe('function');
      expect(typeof manager.unload).toBe('function');
      expect(typeof manager.getPlugin).toBe('function');
      expect(typeof manager.getLoadedPlugins).toBe('function');
      expect(typeof manager.resolvePluginDependencies).toBe('function');
      expect(typeof manager.validatePluginCompatibility).toBe('function');
      expect(typeof manager.setPluginConfig).toBe('function');
      expect(typeof manager.getPluginConfig).toBe('function');
      expect(typeof manager.getExtensions).toBe('function');
      expect(typeof manager.registerCoreExtensionPoint).toBe('function');
      expect(typeof manager.registerCoreExtension).toBe('function');
    });

    it('should allow optional subscription methods', () => {
      const manager: PluginManager = {
        register: vi.fn(),
        load: vi.fn().mockResolvedValue(undefined),
        unload: vi.fn().mockResolvedValue(undefined),
        getPlugin: vi.fn().mockReturnValue(null),
        getLoadedPlugins: vi.fn().mockReturnValue([]),
        resolvePluginDependencies: vi.fn().mockReturnValue(true),
        validatePluginCompatibility: vi.fn().mockReturnValue(true),
        setPluginConfig: vi.fn(),
        getPluginConfig: vi.fn().mockReturnValue({}),
        getExtensions: vi.fn().mockReturnValue([]),
        registerCoreExtensionPoint: vi.fn(),
        registerCoreExtension: vi.fn(),
        subscribeToPluginConfig: vi.fn().mockReturnValue(() => {}),
        subscribeToAllConfigChanges: vi.fn().mockReturnValue(() => {}),
        subscribeToExtensionChanges: vi.fn().mockReturnValue(() => {}),
      };

      expect(typeof manager.subscribeToPluginConfig).toBe('function');
      expect(typeof manager.subscribeToAllConfigChanges).toBe('function');
      expect(typeof manager.subscribeToExtensionChanges).toBe('function');
    });

    it('should allow async load method', async () => {
      const manager: PluginManager = {
        register: vi.fn(),
        load: vi.fn().mockResolvedValue(undefined),
        unload: vi.fn().mockResolvedValue(undefined),
        getPlugin: vi.fn().mockReturnValue(null),
        getLoadedPlugins: vi.fn().mockReturnValue([]),
        resolvePluginDependencies: vi.fn().mockReturnValue(true),
        validatePluginCompatibility: vi.fn().mockReturnValue(true),
        setPluginConfig: vi.fn(),
        getPluginConfig: vi.fn().mockReturnValue({}),
        getExtensions: vi.fn().mockReturnValue([]),
        registerCoreExtensionPoint: vi.fn(),
        registerCoreExtension: vi.fn(),
      };

      const result = manager.load('test-plugin');
      expect(result).toBeInstanceOf(Promise);
    });

    it('should allow async unload method', async () => {
      const manager: PluginManager = {
        register: vi.fn(),
        load: vi.fn().mockResolvedValue(undefined),
        unload: vi.fn().mockResolvedValue(undefined),
        getPlugin: vi.fn().mockReturnValue(null),
        getLoadedPlugins: vi.fn().mockReturnValue([]),
        resolvePluginDependencies: vi.fn().mockReturnValue(true),
        validatePluginCompatibility: vi.fn().mockReturnValue(true),
        setPluginConfig: vi.fn(),
        getPluginConfig: vi.fn().mockReturnValue({}),
        getExtensions: vi.fn().mockReturnValue([]),
        registerCoreExtensionPoint: vi.fn(),
        registerCoreExtension: vi.fn(),
      };

      const result = manager.unload('test-plugin');
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('Type Compatibility', () => {
    it('should allow Plugin to be used with PluginManager', () => {
      const plugin: Plugin = {
        manifest: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
        },
        initialize: vi.fn(),
      };

      const manager: PluginManager = {
        register: vi.fn(),
        load: vi.fn().mockResolvedValue(undefined),
        unload: vi.fn().mockResolvedValue(undefined),
        getPlugin: vi.fn().mockReturnValue(plugin),
        getLoadedPlugins: vi.fn().mockReturnValue([plugin]),
        resolvePluginDependencies: vi.fn().mockReturnValue(true),
        validatePluginCompatibility: vi.fn().mockReturnValue(true),
        setPluginConfig: vi.fn(),
        getPluginConfig: vi.fn().mockReturnValue({}),
        getExtensions: vi.fn().mockReturnValue([]),
        registerCoreExtensionPoint: vi.fn(),
        registerCoreExtension: vi.fn(),
      };

      manager.register(plugin);
      expect(manager.register).toHaveBeenCalledWith(plugin);
    });

    it('should allow PluginAPI to be passed to initialize', () => {
      const api: PluginAPI = {
        registerExtensionPoint: vi.fn(),
        registerExtension: vi.fn(),
        getPlugin: vi.fn().mockReturnValue(null),
        getPluginConfig: vi.fn().mockReturnValue({}),
        getService: vi.fn().mockReturnValue(null),
        registerService: vi.fn(),
      };

      const plugin: Plugin = {
        manifest: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
        },
        initialize: vi.fn(),
      };

      plugin.initialize(api, {});
      expect(plugin.initialize).toHaveBeenCalledWith(api, {});
    });
  });
});
