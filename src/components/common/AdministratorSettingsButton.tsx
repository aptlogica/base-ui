import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useNavigationStore } from '../../stores/navigationStore';
import { useUserRole } from '../../hooks/useUserRole';
import { useWorkspaceAccess } from '../../hooks/useWorkspaceAccess';
import { useComponentVisibility, COMPONENT_IDS } from '../../contexts/RouteContext';

const AdministratorSettingsButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedWorkspaceId } = useNavigationStore();
  const { isAdmin, isMaintainer } = useUserRole();
  const { currentWorkspace } = useWorkspaceAccess(selectedWorkspaceId);
  
  // Route-based visibility check
  const isRouteVisible = useComponentVisibility(COMPONENT_IDS.ADMINISTRATOR_SETTINGS_BUTTON);

  // Check if workspace access_level is maintainer, admin, or workspace-read
  const hasWorkspaceMaintainerAccess = currentWorkspace?.access_level === 'maintainer' || 
                                       currentWorkspace?.access_level === 'owner' ||
                                       currentWorkspace?.access_level === 'co-owner' ||
                                       currentWorkspace?.access_level === 'workspace-read';

  // Combined visibility check:
  // 1. Route-based visibility (handled by RouteContext)
  // 2. Role-based permission (must be admin or maintainer in global role OR have maintainer/owner access_level in workspace)
  // 3. Workspace must be selected
  if (!isRouteVisible || (!isAdmin() && !isMaintainer() && !hasWorkspaceMaintainerAccess) || !selectedWorkspaceId) {
    return null;
  }

  const handleClick = () => {
    if (selectedWorkspaceId) {
      navigate(`/workspace/${selectedWorkspaceId}/administrator`);
    }
  };

  if (!selectedWorkspaceId) {
    return null;
  }

  // Check if we're on the administrator settings page
  const isActive = location.pathname.includes('/administrator');

  return (
    <>
      <button
        onClick={handleClick}
        className={`relative p-2 rounded-xl transition-colors focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-2 ${
          isActive
            ? 'bg-green-200 text-black'
            : 'bg-card icons-bg hover:bg-[var(--color-gray-100)] hover:text-black'
        }`}
        title="Owner Settings"
        aria-label="Owner Settings"
      >
        <Settings className={`w-5 h-5 transition-all duration-200 ${
          isActive
            ? 'text-green-600'
            : 'text-gray-500 hover:scale-110'
        }`} />
      </button>
      {/* Vertical Separator */}
      <div className="h-7 w-px border mx-3"></div>
    </>
  );
};

export default AdministratorSettingsButton;

