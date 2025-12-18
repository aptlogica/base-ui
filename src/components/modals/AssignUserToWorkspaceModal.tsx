import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, UserPlus, Edit } from 'lucide-react';
import { useAssignUserToWorkspace, useGetTenantUsers, useWorkspaceBases, useWorkspaceMembers, useBaseMembers, useUserAccessDetails } from '../../hooks/useApi';
import { useToast } from '../common/Toast';
import { AdvancedDropdown } from '../common/dropdown/AdvancedDropdown';
import { useAuth } from '../../auth/AuthContext';
import { useWorkspaceAccess } from '../../hooks/useWorkspaceAccess';

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
  const [accessLevel, setAccessLevel] = useState<'full_access' | 'limited_access'>('full_access');
  const [selectedBases, setSelectedBases] = useState<string[]>([]);

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
  const userDropdownOptions = tenantUsers
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

  // Access level options - restrict based on current user's access level
  // Admin users can assign both full_access and limited_access
  // Full_access users can only assign limited_access
  const accessLevelOptions = React.useMemo(() => {
    if (currentUserAccessLevel === 'admin') {
      return [
        { label: 'Full Access', value: 'full_access' },
        { label: 'Limited Access', value: 'limited_access' },
      ];
    } else {
      // For full_access users, only show limited_access option
      return [
        { label: 'Limited Access', value: 'limited_access' },
      ];
    }
  }, [currentUserAccessLevel]);

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
            setAccessLevel(currentWorkspace.access_level === 'full_access' ? 'full_access' : 'limited_access');
            
            // Set selected bases (existing bases for limited access)
            if (currentWorkspace.access_level === 'limited_access' && currentWorkspace.bases) {
              const baseIds = currentWorkspace.bases.map((base: any) => base.id);
              setSelectedBases(baseIds);
            } else {
              setSelectedBases([]);
            }
            
            // Set selected user (disabled in edit mode)
            setSelectedUserIds([memberToEdit]);
          }
        }
      } else {
        // Add mode: Reset form
        setSelectedUserIds([]);
        // Default to limited_access for full_access users, full_access for admin users
        setAccessLevel(currentUserAccessLevel === 'admin' ? 'full_access' : 'limited_access');
        setSelectedBases([]);
      }
    }
  }, [isOpen, currentUserAccessLevel, editMode, memberToEdit, userAccessDetailsQuery.data, workspaceId]);

  const handleAssignUser = async () => {
    if (!selectedUserIds || selectedUserIds.length === 0 || !workspaceId) {
      toast.error('Please select at least one user');
      return;
    }

    // Validate bases selection for limited access
    if (accessLevel === 'limited_access' && selectedBases.length === 0) {
      toast.error('Please select at least one base for limited access');
      return;
    }

    try {
      // In edit mode, we need to send all selected bases (existing + newly selected)
      // The API will handle updating the access level and bases
      let basesIds = accessLevel === 'full_access' ? '*' : selectedBases.join(',');
      
      // If editing and changing from limited to full, or vice versa, send all selected bases
      // The backend will handle the update correctly
      const params: {
        workspace_id: string;
        user_ids: string[];
        access_level: string;
        bases_ids: string;
      } = {
        workspace_id: workspaceId,
        user_ids: selectedUserIds,
        access_level: accessLevel,
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
      setAccessLevel('full_access');
      setSelectedBases([]);

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
              <div className="w-10 h-10 icon-primary rounded-lg flex items-center justify-center">
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
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
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
        className="bg-modal min-h-[500px] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
      >
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 icon-primary rounded-lg flex items-center justify-center">
              {editMode ? <Edit className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
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
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X size={16} className="text-[var(--text-color-tertiary)]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {editMode && userAccessDetailsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-primary font-medium">Loading member details...</p>
              </div>
            </div>
          ) : (
          <div className="space-y-4 font-normal text-xs px-1">
            {/* Users Dropdown - Disabled in edit mode */}
            {editMode ? (
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">User</label>
                <div className="px-3 py-2 bg-gray-50 border rounded-lg text-sm text-primary">
                  {(() => {
                    const user = tenantUsers.find((u: any) => u.id === memberToEdit);
                    return user?.display_name || user?.email || memberToEdit || 'Unknown User';
                  })()}
                </div>
                <p className="text-xs text-[var(--text-color-tertiary)] mt-1">User cannot be changed in edit mode</p>
              </div>
            ) : (
              <div>
                <AdvancedDropdown
                  label="Select User"
                  options={userDropdownOptions}
                  value={selectedUserIds}
                  onChange={(value) => setSelectedUserIds(value as string[])}
                  placeholder="Select users to assign"
                  searchable
                  multiple={true}
                />
              </div>
            )}

            {/* Access Level Dropdown */}
            {(selectedUserIds.length > 0 || editMode) && (
              <div>
                <AdvancedDropdown
                  label="Access Level"
                  options={accessLevelOptions}
                  value={accessLevel}
                  onChange={(value) => setAccessLevel(value as 'full_access' | 'limited_access')}
                  placeholder="Select access level"
                />
                <p className="text-xs text-[var(--text-color-tertiary)] mt-2">
                  {accessLevel === 'full_access'
                    ? 'Full access grants workspace admin privileges with access to all bases'
                    : 'Limited access allows access only to selected bases'}
                </p>
              </div>
            )}

            {/* Bases selection only for Limited Access */}
            {(selectedUserIds.length > 0 || editMode) && accessLevel === 'limited_access' && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 flex flex-col min-h-0">
                <div className="mb-4 flex-shrink-0">
                  <h4 className="font-semibold text-primary mb-1">Available Bases</h4>
                  <p className="text-sm text-secondary">Select which bases this user can access</p>
                </div>
                {bases.length > 0 ? (
                  <div className="space-y-2 overflow-y-auto flex-1 min-h-0 max-h-[300px] pr-2">
                    {bases.map((base: any) => (
                      <label
                        key={base.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-[var(--color-bg-brand-primary)] hover:text-black hover:border-primary/30 transition-all cursor-pointer group"
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
                        <span className="text-primary group-hover:text-black font-medium flex-1 truncate">
                          {base.title || 'Untitled Base'}
                        </span>
                        {selectedBases.includes(base.id) && (
                          <CheckCircle2 className="w-4 h-4 text-primary group-hover:text-black flex-shrink-0" />
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 flex-shrink-0">
                    <p className="text-sm text-secondary">No bases available in this workspace</p>
                    <p className="text-xs text-secondary mt-1">Create a base first to assign limited access</p>
                  </div>
                )}
              </div>
            )}
          </div>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex justify-end gap-3 pt-4 mt-4 flex-shrink-0 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={assignUserToWorkspaceMutation.isPending}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50 transition-all disabled:opacity-50 text-[var(--text-color-tertiary)]"
          >
            Cancel
          </button>
          <button
            onClick={handleAssignUser}
            disabled={assignUserToWorkspaceMutation.isPending || selectedUserIds.length === 0 || (accessLevel === 'limited_access' && selectedBases.length === 0) || (editMode && userAccessDetailsQuery.isLoading)}
            className="flex items-center gap-2 px-6 py-2 btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assignUserToWorkspaceMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            {assignUserToWorkspaceMutation.isPending
              ? editMode
                ? 'Updating member...'
                : `Assigning ${selectedUserIds.length} user${selectedUserIds.length > 1 ? 's' : ''}...`
              : editMode
                ? 'Update Member'
                : selectedUserIds.length > 1
                ? `Assign ${selectedUserIds.length} Users`
                : 'Assign User'}
          </button>
        </div>
      </div>
    </div>
  );
};

