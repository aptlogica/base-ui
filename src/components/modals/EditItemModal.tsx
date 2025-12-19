import React, { useState, useEffect } from 'react';
import { SingleLineText } from '../common/Fields/SingleLineText';
import { MultiLineText } from '../common/Fields/MultiLineText';
import { X } from 'lucide-react';
import { validateTableName, validateViewName, validateBaseName, ExistingItem } from '../../utils/nameValidation';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string }) => void;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  initialName?: string;
  initialDescription?: string;
  itemType: 'table' | 'view' | 'base' | 'workspace';
  existingItems?: ExistingItem[];
  currentItemId?: string;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  subtitle,
  icon,
  initialName,
  initialDescription,
  itemType,
  existingItems = [],
  currentItemId,
}) => {
  // Ensure local state is always a string so calls to `trim()` are safe
  const [name, setName] = useState(initialName ?? '');
  const [description, setDescription] = useState(initialDescription ?? '');
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Use nullish coalescing to avoid setting `undefined` which would break `trim()`
      setName(initialName ?? '');
      setDescription(initialDescription ?? '');
      setError('');
      setValidationError('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialName, initialDescription]);

  // Real-time validation on name change
  useEffect(() => {
    if (isOpen && name.trim()) {
      let validation;
      switch (itemType) {
        case 'table':
          validation = validateTableName(name, existingItems, currentItemId);
          break;
        case 'view':
          validation = validateViewName(name, existingItems, currentItemId);
          break;
        case 'base':
          validation = validateBaseName(name, existingItems, currentItemId);
          break;
        default:
          validation = { isValid: true };
      }
      setValidationError(validation.error || '');
    } else {
      setValidationError('');
    }
  }, [name, existingItems, currentItemId, itemType, isOpen]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} name is required`);
      return;
    }

    // Validate name based on item type
    let validation;
    switch (itemType) {
      case 'table':
        validation = validateTableName(name.trim(), existingItems, currentItemId);
        break;
      case 'view':
        validation = validateViewName(name.trim(), existingItems, currentItemId);
        break;
      case 'base':
        validation = validateBaseName(name.trim(), existingItems, currentItemId);
        break;
      default:
        validation = { isValid: true };
    }

    if (!validation.isValid) {
      setError(validation.error || 'Invalid name');
      return;
    }

    setError('');
    setValidationError('');
    setIsSubmitting(true);

    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
      });
      // Close the modal on successful save
      onClose();
    } catch (err) {
      console.error(`Failed to save ${itemType}:`, err);
      setError(`Failed to update ${itemType}. Please try again.`);
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

  return (
    <div
      className="bg-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="bg-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 icon-primary rounded-xl flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">{title}</h2>
              <p className="text-sm text-secondary">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-primary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <SingleLineText
              label={`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Name`}
              value={name}
              onChange={setName}
              placeholder={`Enter ${itemType} name...`}
              required
              isBorder={true}
            />
            {(error || validationError) && (
              <div className="text-sm mt-2 flex items-center gap-1 text-[var(--text-color-error-primary)]">
                <div className="w-1 h-1 rounded-full bg-[var(--text-color-error-primary)]"></div>
                {error || validationError}
              </div>
            )}
          </div>
          <MultiLineText
            label="Description"
            placeholder={`Describe what this ${itemType} is for...`}
            value={description}
            onChange={value => setDescription(value)}
            rows={5}
            isBorder={true}
          />
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !!validationError}
              className="px-6 py-2 rounded-xl btn-primary text-white font-medium focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 