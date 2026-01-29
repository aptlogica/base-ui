import { Plugin, PluginAPI, PluginManager } from './types';
import { createMockSemver } from '../utils/createMockSemver'

// Try to import semver, fall back to mock implementation
let semver: any;
try {
  semver = require('semver');
} catch {
  console.warn('semver package not found, using mock implementation');
  semver = createMockSemver();
}

/**
 * Implementation of the PluginManager interface
 */
export class PluginManagerImpl implements PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private loadedPlugins: Set<string> = new Set();
  private extensionPoints: Map<string, Record<string, any>> = new Map();
  private extensions: Map<string, any[]> = new Map();
  private services: Map<string, any> = new Map();
  private pluginConfigs: Map<string, any> = new Map();
  private defaultConfig: Record<string, any> = {};
  private frameworkVersion: string = '1.0.0';
  private configListeners: Map<string, Set<(config: any) => void>> = new Map();
  private globalConfigListeners: Set<(pluginId: string, config: any) => void> = new Set();
  private extensionListeners: Map<string, Set<() => void>> = new Map();

  constructor(defaultConfig: Record<string, any> = {}) {
    this.defaultConfig = defaultConfig;
    this.registerCoreExtensionPoints();
  }

  private registerCoreExtensionPoints(): void {
    // Register core extension points that the framework provides
    this.extensionPoints.set('layout:header', {
      description: 'Header area of the application layout',
      order: { type: 'number', default: 100 }
    });
    
    this.extensionPoints.set('layout:footer', {
      description: 'Footer area of the application layout',
      order: { type: 'number', default: 100 }
    });
    
    this.extensionPoints.set('layout:sidebar', {
      description: 'Sidebar area of the application layout',
      order: { type: 'number', default: 100 }
    });
    
    this.extensionPoints.set('layout:overlay', {
      description: 'Overlay area for modals, notifications, etc.',
      order: { type: 'number', default: 1000 }
    });
    
    this.extensionPoints.set('page:homepage', {
      description: 'Homepage content area',
      order: { type: 'number', default: 100 }
    });

    this.extensionPoints.set('page:dashboard', {
      description: 'Dashboard page content area',
      order: { type: 'number', default: 100 }
    });

    this.extensionPoints.set('dashboard:widget', {
      description: 'Dashboard page content area',
      order: { type: 'number', default: 100 }
    });
    
    this.extensionPoints.set('app:init', {
      description: 'Application initialization hooks',
      order: { type: 'number', default: 100 }
    });
    
    this.extensionPoints.set('app:settings', {
      description: 'Application settings page extensions',
      order: { type: 'number', default: 100 }
    });

    // New: view extension point for view plugins to render with a unified data host
    this.extensionPoints.set('view', {
      description: 'View rendering extension point (grid, kanban, calendar, etc.)',
      order: { type: 'number', default: 100 }
    });
  }
  
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.manifest.id)) {
      throw new Error(`Plugin ${plugin.manifest.id} is already registered`);
    }
    
    this.plugins.set(plugin.manifest.id, plugin);
    
    // Initialize config with defaults
    if (!this.pluginConfigs.has(plugin.manifest.id)) {
      this.pluginConfigs.set(
        plugin.manifest.id, 
        this.defaultConfig[plugin.manifest.id] || {}
      );
    }
  }

  // Public methods for core extension registration
  registerCoreExtensionPoint(pointId: string, schema?: Record<string, any>): void {
    const fullPointId = pointId.includes(':') ? pointId : `core:${pointId}`;
    this.extensionPoints.set(fullPointId, schema || {});
  }

  registerCoreExtension(pointId: string, extension: any): void {
    const fullPointId = pointId.includes(':') ? pointId : `core:${pointId}`;
    if (!this.extensions.has(fullPointId)) {
      this.extensions.set(fullPointId, []);
    }
    const extensionWithId = {
      ...extension,
      _pluginId: 'core',
      _extensionId: extension.id || `core-${Date.now()}`
    };
    this.extensions.get(fullPointId)!.push(extensionWithId);
    this.notifyExtensionListeners(fullPointId);
  }
  
  async load(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not registered`);
    }
    
    if (this.loadedPlugins.has(pluginId)) {
      return; // Already loaded
    }
    
    // Check dependencies and compatibility
    if (!this.resolvePluginDependencies(plugin)) {
      throw new Error(`Failed to resolve dependencies for plugin ${pluginId}`);
    }
    
    if (!this.validatePluginCompatibility(plugin)) {
      throw new Error(`Plugin ${pluginId} is not compatible with the current framework version`);
    }
    
    // Load dependencies first
    if (plugin.manifest.dependencies) {
      for (const depId of Object.keys(plugin.manifest.dependencies)) {
        if (!this.loadedPlugins.has(depId)) {
          await this.load(depId);
        }
      }
    }
    
    // Create plugin API instance for this plugin
    const api: PluginAPI = {
      registerExtensionPoint: (pointId, schema) => {
        const fullPointId = pointId.includes(':') ? pointId : `${pluginId}:${pointId}`;
        this.extensionPoints.set(fullPointId, schema || {});
      },
      registerExtension: (pointId, extension) => {
        const fullPointId = pointId.includes(':') ? pointId : `${pluginId}:${pointId}`;
        
        // Check if extension point exists, if not, register it automatically
        if (!this.extensionPoints.has(fullPointId)) {
          this.extensionPoints.set(fullPointId, {});
        }
        
        if (!this.extensions.has(fullPointId)) {
          this.extensions.set(fullPointId, []);
        }
        
        // Add plugin ID to the extension for tracking
        const extensionWithId = {
          ...extension,
          _pluginId: pluginId,
          _extensionId: extension.id || `${pluginId}-${Date.now()}`
        };
        
        this.extensions.get(fullPointId)!.push(extensionWithId);
        this.notifyExtensionListeners(fullPointId);
      },
      getPlugin: (id) => this.getPlugin(id),
      getPluginConfig: () => this.getPluginConfig(pluginId),
      getService: <T>(serviceId: string): T | null => {
        return this.services.get(serviceId) as T || null;
      },
      registerService: <T>(serviceId: string, service: T): void => {
        if (this.services.has(serviceId)) {
        }
        this.services.set(serviceId, service);
      }
    };
    
    // Initialize the plugin
    await plugin.initialize(api, this.getPluginConfig(pluginId));
    
    // Activate if the plugin has an activate method
    if (plugin.activate) {
      await plugin.activate();
    }
    
    this.loadedPlugins.add(pluginId);
  }
  
  async unload(pluginId: string): Promise<void> {
    if (!this.loadedPlugins.has(pluginId)) {
      return; // Not loaded
    }
    
    const plugin = this.plugins.get(pluginId)!;
    
    // Check if other loaded plugins depend on this one
    for (const [id, p] of this.plugins.entries()) {
      if (this.loadedPlugins.has(id) && 
          p.manifest.dependencies?.[pluginId]) {
        throw new Error(`Cannot unload plugin ${pluginId} because plugin ${id} depends on it`);
      }
    }
    
    // Deactivate the plugin
    if (plugin.deactivate) {
      await plugin.deactivate();
    }
    
    // Remove extensions provided by this plugin
    for (const [pointId, extensions] of this.extensions.entries()) {
      const filteredExtensions = extensions.filter(ext => ext._pluginId !== pluginId);
      if (filteredExtensions.length !== extensions.length) {
        this.extensions.set(pointId, filteredExtensions);
      }
    }
    
    // Remove extension points provided by this plugin (but not core ones)
    for (const pointId of this.extensionPoints.keys()) {
      if (pointId.startsWith(`${pluginId}:`)) {
        this.extensionPoints.delete(pointId);
      }
    }
 
    this.loadedPlugins.delete(pluginId);
  }
  
  getPlugin(pluginId: string): Plugin | null {
    return this.plugins.get(pluginId) || null;
  }
  
  getLoadedPlugins(): Plugin[] {
    return Array.from(this.loadedPlugins).map(id => this.plugins.get(id)!);
  }
  
  resolvePluginDependencies(plugin: Plugin): boolean {
    if (!plugin.manifest.dependencies) {
      return true;
    }
    
    for (const [depId, versionReq] of Object.entries(plugin.manifest.dependencies)) {
      const dependency = this.plugins.get(depId);
      if (!dependency) {
        console.error(`Missing dependency: ${depId} for plugin ${plugin.manifest.id}`);
        return false;
      }
      
      if (!semver.satisfies(dependency.manifest.version, versionReq)) {
        console.error(
          `Version mismatch for dependency ${depId}: required ${versionReq}, got ${dependency.manifest.version}`
        );
        return false;
      }
    }
    
    return true;
  }
  
  validatePluginCompatibility(plugin: Plugin): boolean {
    // This can be extended to check framework version compatibility
    // For now, we're just checking if the plugin has a frameworkVersion property
    const requiredFrameworkVersion = (plugin.manifest as any).frameworkVersion;
    if (requiredFrameworkVersion && !semver.satisfies(this.frameworkVersion, requiredFrameworkVersion)) {
      console.error(
        `Framework version mismatch for plugin ${plugin.manifest.id}: ` +
        `required ${requiredFrameworkVersion}, got ${this.frameworkVersion}`
      );
      return false;
    }
    
    return true;
  }
  
  setPluginConfig(pluginId: string, config: any): void {
    // this.pluginConfigs.set(pluginId, config);
    const oldConfig = this.pluginConfigs.get(pluginId);
    this.pluginConfigs.set(pluginId, config);
    
    // Notify plugin-specific listeners
    const listeners = this.configListeners.get(pluginId);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(config);
        } catch (error) {
          console.error(`Error in config listener for plugin ${pluginId}:`, error);
        }
      });
  }

  // Notify global listeners
    this.globalConfigListeners.forEach(listener => {
      try {
        listener(pluginId, config);
      } catch (error) {
        console.error(`Error in global config listener:`, error);
      }
    });

    // If plugin is loaded, try to update its configuration dynamically
    if (this.loadedPlugins.has(pluginId)) {
      this.updatePluginConfiguration(pluginId, config, oldConfig);
    }
  }
  
  // Add subscription methods
  subscribeToPluginConfig(pluginId: string, listener: (config: any) => void): () => void {
    if (!this.configListeners.has(pluginId)) {
      this.configListeners.set(pluginId, new Set());
    }
    
    const listeners = this.configListeners.get(pluginId)!;
    listeners.add(listener);
    
    // Immediately call with current config
    const currentConfig = this.getPluginConfig(pluginId);
    try {
      listener(currentConfig);
    } catch (error) {
      console.error(`Error in initial config listener call for plugin ${pluginId}:`, error);
    }
    
    // Return unsubscribe function
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.configListeners.delete(pluginId);
      }
    };
  }
  
  subscribeToAllConfigChanges(listener: (pluginId: string, config: any) => void): () => void {
    this.globalConfigListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.globalConfigListeners.delete(listener);
    };
  }

  subscribeToExtensionChanges(pointId: string, listener: () => void): () => void {
    if (!this.extensionListeners.has(pointId)) {
      this.extensionListeners.set(pointId, new Set());
    }
    this.extensionListeners.get(pointId)!.add(listener);
    return () => {
      this.extensionListeners.get(pointId)!.delete(listener);
    };
  }

  private notifyExtensionListeners(pointId: string) {
    if (this.extensionListeners.has(pointId)) {
      this.extensionListeners.get(pointId)!.forEach(fn => fn());
    }
  }
  
  private async updatePluginConfiguration(pluginId: string, newConfig: any, oldConfig: any): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;
    
    // Check if plugin has a configuration update method
    if (typeof (plugin as any).onConfigurationUpdate === 'function') {
      try {
        await (plugin as any).onConfigurationUpdate(newConfig, oldConfig);
      } catch (error) {
        console.error(`Error updating configuration for plugin ${pluginId}:`, error);
      }
    }
    
    // Notify the plugin's API about the config change
    const pluginAPI = this.getPluginAPI(pluginId);
    if (pluginAPI && typeof (pluginAPI as any).onConfigUpdate === 'function') {
      try {
        await (pluginAPI as any).onConfigUpdate(newConfig, oldConfig);
      } catch (error) {
        console.error(`Error notifying plugin API about config change for ${pluginId}:`, error);
      }
    }
  }
  
  private getPluginAPI(pluginId: string): PluginAPI | null {
    // This would need to be implemented to store plugin API instances
    // For now, we'll return null and rely on the subscription system
    return null;
  }

  getPluginConfig(pluginId: string): any {
    return this.pluginConfigs.get(pluginId) || {};
  }
  
  getExtensions(pointId: string): any[] {
    // Removed route extension handling - route system was unnecessary
    if (pointId === 'view') {
      // gather all extensions registered as 'view' (with or without plugin prefix)
      const all: any[] = [];
      for (const [key, value] of this.extensions.entries()) {
        if (key.endsWith(':view') || key === 'view') {
          all.push(...value);
        }
      }
      return all;
    }
    const result = this.extensions.get(pointId) || [];
    // console.log(`[PluginManager] getExtensions(${pointId})`, { result, extensions: this.extensions });
    return result;
  }
}