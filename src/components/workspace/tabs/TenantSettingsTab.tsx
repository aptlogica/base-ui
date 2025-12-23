import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGetTenantUsers, useGetTenant, useUpdateTenant } from '../../../hooks/useApi';
import { useToast } from '../../common/Toast';
import { MultiLineText } from '../../common/Fields';
import { CloudUpload } from 'lucide-react';

interface TenantSettingsTabProps {
  workspaceId: string;
}

export const TenantSettingsTab: React.FC<TenantSettingsTabProps> = ({ workspaceId: _workspaceId }) => {
  const { data: tenantUsers = [], isLoading: isLoadingUsers } = useGetTenantUsers();
  const { data: tenantData, isLoading: isLoadingTenant } = useGetTenant();
  const updateTenantMutation = useUpdateTenant();
  const toast = useToast();

  const [tenantName, setTenantName] = useState('');
  const [originalTenantName, setOriginalTenantName] = useState('');
  const [tenantDescription, setTenantDescription] = useState('');
  const [originalTenantDescription, setOriginalTenantDescription] = useState('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load admin data when available
  useEffect(() => {
    if (tenantData) {
      const name = tenantData.name || tenantData.tenant_name || '';
      const description = tenantData.description || tenantData.tenant_description || '';
      const logo = tenantData.logo || tenantData.company_logo || null;

      setTenantName(name);
      setOriginalTenantName(name);
      setTenantDescription(description);
      setOriginalTenantDescription(description);
      setCompanyLogo(logo);
      setLogoPreview(logo);
    }
  }, [tenantData]);

  const isLoading = isLoadingUsers || isLoadingTenant;

  const handleSave = async () => {
    if (!tenantName || tenantName.trim() === '') {
      toast.error('Company name is required');
      return;
    }

    if (!tenantDescription || tenantDescription.trim() === '') {
      toast.error('Description is required');
      return;
    }

    const hasChanges = tenantName !== originalTenantName || tenantDescription !== originalTenantDescription;

    if (!hasChanges && !companyLogo) {
      toast.info('No changes to save');
      return;
    }

    try {
      const updateData: any = {
        name: tenantName,
        description: tenantDescription,
      };

      if (companyLogo && companyLogo !== tenantData?.logo && companyLogo !== tenantData?.company_logo) {
        updateData.logo = companyLogo;
      }

      await updateTenantMutation.mutateAsync(updateData);
      setOriginalTenantName(tenantName);
      setOriginalTenantDescription(tenantDescription);
      toast.success('Organization updated successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update organization');
    }
  };

  const handleCancel = () => {
    setTenantName(originalTenantName);
    setTenantDescription(originalTenantDescription);
    setCompanyLogo(tenantData?.logo || tenantData?.company_logo || null);
    setLogoPreview(tenantData?.logo || tenantData?.company_logo || null);
  };

  const handleLogoUpload = async (file: File) => {
    // Validate file type
    const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (SVG, PNG, JPG, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate dimensions (max 800x400)
    const img = new Image();
    img.onload = async () => {
      if (img.width > 800 || img.height > 400) {
        toast.error('Image dimensions must be max 800 x 400px');
        return;
      }

      setIsUploadingLogo(true);
      try {
        // Create preview
        const previewUrl = URL.createObjectURL(file);
        setLogoPreview(previewUrl);

        // Here you would typically upload the file to your server
        // For now, we'll just store the preview
        // In a real implementation, you'd use an upload service
        setCompanyLogo(previewUrl);
        toast.success('Logo uploaded successfully');
      } catch (error: any) {
        toast.error(error?.message || 'Failed to upload logo');
      } finally {
        setIsUploadingLogo(false);
      }
    };
    img.onerror = () => {
      toast.error('Invalid image file');
    };
    img.src = URL.createObjectURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  // Get owner from tenant users
  const owner = useMemo(() => {
    const owners = (tenantUsers as any[])
      .filter((u: any) => u.role === 'owner' || u.roles === 'Owner' || u.is_owner)
      .map((u: any) => ({
        id: u.id || u.user_id || '',
        name: u.display_name || u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        email: u.email || '',
        joinedDate: u.created_time ? new Date(u.created_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
        avatar: u.avatar || null,
        initials: ((u.display_name || u.name || u.email || 'U')[0] || 'U').toUpperCase()
      }));

    // If no owner found, use first admin
    if (owners.length === 0) {
      const admins = (tenantUsers as any[])
        .filter((u: any) => u.roles === 'Admin' || u.is_admin || u.role === 'admin')
        .map((u: any) => ({
          id: u.id || u.user_id || '',
          name: u.display_name || u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
          email: u.email || '',
          joinedDate: u.created_time ? new Date(u.created_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
          avatar: u.avatar || null,
          initials: ((u.display_name || u.name || u.email || 'U')[0] || 'U').toUpperCase()
        }));
      return admins[0] || null;
    }

    return owners[0] || null;
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
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
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
              value={tenantDescription}
              onChange={setTenantDescription}
              rows={4}
              isBorder={true}
            />
          </div>
        </div>
        <div className="w-full mt-6 flex justify-end items-center gap-3">
          <button
            onClick={handleCancel}
            disabled={updateTenantMutation.isPending}
            className="px-6 py-2.5 border text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateTenantMutation.isPending || !tenantName.trim() || !tenantDescription.trim()}
            className="px-6 py-2.5 bg-[var(--color-brand-600)] text-black rounded-xl hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {updateTenantMutation.isPending ? 'Saving...' : 'Save changes'}
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
            <div className="flex items-start gap-4">
              {owner.avatar ? (
                <img
                  src={owner.avatar}
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
