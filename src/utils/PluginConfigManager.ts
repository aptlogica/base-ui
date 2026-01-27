interface PluginConfig {
  id: string;
  path?: string;
  manifestUrl?: string;
  enabled: boolean;
  config: Record<string, any>;
}

interface PluginsConfig {
  plugins: {
    builtin: PluginConfig[];
    external: PluginConfig[];
  };
  settings: {
    autoLoadPlugins: boolean;
    allowExternalPlugins: boolean;
    pluginTimeout: number;
    developmentMode: boolean;
  };
}

export class PluginConfigManager {
  private config: PluginsConfig | null = null;
  private readonly configPath: string;

  constructor(configPath: string = '/config/plugins.json') {
    this.configPath = configPath;
  }

  async loadConfig(): Promise<PluginsConfig> {
    try {
      const response = await fetch(this.configPath);
      this.config = await response.json();
      return this.config!;
    } catch (error) {
      console.error('Failed to load plugin configuration:', error);
      // Return default configuration
      this.config = this.getDefaultConfig();
      return this.config;
    }
  }

  getConfig(): PluginsConfig | null {
    return this.config;
  }

  getPluginConfig(pluginId: string): Record<string, any> {
    if (!this.config) return {};

    // Check builtin plugins first
    const builtinPlugin = this.config.plugins.builtin.find(p => p.id === pluginId);
    if (builtinPlugin) {
      return builtinPlugin.config || {};
    }

    // Check external plugins
    const externalPlugin = this.config.plugins.external.find(p => p.id === pluginId);
    if (externalPlugin) {
      return externalPlugin.config || {};
    }

    return {};
  }

  updatePluginConfig(pluginId: string, newConfig: Record<string, any>): void {
    if (!this.config) return;

    // Update builtin plugin config
    const builtinPlugin = this.config.plugins.builtin.find(p => p.id === pluginId);
    if (builtinPlugin) {
      builtinPlugin.config = { ...builtinPlugin.config, ...newConfig };
      this.saveConfig();
      return;
    }

    // Update external plugin config
    const externalPlugin = this.config.plugins.external.find(p => p.id === pluginId);
    if (externalPlugin) {
      externalPlugin.config = { ...externalPlugin.config, ...newConfig };
      this.saveConfig();
    }
  }

  isPluginEnabled(pluginId: string): boolean {
    if (!this.config) return false;

    const builtinPlugin = this.config.plugins.builtin.find(p => p.id === pluginId);
    if (builtinPlugin) return builtinPlugin.enabled;

    const externalPlugin = this.config.plugins.external.find(p => p.id === pluginId);
    if (externalPlugin) return externalPlugin.enabled;

    return false;
  }

  setPluginEnabled(pluginId: string, enabled: boolean): void {
    if (!this.config) return;

    const builtinPlugin = this.config.plugins.builtin.find(p => p.id === pluginId);
    if (builtinPlugin) {
      builtinPlugin.enabled = enabled;
      this.saveConfig();
      return;
    }

    const externalPlugin = this.config.plugins.external.find(p => p.id === pluginId);
    if (externalPlugin) {
      externalPlugin.enabled = enabled;
      this.saveConfig();
    }
  }

  private async saveConfig(): Promise<void> {
    if (!this.config) return;

    try {
      // In a real app, this would save to a backend API
      localStorage.setItem('pluginConfig', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save plugin configuration:', error);
    }
  }

  private getDefaultConfig(): PluginsConfig {
    return {
      plugins: {
        builtin: [
          {
            id: 'navigation',
            enabled: true,
            config: {
              menuPosition: 'top',
              showIcons: true,
              theme: 'auto',
              maxItems: 10
            }
          },
          {
            id: 'dashboard-widgets',
            enabled: true,
            config: {
              gridColumns: 3,
              autoRefresh: true,
              refreshInterval: 30,
              enableAnimations: true
            }
          }
        ],
        external: []
      },
      settings: {
        autoLoadPlugins: true,
        allowExternalPlugins: true,
        pluginTimeout: 10000,
        developmentMode: false
      }
    };
  }
}
