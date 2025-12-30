import React, { useState, useEffect, useMemo } from 'react';
import { useGetOrganization, useUpdateOrganization } from '../../../hooks/useApi';
import { useToast } from '../../common/Toast';
import { MultiLineText } from '../../common/Fields';

interface TenantSettingsTabProps {
  workspaceId: string;
}

export const TenantSettingsTab: React.FC<TenantSettingsTabProps> = ({ workspaceId: _workspaceId }) => {
  const { data: organizationData, isLoading: isLoadingOrganization } = useGetOrganization();
  const updateOrganizationMutation = useUpdateOrganization(organizationData?.id || '');
  const toast = useToast();

  const [organizationName, setOrganizationName] = useState('');
  const [originalOrganizationName, setOriginalOrganizationName] = useState('');
  const [organizationDescription, setOrganizationDescription] = useState('');
  const [originalOrganizationDescription, setOriginalOrganizationDescription] = useState('');

  // Load organization data when available
  useEffect(() => {
    console.log(organizationData);
    
    if (organizationData) {
      const name = organizationData.name || '';
      const description = organizationData.description || '';

      setOrganizationName(name);
      setOriginalOrganizationName(name);
      setOrganizationDescription(description);
      setOriginalOrganizationDescription(description);
    }
  }, [organizationData]);

  const isLoading = isLoadingOrganization;

  const handleSave = async () => {
    if (!organizationName || organizationName.trim() === '') {
      toast.error('Company name is required');
      return;
    }

    if (!organizationDescription || organizationDescription.trim() === '') {
      toast.error('Description is required');
      return;
    }

    const hasChanges = organizationName !== originalOrganizationName || organizationDescription !== originalOrganizationDescription;

    if (!hasChanges) {
      toast.info('No changes to save');
      return;
    }

    try {
      const updateData: any = {
        name: organizationName,
        description: organizationDescription,
      };

      // Use the organization id from the fetched data
      if (organizationData?.id) {
        updateData.id = organizationData.id;
      }

      await updateOrganizationMutation.mutateAsync(updateData);
      setOriginalOrganizationName(organizationName);
      setOriginalOrganizationDescription(organizationDescription);
      toast.success('Organization updated successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update organization');
    }
  };

  const handleCancel = () => {
    setOrganizationName(originalOrganizationName);
    setOrganizationDescription(originalOrganizationDescription);
  };

  const owner = useMemo(() => {
    if (!organizationData) return null;
    
    return {
      id: organizationData.id || '',
      name: organizationData.name || 'Organization',
      email: organizationData.email || '',
      joinedDate: organizationData.created_time ? new Date(organizationData.created_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
      logo: organizationData.logo || null,
      initials: ((organizationData.name || 'O')[0] || 'O').toUpperCase()
    };
  }, [organizationData]);

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
      {/* Card 1: Organization Information */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Organization Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="w-full px-3 py-2 field-component field-component-border field-component-focus"
              placeholder="Enter company name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <MultiLineText
              placeholder="Enter organization description..."
              value={organizationDescription}
              onChange={setOrganizationDescription}
              rows={4}
              isBorder={true}
            />
          </div>
        </div>
        <div className="w-full mt-6 flex justify-end items-center gap-3">
          <button
            onClick={handleCancel}
            disabled={updateOrganizationMutation.isPending}
            className="px-6 py-2.5 border text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateOrganizationMutation.isPending || !organizationName.trim() || !organizationDescription.trim()}
            className="px-6 py-2.5 bg-[var(--color-brand-600)] text-black rounded-xl hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {updateOrganizationMutation.isPending ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Card 2: Owner Details */}
      {owner && (
        <div className="bg-card rounded-xl border overflow-hidden">
          {/* Header Section */}
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-primary">Owner Details</h2>
            <p className="text-sm text-secondary mt-1">Owner profile and contact information.</p>
          </div>

          {/* Owner Information Section */}
          <div className="px-6 py-4">
            <div className="flex items-start gap-4 items-center">
              {owner.logo ? (
                <img
                  src={owner.logo}
                  alt={owner.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {owner.initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-primary">{owner.name}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">
                    Owner
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-secondary">{owner.email} .</p>
                  <p className="text-xs text-secondary">Joined {owner.joinedDate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
