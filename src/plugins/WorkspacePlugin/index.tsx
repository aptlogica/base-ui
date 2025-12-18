import React from 'react';
import { Plugin, PluginManifest, PluginAPI } from '../../core/types';
import Sidebar from './components/refactored/Sidebar';
import SidebarFlyoutMenu from './components/refactored/SidebarFlyoutMenu';
import Breadcrumb from '../../components/common/Breadcrumb';
import manifest from './manifest.json';
import WorkspacePage from '../../pages/WorkspacePage';
import ProjectsPage from '../../pages/ProjectsPage';
import NotFoundPage from '../../pages/NotFoundPage';

const WorkspacePlugin: Plugin = {
  manifest: manifest as PluginManifest,
  onConfigurationUpdate: async (newConfig, oldConfig) => {
    (window as any).__workspaceConfig = newConfig;
    window.dispatchEvent(new CustomEvent('workspace-config-changed'));

    // --- Sync sidebarPosition to NavigationPlugin menuPosition ---
    if (newConfig.sidebarPosition && (window as any).__navigationConfig) {
      const navConfig = { ...(window as any).__navigationConfig };
      if (navConfig.menuPosition !== newConfig.sidebarPosition) {
        navConfig.menuPosition = newConfig.sidebarPosition;
        (window as any).__navigationConfig = navConfig;
        window.dispatchEvent(new CustomEvent('navigation-config-changed'));
      }
    }

    // --- Sync flyout mode to plugin store ---
    if (newConfig.flyoutMode && newConfig.flyoutMode !== oldConfig?.flyoutMode) {
      // Use dynamic import to avoid circular dependencies
      const { usePluginStore } = await import('../../stores/pluginStore');
      const { setFlyoutMode } = usePluginStore.getState();
      setFlyoutMode(newConfig.flyoutMode);
    }
  },
  initialize: async (api: PluginAPI, config: any) => {
    (window as any).__workspaceConfig = config;
    api.registerExtension('layout:sidebar', {
      id: 'global-sidebar',
      order: 1,
      render: () => <Sidebar />,
    });
    
    // Register breadcrumb component in header
    api.registerExtension('layout:header-left', {
      id: 'app-title',
      order: 1,
      render: () => (
        <span className="text-md font-bold text-primary">
          {config.sidebarLogoText || ''}
        </span>
      )
    });
    api.registerExtension('layout:header-left', {
      id: 'app-breadcrumb',
      order: 1,
      render: () => <Breadcrumb />
    });
    // Register default pages as pluggable extensions
    api.registerExtension('page:workspace', {
      id: 'default-workspace-page',
      order: 1,
      render: () => <WorkspacePage />
    });
    api.registerExtension('page:projects', {
      id: 'default-projects-page',
      order: 1,
      render: () => <ProjectsPage />
    });
    // api.registerExtension('page:notfound', {
    //   id: 'default-notfound-page',
    //   order: 1,
    //   render: () => <NotFoundPage />
    // });
  },
};

export default WorkspacePlugin; 