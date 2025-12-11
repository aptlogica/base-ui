import React, { useState } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { useWorkspaceBusinessLogic } from '../../data/workspaceBusinessLogic';
import WorkspaceDropdown from '../WorkspaceDropdown';
import SidebarMenu from '../SidebarMenu';
import SidebarFlyoutMenu from './SidebarFlyoutMenu';
import UserDropdown from '../../../../components/common/UserDropdown';
import NotificationButton from '../../../../components/common/NotificationButton';

const fontSizeMap: Record<string, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const isDatabaseActive = (pathname: string) => {
  // Database icon should only be active when viewing workspace page
  // NOT when viewing individual tables/views
  return (
    pathname === '/workspace' ||
    !!matchPath('/workspace/:workspaceId', pathname)
  );
};

const SidebarRefactored: React.FC = () => {
  const {
    // Data from business logic
    workspaces,
    // State from business logic
    menuItems,
    config,
    workspaceDropdownOpen, setWorkspaceDropdownOpen,
    showCreateWorkspace, setShowCreateWorkspace,
    newWorkspaceName, setNewWorkspaceName,
    newWorkspaceDescription, setNewWorkspaceDescription,
    workspaceError, setWorkspaceError,
    isError, setIsError,
    selectedWorkspace, setSelectedWorkspace,
    authUser,
    restoreCompleted,
    // Handlers from business logic
    handleFormSubmit,
    isAnyBaseActive,
    findFirstBase, // This is now a placeholder, actual logic is in flyout
  } = useWorkspaceBusinessLogic();

  if (config.showSidebar === false) return null;

  // Determine sidebar position and style
  const sidebarWidth = config.sidebarWidth || 50;
  const sidebarPosition = config.sidebarPosition || 'left';
  // const sidebarBgColor = config.sidebarBgColor || "rgb(250, 250, 250)";
  const sidebarLogoText = config.sidebarLogoText || 'S';
  const sidebarLogoUrl = config.sidebarLogoUrl || '';
  const showUserAvatar = config.showUserAvatar !== false;
  const sidebarShadow = config.sidebarShadow ? '0 2px 12px rgba(0,0,0,0.12)' : undefined;
  const sidebarItemSpacing = typeof config.sidebarItemSpacing === 'number' ? config.sidebarItemSpacing : 14;
  const sidebarFontSize = fontSizeMap[config.sidebarFontSize] || 'text-sm';

  const sidebarStyle: React.CSSProperties = {
    width: sidebarWidth,
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: sidebarPosition === 'left' ? 0 : undefined,
    right: sidebarPosition === 'right' ? 0 : undefined,
    zIndex: 40,
    // background: sidebarBgColor,
    boxShadow: sidebarShadow,
  };

  const logoButtonRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="sidebar-container" style={sidebarStyle}>
      {/* Workspace Selector at Logo Area */}
      <div className="sidebar-logo truncate flex items-center justify-center relative">
        <div
          ref={logoButtonRef}
          className="cursor-pointer flex items-center gap-2 rounded-lg p-2 transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setWorkspaceDropdownOpen(!workspaceDropdownOpen);
          }}
        >
          {sidebarLogoUrl ? (
            <img src={sidebarLogoUrl} alt="Logo" className="w-8 h-8 object-contain" />
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {sidebarLogoText}
            </div>
          )}
        </div>

        <WorkspaceDropdown
          isOpen={workspaceDropdownOpen}
          onClose={() => setWorkspaceDropdownOpen(false)}
          logoButtonRef={logoButtonRef}
          workspaceData={workspaces || []} // Use workspaces from business logic
          selectedWorkspace={selectedWorkspace}
          onWorkspaceSelect={(workspace) => {
            setSelectedWorkspace(workspace);
            setWorkspaceDropdownOpen(false);
          }}
          onCreateWorkspace={() => setShowCreateWorkspace(true)}
          showCreateWorkspace={showCreateWorkspace}
          newWorkspaceName={newWorkspaceName}
          setNewWorkspaceName={setNewWorkspaceName}
          newWorkspaceDescription={newWorkspaceDescription}
          setNewWorkspaceDescription={setNewWorkspaceDescription}
          workspaceError={workspaceError}
          onSubmitCreateWorkspace={handleFormSubmit}
          onCloseCreateWorkspace={() => setShowCreateWorkspace(false)}
        />
      </div>

      {/* Sidebar Menu */}
      <SidebarMenu
        menuItems={menuItems}
        selectedWorkspace={selectedWorkspace}
        sidebarPosition={sidebarPosition}
        sidebarWidth={sidebarWidth}
        sidebarFontSize={sidebarFontSize}
        sidebarItemSpacing={sidebarItemSpacing}
        onWorkspaceUpdate={(updatedWorkspace) => {
          setSelectedWorkspace(updatedWorkspace);
        }}
        isDatabaseActive={isDatabaseActive}
        isAnyBaseActive={isAnyBaseActive}
        findFirstBase={findFirstBase}
      />
      <div className="flex-1" />

      {/* Notification Button */}
      <div className="flex justify-center mb-2">
        <NotificationButton />
      </div>

      {/* User Dropdown */}
      {showUserAvatar && (
        <div className="flex justify-center pb-4">
          <UserDropdown />
        </div>
      )}
    </div>
  );
};

export default SidebarRefactored;
