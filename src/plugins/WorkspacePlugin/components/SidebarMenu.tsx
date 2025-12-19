import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SidebarItem from './SidebarItem';
import { usePluginStore } from '../../../stores/pluginStore';
import { useNavigationStore } from '../../../stores/navigationStore';
import { useUserRole } from '../../../hooks/useUserRole';
import { useWorkspaceAccess } from '../../../hooks/useWorkspaceAccess';

interface SidebarMenuProps {
  menuItems: any[];
  selectedWorkspace: any;
  sidebarPosition: 'left' | 'right';
  sidebarWidth: number;
  sidebarFontSize: string;
  sidebarItemSpacing: number;
  onWorkspaceUpdate: (workspace: any) => void;
  isDatabaseActive: (pathname: string) => boolean;
  isAnyBaseActive: () => boolean;
  findFirstBase: () => any;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({
  menuItems,
  selectedWorkspace,
  sidebarPosition,
  sidebarWidth,
  sidebarFontSize,
  sidebarItemSpacing,
  onWorkspaceUpdate,
  isDatabaseActive,
  isAnyBaseActive,
  findFirstBase,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { flyoutOpen, toggleFlyout, closeFlyout, currentPlugin } = usePluginStore();
  const { isAdmin } = useUserRole();
  const { canAccessSettings, accessLevel } = useWorkspaceAccess();
  
  // Helper function to close flyout if open
  const closeFlyoutIfOpen = () => {
    if (flyoutOpen && currentPlugin === 'workspace-flyout-menu') {
      closeFlyout();
    }
  };

  const getIsActive = (item: any) => {
    const pathname = location.pathname;

    if (item.icon?.toLowerCase() === 'database') {
      return isDatabaseActive(pathname);
    }
    if (item.id === 'administrator') {
      return pathname.includes('/administrator');
    }
    if (item.id === 'settings') {
      return pathname.includes('/settings');
    }
    if (item.id === 'notification') {
      return pathname === '/notification';
    }
    // Dashboard menu item removed - dashboard is disabled
    if (item.id === 'projects') {
      return pathname === '/projects';
    }
    return pathname === item.path;
  };

  return (
    <div
      className="flex flex-col items-center w-full"
      style={{ gap: sidebarItemSpacing, fontSize: undefined }}
    >
      {menuItems.map((item, i) => {
        const isActive = getIsActive(item);

        // Skip Administrator menu if user is not Admin
        if (item.id === 'administrator' && !isAdmin()) {
          return null;
        }

        // Skip Settings menu if user is admin or doesn't have full_access
        // Settings menu is only for full_access users (not admins, not limited_access)
        if (item.id === 'settings') {
          if (isAdmin() || accessLevel !== 'full_access') {
            return null;
          }
        }

        // Special handling for Database icon to open flyout
        if (item.icon?.toLowerCase() === 'database') {
          return (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              active={isActive}
              onClick={() => {
                toggleFlyout('workspace-flyout-menu');
              }}
              label={item.title}
            />
          );
        }

        // Special handling for Settings menu (full_access users only)
        if (item.id === 'settings') {
          const { selectedWorkspaceId: storeWorkspaceId } = useNavigationStore.getState();
          const workspaceId = selectedWorkspace?.id || storeWorkspaceId;
          
          const handleSettingsClick = () => {
            closeFlyoutIfOpen();
            if (workspaceId) {
              // full_access users go to workspace settings page
              navigate(`/workspace/${workspaceId}/workspace-settings`);
            }
          };
          
          return (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              active={location.pathname.includes('/workspace-settings')}
              onClick={handleSettingsClick}
              label={item.title}
            />
          );
        }

        // Special handling for Administrator to include workspace ID
        if (item.id === 'administrator') {
          const { selectedWorkspaceId: storeWorkspaceId } = useNavigationStore.getState();
          const workspaceId = selectedWorkspace?.id || storeWorkspaceId || 'default';
          const administratorPath = `/workspace/${workspaceId}/administrator`;
          return (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              active={isActive}
              onClick={() => {
                closeFlyoutIfOpen();
                navigate(administratorPath);
              }}
              label={item.title}
            />
          );
        }

        // Handle items with placeholder paths (like search)
        if (item.path === '#') {
          return (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              active={false}
              onClick={() => {
                closeFlyoutIfOpen();
              }}
              label={item.title}
            />
          );
        }

        return (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            active={isActive}
            onClick={() => {
              closeFlyoutIfOpen();
              navigate(item.path);
            }}
            label={item.title}
          />
        );
      })}
    </div>
  );
};

export default SidebarMenu;