import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useNavigationStore } from '../../stores/navigationStore';
import { useUserRole } from '../../hooks/useUserRole';
import { useComponentVisibility, useRouteContext, COMPONENT_IDS } from '../../contexts/RouteContext';

const WorkspaceSettingsButton: React.FC = () => {
  const navigate = useNavigate();
  const { selectedWorkspaceId } = useNavigationStore();
  const { isAdmin, accessLevel } = useUserRole();
  const { routeType } = useRouteContext();
  
  // Route-based visibility check
  const isRouteVisible = useComponentVisibility(COMPONENT_IDS.WORKSPACE_SETTINGS_BUTTON);

  // On administrator route, show the button regardless of admin status
  const isAdministratorRoute = routeType === 'administrator';
  
  // Combined visibility check:
  // 1. Route-based visibility (handled by RouteContext)
  // 2. Only show for full_access users (not admins, not limited_access)
  //    EXCEPT on administrator route where we show it for all users
  // 3. Workspace must be selected
  if (!isRouteVisible || (!isAdministratorRoute && (isAdmin() || accessLevel !== 'full_access')) || !selectedWorkspaceId) {
    return null;
  }

  const handleClick = () => {
    if (selectedWorkspaceId) {
      navigate(`/workspace/${selectedWorkspaceId}/workspace-settings`);
    }
  };

  if (!selectedWorkspaceId) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className="w-10 h-10 flex items-center justify-center bg-card hover:bg-gray-100 rounded-xl transition-colors duration-200"
      title="Workspace Settings"
    >
      <Settings className="w-5 h-5 text-gray-600" />
    </button>
  );
};

export default WorkspaceSettingsButton;

