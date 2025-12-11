import React, { useState, useMemo } from 'react';
import { AddUserModal } from './AddUserModal';
import { useToast } from '../../common/Toast';
import { useGetTenantUsers, useRemoveTenantUser, useActivateTenantUser, useDeactivateTenantUser } from '../../../hooks/useApi';
import { UserTable, TenantUser } from '../../shared/UserTable';
import { Plus } from 'lucide-react';

interface UserSettingsTabProps {
  workspaceId: string;
}

export const UserSettingsTab: React.FC<UserSettingsTabProps> = ({ workspaceId }) => {
  const { data: tenantUsers = [], isLoading, error } = useGetTenantUsers();
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const toast = useToast();
  const removeTenantUserMutation = useRemoveTenantUser();
  const activateTenantUserMutation = useActivateTenantUser();
  const deactivateTenantUserMutation = useDeactivateTenantUser();

  // Filter out admin users
  const nonAdminUsers = useMemo(() => {
    return (tenantUsers as any[]).filter((u: any) => u.roles !== 'Admin');
  }, [tenantUsers]);

  const handleRemoveUser = async (userId: string) => {
    try {
      await removeTenantUserMutation.mutateAsync(userId);
      toast.success('User removed successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove user');
    }
  };

  const handleEditUser = (user: TenantUser) => {
    // TODO: Implement edit functionality
    console.log('Edit user:', user);
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await activateTenantUserMutation.mutateAsync(userId);
      toast.success('User activated successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to activate user');
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      await deactivateTenantUserMutation.mutateAsync(userId);
      toast.success('User deactivated successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to deactivate user');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-secondary">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading users</p>
          <p className="text-sm text-secondary">{String(error)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* User Table */}
      <UserTable
        users={nonAdminUsers as TenantUser[]}
        onRemoveUser={handleRemoveUser}
        onEditUser={handleEditUser}
        onActivateUser={handleActivateUser}
        onDeactivateUser={handleDeactivateUser}
        showSearch={true}
        headerActions={
          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="px-4 py-2 btn-primary flex items-center gap-1 transition font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        }
      />

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
      />
    </div>
  );
};
