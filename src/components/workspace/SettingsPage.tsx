import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SettingsTabs } from './tabs/SettingsTabs';
import MembersTab from './tabs/MembersTab';
import { DangerZoneTab } from './tabs/DangerZoneTab';
import { WorkspaceTab } from './tabs/WorkspaceTab';
import { useWorkspaceData } from '../../hooks/useWorkspaceData';

interface SettingsPageProps {
  workspaceId: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ workspaceId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [workspaceTitle, setWorkspaceTitle] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  
  // Fetch workspace data
  const { workspaces, loading } = useWorkspaceData();
  
  useEffect(() => {
    if (workspaces && workspaces.length > 0) {
      const currentWorkspace = workspaces.find((ws: any) => ws.id === workspaceId);
      if (currentWorkspace) {
        setWorkspaceTitle(currentWorkspace.title || currentWorkspace.name || 'My Workspace');
        setWorkspaceDescription(currentWorkspace.description || '');
      }
    }
  }, [workspaces, workspaceId]);

  const tabs = [
    { key: 'workspace', label: 'Workspace', icon: 'Building' },
    { key: 'members', label: 'Members', icon: 'Users', upcoming: true },
    { key: 'danger-zone', label: 'Danger Zone', icon: 'Trash' }
  ];

  // Get valid tab keys (memoized)
  const validTabKeys = useMemo(() => tabs.map(tab => tab.key), []);
  
  // Default tab
  const defaultTab = 'workspace';

  // Get tab from URL query parameter, default to 'workspace'
  const tabFromUrl = searchParams.get('tab');
  const activeTab = useMemo(() => {
    // Validate tab from URL - must be a valid tab key
    if (tabFromUrl && validTabKeys.includes(tabFromUrl)) {
      return tabFromUrl;
    }
    // Default to 'workspace' if no valid tab in URL
    return defaultTab;
  }, [tabFromUrl, validTabKeys]);

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'workspace':
        return <WorkspaceTab workspaceId={workspaceId} workspaceTitle={workspaceTitle} workspaceDescription={workspaceDescription} />;
      case 'members':
        return <MembersTab workspaceId={workspaceId} />;
      case 'danger-zone':
        return <DangerZoneTab workspaceId={workspaceId} workspaceTitle={workspaceTitle}/>;
      default:
        return <WorkspaceTab workspaceId={workspaceId} workspaceTitle={workspaceTitle} workspaceDescription={workspaceDescription} />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-alpha-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">Team & Settings</h1>
            <p className="text-sm text-secondary mt-1">Manage your workspace settings and team members</p>
          </div>
        </div>
      </div>

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
