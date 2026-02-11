import { Plugin } from './types';

class PluginRegistry {
  private static instance: PluginRegistry;
  private readonly plugins: Map<string, Plugin> = new Map();

  private constructor() { }

  static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  registerPlugin(plugin: Plugin): void {
    if (this.plugins.has(plugin.manifest.id)) {
      return;
    }

    this.plugins.set(plugin.manifest.id, plugin);
  }

  getRegisteredPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }
}

export const registerPlugin = (plugin: Plugin): void => {
  PluginRegistry.getInstance().registerPlugin(plugin);
};

export const getRegisteredPlugins = (): Plugin[] => {
  return PluginRegistry.getInstance().getRegisteredPlugins();
};
