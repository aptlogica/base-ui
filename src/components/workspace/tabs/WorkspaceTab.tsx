import React from 'react';
import { Plus, Loader2, Edit2 } from 'lucide-react';
import { useUpdateWorkspace, useWorkspaces, useWorkspaceMembers, useRemoveUserFromWorkspace, useWorkspaceBases } from '../../../hooks/useApi';
import { useToast } from '../../common/Toast';
import { AdvancedDropdown } from '../../common/dropdown/AdvancedDropdown';
import { CreateWorkspaceModal } from '../../modals/CreateWorkspaceModal';
import { AssignUserToWorkspaceModal } from '../../modals/AssignUserToWorkspaceModal';
import { MembersTable, Member } from '../../shared/MembersTable';
import { AccessRole } from '../../shared/AccessRoleSelector';
import { defaultRoleConfig } from '../../shared/roleConfig';
import { useWorkspaceAccess } from '../../../hooks/useWorkspaceAccess';
import { useUserRole } from '../../../hooks/useUserRole';

interface WorkspaceTabProps {
  workspaceId: string;
  workspaceTitle?: string;
  workspaceDescription?: string;
}

export const WorkspaceTab: React.FC<WorkspaceTabProps> = ({ workspaceId, workspaceTitle = 'My Workspace', workspaceDescription = '' }) => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = React.useState<string>('');
  const [editWorkspaceName, setEditWorkspaceName] = React.useState('');
  const [editDescription, setEditDescription] = React.useState('');
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = React.useState(false);
  const [editingMemberId, setEditingMemberId] = React.useState<string | null>(null);

  const updateWorkspaceMutation = useUpdateWorkspace();
  const workspacesQuery = useWorkspaces();
  const workspaceMembersQuery = useWorkspaceMembers(selectedWorkspaceId);
  const workspaceBasesQuery = useWorkspaceBases(selectedWorkspaceId);
  const removeUserFromWorkspaceMutation = useRemoveUserFromWorkspace();
  const toast = useToast();
  const { canCreateWorkspace, canAssignUsers } = useWorkspaceAccess(selectedWorkspaceId);
  const { isAdmin } = useUserRole();

  const workspaces = workspacesQuery.data || [];

  // Create dropdown options from workspaces
  const workspaceDropdownOptions = workspaces.map((ws: any) => ({
    label: ws.title || 'Untitled Workspace',
    value: ws.id,
  }));

  // Get selected workspace details from workspaces list
  const selectedWorkspace = workspaces.find((ws: any) => ws.id === selectedWorkspaceId);

  // Set default selected workspace on load
  React.useEffect(() => {
    if (workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, selectedWorkspaceId]);

  // Initialize edit form when modal opens
  React.useEffect(() => {
    if (isEditModalOpen && selectedWorkspace) {
      setEditWorkspaceName(selectedWorkspace.title || '');
      setEditDescription(selectedWorkspace.description || '');
    }
  }, [isEditModalOpen, selectedWorkspace]);

  const handleSaveWorkspace = async () => {
    if (!selectedWorkspaceId || !selectedWorkspace) return;

    const payload: any = {};

    if (editWorkspaceName !== selectedWorkspace.title) {
      payload.title = editWorkspaceName;
    }

    if (editDescription !== (selectedWorkspace.description || '')) {
      payload.description = editDescription;
    }

    if (Object.keys(payload).length === 0) {
      toast.info('No changes to save');
      setIsEditModalOpen(false);
      return;
    }

    try {
      await updateWorkspaceMutation.mutateAsync({
        workspaceId: selectedWorkspaceId,
        updates: payload
      });
      toast.success('Workspace updated successfully');
      setIsEditModalOpen(false);
      workspacesQuery.refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update workspace');
      throw error; // Re-throw so modal can handle it
    }
  };

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
    console.log(`Change role for ${memberId} to ${newRole}`);
    toast.info('Role change functionality coming soon');
  };

  const handleCopyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    toast.success('User ID copied to clipboard');
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedWorkspaceId) {
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
        workspaceId: selectedWorkspaceId,
        workspace_id: selectedWorkspaceId,
        user_id: member.userId
      });
      toast.success('Member removed successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove member');
    }
  };

  const handleEditMember = (memberId: string) => {
    // Find the member to get user_id
    const member = members.find(m => m.id === memberId);
    if (!member) {
      toast.error('Member not found');
      return;
    }
    setEditingMemberId(member.userId);
    setIsAssignUserModalOpen(true);
  };

  // Get bases data
  const basesData = workspaceBasesQuery.data?.data || workspaceBasesQuery.data || [];
  const bases = Array.isArray(basesData) ? basesData : [];

  return (
    <div className="space-y-0">
      {/* Workspace Selector + Information Card */}
      <div className="bg-card rounded-xl border shadow-sm p-4 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-primary mb-3">Select Workspace</h3>
            <AdvancedDropdown
              label=""
              options={workspaceDropdownOptions}
              value={selectedWorkspaceId}
              onChange={(value) => setSelectedWorkspaceId(value as string)}
              placeholder="Select a workspace"
              searchable
            />
          </div>
          {canCreateWorkspace() && (
            <button
              onClick={() => setIsCreateWorkspaceModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 btn-primary whitespace-nowrap flex-shrink-0 mt-9"
            >
              <Plus size={14} />
              Create Workspace
            </button>
          )}
        </div>

        {selectedWorkspaceId && selectedWorkspace && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Workspace Name</label>
                <div className="text-sm text-primary">
                  {selectedWorkspace.title || 'Untitled Workspace'}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-secondary">Description</label>
                  {isAdmin() && (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="p-1.5 hover:bg-alpha-white rounded transition-colors"
                      title="Edit workspace"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-secondary hover:text-primary" />
                    </button>
                  )}
                </div>
                <div className="text-sm text-primary">
                  {selectedWorkspace.description || 'No description'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedWorkspaceId && (
        <>
          {/* Two Column Layout: Bases + Members */}
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
                  <h3 className="text-lg font-semibold text-primary">Members</h3>
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
                    onRemoveMember={canAssignUsers() ? handleRemoveMember : undefined}
                    onEditMember={canAssignUsers() ? handleEditMember : undefined}
                    showSearch={true}
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={isCreateWorkspaceModalOpen}
        onClose={() => setIsCreateWorkspaceModalOpen(false)}
        onSuccess={() => {
          // Refetch workspaces to update the dropdown
          workspacesQuery.refetch();
        }}
      />

      {/* Edit Workspace Modal */}
      {isEditModalOpen && selectedWorkspace && (
        <CreateWorkspaceModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            workspacesQuery.refetch();
            setIsEditModalOpen(false);
          }}
          title="Edit Workspace"
          submitButtonText="Save Changes"
          name={editWorkspaceName}
          setName={setEditWorkspaceName}
          description={editDescription}
          setDescription={setEditDescription}
          onSubmit={handleSaveWorkspace}
        />
      )}

      {/* Assign User to Workspace Modal */}
      <AssignUserToWorkspaceModal
        isOpen={isAssignUserModalOpen}
        onClose={() => {
          setIsAssignUserModalOpen(false);
          setEditingMemberId(null);
        }}
        onSuccess={() => {
          workspaceMembersQuery.refetch();
          setEditingMemberId(null);
        }}
        workspaceId={selectedWorkspaceId}
        editMode={!!editingMemberId}
        memberToEdit={editingMemberId || undefined}
      />
    </div>
  );
};