import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteBaseModalProps {
  isOpen: boolean;
  base: {
    id: string;
    title?: string;
    name?: string;
  } | null;
  onClose: () => void;
  onConfirm: (baseId: string) => Promise<void>;
}

export const DeleteBaseModal: React.FC<DeleteBaseModalProps> = ({
  isOpen,
  base,
  onClose,
  onConfirm,
}) => {
  const [baseNameToDelete, setBaseNameToDelete] = useState('');
  const [isDeletingBase, setIsDeletingBase] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const baseTitle = base?.title || base?.name || '';

  // Reset form when modal opens/closes or base changes
  useEffect(() => {
    if (isOpen && base) {
      setBaseNameToDelete('');
      setIsDeletingBase(false);
      setIsSubmitting(false);
    }
  }, [isOpen, base]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBaseNameToDelete(value);
    setIsDeletingBase(value === baseTitle);
  };

  const handleConfirm = async () => {
    if (!base || !isDeletingBase || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onConfirm(base.id);
      // Reset and close on success
      setBaseNameToDelete('');
      setIsDeletingBase(false);
      onClose();
    } catch (error) {
      // Error handling is done in parent component
      console.error('Error deleting base:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !base) return null;

  return (
    <div // NOSONAR
    className="bg-modal-backdrop relative" 
    onKeyDown={handleKeyDown}>
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="bg-modal !max-w-2xl !p-0 flex flex-col h-[60vh] max-h-[60vh] relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-primary truncate">Delete Base</h2>
              <p className="text-sm text-secondary truncate">Permanently delete this base and all its contents</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="p-4 space-y-4">
            <div className="bg-[var(--color-error-50)] border border-red-200 rounded-xl p-3">
              <p className="text-red-800 text-sm">
                <strong>Warning:</strong> All associated tables, views and data will be permanently deleted.
              </p>
            </div>

            <div>
              <p className="text-sm text-primary">
                <strong>Are you sure you want to proceed? This deletion cannot be reversed.</strong> Confirming this action will permanently delete the base <strong>&quot;{baseTitle}&quot;</strong> and all of its related contents.
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-700 mb-2">Please type <strong>{baseTitle}</strong> to confirm.</p>
              <input
                type="text"
                value={baseNameToDelete}
                onChange={handleInputChange}
                // onPaste={(e) => e.preventDefault()}
                placeholder="Enter base name"
                className="w-full text-sm px-3 h-10 border rounded-lg text-primary focus:border-primary placeholder:text-gray-400 bg-card outline-none transition-all"
                required
                minLength={3}
                maxLength={50}
                autoFocus
              />
            </div>
          </div>
        </div>

        {/* Footer - Fixed at Bottom */}
        <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-16 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isDeletingBase || isSubmitting}
            className="px-16 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 focus:ring-1 focus:ring-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Deleting...' : 'Delete Base'}
          </button>
        </div>
      </div>
    </div>
  );
};
