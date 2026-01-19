import { create } from 'zustand';
import { Workspace } from '../types/api.types';

interface PluginState {
  flyoutOpen: boolean;
  currentPlugin: string | null;
  selectedWorkspace: Workspace | null;
  
  // Actions
  openFlyout: (pluginId: string) => void;
  closeFlyout: () => void;
  toggleFlyout: (pluginId?: string) => void;
  setSelectedWorkspace: (workspace: Workspace | null) => void;
}

// Constant flyout width (previously stored in state but never changed)
export const FLYOUT_WIDTH = 272;

export const usePluginStore = create<PluginState>((set, get) => ({
  flyoutOpen: false,
  currentPlugin: null,
  selectedWorkspace: null,
  
  openFlyout: (pluginId: string) => {
    set({
      flyoutOpen: true,
      currentPlugin: pluginId,
    });
  },
  
  closeFlyout: () => {
    set({
      flyoutOpen: false,
      currentPlugin: null,
    });
  },
  
  toggleFlyout: (pluginId?: string) => {
    const { flyoutOpen, currentPlugin } = get();
    
    if (!flyoutOpen || (pluginId && pluginId !== currentPlugin)) {
      set({
        flyoutOpen: true,
        currentPlugin: pluginId || currentPlugin,
      });
    } else {
      set({
        flyoutOpen: false,
        currentPlugin: null,
      });
    }
  },
  
  setSelectedWorkspace: (workspace: Workspace | null) => {
    set({ selectedWorkspace: workspace });
  },
}));
