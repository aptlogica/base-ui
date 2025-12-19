import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useCurrentUser } from '../../auth/useCurrentUser';
import { useUserProfile, useUpdateUserProfile, useAddOrUpdateAvatar, useRemoveAvatar } from '../../hooks/useApi';
import { UserProfile, UserProfileUpdate } from '../../types/userProfile';
import { useToast } from '../common/Toast';
import { Loader2, Save, X, Edit3, CheckCircle, Camera, Trash2 } from 'lucide-react';
import { DateField } from '../common/Fields/DateField';
import { AdvancedDropdown } from '../common/dropdown/AdvancedDropdown';
import { timeZoneOptions } from '../../types/constants';
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
  }>({});

  const [hasChanges, setHasChanges] = useState(false);
  const [dobError, setDobError] = useState<string | null>(null);

  // Toast for notifications
  const toast = useToast();

  // API hooks
  const updateProfileMutation = useUpdateUserProfile(authUser?.id || '');
  const addOrUpdateAvatarMutation = useAddOrUpdateAvatar(authUser?.id || '');
  const removeAvatarMutation = useRemoveAvatar(authUser?.id || '');

  // Avatar states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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

  // Live clock to show current time in selected time zone
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const formatInTimeZone = (date: Date, tz?: string) => {
    if (!tz) return '';
    try {
      return new Intl.DateTimeFormat(undefined, {
        timeZone: tz,
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (e) {
      return '';
    }
  };


  // Initialize form data when profile loads
  useEffect(() => {
    if (userProfile && !isEditing) {
      setFormData({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        display_name: userProfile.display_name || '',
        country: userProfile.country || '',
        dob: userProfile.dob || '',
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
        formTzShort !== (userProfile.timezone || '');
      setHasChanges(hasFormChanges);
    }
  }, [formData, userProfile, isEditing]);

  const handleInputChange = (field: 'first_name' | 'last_name' | 'display_name' | 'country' | 'dob' | 'timezone', value: string) => {
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
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

  // Helper functions
  const getUserInitials = () => {
    if (userProfile.first_name && userProfile.last_name) {
      return `${userProfile.first_name[0]}${userProfile.last_name[0]}`.toUpperCase();
    }
    return userProfile.email?.[0]?.toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    return userProfile.display_name ||
      `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() ||
      'User';
  };

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex items-center justify-end mb-4">
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm btn-primary transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving || updateProfileMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm btn-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(isSaving || updateProfileMutation.isPending) && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {(isSaving || updateProfileMutation.isPending) ? 'Saving...' : 'Update'}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-start space-x-6">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg relative">
            {userProfile?.avatar || currentUser?.avatar ? (
              <img
                src={userProfile?.avatar || currentUser?.avatar}
                alt="Profile"
                className="w-24 h-24 rounded-xl object-cover"
              />
            ) : (
              <span className="text-white font-bold text-3xl">
                {getUserInitials()}
              </span>
            )}
            {(isUploadingAvatar || addOrUpdateAvatarMutation.isPending) && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isUploadingAvatar || addOrUpdateAvatarMutation.isPending}
                className="hidden"
              />
              <span className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer disabled:opacity-50">
                <Camera className="w-4 h-4" />
                {isUploadingAvatar || addOrUpdateAvatarMutation.isPending ? 'Uploading...' : 'Upload'}
              </span>
            </label>
            {(userProfile?.avatar || currentUser?.avatar) && (
              <button
                onClick={handleRemoveAvatar}
                disabled={isUploadingAvatar || removeAvatarMutation.isPending}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {removeAvatarMutation.isPending ? 'Removing...' : 'Remove'}
              </button>
            )}
          </div>
        </div>

        {/* User Details */}
        <div className="flex-1 space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.first_name || ''}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className="field-component field-component-border field-component-focus"
                  placeholder="Enter first name"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 font-medium">
                  {userProfile.first_name || 'Not set'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.last_name || ''}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className="field-component field-component-border field-component-focus"
                  placeholder="Enter last name"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 font-medium">
                  {userProfile.last_name || 'Not set'}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.display_name || ''}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                className="field-component field-component-border field-component-focus"
                placeholder="Enter display name"
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 font-medium">
                {userProfile.display_name || 'Not set'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 font-medium flex items-center justify-between gap-2">
              {userProfile.email}
              {userProfile.email_verified && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            {isEditing ? (
              <AdvancedDropdown
                options={Array.from(new Set(timeZoneOptions.map(t => t.country)))
                  .sort((a, b) => a.localeCompare(b))
                  .map((country) => ({ label: country, value: country }))}
                value={formData.country || ''}
                onChange={(val) => handleInputChange('country', (val as string) || '')}
                placeholder="Select Country"
                searchable
                clearable
                className=""
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 font-medium">
                {userProfile.country || 'Not set'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Zone
            </label>
            {isEditing ? (
              <AdvancedDropdown
                options={(formData.country ? timeZoneOptions.filter(t => t.country === formData.country) : [])
                  .map((t) => ({ label: `${t.label} (${t.value})`, value: t.label }))}
                value={formData.timezone || ''}
                onChange={(val) => handleInputChange('timezone', (val as string) || '')}
                placeholder={formData.country ? 'Select Time Zone' : 'Select Country first'}
                searchable
                clearable
                className=""
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 font-medium">
                {userProfile.timezone || 'Not set'}
              </div>
            )}
            {/* {(isEditing ? !!formData.timezone : !!userProfile.timezone) && (
                <div className="mt-2 text-sm text-gray-500">
                  Current time: {formatInTimeZone(now, (isEditing ? formData.timezone : (timeZoneOptions.find(t => t.value === userProfile.timezone)?.label || userProfile.timezone)) || undefined)}
                </div>
              )} */}
          </div>

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
                />
                {dobError && <div className="mt-1.5 text-red-500 text-sm">{dobError}</div>}
              </>
            ) : (
              <div className="px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 font-medium">
                {userProfile.dob || 'Not set'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};