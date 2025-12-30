import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useNavigationStore } from '../../stores/navigationStore';
import { useUserRole } from '../../hooks/useUserRole';
import { useComponentVisibility, COMPONENT_IDS } from '../../contexts/RouteContext';

const AdministratorSettingsButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedWorkspaceId } = useNavigationStore();
  const { isAdmin } = useUserRole();

  // Route-based visibility check
  const isRouteVisible = useComponentVisibility(COMPONENT_IDS.ADMINISTRATOR_SETTINGS_BUTTON);

  // Combined visibility check:
  // 1. Route-based visibility (handled by RouteContext)
  // 2. Role-based permission (must be admin)
  // 3. Workspace must be selected
  if (!isRouteVisible || !isAdmin() || !selectedWorkspaceId) {
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
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-card icons-bg hover:bg-[var(--color-gray-100)] hover:text-[var(--color-alpha-black)]'
        }`}
        title="Administrator Settings"
        aria-label="Administrator Settings"
      >
        <Settings className={`w-5 h-5 transition-all duration-200 ${
          isActive
            ? 'text-white'
            : 'text-gray-500 hover:scale-110'
        }`} />
      </button>
      {/* Vertical Separator */}
      <div className="h-7 w-px border mx-3"></div>
    </>
  );
};

export default AdministratorSettingsButton;

