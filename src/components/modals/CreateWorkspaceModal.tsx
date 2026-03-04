import React, { useState, useEffect } from 'react';
import { X, Loader2, HelpCircle, Plus } from 'lucide-react';
import { useCreateWorkspace, useWorkspaces, useDeleteWorkspace } from '../../hooks/useApi';
import { useToast } from '../common/Toast';
import { MultiLineText } from '../common/Fields';
import { validateWorkspaceName } from '../../utils/nameValidation';
import { useNavigationActions } from '../../hooks/useNavigationActions';
import { useWorkspaceAccess } from '../../hooks/useWorkspaceAccess';
import { DeleteWorkspaceModal } from './DeleteWorkspaceModal';

const getControlState = (
  controlledName: string | undefined,
  setControlledName: ((v: string) => void) | undefined,
  controlledDescription: string | undefined,
  name: string,
  description: string
) => {
  const isControlled = controlledName !== undefined
    && setControlledName !== undefined
    && typeof setControlledName === 'function';

  return {
    isControlled,
    effectiveName: isControlled ? (controlledName || '') : name,
    effectiveDescription: isControlled ? (controlledDescription || '') : description,
  };
};

const getNameState = (
  effectiveName: string,
  validationError: string,
  error: string,
  controlledError: string | undefined,
  isControlled: boolean,
  submitting: boolean
) => {
  const trimmedName = effectiveName.trim();
  const nameLength = trimmedName.length;
  const hasNameError = !!(validationError || (!isControlled && error) || (isControlled && controlledError));
  const nameErrorText = validationError || (isControlled ? controlledError : error) || '';
  const isSubmitDisabled = submitting || !!validationError || nameLength < 3;

  return {
    nameLength,
    hasNameError,
    nameErrorText,
    isSubmitDisabled,
  };
};

const getHeaderSubtitle = (title: string) => (
  title === 'Create Workspace'
    ? 'Start organizing your workspace'
    : 'Update workspace details'
);

const getShowInformationTab = (isEditMode: boolean, activeTab: 'information' | 'dangerzone') => (
  !isEditMode || activeTab === 'information'
);

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  submitButtonText?: string;
  name?: string;
  setName?: (v: string) => void;
  description?: string;
  setDescription?: (v: string) => void;
  error?: string;
  onSubmit?: (e?: React.SyntheticEvent<HTMLFormElement>) => Promise<void> | void;
  // For edit mode: pass the current workspace ID to exclude it from duplicate validation
  currentWorkspaceId?: string;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Create Workspace',
  submitButtonText = 'Create Workspace',
  name: controlledName,
  setName: setControlledName,
  description: controlledDescription,
  setDescription: setControlledDescription,
  error: controlledError,
  onSubmit: controlledSubmit,
  currentWorkspaceId,
}) => {
  const internalMutation = useCreateWorkspace();
  const deleteWorkspaceMutation = useDeleteWorkspace();
  const { data: workspacesData } = useWorkspaces();
  const toast = useToast();
  const { handleWorkspaceDeletion } = useNavigationActions();
  const { canDeleteWorkspace } = useWorkspaceAccess(currentWorkspaceId || '');
  const submitting = internalMutation.isPending;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [activeTab, setActiveTab] = useState<'information' | 'dangerzone'>('information');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditMode = !!currentWorkspaceId;
  const canDelete = canDeleteWorkspace();
  const { isControlled, effectiveName, effectiveDescription } = getControlState(
    controlledName,
    setControlledName,
    controlledDescription,
    name,
    description
  );
  const { nameLength, hasNameError, nameErrorText, isSubmitDisabled } = getNameState(
    effectiveName,
    validationError,
    error,
    controlledError,
    isControlled,
    submitting
  );
  const headerSubtitle = getHeaderSubtitle(title);
  const showInformationTab = getShowInformationTab(isEditMode, activeTab);

  // Get existing workspaces for validation
  const existingWorkspaces = Array.isArray(workspacesData) ? workspacesData : [];
  const currentWorkspace = existingWorkspaces.find((ws: any) => ws.id === currentWorkspaceId);

  useEffect(() => {
    if (isOpen) {
      if (isControlled) {
        // when controlled, keep local fields in sync with controlled values
        setName(controlledName || '');
        setDescription(controlledDescription || '');
      } else {
        setName('');
        setDescription('');
        setError('');
        setValidationError('');
      }
      // Reset to information tab when modal opens
      setActiveTab('information');
      setShowDeleteConfirm(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isControlled) {
      setName(controlledName || '');
      setDescription(controlledDescription || '');
    }
  }, [controlledName, controlledDescription, isControlled]);

  // Validate name on change
  useEffect(() => {
    if (name.trim()) {
      const validation = validateWorkspaceName(name, existingWorkspaces, currentWorkspaceId);
      setValidationError(validation.error || '');
    } else {
      setValidationError('');
    }
  }, [name, existingWorkspaces, currentWorkspaceId]);


  // Get form values - extracted to reduce complexity
  const getFormValues = () => {
    return {
      title: effectiveName,
      description: effectiveDescription,
    };
  };

  // Handle empty title error - extracted to reduce complexity
  const handleEmptyTitleError = (): boolean => {
    const { title } = getFormValues();
    if (!title.trim()) {
      if (isControlled) {
        controlledError && toast.error(controlledError);
      } else {
        setError('Workspace name is required');
      }
      return true;
    }
    return false;
  };

  // Handle validation error - extracted to reduce complexity
  const handleValidationError = (validation: { isValid: boolean; error?: string }): boolean => {
    if (!validation.isValid) {
      if (isControlled) {
        toast.error(validation.error || 'Invalid workspace name');
      } else {
        setError(validation.error || 'Invalid workspace name');
        setValidationError(validation.error || '');
      }
      return true;
    }
    return false;
  };

  // Clear uncontrolled state - extracted to reduce complexity
  const clearUncontrolledState = () => {
    if (!isControlled) {
      setName('');
      setDescription('');
      setError('');
      setValidationError('');
    }
  };

  // Submit workspace - extracted to reduce complexity
  const submitWorkspace = async (e: React.SyntheticEvent<HTMLFormElement> | undefined, title: string, desc: string) => {
    if (controlledSubmit) {
      await controlledSubmit(e);
    } else {
      await internalMutation.mutateAsync({
        workspace: {
          title: title.trim(),
          description: desc.trim(),
        },
      });
      toast.success('Workspace created successfully');
    }
  };

  // Handle submission error - extracted to reduce complexity
  const handleSubmissionError = (err: any) => {
    const errorMsg = err?.message || 'Failed to create workspace';
    if (!isControlled) setError(errorMsg);
    toast.error(errorMsg);
  };

  // Handle successful submission - extracted to reduce complexity
  const handleSuccessfulSubmission = () => {
    clearUncontrolledState();
    onClose();
    onSuccess?.();
  };

  const handleSubmit = async (e?: React.SyntheticEvent<HTMLFormElement>) => {
    e?.preventDefault();

    const { title, description: desc } = getFormValues();

    if (handleEmptyTitleError()) {
      return;
    }

    const validation = validateWorkspaceName(title, existingWorkspaces, currentWorkspaceId);
    if (handleValidationError(validation)) {
      return;
    }

    try {
      await submitWorkspace(e, title, desc);
      handleSuccessfulSubmission();
    } catch (err: any) {
      handleSubmissionError(err);
    }
  };

  const handleConfirmDelete = async (wsId: string) => {
    try {
      await deleteWorkspaceMutation.mutateAsync(wsId);

      // Use the navigation handler to properly clean up localStorage and navigate
      handleWorkspaceDeletion(wsId);

      toast.success('Workspace deleted successfully');
      setShowDeleteConfirm(false);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      console.error('Failed to delete workspace:', err);
      toast.error(err?.message || 'Failed to delete workspace. Please try again.');
      throw err; // Re-throw so modal can handle it
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      void handleSubmit(e as any);
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Get button text based on submitting state - extracted to avoid nested ternary
  let buttonText: string;
  if (submitting) {
    buttonText = submitButtonText.includes('Save') ? 'Saving...' : 'Creating...';
  } else {
    buttonText = submitButtonText;
  }

  // Get help icon color class based on validation state - extracted to avoid nested ternary
  const getHelpIconColorClass = (): string => {
    if (hasNameError) {
      return 'text-red-500';
    }
    if (nameLength >= 3) {
      return 'text-green-600';
    }
    return 'text-gray-400';
  };

  // Get list item color class based on name length - extracted to avoid nested ternary
  const getListItemColorClass = (): string => (nameLength >= 3 ? 'text-green-600' : 'text-gray-500');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    if (isControlled) {
      setControlledName?.(nextValue);
    } else {
      setName(nextValue);
    }
  };

  const handleDescriptionChange = (value: string) => {
    if (isControlled) {
      setControlledDescription?.(value);
    } else {
      setDescription(value);
    }
  };

  const getTabButtonClassName = (tab: 'information' | 'dangerzone') => {
    if (tab === 'information') {
      return activeTab === 'information'
        ? 'border-[var(--color-brand-600)] text-[var(--color-brand-600)]'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    }

    return activeTab === 'dangerzone'
      ? 'border-red-500 text-red-500'
      : 'border-transparent text-gray-500 hover:text-red-500 hover:border-red-500';
  };

  if (!isOpen) return null;

  return (
    <>
      <div //NOSONAR
        className="bg-modal-backdrop relative"
        onKeyDown={handleKeyDown}
      >
        <button
          type="button"
          aria-label="Close modal"
          className="absolute inset-0"
          onClick={onClose}
        />
        <div //NOSONAR
          className="bg-modal !max-w-3xl min-h-[80vh] !p-0 flex flex-col relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-[var(--color-bg-brand-primary)] rounded-full flex items-center justify-center flex-shrink-0">
                <Plus className="text-green-600 h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-primary truncate">{title}</h2>
                <p className="text-sm text-secondary truncate">{headerSubtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="text-[var(--text-color-tertiary)] h-5 w-5" />
            </button>
          </div>

          {/* Tabs - Only show in edit mode */}
          {isEditMode && (
            <div className="flex-shrink-0 bg-alpha-white border-b px-6">
              <nav className="flex space-x-8" aria-label="Workspace sections">
                <button
                  type="button"
                  onClick={() => setActiveTab('information')}
                  className={`
                    py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 relative
                    ${getTabButtonClassName('information')}
                  `}
                >
                  Information
                </button>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('dangerzone')}
                    className={`
                      py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 relative
                      ${getTabButtonClassName('dangerzone')}
                    `}
                  >
                    Danger Zone
                  </button>
                )}
              </nav>
            </div>
          )}

          {/* Scrollable Content Area */}
          {showInformationTab ? (
            <form id="create-workspace-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
              <div className="p-4 space-y-4">
                <div className="space-y-1">
                  <label htmlFor="workspaceName" className="block text-sm font-medium text-primary mb-1">
                    Workspace Name <span className="field-component-required">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="workspaceName"
                      type="text"
                      value={effectiveName}
                      onChange={handleNameChange}
                      placeholder="Enter workspace name"
                      className={`field-component field-component-border field-component-focus ${hasNameError ? 'border-red-500' : 'border'}`}
                      required
                      minLength={3}
                      maxLength={50}
                      autoFocus
                    />
                    <div className="absolute right-5 top-1/2 h-5 w-4 transform -translate-y-1/2 z-50">
                      <span className="relative inline-block group">
                        <HelpCircle className={`w-4 h-4 ${getHelpIconColorClass()} cursor-help`} />
                        <div className="invisible group-hover:visible absolute right-0 mt-1 mr-2 w-64 bg-card border rounded-xl shadow-lg p-3 text-sm z-50">
                          <h4 className="font-medium text-primary mb-2">Workspace name requirements:</h4>
                          <ul className="space-y-1">
                            <li className={`flex items-center ${getListItemColorClass()}`}>
                              * Minimum 3 characters
                            </li>
                            <li className="flex items-center text-gray-500">
                              * Must be unique
                            </li>
                          </ul>
                        </div>
                      </span>
                    </div>
                  </div>

                  {hasNameError && (
                    <div className="mt-1 text-sm text-red-600">
                      <span>{nameErrorText}</span>
                    </div>
                  )}

                  <p className="mt-1 text-xs text-gray-500">
                    {effectiveName.length}/50 characters
                  </p>
                </div>

                <MultiLineText
                  label="Description"
                  value={effectiveDescription}
                  onChange={handleDescriptionChange}
                  placeholder="Enter workspace description"
                  rows={5}
                  isBorder={true}
                />

              </div>
            </form>
          ) : (
            /* Danger Tab Content */
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
              <div className="p-6 space-y-6">
                <h2 className="text-lg text-gray-900 mb-4">Danger Zone</h2>
                {canDelete && (
                  <div className="flex items-center justify-between p-4 rounded-xl border border-red-400">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">Delete this workspace and all it's contents.</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        This will permanently remove the workspace and all its contents. This action cannot be undone.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Delete Workspace
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer - Fixed at Bottom */}
          {showInformationTab ? (
            <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-16 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-workspace-form"
                disabled={isSubmitDisabled}
                className="flex items-center gap-2 px-16 py-2 rounded-xl btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {submitting && <Loader2 className="animate-spin h-5 w-5" />}
                {buttonText}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-16 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all text-gray-700"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Workspace Confirmation Modal */}
      {currentWorkspaceId && currentWorkspace && (
        <DeleteWorkspaceModal
          isOpen={showDeleteConfirm}
          workspace={{ id: currentWorkspaceId, title: currentWorkspace.title || currentWorkspace.name || '', name: currentWorkspace.title || currentWorkspace.name || '' }}
          onClose={() => {
            setShowDeleteConfirm(false);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
};
