import React, { useState, useEffect } from 'react';
import { X, Loader2, HelpCircle, Plus } from 'lucide-react';
import { useCreateWorkspace, useWorkspaces } from '../../hooks/useApi';
import { useToast } from '../common/Toast';
import { MultiLineText } from '../common/Fields';
import { validateWorkspaceName } from '../../utils/nameValidation';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  submitButtonText?: string;
  // Optional controlled props (when parent wants to manage fields)
  name?: string;
  setName?: (v: string) => void;
  description?: string;
  setDescription?: (v: string) => void;
  error?: string;
  // If provided, parent handles submit. Should return a Promise if async.
  onSubmit?: (e?: React.FormEvent) => Promise<void> | void;
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
}) => {
  const internalMutation = useCreateWorkspace();
  const { data: workspacesData } = useWorkspaces();
  const toast = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  const isControlled = typeof controlledName !== 'undefined' && typeof setControlledName === 'function';
  
  // Get existing workspaces for validation
  const existingWorkspaces = Array.isArray(workspacesData) ? workspacesData : [];

  useEffect(() => {
    if (isOpen) {
      if (!isControlled) {
        setName('');
        setDescription('');
        setError('');
        setValidationError('');
      } else {
        // when controlled, keep local fields in sync with controlled values
        setName(controlledName || '');
        setDescription(controlledDescription || '');
      }
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
      const validation = validateWorkspaceName(name, existingWorkspaces);
      setValidationError(validation.error || '');
    } else {
      setValidationError('');
    }
  }, [name, existingWorkspaces]);

  const submitting = internalMutation.isPending;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const title = isControlled ? (controlledName || '') : name;
    const desc = isControlled ? (controlledDescription || '') : description;

    if (!title.trim()) {
      if (isControlled) {
        controlledError && toast.error(controlledError);
      } else {
        setError('Workspace name is required');
      }
      return;
    }

    // Check for validation errors
    const validation = validateWorkspaceName(title, existingWorkspaces);
    if (!validation.isValid) {
      if (isControlled) {
        toast.error(validation.error || 'Invalid workspace name');
      } else {
        setError(validation.error || 'Invalid workspace name');
        setValidationError(validation.error || '');
      }
      return;
    }

    try {
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

      // clear local state only if uncontrolled
      if (!isControlled) {
        setName('');
        setDescription('');
        setError('');
        setValidationError('');
      }

      onClose();
      onSuccess?.();
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to create workspace';
      if (!isControlled) setError(errorMsg);
      toast.error(errorMsg);
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

  if (!isOpen) return null;

  return (
    <div
      className="bg-modal-backdrop relative"
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div
        className="bg-modal !max-w-3xl !p-0 flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[var(--color-bg-brand-primary)] rounded-full flex items-center justify-center flex-shrink-0">
              <Plus size={16} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-primary truncate">{title}</h2>
              <p className="text-sm text-secondary truncate">{title === 'Create Workspace' ? 'Start organizing your workspace' : 'Update workspace details'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={16} className="text-[var(--text-color-tertiary)]" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <form id="create-workspace-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="p-4 space-y-4">
          <div className="space-y-1">
            <label htmlFor="workspaceName" className="block text-sm font-medium text-[var(--text-color-tertiary)] mb-1">
              Workspace Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="workspaceName"
                type="text"
                value={isControlled ? (controlledName || '') : name}
                onChange={(e) => (isControlled ? setControlledName?.(e.target.value) : setName(e.target.value))}
                placeholder="Enter workspace name"
                className={`field-component field-component-border field-component-focus ${validationError || (!isControlled && error) || (isControlled && controlledError) ? 'border-red-500' : 'border'}`}
                required
                minLength={3}
                maxLength={50}
                autoFocus
              />
              <div className="absolute right-5 top-1/2 h-5 w-4 transform -translate-y-1/2 z-50">
                <span className="relative inline-block group">
                  <HelpCircle className={`w-4 h-4 ${validationError || ((!isControlled && error) || (isControlled && controlledError)) ? 'text-red-500' : ((isControlled ? (controlledName || '').trim().length >=3 : name.trim().length >=3) ? 'text-green-600' : 'text-gray-400')} cursor-help`} />
                  <div className="invisible group-hover:visible absolute left-0 mt-1 w-64 bg-card border rounded-xl shadow-lg p-3 text-sm z-50">
                    <h4 className="font-medium mb-2">Workspace name requirements:</h4>
                    <ul className="space-y-1">
                      <li className={`flex items-center ${(isControlled ? (controlledName || '').trim().length >= 3 : name.trim().length >= 3) ? 'text-green-600' : 'text-gray-500'}`}>
                        • Minimum 3 characters
                      </li>
                      <li className="flex items-center text-gray-500">
                        • Must be unique
                      </li>
                    </ul>
                  </div>
                </span>
              </div>
            </div>

            {(validationError || (!isControlled && error) || (isControlled && controlledError)) && (
              <div className="mt-1 text-sm text-red-600">
                <span>{validationError || (isControlled ? controlledError : error)}</span>
              </div>
            )}

            <p className="mt-1 text-xs text-gray-500">
              {(isControlled ? (controlledName || '') : name).length}/50 characters
            </p>
          </div>
          
          <MultiLineText
            label="Description"
            value={isControlled ? (controlledDescription || '') : description}
            onChange={(value) => (isControlled ? setControlledDescription?.(value) : setDescription(value))}
            placeholder="Enter workspace description"
            rows={5}
            isBorder={true}
          />

          </div>
        </form>

        {/* Footer - Fixed at Bottom */}
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
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            disabled={submitting || !!validationError || !(isControlled ? (controlledName || '').trim().length >= 3 : name.trim().length >= 3)}
            className="flex items-center gap-2 px-16 py-2 rounded-xl btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? (submitButtonText.includes('Save') ? 'Saving...' : 'Creating...') : submitButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};
