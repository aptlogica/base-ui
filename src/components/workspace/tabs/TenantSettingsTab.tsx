import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { useGetTenantUsers, useGetTenant, useUpdateTenant } from '../../../hooks/useApi';
import { useToast } from '../../common/Toast';
import { MultiLineText } from '../../common/Fields';

interface TenantSettingsTabProps {
  workspaceId: string;
}

interface TenantAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedDate: string;
  avatar: string;
}

export const TenantSettingsTab: React.FC<TenantSettingsTabProps> = ({ workspaceId }) => {
  const { user } = useAuth();
  const { data: tenantUsers = [], isLoading: isLoadingUsers } = useGetTenantUsers();
  const { data: tenantData, isLoading: isLoadingTenant } = useGetTenant();
  const updateTenantMutation = useUpdateTenant();
  const toast = useToast();
  
  const [tenantName, setTenantName] = useState('');
  const [originalTenantName, setOriginalTenantName] = useState('');
  const [tenantDescription, setTenantDescription] = useState('');
  const [tenantId, setTenantId] = useState('');

  // Load admin data when available
  useEffect(() => {
    if (tenantData) {
      const name = tenantData.name || tenantData.tenant_name || '';
      const id = tenantData.id || tenantData.tenant_id || '';
      const description = tenantData.description || tenantData.tenant_description || '';
      
      setTenantName(name);
      setOriginalTenantName(name);
      setTenantDescription(description);
      setTenantId(id);
    }
  }, [tenantData]);

  const isLoading = isLoadingUsers || isLoadingTenant;

  const handleSave = async () => {
    if (!tenantName || tenantName.trim() === '') {
      toast.error('Admin name is required');
      return;
    }

    if (tenantName === originalTenantName) {
      toast.info('No changes to save');
      return;
    }

    try {
      await updateTenantMutation.mutateAsync({ name: tenantName });
      setOriginalTenantName(tenantName);
      toast.success('Admin updated successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update admin');
    }
  };

  const handleCancel = () => {
    setTenantName(originalTenantName);
    setTenantDescription(tenantData?.description || tenantData?.tenant_description || '');
  };

  // Get admin admins from API
  const tenantAdmins: TenantAdmin[] = useMemo(() => {
    return (tenantUsers as any[])
      .filter((u: any) => u.roles === 'Admin' || u.is_admin || u.role === 'admin' || u.role === 'owner')
      .map((u: any) => ({
        id: u.id || u.user_id || '',
        name: u.display_name || u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        email: u.email || '',
        role: u.roles || 'Admin Admin',
        joinedDate: u.created_time ? new Date(u.created_time).toLocaleDateString() : 'Recently',
        avatar: ((u.display_name || u.name || u.email || 'U')[0] || 'U').toUpperCase()
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tenantUsers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-secondary">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card 1: Admin Details */}
      <div className="bg-card rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Admin Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">ID</label>
            <input
              type="text"
              value={tenantId || workspaceId}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-secondary cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Company Name</label>
            <input
              type="text"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              className="w-full text-xs px-3 h-11 border flex items-center rounded-[var(--radius-lg)] text-[var(--color-text-primary)] focus:border-[--color-brand-600] placeholder:text-[var(--color-text-placeholder)] bg-[--color-alpha-white] truncate overflow-ellipsis whitespace-nowrap outline-none cursor-pointer transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Description</label>
             <MultiLineText
              placeholder="Enter admin description..."
              value={tenantDescription}
              onChange={setTenantDescription}
              rows={4}
              isBorder={true}
            />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={updateTenantMutation.isPending || tenantName === originalTenantName}
            className="px-4 py-2 btn-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateTenantMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleCancel}
            disabled={updateTenantMutation.isPending}
            className="px-4 py-2 border border-gray-300 text-primary rounded-md hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Card 2: Admin Information Table */}
      {/* {tenantData && (
        <div className="bg-card border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-primary">Admin Information</h2>
            <p className="text-sm text-secondary mt-1">View admin details and subscription information</p>
          </div>
          <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Field</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Value</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-gray-200">
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">Admin ID</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{tenantData.id || '-'}</span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">Schema Name</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{tenantData.schema_name || '-'}</span>
                  </td>
                </tr>
                {tenantData.subscription && (
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">Subscription Status</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                        tenantData.subscription.status === 'active'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : tenantData.subscription.status === 'inactive'
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {tenantData.subscription.status || '-'}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )} */}

      {/* Card 3: Admin Admin Details Table */}
      <div className="bg-card border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-primary">Admin Information</h2>
          <p className="text-sm text-secondary mt-1">View and manage admin administrators</p>
        </div>
        <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</span>
                </th>
                <th className="px-6 py-3 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</span>
                </th>
                <th className="px-6 py-3 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</span>
                </th>
                <th className="px-6 py-3 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Joined Date</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {tenantAdmins.length > 0 ? (
                tenantAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {admin.avatar}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{admin.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{admin.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-blue-100 text-blue-700 border-blue-200">
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{admin.joinedDate}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No admin found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
