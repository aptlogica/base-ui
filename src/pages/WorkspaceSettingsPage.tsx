import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import { useWorkspaceAccess } from '../hooks/useWorkspaceAccess';
import { useNavigationStore } from '../stores/navigationStore';
import { useWorkspaces, useWorkspaceBases, useWorkspaceMembers, useRemoveUserFromWorkspace } from '../hooks/useApi';
import { useToast } from '../components/common/Toast';
import { AdvancedDropdown } from '../components/common/dropdown/AdvancedDropdown';
import { MembersTable, Member } from '../components/shared/MembersTable';
import { AccessRole } from '../components/shared/AccessRoleSelector';
import { defaultRoleConfig } from '../components/shared/roleConfig';
import { AssignUserToWorkspaceModal } from '../components/modals/AssignUserToWorkspaceModal';

const WorkspaceSettingsPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { canAccessSettings, accessLevel, canAssignUsers } = useWorkspaceAccess(workspaceId);
  const { selectedWorkspaceId } = useNavigationStore();
  const [localSelectedWorkspaceId, setLocalSelectedWorkspaceId] = React.useState<string>('');
  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = React.useState(false);

  // Use local state for workspace selection (allows changing selection)
  const effectiveWorkspaceId = localSelectedWorkspaceId || workspaceId || selectedWorkspaceId;

  // Redirect if user doesn't have access (not full_access)
  if (!canAccessSettings() || accessLevel !== 'full_access') {
    return <Navigate to="/workspace" replace />;
  }

  const workspacesQuery = useWorkspaces();
  const workspaceBasesQuery = useWorkspaceBases(effectiveWorkspaceId || '');
  const workspaceMembersQuery = useWorkspaceMembers(effectiveWorkspaceId || '');
  const removeUserFromWorkspaceMutation = useRemoveUserFromWorkspace();
  const toast = useToast();

  const workspaces = workspacesQuery.data || [];
  
  // Extract bases from API response
  const basesData = workspaceBasesQuery.data?.data || workspaceBasesQuery.data || [];
  const bases = Array.isArray(basesData) ? basesData : [];
  
  // Create dropdown options from workspaces
  const workspaceDropdownOptions = workspaces.map((ws: any) => ({
    label: ws.title || 'Untitled Workspace',
    value: ws.id,
  }));

  // Get selected workspace details
  const selectedWorkspace = workspaces.find((ws: any) => ws.id === effectiveWorkspaceId);

  // Set default selected workspace on load
  React.useEffect(() => {
    if (workspaces.length > 0 && !localSelectedWorkspaceId) {
      // Use workspaceId from URL, or selectedWorkspaceId from store, or first workspace
      const defaultWorkspaceId = workspaceId || selectedWorkspaceId || workspaces[0].id;
      setLocalSelectedWorkspaceId(defaultWorkspaceId);
    }
  }, [workspaces, workspaceId, selectedWorkspaceId, localSelectedWorkspaceId]);


  // Map API response to Member interface
  const members: Member[] = React.useMemo(() => {
    if (!workspaceMembersQuery.data?.data) return [];

    const membersData = Array.isArray(workspaceMembersQuery.data.data)
      ? workspaceMembersQuery.data.data
      : [];

    return membersData.map((member: any) => {
      // Map access_level to AccessRole (for backward compatibility)
      let role: AccessRole = 'viewer';
      if (member.access_level === 'workspaceAdmin' || member.access_level === 'full_access') {
        role = 'owner';
      } else if (member.access_level === 'workspaceMember' || member.access_level === 'limited_access') {
        role = 'editor';
      }

      return {
        id: member.id || member.user_id || '',
        userId: member.user_id || member.id || '',
        name: member.display_name || member.name || member.email || 'Unknown User',
        email: member.email || '',
        role: role,
        dateJoined: member.created_time ? new Date(member.created_time).toLocaleDateString() : '-',
        avatar: member.avatar || undefined,
        access_level: member.access_level, // Pass raw access_level from API
      };
    });
  }, [workspaceMembersQuery.data]);

  const handleRoleChange = (memberId: string, newRole: AccessRole) => {
    // TODO: Implement API call to update member role
    toast.info('Role change functionality coming soon');
  };

  const handleCopyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    toast.success('User ID copied to clipboard');
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!effectiveWorkspaceId) {
      toast.error('No workspace selected');
      return;
    }

    // Find the member to get user_id
    const member = members.find(m => m.id === memberId);
    if (!member) {
      toast.error('Member not found');
      return;
    }

    try {
      await removeUserFromWorkspaceMutation.mutateAsync({
        workspaceId: effectiveWorkspaceId,
        workspace_id: effectiveWorkspaceId,
        user_id: member.userId
      });
      toast.success('Member removed successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove member');
    }
  };



  if (!effectiveWorkspaceId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Workspace Not Found</h1>
          <p className="text-gray-600">Please select a valid workspace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-full mx-auto px-6 py-8 bg-alpha-white space-y-4">
          {/* Workspace Selector + Information Card */}
          <div className="bg-card rounded-xl border shadow-sm p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-primary mb-3">Select Workspace</h3>
                <AdvancedDropdown
                  label=""
                  options={workspaceDropdownOptions}
                  value={effectiveWorkspaceId || ''}
                  onChange={(value) => {
                    const newWorkspaceId = value as string;
                    setLocalSelectedWorkspaceId(newWorkspaceId);
                  }}
                  placeholder="Select a workspace"
                  searchable
                />
              </div>
            </div>

            {effectiveWorkspaceId && selectedWorkspace && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1.5">Workspace Name</label>
                    <div className="text-sm text-primary">
                      {selectedWorkspace.title || 'Untitled Workspace'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1.5">Description</label>
                    <div className="text-sm text-primary">
                      {selectedWorkspace.description || 'No description'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Two Column Layout: Bases + Members */}
          {effectiveWorkspaceId && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column: Bases List */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-xl border shadow-sm p-4 h-full">
                  <h3 className="text-lg font-semibold text-primary mb-4">Bases</h3>
                  {workspaceBasesQuery.isLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-sm text-secondary">Loading bases...</p>
                    </div>
                  ) : workspaceBasesQuery.error ? (
                    <div className="text-center py-8 border border-dashed border-red-200 rounded-xl bg-red-50">
                      <p className="text-sm text-red-600 font-medium">Failed to load bases</p>
                    </div>
                  ) : bases.length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-xl bg-alpha-white">
                      <p className="text-sm text-secondary">No bases found</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {bases.map((base: any) => (
                        <div
                          key={base.id}
                          className="p-3 border rounded-xl hover:bg-alpha-white hover:border-primary/30 transition-all"
                        >
                          <div className="font-medium text-primary text-sm truncate">
                            {base.title || 'Untitled Base'}
                          </div>
                          {/* <div className="text-xs text-secondary font-mono truncate mt-1">
                            {base.id}
                          </div> */}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Members */}
              <div className="lg:col-span-2">
                <div className="bg-card rounded-xl border shadow-sm p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-primary">Workspace Members</h3>
                    {canAssignUsers() && (
                      <button
                        onClick={() => setIsAssignUserModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 btn-primary text-sm"
                      >
                        <Plus size={14} />
                        Add Member
                      </button>
                    )}
                  </div>

                  {workspaceMembersQuery.isLoading ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                      <p className="text-primary font-medium">Loading members...</p>
                    </div>
                  ) : workspaceMembersQuery.error ? (
                    <div className="text-center py-12 border border-dashed border-red-200 rounded-xl bg-red-50">
                      <p className="text-red-600 font-medium">Failed to load members</p>
                      <p className="text-sm text-red-500 mt-1">
                        {workspaceMembersQuery.error instanceof Error
                          ? workspaceMembersQuery.error.message
                          : 'An error occurred'}
                      </p>
                    </div>
                  ) : members.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-xl bg-alpha-white">
                      <p className="text-primary font-medium">No members found</p>
                      <p className="text-sm text-secondary mt-1">Assign users to this workspace to see them here</p>
                    </div>
                  ) : (
                    <MembersTable
                      members={members}
                      roleConfig={defaultRoleConfig}
                      onRoleChange={handleRoleChange}
                      onCopyUserId={handleCopyUserId}
                      onRemoveMember={handleRemoveMember}
                      showSearch={true}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Assign User to Workspace Modal */}
      <AssignUserToWorkspaceModal
        isOpen={isAssignUserModalOpen}
        onClose={() => setIsAssignUserModalOpen(false)}
        onSuccess={() => {
          workspaceMembersQuery.refetch();
        }}
        workspaceId={effectiveWorkspaceId || ''}
      />
    </div>
  );
};

export default WorkspaceSettingsPage;
