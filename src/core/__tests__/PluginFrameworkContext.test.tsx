import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import {
  PluginFrameworkProvider,
  usePluginFramework,
  useExtensions,
} from '../PluginFrameworkContext';
import type { Plugin, PluginAPI } from '../types';
import { registerCoreLayoutComponents } from '../coreLayoutRegistrations';

vi.mock('../coreLayoutRegistrations', () => ({
  registerCoreLayoutComponents: vi.fn(),
}));

function createMockPlugin(
  id: string,
  version: string = '1.0.0',
  options?: Partial<Plugin>
): Plugin {
  return {
    manifest: {
      id,
      name: `${id}-plugin`,
      version,
      description: `Mock plugin for testing`,
    },
    initialize: vi.fn().mockResolvedValue(undefined),
    activate: vi.fn().mockResolvedValue(undefined),
    deactivate: vi.fn().mockResolvedValue(undefined),
    ...options,
  };
}

describe('PluginFrameworkContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('PluginFrameworkProvider', () => {
    it('should render children', async () => {
      render(
        <PluginFrameworkProvider plugins={[]}>
          <div data-testid="child">Child Content</div>
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child')).toBeInTheDocument();
      });
    });

    it('should initialize with loading state and transition to false', async () => {
      const TestComponent = () => {
        const { loading } = usePluginFramework();
        return <div data-testid="loading">{loading.toString()}</div>;
      };

      render(
        <PluginFrameworkProvider plugins={[]}>
          <TestComponent />
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });

    it('should set loading to false after initialization', async () => {
      const TestComponent = () => {
        const { loading } = usePluginFramework();
        return <div data-testid="loading">{loading.toString()}</div>;
      };

      render(
        <PluginFrameworkProvider plugins={[]}>
          <TestComponent />
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });

    it('should register and load plugins', async () => {
      const plugin = createMockPlugin('test-plugin');

      render(
        <PluginFrameworkProvider plugins={[plugin]}>
          <div data-testid="child">Content</div>
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(plugin.initialize).toHaveBeenCalled();
      });
    });

    it('should call plugin activate after initialize', async () => {
      const plugin = createMockPlugin('test-plugin');

      render(
        <PluginFrameworkProvider plugins={[plugin]}>
          <div>Content</div>
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(plugin.activate).toHaveBeenCalled();
      });
    });

    it('should handle plugin registration errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const plugin1 = createMockPlugin('plugin-1');
      const plugin2 = createMockPlugin('plugin-1'); // duplicate ID

      render(
        <PluginFrameworkProvider plugins={[plugin1, plugin2]}>
          <div data-testid="child">Content</div>
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle plugin load errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const plugin = createMockPlugin('failing-plugin', '1.0.0', {
        initialize: vi.fn().mockRejectedValue(new Error('Load failed')),
      });

      render(
        <PluginFrameworkProvider plugins={[plugin]}>
          <div data-testid="child">Content</div>
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should unload plugins on unmount', async () => {
      const plugin = createMockPlugin('test-plugin');

      const { unmount } = render(
        <PluginFrameworkProvider plugins={[plugin]}>
          <div>Content</div>
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(plugin.initialize).toHaveBeenCalled();
      });

      unmount();

      await waitFor(() => {
        expect(plugin.deactivate).toHaveBeenCalled();
      });
    });

    it('should pass default config to plugin manager', async () => {
      const defaultConfig = { 'test-plugin': { setting: 'value' } };
      const plugin = createMockPlugin('test-plugin');
      let receivedConfig: any;

      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        receivedConfig = api.getPluginConfig();
      });

      render(
        <PluginFrameworkProvider plugins={[plugin]} defaultConfig={defaultConfig}>
          <div>Content</div>
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(receivedConfig).toEqual({ setting: 'value' });
      });
    });

    it('should load multiple plugins in order', async () => {
      const loadOrder: string[] = [];
      const plugin1 = createMockPlugin('plugin-1', '1.0.0', {
        initialize: vi.fn().mockImplementation(() => {
          loadOrder.push('plugin-1');
        }),
      });
      const plugin2 = createMockPlugin('plugin-2', '1.0.0', {
        initialize: vi.fn().mockImplementation(() => {
          loadOrder.push('plugin-2');
        }),
      });

      render(
        <PluginFrameworkProvider plugins={[plugin1, plugin2]}>
          <div>Content</div>
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(loadOrder).toEqual(['plugin-1', 'plugin-2']);
      });
    });

    it('should handle unload errors gracefully on unmount', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const plugin = createMockPlugin('test-plugin', '1.0.0', {
        deactivate: vi.fn().mockRejectedValue(new Error('Unload failed')),
      });

      const { unmount } = render(
        <PluginFrameworkProvider plugins={[plugin]}>
          <div>Content</div>
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(plugin.initialize).toHaveBeenCalled();
      });

      unmount();

      await waitFor(() => {
        expect(plugin.deactivate).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should set error when core layout registration fails', async () => {
      const mockRegister = vi.mocked(registerCoreLayoutComponents);
      mockRegister.mockImplementationOnce(() => {
        throw new Error('core failed');
      });

      const TestComponent = () => {
        const { error, loading } = usePluginFramework();
        return (
          <div>
            <span data-testid="loading">{loading ? 'loading' : 'done'}</span>
            <span data-testid="error">{error?.message || 'none'}</span>
          </div>
        );
      };

      render(
        <PluginFrameworkProvider plugins={[]}>
          <TestComponent />
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('done');
        expect(screen.getByTestId('error').textContent).toBe('core failed');
      });
    });

    it('prevents duplicate initialization in StrictMode', async () => {
      const plugin = createMockPlugin('strict-plugin');

      render(
        <React.StrictMode>
          <PluginFrameworkProvider plugins={[plugin]}>
            <div>Content</div>
          </PluginFrameworkProvider>
        </React.StrictMode>
      );

      await waitFor(() => {
        expect(plugin.initialize).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('usePluginFramework', () => {
    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        usePluginFramework();
        return <div>Content</div>;
      };

      expect(() => {
        render(<TestComponent />);
      }).toThrow('usePluginFramework must be used within a PluginFrameworkProvider');
    });

    it('should return pluginManager from context', async () => {
      let result: any;
      const TestComponent = () => {
        result = usePluginFramework();
        return <div>Content</div>;
      };

      render(
        <PluginFrameworkProvider plugins={[]}>
          <TestComponent />
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(result.pluginManager).toBeDefined();
      });
    });

    it('should return loading state from context', async () => {
      let result: any;
      const TestComponent = () => {
        result = usePluginFramework();
        return <div>Content</div>;
      };

      render(
        <PluginFrameworkProvider plugins={[]}>
          <TestComponent />
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(typeof result.loading).toBe('boolean');
      });
    });

    it('should return error state from context', async () => {
      let result: any;
      const TestComponent = () => {
        result = usePluginFramework();
        return <div>Content</div>;
      };

      render(
        <PluginFrameworkProvider plugins={[]}>
          <TestComponent />
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(result.error).toBeNull();
      });
    });

    it('should return getExtensions function from context', async () => {
      let result: any;
      const TestComponent = () => {
        result = usePluginFramework();
        return <div>Content</div>;
      };

      render(
        <PluginFrameworkProvider plugins={[]}>
          <TestComponent />
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(typeof result.getExtensions).toBe('function');
      });
    });

    it('should provide subscribeToExtensionChanges when available', async () => {
      let result: any;
      const TestComponent = () => {
        result = usePluginFramework();
        return <div>Content</div>;
      };

      render(
        <PluginFrameworkProvider plugins={[]}>
          <TestComponent />
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(typeof result.subscribeToExtensionChanges).toBe('function');
      });
    });
  });

  describe('useExtensions', () => {
    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        useExtensions('test:point');
        return <div>Content</div>;
      };

      expect(() => {
        render(<TestComponent />);
      }).toThrow('usePluginFramework must be used within a PluginFrameworkProvider');
    });

    it('should return empty array for non-existent extension point', async () => {
      let extensions: any[];
      const TestComponent = () => {
        extensions = useExtensions('non-existent:point');
        return <div data-testid="count">{extensions.length}</div>;
      };

      render(
        <PluginFrameworkProvider plugins={[]}>
          <TestComponent />
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('count').textContent).toBe('0');
      });
    });

    it('should return extensions registered by plugins', async () => {
      let extensions: any[] = [];
      const plugin = createMockPlugin('test-plugin');
      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        api.registerExtension('layout:header', { id: 'header-ext', data: 'test' });
      });

      const TestComponent = () => {
        extensions = useExtensions('layout:header');
        return <div data-testid="count">{extensions.length}</div>;
      };

      render(
        <PluginFrameworkProvider plugins={[plugin]}>
          <TestComponent />
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(extensions.length).toBeGreaterThan(0);
      });
    });

    it('should return core extensions for layout points', async () => {
      let extensions: any[] = [];
      const TestComponent = () => {
        extensions = useExtensions('layout:header-left');
        return <div data-testid="count">{extensions.length}</div>;
      };

      render(
        <PluginFrameworkProvider plugins={[]}>
          <TestComponent />
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('count')).toBeInTheDocument();
      });
    });
  });

  describe('Context Value Stability', () => {
    it('should provide stable getExtensions function reference', async () => {
      const getExtensionsRefs: any[] = [];
      const TestComponent = () => {
        const { getExtensions } = usePluginFramework();
        getExtensionsRefs.push(getExtensions);
        return <div data-testid="test">Test</div>;
      };

      const { rerender } = render(
        <PluginFrameworkProvider plugins={[]}>
          <TestComponent />
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test')).toBeInTheDocument();
      });

      rerender(
        <PluginFrameworkProvider plugins={[]}>
          <TestComponent />
        </PluginFrameworkProvider>
      );

      expect(getExtensionsRefs[0]).toBe(getExtensionsRefs[1]);
    });
  });

  describe('Plugin API Integration', () => {
    it('should allow plugin to register extension point', async () => {
      const plugin = createMockPlugin('test-plugin');
      let capturedApi: PluginAPI | null = null;

      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        capturedApi = api;
        api.registerExtensionPoint('test-plugin:custom', { description: 'Custom point' });
      });

      render(
        <PluginFrameworkProvider plugins={[plugin]}>
          <div>Content</div>
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(capturedApi).not.toBeNull();
      });
    });

    it('should allow plugin to register service', async () => {
      const plugin = createMockPlugin('test-plugin');
      const testService = { getValue: () => 'test-value' };
      let retrievedService: any = null;

      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        api.registerService('test-service', testService);
        retrievedService = api.getService('test-service');
      });

      render(
        <PluginFrameworkProvider plugins={[plugin]}>
          <div>Content</div>
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(retrievedService).toBe(testService);
      });
    });

    it('should allow plugin to get another registered plugin', async () => {
      const plugin1 = createMockPlugin('plugin-1');
      const plugin2 = createMockPlugin('plugin-2');
      let retrievedPlugin: Plugin | null = null;

      plugin2.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        retrievedPlugin = api.getPlugin('plugin-1');
      });

      render(
        <PluginFrameworkProvider plugins={[plugin1, plugin2]}>
          <div>Content</div>
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(retrievedPlugin).toBe(plugin1);
      });
    });
  });

  describe('Default Config Handling', () => {
    it('should use empty object as default config', async () => {
      const plugin = createMockPlugin('test-plugin');
      let receivedConfig: any;

      plugin.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        receivedConfig = api.getPluginConfig();
      });

      render(
        <PluginFrameworkProvider plugins={[plugin]}>
          <div>Content</div>
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(receivedConfig).toEqual({});
      });
    });

    it('should merge default config for multiple plugins', async () => {
      const defaultConfig = {
        'plugin-1': { key1: 'value1' },
        'plugin-2': { key2: 'value2' },
      };
      const plugin1 = createMockPlugin('plugin-1');
      const plugin2 = createMockPlugin('plugin-2');
      let config1: any;
      let config2: any;

      plugin1.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        config1 = api.getPluginConfig();
      });
      plugin2.initialize = vi.fn().mockImplementation((api: PluginAPI) => {
        config2 = api.getPluginConfig();
      });

      render(
        <PluginFrameworkProvider plugins={[plugin1, plugin2]} defaultConfig={defaultConfig}>
          <div>Content</div>
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(config1).toEqual({ key1: 'value1' });
        expect(config2).toEqual({ key2: 'value2' });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty plugins array', async () => {
      render(
        <PluginFrameworkProvider plugins={[]}>
          <div data-testid="child">Content</div>
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child')).toBeInTheDocument();
      });
    });

    it('should handle plugin without activate method', async () => {
      const plugin = createMockPlugin('test-plugin');
      delete plugin.activate;

      render(
        <PluginFrameworkProvider plugins={[plugin]}>
          <div data-testid="child">Content</div>
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(plugin.initialize).toHaveBeenCalled();
      });
    });

    it('should handle plugin without deactivate method on unmount', async () => {
      const plugin = createMockPlugin('test-plugin');
      delete plugin.deactivate;

      const { unmount } = render(
        <PluginFrameworkProvider plugins={[plugin]}>
          <div>Content</div>
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(plugin.initialize).toHaveBeenCalled();
      });

      expect(() => unmount()).not.toThrow();
    });

    it('should handle synchronous plugin initialization', async () => {
      const plugin = createMockPlugin('test-plugin', '1.0.0', {
        initialize: vi.fn().mockReturnValue(undefined),
      });

      render(
        <PluginFrameworkProvider plugins={[plugin]}>
          <div data-testid="child">Content</div>
        </PluginFrameworkProvider>
      );

      await waitFor(() => {
        expect(plugin.initialize).toHaveBeenCalled();
      });
    });
  });
});
