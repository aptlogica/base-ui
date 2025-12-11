import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { Plugin, PluginManager } from './types';
import { PluginManagerImpl } from './PluginManager';

interface PluginFrameworkContextType {
  pluginManager: PluginManager;
  loading: boolean;
  error: Error | null;
  getExtensions: (pointId: string) => any[];
  subscribeToExtensionChanges?: (pointId: string, listener: () => void) => () => void;
}

const PluginFrameworkContext = createContext<PluginFrameworkContextType | null>(null);

interface PluginFrameworkProviderProps {
  children: ReactNode;
  plugins: Plugin[];
  defaultConfig?: Record<string, any>;
}

export const PluginFrameworkProvider: React.FC<PluginFrameworkProviderProps> = ({
  children,
  plugins,
  defaultConfig = {}
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pluginManager] = useState<PluginManager>(() => new PluginManagerImpl(defaultConfig));
   const effectRan = useRef(false);
  
  useEffect(() => {
    //To avoid running twice in dev mode
    if(effectRan.current){
      return;
    }

    effectRan.current = true;

    const initializePlugins = async () => {
      try {
        // Register all plugins
        plugins.forEach(plugin => {
          try {
            pluginManager.register(plugin);
          } catch (e) {
            console.error(`Failed to register plugin ${plugin.manifest.id}:`, e);
          }
        });
        
        // Load plugins in dependency order
        for (const plugin of plugins) {
          try {
            await pluginManager.load(plugin.manifest.id);
          } catch (e) {
            console.error(`Failed to load plugin ${plugin.manifest.id}:`, e);
          }
        }
        
        setLoading(false);
      } catch (e) {
        setError(e as Error);
        setLoading(false);
      }
    };
    
    initializePlugins();
    
    // Cleanup on unmount
    return () => {
      const unloadPlugins = async () => {
        for (const plugin of pluginManager.getLoadedPlugins()) {
          try {
            await pluginManager.unload(plugin.manifest.id);
          } catch (e) {
            console.error(`Failed to unload plugin ${plugin.manifest.id}:`, e);
          }
        }
      };
      
      unloadPlugins();
    };
  }, []);
  
  const getExtensions = (pointId: string) => {
    return (pluginManager as PluginManagerImpl).getExtensions(pointId);
  };
  
  const contextValue: PluginFrameworkContextType = {
    pluginManager,
    loading,
    error,
    getExtensions,
    ...(typeof pluginManager.subscribeToExtensionChanges === 'function' && {
      subscribeToExtensionChanges: pluginManager.subscribeToExtensionChanges.bind(pluginManager)
    })
  };
  
  return (
    <PluginFrameworkContext.Provider 
      value={contextValue}
    >
      {children}
    </PluginFrameworkContext.Provider>
  );
};

export const usePluginFramework = () => {
  const context = useContext(PluginFrameworkContext);
  if (!context) {
    throw new Error('usePluginFramework must be used within a PluginFrameworkProvider');
  }
  return context;
};

export const useExtensions = (pointId: string) => {
  const { getExtensions } = usePluginFramework();
  return getExtensions(pointId);
};
