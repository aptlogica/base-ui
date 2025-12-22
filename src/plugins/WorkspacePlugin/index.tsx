import { Plugin, PluginManifest, PluginAPI } from '../../core/types';
import Breadcrumb from '../../components/common/Breadcrumb';
import HeaderLogo from '../../components/common/HeaderLogo';
import HeaderWorkspaceDropdown from '../../components/common/HeaderWorkspaceDropdown';
import WorkspaceSettingsButton from '../../components/common/WorkspaceSettingsButton';
import AdministratorSettingsButton from '../../components/common/AdministratorSettingsButton';
import NotificationButton from '../../components/common/NotificationButton';
import HeaderMembers from '../../components/common/HeaderMembers';
import UserDropdown from '../../components/common/UserDropdown';
import manifest from './manifest.json';
import HomePage from '../../pages/HomePage';
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
    
    // No sidebar - we use flyout menu instead
    
    // Register header-left components
    api.registerExtension('layout:header-left', {
      id: 'header-logo',
      order: 1,
      render: () => <HeaderLogo logoUrl={config.sidebarLogoUrl} />
    });
    
    api.registerExtension('layout:header-left', {
      id: 'header-workspace-dropdown',
      order: 2,
      render: () => <HeaderWorkspaceDropdown />
    });
    
    api.registerExtension('layout:header-left', {
      id: 'header-breadcrumb',
      order: 3,
      render: () => <Breadcrumb />
    });
    
    // Register header-right components
    api.registerExtension('layout:header', {
      id: 'header-members',
      order: 0.5,
      render: () => <HeaderMembers />
    });
    
    api.registerExtension('layout:header', {
      id: 'header-settings',
      order: 1,
      render: () => <WorkspaceSettingsButton />
    });
    
    api.registerExtension('layout:header', {
      id: 'header-administrator-settings',
      order: 1.5,
      render: () => <AdministratorSettingsButton />
    });
    
    api.registerExtension('layout:header', {
      id: 'header-notifications',
      order: 2,
      render: () => <NotificationButton />
    });
    
    api.registerExtension('layout:header', {
      id: 'header-user-dropdown',
      order: 3,
      render: () => <UserDropdown />
    });
    
    // Register default pages as pluggable extensions
    api.registerExtension('page:homepage', {
      id: 'default-homepage-page',
      order: 1,
      render: () => <HomePage />
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