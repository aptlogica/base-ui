import React, { useState, useMemo } from 'react';
import { AddUserModal } from './AddUserModal';
import { useToast } from '../../common/Toast';
import { useGetTenantUsers, useRemoveTenantUser, useActivateTenantUser, useDeactivateTenantUser } from '../../../hooks/useApi';
import { UserTable, TenantUser } from '../../shared/UserTable';
import { Plus } from 'lucide-react';
import { Loader } from '@/components/ui/Loader';

interface UserSettingsTabProps {
  workspaceId: string;
}

export const UserSettingsTab: React.FC<UserSettingsTabProps> = ({ workspaceId }) => {
  const { data: tenantUsers = [], isLoading, error } = useGetTenantUsers();
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);
  const toast = useToast();
  const removeTenantUserMutation = useRemoveTenantUser();
  const activateTenantUserMutation = useActivateTenantUser();
  const deactivateTenantUserMutation = useDeactivateTenantUser();

  // Filter out owner users
  const nonOwnerUsers = useMemo(() => {
    return (tenantUsers as any[]).filter((u: any) => u.roles !== 'owner');
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
    setEditingUser(user);
    setIsAddUserModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddUserModalOpen(false);
    setEditingUser(null);
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
        <Loader size={6} text='Loading users' textPosition='bottom' />
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
        users={nonOwnerUsers as TenantUser[]}
        onRemoveUser={handleRemoveUser}
        onEditUser={handleEditUser}
        onActivateUser={handleActivateUser}
        onDeactivateUser={handleDeactivateUser}
        showSearch={true}
        headerActions={
          <button
            onClick={() => {
              setEditingUser(null);
              setIsAddUserModalOpen(true);
            }}
            className="px-4 py-2 btn-primary flex items-center gap-1 transition font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        }
      />

      {/* Add/Edit User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={handleCloseModal}
        editUser={editingUser}
      />
    </div>
  );
};
