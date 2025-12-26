import React, { useState, useEffect } from 'react';
import { X, Loader2, HelpCircle, Plus } from 'lucide-react';
import { useCreateWorkspace } from '../../hooks/useApi';
import { useToast } from '../common/Toast';
import { MultiLineText } from '../common/Fields';

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
  const toast = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const isControlled = typeof controlledName !== 'undefined' && typeof setControlledName === 'function';

  useEffect(() => {
    if (isOpen) {
      if (!isControlled) {
        setName('');
        setDescription('');
        setError('');
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
      className="bg-modal-backdrop"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-bg-brand-primary)] rounded-full flex items-center justify-center flex-shrink-0">
              <Plus size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">{title}</h2>
              <p className="text-sm text-secondary">{title === 'Create Workspace' ? 'Start organizing your workspace' : 'Update workspace details'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X size={16} className="text-[var(--text-color-tertiary)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                className={`field-component field-component-border field-component-focus ${(!isControlled && error) || (isControlled && controlledError) ? 'border-red-500' : 'border'}`}
                required
                minLength={3}
                maxLength={50}
                autoFocus
              />
              <div className="absolute right-5 top-1/2 h-5 w-4 transform -translate-y-1/2 z-50">
                <span className="relative inline-block group">
                  <HelpCircle className={`w-4 h-4 ${( (!isControlled && error) || (isControlled && controlledError) ) ? 'text-red-500' : ( (isControlled ? (controlledName || '').trim().length >=3 : name.trim().length >=3) ? 'text-green-600' : 'text-gray-400' )} cursor-help`} />
                  <div className="invisible group-hover:visible absolute left-0 mt-1 w-64 bg-card border rounded-xl shadow-lg p-3 text-sm z-50">
                    <h4 className="font-medium mb-2">Workspace name requirements:</h4>
                    <ul className="space-y-1">
                      <li className={`flex items-center ${(isControlled ? (controlledName || '').trim().length >= 3 : name.trim().length >= 3) ? 'text-green-600' : 'text-gray-500'}`}>
                        • Minimum 3 characters
                      </li>
                    </ul>
                  </div>
                </span>
              </div>
            </div>

            {((!isControlled && error) || (isControlled && controlledError)) && (
              <div className="mt-1 text-sm text-red-600">
                <span>{isControlled ? controlledError : error}</span>
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !(isControlled ? (controlledName || '').trim().length >= 3 : name.trim().length >= 3)}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? (submitButtonText.includes('Save') ? 'Saving...' : 'Creating...') : submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
