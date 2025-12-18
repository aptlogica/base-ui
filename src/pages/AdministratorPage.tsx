import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { SettingsTabs } from '../components/workspace/tabs/SettingsTabs';
import { TenantSettingsTab } from '../components/workspace/tabs/TenantSettingsTab';
import { UserSettingsTab } from '../components/workspace/tabs/UserSettingsTab';
import { WorkspaceSettingsTab } from '../components/workspace/tabs/WorkspaceSettingsTab';
import { AdminBillingTab } from '../components/workspace/tabs/AdminBillingTab';
import { PlanPricingTab } from '../components/workspace/tabs/PlanPricingTab';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { DangerZoneTab } from '../components/workspace/tabs/DangerZoneTab';
import { WorkspaceTab } from '../components/workspace/tabs/WorkspaceTab';
import { useWorkspaceAccess } from '../hooks/useWorkspaceAccess';

const AdministratorPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { canAccessAllSettingsTabs, accessLevel } = useWorkspaceAccess(workspaceId);
  const [searchParams, setSearchParams] = useSearchParams();

  // Fetch workspace data
  const { workspaces } = useWorkspaceData();

  // Filter tabs based on access level
  const allTabs = [
    { key: 'tenant', label: 'Settings', icon: 'Settings' },
    { key: 'user', label: 'Users', icon: 'Users' },
    { key: 'workspace', label: 'Workspaces', icon: 'Database' },
  ];

  const tabs = canAccessAllSettingsTabs()
    ? allTabs
    : allTabs.filter(tab => tab.key === 'workspace');

  // Get valid tab keys (memoized)
  const validTabKeys = useMemo(() => tabs.map(tab => tab.key), [tabs]);

  // Set default tab based on access level
  const defaultTab = canAccessAllSettingsTabs() ? 'tenant' : 'workspace';

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
    if (!canAccessAllSettingsTabs() && activeTab !== 'workspace') {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('tab'); // Remove tab param to use default 'workspace'
        return newParams;
      }, { replace: true });
    }
  }, [canAccessAllSettingsTabs, activeTab, setSearchParams]);

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

  const currentWorkspace = workspaces?.find((ws: any) => ws.id === workspaceId);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tenant':
        return <TenantSettingsTab workspaceId={workspaceId} />;
      case 'user':
        return <UserSettingsTab workspaceId={workspaceId} />;
      case 'workspace':
        return <WorkspaceTab workspaceId={workspaceId} />;
      // case 'billing':
      //   return <AdminBillingTab workspaceId={workspaceId} />;
      // case 'plan':
      //   return <PlanPricingTab workspaceId={workspaceId} />;
      // case 'danger-zone':
      //   return <DangerZoneTab workspaceId={workspaceId} workspaceTitle={currentWorkspace?.title || ''} />;
      default:
        return <TenantSettingsTab workspaceId={workspaceId} />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      {/* <div className="flex-shrink-0 bg-alpha-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">Administrator</h1>
            <p className="text-sm text-secondary mt-1">Manage tenant, user, and workspace settings</p>
          </div>
        </div>
      </div> */}

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
