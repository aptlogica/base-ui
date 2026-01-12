import React, { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { SettingsTabs } from '../components/workspace/tabs/SettingsTabs';
import { TenantSettingsTab } from '../components/workspace/tabs/TenantSettingsTab';
import { UserSettingsTab } from '../components/workspace/tabs/UserSettingsTab';
import { WorkspaceTab } from '../components/workspace/tabs/WorkspaceTab';
import { DangerZoneTab } from '../components/workspace/tabs/DangerZoneTab';
import { useWorkspaceAccess } from '../hooks/useWorkspaceAccess';
import { useWorkspaces } from '../hooks/useApi';

const AdministratorPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { canAccessAllSettingsTabs, isWorkspaceReadOnly, canDeleteWorkspace } = useWorkspaceAccess(workspaceId);
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: workspacesData } = useWorkspaces();
  
  // Get current workspace title
  const currentWorkspace = useMemo(() => {
    const workspaces = Array.isArray(workspacesData) ? workspacesData : [];
    return workspaces.find((ws: { id?: string }) => ws.id === workspaceId);
  }, [workspacesData, workspaceId]);


  // Filter tabs based on access level
  const allTabs = [
    { key: 'settings', label: 'Organization Information', icon: 'Settings' },
    { key: 'users', label: 'Users', icon: 'Users' },
    { key: 'workspaces', label: 'Workspaces', icon: 'Database' },
    ...(canDeleteWorkspace() ? [{ key: 'danger-zone', label: 'Danger Zone', icon: 'AlertTriangle' }] : []),
  ];

  // workspace-read users only see Workspace tab
  // admin users see all tabs
  // maintainer/full_access users see only Workspaces tab
  const tabs = (() => {
    if (isWorkspaceReadOnly()) {
      return allTabs.filter(tab => tab.key === 'workspaces');
    }
    if (canAccessAllSettingsTabs()) {
      return allTabs;
    }
    return allTabs.filter(tab => tab.key === 'workspaces');
  })();

  // Get valid tab keys (memoized)
  const validTabKeys = useMemo(() => tabs.map(tab => tab.key), [tabs]);

  // Set default tab based on access level
  const defaultTab = canAccessAllSettingsTabs() ? 'settings' : 'workspaces';

  // Get tab from URL query parameter, default based on access level
  const tabFromUrl = searchParams.get('tab');
  const activeTab = useMemo(() => {
    // Validate tab from URL - must be a valid tab key and accessible
    if (tabFromUrl && validTabKeys.includes(tabFromUrl)) {
      return tabFromUrl;
    }
    // Default based on access level
    return defaultTab;
  }, [tabFromUrl, validTabKeys, defaultTab]);

  // Handler to update URL when tab changes
  const handleTabChange = (tab: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (tab === defaultTab) {
        // Remove tab param if it's the default tab (cleaner URLs)
        newParams.delete('tab');
      } else {
        newParams.set('tab', tab);
      }
      return newParams;
    }, { replace: false });
  };

  // Update active tab if access level changes (and current tab becomes invalid)
  useEffect(() => {
    // If user loses access to current tab, redirect to default
    if ((isWorkspaceReadOnly() || !canAccessAllSettingsTabs()) && activeTab !== 'workspaces') {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('tab'); // Remove tab param to use default 'workspaces'
        return newParams;
      }, { replace: true });
    }
    // If user loses delete permission and is on danger-zone tab, redirect to default
    if (!canDeleteWorkspace() && activeTab === 'danger-zone') {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('tab');
        return newParams;
      }, { replace: true });
    }
  }, [isWorkspaceReadOnly, canAccessAllSettingsTabs, canDeleteWorkspace, activeTab, setSearchParams]);

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Workspace Not Found</h1>
          <p className="text-gray-600">Please select a valid workspace.</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'settings':
        return <TenantSettingsTab workspaceId={workspaceId} />;
      case 'users':
        return <UserSettingsTab workspaceId={workspaceId} />;
      case 'workspaces':
        return <WorkspaceTab workspaceId={workspaceId} />;
      case 'danger-zone':
        return <DangerZoneTab workspaceId={workspaceId} workspaceTitle={currentWorkspace?.title || currentWorkspace?.name || ''} />;
      default:
        return <TenantSettingsTab workspaceId={workspaceId} />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Tabs */}
      <div className="flex-shrink-0 bg-alpha-white border-b px-6">
        <SettingsTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-full mx-auto px-6 py-8 bg-alpha-white">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdministratorPage;
