import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, FileText } from 'lucide-react';
import { useImportTable } from '../../hooks/useApi';
import { useToast } from '../common/Toast';

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
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  excel: {
    label: 'Excel',
    accept: '.xlsx,.xls',
    mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  sql: {
    label: 'SQL',
    accept: '.sql',
    mimeTypes: ['application/sql', 'text/sql'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  json: {
    label: 'JSON',
    accept: '.json',
    mimeTypes: ['application/json'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  airtable: {
    label: 'Airtable',
    accept: '.csv,.json',
    mimeTypes: ['text/csv', 'application/json'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  nocodb: {
    label: 'NocoDB',
    accept: '.csv,.json',
    mimeTypes: ['text/csv', 'application/json'],
    maxSize: 10 * 1024 * 1024, // 10MB
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportTable();
  const toast = useToast();
  const config = IMPORT_CONFIG[importType];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setUploadProgress(0);
      setError(null);
      setIsDragOver(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > config.maxSize) {
      return `File size exceeds ${formatFileSize(config.maxSize)}. Please select a smaller file.`;
    }

    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedExtensions = config.accept.split(',').map(ext => ext.trim().toLowerCase());

    if (!acceptedExtensions.some(ext => fileExtension === ext)) {
      return `Invalid file type. Please select a ${config.label} file (${config.accept}).`;
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Auto-generate title from filename if title is empty
    if (!title.trim()) {
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setTitle(fileNameWithoutExt);
    }
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleSubmit = async () => {
    // Prevent multiple submissions
    if (isSubmitting || importMutation.isPending) {
      return;
    }

    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Table title is required');
      return;
    }

    if (!selectedFile) {
      setError('Please select a file to import');
      return;
    }

    if (!workspaceId) {
      setError('Workspace ID is required');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    // Calculate order_index based on existing tables
    const order_index = Array.isArray(existingTables) ? existingTables.length : 0;

    try {
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
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-modal min-h-[500px] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 icon-primary rounded-xl flex items-center justify-center">
              <Upload size={16} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">Import {config.label}</h2>
              <p className="text-sm text-secondary">Upload your {config.label} file to create a new table</p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 px-1">
          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Select File <span className="text-red-500">*</span>
            </label>
            <div
              className={`border border-dashed rounded-xl p-6 text-center transition-colors ${isDragOver
                ? 'border-[var(--color-bg-brand-primary)] bg-[var(--color-bg-brand-primary)]/10'
                : 'border-gray-300 hover:border-gray-400'
                } ${selectedFile ? 'bg-green-50 border-green-300' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={config.accept}
                onChange={handleFileInputChange}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText size={32} className="text-green-600" />
                  <div className="text-sm font-medium text-primary">{selectedFile.name}</div>
                  <div className="text-xs text-secondary">{formatFileSize(selectedFile.size)}</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-800 hover:underline mt-1"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload size={32} className="text-gray-400" />
                  <div className="text-sm text-primary">
                    Drop your document here or <span className="hover:underline cursor-pointer text-[var(--color-bg-brand-primary)]">browse files</span>
                  </div>
                  <div className="text-xs text-secondary">
                    {config.label} file (max {formatFileSize(config.maxSize)})
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Table Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter table title"
              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--color-bg-brand-primary)] text-primary bg-background"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter table description"
              rows={3}
              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--color-bg-brand-primary)] text-primary bg-background resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
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
                  className="bg-[var(--color-bg-brand-primary)] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress > 0 ? uploadProgress : 10}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 mt-4 flex-shrink-0 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={importMutation.isPending || isSubmitting}
            className="px-4 py-2 rounded-xl border hover:bg-gray-50 transition-all disabled:opacity-50 text-[var(--text-color-tertiary)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={importMutation.isPending || isSubmitting || !title.trim() || !selectedFile}
            className="flex items-center gap-2 px-6 py-2 btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(importMutation.isPending || isSubmitting) && <Loader2 size={16} className="animate-spin" />}
            {(importMutation.isPending || isSubmitting) ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

