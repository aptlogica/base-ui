// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
/* eslint-disable sonarjs/cognitive-complexity */
import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, FileText } from 'lucide-react';
import { useToast } from '../common/Toast';
import { validateTableName } from '../../utils/nameValidation';
import type { ImportColumnMapping, ImportPreview, ImportPayload } from './importer/ImportTypes';
import { ImportColumnMapper } from './importer/ImportColumnMapper';
import { ImportDataPreviewGrid } from './importer/ImportDataPreviewGrid';
import { ImportCleanupOptions } from './importer/ImportCleanupOptions';
import type { ImportCleanupOptionsState } from './importer/ImportCleanupOptions';
import { buildImportPreview, buildInitialMappings } from './importer/importPreviewBuilder';
import { getImportFieldMeta, normalizeImportFieldType } from './importer/importFieldConfig';
import { useImportData } from '../../hooks/useApi';
import { useLocation, useNavigate } from 'react-router-dom';

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
    maxSize: 2 * 1024 * 1024, // 2MB
  },
  excel: {
    label: 'Excel',
    accept: '.xlsx,.xls',
    mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
    maxSize: 2 * 1024 * 1024, // 2MB
  },
  sql: {
    label: 'SQL',
    accept: '.sql',
    mimeTypes: ['application/sql', 'text/sql'],
    maxSize: 2 * 1024 * 1024, // 2MB
  },
  json: {
    label: 'JSON',
    accept: '.json',
    mimeTypes: ['application/json'],
    maxSize: 2 * 1024 * 1024, // 2MB
  },
  airtable: {
    label: 'Airtable',
    accept: '.csv,.json',
    mimeTypes: ['text/csv', 'application/json'],
    maxSize: 2 * 1024 * 1024, // 2MB
  },
  nocodb: {
    label: 'NocoDB',
    accept: '.csv,.json',
    mimeTypes: ['text/csv', 'application/json'],
    maxSize: 2 * 1024 * 1024, // 2MB
  },
};

const getFileUploadStateClass = (isDragOver: boolean, fileError: string | null, selectedFile: File | null) => {
  if (isDragOver) {
    return 'border-brand-500 bg-brand-500/10';
  }
  if (fileError) {
    return 'border-red-400 hover:border-red-500 bg-red-50/30';
  }
  if (selectedFile) {
    return 'border-green-400 hover:border-green-500';
  }
  return 'border-gray-300 hover:border-gray-400 bg-gray-50/50';
};

type ImportUiStep = 'select' | 'review';

const normalizeDefaultValue = (fieldType: string, value: string): string => {
  const normalizedType = normalizeImportFieldType(fieldType);

  if (normalizedType === 'boolean') {
    return value === 'true' || value === '1' || value.toLowerCase() === 'yes' ? 'true' : 'false';
  }

  if (normalizedType === 'rating') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? String(Math.max(0, Math.min(parsed, 5))) : '0';
  }

  return value;
};

const buildFieldMeta = (fieldType: string, defaultValue: string): Record<string, unknown> => {
  const normalizedType = normalizeImportFieldType(fieldType);
  const baseMeta = { ...getImportFieldMeta(normalizedType) };

  if (normalizedType === 'boolean') {
    return {
      ...baseMeta,
      defaultValue: defaultValue === 'true',
    };
  }

  if (normalizedType === 'rating') {
    const parsed = Number.parseInt(defaultValue, 10);
    return {
      ...baseMeta,
      ratingDefault: Number.isFinite(parsed) ? Math.max(0, Math.min(parsed, 5)) : 0,
    };
  }

  // Add default value to meta for all other field types
  if (defaultValue) {
    return {
      ...baseMeta,
      defaultValue,
    };
  }

  return baseMeta;
};

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  importType,
  baseId: _baseId,
  workspaceId,
  existingTables = [],
}) => {
  const [uiStep, setUiStep] = useState<ImportUiStep>('select');
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isBuildingPreview, setIsBuildingPreview] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mappings, setMappings] = useState<Record<string, ImportColumnMapping>>({});
  const [primaryKey, setPrimaryKey] = useState<string | null>(null);
  const [primaryColumnError, setPrimaryColumnError] = useState<string | null>(null);
  const [cleanupOptions, setCleanupOptions] = useState<ImportCleanupOptionsState>({
    removeDuplicateRecords: false,
    trimExtraSpaces: false,
    removeEmptyRows: false,
  });
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);
  const toast = useToast();
  const config = IMPORT_CONFIG[importType];
  const importTableMutation = useImportData();
  const isImporting = isSubmitting || importTableMutation.isPending;
  const navigate = useNavigate();
  const location = useLocation();

  const getImportBody = (res: any) => {
    if (!res) return null;
    if (res?.data?.data && typeof res.data.data === 'object') {
      return res.data.data;
    }
    if (res?.data && typeof res.data === 'object') {
      return res.data;
    }
    return res;
  };

  const buildTableRouteFromImport = (body: any) => {
    const model = body?.model;
    const firstViewId = body?.views?.[0]?.id;
    if (!model?.workspace_id || !model?.base_id || !model?.id || !firstViewId) return null;
    return `/workspace/${model.workspace_id}/base/${model.base_id}/table/${model.id}/${firstViewId}`;
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setUiStep('select');
      setTitle('');
      setSelectedFile(null);
      setError(null);
      setFileError(null);
      setTitleError(null);
      setIsDragOver(false);
      setIsBuildingPreview(false);
      setPreview(null);
      setMappings({});
      setUploadProgress(0);
      setIsSubmitting(false);
      setPrimaryKey(null);
      setPrimaryColumnError(null);
      isSubmittingRef.current = false;
      setCleanupOptions({
        removeDuplicateRecords: false,
        trimExtraSpaces: false,
        removeEmptyRows: false,
      });
    }
  }, [isOpen]);

  const buildImportPayload = (): ImportPayload => {
    const includedColumns = preview?.columns.filter((column) => mappings[column.key]?.include !== false) || [];

    return {
      settings: {
        remove_duplicate_records: cleanupOptions.removeDuplicateRecords,
        trim_extra_spaces: cleanupOptions.trimExtraSpaces,
        remove_empty_rows: cleanupOptions.removeEmptyRows,
      },
      columns: includedColumns.map((column) => {
        const mapping = mappings[column.key];
        const fieldType = normalizeImportFieldType(mapping?.fieldType || 'text');
        return {
          column_name: column.label,
          title: mapping?.sourceName || column.label,
          uidt: fieldType,
          meta: buildFieldMeta(fieldType, normalizeDefaultValue(fieldType, mapping?.defaultValue || '')),
        };
      }),
    };
  };

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

  const deriveTitleFromFileName = (fileName: string) => {
    const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    const trimmed = fileNameWithoutExt.trim();
    // Keep consistent with validateTableName() limit.
    const capped = trimmed.length > 50 ? trimmed.slice(0, 45) : trimmed;
    return { original: trimmed, capped };
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setFileError(validationError);
      setSelectedFile(null);
      setUiStep('select');
      return;
    }

    setFileError(null);
    setSelectedFile(file);
    setUiStep('select');
    setPreview(null);
    setMappings({});

    // Auto-generate title from filename
    const { capped } = deriveTitleFromFileName(file.name);
    setTitle(capped);

    // Validate immediately so long/duplicate names can't bypass UI validation.
    const nextError = validateTitle(capped);
    setTitleError(nextError);

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

    const includedColumnCount = Object.values(mappings).filter((mapping) => mapping.include !== false).length;
    if (includedColumnCount === 0) {
      setError('Please include at least one column before confirming.');
      return;
    }

    if (primaryKey) {
      const primaryPreviewColumn = preview?.columns.find((column) => column.label === primaryKey);
      const primaryMapping = primaryPreviewColumn ? mappings[primaryPreviewColumn.key] : null;
      const primaryDefaultValue = String(primaryMapping?.defaultValue || '').trim();

      if (!primaryPreviewColumn || primaryMapping?.include === false) {
        setPrimaryColumnError('Primary column must be included.');
        setError('Primary column must be included before confirming import.');
        return;
      }

      if (!primaryDefaultValue) {
        setPrimaryColumnError('Primary column cannot be empty.');
        setError('Primary column cannot be empty.');
        return;
      }
    }

    try {
      const payload = buildImportPayload();
      setPrimaryColumnError(null);
      if (isSubmittingRef.current || isSubmitting || importTableMutation.isPending) {
        return;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setUploadProgress(0);

      const order_index = Array.isArray(existingTables) ? existingTables.length : 0;

      const resp = await importTableMutation.mutateAsync({
        ...(_baseId ? { base_id: _baseId } : {}),
        workspace_id: workspaceId,
        // title: title.trim(),
        // description: description.trim(),
        order_index,
        file: selectedFile,
        config: payload,
        primary_column: primaryKey || '',
        onProgress: (progressEvent: ProgressEvent) => {
          if (progressEvent.total && progressEvent.total > 0) {
            const percent = Math.min(
              99,
              Math.round((progressEvent.loaded * 100) / progressEvent.total)
            );
            setUploadProgress(percent);
          } else if (progressEvent.loaded > 0) {
            setUploadProgress(Math.min(50, Math.round(progressEvent.loaded / 1000)));
          }
        },
      } as any);

      setUploadProgress(100);

      const body = getImportBody(resp);
      const importStats = body?.import_stats ?? {};
      const targetRoute = buildTableRouteFromImport(body);

      const importSummary = {
        totalRows: Number(importStats.total_rows ?? preview?.totalRows ?? preview?.rows?.length ?? 0),
        columns: Number(importStats.total_columns ?? payload.columns.length),
        tableTitle: body?.model?.title || title.trim(),
        errorRows: Number(importStats.error_rows ?? 0),
        emptyRows: Number(importStats.empty_rows ?? 0),
        duplicateRows: Number(importStats.duplicate_rows ?? 0),
        emptyRowsSkipped: Number(importStats.empty_rows_skipped ?? 0),
        duplicatesRemoved: Number(importStats.duplicates_removed ?? 0),
        errorRowsFilePath: String(importStats.error_rows_file_path || ''),
        errorRowsFileContent: String(importStats.error_rows_file_content || ''),
      };

      onClose();
      onSuccess?.();

      const currentState = (location.state) || {};
      const nextState = { ...currentState, importSummary };

      if (targetRoute) {
        navigate(targetRoute, { state: nextState });
      } else {
        // Keep user on current route but still surface success summary.
        navigate(location.pathname, { replace: true, state: nextState });
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to generate import payload';
      setError(errorMessage);
      toast.error(errorMessage);
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleBack = () => {
    setUiStep('select');
    setPrimaryColumnError(null);
    setError(null);
  }

  if (!isOpen) return null;

  const fileUploadStateClass = getFileUploadStateClass(isDragOver, fileError, selectedFile);

  return (
    <div // NOSONAR
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/[0.169] backdrop-blur-sm transition-all duration-200 p-4"
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={() => {
          if (isImporting) return;
          onClose();
        }}
      />
      <div // NOSONAR
        className="bg-[var(--color-card)] border border-[var(--color-border-primary)] rounded-xl shadow-2xl max-w-[94vw] max-h-[94vh] flex flex-col relative overflow-hidden transform transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-brand-100 text-brand-800 rounded-xl flex items-center justify-center flex-shrink-0">
              <Upload className="text-green-600 h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-primary truncate">
                {uiStep === 'review'
                  ? 'Review and clean your data'
                  : `Import ${config.label}`}
              </h2>
              <p className="text-sm text-secondary truncate">
                {uiStep === 'review'
                  ? 'Check your data preview, choose which columns to import, and fix any columns before continuing.'
                  : `Upload your ${config.label} file to create a new table`}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isImporting) return;
              onClose();
            }}
            disabled={isImporting}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="text-gray-500 h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <form
          id="import-form"
          onSubmit={handleSubmit}
          className={`flex-1 min-w-full max-w-full flex flex-col min-h-0 ${uiStep === 'review'
              ? 'overflow-y-auto overflow-x-hidden lg:overflow-hidden'
              : 'overflow-y-auto overflow-x-hidden'
            }`}
        >
          <div className={uiStep === 'review' ? 'flex-1 grid grid-cols-1 gap-6 lg:gap-0 lg:min-h-0 lg:grid-cols-[44%_56%]' : 'p-4 space-y-4 overflow-y-auto overflow-x-hidden'}>
            {uiStep === 'review' ? (
              <>
                {/* Left: Column Mapping + Cleanup - independently scrollable */}
                <div className="p-6 relative z-10 bg-[var(--color-card)] lg:min-h-0 lg:overflow-y-auto lg:overflow-x-hidden lg:border-r">
                  <ImportCleanupOptions value={cleanupOptions} onChange={setCleanupOptions} />
                  {preview ? (
                    <ImportColumnMapper
                      preview={preview}
                      mappings={mappings}
                      primaryColumnError={primaryColumnError}
                      primaryKey={primaryKey}
                      onPrimaryKeyChange={(value) => {
                        setPrimaryKey(value);
                        setPrimaryColumnError(null);
                        setError(null);

                        // If the user picks an excluded column as primary, auto-include it.
                        if (!value) return;
                        const selected = preview.columns.find((column) => column.label === value);
                        if (!selected) return;
                        const wasExcluded = mappings[selected.key]?.include === false;
                        if (wasExcluded) {
                          setMappings((prev) => ({
                            ...prev,
                            [selected.key]: {
                              sourceName: prev[selected.key]?.sourceName || selected.key,
                              include: true,
                              fieldType: prev[selected.key]?.fieldType || 'text',
                              defaultValue: prev[selected.key]?.defaultValue || '',
                            },
                          }));
                        }
                      }}
                      onChange={(key, patch) => {
                        const matchingColumn = preview.columns.find((column) => column.key === key);
                        const shouldClearPrimaryError =
                          matchingColumn?.label === primaryKey &&
                          (
                            patch.include !== undefined ||
                            patch.defaultValue !== undefined
                          );

                        if (shouldClearPrimaryError) {
                          setPrimaryColumnError(null);
                          setError(null);
                        }

                        // If the primary column is excluded, clear primary selection to keep state consistent.
                        if (matchingColumn?.label === primaryKey && patch.include === false) {
                          setPrimaryKey(null);
                          setPrimaryColumnError('Primary column cannot be excluded.');
                          setError('Primary column cannot be excluded from import.');
                        }

                        setMappings((prev) => ({
                          ...prev,
                          [key]: {
                            sourceName: prev[key]?.sourceName || key,
                            include: prev[key]?.include ?? true,
                            fieldType: prev[key]?.fieldType || 'text',
                            defaultValue: prev[key]?.defaultValue || '',
                            ...patch,
                          },
                        }));
                      }}
                    />
                  ) : (
                    <div className="border rounded-xl bg-card p-4 text-sm text-secondary">Loading preview...</div>
                  )}
                </div>

                {/* Right: Preview - independently scrollable */}
                <div className="p-6 relative z-0 bg-[var(--color-card)] border-t lg:border-t-0 lg:min-h-0 lg:overflow-y-auto lg:overflow-x-hidden">
                  {preview ? (
                    <ImportDataPreviewGrid
                      preview={preview}
                      mappings={mappings}
                      removeDuplicateRecords={cleanupOptions.removeDuplicateRecords}
                      removeEmptyRows={cleanupOptions.removeEmptyRows}

                    />
                  ) : (
                    <div className="border rounded-xl bg-card p-4 text-sm text-secondary">Loading preview...</div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* File Upload Area */}
                <div className="space-y-1">
                  <label htmlFor="file-upload-input" className="block text-sm font-medium text-primary mb-1">
                    Select File <span className="text-brand-600">*</span>
                  </label>
                  <div //NOSONAR
                    id="file-upload-input"
                    className={`border-2 border-dashed rounded-xl p-8 min-w-[40vw] min-h-[40vh] flex items-center justify-center text-center transition-colors cursor-pointer ${fileUploadStateClass}`}
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
                        <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
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
                              setTitle('');
                            }
                          }}
                          className="text-xs text-red-600 hover:text-red-800 hover:underline mt-1 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-xl border flex items-center justify-center">
                          <Upload size={22} className="text-gray-400" />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xl text-primary">
                            Drop your document here or
                          </div>
                          <span className="text-[var(--color-blue-700)] text-xl hover:underline font-semibold">Browse files</span>
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
                {/* <div className="space-y-1">
                  <label htmlFor="tableTitle" className="field-component-label">
                    Table Title <span className="field-component-required">*</span>
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
                      className={`field-component field-component-border field-component-focus ${titleError ? 'border-red-500' : 'border-gray-200'}`}
                      required
                      minLength={3}
                      maxLength={50}
                      autoFocus
                    />
                    <div className="absolute right-7 top-1/2 h-5 w-4 transform -translate-y-1/2 z-50">
                      <span className="relative inline-block group">
                        <HelpCircle
                          className={`w-4 h-4 ${titleHelpIconClass} cursor-help`}
                        />
                        <div className="invisible group-hover:visible absolute right-0 mt-1 mr-2 w-64 bg-[var(--color-card)] border border-[var(--color-border-primary)] rounded-xl shadow-lg p-3 text-sm z-50">
                          <h4 className="font-medium text-foreground mb-2">Table title requirements:</h4>
                          <ul className="space-y-1">
                            <li className={`flex items-center ${title.trim().length >= 3 ? 'text-green-600' : 'text-gray-500'}`}>
                              • Minimum 3 characters
                            </li>
                            <li className={`flex items-center ${uniqueRequirementClass}`}>
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

                <MultiLineText
                  label="Description"
                  value={description}
                  onChange={setDescription}
                  placeholder="Enter table description"
                  rows={5}
                  isBorder={true}
                /> */}

                {/* Error Message - Only show if not related to file or title */}
                {error && !fileError && !titleError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    {error}
                  </div>
                )}
              </>
            )}
          </div>
        </form>

        {isImporting && (
          <div className="absolute inset-0 z-20 bg-black/5 backdrop-blur-[1px] cursor-wait" />
        )}

        {/* Footer - Fixed at Bottom */}
        {(
          <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0">
            {isImporting && (
              <div className="mr-auto min-w-[220px]">
                <div className="flex items-center justify-between text-xs text-secondary mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-brand-600 transition-all duration-200"
                    style={{ width: `${Math.max(0, Math.min(100, uploadProgress))}%` }}
                  />
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-16 py-2 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
            >
              Cancel
            </button>
            {uiStep === 'select' ? (
              <button
                type="button"
                disabled={
                  isBuildingPreview ||
                  !selectedFile
                }
                onClick={async () => {
                  if (!selectedFile) return;
                  setIsBuildingPreview(true);
                  setError(null);
                  try {
                    const p = await buildImportPreview(selectedFile);
                    setPreview(p);
                    const nextMappings: Record<string, ImportColumnMapping> = buildInitialMappings(p);
                    setMappings(nextMappings);
                    // Set first column as primary key by default (use label for actual CSV column name)
                    if (p.columns.length > 0) {
                      setPrimaryKey(p.columns[0].label);
                    }
                    setUiStep('review');
                  } catch (err: any) {
                    const msg = err?.message || 'Failed to read file preview';
                    setError(msg);
                    toast.error(msg);
                  } finally {
                    setIsBuildingPreview(false);
                  }
                }}
                className="flex items-center gap-2 px-16 py-2 rounded-xl bg-brand-600 text-black font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700 focus:ring-2 focus:ring-offset-2 focus:ring-brand-600"
              >
                {isBuildingPreview && <Loader2 className="animate-spin h-5 w-5" />}
                {isBuildingPreview ? 'Loading...' : 'Next'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isImporting}
                  className="px-10 py-2 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
                >
                  Back
                </button>
                <button
                  type="submit"
                  form="import-form"
                  disabled={isImporting}
                  className="flex items-center gap-2 px-16 py-2 rounded-xl bg-brand-600 text-black font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700 focus:ring-2 focus:ring-offset-2 focus:ring-brand-600"
                >
                  {isImporting && <Loader2 className="animate-spin h-5 w-5" />}
                  {isImporting ? 'Importing...' : 'Confirm'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
