import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PluginConfigManager } from '../PluginConfigManager';

function createMemoryStorage() {
  let store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store = new Map();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(i: number) {
      return Array.from(store.keys())[i] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  } as Storage;
}

describe('PluginConfigManager', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('loadConfig should return fetched config when fetch succeeds', async () => {
    const cfg = {
      plugins: { builtin: [{ id: 'p1', enabled: true, config: { a: 1 } }], external: [] },
      settings: { autoLoadPlugins: true, allowExternalPlugins: true, pluginTimeout: 1, developmentMode: false },
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue(cfg) } as any));

    const mgr = new PluginConfigManager('/x.json');
    const loaded = await mgr.loadConfig();

    expect(loaded).toEqual(cfg);
    expect(mgr.getConfig()).toEqual(cfg);
    expect(mgr.getPluginConfig('p1')).toEqual({ a: 1 });
  });

  it('loadConfig should fall back to default config on fetch failure', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('nope')));

    const mgr = new PluginConfigManager('/x.json');
    const loaded = await mgr.loadConfig();

    expect(loaded.plugins.builtin.length).toBeGreaterThan(0);
    expect(loaded.settings.pluginTimeout).toBe(10000);
    expect(mgr.isPluginEnabled('navigation')).toBe(true);
    consoleErrorSpy.mockRestore();
  });

  it('getPluginConfig/isPluginEnabled should return defaults when unknown', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('nope')));
    const mgr = new PluginConfigManager('/x.json');
    await mgr.loadConfig();

    expect(mgr.getPluginConfig('missing')).toEqual({});
    expect(mgr.isPluginEnabled('missing')).toBe(false);
    consoleErrorSpy.mockRestore();
  });

  it('updatePluginConfig should merge config and persist to localStorage', async () => {
    const cfg = {
      plugins: { builtin: [{ id: 'p1', enabled: true, config: { a: 1 } }], external: [] },
      settings: { autoLoadPlugins: true, allowExternalPlugins: true, pluginTimeout: 1, developmentMode: false },
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue(cfg) } as any));

    const mgr = new PluginConfigManager('/x.json');
    await mgr.loadConfig();

    mgr.updatePluginConfig('p1', { b: 2 });
    expect(mgr.getPluginConfig('p1')).toEqual({ a: 1, b: 2 });

    const raw = localStorage.getItem('pluginConfig');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toMatchObject({ plugins: { builtin: [{ id: 'p1', config: { a: 1, b: 2 } }] } });
  });

  it('setPluginEnabled should toggle enabled and persist', async () => {
    const cfg = {
      plugins: { builtin: [{ id: 'p1', enabled: false, config: {} }], external: [] },
      settings: { autoLoadPlugins: true, allowExternalPlugins: true, pluginTimeout: 1, developmentMode: false },
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue(cfg) } as any));

    const mgr = new PluginConfigManager('/x.json');
    await mgr.loadConfig();

    mgr.setPluginEnabled('p1', true);
    expect(mgr.isPluginEnabled('p1')).toBe(true);
    expect(JSON.parse(localStorage.getItem('pluginConfig')!)).toMatchObject({ plugins: { builtin: [{ id: 'p1', enabled: true }] } });
  });
});
