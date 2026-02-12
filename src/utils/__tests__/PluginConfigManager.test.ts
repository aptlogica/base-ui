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
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('boom')) as any;

    const manager = new PluginConfigManager('/config/test.json');
    const config = await manager.loadConfig();

    expect(config.plugins.builtin.length).toBeGreaterThan(0);
    expect(config.settings.pluginTimeout).toBe(10000);
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
});
