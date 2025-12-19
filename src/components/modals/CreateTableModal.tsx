import React, { useState, useEffect } from 'react';
import { Table2, X, HelpCircle } from 'lucide-react';
import { SingleLineText } from '../common/Fields/SingleLineText';
import { MultiLineText } from '../common/Fields/MultiLineText';
import { validateTableName, getDefaultTableName } from '../../utils/nameValidation';
import { Loader } from '../ui/Loader';

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description: string }) => void;
  baseId: string;
  defaultName?: string;
  existingTables?: any[];
}

export const CreateTableModal: React.FC<CreateTableModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  baseId,
  defaultName = '',
  existingTables = [],
}) => {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const initialName = defaultName || getDefaultTableName(existingTables);
      setName(initialName);
      setDescription('');
      setError('');
      setValidationError('');
      setIsSubmitting(false);
    }
  }, [isOpen, defaultName, existingTables]);

  // Validate name on change
  useEffect(() => {
    if (name.trim()) {
      const validation = validateTableName(name, existingTables);
      setValidationError(validation.error || '');
    } else {
      setValidationError('');
    }
  }, [name, existingTables]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Table name is required');
      return;
    }

    // Check validation
    const validation = validateTableName(name, existingTables);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid table name');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await onCreate({ name: name.trim(), description: description.trim() });
    } catch (err) {
      setError('Failed to create table. Please try again.');
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
              <Table2 size={20} className="icon-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">Create Table</h2>
              <p className="text-sm text-secondary">Add a new table to your base</p>
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
            <label htmlFor="tableName" className="block text-sm font-medium text-[var(--text-color-tertiary)] mb-1">
              Table Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="tableName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter table name"
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
                  <div className="invisible group-hover:visible absolute left-0 mt-1 w-64 bg-card border rounded-xl shadow-lg p-3 text-sm z-50">
                    <h4 className="mb-2 text-primary">Table name requirements:</h4>
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
            value={description}
            onChange={value => setDescription(value)}
            placeholder="Enter table description"
            rows={5}
            isBorder={true}
          />
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-[var(--text-color-tertiary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || name.trim().length < 3}
              className="flex items-center gap-2 px-6 py-2 rounded-xl btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                'Create Table'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 