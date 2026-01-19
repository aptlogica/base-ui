/**
 * Plugin manifest that describes a plugin and its requirements
 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: Record<string, string>; // plugin ID -> version requirement (semver)
  configSchema?: Record<string, any>; // JSON Schema for plugin configuration
}

/**
 * Core Plugin interface that all plugins must implement
 */
export interface Plugin {
  manifest: PluginManifest;
  initialize: (api: PluginAPI, config: any) => Promise<void> | void;
  activate?: () => Promise<void> | void;
  deactivate?: () => Promise<void> | void;
  onConfigurationUpdate?: (newConfig: any, oldConfig: any) => Promise<void> | void;
}

/**
 * API provided to plugins to interact with the framework
 */
export interface PluginAPI {
  registerExtensionPoint: (pointId: string, schema?: Record<string, any>) => void;
  registerExtension: (pointId: string, extension: any) => void;
  getPlugin: (pluginId: string) => Plugin | null;
  getPluginConfig: () => any;
  getService: <T>(serviceId: string) => T | null;
  registerService: <T>(serviceId: string, service: T) => void;
}

/**
 * Plugin Manager interface for managing plugins
 */
export interface PluginManager {
  register: (plugin: Plugin) => void;
  load: (pluginId: string) => Promise<void>;
  unload: (pluginId: string) => Promise<void>;
  getPlugin: (pluginId: string) => Plugin | null;
  getLoadedPlugins: () => Plugin[];
  resolvePluginDependencies: (plugin: Plugin) => boolean;
  validatePluginCompatibility: (plugin: Plugin) => boolean;
  setPluginConfig: (pluginId: string, config: any) => void;
  getPluginConfig: (pluginId: string) => any;
  getExtensions: (pointId: string) => any[];
  registerCoreExtensionPoint: (pointId: string, schema?: Record<string, any>) => void;
  registerCoreExtension: (pointId: string, extension: any) => void;
  subscribeToPluginConfig?: (pluginId: string, listener: (config: any) => void) => () => void;
  subscribeToAllConfigChanges?: (listener: (pluginId: string, config: any) => void) => () => void;
  subscribeToExtensionChanges?: (pointId: string, listener: () => void) => () => void;
}
