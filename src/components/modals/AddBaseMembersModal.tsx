import React, { useState, useEffect, useMemo } from 'react';
import { X, UserPlus, Loader2, Trash2 } from 'lucide-react';
import { useBulkAddBaseMembers, useGetUsersForAssign, useBaseMembers, useRemoveBaseAccessMember } from '../../hooks/useApi';
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

  const bulkAddBaseMembersMutation = useBulkAddBaseMembers();
  const removeBaseAccessMemberMutation = useRemoveBaseAccessMember();
  const tenantUsersQuery = useGetUsersForAssign();
  const baseMembersQuery = useBaseMembers(baseId);
  const toast = useToast();

  const tenantUsers = tenantUsersQuery.data || [];
  const baseMembers = (baseMembersQuery.data as any)?.data || (baseMembersQuery.data as any) || [];

  // Base role options only
  const baseRoleOptions = [
    { label: 'Base Member', value: 'base-member' },
    { label: 'Base Read Only', value: 'base-read' },
  ];

  // Get existing member user IDs to filter them out
  const existingMemberUserIds = useMemo(() => {
    return Array.isArray(baseMembers)
      ? baseMembers.map((member: any) => member.user_id || member.id).filter(Boolean)
      : [];
  }, [baseMembers]);

  // Filter out existing members from available users
  const availableUsers = useMemo(() => {
    return tenantUsers.filter((user: any) => !existingMemberUserIds.includes(user.id));
  }, [tenantUsers, existingMemberUserIds]);

  // User dropdown options
  const userDropdownOptions: MultiSelectTagsOption[] = useMemo(() => {
    return availableUsers.map((user: any) => ({
      label: user.display_name || user.email || 'Unknown User',
      value: user.id,
      description: user.email,
    }));
  }, [availableUsers]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedUserIds([]);
      setSelectedRole('base-member');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

  const handleRemoveMember = async (accessId: string) => {
    try {
      await removeBaseAccessMemberMutation.mutateAsync({
        baseId,
        accessId,
      });
      toast.success('Member removed successfully');
      baseMembersQuery.refetch();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to remove member';
      toast.error(errorMsg);
    }
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (!isOpen) return null;

  const isValid = selectedUserIds.length > 0;

  return (
    <div
      className="bg-modal-backdrop"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-modal !max-w-7xl !p-0 flex flex-col max-h-[90vh]"
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
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <form id="add-base-members-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto min-h-0">
          <div className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Add Members */}
              <div className="space-y-4 bg-card p-4 lg:p-6">
                <h3 className="text-sm font-semibold text-primary">Add & Manage Members</h3>

                {/* Select Member */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Member
                  </label>
                  <MultiSelectTags
                    options={userDropdownOptions}
                    value={selectedUserIds}
                    onChange={(newValue) => setSelectedUserIds(newValue as string[])}
                    placeholder="Select users to assign"
                    searchPlaceholder="Search users..."
                    disabled={isSubmitting || bulkAddBaseMembersMutation.isPending}
                  />
                </div>

                {/* Select Role */}
                {selectedUserIds.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Role
                    </label>
                    <RoleDropdown
                      value={selectedRole}
                      options={baseRoleOptions}
                      onChange={(value) => setSelectedRole(value)}
                      placeholder="Select a role"
                    />
                  </div>
                )}
              </div>

              {/* Right Column - People with access */}
              <div className="space-y-4 bg-gray-50 p-4 lg:p-6">
                <h3 className="text-sm font-semibold text-primary">People with access</h3>

                {baseMembersQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : Array.isArray(baseMembers) && baseMembers.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-500">
                    No members have access to this base yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Array.isArray(baseMembers) && baseMembers.map((member: any) => {
                      const memberId = member.id || member.access_id || member.user_id;
                      const displayName = member.display_name || member.name || member.email || 'Unknown User';
                      const email = member.email || '';
                      const avatar = member.avatar || member.user?.avatar;
                      const currentRole = member.role || member.access_level || 'base-member';
                      const roleValue = currentRole === 'base-read' || currentRole === 'base_read' ? 'base-read' : 'base-member';

                      return (
                        <div
                          key={memberId}
                          className="flex items-center justify-between p-3 bg-card border rounded-xl"
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
                                value={roleValue}
                                options={baseRoleOptions}
                                onChange={() => {
                                  // TODO: Implement role update API call
                                  toast.info('Role update functionality coming soon');
                                }}
                                placeholder="Select a role"
                                className="min-w-[140px]"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(memberId)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                                title="Remove member"
                                aria-label="Remove member"
                                disabled={removeBaseAccessMemberMutation.isPending}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer - Fixed at Bottom */}
        <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || bulkAddBaseMembersMutation.isPending}
            className="px-4 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-base-members-form"
            disabled={!isValid || isSubmitting || bulkAddBaseMembersMutation.isPending}
            className="flex items-center gap-2 px-6 py-2 rounded-xl btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {(isSubmitting || bulkAddBaseMembersMutation.isPending) ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

