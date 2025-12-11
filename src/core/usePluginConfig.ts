import { useState, useEffect, useCallback } from 'react';
import { usePluginFramework } from './PluginFrameworkContext';
import { PluginManagerImpl } from './PluginManager';

export const usePluginConfig = (pluginId: string) => {
  const { pluginManager } = usePluginFramework();
  const [config, setConfig] = useState<any>(pluginManager.getPluginConfig(pluginId));
  
  useEffect(() => {
    // Subscribe to configuration changes for this specific plugin
    const unsubscribe = (pluginManager as PluginManagerImpl).subscribeToPluginConfig(
      pluginId,
      (newConfig) => {
        setConfig(newConfig);
      }
    );

    return unsubscribe;
  }, [pluginManager, pluginId]);

  // const updateConfig = (newConfig: any) => {
  //   pluginManager.setPluginConfig(pluginId, newConfig);
  //   setConfig(newConfig);
  // };

  const updateConfig = useCallback((newConfig: any) => {
    pluginManager.setPluginConfig(pluginId, newConfig);
    // No need to call setConfig here since the subscription will handle it
  }, [pluginManager, pluginId]);

  return [config, updateConfig] as const;
};

// Hook for plugins to react to their own configuration changes
export const usePluginConfigReactive = (pluginId: string, onConfigChange?: (newConfig: any, oldConfig: any) => void) => {
  const { pluginManager } = usePluginFramework();
  const [config, setConfig] = useState<any>(() => pluginManager.getPluginConfig(pluginId));

  useEffect(() => {
    let previousConfig = config;
    
    const unsubscribe = (pluginManager as PluginManagerImpl).subscribeToPluginConfig(
      pluginId,
      (newConfig) => {
        const oldConfig = previousConfig;
        setConfig(newConfig);
        previousConfig = newConfig;
        
        if (onConfigChange && JSON.stringify(newConfig) !== JSON.stringify(oldConfig)) {
          try {
            onConfigChange(newConfig, oldConfig);
          } catch (error) {
            console.error(`Error in config change handler for plugin ${pluginId}:`, error);
          }
        }
      }
    );

    return unsubscribe;
  }, [pluginManager, pluginId, onConfigChange]);

  return config;
};

// Hook for global configuration monitoring
export const useAllPluginConfigs = () => {
  const { pluginManager } = usePluginFramework();
  const [configChanges, setConfigChanges] = useState<Array<{ pluginId: string; config: any; timestamp: number }>>([]);

  useEffect(() => {
    const unsubscribe = (pluginManager as PluginManagerImpl).subscribeToAllConfigChanges(
      (pluginId, config) => {
        setConfigChanges(prev => [
          ...prev.slice(-99), // Keep last 100 changes
          {
            pluginId,
            config,
            timestamp: Date.now()
          }
        ]);
      }
    );

    return unsubscribe;
  }, [pluginManager]);

  return configChanges;
};
