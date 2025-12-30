import React, { useState, useEffect, useMemo } from 'react';
import { X, UserPlus, CloudUpload, Search, Loader2 } from 'lucide-react';
import {
  useAddTenantUser,
  useWorkspaces,
  useUserRolesAndAccess,
  useUpdateUserProfile,
  useAddOrUpdateAvatar,
  useBulkAddMembers
} from '../../../hooks/useApi';
import { useToast } from '../../common/Toast';
import { WorkspaceItem, WorkspaceAssignment } from './WorkspaceItem';
import { TenantUser } from '../../shared/UserTable';
import { useCurrentUser } from '../../../auth/useCurrentUser';
import { useUserRole } from '../../../hooks/useUserRole';

// Helper function to extract roles from user object
const getOverallRoles = (user: TenantUser): string[] => {
  const roles: string[] = [];
  
  if (Array.isArray(user.roles)) {
    user.roles.forEach(role => {
      if (role.scope_level === 'system') {
        if (role.name === 'owner') {
          roles.push('Owner');
        } else if (role.name === 'co-owner') {
          roles.push('Co-owner');
        }
      }
    });
  } else if (typeof user.roles === 'string') {
    if (user.roles === 'owner') {
      roles.push('Owner');
    } else if (user.roles === 'co-owner') {
      roles.push('Co-owner');
    }
  }
  
  return roles;
};

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  editUser?: TenantUser | null;
}

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

  const { mutate: addUser, isPending: isAddingUser } = useAddTenantUser();
  const workspacesQuery = useWorkspaces();
  const toast = useToast();
  
  // Get current user info for role-based access control
  const currentUser = useCurrentUser();
  const { isOwner: currentUserIsOwner } = useUserRole();

  // Edit mode hooks
  const { data: userAccessData } = useUserRolesAndAccess(editUser?.id || null);
  const updateProfileMutation = useUpdateUserProfile(editUser?.id || '');
  const updateAvatarMutation = useAddOrUpdateAvatar(editUser?.id || '');
  const bulkAddMembersMutation = useBulkAddMembers();

  // Determine if the user being edited is Owner or Co-owner
  const editedUserRoles = useMemo(() => {
    if (!isEditMode || !editUser) return [];
    return getOverallRoles(editUser);
  }, [isEditMode, editUser]);

  const editedUserIsOwner = editedUserRoles.some(role => role.toLowerCase() === 'owner');
  const editedUserIsCoOwner = editedUserRoles.some(role => role.toLowerCase() === 'co-owner');
  const editedUserIsOwnerOrCoOwner = editedUserIsOwner || editedUserIsCoOwner;

  // Check if current user is editing themselves
  const isEditingSelf = useMemo(() => {
    return isEditMode && editUser && currentUser && editUser.id === currentUser.id;
  }, [isEditMode, editUser, currentUser]);

  // Load user data when in edit mode
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && editUser) {
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
        if (editUser.avatar) {
          setAvatarPreview(editUser.avatar);
        } else {
          setAvatarPreview(null);
        }
        setAvatar(null); // Reset file input

        setErrors({});
        setSearchTerm('');
        setIsSubmitting(false);
      } else {
        // ADD MODE: Reset form
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
      }
    }
  }, [isOpen, isEditMode, editUser]);

  // Load workspace assignments when userAccessData is available
  useEffect(() => {
    if (isEditMode && userAccessData && Array.isArray(userAccessData)) {
      const assignments: Record<string, WorkspaceAssignment> = {};

      userAccessData.forEach((workspaceAccess: any) => {
        const workspaceId = workspaceAccess.workspace_id;
        const workspaceAccessLevel = workspaceAccess.access || '';

        // Determine role based on access data
        // If access is empty string and bases exist, it's base_specific
        // If access has a value, it's a workspace-level role
        let role: 'maintainer' | 'workspace-read' | 'base_specific' = 'base_specific';
        if (workspaceAccessLevel === 'maintainer') {
          role = 'maintainer';
        } else if (workspaceAccessLevel === 'workspace-read') {
          role = 'workspace-read';
        } else if (workspaceAccess.bases && workspaceAccess.bases.length > 0) {
          // Empty access string with bases means base-specific role
          role = 'base_specific';
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

  // Validate email
  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(emailValue.trim());
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

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
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

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

      const img = new Image();
      img.onload = () => {
        if (img.width > 800 || img.height > 400) {
          setErrors(prev => ({ ...prev, avatar: 'Image dimensions must be max 800 x 400px' }));
          return;
        }
        setAvatar(file);
        setAvatarPreview(URL.createObjectURL(file));
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.avatar;
          return newErrors;
        });
      };
      img.src = URL.createObjectURL(file);
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
    if (file && file.type.startsWith('image/')) {
      const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (validTypes.includes(file.type)) {
        const img = new Image();
        img.onload = () => {
          if (img.width <= 800 && img.height <= 400) {
            setAvatar(file);
            setAvatarPreview(URL.createObjectURL(file));
            setErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors.avatar;
              return newErrors;
            });
          } else {
            setErrors(prev => ({ ...prev, avatar: 'Image dimensions must be max 800 x 400px' }));
          }
        };
        img.src = URL.createObjectURL(file);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && editUser) {
        // EDIT MODE: Update existing user
        // 1. Update profile (name)
        await updateProfileMutation.mutateAsync({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          display_name: `${firstName.trim()} ${lastName.trim()}`.trim()
        });

        // 2. Update avatar if changed
        if (avatar) {
          await updateAvatarMutation.mutateAsync(avatar);
        }

        // 3. Update access permissions for each workspace
        // Note: bulkAddMembers replaces existing access for that workspace
        const workspaceIds = Object.keys(workspaceAssignments);

        for (const workspaceId of workspaceIds) {
          const assignment = workspaceAssignments[workspaceId];

          const membership: {
            workspace_id: string;
            role: string;
            bases: Array<{ base_id: string; role: string }>;
          } = {
            workspace_id: workspaceId,
            role: '',
            bases: []
          };

          // If bases are provided, set bases and leave role as empty string
          if (assignment.role === 'base_specific' && assignment.bases && assignment.bases.length > 0) {
            membership.bases = assignment.bases.map(base => ({
              base_id: base.baseId,
              role: base.role // base-member or base-read
            }));
          }
          // If workspace-level role is assigned, set role and leave bases as empty array
          else if (assignment.role === 'maintainer' || assignment.role === 'workspace-read') {
            membership.role = assignment.role;
          }
          // Fallback: default to base-member role with empty bases
          else {
            membership.role = assignment.role || 'base-member';
          }

          // Update access for this workspace
          await bulkAddMembersMutation.mutateAsync({
            workspaceId,
            members: [{
              user_id: editUser.id,
              memberships: [membership]
            }]
          });
        }

        toast.success(`User ${firstName} ${lastName} updated successfully`);
      } else {
        // ADD MODE: Create new user
        // Build membership array from workspace assignments
        const membership = Object.values(workspaceAssignments).map(assignment => {
          const membershipItem: {
            workspace_id: string;
            role: string;
            bases: Array<{ base_id: string; role: string }>;
          } = {
            workspace_id: assignment.workspaceId,
            role: '',
            bases: []
          };

          // If bases are provided, set bases and leave role as empty string
          if (assignment.role === 'base_specific' && assignment.bases && assignment.bases.length > 0) {
            membershipItem.bases = assignment.bases.map(base => ({
              base_id: base.baseId,
              role: base.role // base-member or base-read
            }));
            // role remains empty string when bases are provided
          }
          // If workspace-level role is assigned, set role and leave bases as empty array
          else if (assignment.role === 'maintainer' || assignment.role === 'workspace-read') {
            membershipItem.role = assignment.role;
            // bases remains empty array when workspace role is assigned
          }
          // Fallback: default to base-member role with empty bases
          else {
            membershipItem.role = assignment.role || 'base-member';
          }

          return membershipItem;
        });

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isEmailValid = email.trim() ? validateEmail(email) : false;
  const isValid = firstName.trim() && lastName.trim() && email.trim() && isEmailValid && Object.keys(errors).length === 0;

  return (
    <div
      className="bg-modal-backdrop"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-modal !max-w-7xl !p-0 flex flex-col h-[90vh] max-h-[90vh]"
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
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <form id="add-user-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto min-h-0">
          <div className="p-0">
            <div className={`grid grid-cols-1 ${!isCoOwner && !(isEditMode && editedUserIsOwnerOrCoOwner) ? 'lg:grid-cols-2' : ''} gap-6`}>
              {/* Left Column - User Details */}
              <div className="space-y-4 bg-card p-4 lg:p-6">
                {/* First Name and Last Name - Side by Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email address <span className="text-red-500">*</span>
                  </label>
                  <input
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
                      if (email.trim() && !validateEmail(email)) {
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Image
                  </label>
                  {avatarPreview ? (
                    <div className="flex gap-4">
                      {/* Avatar Preview - Left Side */}
                      <div className="relative flex-shrink-0">
                        <div className="w-32 h-32 bg-green-100 rounded-xl flex items-center justify-center overflow-hidden">
                          <img
                            src={avatarPreview}
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
                            const input = document.getElementById('avatar-upload') as HTMLInputElement;
                            if (input) input.value = '';
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-primary rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>

                      {/* Upload Area - Right Side */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="flex-1 relative border-2 border-dashed border rounded-xl p-8 text-center hover:border-green-500 transition-colors cursor-pointer"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
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
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className="relative border-2 border-dashed border rounded-xl p-8 text-center hover:border-green-500 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
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
                    </div>
                  )}
                  {errors.avatar && (
                    <p className="mt-1 text-xs text-red-500">{errors.avatar}</p>
                  )}
                </div>

                {/* Co-owner Toggle - Hide when Owner edits themselves, show when Owner edits Co-owner */}
                {(() => {
                  // Don't show toggle if editing Owner or Co-owner (they can't be changed)
                  if (isEditMode && editedUserIsOwnerOrCoOwner) {
                    return null;
                  }
                  
                  // Don't show toggle if Owner is editing themselves
                  if (isEditMode && isEditingSelf && currentUserIsOwner()) {
                    return null;
                  }
                  
                  // Show toggle in all other cases (add mode, or Owner editing Co-owner, etc.)
                  return (
                    <div className="flex items-center justify-start gap-3">
                      <button
                        type="button"
                        onClick={() => setIsCoOwner(!isCoOwner)}
                        className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${isCoOwner ? 'bg-brand-600' : 'bg-gray-300'
                          }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${isCoOwner ? 'translate-x-5' : 'translate-x-1'
                            }`}
                        />
                      </button>
                      <label className="block text-sm font-medium text-gray-700">
                        Set as Co-owner
                      </label>
                    </div>
                  );
                })()}
              </div>

              {/* Right Column - Workspace/Base Selection - Hide for Co-owner and when editing Owner/Co-owner */}
              {!isCoOwner && !(isEditMode && editedUserIsOwnerOrCoOwner) && (
                <div className="space-y-4 bg-gray-50 p-4 lg:p-6">
                  <h3 className="text-sm font-semibold text-primary">Select Workspace(s) & Base(s)</h3>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search Workspace or Base"
                      className="w-full text-sm pl-10 pr-3 h-10 border rounded-lg text-primary focus:border-primary placeholder:text-gray-400 bg-card outline-none transition-all"
                    />
                  </div>

                  {/* Workspaces List */}
                  <div className="space-y-3 max-h-96 min-h-max overflow-y-auto pr-2">
                    {workspacesQuery.isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      </div>
                    ) : filteredWorkspaces.length === 0 ? (
                      <div className="text-center py-8 text-sm text-gray-500">
                        {searchTerm ? 'No workspaces found' : 'No workspaces available'}
                      </div>
                    ) : (
                      filteredWorkspaces.map((workspace: any) => (
                        <WorkspaceItem
                          key={workspace.id}
                          workspace={workspace}
                          assignment={workspaceAssignments[workspace.id]}
                          onRoleChange={handleWorkspaceRoleChange}
                          onBaseRoleChange={handleBaseRoleChange}
                          onToggleBase={toggleBaseSelection}
                        />
                      ))
                    )}
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
            disabled={isSubmitting || isAddingUser}
            className="px-4 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-user-form"
            disabled={!isValid || isSubmitting || isAddingUser}
            className="flex items-center gap-2 px-6 py-2 rounded-xl btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {(isSubmitting || isAddingUser) ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditMode ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              isEditMode ? 'Update' : 'Add'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
