import { create } from 'zustand';

interface PluginState {
  flyoutOpen: boolean;
  flyoutMode: 'floating' | 'layout';
  flyoutWidth: number;
  currentPlugin: string | null;
  isTransitioning: boolean;
  selectedWorkspace: any | null;
  
  // Actions
  openFlyout: (pluginId: string) => void;
  closeFlyout: () => void;
  setFlyoutMode: (mode: 'floating' | 'layout') => void;
  setFlyoutWidth: (width: number) => void;
  toggleFlyout: (pluginId?: string) => void;
  setTransitioning: (transitioning: boolean) => void;
  setSelectedWorkspace: (workspace: any | null) => void;
}

export const usePluginStore = create<PluginState>((set, get) => ({
  flyoutOpen: false,
  flyoutMode: 'layout',
  flyoutWidth: 272,
  currentPlugin: null,
  isTransitioning: false,
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
  
  setFlyoutMode: (mode: 'floating' | 'layout') => {
    const { flyoutMode } = get();
    if (flyoutMode !== mode) {
      set({ isTransitioning: true });
      
      // Add a small delay for smooth transition
      setTimeout(() => {
        set({ 
          flyoutMode: mode,
          isTransitioning: false 
        });
      }, 150);
    }
  },
  
  setFlyoutWidth: (width: number) => {
    set({ flyoutWidth: width });
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
  
  setTransitioning: (transitioning: boolean) => {
    set({ isTransitioning: transitioning });
  },
  
  setSelectedWorkspace: (workspace: any | null) => {
    set({ selectedWorkspace: workspace });
  },
}));