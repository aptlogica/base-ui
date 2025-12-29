import React, { useRef, useEffect } from 'react';
import { Plus, Loader2, Edit2, ChevronsUpDown } from 'lucide-react';
import { useUpdateWorkspace, useWorkspaces, useWorkspaceMembers, useRemoveUserFromWorkspace } from '../../../hooks/useApi';
import { useToast } from '../../common/Toast';
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

export const WorkspaceTab: React.FC<WorkspaceTabProps> = () => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = React.useState<string>('');
  const [editWorkspaceName, setEditWorkspaceName] = React.useState('');
  const [editDescription, setEditDescription] = React.useState('');
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = React.useState(false);
  const [editingMemberId, setEditingMemberId] = React.useState<string | null>(null);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = React.useState(false);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);
  const workspaceButtonRef = useRef<HTMLButtonElement>(null);

  const updateWorkspaceMutation = useUpdateWorkspace();
  const workspacesQuery = useWorkspaces();
  const workspaceMembersQuery = useWorkspaceMembers(selectedWorkspaceId);
  const removeUserFromWorkspaceMutation = useRemoveUserFromWorkspace();
  const toast = useToast();
  const { canCreateWorkspace, canAssignUsers } = useWorkspaceAccess(selectedWorkspaceId);
  const { isAdmin } = useUserRole();

  const workspaces = workspacesQuery.data || [];

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
        dateJoined: member.created_time || member.created_at || '',
        avatar: member.avatar || undefined,
        access_level: member.access_level, // Pass raw access_level from API
        last_active_at: member.last_active_at || undefined,
        last_login_at: member.last_login_at || undefined,
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

  // Get workspace icon
  const getWorkspaceIcon = (workspace: any) => {
    if (!workspace) return { initials: 'W', color: 'bg-purple-400' };
    const initials = (workspace.title?.charAt(0) || workspace.name?.charAt(0) || 'W').toUpperCase();
    const colors = ['bg-purple-400', 'bg-red-400', 'bg-orange-400', 'bg-blue-400', 'bg-green-400'];
    const hash = workspace.id ? workspace.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : 0;
    return { initials, color: colors[hash % colors.length] };
  };

  const workspaceIcon = getWorkspaceIcon(selectedWorkspace);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!workspaceDropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(target) &&
        workspaceButtonRef.current && !workspaceButtonRef.current.contains(target)) {
        setWorkspaceDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [workspaceDropdownOpen]);

  return (
    <div className="space-y-0">
      {/* Header with Workspace Dropdown, Edit Details, and Create Workspace */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Workspace Dropdown */}
        <div className="relative" ref={workspaceDropdownRef}>
          <button
            ref={workspaceButtonRef}
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 border border-transparent rounded-xl hover:bg-gray-100 hover:border transition-colors"
          >
            {selectedWorkspace ? (
              <>
                <div className={`w-8 h-8 ${workspaceIcon.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-sm">
                    {workspaceIcon.initials}
                  </span>
                </div>
                <span className="text-sm font-medium text-primary">
                  {selectedWorkspace.title || selectedWorkspace.name || 'Untitled Workspace'}
                </span>
              </>
            ) : (
              <>
                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">W</span>
                </div>
                <span className="text-sm font-medium text-gray-500">Select Workspace</span>
              </>
            )}
            <ChevronsUpDown className="w-4 h-4 text-gray-400 transition-transform flex-shrink-0" />
          </button>

          {/* Workspace Dropdown Menu */}
          {workspaceDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-card border rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-2">
                {workspaces.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No workspaces found
                  </div>
                ) : (
                  workspaces.map((ws: any) => {
                    const icon = getWorkspaceIcon(ws);
                    const isSelected = ws.id === selectedWorkspaceId;
                    return (
                      <button
                        key={ws.id}
                        onClick={() => {
                          setSelectedWorkspaceId(ws.id);
                          setWorkspaceDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-gray-100 transition-colors ${isSelected ? 'bg-gray-50' : ''
                          }`}
                      >
                        <div className={`w-8 h-8 ${icon.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-bold text-sm">
                            {icon.initials}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {ws.title || ws.name || 'Untitled Workspace'}
                            </span>
                            {isSelected && (
                              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Edit Details and Create Workspace Buttons */}
        <div className="flex items-center gap-3">
          {selectedWorkspaceId && selectedWorkspace && isAdmin() && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm border rounded-xl text-primary hover:bg-gray-100 transition-colors"
            >
              <Edit2 size={14} />
              Edit Details
            </button>
          )}
          {canCreateWorkspace() && (
            <button
              onClick={() => setIsCreateWorkspaceModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 btn-primary text-sm"
            >
              <Plus size={14} />
              Create Workspace
            </button>
          )}
        </div>
      </div>

      {/* Members Table */}
      {selectedWorkspaceId && (
        <div>
          {workspaceMembersQuery.isLoading ? (
            <div className="bg-card rounded-xl border p-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-primary font-medium">Loading members...</p>
              </div>
            </div>
          ) : workspaceMembersQuery.error ? (
            <div className="bg-card rounded-xl border p-12">
              <div className="text-center border border-dashed border-red-200 rounded-xl bg-red-50 py-8">
                <p className="text-red-600 font-medium">Failed to load members</p>
                <p className="text-sm text-red-500 mt-1">
                  {workspaceMembersQuery.error instanceof Error
                    ? workspaceMembersQuery.error.message
                    : 'An error occurred'}
                </p>
              </div>
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
              headerActions={
                canAssignUsers() ? (
                  <button
                    onClick={() => setIsAssignUserModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 btn-primary text-sm"
                  >
                    <Plus size={14} />
                    Add Member
                  </button>
                ) : undefined
              }
            />
          )}
        </div>
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