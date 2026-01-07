import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useCurrentUser } from '../../auth/useCurrentUser';
import { useUserProfile, useUpdateUserProfile, useAddOrUpdateAvatar, useRemoveAvatar } from '../../hooks/useApi';
import { UserProfile } from '../../types/userProfile';
import { useToast } from '../common/Toast';
import { Loader2, CheckCircle, CloudUpload,X } from 'lucide-react';
import { AdvancedDropdown } from '../common/dropdown/AdvancedDropdown';
import { timeZoneOptions, currencyLocaleOptions } from '../../types/constants';
import { useFooterButtons } from './AccountSettings';
import { DateField } from '../common/Fields/DateField';
import { validateDOB, getYesterdayISO, convertDateToFormat } from '../../utils/dateValidation';

type ProfileFormData = {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  country?: string;
  dob?: string;
  timezone?: string;
  locale?: string;
};

const buildFormDataFromProfile = (userProfile: UserProfile): ProfileFormData => ({
  first_name: userProfile.first_name || '',
  last_name: userProfile.last_name || '',
  display_name: userProfile.display_name || '',
  country: userProfile.country || '',
  dob: userProfile.dob || '',
  locale: userProfile.locale || '',
  timezone: userProfile.timezone || '',
});

const safeSessionStorageSet = (key: string, value: string) => {
  try {
    if (typeof sessionStorage === 'undefined') return false;
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const PROFILE_UPDATE_FIELDS: Array<keyof ProfileFormData> = [
  'first_name',
  'last_name',
  'display_name',
  'country',
  'dob',
  'timezone',
  'locale',
];

const buildProfileUpdatePayload = (formData: ProfileFormData, userProfile: UserProfile | null): Record<string, string> => {
  const payload: Record<string, string> = {};

  if (userProfile) {
    for (const field of PROFILE_UPDATE_FIELDS) {
      const nextVal = formData[field] ?? '';
      const prevVal = (userProfile as any)[field] ?? '';
      if (nextVal !== prevVal) {
        payload[field] = nextVal;
      }
    }
    return payload;
  }

  for (const field of PROFILE_UPDATE_FIELDS) {
    const nextVal = formData[field];
    if (typeof nextVal === 'string') {
      payload[field] = nextVal;
    }
  }
  return payload;
};

const persistProfilePayloadToSessionStorage = (payload: Record<string, string>) => {
  const country = payload['country'];
  const timezone = payload['timezone'];

  if (typeof country === 'string') {
    safeSessionStorageSet('country', country);
  }
  if (typeof timezone === 'string') {
    safeSessionStorageSet('timezone', timezone);
  }
};

const getTimeZonesForCountry = (country?: string) => {
  if (!country) return [];
  return timeZoneOptions.filter(t => t.country === country);
};

export const ProfileSection: React.FC = () => { // NOSONAR
  const { user: authUser } = useAuth();
  const currentUser = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({});

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
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  // Get user ID from auth user
  const userId = authUser?.id;

  // Fetch user profile data
  const {
    data: profileResponse,
    isLoading,
    error,
    refetch
  } = useUserProfile(userId || '');

  const userProfile: UserProfile | null = (profileResponse as any)?.data || null;



  // Initialize form data when profile loads
  useEffect(() => {
    const isFormEmpty = Object.keys(formData || {}).length === 0;
    // If user clicks Edit before profile loads, formData stays empty; hydrate it once profile arrives.
    if (userProfile && (!isEditing || isFormEmpty)) {
      setFormData(buildFormDataFromProfile(userProfile));

      // Store timezone and country in sessionStorage when profile loads
      if (userProfile.timezone) {
        safeSessionStorageSet('timezone', userProfile.timezone);
      }
      if (userProfile.country) {
        safeSessionStorageSet('country', userProfile.country);
      }
    }
  }, [userProfile, isEditing]);

  // Clean up preview URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  // Check for changes
  useEffect(() => {
    if (userProfile && isEditing) {
      const hasFormChanges =
        formData.first_name !== userProfile.first_name ||
        formData.last_name !== userProfile.last_name ||
        formData.display_name !== userProfile.display_name ||
        formData.country !== (userProfile.country || '') ||
        formData.dob !== (userProfile.dob || '') ||
        formData.locale !== (userProfile.locale || '') ||
        formData.timezone !== (userProfile.timezone || '') ||
        selectedAvatarFile !== null;
      setHasChanges(hasFormChanges);
    }
  }, [formData, userProfile, isEditing, selectedAvatarFile]);

  // Register footer buttons with cleanup
  useEffect(() => {
    // Only register if this is still the active section
    if (currentSection !== 'profile') {
      return;
    }

    const footerContent = isEditing ? (
      <div className="flex items-center justify-end gap-3 w-full">
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 text-sm border text-gray-700 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving || updateProfileMutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 text-sm btn-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-primary"
        >
          {(isSaving || updateProfileMutation.isPending) && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          {(isSaving || updateProfileMutation.isPending) ? 'Saving...' : 'Update'}
        </button>
      </div>
    ) : (
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => {
            if (userProfile) {
              setFormData(buildFormDataFromProfile(userProfile));
            }
            setIsEditing(true);
          }}
          className="flex items-center gap-2 px-6 py-2.5 text-sm btn-primary transition-colors rounded-xl text-primary"
        >
          Edit
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
      const tzEntries = getTimeZonesForCountry(country);
      const tzValues = tzEntries.map(t => t.value);
      setFormData(prev => {
        const prevTz = prev.timezone || '';
        const nextTz = tzValues.includes(prevTz) ? prevTz : (tzValues[0] || '');
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

  const handleSave = async () => { // NOSONAR
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
      // Upload avatar if selected
      if (selectedAvatarFile) {
        try {
          await addOrUpdateAvatarMutation.mutateAsync(selectedAvatarFile);
        } catch (error: any) {
          console.error('Failed to upload avatar:', error);
          toast.error(error?.message || 'Failed to upload avatar. Please try again.', { title: 'Avatar Upload Failed' });
          setIsSaving(false);
          return;
        }
      }

      const payload = buildProfileUpdatePayload(formData, userProfile);
      await updateProfileMutation.mutateAsync(payload);

      // Persist updated country and timezone to sessionStorage
      persistProfilePayloadToSessionStorage(payload);

      // Clear avatar selection and preview
      setSelectedAvatarFile(null);
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
        setAvatarPreviewUrl(null);
      }

      setIsEditing(false);
      setHasChanges(false);
      setFormData({});
      setDobError(null);
      toast.success('Profile updated successfully!', { title: 'Success' });
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      toast.error(error?.message || 'Failed to save profile. Please try again.', { title: 'Save Failed' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setFormData(buildFormDataFromProfile(userProfile));
    }
    setDobError(null);
    setIsEditing(false);
    setHasChanges(false);
    
    // Clear avatar selection and preview
    setSelectedAvatarFile(null);
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(null);
    }
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

    // Clean up previous preview URL if exists
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    // Create preview URL and store file
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreviewUrl(previewUrl);
    setSelectedAvatarFile(file);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
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
            className="px-4 py-2 bg-blue-600 text-primary rounded-md hover:bg-blue-700"
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

  const displayAvatarUrl = avatarPreviewUrl || userProfile?.avatar || currentUser?.avatar;
  let avatarUploadStateClass = 'border bg-gray-50 cursor-not-allowed opacity-60';
  if (isEditing) {
    if (isDragging) {
      avatarUploadStateClass = 'border-[var(--color-brand-600)] bg-[var(--color-brand-50)] cursor-pointer';
    } else {
      avatarUploadStateClass = 'border hover:border-green-500 bg-gray-50 cursor-pointer';
    }
  }
  const avatarUploadBusyClass = (isUploadingAvatar || addOrUpdateAvatarMutation.isPending) ? 'opacity-50 cursor-not-allowed' : '';

  const activeCountry = isEditing ? (formData.country || '') : (userProfile.country || '');
  const tzDropdownOptions = getTimeZonesForCountry(activeCountry)
    .map((t) => ({ label: `${t.label} (${t.value})`, value: t.value }));
  const tzDropdownValue = isEditing ? (formData.timezone || '') : (userProfile.timezone || '');
  let tzDropdownPlaceholder = 'Not set';
  if (isEditing) {
    if (activeCountry) {
      tzDropdownPlaceholder = 'Select Time Zone';
    } else {
      tzDropdownPlaceholder = 'Select Country first';
    }
  }

  const triggerAvatarInput = () => {
    if (!isEditing || isUploadingAvatar || addOrUpdateAvatarMutation.isPending) return;
    document.getElementById('avatar-upload-input')?.click();
  };



  return (
    <div className="space-y-6">
      {/* Form Fields */}
      <div className="space-y-6">
        {/* First Name and Last Name - Side by Side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span>First Name</span>
              <input
                type="text"
                value={isEditing ? (formData.first_name || '') : (userProfile.first_name || '')}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                disabled={isEditing === false}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-600)] focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                placeholder="Enter first name"
              />
            </label>
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span>Last Name</span>
              <input
                type="text"
                value={isEditing ? (formData.last_name || '') : (userProfile.last_name || '')}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                disabled={isEditing === false}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-600)] focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                placeholder="Enter last name"
              />
            </label>
          </div>
        </div>

        {/* Display Name - Full Width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span>Display Name</span>
            <input
              type="text"
              value={isEditing ? (formData.display_name || '') : (userProfile.display_name || '')}
              onChange={(e) => handleInputChange('display_name', e.target.value)}
              disabled={isEditing === false}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-600)] focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              placeholder="Enter display name"
            />
          </label>
        </div>

        {/* Email Address */}
        <div>
          <div className="block text-sm font-medium text-gray-700 mb-2">
            Email address
          </div>
          <div className="px-4 py-3 bg-gray-50 border rounded-xl text-gray-500 flex items-center justify-between gap-2 disabled:cursor-not-allowed">
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
          <div className="block text-sm font-medium text-gray-700 mb-2">
            Profile Image
          </div>
          {displayAvatarUrl ? (
            <div className="flex gap-4">
              {/* Image Preview - Left Side */}
              <div className="relative flex-shrink-0">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center overflow-hidden">
                  <img
                    src={displayAvatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                  {(isUploadingAvatar || addOrUpdateAvatarMutation.isPending) && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                {isEditing && !isUploadingAvatar && !addOrUpdateAvatarMutation.isPending && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedAvatarFile) {
                        // Just clear the preview if it's a pending upload
                        setSelectedAvatarFile(null);
                        if (avatarPreviewUrl) {
                          URL.revokeObjectURL(avatarPreviewUrl);
                          setAvatarPreviewUrl(null);
                        }
                      } else {
                        // Remove existing avatar
                        handleRemoveAvatar();
                      }
                    }}
                    disabled={removeAvatarMutation.isPending}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-primary rounded-full flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              
              {/* Upload Area - Right Side */}
              <div className="flex-1">
                <div
                  onDragOver={isEditing ? handleDragOver : undefined}
                  onDrop={isEditing ? handleDrop : undefined}
                  onDragLeave={isEditing ? handleDragLeave : undefined}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${avatarUploadStateClass} ${avatarUploadBusyClass}`}
                  onClick={isEditing ? triggerAvatarInput : undefined}
                >
                  <input
                    id="avatar-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar || addOrUpdateAvatarMutation.isPending}
                    className="hidden"
                  />
                  <CloudUpload className={`w-12 h-12 ${isDragging ? 'text-[var(--color-brand-600)]' : 'text-gray-400'} mx-auto mb-3`} />
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="text-green-500 font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    SVG, PNG, JPG or GIF (max. 800 x 400px)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={isEditing ? handleDragOver : undefined}
              onDrop={isEditing ? handleDrop : undefined}
              onDragLeave={isEditing ? handleDragLeave : undefined}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${avatarUploadStateClass} ${avatarUploadBusyClass}`}
              onClick={isEditing ? triggerAvatarInput : undefined}
            >
              <input
                id="avatar-upload-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isUploadingAvatar || addOrUpdateAvatarMutation.isPending}
                className="hidden"
              />
              <CloudUpload className={`w-12 h-12 ${isDragging ? 'text-[var(--color-brand-600)]' : 'text-gray-400'} mx-auto mb-3`} />
              <p className="text-sm text-gray-600 mb-1">
                <span className="text-green-500 font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                SVG, PNG, JPG or GIF (max. 800 x 400px)
              </p>
            </div>
          )}
        </div>

        {/* Country */}
        <div>
          <div className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </div>
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
          <div className="block text-sm font-medium text-gray-700 mb-2">
            Time Zone
          </div>
          <AdvancedDropdown
            options={tzDropdownOptions}
            value={tzDropdownValue}
            onChange={(val) => handleInputChange('timezone', (val as string) || '')}
            placeholder={tzDropdownPlaceholder}
            searchable
            clearable
            disabled={!isEditing}
            className=""
          />
        </div>

        {/* Language */}
        <div>
          <div className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </div>
          <AdvancedDropdown
            options={currencyLocaleOptions}
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
          <div className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth
          </div>
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
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-600)] focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              placeholder="Not set"
            />
          )}
        </div>
      </div>
    </div>
  );
};