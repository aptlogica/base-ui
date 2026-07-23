// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Loader2, Edit2, ChevronsUpDown } from 'lucide-react';
import { useUpdateWorkspace, useWorkspaces, useWorkspaceMembers, useRemoveUserFromWorkspace } from '../../../hooks/useApi';
import { useToast } from '../../common/Toast';
import { CreateWorkspaceModal } from '../../modals/CreateWorkspaceModal';
import { AssignUserToWorkspaceModal } from '../../modals/AssignUserToWorkspaceModal';
import { MembersTable, Member } from '../../shared/MembersTable';
import { AccessRole } from '../../shared/AccessRoleSelector';
import { useWorkspaceAccess } from '../../../hooks/useWorkspaceAccess';
import { useUserRole } from '../../../hooks/useUserRole';
import { getRoleLabel } from '../../../types/roles';
import { getInitials } from '../../../utils/helpers';

interface WorkspaceTabProps {
  workspaceId: string;
  workspaceTitle?: string;
  workspaceDescription?: string;
}

export const WorkspaceTab: React.FC<WorkspaceTabProps> = () => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [editWorkspaceName, setEditWorkspaceName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);
  const workspaceButtonRef = useRef<HTMLButtonElement>(null);

  const updateWorkspaceMutation = useUpdateWorkspace();
  const workspacesQuery = useWorkspaces();
  const workspaceMembersQuery = useWorkspaceMembers(selectedWorkspaceId);
  const removeUserFromWorkspaceMutation = useRemoveUserFromWorkspace();
  const toast = useToast();
  const { canCreateWorkspace, canAssignUsers, isAdmin: isWorkspaceOwnerOrCoOwner, isWorkspaceReadOnly } = useWorkspaceAccess(selectedWorkspaceId);
  const { isAdmin } = useUserRole();

  const workspaces = workspacesQuery.data ?? [];

  // Get selected workspace details from workspaces list
  const selectedWorkspace = workspaces.find((ws: any) => ws.id === selectedWorkspaceId);

  // Keep the local tab selection valid.
  // If the selected workspace disappears after deletion/refetch, fall back to the first remaining workspace.
  useEffect(() => {
    if (workspaces.length === 0) {
      if (selectedWorkspaceId) {
        setSelectedWorkspaceId('');
      }
      return;
    }

    const hasSelectedWorkspace = !!selectedWorkspaceId && workspaces.some((ws: any) => ws.id === selectedWorkspaceId);

    if (!selectedWorkspaceId || !hasSelectedWorkspace) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, selectedWorkspaceId]);

  // Initialize edit form when modal opens
  useEffect(() => {
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
      // Re-throw so CreateWorkspaceModal can show the error toast (avoid double toast)
      throw error;
    }
  };

  // Map API response to Member interface
  const members: Member[] = useMemo(() => {
    const queryData = workspaceMembersQuery.data as any;
    if (!queryData?.data) return [];

    const membersData = Array.isArray(queryData.data)
      ? queryData.data
      : [];

    return membersData.map((member: any) => {
      // Map access_level to AccessRole
      let role: AccessRole = 'viewer';
      if (member.access_level === 'workspaceAdmin') {
        role = 'owner';
      } else if (member.access_level === 'workspaceMember') {
        role = 'editor';
      }

      return {
        id: member.id || member.user_id || '',
        userId: member.user_id || member.id || '',
        name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email || 'Unknown User',
        email: member.email || '',
        role: role,
        dateJoined: member.created_time || member.created_at || '',
        avatar: member.avatar || undefined,
        access_level: member.access_level, // Pass raw access_level from API
        last_active_at: member.last_modified_time || undefined,
        last_login_at: member.last_login_at || undefined,
        roles: member.roles || undefined, // Pass roles array from API (same structure as UserTable)
      };
    });
  }, [workspaceMembersQuery.data]);

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

    // Use user_id instead of accessId for removeUserFromWorkspace API
    try {
      await removeUserFromWorkspaceMutation.mutateAsync({
        workspaceId: selectedWorkspaceId,
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
    if (!workspace) return { initials: 'WS', color: 'bg-purple-400' };
    const initials = getInitials(workspace.title || workspace.name || 'W', 'WS');
    const colors = ['bg-purple-400', 'bg-red-400', 'bg-orange-400', 'bg-blue-400', 'bg-green-400'];
    const hash = workspace.id ? workspace.id.split('').reduce((acc: number, char: string) => acc + (char.codePointAt(0) || 0), 0) : 0;
    return { initials, color: colors[hash % colors.length] };
  };

  const workspaceIcon = getWorkspaceIcon(selectedWorkspace);

  // Helper function to get error message
  const getErrorMessage = (): string => {
    if (workspaceMembersQuery.error instanceof Error) {
      return workspaceMembersQuery.error.message;
    }
    return 'An error occurred';
  };

  // Helper function to render members table content
  const renderMembersContent = () => {
    if (workspaceMembersQuery.isLoading) {
      return (
        <div className="bg-card rounded-xl border p-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-primary font-medium">Loading members...</p>
          </div>
        </div>
      );
    }
    if (workspaceMembersQuery.error) {
      return (
        <div className="bg-card rounded-xl border p-12">
          <div className="text-center border border-dashed border-red-200 rounded-xl bg-red-50 py-8">
            <p className="text-red-600 font-medium">Failed to load members</p>
            <p className="text-sm text-red-500 mt-1">
              {getErrorMessage()}
            </p>
          </div>
        </div>
      );
    }
    return (
      <MembersTable
        members={members}
        onRemoveMember={canAssignUsers() && !isWorkspaceReadOnly() ? handleRemoveMember : undefined}
        workspaceId={selectedWorkspaceId}
        onEditMember={canAssignUsers() && !isWorkspaceReadOnly() ? handleEditMember : undefined}
        showSearch={true}
        headerActions={
          canAssignUsers() && !isWorkspaceReadOnly() ? (
            <button
              onClick={() => setIsAssignUserModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 btn-primary text-sm"
            >
              <Plus className='h-5 w-5' />
              Add Member
            </button>
          ) : undefined
        }
      />
    );
  };

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
                <div className={`w-10 h-10 ${workspaceIcon.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-sm">
                    {workspaceIcon.initials}
                  </span>
                </div>
                <span title={selectedWorkspace.title || selectedWorkspace.name} className="text-sm font-medium text-primary">
                  {selectedWorkspace.title || selectedWorkspace.name || 'Untitled Workspace'}
                </span>
              </>
            ) : (
              <>
                <div className="w-8 h-8 bg-gray-400 border justify-center flex-shrink-0">
                  <span className="text-white text-sm">W</span>
                </div>
                <span title="Select Workspace" className="text-sm font-medium text-gray-500">Select Workspace</span>
              </>
            )}
            <ChevronsUpDown className="w-4 h-4 text-gray-400 transition-transform flex-shrink-0" />
          </button>

          {/* Workspace Dropdown Menu */}
          {workspaceDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-96 bg-card border rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-2 space-y-1">
                {workspaces.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No workspaces found
                  </div>
                ) : (
                  workspaces.map((ws: any) => {
                    const icon = getWorkspaceIcon(ws);
                    const isSelected = ws.id === selectedWorkspaceId;

                    let accessLevelClasses = 'bg-gray-50 text-gray-700 border-gray-200';
                    if (ws.access_level === 'workspace-read' || ws.access_level === 'base-read') {
                      accessLevelClasses = 'bg-green-50 text-green-700 border-green-200';
                    } else if (ws.access_level === 'base') {
                      accessLevelClasses = 'bg-blue-50 text-blue-700 border-blue-200';
                    } else if (ws.access_level === 'maintainer') {
                      accessLevelClasses = 'bg-purple-50 text-purple-700 border-purple-200';
                    }

                    return (
                      <button
                        key={ws.id}
                        onClick={() => {
                          setSelectedWorkspaceId(ws.id);
                          setWorkspaceDropdownOpen(false);
                        }}
                        className={`w-full space-y-1 flex items-center gap-3 px-3 py-1 rounded-xl text-left hover:bg-gray-100 transition-colors ${isSelected ? 'bg-gray-50' : ''
                          }`}
                      >
                        <div className={`w-10 h-10 ${icon.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-sm">
                            {icon.initials}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span title={ws.title || ws.name} className="text-sm font-medium text-gray-900 truncate">
                              {ws.title || ws.name || 'Untitled Workspace'}
                            </span>

                            {/* Access Level Badge - Don't show for owner/co-owner */}
                            {ws.access_level && ws.access_level !== 'owner' && ws.access_level !== 'co-owner' && (
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border flex-shrink-0 ${accessLevelClasses}`}>
                                {getRoleLabel(ws.access_level)}
                              </span>
                            )}

                            {isSelected && (
                              <div className="w-2 h-2 bg-green-500 rounded-full ring ring-green-100 flex-shrink-0 ml-auto"></div>
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
          {selectedWorkspaceId && selectedWorkspace && (isAdmin() || isWorkspaceOwnerOrCoOwner) && !isWorkspaceReadOnly() && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm border text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Edit2 className='h-5 w-5 text-gray-500' />
              Edit Details
            </button>
          )}
          {canCreateWorkspace() && !isWorkspaceReadOnly() && (
            <button
              onClick={() => setIsCreateWorkspaceModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 btn-primary text-sm"
            >
              <Plus className='h-5 w-5' />
              Create Workspace
            </button>
          )}
        </div>
      </div>

      {/* Members Table */}
      {selectedWorkspaceId && (
        <div>
          {renderMembersContent()}
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
          currentWorkspaceId={selectedWorkspaceId}
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