import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useCurrentUser } from '../../auth/useCurrentUser';
import { useUserProfile, useUpdateUserProfile, useAddOrUpdateAvatar, useRemoveAvatar } from '../../hooks/useApi';
import { UserProfile } from '../../types/userProfile';
import { useToast } from '../common/Toast';
import { Loader2, CheckCircle, CloudUpload } from 'lucide-react';
import { AdvancedDropdown } from '../common/dropdown/AdvancedDropdown';
import { timeZoneOptions } from '../../types/constants';
import { useFooterButtons } from './AccountSettings';
import { DateField } from '../common/Fields/DateField';
import { validateDOB, getYesterdayISO, convertDateToFormat } from '../../utils/dateValidation';

export const ProfileSection: React.FC = () => {
  const { user: authUser } = useAuth();
  const currentUser = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<{
    first_name?: string;
    last_name?: string;
    display_name?: string;
    country?: string;
    dob?: string;
    timezone?: string;
    locale?: string;
  }>({});

  const [hasChanges, setHasChanges] = useState(false);
  const [dobError, setDobError] = useState<string | null>(null);

  // Toast for notifications
  const toast = useToast();
  
  // Footer buttons context
  const { registerFooter, clearFooter, currentSection } = useFooterButtons();

  // API hooks
  const updateProfileMutation = useUpdateUserProfile(authUser?.id || '');
  const addOrUpdateAvatarMutation = useAddOrUpdateAvatar(authUser?.id || '');
  const removeAvatarMutation = useRemoveAvatar(authUser?.id || '');

  // Avatar states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Get user ID from auth user
  const userId = authUser?.id;

  // Fetch user profile data
  const {
    data: profileResponse,
    isLoading,
    error,
    refetch
  } = useUserProfile(userId || '');

  const userProfile: UserProfile | null = profileResponse?.data || null;



  // Initialize form data when profile loads
  useEffect(() => {
    if (userProfile && !isEditing) {
      setFormData({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        display_name: userProfile.display_name || '',
        country: userProfile.country || '',
        dob: userProfile.dob || '',
        locale: userProfile.locale || '',
        // Store IANA label in form state for timezone (UI value). Convert from short code if needed.
        timezone:
          (userProfile.timezone
            ? (timeZoneOptions.find(t => t.value === userProfile.timezone)?.label || userProfile.timezone)
            : ''),
      });

      // Store timezone and country in sessionStorage when profile loads
      try {
        if (typeof sessionStorage !== 'undefined') {
          if (userProfile.timezone) {
            sessionStorage.setItem('timezone', userProfile.timezone);
          }
          if (userProfile.country) {
            sessionStorage.setItem('country', userProfile.country);
          }
        }
      } catch (error) {
        // Silently fail if sessionStorage is not available
      }
    }
  }, [userProfile, isEditing]);

  // Check for changes
  useEffect(() => {
    if (userProfile && isEditing) {
      const formTzShort = formData.timezone
        ? (timeZoneOptions.find(t => t.label === formData.timezone)?.value || formData.timezone)
        : '';
      const hasFormChanges =
        formData.first_name !== userProfile.first_name ||
        formData.last_name !== userProfile.last_name ||
        formData.display_name !== userProfile.display_name ||
        formData.country !== (userProfile.country || '') ||
        formData.dob !== (userProfile.dob || '') ||
        formData.locale !== (userProfile.locale || '') ||
        formTzShort !== (userProfile.timezone || '');
      setHasChanges(hasFormChanges);
    }
  }, [formData, userProfile, isEditing]);

  // Register footer buttons with cleanup
  useEffect(() => {
    // Only register if this is still the active section
    if (currentSection !== 'profile') {
      return;
    }

    const footerContent = !isEditing ? (
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-6 py-2.5 text-sm btn-primary transition-colors rounded-xl text-white"
        >
          Edit
        </button>
      </div>
    ) : (
      <div className="flex items-center justify-end gap-3 w-full">
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 text-sm border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving || updateProfileMutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 text-sm btn-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white"
        >
          {(isSaving || updateProfileMutation.isPending) && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          {(isSaving || updateProfileMutation.isPending) ? 'Saving...' : 'Update'}
        </button>
      </div>
    );
    registerFooter(footerContent, 'profile');
    
    // Cleanup: clear footer when component unmounts or section changes
    return () => {
      if (currentSection === 'profile') {
        clearFooter();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, isSaving, hasChanges, updateProfileMutation.isPending, registerFooter, clearFooter, currentSection]);

  const handleInputChange = (field: 'first_name' | 'last_name' | 'display_name' | 'country' | 'dob' | 'timezone' | 'locale', value: string) => {
    if (field === 'country') {
      const country = value;
      const tzEntries = timeZoneOptions.filter(t => t.country === country);
      const tzLabels = tzEntries.map(t => t.label);
      setFormData(prev => {
        const prevTz = prev.timezone || '';
        const nextTz = tzLabels.includes(prevTz) ? prevTz : (tzLabels[0] || '');
        return {
          ...prev,
          country,
          timezone: nextTz,
        };
      });
      return;
    }
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    // Validate DOB before saving
    if (formData.dob) {
      const dobErr = validateDOB(formData.dob, 'DD-MM-YYYY');
      if (dobErr) {
        setDobError(dobErr);
        toast.error(dobErr, { title: 'Invalid Date of Birth' });
        return;
      }
    }

    setIsSaving(true);
    try {
      // Convert IANA label (form value) to short code for API if applicable
      const tzShort = formData.timezone
        ? (timeZoneOptions.find(t => t.label === formData.timezone)?.value || formData.timezone)
        : undefined;
      const payload = {
        ...formData,
        timezone: tzShort,
      };
      await updateProfileMutation.mutateAsync(payload);

      // Persist updated country and timezone to sessionStorage
      try {
        if (typeof sessionStorage !== 'undefined') {
          if (typeof payload.country === 'string') {
            sessionStorage.setItem('country', payload.country);
          }
          if (typeof payload.timezone === 'string') {
            sessionStorage.setItem('timezone', payload.timezone);
          }
        }
      } catch { }

      setIsEditing(false);
      setHasChanges(false);
      setFormData({});
      setDobError(null);
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      toast.error(error?.message || 'Failed to save profile. Please try again.', { title: 'Save Failed' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setFormData({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        display_name: userProfile.display_name || '',
        country: userProfile.country || '',
        dob: userProfile.dob || '',
        locale: userProfile.locale || '',
        timezone:
          (userProfile.timezone
            ? (timeZoneOptions.find(t => t.value === userProfile.timezone)?.label || userProfile.timezone)
            : ''),
      });
    }
    setDobError(null);
    setIsEditing(false);
    setHasChanges(false);
  };


  // Avatar handling functions
  const processFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file', { title: 'Invalid File Type' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB', { title: 'File Too Large' });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await addOrUpdateAvatarMutation.mutateAsync(file);
      toast.success('Avatar updated successfully!', { title: 'Success' });
    } catch (error: any) {
      console.error('Failed to upload avatar:', error);
      toast.error(error?.message || 'Failed to upload avatar. Please try again.', { title: 'Upload Failed' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveAvatar = async () => {
    try {
      await removeAvatarMutation.mutateAsync();
      toast.success('Avatar removed successfully!', { title: 'Success' });
    } catch (error: any) {
      console.error('Failed to remove avatar:', error);
      toast.error(error?.message || 'Failed to remove avatar. Please try again.', { title: 'Remove Failed' });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-600 mb-2">Failed to load profile</div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No profile data
  if (!userProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-gray-600 mb-2">No profile data available</div>
        </div>
      </div>
    );
  }



  return (
    <div className="space-y-6">
      {/* Form Fields */}
      <div className="space-y-6">
        {/* First Name and Last Name - Side by Side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={isEditing ? (formData.first_name || '') : (userProfile.first_name || '')}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)] focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              placeholder="Enter first name"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={isEditing ? (formData.last_name || '') : (userProfile.last_name || '')}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)] focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              placeholder="Enter last name"
            />
          </div>
        </div>

        {/* Display Name - Full Width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={isEditing ? (formData.display_name || '') : (userProfile.display_name || '')}
            onChange={(e) => handleInputChange('display_name', e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)] focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
            placeholder="Enter display name"
          />
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email address
          </label>
          <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-500 flex items-center justify-between gap-2 disabled:cursor-not-allowed">
            <span>{userProfile.email}</span>
            {userProfile.email_verified && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                <CheckCircle className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>
        </div>

        {/* Profile Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Image
          </label>
          <div className="flex items-start gap-4">
            {/* Small Profile Picture - Left Side */}
            {(userProfile?.avatar || currentUser?.avatar) && (
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-md relative overflow-hidden">
                  <img
                    src={userProfile?.avatar || currentUser?.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                  {(isUploadingAvatar || addOrUpdateAvatarMutation.isPending) && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upload Area - Right Side or Full Width if no image */}
            <div className={userProfile?.avatar || currentUser?.avatar ? "flex-1" : "w-full"}>
              <div
                onDrop={isEditing ? handleDrop : undefined}
                onDragOver={isEditing ? handleDragOver : undefined}
                onDragLeave={isEditing ? handleDragLeave : undefined}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center transition-colors
                  ${!isEditing 
                    ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-60' 
                    : isDragging 
                      ? 'border-[var(--color-brand-600)] bg-[var(--color-brand-50)] cursor-pointer' 
                      : 'border-gray-300 hover:border-gray-400 bg-gray-50 cursor-pointer'
                  }
                  ${isUploadingAvatar || addOrUpdateAvatarMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => isEditing && !isUploadingAvatar && !addOrUpdateAvatarMutation.isPending && document.getElementById('avatar-upload-input')?.click()}
              >
                <input
                  id="avatar-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar || addOrUpdateAvatarMutation.isPending}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <CloudUpload className={`w-12 h-12 ${isDragging ? 'text-[var(--color-brand-600)]' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      <span className="text-green-500">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      SVG, PNG, JPG or GIF (max. 800 x 400px)
                    </p>
                  </div>
                </div>
              </div>
              {(userProfile?.avatar || currentUser?.avatar) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveAvatar();
                  }}
                  disabled={isUploadingAvatar || removeAvatarMutation.isPending}
                  className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50"
                >
                  {removeAvatarMutation.isPending ? 'Removing...' : 'Remove image'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <AdvancedDropdown
            options={Array.from(new Set(timeZoneOptions.map(t => t.country)))
              .sort((a: string, b: string) => a.localeCompare(b))
              .map((country) => ({ label: country, value: country }))}
            value={isEditing ? (formData.country || '') : (userProfile.country || '')}
            onChange={(val) => handleInputChange('country', (val as string) || '')}
            placeholder="Select Country"
            searchable
            clearable
            disabled={!isEditing}
            className=""
          />
        </div>

        {/* Time Zone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Zone
          </label>
          <AdvancedDropdown
            options={(isEditing ? (formData.country ? timeZoneOptions.filter(t => t.country === formData.country) : []) : (userProfile.country ? timeZoneOptions.filter(t => t.country === userProfile.country) : []))
              .map((t) => ({ label: `${t.label} (${t.value})`, value: t.label }))}
            value={isEditing ? (formData.timezone || '') : (userProfile.timezone ? (timeZoneOptions.find(t => t.value === userProfile.timezone)?.label || userProfile.timezone) : '')}
            onChange={(val) => handleInputChange('timezone', (val as string) || '')}
            placeholder={isEditing ? (formData.country ? 'Select Time Zone' : 'Select Country first') : 'Not set'}
            searchable
            clearable
            disabled={!isEditing}
            className=""
          />
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <AdvancedDropdown
            options={[
              { label: 'English (US)', value: 'en-US' },
              { label: 'English (GB)', value: 'en-GB' },
              { label: 'English (IN)', value: 'en-IN' },
              { label: 'Spanish', value: 'es' },
              { label: 'French', value: 'fr' },
              { label: 'German', value: 'de' },
              { label: 'Japanese', value: 'ja' },
              { label: 'Chinese', value: 'zh' },
            ]}
            value={isEditing ? (formData.locale || '') : (userProfile.locale || '')}
            onChange={(val) => handleInputChange('locale', (val as string) || '')}
            placeholder="Select Language"
            searchable
            clearable
            disabled={!isEditing}
            className=""
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth
          </label>
          {isEditing ? (
            <>
              <DateField
                value={formData.dob || ''}
                onChange={(val) => { 
                  handleInputChange('dob', val);
                  if (dobError) setDobError(null);
                }}
                format="DD-MM-YYYY"
                isBorder
                max={convertDateToFormat(getYesterdayISO(), 'DD-MM-YYYY')}
                config={{ 
                  max: convertDateToFormat(getYesterdayISO(), 'DD-MM-YYYY'),
                  hideTodayButton: true
                }}
                disabled={!isEditing}
              />
              {dobError && <div className="mt-1.5 text-red-500 text-sm">{dobError}</div>}
            </>
          ) : (
            <input
              type="text"
              value={userProfile.dob || ''}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)] focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              placeholder="Not set"
            />
          )}
        </div>
      </div>
    </div>
  );
};