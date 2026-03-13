import React, { useState, useEffect, useMemo } from 'react';
import { X, UserPlus, CloudUpload, Search, Loader2 } from 'lucide-react';
import {
  useAddUser,
  useEditUser,
  useWorkspaces,
  useUserRolesAndAccess
} from '../../../hooks/useApi';
import { useToast } from '../../common/Toast';
import { WorkspaceItem, WorkspaceAssignment } from './WorkspaceItem';
import { TenantUser } from '../../shared/UserTable';
import { useCurrentUser } from '../../../auth/useCurrentUser';
import { useUserRole } from '../../../hooks/useUserRole';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  editUser?: TenantUser | null;
}

type MembershipItem = {
  workspace_id: string;
  role: string;
  bases?: Array<{ base_id: string; role: string }>;
};

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const validateEmailValue = (emailValue: string): boolean => {
  return EMAIL_REGEX.test(emailValue.trim());
};

const getUserFormErrors = (params: {
  firstName: string;
  lastName: string;
  email: string;
}) => {
  const newErrors: Record<string, string> = {};
  const { firstName, lastName, email } = params;

  if (!firstName.trim()) {
    newErrors.firstName = 'First name is required';
  } else if (!/^[a-zA-Z\s]+$/.test(firstName.trim())) {
    newErrors.firstName = 'First name must contain only letters and spaces';
  }

  if (!lastName.trim()) {
    newErrors.lastName = 'Last name is required';
  } else if (!/^[a-zA-Z\s]+$/.test(lastName.trim())) {
    newErrors.lastName = 'Last name must contain only letters and spaces';
  }

  if (!email.trim()) {
    newErrors.email = 'Email is required';
  } else if (!validateEmailValue(email)) {
    newErrors.email = 'Please enter a valid email address';
  }

  return newErrors;
};

const getSafeImageSrc = (value: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString();
    }
    if (url.protocol === 'blob:') {
      if (typeof globalThis !== 'undefined' && globalThis.location?.origin) {
        if (url.origin !== globalThis.location.origin) return null;
      }
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
};

const buildMembershipFromAssignments = (
  workspaceAssignments: Record<string, WorkspaceAssignment>
): MembershipItem[] => {
  return Object.values(workspaceAssignments).map((assignment) => {
    const membershipItem: MembershipItem = {
      workspace_id: assignment.workspaceId,
      role: '',
      bases: []
    };

    if (assignment.role === 'base_specific' && assignment.bases && assignment.bases.length > 0) {
      membershipItem.bases = assignment.bases.map((base) => ({
        base_id: base.baseId,
        role: base.role
      }));
    } else if (assignment.role === 'maintainer' || assignment.role === 'workspace-read') {
      membershipItem.role = assignment.role;
    } else {
      membershipItem.role = assignment.role || 'base-member';
    }

    return membershipItem;
  });
};

// eslint-disable-next-line sonarjs/cognitive-complexity
export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, editUser = null }) => {
  const isEditMode = !!editUser;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isCoOwner, setIsCoOwner] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [workspaceAssignments, setWorkspaceAssignments] = useState<Record<string, WorkspaceAssignment>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutate: addUser, isPending: isAddingUser } = useAddUser();
  const editUserMutation = useEditUser();
  const workspacesQuery = useWorkspaces();
  const toast = useToast();
  
  // Get current user info for role-based access control
  const currentUser = useCurrentUser();
  const { isOwner: currentUserIsOwner } = useUserRole();

  // Edit mode hooks
  const { data: userAccessData } = useUserRolesAndAccess(editUser?.id || null);

  // Determine if the user being edited is Owner or Co-owner
  const editedUserIsOwnerOrCoOwner = useMemo(() => {
    if (!isEditMode || !editUser) return false;

    // Check for Owner or Co-owner roles
    if (Array.isArray(editUser.roles)) {
      return editUser.roles.some((role) =>
        role.scope_level === 'system' &&
        (role.name === 'owner' || role.name === 'co-owner' || role.name === 'co_owner')
      );
    } else if (typeof editUser.roles === 'string') {
      return editUser.roles === 'owner' || editUser.roles === 'co-owner' || editUser.roles === 'co_owner';
    }

    return false;
  }, [isEditMode, editUser]);

  // Check if current user is editing themselves
  const isEditingSelf = useMemo(() => {
    return isEditMode && editUser?.id === currentUser?.id;
  }, [isEditMode, editUser, currentUser]);

  // Load user data when in edit mode
  useEffect(() => {
    if (!isOpen || !isEditMode || !editUser) return;

    // EDIT MODE: Pre-populate form with user data
    setFirstName(editUser.first_name || '');
    setLastName(editUser.last_name || '');
    setEmail(editUser.email || '');

    // Check if user is co-owner
    const roles = Array.isArray(editUser.roles) ? editUser.roles : [];
    const isCoOwnerRole = roles.some((r: any) =>
      r.name === 'co-owner' || r.name === 'Co-owner' || r.name === 'co_owner'
    );
    setIsCoOwner(isCoOwnerRole);

    // Load avatar preview if exists
    setAvatarPreview(getSafeImageSrc(editUser.avatar || null));
    setAvatar(null); // Reset file input

    setErrors({});
    setSearchTerm('');
    setIsSubmitting(false);
  }, [isOpen, isEditMode, editUser]);

  // Reset form when in add mode
  useEffect(() => {
    if (!isOpen || isEditMode) return;

    setFirstName('');
    setLastName('');
    setEmail('');
    setAvatar(null);
    setAvatarPreview(null);
    setIsCoOwner(false);
    setErrors({});
    setWorkspaceAssignments({});
    setSearchTerm('');
    setIsSubmitting(false);
  }, [isOpen, isEditMode]);

  // Load workspace assignments when userAccessData is available
  useEffect(() => {
    if (isEditMode && userAccessData && Array.isArray(userAccessData)) {
      const assignments: Record<string, WorkspaceAssignment> = {};

      userAccessData.forEach((workspaceAccess: any) => {
        const workspaceId = workspaceAccess.workspace_id;
        const workspaceAccessLevel = workspaceAccess.access || '';

        let role: 'maintainer' | 'workspace-read' | 'base_specific' = 'base_specific';
        if (workspaceAccessLevel === 'maintainer') {
          role = 'maintainer';
        } else if (workspaceAccessLevel === 'workspace-read') {
          role = 'workspace-read';
        }

        assignments[workspaceId] = {
          workspaceId,
          role,
          bases: workspaceAccess.bases?.map((base: any) => ({
            baseId: base.base_id,
            role: (base.access || 'base-member') as 'base-member' | 'base-read'
          })) || []
        };
      });

      setWorkspaceAssignments(assignments);
    }
  }, [isEditMode, userAccessData]);


  const workspaces = workspacesQuery.data || [];

  // Filter workspaces based on search term
  const filteredWorkspaces = useMemo(() => {
    if (!searchTerm.trim()) return workspaces;
    const term = searchTerm.toLowerCase();
    return workspaces.filter((ws: any) =>
      (ws.title || ws.name || '').toLowerCase().includes(term)
    );
  }, [workspaces, searchTerm]);

  const validateForm = () => {
    const newErrors = getUserFormErrors({ firstName, lastName, email });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, avatar: 'Please upload a valid image file (SVG, PNG, JPG, or GIF)' }));
        return;
      }

      const img = new globalThis.Image();
      img.onload = () => {
        if (img.width > 800 || img.height > 400) {
          setErrors(prev => ({ ...prev, avatar: 'Image dimensions must be max 800 x 400px' }));
          return;
        }
        setAvatar(file);
        const preview = getSafeImageSrc(globalThis.URL.createObjectURL(file));
        setAvatarPreview(preview);
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.avatar;
          return newErrors;
        });
      };
      img.src = globalThis.URL.createObjectURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file?.type?.startsWith('image/')) {
      const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (validTypes.includes(file.type)) {
        const img = new globalThis.Image();
        img.onload = () => {
          if (img.width <= 800 && img.height <= 400) {
            setAvatar(file);
            const preview = getSafeImageSrc(globalThis.URL.createObjectURL(file));
            setAvatarPreview(preview);
            setErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors.avatar;
              return newErrors;
            });
          } else {
            setErrors(prev => ({ ...prev, avatar: 'Image dimensions must be max 800 x 400px' }));
          }
        };
        img.src = globalThis.URL.createObjectURL(file);
      } else {
        setErrors(prev => ({ ...prev, avatar: 'Please upload a valid image file (SVG, PNG, JPG, or GIF)' }));
      }
    }
  };

  // Handle workspace role change
  const handleWorkspaceRoleChange = (workspaceId: string, role: 'maintainer' | 'workspace-read' | 'base_specific' | null) => {
    setWorkspaceAssignments(prev => {
      const updated = { ...prev };
      if (role === null) {
        delete updated[workspaceId];
      } else if (role === 'base_specific') {
        updated[workspaceId] = {
          workspaceId,
          role: 'base_specific',
          bases: []
        };
      } else {
        updated[workspaceId] = {
          workspaceId,
          role,
          bases: undefined
        };
      }
      return updated;
    });
  };

  // Handle base role change
  const handleBaseRoleChange = (workspaceId: string, baseId: string, role: 'base-member' | 'base-read') => {
    setWorkspaceAssignments(prev => {
      const updated = { ...prev };
      if (!updated[workspaceId]) {
        updated[workspaceId] = {
          workspaceId,
          role: 'base_specific',
          bases: []
        };
      }
      const assignment = updated[workspaceId];
      if (assignment.role === 'base_specific' && assignment.bases) {
        const baseIndex = assignment.bases.findIndex(b => b.baseId === baseId);
        if (baseIndex >= 0) {
          assignment.bases[baseIndex].role = role;
        } else {
          // Add base with the selected role
          assignment.bases.push({ baseId, role });
        }
      }
      return updated;
    });
  };

  // Toggle base selection
  const toggleBaseSelection = (workspaceId: string, baseId: string) => {
    setWorkspaceAssignments(prev => {
      const updated = { ...prev };
      if (!updated[workspaceId]) {
        updated[workspaceId] = {
          workspaceId,
          role: 'base_specific',
          bases: []
        };
      }
      const assignment = updated[workspaceId];
      if (assignment.role === 'base_specific' && assignment.bases) {
        const baseIndex = assignment.bases.findIndex(b => b.baseId === baseId);
        if (baseIndex >= 0) {
          assignment.bases.splice(baseIndex, 1);
          if (assignment.bases.length === 0) {
            delete updated[workspaceId];
          }
        } else {
          assignment.bases.push({ baseId, role: 'base-member' });
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e:React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && editUser) {
        const membership = buildMembershipFromAssignments(workspaceAssignments);

        // Prepare edit user data
        const editUserData: {
          user_id: string;
          firstname?: string;
          lastname?: string;
          profile_pic?: File;
          is_coowner?: boolean;
          membership?: Array<{
            workspace_id: string;
            role: string;
            bases?: Array<{ base_id: string; role: string }>;
          }>;
        } = {
          user_id: editUser.id,
          firstname: firstName.trim(),
          lastname: lastName.trim(),
        };

        // Add profile picture if changed
        if (avatar) {
          editUserData.profile_pic = avatar;
        }

        // Always include co-owner status to allow removing the role
        editUserData.is_coowner = isCoOwner;

        // Add membership if there are workspace assignments
        if (membership.length > 0) {
          editUserData.membership = membership;
        }

        await editUserMutation.mutateAsync(editUserData);
        toast.success(`User ${firstName} ${lastName} updated successfully`);
      } else {
        const membership = buildMembershipFromAssignments(workspaceAssignments);

        // Create user with all data in one call
        const userPayload = {
          firstname: firstName.trim(),
          lastname: lastName.trim(),
          email: email.trim(),
          ...(avatar && { profile_pic: avatar }),
          ...(isCoOwner && { is_coowner: true }),
          ...(membership.length > 0 && { membership })
        };

        await new Promise<void>((resolve, reject) => {
          addUser(userPayload, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error)
          });
        });

        toast.success(`User ${firstName} ${lastName} added successfully`);
      }

      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setAvatar(null);
      setAvatarPreview(null);
      setIsCoOwner(false);
      setErrors({});
      setWorkspaceAssignments({});
      setSearchTerm('');

      onClose();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message ||
        (isEditMode ? 'Failed to update user' : 'Failed to add user');
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isEmailValid = email.trim() ? validateEmailValue(email) : false;
  const isValid = firstName.trim() && lastName.trim() && email.trim() && isEmailValid && Object.keys(errors).length === 0;

  const showCoOwnerToggle =
    !isEditMode || (currentUserIsOwner() && !editedUserIsOwnerOrCoOwner && !isEditingSelf);

  // Hide workspace/base panel for owners since they already have access to everything
  const showWorkspaceBasePanel =
    (!isEditMode && !isCoOwner) || (isEditMode && !isCoOwner && !editedUserIsOwnerOrCoOwner && !isEditingSelf);

  let workspacesListContent: React.ReactNode;
  if (workspacesQuery.isLoading) {
    workspacesListContent = (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  } else if (filteredWorkspaces.length === 0) {
    workspacesListContent = (
      <div className="text-center py-8 text-sm text-gray-500">
        {searchTerm ? 'No workspaces found' : 'No workspaces available'}
      </div>
    );
  } else {
    workspacesListContent = filteredWorkspaces.map((workspace: any) => (
      <WorkspaceItem
        key={workspace.id}
        workspace={workspace}
        assignment={workspaceAssignments[workspace.id]}
        onRoleChange={handleWorkspaceRoleChange}
        onBaseRoleChange={handleBaseRoleChange}
        onToggleBase={toggleBaseSelection}
      />
    ));
  }

  const isBusy = isSubmitting || isAddingUser || editUserMutation.isPending;
  const submitLabel = isEditMode ? 'Update' : 'Add';
  const submitBusyLabel = isEditMode ? 'Updating...' : 'Adding...';

  return (
    <div className="bg-modal-backdrop relative">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div
        className="bg-modal !max-w-7xl !p-0 flex flex-col h-[90vh] max-h-[90vh] relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">
                {isEditMode ? 'Edit User' : 'Add Users'}
              </h2>
              <p className="text-sm text-secondary">
                {isEditMode
                  ? 'Update user information and access permissions'
                  : 'Add users to collaborate on this project'
                }
              </p>
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
        <form id="add-user-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto min-h-0">
          <div className="p-0 h-full">
            <div className={`grid gap-6 h-full ${showWorkspaceBasePanel ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {/* Left Column - User Details */}
              <div className="space-y-4 bg-card p-4 lg:p-6">
                {/* First Name and Last Name - Side by Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="field-component-required">*</span>
                    </label>
                    <input
                      id="first-name"
                      type="text"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (errors.firstName) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.firstName;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Enter first name"
                      className={`w-full text-sm px-3 h-10 border rounded-lg text-primary focus:border-primary placeholder:text-gray-400 bg-card outline-none transition-all ${errors.firstName ? 'border-red-500' : 'border'
                        }`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="field-component-required">*</span>
                    </label>
                    <input
                      id="last-name"
                      type="text"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (errors.lastName) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.lastName;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Enter last name"
                      className={`w-full text-sm px-3 h-10 border rounded-lg text-primary focus:border-primary placeholder:text-gray-400 bg-card outline-none transition-all ${errors.lastName ? 'border-red-500' : 'border'
                        }`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address <span className="field-component-required">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      if (!isEditMode) {
                        setEmail(e.target.value);
                        if (errors.email) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.email;
                            return newErrors;
                          });
                        }
                      }
                    }}
                    onBlur={() => {
                      if (email.trim() && !validateEmailValue(email)) {
                        setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
                      }
                    }}
                    disabled={isEditMode}
                    placeholder="Enter email address"
                    className={`w-full text-sm px-3 h-10 border rounded-lg text-primary focus:border-primary placeholder:text-gray-400 bg-card outline-none transition-all ${errors.email ? 'border-red-500' : 'border'
                      } ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Profile Image */}
                <div>
                  <label htmlFor="avatar-upload" className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Image
                  </label>
                  {avatarPreview ? (
                    <div className="flex gap-4">
                      {/* Avatar Preview - Left Side */}
                      <div className="relative flex-shrink-0">
                        <div className="w-32 h-32 bg-green-100 rounded-xl flex items-center justify-center overflow-hidden">
                          <img
                            src={getSafeImageSrc(avatarPreview) || ''}
                            alt="Avatar preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAvatar(null);
                            setAvatarPreview(null);
                            const input = globalThis.document.getElementById('avatar-upload') as HTMLInputElement;
                            if (input) input.value = '';
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-primary rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>

                      {/* Upload Area - Right Side */}
                      <button
                        type="button"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="flex-1 relative border-2 border-dashed rounded-xl p-8 text-center hover:border-green-500 transition-colors cursor-pointer"
                        onClick={() => globalThis.document.getElementById('avatar-upload')?.click()}
                      >
                        <input
                          type="file"
                          id="avatar-upload"
                          accept="image/svg+xml,image/png,image/jpeg,image/jpg,image/gif"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="text-green-500 font-medium">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          SVG, PNG, JPG or GIF (max. 800 x 400px)
                        </p>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className="relative border-2 w-full border-dashed rounded-xl p-8 text-center hover:border-green-500 transition-colors cursor-pointer"
                      onClick={() => globalThis.document.getElementById('avatar-upload')?.click()}
                    >
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/svg+xml,image/png,image/jpeg,image/jpg,image/gif"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="text-green-500 font-medium">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        SVG, PNG, JPG or GIF (max. 800 x 400px)
                      </p>
                    </button>
                  )}
                  {errors.avatar && (
                    <p className="mt-1 text-xs text-red-500">{errors.avatar}</p>
                  )}
                </div>

                {/* Co-owner Toggle */}
                {showCoOwnerToggle && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-start gap-3">
                      <button
                        type="button"
                        onClick={() => setIsCoOwner(!isCoOwner)}
                        aria-pressed={isCoOwner}
                        className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${isCoOwner ? 'bg-brand-600' : 'bg-gray-300'
                          }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${isCoOwner ? 'translate-x-5' : 'translate-x-1'
                            }`}
                        />
                      </button>
                      <span className="block text-sm font-medium text-gray-700">Set as Co-owner</span>
                    </div>
                    <p className="text-sm text-gray-500 ml-13">
                      Co-owners have full administrative access, including the ability to manage users, bases, and workspace settings.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column - Workspace/Base Selection */}
              {showWorkspaceBasePanel && (
                <div className="flex flex-col h-full min-h-0 bg-gray-50 p-4 lg:p-6">
                  <h3 className="text-sm font-semibold text-primary flex-shrink-0 mb-4">Select Workspace(s) & Base(s)</h3>

                  {/* Search Bar */}
                  <div className="relative flex-shrink-0 mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search Workspace or Base"
                      className="w-full text-sm pl-10 pr-3 h-10 border rounded-lg text-primary focus:border-primary placeholder:text-gray-400 bg-card outline-none transition-all"
                    />
                  </div>

                  {/* Workspaces List - Scrollable */}
                  <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                    <div className="space-y-3">
                      {workspacesListContent}
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
            disabled={isBusy}
            className="px-16 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-user-form"
            disabled={!isValid || isBusy}
            className="flex items-center gap-2 px-16 py-2 rounded-xl btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isBusy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {submitBusyLabel}
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
