import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader2, CheckCircle2, UserPlus, Edit, Trash2 } from 'lucide-react';
import { useBulkAddMembers, useGetUsersForAssign, useWorkspaceBases, useWorkspaceMembers, useBaseMembers, useUserRolesAndAccess, useRemoveUserFromWorkspace, useRemoveUserFromBase } from '../../hooks/useApi';
import { useToast } from '../common/Toast';
import { AdvancedDropdown } from '../common/dropdown/AdvancedDropdown';
import { useAuth } from '../../auth/AuthContext';
import { MultiSelectTags, MultiSelectTagsOption } from '../common/MultiSelectTags';
import { useUserRole } from '../../hooks/useUserRole';

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
  const userRole = useUserRole();
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id || sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
  
  // Fetch current user's workspace access to determine their role in THIS workspace
  const { data: currentUserWorkspaceAccess } = useUserRolesAndAccess(currentUserId || null);
  
  // Check if current user is maintainer in this workspace (not owner/coowner at system level)
  const isMaintainerOnly = React.useMemo(() => {
    // If system owner or co-owner, they can assign any role
    if (userRole.hasAdminRole()) return false;
    
    // Check workspace-specific role
    if (currentUserWorkspaceAccess && Array.isArray(currentUserWorkspaceAccess) && workspaceId) {
      const workspace = currentUserWorkspaceAccess.find((ws: any) => ws.workspace_id === workspaceId);
      if (workspace && workspace.access === 'maintainer') {
        return true; // User is maintainer in this workspace
      }
    }
    return false;
  }, [userRole, currentUserWorkspaceAccess, workspaceId]);
  
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const defaultRole = isMaintainerOnly ? 'base-member' : 'maintainer';
  const [selectedRole, setSelectedRole] = useState<string>(defaultRole);
  const [selectedBases, setSelectedBases] = useState<string[]>([]);
  const [baseSelectionType, setBaseSelectionType] = useState<'all_bases' | 'specific_base'>('all_bases');
  // State to track individual base roles in edit mode
  const [baseRoles, setBaseRoles] = useState<Record<string, string>>({});

  const bulkAddMembersMutation = useBulkAddMembers();
  const removeUserFromWorkspaceMutation = useRemoveUserFromWorkspace();
  const removeUserFromBaseMutation = useRemoveUserFromBase();
  const tenantUsersQuery = useGetUsersForAssign();
  const workspaceBasesQuery = useWorkspaceBases(workspaceId);
  // Fetch user roles and access when in edit mode - using same API as UserTable
  const { data: userRolesAndAccessData, isLoading: isLoadingUserAccess } = useUserRolesAndAccess(editMode && memberToEdit ? memberToEdit : null);

  // Conditionally fetch members based on context
  // If baseId is provided, fetch base members; otherwise fetch workspace members
  const workspaceMembersQuery = useWorkspaceMembers(workspaceId);
  const baseMembersQuery = useBaseMembers(baseId || '');

  const toast = useToast();

  const tenantUsers = tenantUsersQuery.data || [];
  const basesData = (workspaceBasesQuery.data as any)?.data || (workspaceBasesQuery.data as any) || [];
  const bases = Array.isArray(basesData) ? basesData : [];

  // Get existing member user IDs to filter them out
  // If baseId is provided, filter base members; otherwise filter workspace members
  const existingMemberUserIds = React.useMemo(() => {
    if (baseId) {
      // Filter base members when called from base level
      const baseData = baseMembersQuery.data as any;
      if (!baseData?.data) return [];
      const membersData = Array.isArray(baseData.data)
        ? baseData.data
        : [];
      return membersData.map((member: any) => member.user_id || member.id).filter(Boolean);
    } else {
      // Filter workspace members when called from workspace level
      const workspaceData = workspaceMembersQuery.data as any;
      if (!workspaceData?.data) return [];
      const membersData = Array.isArray(workspaceData.data)
        ? workspaceData.data
        : [];
      return membersData.map((member: any) => member.user_id || member.id).filter(Boolean);
    }
  }, [baseId, baseMembersQuery.data, workspaceMembersQuery.data]);

  // Create dropdown options from users, showing only active users and excluding current user, admin users, and existing members
  const userDropdownOptions: MultiSelectTagsOption[] = useMemo(() => {
    return tenantUsers
      .filter((user: any) => {
        // Only show active users (status === 'active' && email_verified === true)
        const isActive = user.status?.toLowerCase() === 'active' && user.email_verified === true;
        if (!isActive) return false;

        // Exclude current user
        if (user.id === currentUserId) return false;
        // Exclude owner users
        if (user.roles === 'owner') return false;
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

  // Role options - workspace-related only for workspace context
  const roleOptions = React.useMemo(() => {
    // If current user is maintainer only, they can only assign base-level roles
    if (isMaintainerOnly) {
      return [
        { label: 'Base Member', value: 'base-member' },
        { label: 'Base Read Only', value: 'base-read' },
      ];
    }
    // In edit mode for admin, show only workspace-level roles
    if (editMode) {
      return [
        { label: 'Workspace Maintainer', value: 'maintainer' },
        { label: 'Workspace Read Only', value: 'workspace-read' },
      ];
    }
    // In add mode for admin, show all roles - workspace roles first, then base roles
    return [
      { label: 'Workspace Maintainer', value: 'maintainer' },
      { label: 'Workspace Read Only', value: 'workspace-read' },
      { label: 'Base Member', value: 'base-member' },
      { label: 'Base Read Only', value: 'base-read' },
    ];
  }, [editMode, isMaintainerOnly]);

  // Base role options - constant to avoid recreating
  const baseRoleOptions = React.useMemo(() => [
    { label: 'Base Member', value: 'base-member' },
    { label: 'Base Read Only', value: 'base-read' },
  ], []);

  // Base selection options
  const baseSelectionOptions = React.useMemo(() => {
    return [
      { label: 'All Bases', value: 'all_bases' },
      { label: 'Specific Base', value: 'specific_base' },
    ];
  }, []);

  // Check if role allows base selection
  const roleAllowsBaseSelection = (role: string): boolean => {
    return role === 'base-member' || role === 'base-read';
  };

  // Reset form when modal opens/closes or load edit data
  useEffect(() => {
    if (isOpen) {
      if (editMode && memberToEdit) {
        // Edit mode: Load existing member data using getUserRolesAndAccess API
        if (userRolesAndAccessData && Array.isArray(userRolesAndAccessData)) {
          const workspaces = userRolesAndAccessData;
          const currentWorkspace = workspaces.find((ws: any) => ws.workspace_id === workspaceId);

          if (currentWorkspace) {
            const workspaceAccess = currentWorkspace.access || '';

            // Determine role based on access field
            // If access is empty string, it's base-level access (bases array has data)
            // If access has a value, it's workspace-level role (bases array is empty)
            if (workspaceAccess && workspaceAccess !== '') {
              // Workspace-level role
              setSelectedRole(workspaceAccess === 'maintainer' ? 'maintainer' : 'workspace-read');
            } else {
              // Base-level access - initialize base roles
              setSelectedRole('base-member'); // Default, but won't be used in UI
            }

            // Set selected user (disabled in edit mode)
            setSelectedUserIds([memberToEdit]);

            // Initialize base roles from API response
            if (currentWorkspace.bases && Array.isArray(currentWorkspace.bases)) {
              const baseRolesMap: Record<string, string> = {};
              currentWorkspace.bases.forEach((base: any) => {
                if (base.base_id) {
                  baseRolesMap[base.base_id] = base.access || 'base-member';
                }
              });
              setBaseRoles(baseRolesMap);
            } else {
              setBaseRoles({});
            }
          }
        }
      } else {
        // Add mode: Reset form
        setSelectedUserIds([]);
        // Default to workspace-level role (maintainer) for admin, base-member for maintainer
        setSelectedRole(isMaintainerOnly ? 'base-member' : 'maintainer');
        setSelectedBases([]);
        setBaseSelectionType('all_bases');
      }
    }
  }, [isOpen, editMode, memberToEdit, userRolesAndAccessData, workspaceId, isMaintainerOnly]);

  // Handle updating roles in edit mode (called when Update button is clicked)
  const handleUpdateRoles = async () => {
    if (!memberToEdit || !workspaceId) return;

    try {
      const workspaces = Array.isArray(userRolesAndAccessData) ? userRolesAndAccessData : [];
      const currentWorkspace = workspaces.find((ws: any) => ws.workspace_id === workspaceId);
      
      if (!currentWorkspace) {
        toast.error('Workspace not found');
        return;
      }

      const workspaceAccess = currentWorkspace.access || '';
      const isWorkspaceLevel = workspaceAccess !== '';
      
      let membership: {
        workspace_id: string;
        role: string;
        bases: Array<{ base_id: string; role: string }>;
      };

      if (isWorkspaceLevel) {
        // Workspace-level role update
        membership = {
          workspace_id: workspaceId,
          role: selectedRole,
          bases: []
        };
      } else {
        // Base-level role updates - get all bases with their updated roles
        const userBases = currentWorkspace.bases || [];
        const basesToUpdate = userBases.map((base: any) => ({
          base_id: base.base_id,
          role: baseRoles[base.base_id] || base.access || 'base-member'
        }));

        membership = {
          workspace_id: workspaceId,
          role: '', // Empty when bases are provided
          bases: basesToUpdate
        };
      }

      const members = [{
        user_id: memberToEdit,
        memberships: [membership]
      }];

      await bulkAddMembersMutation.mutateAsync({
        workspaceId,
        members
      });

      toast.success('Roles updated successfully');
      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update roles');
    }
  };

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

    try {
      // Build membership request based on role and base selection
      const membership: {
        workspace_id: string;
        role: string;
        bases: Array<{ base_id: string; role: string }>;
      } = {
        workspace_id: workspaceId,
        role: '',
        bases: []
      };

      // If base role is selected (base-member or base-read), always use bases array
      if (roleAllowsBaseSelection(selectedRole)) {
        // For "All Bases", get all base IDs from workspace
        if (baseSelectionType === 'all_bases') {
          // Get all bases from the workspace
          const allBaseIds = bases.map((base: any) => base.id).filter(Boolean);
          membership.bases = allBaseIds.map(baseId => ({
            base_id: baseId,
            role: selectedRole // base-member or base-read
          }));
        }
        // For "Specific Base", use selected bases
        else if (baseSelectionType === 'specific_base' && selectedBases.length > 0) {
          membership.bases = selectedBases.map(baseId => ({
            base_id: baseId,
            role: selectedRole // base-member or base-read
          }));
        }
        // role remains empty string when bases are provided (all or specific)
        // membership.role stays as empty string
      }
      // If workspace-level role is assigned (maintainer, workspace-read), set role and leave bases empty
      else {
        membership.role = selectedRole;
        // bases remains empty array when workspace role is assigned
      }

      // Build members array - each user gets the same membership
      const members = selectedUserIds.map(user_id => ({
        user_id,
        memberships: [membership]
      }));

      const params = {
        workspaceId,
        members
      };

      const result = await bulkAddMembersMutation.mutateAsync(params);
      const response = (result as any)?.data || result;

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
      setSelectedRole('maintainer');
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
                {editMode ? 'Manage Role' : 'Add Member'}
              </h2>
              <p className="text-sm text-secondary">
                {editMode ? 'Manage what members can access on this project' : 'Add member to collaborate on this project'}
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
            {editMode && isLoadingUserAccess ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-primary font-medium">Loading member details...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {editMode ? (
                  // Edit Mode: Manage Role UI
                  (() => {
                    const workspaces = Array.isArray(userRolesAndAccessData) ? userRolesAndAccessData : [];
                    const currentWorkspace = workspaces.find((ws: any) => ws.workspace_id === workspaceId);

                    if (!currentWorkspace) {
                      return (
                        <div className="text-center py-8 text-sm text-gray-500">
                          No access found for this workspace
                        </div>
                      );
                    }

                    // Get workspace info
                    const workspaceInitials = (currentWorkspace.workspace_name || 'W').charAt(0).toUpperCase();
                    const workspaceName = currentWorkspace.workspace_name || 'Workspace';
                    const workspaceAccess = currentWorkspace.access || '';
                    const userBases = currentWorkspace.bases || [];
                    
                    // Determine if workspace-level or base-level access
                    const isWorkspaceLevel = workspaceAccess !== '';

                    return (
                      <div className="space-y-4">
                        {isWorkspaceLevel ? (
                          // Workspace-level role management (access is not empty)
                          <div className="flex items-center gap-4 justify-between">
                            {/* Workspace Info with Icon */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="w-10 h-10 bg-purple-400 rounded-lg flex items-center justify-center text-white font-semibold">
                                {workspaceInitials}
                              </div>
                              <span className="text-sm font-medium text-gray-900 max-w-52 truncate">
                                {workspaceName}
                              </span>
                            </div>

                            {/* Role Dropdown */}
                            <div className="flex-1 max-w-xs flex items-center gap-3">
                              <AdvancedDropdown
                                options={roleOptions}
                                value={selectedRole}
                                onChange={(value) => {
                                  const role = value as string;
                                  setSelectedRole(role);
                                }}
                                placeholder="Select a role"
                                disabled={bulkAddMembersMutation.isPending || removeUserFromWorkspaceMutation.isPending || isLoadingUserAccess}
                              />

                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!window.confirm(`Are you sure you want to remove access to "${workspaceName}"?`)) {
                                    return;
                                  }

                                  try {
                                    if (!memberToEdit) {
                                      toast.error('User ID not found');
                                      return;
                                    }

                                    await removeUserFromWorkspaceMutation.mutateAsync({
                                      workspaceId,
                                      user_id: memberToEdit
                                    });

                                    toast.success('Workspace access removed successfully');
                                    onClose();
                                    onSuccess?.();
                                  } catch (error: any) {
                                    toast.error(error?.message || 'Failed to remove workspace access');
                                  }
                                }}
                                disabled={removeUserFromWorkspaceMutation.isPending || bulkAddMembersMutation.isPending}
                                className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                title="Remove workspace access"
                              >
                                {removeUserFromWorkspaceMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Base-level access management (access is empty string, bases array has data)
                          userBases.length === 0 ? (
                            <div className="text-center py-8 text-sm text-gray-500">
                              No base access found
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <h3 className="text-sm font-semibold text-gray-700">Bases</h3>
                              <div className="space-y-2">
                                {userBases.map((base: any) => {
                                  const baseId = base.base_id;
                                  const baseName = base.base_name || 'Unnamed Base';
                                  const currentBaseRole = baseRoles[baseId] || base.access || 'base-member';
                                  
                                  return (
                                    <div key={baseId} className="flex items-center gap-4 justify-between p-3 bg-gray-50 rounded-lg">
                                      {/* Base Info */}
                                      <div className="flex items-center gap-3 flex-shrink-0 flex-1 min-w-0">
                                        <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center text-white font-semibold text-xs">
                                          {baseName.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 truncate">
                                          {baseName}
                                        </span>
                                      </div>

                                      {/* Base Role Dropdown */}
                                      <div className="flex items-center gap-3">
                                        <AdvancedDropdown
                                          options={baseRoleOptions}
                                          value={currentBaseRole}
                                          onChange={(value) => {
                                            const newRole = value as string;
                                            setBaseRoles(prev => ({ ...prev, [baseId]: newRole }));
                                          }}
                                          placeholder="Select a role"
                                          disabled={bulkAddMembersMutation.isPending || removeUserFromBaseMutation.isPending}
                                          className="min-w-[140px]"
                                        />

                                        {/* Remove Base Access Button */}
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            if (!globalThis.confirm(`Are you sure you want to remove access to "${baseName}"?`)) {
                                              return;
                                            }

                                            try {
                                              if (!memberToEdit) {
                                                toast.error('User ID not found');
                                                return;
                                              }

                                              await removeUserFromBaseMutation.mutateAsync({
                                                baseId,
                                                user_id: memberToEdit
                                              });

                                              toast.success('Base access removed successfully');
                                              // Remove from local state
                                              setBaseRoles(prev => {
                                                const updated = { ...prev };
                                                delete updated[baseId];
                                                return updated;
                                              });
                                              onSuccess?.();
                                            } catch (error: any) {
                                              toast.error(error?.message || 'Failed to remove base access');
                                            }
                                          }}
                                          disabled={removeUserFromBaseMutation.isPending || bulkAddMembersMutation.isPending}
                                          className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                          title="Remove base access"
                                        >
                                          {removeUserFromBaseMutation.isPending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Trash2 className="w-4 h-4" />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })()
                ) : (
                  // Add Mode: Original UI
                  <>
                    {/* Select Member Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Member</label>
                      <MultiSelectTags
                        options={userDropdownOptions}
                        value={selectedUserIds}
                        onChange={(newValue) => setSelectedUserIds(newValue as string[])}
                        placeholder="Select users to assign"
                        searchPlaceholder="Search users..."
                        disabled={bulkAddMembersMutation.isPending}
                      />
                    </div>

                    {/* Select Role Section */}
                    {selectedUserIds.length > 0 && (
                      <div>
                        <AdvancedDropdown
                          label="Select Role"
                          options={roleOptions}
                          value={selectedRole}
                          onChange={(value) => {
                            const role = value as string;
                            setSelectedRole(role);
                            // If role is not base-specific, reset base selection
                            if (!roleAllowsBaseSelection(role)) {
                              setBaseSelectionType('all_bases');
                              setSelectedBases([]);
                            }
                          }}
                          placeholder="Select a role"
                          disabled={bulkAddMembersMutation.isPending}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Select Base Section - Only show for base-specific roles in add mode, or in edit mode if role allows */}
                {(!editMode && selectedUserIds.length > 0 && roleAllowsBaseSelection(selectedRole)) && (
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
                      disabled={bulkAddMembersMutation.isPending || (editMode && isLoadingUserAccess)}
                    />
                  </div>
                )}

                {/* Bases List (when Specific Base is selected) - Only in add mode */}
                {!editMode && selectedUserIds.length > 0 && roleAllowsBaseSelection(selectedRole) && baseSelectionType === 'specific_base' && (
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
            disabled={bulkAddMembersMutation.isPending}
            className="px-16 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={editMode ? handleUpdateRoles : handleAssignUser}
            disabled={
              bulkAddMembersMutation.isPending ||
              removeUserFromWorkspaceMutation.isPending ||
              (!editMode && selectedUserIds.length === 0) ||
              (!editMode && baseSelectionType === 'specific_base' && selectedBases.length === 0) ||
              (editMode && isLoadingUserAccess)
            }
            className="flex items-center gap-2 px-16 py-2 rounded-xl btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {(bulkAddMembersMutation.isPending || removeUserFromWorkspaceMutation.isPending) && <Loader2 size={16} className="animate-spin" />}
            {(bulkAddMembersMutation.isPending || removeUserFromWorkspaceMutation.isPending)
              ? editMode
                ? 'Updating...'
                : 'Adding...'
              : editMode
                ? 'Update'
                : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

