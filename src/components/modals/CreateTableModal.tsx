import React, { useState, useEffect } from 'react';
import { Table2, X, HelpCircle } from 'lucide-react';
import { MultiLineText } from '../common/Fields/MultiLineText';
import { validateTableName, getDefaultTableName } from '../../utils/nameValidation';

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

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e:React.SyntheticEvent<HTMLFormElement>) => {
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
      onCreate({ name: name.trim(), description: description.trim() });
    } catch (err: any) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as Error).message || 'Failed to create table. Please try again.');
      } else {
        setError('Failed to create table. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!isOpen) return null;

  return (
    <div
      className="bg-modal-backdrop relative"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div // NOSONAR
        className="bg-modal !max-w-3xl !p-0 flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 icon-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Table2 size={20} className="icon-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-primary truncate">Create Table</h2>
              <p className="text-sm text-secondary truncate">Add a new table to your base</p>
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
        <form id="create-table-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="p-4 space-y-4">
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
                className={`field-component field-component-border field-component-focus ${error || validationError ? 'border-red-500' : 'border'}`}
                required
                minLength={3}
                maxLength={50}
                autoFocus
              />
              <div className="absolute right-5 top-1/2 h-5 w-4 transform -translate-y-1/2 z-50">
                <span className="relative inline-block group">
                  <HelpCircle className={`w-4 h-4 ${
                    (() => {
                      if (validationError) return 'text-red-500';
                      if (name.trim().length >= 3) return 'text-green-600';
                      return 'text-gray-400';
                    })()
                  } cursor-help`} />
                  <div className="invisible group-hover:visible absolute right-0 mt-1 mr-2 w-64 bg-card border rounded-xl shadow-lg p-3 text-sm z-50">
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
          </div>
        </form>

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
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            disabled={isSubmitting || !name.trim() || name.trim().length < 3}
            className="flex items-center gap-2 px-16 py-2 rounded-xl btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </div>
  );
}; 
