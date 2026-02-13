import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginManagerImpl } from '../PluginManager';
import type { Plugin, PluginAPI } from '../types';

const createPlugin = (
  id: string,
  options: {
    version?: string;
    dependencies?: Record<string, string>;
    frameworkVersion?: string;
    initialize?: (api: PluginAPI, config: any) => Promise<void> | void;
    activate?: () => Promise<void> | void;
    deactivate?: () => Promise<void> | void;
    onConfigurationUpdate?: (newConfig: any, oldConfig: any) => Promise<void> | void;
  } = {}
): Plugin => ({
  manifest: {
    id,
    name: id,
    version: options.version ?? '1.0.0',
    dependencies: options.dependencies,
    ...(options.frameworkVersion ? { frameworkVersion: options.frameworkVersion } : {}),
  } as any,
  initialize: options.initialize ?? vi.fn(),
  activate: options.activate,
  deactivate: options.deactivate,
  onConfigurationUpdate: options.onConfigurationUpdate,
});

describe('PluginManagerImpl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers plugins and prevents duplicate registration', () => {
    const manager = new PluginManagerImpl();
    const plugin = createPlugin('p1');

    manager.register(plugin);
    expect(manager.getPlugin('p1')).toBe(plugin);

    expect(() => manager.register(plugin)).toThrow('already registered');
  });

  it('loads plugin dependencies first and activates plugins', async () => {
    const manager = new PluginManagerImpl();
    const order: string[] = [];

    const dep = createPlugin('dep', {
      initialize: vi.fn(() => {
        order.push('dep:init');
      }),
      activate: vi.fn(() => {
        order.push('dep:activate');
      }),
    });

    const main = createPlugin('main', {
      dependencies: { dep: '^1.0.0' },
      initialize: vi.fn(() => {
        order.push('main:init');
      }),
      activate: vi.fn(() => {
        order.push('main:activate');
      }),
    });

    manager.register(dep);
    manager.register(main);
    await manager.load('main');

    expect(order).toEqual(['dep:init', 'dep:activate', 'main:init', 'main:activate']);
    expect(manager.getLoadedPlugins().map((p) => p.manifest.id)).toEqual(['dep', 'main']);
  });

  it('throws when loading unknown plugin or unresolved dependency', async () => {
    const manager = new PluginManagerImpl();

    await expect(manager.load('missing')).rejects.toThrow('not registered');

    manager.register(createPlugin('needs-dep', { dependencies: { absent: '^1.0.0' } }));
    await expect(manager.load('needs-dep')).rejects.toThrow('Failed to resolve dependencies');
  });

  it('validates plugin compatibility using framework version', () => {
    const manager = new PluginManagerImpl();
    const ok = createPlugin('ok', { frameworkVersion: '>=1.0.0' });
    const bad = createPlugin('bad', { frameworkVersion: '>2.0.0' });

    expect(manager.validatePluginCompatibility(ok)).toBe(true);
    expect(manager.validatePluginCompatibility(bad)).toBe(false);
  });

  it('supports core extension points and extension change subscriptions', () => {
    const manager = new PluginManagerImpl();
    const onChange = vi.fn();
    const unsubscribe = manager.subscribeToExtensionChanges?.('core:banner', onChange);

    manager.registerCoreExtensionPoint('banner', { order: { type: 'number' } });
    manager.registerCoreExtension('banner', { id: 'core-banner', content: 'Hi' });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(manager.getExtensions('core:banner')).toHaveLength(1);
    expect(manager.getExtensions('core:banner')[0]._pluginId).toBe('core');

    unsubscribe?.();
    manager.registerCoreExtension('banner', { id: 'core-banner-2' });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('aggregates view extensions from direct and plugin-scoped registration', async () => {
    const manager = new PluginManagerImpl();
    const plugin = createPlugin('calendar', {
      initialize: (api) => {
        api.registerExtension('view', { id: 'calendar-view' });
        api.registerExtension('calendar:view', { id: 'calendar-scoped' });
      },
    });

    manager.register(plugin);
    await manager.load('calendar');

    const viewExtensions = manager.getExtensions('view').map((e) => e.id);
    expect(viewExtensions).toEqual(expect.arrayContaining(['calendar-view', 'calendar-scoped']));
  });

  it('unloads plugins and blocks unload when another loaded plugin depends on it', async () => {
    const manager = new PluginManagerImpl();
    const dep = createPlugin('dep', { deactivate: vi.fn() });
    const main = createPlugin('main', { dependencies: { dep: '^1.0.0' } });

    manager.register(dep);
    manager.register(main);
    await manager.load('main');

    await expect(manager.unload('dep')).rejects.toThrow('depends on it');

    await manager.unload('main');
    await manager.unload('dep');
    expect(manager.getLoadedPlugins()).toEqual([]);
  });

  it('handles plugin config subscriptions and global subscriptions', async () => {
    const manager = new PluginManagerImpl({ p1: { initial: true } });
    const onPluginConfig = vi.fn();
    const onGlobal = vi.fn();

    manager.register(createPlugin('p1'));

    const unsubPlugin = manager.subscribeToPluginConfig?.('p1', onPluginConfig);
    const unsubGlobal = manager.subscribeToAllConfigChanges?.(onGlobal);

    expect(onPluginConfig).toHaveBeenCalledWith({ initial: true });

    manager.setPluginConfig('p1', { enabled: true });
    expect(manager.getPluginConfig('p1')).toEqual({ enabled: true });
    expect(onPluginConfig).toHaveBeenLastCalledWith({ enabled: true });
    expect(onGlobal).toHaveBeenCalledWith('p1', { enabled: true });

    unsubPlugin?.();
    unsubGlobal?.();
    manager.setPluginConfig('p1', { enabled: false });
    expect(onGlobal).toHaveBeenCalledTimes(1);
  });

  it('calls onConfigurationUpdate for loaded plugin config changes', async () => {
    const manager = new PluginManagerImpl();
    const onConfigurationUpdate = vi.fn();
    const plugin = createPlugin('p1', { onConfigurationUpdate });

    manager.register(plugin);
    await manager.load('p1');

    manager.setPluginConfig('p1', { n: 1 });
    await Promise.resolve();
    await Promise.resolve();

    expect(onConfigurationUpdate).toHaveBeenCalledWith({ n: 1 }, {});
  });
});

