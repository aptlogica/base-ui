import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Table2, Settings, Users, Plus } from 'lucide-react';
import TableList from '../components/workspace/TableList';
import Tabs from '../components/common/Tabs';
import { TABS } from '../config/workspaceConfig';
import MainCardGrid from '../components/workspace/MainCardGrid';
import { BaseSettingsTab } from '../components/workspace/tabs/BaseSettingsTab';
import { MembersTable, Member } from '../components/shared/MembersTable';
import { AccessRole } from '../components/shared/AccessRoleSelector';
import { defaultRoleConfig } from '../components/shared/roleConfig';
import { useToast } from '../components/common/Toast';
import useWorkspaceData from '../hooks/useWorkspaceData';
import { useNavigationStore } from '../stores/navigationStore';
import { Loader } from '../components/ui/Loader';
import { useBaseMembers, useWorkspaces } from '../hooks/useApi';
import { useUserRole } from '../hooks/useUserRole';
import { useWorkspaceAccess } from '../hooks/useWorkspaceAccess';
import { AssignUserToWorkspaceModal } from '../components/modals/AssignUserToWorkspaceModal';

const WorkspacePage: React.FC = () => {
  const { baseId } = useParams();
  const { selectedBaseId, selectedWorkspaceId } = useNavigationStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get valid tab labels (memoized since TABS is constant)
  const validTabLabels = useMemo(() => TABS.map(tab => tab.label), []);

  // Get tab from URL query parameter, default to first tab
  const tabFromUrl = searchParams.get('tab');
  const activeTab = useMemo(() => {
    // Validate tab from URL - must be a valid tab label
    if (tabFromUrl && validTabLabels.includes(tabFromUrl)) {
      return tabFromUrl;
    }
    // Default to first tab if no valid tab in URL
    return TABS[0].label;
  }, [tabFromUrl, validTabLabels]);

  // Handler to update URL when tab changes
  // Note: This preserves other query params (e.g., OAuth tokens, debug flags)
  const handleTabChange = (tab: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (tab === TABS[0].label) {
        // Remove tab param if it's the default tab (cleaner URLs)
        newParams.delete('tab');
      } else {
        newParams.set('tab', tab);
      }
      return newParams;
    }, { replace: false }); // Use push navigation to preserve browser history
  };

  // Use baseId from URL params or navigation store
  const effectiveBaseId = baseId || selectedBaseId;

  const {
    workspaceBases,
    baseTables,
    loading,
    error,
    _raw
  } = useWorkspaceData(undefined, effectiveBaseId || undefined);

  // Get workspaces query to check loading state
  const workspacesQuery = useWorkspaces();

  // Extract current base info from workspaceBases
  const currentBase = React.useMemo(() => {
    if (!workspaceBases?.data) return null;
    return workspaceBases.data.find((base: any) => base.id === effectiveBaseId) || null;
  }, [workspaceBases, effectiveBaseId]);

  // Use selectedWorkspaceId from navigation store (workspace dropdown) instead of deriving from base
  // This matches the behavior in WorkspaceTab where it uses the selected workspace from the dropdown
  const effectiveWorkspaceId = selectedWorkspaceId || currentBase?.workspace_id || null;

  const toast = useToast();
  const { isAdmin } = useUserRole();
  const { canAssignUsers } = useWorkspaceAccess(effectiveWorkspaceId || '');
  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false);

  // Fetch base members using API
  const baseMembersQuery = useBaseMembers(effectiveBaseId || '');

  // Map API response to Member interface
  const baseMembers: Member[] = React.useMemo(() => {
    if (!baseMembersQuery.data?.data) return [];

    const membersData = Array.isArray(baseMembersQuery.data.data)
      ? baseMembersQuery.data.data
      : [];

    return membersData.map((member: any) => {
      // Map access_level to AccessRole (similar to workspace members)
      let role: AccessRole = 'viewer';
      if (member.access_level === 'baseAdmin' || member.access_level === 'full_access' || member.access_level === 'owner') {
        role = 'owner';
      } else if (member.access_level === 'baseMember' || member.access_level === 'limited_access' || member.access_level === 'editor') {
        role = 'editor';
      } else if (member.access_level === 'no_access' || member.access_level === 'viewer') {
        role = 'no-access';
      }

      return {
        id: member.id || member.user_id || '',
        userId: member.user_id || member.id || '',
        name: member.display_name || member.name || member.email || 'Unknown User',
        email: member.email || '',
        role: role,
        dateJoined: member.created_time ? new Date(member.created_time).toLocaleDateString() : '-',
        avatar: member.avatar || undefined, // Only set avatar if it's a valid URL, otherwise undefined (MembersTable will generate initials)
        access_level: member.access_level, // Pass raw access_level from API
      };
    });
  }, [baseMembersQuery.data]);

  const handleBaseRoleChange = (memberId: string, newRole: AccessRole) => {
    // TODO: Implement API call to update member role
    console.log(`Change role for ${memberId} to ${newRole}`);
  };

  const handleBaseCopyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    toast.success('User ID copied to clipboard');
  };

  const handleBaseRemoveMember = (memberId: string) => {
    // TODO: Implement API call to remove member
    console.log(`Remove member ${memberId}`);
    // TODO: Show confirmation dialog
  };

  // Map icon names to Lucide icon components
  const getTabIcon = (iconName: string) => {
    const iconProps = { size: 14 };
    switch (iconName) {
      case 'Table2':
        return <Table2 {...iconProps} />;
      case 'Settings':
        return <Settings {...iconProps} />;
      case 'Users':
        return <Users {...iconProps} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <Loader
          text="Loading workspace data..."
          textPosition='bottom'
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-lg text-red-600">Failed to load workspace data: {error.message}</div>
      </div>
    );
  }

  if (!effectiveBaseId) {
    // Check if workspaces are still loading
    const workspacesLoading = workspacesQuery.isLoading;

    // Check if workspace bases are loading (if we have a workspace selected)
    const workspaceBasesLoading = selectedWorkspaceId && (_raw?.workspaceBasesQuery?.isLoading ?? false);

    // Show loading if either is still loading - prevents empty state flash
    if (workspacesLoading || workspaceBasesLoading) {
      return (
        <div className='flex items-center justify-center h-full'>
          <Loader
            text="Loading workspace data..."
            textPosition='bottom'
          />
        </div>
      );
    }

    // Only show empty state after all data has finished loading
    const hasWorkspaceData = workspaceBases?.data && workspaceBases.data.length > 0;
    const workspaces = workspacesQuery.data || [];
    const hasAnyWorkspaces = Array.isArray(workspaces) && workspaces.length > 0;
    const userIsAdmin = isAdmin();

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to your Workspace</h2>
        {hasWorkspaceData ? (
          <>
            <p className="text-gray-600 mb-6 max-w-md">
              Selecting your workspace automatically...
            </p>
          </>
        ) : hasAnyWorkspaces && userIsAdmin ? (
          <>
            <p className="text-gray-600 mb-6 max-w-md">
              No base selected. Please select a base from the sidebar to view your tables and data.
            </p>
            <div className="text-sm text-gray-500">
              <p>• Click on a workspace in the sidebar to get started</p>
              <p>• Or create a new workspace if you don't have any yet</p>
            </div>
          </>
        ) : hasAnyWorkspaces ? (
          <>
            <p className="text-gray-600 mb-6 max-w-md">
              No base available. Please wait for an administrator to create a base in your workspace.
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-6 max-w-md">
              You haven't been assigned to any workspace yet. Please wait for an administrator to assign you to a workspace.
            </p>
            <div className="text-sm text-gray-500">
              <p>• Once assigned, you'll be able to access your workspace and start working</p>
              <p>• Contact your administrator if you need access to a workspace</p>
            </div>
          </>
        )}
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <>
            <div className="mt-6 px-6">
              <MainCardGrid baseId={effectiveBaseId} workspaceId={effectiveWorkspaceId} />
            </div>
            <div className="mt-6 px-6">
              <TableList baseId={effectiveBaseId} />
            </div>
          </>
        );
      case 'Members':
        return (
          <div className="mt-6 px-6">
            {baseMembersQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-secondary">Loading members...</p>
                </div>
              </div>
            ) : baseMembersQuery.error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-red-600 mb-2">Error loading members</p>
                  <p className="text-sm text-secondary">{String(baseMembersQuery.error)}</p>
                </div>
              </div>
            ) : baseMembers.length > 0 ? (
              <MembersTable
                members={baseMembers}
                roleConfig={defaultRoleConfig}
                onRoleChange={handleBaseRoleChange}
                onCopyUserId={handleBaseCopyUserId}
                onRemoveMember={isAdmin() ? handleBaseRemoveMember : undefined}
                showSearch={true}
                headerActions={
                  canAssignUsers() ? (
                    <button
                      onClick={() => setIsAssignUserModalOpen(true)}
                      className="px-4 py-2 btn-primary flex items-center gap-1 transition font-medium whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      Add Member
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-200 rounded-lg bg-gray-50">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-primary mb-2">No members found</h3>
                <p className="text-sm text-secondary text-center max-w-md">
                  This base doesn't have any members yet. Add members to grant them access to this base and its resources.
                </p>
              </div>
            )}

            {/* Add Member Modal */}
            <AssignUserToWorkspaceModal
              isOpen={isAssignUserModalOpen}
              onClose={() => setIsAssignUserModalOpen(false)}
              onSuccess={() => {
                baseMembersQuery.refetch();
              }}
              workspaceId={effectiveWorkspaceId || ''}
              baseId={effectiveBaseId || undefined}
            />
          </div>
        );
      case 'Settings':
        return (
          <div className="mt-6 px-6">
            <BaseSettingsTab baseId={effectiveBaseId} />
          </div>
        );
      default:
        return (
          <div className="mt-6 px-6">
            <div className="bg-card rounded-xl shadow border border-border p-8 text-center text-lg text-secondary">
              {activeTab} content coming soon!
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      <Tabs
        tabs={TABS.map(tab => ({
          key: tab.label,
          label: tab.label,
          icon: getTabIcon(tab.icon)
        }))}
        activeKey={activeTab}
        onChange={handleTabChange}
      />
      {renderTabContent()}
    </div>
  );
};

export default WorkspacePage; 