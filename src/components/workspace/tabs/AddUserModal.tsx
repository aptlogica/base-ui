import React, { useState, useEffect, useMemo } from 'react';
import { X, UserPlus, CloudUpload, Search, Mail, Loader2 } from 'lucide-react';
import { useAddTenantUser, useWorkspaces, useAssignUserToWorkspace } from '../../../hooks/useApi';
import { addOrUpdateAvatarService } from '../../../service/clientService';
import { useToast } from '../../common/Toast';
import { WorkspaceItem, WorkspaceAssignment } from './WorkspaceItem';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose }) => {
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
  const assignUserToWorkspaceMutation = useAssignUserToWorkspace();
  const workspacesQuery = useWorkspaces();
  const toast = useToast();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

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
      // Step 1: Create user
      const userPayload = {
        firstname: firstName.trim(),
        lastname: lastName.trim(),
        email: email.trim()
      };
      
      const userResult = await new Promise<any>((resolve, reject) => {
        addUser(userPayload, {
          onSuccess: (data) => resolve(data),
          onError: (error) => reject(error)
        });
      });

      const userId = userResult?.data?.id || userResult?.data?.user_id || userResult?.data?.data?.id;

      if (!userId) {
        throw new Error('Failed to get user ID from creation response');
      }

      // Step 2: Upload avatar if provided
      if (avatar && userId) {
        try {
          await addOrUpdateAvatarService(userId, avatar);
        } catch (avatarError) {
          console.error('Avatar upload failed:', avatarError);
          // Continue even if avatar upload fails
        }
      }

      // Step 3: Assign to workspaces
      const assignmentPromises: Promise<any>[] = [];

      for (const assignment of Object.values(workspaceAssignments)) {
        if (assignment.role === 'base_specific' && assignment.bases && assignment.bases.length > 0) {
          // For base-specific, assign with comma-separated base IDs
          const baseIds = assignment.bases.map(b => b.baseId).join(',');
          assignmentPromises.push(
            assignUserToWorkspaceMutation.mutateAsync({
              workspace_id: assignment.workspaceId,
              user_ids: [userId],
              access_level: 'limited_access', // Base-specific uses limited_access
              bases_ids: baseIds
            })
          );
        } else if (assignment.role === 'maintainer') {
          // Assign with limited_access to all bases
          assignmentPromises.push(
            assignUserToWorkspaceMutation.mutateAsync({
              workspace_id: assignment.workspaceId,
              user_ids: [userId],
              access_level: 'limited_access',
              bases_ids: '*' // All bases
            })
          );
        } else if (assignment.role === 'workspace-read') {
          // Assign with read-only (if API supports, otherwise use limited_access)
          assignmentPromises.push(
            assignUserToWorkspaceMutation.mutateAsync({
              workspace_id: assignment.workspaceId,
              user_ids: [userId],
              access_level: 'limited_access', // TODO: Update when API supports read_only
              bases_ids: '*'
            })
          );
        }
      }

      if (assignmentPromises.length > 0) {
        await Promise.all(assignmentPromises);
      }

            toast.success(`User ${firstName} ${lastName} added successfully`);

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
            const errorMsg = error?.response?.data?.message || error?.message || 'Failed to add user';
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
        className="bg-modal !max-w-7xl !p-0 flex flex-col max-h-[90vh]"
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
              <h2 className="text-xl font-semibold text-primary">Add Users</h2>
              <p className="text-sm text-secondary">Add users to collaborate on this project.</p>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - User Details */}
              <div className="space-y-4 bg-card p-4 lg:p-6">
                <h3 className="text-sm font-bold text-primary">User Details</h3>

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
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.email;
                            return newErrors;
                          });
                        }
                      }}
                      onBlur={() => {
                        if (email.trim() && !validateEmail(email)) {
                          setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
                        }
                      }}
              placeholder="Enter email address"
                      className={`w-full text-sm pl-10 pr-3 h-10 border rounded-lg text-primary focus:border-primary placeholder:text-gray-400 bg-card outline-none transition-all ${errors.email ? 'border-red-500' : 'border'
              }`}
            />
                  </div>
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

                {/* Co-owner Toggle */}
                <div className="flex items-center justify-start gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCoOwner(!isCoOwner)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isCoOwner ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${isCoOwner ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                  <label className="block text-sm font-medium text-gray-700">
                    Set as Co-owner
                  </label>
                </div>
              </div>

              {/* Right Column - Workspace/Base Selection */}
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
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
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
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {(isSubmitting || isAddingUser) ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
