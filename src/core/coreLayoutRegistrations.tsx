import { PluginAPI } from './types';
import Breadcrumb from '../components/common/Breadcrumb';
import HeaderLogo from '../components/common/HeaderLogo';
import HeaderWorkspaceDropdown from '../components/common/HeaderWorkspaceDropdown';
import WorkspaceSettingsButton from '../components/common/WorkspaceSettingsButton';
import AdministratorSettingsButton from '../components/common/AdministratorSettingsButton';
import HeaderMembers from '../components/common/HeaderMembers';
import UserDropdown from '../components/common/UserDropdown';
import HomePage from '../pages/HomePage';
import ProjectsPage from '../pages/ProjectsPage';

/**
 * Core layout registrations that were previously in WorkspacePlugin
 * These are essential components that should always be registered
 */
export const registerCoreLayoutComponents = (api: PluginAPI, config: any = {}) => {
  // Set workspace config on window for backward compatibility
  (window as any).__workspaceConfig = config;
  
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
    id: 'header-user-dropdown',
    order: 2,
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
};

