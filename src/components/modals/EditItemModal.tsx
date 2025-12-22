import React, { useState, useEffect } from 'react';
import { MultiLineText } from '../common/Fields/MultiLineText';
import { X, HelpCircle, PencilLine } from 'lucide-react';
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
  icon: _icon, // Keep in props for backward compatibility but not used
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
            <div className="w-10 h-10 bg-[var(--color-bg-brand-primary)] rounded-full flex items-center justify-center flex-shrink-0">
              <PencilLine size={16} className="text-green-600" />
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
            <X size={16} className="text-[var(--text-color-tertiary)]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="itemName" className="block text-sm font-medium text-[var(--text-color-tertiary)] mb-1">
              {itemType.charAt(0).toUpperCase() + itemType.slice(1)} Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="itemName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Enter ${itemType} name`}
                className={`field-component field-component-border field-component-focus ${error || validationError ? 'border-red-500' : 'border-gray-300'}`}
                required
                minLength={3}
                maxLength={50}
                autoFocus
              />
              <div className="absolute right-5 top-1/2 h-5 w-4 transform -translate-y-1/2 z-50">
                <span className="relative inline-block group">
                  <HelpCircle className={`w-4 h-4 ${validationError ? 'text-red-500' : name.trim().length >= 3 ? 'text-green-600' : 'text-gray-400'
                    } cursor-help`} />
                  <div className="invisible group-hover:visible absolute left-0 mt-1 w-64 bg-white border rounded-xl shadow-lg p-3 text-sm z-50">
                    <h4 className="font-medium mb-2">{itemType.charAt(0).toUpperCase() + itemType.slice(1)} name requirements:</h4>
                    <ul className="space-y-1">
                      <li className={`flex items-center ${name.trim().length >= 3 ? 'text-green-600' : 'text-gray-500'}`}>
                        • Minimum 3 characters
                      </li>
                    </ul>
                  </div>
                </span>
              </div>
            </div>
            {/* Validation Error */}
            {(error || validationError) && (
              <div className="mt-1 text-sm text-red-600">
                <span>{validationError || error}</span>
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {name.length}/50 characters
            </p>
          </div>
          <MultiLineText
            label="Description"
            placeholder={`Enter ${itemType} description`}
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
              className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || name.trim().length < 3 || !!validationError}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 