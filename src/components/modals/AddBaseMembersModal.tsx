// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState, useEffect, useMemo } from 'react';
import { X, UserPlus, Loader2, Trash2 } from 'lucide-react';
import { useBulkAddBaseMembers, useGetUsersForAssign, useBaseMembers, useRemoveUserFromBase } from '../../hooks/useApi';
import { useToast } from '../common/Toast';
import { MultiSelectTags, MultiSelectTagsOption } from '../common/MultiSelectTags';
import { RoleDropdown } from '../common/dropdown/RoleDropdown';

interface AddBaseMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  workspaceId: string;
  baseId: string;
}

export const AddBaseMembersModal: React.FC<AddBaseMembersModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  workspaceId,
  baseId,
}) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('base-member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Track pending role changes for existing members (user_id -> new role)
  const [pendingRoleChanges, setPendingRoleChanges] = useState<Record<string, string>>({});

  const bulkAddBaseMembersMutation = useBulkAddBaseMembers();
  const removeUserFromBaseMutation = useRemoveUserFromBase();
  const tenantUsersQuery = useGetUsersForAssign();
  const baseMembersQuery = useBaseMembers(baseId);
  const toast = useToast();

  const tenantUsers = tenantUsersQuery.data ?? [];
  
  // Extract base members from response - handle StandardResponse structure
  const baseMembers = useMemo(() => {
    if (!baseMembersQuery.data) return [];
    
    const data = baseMembersQuery.data as any;
    
    // StandardResponse structure: { data: [...] }
    if (data?.data && Array.isArray(data.data)) {
      return data.data;
    }
    
    // Direct array response
    if (Array.isArray(data)) {
      return data;
    }
    
    // Fallback: try to find array in response
    if (data?.members && Array.isArray(data.members)) {
      return data.members;
    }
    
    return [];
  }, [baseMembersQuery.data]);

  // Base role options only
  const baseRoleOptions = [
    { label: 'Base Member', value: 'base-member' },
    { label: 'Base Read Only', value: 'base-read' },
  ];

  // Get existing member user IDs to mark them as disabled
  const existingMemberUserIds = useMemo(() => {
    return Array.isArray(baseMembers)
      ? baseMembers.map((member: any) => member.user_id || member.id).filter(Boolean)
      : [];
  }, [baseMembers]);

  // User dropdown options - include all users, but mark existing members as disabled
  const userDropdownOptions: MultiSelectTagsOption[] = useMemo(() => {
    return tenantUsers.map((user: any) => ({
      label: user.display_name || user.email || 'Unknown User',
      value: user.id,
      description: user.email,
      disabled: existingMemberUserIds.includes(user.id), // Disable existing members
    }));
  }, [tenantUsers, existingMemberUserIds]);

  // Reset form and refetch members when modal opens
  useEffect(() => {
    if (isOpen && baseId) {
      setSelectedUserIds([]);
      setSelectedRole('base-member');
      setIsSubmitting(false);
      setPendingRoleChanges({});
      // Refetch members when modal opens to get updated data
      baseMembersQuery.refetch();
    }
  }, [isOpen, baseId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSubmit = async (e:React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build members array for base-level assignment
      const members = selectedUserIds.map((user_id) => ({
        user_id,
        role: selectedRole, // base-member or base-read
      }));

      await bulkAddBaseMembersMutation.mutateAsync({
        baseId,
        workspaceId,
        members,
      });

      toast.success('Members added successfully');
      // Reset form
      setSelectedUserIds([]);
      setSelectedRole('base-member');
      
      // Refresh base members list
      baseMembersQuery.refetch();
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to add members';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (member: any) => {
    // Extract user_id from member object
    const userId = member.user_id || member.user?.id || member.id;
    
    if (!userId) {
      toast.error('Unable to identify user to remove');
      return;
    }

    try {
      await removeUserFromBaseMutation.mutateAsync({
        baseId,
        user_id: String(userId),
      });
      toast.success('Member removed successfully');
      baseMembersQuery.refetch();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to remove member';
      toast.error(errorMsg);
    }
  };

  // Combined handler for both adding members and updating roles
  const handleSaveAll = async () => {
    setIsSubmitting(true);
    
    try {
      // First update roles if there are pending changes
      if (Object.keys(pendingRoleChanges).length > 0) {
        const roleChangeEntries = Object.entries(pendingRoleChanges);
        const members = roleChangeEntries.map(([userId, role]) => ({
          user_id: userId,
          role: role,
        }));

        await bulkAddBaseMembersMutation.mutateAsync({
          baseId,
          workspaceId,
          members
        });

        toast.success('Roles updated successfully');
        setPendingRoleChanges({});
        baseMembersQuery.refetch();
      }
      
      // Then add new members if any are selected
      if (isValid) {
        const members = selectedUserIds.map((user_id) => ({
          user_id,
          role: selectedRole,
        }));

        await bulkAddBaseMembersMutation.mutateAsync({
          baseId,
          workspaceId,
          members,
        });

        toast.success('Members added successfully');
        setSelectedUserIds([]);
        setSelectedRole('base-member');
        baseMembersQuery.refetch();
      }
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to save changes';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts.at(-1)![0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Extract base role from roles array (same logic as UserTable/MembersTable)
  const getBaseRoleFromRoles = (member: any): string => {
    // If member has roles array, extract base role
    if (Array.isArray(member.roles)) {
      // Look for base-level roles
      const baseRole = member.roles.find((role: any) => 
        role.scope_level === 'base' || 
        role.scope_type === 'base' ||
        role.name === 'base-member' || 
        role.name === 'base_member' ||
        role.name === 'base-read' || 
        role.name === 'base_read'
      );
      
      if (baseRole) {
        // Map role name to value
        if (baseRole.name === 'base-read' || baseRole.name === 'base_read') {
          return 'base-read';
        }
        return 'base-member'; // default to base-member
      }
      
      // Fallback: check for workspace-level base roles
      const workspaceBaseRole = member.roles.find((role: any) => 
        role.scope_level === 'workspace' && 
        (role.name === 'base-member' || role.name === 'base_member' || role.name === 'base-read' || role.name === 'base_read')
      );
      
      if (workspaceBaseRole) {
        if (workspaceBaseRole.name === 'base-read' || workspaceBaseRole.name === 'base_read') {
          return 'base-read';
        }
        return 'base-member';
      }
    }
    
    // Fallback to old logic for backward compatibility
    const currentRole = member.role || member.access_level || 'base-member';
    return currentRole === 'base-read' || currentRole === 'base_read' ? 'base-read' : 'base-member';
  };

  if (!isOpen) return null;

  const isValid = selectedUserIds.length > 0;

  // Helper function to get loading button text
  const getLoadingButtonText = (): string => {
    if (isValid && Object.keys(pendingRoleChanges).length > 0) {
      return 'Saving...';
    }
    if (isValid) {
      return 'Adding...';
    }
    return 'Updating...';
  };

  // Helper function to get normal button text
  const getButtonText = (): string => {
    if (isValid && Object.keys(pendingRoleChanges).length > 0) {
      return 'Save Changes';
    }
    if (isValid) {
      return 'Add';
    }
    return 'Update';
  };

  return (
    <div // NOSONAR
      className="bg-modal-backdrop"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div // NOSONAR
        className="bg-modal !max-w-7xl !p-0 flex flex-col h-[90vh] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">Add & Manage Members</h2>
              <p className="text-sm text-secondary">Add & manage members to collaborate on this project.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="text-gray-400 h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <form id="add-base-members-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto min-h-0">
          <div className="p-0 h-full">
            <div className={`grid grid-cols-1 h-full ${Array.isArray(baseMembers) && baseMembers.length > 0 ? 'lg:grid-cols-2' : ''} gap-6`}>
              {/* Left Column - Add Members */}
              <div className="space-y-4 bg-card p-4 lg:p-6">
                {/* Select Member */}
                <div>
                  <label 
                    htmlFor="add-base-members-select-member"
                    id="add-base-members-select-member-label"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Select Member
                  </label>
                  <MultiSelectTags
                    id="add-base-members-select-member"
                    aria-labelledby="add-base-members-select-member-label"
                    options={userDropdownOptions}
                    value={selectedUserIds}
                    onChange={(newValue) => setSelectedUserIds(newValue as string[])}
                    placeholder="Select users to assign"
                    searchPlaceholder="Search users..."
                    disabled={isSubmitting || bulkAddBaseMembersMutation.isPending}
                    showDisabledAsSelected={true}
                  />
                </div>

                {/* Select Role */}
                {selectedUserIds.length > 0 && (
                  <div>
                    <label 
                      htmlFor="add-base-members-select-role"
                      id="add-base-members-select-role-label"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Select Role
                    </label>
                    <RoleDropdown
                      id="add-base-members-select-role"
                      aria-labelledby="add-base-members-select-role-label"
                      value={selectedRole}
                      options={baseRoleOptions}
                      onChange={(value) => setSelectedRole(value)}
                      placeholder="Select a role"
                    />
                  </div>
                )}
              </div>

              {/* Right Column - People with access (only show when there are members) */}
              {!baseMembersQuery.isLoading && Array.isArray(baseMembers) && baseMembers.length > 0 && (
                <div className="flex flex-col h-full min-h-0 bg-gray-50 border-l p-4 lg:p-6">
                  <h3 className="text-sm font-semibold text-primary flex-shrink-0 mb-4">People with access</h3>

                  {/* Members List - Scrollable */}
                  <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                    <div className="space-y-3">
                      {baseMembers.map((member: any) => {
                        const memberId = member.id || member.access_id || member.user_id;
                        const displayName = member.display_name || member.name || member.email || 'Unknown User';
                        const email = member.email || '';
                        const avatar = member.avatar || member.user?.avatar;
                        // Extract role from roles array using the same logic as UserTable/MembersTable
                        const roleValue = getBaseRoleFromRoles(member);

                        return (
                          <div
                            key={memberId}
                            className="flex items-center justify-between px-3 py-2 bg-card border rounded-xl"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Avatar */}
                              {avatar ? (
                                <img
                                  src={avatar}
                                  alt={displayName}
                                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm flex-shrink-0">
                                  {getInitials(displayName)}
                                </div>
                              )}

                              {/* Name and Email */}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {displayName}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {email}
                                </div>
                              </div>

                              {/* Role Dropdown */}
                              <div className="flex items-center gap-2">
                                <RoleDropdown
                                  value={pendingRoleChanges[member.user_id || member.id] || roleValue}
                                  options={baseRoleOptions}
                                  onChange={(value) => {
                                    const newRole = value;
                                    const userId = member.user_id || member.id;
                                    if (newRole === roleValue) {
                                      // If changed back to original, remove from pending changes
                                      setPendingRoleChanges(prev => {
                                        const updated = { ...prev };
                                        delete updated[userId];
                                        return updated;
                                      });
                                    } else {
                                      setPendingRoleChanges(prev => ({
                                        ...prev,
                                        [userId]: newRole
                                      }));
                                    }
                                  }}
                                  placeholder="Select a role"
                                  className="min-w-[140px]"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(member)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                                  title="Remove member"
                                  aria-label="Remove member"
                                  disabled={removeUserFromBaseMutation.isPending}
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer - Fixed at Bottom */}
        <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || bulkAddBaseMembersMutation.isPending}
            className="px-16 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
          >
            Cancel
          </button>
          {/* Combined Save button - handles both adding new members and updating roles */}
          {(isValid || Object.keys(pendingRoleChanges).length > 0) && (
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={
                isSubmitting || 
                bulkAddBaseMembersMutation.isPending ||
                (!isValid && Object.keys(pendingRoleChanges).length === 0)
              }
              className="flex items-center gap-2 px-16 py-2 rounded-xl btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {(isSubmitting || bulkAddBaseMembersMutation.isPending) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {getLoadingButtonText()}
                </>
              ) : (
                getButtonText()
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

