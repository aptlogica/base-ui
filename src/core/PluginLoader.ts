import { Plugin } from './types';

interface PluginModule {
  default: Plugin;
}

export const loadPlugin = async (url: string): Promise<Plugin> => {
  try {
    const module = await import(/* webpackIgnore: true */  /* @vite-ignore */ url) as PluginModule;
    return module.default;
  } catch (error) {
    console.error(`Failed to load plugin from ${url}:`, error);
    throw new Error(`Failed to load plugin from ${url}: ${error}`);
  }
};

export const loadPlugins = async (manifestUrls: string[]): Promise<Plugin[]> => {
  const pluginPromises = manifestUrls.map(async (url) => {
    try {
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
      const pluginUrl = `${baseUrl}plugin.js`;
      const plugin = await loadPlugin(pluginUrl);
      return plugin;
    } catch (error) {
      console.error(`Failed to load plugin manifest from ${url}:`, error);
      return null;
    }
  });
  
  const plugins = await Promise.all(pluginPromises);
  return plugins.filter((plugin): plugin is Plugin => plugin !== null);
};
