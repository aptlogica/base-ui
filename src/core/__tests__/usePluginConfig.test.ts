import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  usePluginConfig,
  usePluginConfigReactive,
  useAllPluginConfigs,
} from '../usePluginConfig';
import { PluginManagerImpl } from '../PluginManager';

vi.mock('../PluginFrameworkContext', () => ({
  usePluginFramework: vi.fn(),
}));

import { usePluginFramework } from '../PluginFrameworkContext';

const mockUsePluginFramework = vi.mocked(usePluginFramework);

function createMockPluginManager(): PluginManagerImpl {
  return new PluginManagerImpl({});
}

describe('usePluginConfig', () => {
  let mockPluginManager: PluginManagerImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPluginManager = createMockPluginManager();
    mockUsePluginFramework.mockReturnValue({
      pluginManager: mockPluginManager,
      loading: false,
      error: null,
      getExtensions: vi.fn().mockReturnValue([]),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return empty config for unregistered plugin', () => {
      const { result } = renderHook(() => usePluginConfig('unregistered-plugin'));

      expect(result.current[0]).toEqual({});
    });

    it('should return initial config from plugin manager', () => {
      mockPluginManager.register({
        manifest: { id: 'test-plugin', name: 'Test', version: '1.0.0' },
        initialize: vi.fn(),
      });
      mockPluginManager.setPluginConfig('test-plugin', { key: 'value' });

      const { result } = renderHook(() => usePluginConfig('test-plugin'));

      expect(result.current[0]).toEqual({ key: 'value' });
    });

    it('should return updateConfig function', () => {
      const { result } = renderHook(() => usePluginConfig('test-plugin'));

      expect(typeof result.current[1]).toBe('function');
    });
  });

  describe('Config Updates', () => {
    it('should update config when updateConfig is called', async () => {
      mockPluginManager.register({
        manifest: { id: 'test-plugin', name: 'Test', version: '1.0.0' },
        initialize: vi.fn(),
      });

      const { result } = renderHook(() => usePluginConfig('test-plugin'));

      act(() => {
        result.current[1]({ newKey: 'newValue' });
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual({ newKey: 'newValue' });
      });
    });

    it('should receive config updates from external sources', async () => {
      mockPluginManager.register({
        manifest: { id: 'test-plugin', name: 'Test', version: '1.0.0' },
        initialize: vi.fn(),
      });

      const { result } = renderHook(() => usePluginConfig('test-plugin'));

      act(() => {
        mockPluginManager.setPluginConfig('test-plugin', { external: 'update' });
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual({ external: 'update' });
      });
    });

    it('should handle multiple rapid updates', async () => {
      mockPluginManager.register({
        manifest: { id: 'test-plugin', name: 'Test', version: '1.0.0' },
        initialize: vi.fn(),
      });

      const { result } = renderHook(() => usePluginConfig('test-plugin'));

      act(() => {
        result.current[1]({ v: 1 });
        result.current[1]({ v: 2 });
        result.current[1]({ v: 3 });
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual({ v: 3 });
      });
    });
  });

  describe('Subscription Cleanup', () => {
    it('should unsubscribe on unmount', () => {
      mockPluginManager.register({
        manifest: { id: 'test-plugin', name: 'Test', version: '1.0.0' },
        initialize: vi.fn(),
      });

      const { unmount } = renderHook(() => usePluginConfig('test-plugin'));

      unmount();

      const listener = vi.fn();
      const unsubscribe = mockPluginManager.subscribeToPluginConfig('test-plugin', listener);
      
      expect(listener).toHaveBeenCalledTimes(1);
      unsubscribe();
    });
  });

  describe('Different Plugin IDs', () => {
    it('should handle different plugin IDs independently', () => {
      mockPluginManager.register({
        manifest: { id: 'plugin-a', name: 'Plugin A', version: '1.0.0' },
        initialize: vi.fn(),
      });
      mockPluginManager.register({
        manifest: { id: 'plugin-b', name: 'Plugin B', version: '1.0.0' },
        initialize: vi.fn(),
      });
      mockPluginManager.setPluginConfig('plugin-a', { a: 'value-a' });
      mockPluginManager.setPluginConfig('plugin-b', { b: 'value-b' });

      const { result: resultA } = renderHook(() => usePluginConfig('plugin-a'));
      const { result: resultB } = renderHook(() => usePluginConfig('plugin-b'));

      expect(resultA.current[0]).toEqual({ a: 'value-a' });
      expect(resultB.current[0]).toEqual({ b: 'value-b' });
    });
  });
});

describe('usePluginConfigReactive', () => {
  let mockPluginManager: PluginManagerImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPluginManager = createMockPluginManager();
    mockUsePluginFramework.mockReturnValue({
      pluginManager: mockPluginManager,
      loading: false,
      error: null,
      getExtensions: vi.fn().mockReturnValue([]),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial config', () => {
      mockPluginManager.register({
        manifest: { id: 'test-plugin', name: 'Test', version: '1.0.0' },
        initialize: vi.fn(),
      });
      mockPluginManager.setPluginConfig('test-plugin', { initial: 'config' });

      const { result } = renderHook(() => usePluginConfigReactive('test-plugin'));

      expect(result.current).toEqual({ initial: 'config' });
    });

    it('should return empty object for unregistered plugin', () => {
      const { result } = renderHook(() => usePluginConfigReactive('unregistered'));

      expect(result.current).toEqual({});
    });
  });

  describe('Config Change Callback', () => {
    it('should call onConfigChange when config changes', async () => {
      mockPluginManager.register({
        manifest: { id: 'test-plugin', name: 'Test', version: '1.0.0' },
        initialize: vi.fn(),
      });
      mockPluginManager.setPluginConfig('test-plugin', { old: 'value' });

      const onConfigChange = vi.fn();
      renderHook(() => usePluginConfigReactive('test-plugin', onConfigChange));

      act(() => {
        mockPluginManager.setPluginConfig('test-plugin', { new: 'value' });
      });

      await waitFor(() => {
        expect(onConfigChange).toHaveBeenCalledWith({ new: 'value' }, { old: 'value' });
      });
    });

    it('should not call onConfigChange when config is the same', async () => {
      mockPluginManager.register({
        manifest: { id: 'test-plugin', name: 'Test', version: '1.0.0' },
        initialize: vi.fn(),
      });
      mockPluginManager.setPluginConfig('test-plugin', { key: 'value' });

      const onConfigChange = vi.fn();
      renderHook(() => usePluginConfigReactive('test-plugin', onConfigChange));

      act(() => {
        mockPluginManager.setPluginConfig('test-plugin', { key: 'value' });
      });

      expect(onConfigChange).not.toHaveBeenCalled();
    });

    it('should handle onConfigChange errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockPluginManager.register({
        manifest: { id: 'test-plugin', name: 'Test', version: '1.0.0' },
        initialize: vi.fn(),
      });
      mockPluginManager.setPluginConfig('test-plugin', { old: 'value' });

      const onConfigChange = vi.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });

      renderHook(() => usePluginConfigReactive('test-plugin', onConfigChange));

      act(() => {
        mockPluginManager.setPluginConfig('test-plugin', { new: 'value' });
      });

      expect(onConfigChange).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Without Callback', () => {
    it('should work without onConfigChange callback', async () => {
      mockPluginManager.register({
        manifest: { id: 'test-plugin', name: 'Test', version: '1.0.0' },
        initialize: vi.fn(),
      });

      const { result } = renderHook(() => usePluginConfigReactive('test-plugin'));

      act(() => {
        mockPluginManager.setPluginConfig('test-plugin', { updated: 'config' });
      });

      await waitFor(() => {
        expect(result.current).toEqual({ updated: 'config' });
      });
    });
  });

  describe('Subscription Cleanup', () => {
    it('should unsubscribe on unmount', () => {
      mockPluginManager.register({
        manifest: { id: 'test-plugin', name: 'Test', version: '1.0.0' },
        initialize: vi.fn(),
      });

      const { unmount } = renderHook(() => usePluginConfigReactive('test-plugin'));

      unmount();

      const listener = vi.fn();
      const unsubscribe = mockPluginManager.subscribeToPluginConfig('test-plugin', listener);
      expect(listener).toHaveBeenCalledTimes(1);
      unsubscribe();
    });
  });
});

describe('useAllPluginConfigs', () => {
  let mockPluginManager: PluginManagerImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPluginManager = createMockPluginManager();
    mockUsePluginFramework.mockReturnValue({
      pluginManager: mockPluginManager,
      loading: false,
      error: null,
      getExtensions: vi.fn().mockReturnValue([]),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return empty array initially', () => {
      const { result } = renderHook(() => useAllPluginConfigs());

      expect(result.current).toEqual([]);
    });
  });

  describe('Config Change Tracking', () => {
    it('should track config changes from any plugin', async () => {
      mockPluginManager.register({
        manifest: { id: 'plugin-a', name: 'Plugin A', version: '1.0.0' },
        initialize: vi.fn(),
      });

      const { result } = renderHook(() => useAllPluginConfigs());

      act(() => {
        mockPluginManager.setPluginConfig('plugin-a', { key: 'value' });
      });

      await waitFor(() => {
        expect(result.current.length).toBe(1);
        expect(result.current[0].pluginId).toBe('plugin-a');
        expect(result.current[0].config).toEqual({ key: 'value' });
      });
    });

    it('should track changes from multiple plugins', async () => {
      mockPluginManager.register({
        manifest: { id: 'plugin-a', name: 'Plugin A', version: '1.0.0' },
        initialize: vi.fn(),
      });
      mockPluginManager.register({
        manifest: { id: 'plugin-b', name: 'Plugin B', version: '1.0.0' },
        initialize: vi.fn(),
      });

      const { result } = renderHook(() => useAllPluginConfigs());

      act(() => {
        mockPluginManager.setPluginConfig('plugin-a', { a: 1 });
        mockPluginManager.setPluginConfig('plugin-b', { b: 2 });
      });

      await waitFor(() => {
        expect(result.current.length).toBe(2);
      });
    });

    it('should include timestamp in config change entries', async () => {
      mockPluginManager.register({
        manifest: { id: 'plugin-a', name: 'Plugin A', version: '1.0.0' },
        initialize: vi.fn(),
      });

      const { result } = renderHook(() => useAllPluginConfigs());

      const before = Date.now();
      act(() => {
        mockPluginManager.setPluginConfig('plugin-a', { key: 'value' });
      });
      const after = Date.now();

      await waitFor(() => {
        expect(result.current[0].timestamp).toBeGreaterThanOrEqual(before);
        expect(result.current[0].timestamp).toBeLessThanOrEqual(after);
      });
    });

    it('should limit stored changes to last 100', async () => {
      mockPluginManager.register({
        manifest: { id: 'plugin-a', name: 'Plugin A', version: '1.0.0' },
        initialize: vi.fn(),
      });

      const { result } = renderHook(() => useAllPluginConfigs());

      act(() => {
        for (let i = 0; i < 110; i++) {
          mockPluginManager.setPluginConfig('plugin-a', { iteration: i });
        }
      });

      await waitFor(() => {
        expect(result.current.length).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Subscription Cleanup', () => {
    it('should unsubscribe on unmount', () => {
      mockPluginManager.register({
        manifest: { id: 'plugin-a', name: 'Plugin A', version: '1.0.0' },
        initialize: vi.fn(),
      });

      const { result, unmount } = renderHook(() => useAllPluginConfigs());

      act(() => {
        mockPluginManager.setPluginConfig('plugin-a', { before: 'unmount' });
      });

      unmount();

      act(() => {
        mockPluginManager.setPluginConfig('plugin-a', { after: 'unmount' });
      });

      expect(result.current.length).toBe(1);
    });
  });

  describe('Multiple Hooks', () => {
    it('should work with multiple hook instances', async () => {
      mockPluginManager.register({
        manifest: { id: 'plugin-a', name: 'Plugin A', version: '1.0.0' },
        initialize: vi.fn(),
      });

      const { result: result1 } = renderHook(() => useAllPluginConfigs());
      const { result: result2 } = renderHook(() => useAllPluginConfigs());

      act(() => {
        mockPluginManager.setPluginConfig('plugin-a', { key: 'value' });
      });

      await waitFor(() => {
        expect(result1.current.length).toBe(1);
        expect(result2.current.length).toBe(1);
      });
    });
  });
});
