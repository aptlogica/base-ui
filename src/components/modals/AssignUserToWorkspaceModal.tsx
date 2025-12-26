import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader2, CheckCircle2, UserPlus, Edit, ChevronDown } from 'lucide-react';
import { useAssignUserToWorkspace, useGetTenantUsers, useWorkspaceBases, useWorkspaceMembers, useBaseMembers, useUserAccessDetails } from '../../hooks/useApi';
import { useToast } from '../common/Toast';
import { AdvancedDropdown } from '../common/dropdown/AdvancedDropdown';
import { useAuth } from '../../auth/AuthContext';
import { useWorkspaceAccess } from '../../hooks/useWorkspaceAccess';
import { MultiSelectTags, MultiSelectTagsOption } from '../common/MultiSelectTags';

interface AssignUserToWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  workspaceId: string;
  baseId?: string; // Optional: if provided, filter base members instead of workspace members
  editMode?: boolean; // If true, modal is in edit mode
  memberToEdit?: string; // User ID of the member being edited
}

export const AssignUserToWorkspaceModal: React.FC<AssignUserToWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  workspaceId,
  baseId,
  editMode = false,
  memberToEdit,
}) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('base_member');
  const [accessLevel, setAccessLevel] = useState<'full_access' | 'limited_access'>('full_access');
  const [selectedBases, setSelectedBases] = useState<string[]>([]);
  const [baseSelectionType, setBaseSelectionType] = useState<'all_bases' | 'specific_base'>('all_bases');

  const assignUserToWorkspaceMutation = useAssignUserToWorkspace();
  const tenantUsersQuery = useGetTenantUsers();
  const workspaceBasesQuery = useWorkspaceBases(workspaceId);
  // Fetch user access details when in edit mode
  const userAccessDetailsQuery = useUserAccessDetails(editMode && memberToEdit ? memberToEdit : null, editMode ? workspaceId : undefined);

  // Conditionally fetch members based on context
  // If baseId is provided, fetch base members; otherwise fetch workspace members
  const workspaceMembersQuery = useWorkspaceMembers(workspaceId);
  const baseMembersQuery = useBaseMembers(baseId || '');

  const toast = useToast();
  const { user: currentUser } = useAuth();
  const { accessLevel: currentUserAccessLevel } = useWorkspaceAccess(workspaceId);

  const tenantUsers = tenantUsersQuery.data || [];
  const basesData = workspaceBasesQuery.data?.data || workspaceBasesQuery.data || [];
  const bases = Array.isArray(basesData) ? basesData : [];

  // Get existing member user IDs to filter them out
  // If baseId is provided, filter base members; otherwise filter workspace members
  const existingMemberUserIds = React.useMemo(() => {
    if (baseId) {
      // Filter base members when called from base level
      if (!baseMembersQuery.data?.data) return [];
      const membersData = Array.isArray(baseMembersQuery.data.data)
        ? baseMembersQuery.data.data
        : [];
      return membersData.map((member: any) => member.user_id || member.id).filter(Boolean);
    } else {
      // Filter workspace members when called from workspace level
      if (!workspaceMembersQuery.data?.data) return [];
      const membersData = Array.isArray(workspaceMembersQuery.data.data)
        ? workspaceMembersQuery.data.data
        : [];
      return membersData.map((member: any) => member.user_id || member.id).filter(Boolean);
    }
  }, [baseId, baseMembersQuery.data, workspaceMembersQuery.data]);

  // Create dropdown options from users, showing only active users and excluding current user, admin users, and existing members
  const currentUserId = currentUser?.id || sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
  const userDropdownOptions: MultiSelectTagsOption[] = useMemo(() => {
    return tenantUsers
      .filter((user: any) => {
        // Only show active users (status === 'active' && email_verified === true)
        const isActive = user.status?.toLowerCase() === 'active' && user.email_verified === true;
        if (!isActive) return false;
        
        // Exclude current user
        if (user.id === currentUserId) return false;
        // Exclude admin users
        if (user.roles === 'Admin') return false;
        // Exclude users who are already members (workspace or base, depending on context)
        if (existingMemberUserIds.includes(user.id)) return false;
        return true;
      })
      .map((user: any) => ({
        label: user.display_name || user.email || 'Unknown User',
        value: user.id,
        description: user.email,
      }));
  }, [tenantUsers, currentUserId, existingMemberUserIds]);

  // Role options - based on design, these are the available roles
  const roleOptions = React.useMemo(() => {
    return [
      { label: 'Workspace Maintainer', value: 'workspace_maintainer' },
      { label: 'Workspace Read Only', value: 'workspace_read_only' },
      { label: 'Base Member', value: 'base_member' },
      { label: 'Base Read only', value: 'base_read_only' },
    ];
  }, []);

  // Base selection options
  const baseSelectionOptions = React.useMemo(() => {
    return [
      { label: 'All Bases', value: 'all_bases' },
      { label: 'Specific Base', value: 'specific_base' },
    ];
  }, []);

  // Map role to access_level for API
  const getAccessLevelFromRole = (role: string): 'full_access' | 'limited_access' => {
    if (role === 'workspace_maintainer' || role === 'base_member') {
      return 'full_access';
    }
    return 'limited_access';
  };

  // Check if role allows base selection
  const roleAllowsBaseSelection = (role: string): boolean => {
    return role === 'base_member' || role === 'base_read_only';
  };

  // Reset form when modal opens/closes or load edit data
  useEffect(() => {
    if (isOpen) {
      if (editMode && memberToEdit) {
        // Edit mode: Load existing member data
        if (userAccessDetailsQuery.data) {
          const accessData = userAccessDetailsQuery.data as any;
          const workspaces = accessData?.workspaces || [];
          const currentWorkspace = workspaces.find((ws: any) => ws.id === workspaceId);
          
          if (currentWorkspace) {
            // Set access level
            const wsAccessLevel = currentWorkspace.access_level === 'full_access' ? 'full_access' : 'limited_access';
            setAccessLevel(wsAccessLevel);
            
            // Determine role based on access level
            if (wsAccessLevel === 'full_access') {
              setSelectedRole('workspace_maintainer');
            } else {
              setSelectedRole('workspace_read_only');
            }
            
            // Set selected bases (existing bases for limited access)
            if (wsAccessLevel === 'limited_access' && currentWorkspace.bases && currentWorkspace.bases.length > 0) {
              const baseIds = currentWorkspace.bases.map((base: any) => base.id);
              setSelectedBases(baseIds);
              setBaseSelectionType('specific_base');
            } else {
              setSelectedBases([]);
              setBaseSelectionType('all_bases');
            }
            
            // Set selected user (disabled in edit mode)
            setSelectedUserIds([memberToEdit]);
          }
        }
      } else {
        // Add mode: Reset form
        setSelectedUserIds([]);
        setSelectedRole('base_member');
        // Default to limited_access for full_access users, full_access for admin users
        setAccessLevel(currentUserAccessLevel === 'admin' ? 'full_access' : 'limited_access');
        setSelectedBases([]);
        setBaseSelectionType('all_bases');
      }
    }
  }, [isOpen, currentUserAccessLevel, editMode, memberToEdit, userAccessDetailsQuery.data, workspaceId]);

  const handleAssignUser = async () => {
    if (!selectedUserIds || selectedUserIds.length === 0 || !workspaceId) {
      toast.error('Please select at least one user');
      return;
    }

    // Validate bases selection for specific base selection
    if (baseSelectionType === 'specific_base' && selectedBases.length === 0) {
      toast.error('Please select at least one base');
      return;
    }

    // Map role to access_level
    const finalAccessLevel = getAccessLevelFromRole(selectedRole);

    try {
      // Determine bases_ids based on selection type
      let basesIds = baseSelectionType === 'all_bases' ? '*' : selectedBases.join(',');
      
      const params: {
        workspace_id: string;
        user_ids: string[];
        access_level: string;
        bases_ids: string;
      } = {
        workspace_id: workspaceId,
        user_ids: selectedUserIds,
        access_level: finalAccessLevel,
        bases_ids: basesIds,
      };

      const result = await assignUserToWorkspaceMutation.mutateAsync(params);
      const response = result?.data || result;

      // Handle response with success/failure counts
      if (response?.success_count !== undefined && response?.failure_count !== undefined) {
        const successCount = response.success_count || 0;
        const failureCount = response.failure_count || 0;
        const totalUsers = selectedUserIds.length;

        if (successCount > 0 && failureCount === 0) {
          toast.success(
            editMode
              ? 'Member updated successfully'
              : totalUsers === 1
              ? 'User assigned to workspace successfully'
              : `${successCount} user${successCount > 1 ? 's' : ''} assigned to workspace successfully`
          );
        } else if (successCount > 0 && failureCount > 0) {
          // Build error message from failures array if available
          const failureMessages = response.failures?.map((f: any) => {
            const user = tenantUsers.find((u: any) => u.id === f.user_id);
            const userName = user?.display_name || user?.email || f.user_id;
            return `${userName}: ${f.error || 'Failed to assign'}`;
          }) || [];

          toast.error(
            `${successCount} user${successCount > 1 ? 's' : ''} assigned, ${failureCount} failed. ${failureMessages.join('; ')}`
          );
        } else {
          const failureMessages = response.failures?.map((f: any) => {
            const user = tenantUsers.find((u: any) => u.id === f.user_id);
            const userName = user?.display_name || user?.email || f.user_id;
            return `${userName}: ${f.error || 'Failed to assign'}`;
          }) || [];
          toast.error(`Failed to assign users. ${failureMessages.join('; ')}`);
          return; // Don't close modal if all failed
        }
      } else {
        // Fallback for simple success response
        toast.success(
          editMode
            ? 'Member updated successfully'
            : selectedUserIds.length === 1
            ? 'User assigned to workspace successfully'
            : `${selectedUserIds.length} users assigned to workspace successfully`
        );
      }

      // Reset form
      setSelectedUserIds([]);
      setSelectedRole('base_member');
      setAccessLevel('full_access');
      setSelectedBases([]);
      setBaseSelectionType('all_bases');

      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to assign users to workspace');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Show error if workspaceId is not available
  if (!workspaceId) {
    return (
      <div
        className="bg-modal-backdrop"
        onClick={onClose}
      >
        <div
          className="bg-modal min-h-[500px] max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 icon-primary rounded-xl flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-primary">
                  {editMode ? 'Edit Member Access' : 'Assign User to Workspace'}
                </h2>
                <p className="text-sm text-secondary">
                  {editMode ? 'Update member access level and base permissions' : 'Grant users access to this workspace'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X size={16} className="text-[var(--text-color-tertiary)]" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 font-medium">Workspace ID is required</p>
              <p className="text-sm text-secondary mt-2">Please ensure you have selected a valid workspace.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-modal-backdrop"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-modal !max-w-5xl !p-0 flex flex-col h-[90vh] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              {editMode ? <Edit className="w-5 h-5 text-green-600" /> : <UserPlus className="w-5 h-5 text-green-600" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">
                {editMode ? 'Edit Member Access' : 'Add Member'}
              </h2>
              <p className="text-sm text-secondary">
                {editMode ? 'Update member access level and base permissions' : 'Add member to collaborate on this project'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 lg:p-6">
            {editMode && userAccessDetailsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-primary font-medium">Loading member details...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Select Member Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Member</label>
                  {editMode ? (
                    <div className="px-4 py-3 bg-gray-50 border border rounded-xl text-sm text-gray-700">
                      {(() => {
                        const user = tenantUsers.find((u: any) => u.id === memberToEdit);
                        return user?.display_name || user?.email || memberToEdit || 'Unknown User';
                      })()}
                    </div>
                  ) : (
                    <MultiSelectTags
                      options={userDropdownOptions}
                      value={selectedUserIds}
                      onChange={(newValue) => setSelectedUserIds(newValue as string[])}
                      placeholder="Select users to assign"
                      searchPlaceholder="Search users..."
                      disabled={assignUserToWorkspaceMutation.isPending}
                    />
                  )}
                </div>

                {/* Select Role Section */}
                {(selectedUserIds.length > 0 || editMode) && (
                  <div>
                    <AdvancedDropdown
                      label="Select Role"
                      options={roleOptions}
                      value={selectedRole}
                      onChange={(value) => {
                        const role = value as string;
                        setSelectedRole(role);
                        // Update access level based on role
                        setAccessLevel(getAccessLevelFromRole(role));
                        // If role is not base-specific, reset base selection
                        if (!roleAllowsBaseSelection(role)) {
                          setBaseSelectionType('all_bases');
                          setSelectedBases([]);
                        } else if (baseSelectionType === 'all_bases') {
                          // Keep current selection type for base roles
                        }
                      }}
                      placeholder="Select a role"
                      disabled={assignUserToWorkspaceMutation.isPending || (editMode && userAccessDetailsQuery.isLoading)}
                    />
                  </div>
                )}

                {/* Select Base Section - Only show for base-specific roles */}
                {(selectedUserIds.length > 0 || editMode) && roleAllowsBaseSelection(selectedRole) && (
                  <div>
                    <AdvancedDropdown
                      label="Select Base"
                      options={baseSelectionOptions}
                      value={baseSelectionType}
                      onChange={(value) => {
                        const selectionType = value as 'all_bases' | 'specific_base';
                        setBaseSelectionType(selectionType);
                        if (selectionType === 'all_bases') {
                          setSelectedBases([]);
                        }
                      }}
                      placeholder="Select base selection type"
                      disabled={assignUserToWorkspaceMutation.isPending || (editMode && userAccessDetailsQuery.isLoading)}
                    />
                  </div>
                )}

                {/* Bases List (when Specific Base is selected) */}
                {(selectedUserIds.length > 0 || editMode) && roleAllowsBaseSelection(selectedRole) && baseSelectionType === 'specific_base' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bases</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-xl p-3">
                      {bases.length > 0 ? (
                        bases.map((base: any) => (
                          <label
                            key={base.id}
                            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-xl cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedBases.includes(base.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBases([...selectedBases, base.id]);
                                } else {
                                  setSelectedBases(selectedBases.filter(id => id !== base.id));
                                }
                              }}
                              className="checkbox-primary-brand"
                            />
                            <span className="text-sm text-gray-700 flex-1">
                              {base.title || base.name || 'Untitled Base'}
                            </span>
                            {selectedBases.includes(base.id) && (
                              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            )}
                          </label>
                        ))
                      ) : (
                        <div className="text-center py-4 text-sm text-gray-500">
                          No bases available in this workspace
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={assignUserToWorkspaceMutation.isPending}
            className="px-4 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleAssignUser}
            disabled={assignUserToWorkspaceMutation.isPending || selectedUserIds.length === 0 || (baseSelectionType === 'specific_base' && selectedBases.length === 0) || (editMode && userAccessDetailsQuery.isLoading)}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-black font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {assignUserToWorkspaceMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            {assignUserToWorkspaceMutation.isPending
              ? editMode
                ? 'Updating...'
                : 'Adding...'
              : editMode
                ? 'Update Member'
                : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

