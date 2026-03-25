import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginConfigManager } from '../PluginConfigManager';

describe('PluginConfigManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads config from fetch and returns it', async () => {
    const mockConfig = {
      plugins: { builtin: [{ id: 'alpha', enabled: true, config: { a: 1 } }], external: [] },
      settings: { autoLoadPlugins: true, allowExternalPlugins: true, pluginTimeout: 1, developmentMode: false }
    };
    globalThis.fetch = vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue(mockConfig) }) as any;

    const manager = new PluginConfigManager('/config/test.json');
    const config = await manager.loadConfig();

    expect(config).toEqual(mockConfig);
    expect(manager.getConfig()).toEqual(mockConfig);
  });

  it('falls back to default config when fetch fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('boom')) as any;

    const manager = new PluginConfigManager('/config/test.json');
    const config = await manager.loadConfig();

    expect(config.plugins.builtin.length).toBeGreaterThan(0);
    expect(config.settings.pluginTimeout).toBe(10000);
    consoleErrorSpy.mockRestore();
  });

  it('gets and updates plugin config and enabled state', async () => {
    const mockConfig = {
      plugins: { builtin: [{ id: 'navigation', enabled: true, config: { menuPosition: 'top' } }], external: [] },
      settings: { autoLoadPlugins: true, allowExternalPlugins: true, pluginTimeout: 1, developmentMode: false }
    };
    globalThis.fetch = vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue(mockConfig) }) as any;

    const manager = new PluginConfigManager('/config/test.json');
    await manager.loadConfig();

    expect(manager.getPluginConfig('navigation')).toMatchObject({ menuPosition: 'top' });

    const setItemSpy = vi.spyOn(globalThis.localStorage, 'setItem');
    manager.updatePluginConfig('navigation', { theme: 'dark' });
    expect(manager.getPluginConfig('navigation')).toMatchObject({ theme: 'dark' });
    expect(setItemSpy).toHaveBeenCalled();

    expect(manager.isPluginEnabled('navigation')).toBe(true);
    manager.setPluginEnabled('navigation', false);
    expect(manager.isPluginEnabled('navigation')).toBe(false);
  });

  it('returns empty config when not loaded and handles external plugin updates', async () => {
    const manager = new PluginConfigManager('/config/test.json');
    expect(manager.getPluginConfig('missing')).toEqual({});
    expect(manager.isPluginEnabled('missing')).toBe(false);

    const mockConfig = {
      plugins: {
        builtin: [],
        external: [{ id: 'ext', enabled: false, config: { mode: 'light' } }]
      },
      settings: { autoLoadPlugins: true, allowExternalPlugins: true, pluginTimeout: 1, developmentMode: false }
    };
    globalThis.fetch = vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue(mockConfig) }) as any;
    await manager.loadConfig();

    expect(manager.getPluginConfig('ext')).toMatchObject({ mode: 'light' });
    manager.updatePluginConfig('ext', { mode: 'dark' });
    expect(manager.getPluginConfig('ext')).toMatchObject({ mode: 'dark' });

    expect(manager.isPluginEnabled('ext')).toBe(false);
    manager.setPluginEnabled('ext', true);
    expect(manager.isPluginEnabled('ext')).toBe(true);
  });

  it('swallows storage errors when saving config', async () => {
    const mockConfig = {
      plugins: { builtin: [{ id: 'nav', enabled: true, config: { a: 1 } }], external: [] },
      settings: { autoLoadPlugins: true, allowExternalPlugins: true, pluginTimeout: 1, developmentMode: false }
    };
    globalThis.fetch = vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue(mockConfig) }) as any;
    const setItemSpy = vi.spyOn(globalThis.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const manager = new PluginConfigManager('/config/test.json');
    await manager.loadConfig();
    manager.updatePluginConfig('nav', { b: 2 });

    expect(setItemSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  it('no-ops when config is not loaded', () => {
    const manager = new PluginConfigManager('/config/test.json');
    expect(manager.isPluginEnabled('anything')).toBe(false);
    expect(manager.getPluginConfig('anything')).toEqual({});
    manager.updatePluginConfig('anything', { x: 1 });
    manager.setPluginEnabled('anything', true);
    expect(manager.getConfig()).toBeNull();
  });
});
