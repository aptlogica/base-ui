import { Plugin, PluginManifest, PluginAPI } from '../../core/types';
import manifest from './manifest.json';
import './styles.css';

export interface NavigationConfig {
  menuPosition: 'top' | 'left' | 'right';
  showIcons: boolean;
  theme: 'light' | 'dark' | 'auto';
  maxItems: number;
}

export interface MenuItem {
  id: string;
  title: string;
  path: string;
  icon?: string;
  order: number;
  children?: MenuItem[];
}

export class NavigationService {
  private menuItems: MenuItem[] = [];
  private listeners: (() => void)[] = [];

  addMenuItem(item: MenuItem): void {
    this.menuItems.push(item);
    this.menuItems.sort((a, b) => a.order - b.order);
    this.notifyListeners();
  }

  removeMenuItem(id: string): void {
    this.menuItems = this.menuItems.filter(item => item.id !== id);
    this.notifyListeners();
  }

  getMenuItems(): MenuItem[] {
    return [...this.menuItems];
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

const NavigationPlugin: Plugin = {
  manifest: manifest as PluginManifest,

  onConfigurationUpdate: async (newConfig, oldConfig) => {
    (window as any).__navigationConfig = newConfig;
    if ((window as any).__navigationService) {
      (window as any).__navigationService.notifyListeners();
    }
    window.dispatchEvent(new CustomEvent('navigation-config-changed'));
  },

  initialize: async (api: PluginAPI, config: NavigationConfig) => {
    // Register navigation service
    const navigationService = new NavigationService();
    api.registerService('navigation', navigationService);
    (window as any).__navigationService = navigationService;
    (window as any).__navigationConfig = config;

    api.registerExtensionPoint('navigation:menuItem', {
      id: { type: 'string', required: true },
      title: { type: 'string', required: true },
      path: { type: 'string', required: true },
      icon: { type: 'string' },
      order: { type: 'number', default: 100 },
      children: { type: 'array' }
    });


    // Add default menu items for other plugins to use if needed
    // Dashboard menu item removed - dashboard is disabled
    navigationService.addMenuItem({
      id: 'database',
      title: 'Database',
      path: '/workspace',
      icon: 'Database',
      order: 0
    });
    
    // Administrator menu item - visible only to admins
    navigationService.addMenuItem({
      id: 'administrator',
      title: 'Administrator',
      path: '/workspace/:workspaceId/administrator',
      icon: 'Settings',
      order: 1
    });
    
    // Settings menu item - visible to full_access users (not admins)
    navigationService.addMenuItem({
      id: 'settings',
      title: 'Settings',
      path: '/workspace/:workspaceId/workspace-settings',
      icon: 'Settings',
      order: 2
    });
  },


  activate: async () => {
    // console.log('Navigation plugin activated');
  },

  deactivate: async () => {
    // console.log('Navigation plugin deactivated');
  }
};

export default NavigationPlugin;
