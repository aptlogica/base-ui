import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, FileText, HelpCircle } from 'lucide-react';
import { useImportTable } from '../../hooks/useApi';
import { useToast } from '../common/Toast';
import { MultiLineText } from '../common/Fields/MultiLineText';
import { isNameDuplicate, validateTableName } from '../../utils/nameValidation';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  importType: 'csv' | 'excel' | 'sql' | 'json' | 'airtable' | 'nocodb';
  baseId?: string; // Optional: required from sidebar, optional from home page
  workspaceId: string;
  existingTables?: any[];
}

const IMPORT_CONFIG = {
  csv: {
    label: 'CSV',
    accept: '.csv',
    mimeTypes: ['text/csv', 'application/csv'],
    maxSize: 25 * 1024 * 1024, // 25MB
  },
  excel: {
    label: 'Excel',
    accept: '.xlsx,.xls',
    mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
    maxSize: 25 * 1024 * 1024, // 25MB
  },
  sql: {
    label: 'SQL',
    accept: '.sql',
    mimeTypes: ['application/sql', 'text/sql'],
    maxSize: 25 * 1024 * 1024, // 25MB
  },
  json: {
    label: 'JSON',
    accept: '.json',
    mimeTypes: ['application/json'],
    maxSize: 25 * 1024 * 1024, // 25MB
  },
  airtable: {
    label: 'Airtable',
    accept: '.csv,.json',
    mimeTypes: ['text/csv', 'application/json'],
    maxSize: 25 * 1024 * 1024, // 25MB
  },
  nocodb: {
    label: 'NocoDB',
    accept: '.csv,.json',
    mimeTypes: ['text/csv', 'application/json'],
    maxSize: 25 * 1024 * 1024, // 25MB
  },
};

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  importType,
  baseId,
  workspaceId,
  existingTables = [],
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false); // Ref to prevent race conditions
  const importMutation = useImportTable();
  const toast = useToast();
  const config = IMPORT_CONFIG[importType];

  const isTitleUnique = (titleToCheck: string): boolean => {
    const trimmedTitle = titleToCheck.trim();
    if (!trimmedTitle) return true;
    return !isNameDuplicate(trimmedTitle, existingTables);
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setUploadProgress(0);
      setError(null);
      setFileError(null);
      setTitleError(null);
      setIsDragOver(false);
      setIsSubmitting(false);
      isSubmittingRef.current = false; // Reset ref
    }
  }, [isOpen]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > config.maxSize) {
      return `File size exceeds ${formatFileSize(config.maxSize)}. Please select a smaller file.`;
    }

    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedExtensions = config.accept.split(',').map(ext => ext.trim().toLowerCase());

    if (!acceptedExtensions.includes(fileExtension)) {
      return `Please select a ${config.label} file (${config.accept}).`;
    }

    return null;
  };

  const validateTitle = (titleValue: string): string | null => {
    const result = validateTableName(titleValue, existingTables);
    if (result.isValid) return null;

    if (result.error === 'Table name is required') {
      return 'Table title is required';
    }
    if (result.error === 'Table name must be at least 3 characters') {
      return 'Table title must be at least 3 characters long';
    }
    if (result.error === 'Table name already exists') {
      return 'Table title must be unique. This title is already in use.';
    }

    return result.error || 'Invalid table title';
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setFileError(validationError);
      setSelectedFile(null);
      return;
    }

    setFileError(null);
    setSelectedFile(file);

    // Auto-generate title from filename
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    setTitle(fileNameWithoutExt);
    // Clear title error when file changes
    setTitleError(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleSubmit = async (e?: React.SyntheticEvent<HTMLFormElement>) => {
    e?.preventDefault();

    // Prevent multiple submissions using ref to avoid race conditions
    if (isSubmittingRef.current || isSubmitting || importMutation.isPending) {
      return;
    }

    setError(null);
    setFileError(null);
    setTitleError(null);

    // Validation
    if (!selectedFile) {
      setFileError('Please select a file to import');
      return;
    }

    if (!workspaceId) {
      setError('Workspace ID is required');
      return;
    }

    // Check title validation
    const titleValidationError = validateTitle(title);
    if (titleValidationError) {
      setTitleError(titleValidationError);
      return;
    }

    // Set both state and ref immediately to prevent race conditions
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setUploadProgress(0);

    // Calculate order_index based on existing tables
    const order_index = Array.isArray(existingTables) ? existingTables.length : 0;

    try {
      // Double-check mutation is not already in progress (safety check)
      if (importMutation.isPending) {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      await importMutation.mutateAsync({
        ...(baseId && { base_id: baseId }), // Only include base_id if provided
        workspace_id: workspaceId,
        title: title.trim(),
        description: description.trim(),
        order_index,
        file: selectedFile,
        onProgress: (progressEvent: ProgressEvent) => {
          // Handle progress calculation safely
          if (progressEvent.total && progressEvent.total > 0) {
            const percent = Math.min(
              99, // Cap at 99% during upload, 100% only when complete
              Math.round((progressEvent.loaded * 100) / progressEvent.total)
            );
            setUploadProgress(percent);
          } else if (progressEvent.loaded > 0) {
            // If total is unknown, show indeterminate progress
            setUploadProgress(Math.min(50, Math.round(progressEvent.loaded / 1000)));
          }
        },
      });

      // Set to 100% on completion
      setUploadProgress(100);

      toast.success(`${config.label} file imported successfully`);

      // Small delay to show 100% progress before closing
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 500);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to import file';
      setError(errorMessage);
      toast.error(errorMessage);
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false; // Reset ref
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div // NOSONAR
      className="bg-modal-backdrop relative"
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div // NOSONAR
        className="bg-modal min-h-[500px] max-h-[90vh] !p-0 flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 icon-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Upload size={16} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-primary truncate">Import {config.label}</h2>
              <p className="text-sm text-secondary truncate">Upload your {config.label} file to create a new table</p>
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
        <form id="import-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="p-4 space-y-4">
            {/* File Upload Area */}
            <div className="space-y-1">
              <label htmlFor="file-upload-input" className="block text-sm font-medium text-[var(--text-color-tertiary)] mb-1">
                Select File <span className="text-red-500">*</span>
              </label>
              <div
                id="file-upload-input"
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragOver
                  ? 'border-[var(--color-bg-brand-primary)] bg-[var(--color-bg-brand-primary)]/10'
                  : fileError ? 'border-red-400 hover:border-red-500 bg-red-50/30' : selectedFile ? 'border-green-400 hover:border-green-500' : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Click or drag and drop to upload file"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={config.accept}
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <FileText size={22} className="text-green-600" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-primary">{selectedFile.name}</div>
                      <div className="text-xs text-secondary">{formatFileSize(selectedFile.size)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="text-xs text-red-600 hover:text-red-800 hover:underline mt-1 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full border flex items-center justify-center">
                      <Upload size={22} className="text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-primary">
                        Drop your document here or
                      </div>
                      <span className="text-primary text-xl hover:underline font-semibold">Browse files</span>
                      <div className="text-xs text-secondary">
                      {config.label} file (max {formatFileSize(config.maxSize)})
                    </div>
                    </div>
                  </div>
                )}
              </div>
              {fileError && (
                <div className="mt-1 text-sm text-red-600">
                  <span>{fileError}</span>
                </div>
              )}
            </div>

            {/* Title Input */}
            <div className="space-y-1">
              <label htmlFor="tableTitle" className="block text-sm font-medium text-[var(--text-color-tertiary)] mb-1">
                Table Title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="tableTitle"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setTitle(newTitle);
                    // Real-time validation
                    const error = validateTitle(newTitle);
                    setTitleError(error);
                  }}
                  placeholder="Enter table title"
                  className={`field-component field-component-border field-component-focus ${titleError ? 'border-red-500' : 'border'}`}
                  required
                  minLength={3}
                  maxLength={50}
                  autoFocus
                />
                <div className="absolute right-5 top-1/2 h-5 w-4 transform -translate-y-1/2 z-50">
                  <span className="relative inline-block group">
                    <HelpCircle
                      className={`w-4 h-4 ${titleError ? 'text-red-500' : title.trim().length >= 3 && isTitleUnique(title) ? 'text-green-600' : 'text-gray-400'} cursor-help`}
                    />
                    <div className="invisible group-hover:visible absolute right-0 mt-1 mr-2 w-64 bg-card border rounded-xl shadow-lg p-3 text-sm z-50">
                      <h4 className="font-medium text-primary mb-2">Table title requirements:</h4>
                      <ul className="space-y-1">
                        <li className={`flex items-center ${title.trim().length >= 3 ? 'text-green-600' : 'text-gray-500'}`}>
                          • Minimum 3 characters
                        </li>
                        <li className={`flex items-center ${title.trim() && isTitleUnique(title) ? 'text-green-600' : title.trim() && !isTitleUnique(title) ? 'text-red-600' : 'text-gray-500'}`}>
                          • Must be unique
                        </li>
                      </ul>
                    </div>
                  </span>
                </div>
              </div>
              {titleError && (
                <div className="mt-1 text-sm text-red-600">
                  <span>{titleError}</span>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {title.length}/50 characters
              </p>
            </div>

            {/* Description Input */}
            <MultiLineText
              label="Description"
              value={description}
              onChange={setDescription}
              placeholder="Enter table description"
              rows={5}
              isBorder={true}
            />

            {/* Error Message - Only show if not related to file or title */}
            {error && !fileError && !titleError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Progress Bar */}
            {(importMutation.isPending || isSubmitting) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary">
                    {uploadProgress >= 100 ? 'Processing...' : 'Uploading...'}
                  </span>
                  <span className="text-primary font-medium">
                    {uploadProgress > 0 ? `${uploadProgress}%` : '0%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[var(--color-brand-500)] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress > 0 ? uploadProgress : 10}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer - Fixed at Bottom */}
        <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={importMutation.isPending || isSubmitting}
            className="px-16 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="import-form"
            disabled={importMutation.isPending || isSubmitting || !title.trim() || !selectedFile}
            className="flex items-center gap-2 px-16 py-2 rounded-xl btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(importMutation.isPending || isSubmitting) && <Loader2 size={16} className="animate-spin" />}
            {(importMutation.isPending || isSubmitting) ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

