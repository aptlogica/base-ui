import React, { useState, useEffect } from 'react';
import { Plugin, PluginManifest, PluginAPI } from '../../core/types';
import { DashboardGrid } from './components/DashboardGrid';
import { SimpleStatsWidget } from './components/SimpleStatsWidget';
import { SimpleActivityWidget } from './components/SimpleActivityWidget';
import { BillingDetailsWidget } from './components/BillingDetailsWidget';
import manifest from './manifest.json';

// Extend the Window interface to include pluginServices
declare global {
  interface Window {
    pluginServices?: Record<string, any>;
  }
}

export interface DashboardConfig {
  gridColumns: number;
  autoRefresh: boolean;
  refreshInterval: number;
  enableAnimations: boolean;
}

export interface Widget {
  id: string;
  title: string;
  size: 'small' | 'medium' | 'large';
  order: number;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
}

export class 
DashboardService {
  private widgets: Widget[] = [];
  private refreshInterval?: NodeJS.Timeout;
  private listeners: (() => void)[] = [];

  constructor(private config: DashboardConfig) { }

  addWidget(widget: Widget): void {
    this.widgets.push(widget);
    this.widgets.sort((a, b) => a.order - b.order);
    this.notifyListeners();
  }

  removeWidget(id: string): void {
    this.widgets = this.widgets.filter(w => w.id !== id);
    this.notifyListeners();
  }

  getWidgets(): Widget[] {
    return [...this.widgets];
  }

  startAutoRefresh(): void {
    if (this.config.autoRefresh && !this.refreshInterval) {
      this.refreshInterval = setInterval(() => {
        this.notifyListeners();
      }, this.config.refreshInterval * 1000);
    }
  }

  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

const DashboardWidgetsPlugin: Plugin = {
  manifest: manifest as PluginManifest,

  onConfigurationUpdate: async (newConfig, oldConfig) => {
    //  dispath update event
    (window as any).__dashboardWidgetsConfig = newConfig;
    window.dispatchEvent(new CustomEvent('dashboard-widgets-config-changed'));

    (window as any).__navigationConfig = newConfig;
    if ((window as any).__navigationService) {
      (window as any).__navigationService.notifyListeners();
    }
    window.dispatchEvent(new CustomEvent('navigation-config-changed'));
  },

  initialize: async (api: PluginAPI, config: DashboardConfig) => {
    // Get navigation service to add menu item
    const navigationService = api.getService<any>('navigation');

    // Register dashboard service
    const dashboardService = new DashboardService(config);
    api.registerService('dashboard', dashboardService);

    // Register extension point for dashboard widgets
    api.registerExtensionPoint('dashboard:widget', {
      id: { type: 'string', required: true },
      title: { type: 'string', required: true },
      size: { type: 'string', enum: ['small', 'medium', 'large'], default: 'medium' },
      order: { type: 'number', default: 100 },
      component: { type: 'function', required: true },
      props: { type: 'object' }
    });

    // Add navigation menu item
    // if (navigationService) {
    //   navigationService.addMenuItem({
    //     id: 'dashboard',
    //     title: 'Dashboard',
    //     path: '/dashboard',
    //     icon: 'ChartSpline',
    //     order: 10
    //   });
    // }

    // Register dashboard grid as the main dashboard page (pluggable)
    api.registerExtension('page:dashboard', {
      id: 'dashboard-main',
      order: 1,
      render: (props: any) => {
        const [localConfig, setLocalConfig] = useState(config);
        useEffect(() => {
          const handler = () => setLocalConfig({ ...(window as any).__dashboardWidgetsConfig });
          window.addEventListener('dashboard-widgets-config-changed', handler);
          return () => window.removeEventListener('dashboard-widgets-config-changed', handler);
        }, []);
        return (
          <DashboardGrid
            config={localConfig}
            dashboardService={dashboardService}
            {...props}
          />
        );
      }
    });

    // Register dashboard widgets
    dashboardService.addWidget({
      id: 'stats',
      title: 'Overview',
      size: 'large',
      order: 1,
      component: SimpleStatsWidget
    });

    dashboardService.addWidget({
      id: 'activity',
      title: 'Recent Activity',
      size: 'medium',
      order: 2,
      component: SimpleActivityWidget
    });

    dashboardService.addWidget({
      id: 'billing',
      title: 'Billing Details',
      size: 'large',
      order: 3,
      component: BillingDetailsWidget
    });
  },

  activate: async () => {
    // console.log('Dashboard Widgets plugin activated');
    const dashboardService = window.pluginServices?.dashboard;
    if (dashboardService) {
      dashboardService.startAutoRefresh();
    }
  },

  deactivate: async () => {
    // console.log('Dashboard Widgets plugin deactivated');
    const dashboardService = window.pluginServices?.dashboard;
    if (dashboardService) {
      dashboardService.stopAutoRefresh();
    }
  }
};

export default DashboardWidgetsPlugin;
