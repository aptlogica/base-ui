import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Download, Eye, Trash2, Check, X as XIcon, Loader2 } from 'lucide-react';
import { AttachmentFile } from '../../../../GridViewPlugin/types/grid.types';
import { useUpdateAssetById, useAddAttachment } from '../../../../../hooks/useApi';

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: any[]; // API format: array of objects with title, url, mime_type, size
  onChange: (value: any[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  model_id?: string;
  column_id?: string;
  row_id?: number;
  persistImmediately?: boolean; // Default: true (maintains backward compatibility)
}

export const AttachmentModal: React.FC<AttachmentModalProps> = ({
  isOpen,
  onClose,
  value,
  onChange,
  maxFiles = 10,
  maxFileSize = 5 * 1024 * 1024,
  model_id,
  column_id,
  row_id,
  persistImmediately = true // Default: upload immediately (backward compatible)
}) => {

  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<AttachmentFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API hooks
  const updateAssetMutation = useUpdateAssetById();
  const addAttachmentMutation = useAddAttachment();

  // Reset selected files when modal opens and cleanup blob URLs when closing
  useEffect(() => {
    if (isOpen) {
      setSelectedFiles([]);
      setError(null);
      setIsUploading(false);
    } else {
      // Cleanup blob URLs when modal closes
      selectedFiles.forEach(file => {
        if (file?.url?.startsWith('blob:')) {
          URL.revokeObjectURL(file.url);
        }
      });
    }
  }, [isOpen]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: any) => {
    const mimeType: string = file?.mime_type || file?.type || '';
    const fileName: string = (file?.name || file?.title || '').toLowerCase();
    const ext = fileName.includes('.') ? fileName.split('.').pop() : '';

    // Prefer mime when available
    if (mimeType.startsWith('application/pdf') || ext === 'pdf') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src="/assets/pdf.png"
            alt="PDF"
            className="w-1/2 h-1/2 object-contain"
          />
        </div>
      );
    }
    if (mimeType.includes('msword') || mimeType.includes('officedocument.word') || ext === 'doc' || ext === 'docx') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src="/assets/docx.png"
            alt="DOC"
            className="w-1/2 h-1/2 object-contain"
          />
        </div>
      );
    }
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || ext === 'xls' || ext === 'xlsx') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src="/assets/csv.png"
            alt="Excel"
            className="w-1/2 h-1/2 object-contain"
          />
        </div>
      );
    }
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation') || ext === 'ppt' || ext === 'pptx') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src="/assets/ppt.png"
            alt="PPT"
            className="w-1/2 h-1/2 object-contain"
          />
        </div>
      );
    }
    if (ext === 'csv') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src="/assets/csv.png"
            alt="CSV"
            className="w-1/2 h-1/2 object-contain"
          />
        </div>
      );
    }
    if (ext === 'txt') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src="/assets/txt.png"
            alt="TXT"
            className="w-1/2 h-1/2 object-contain"
          />
        </div>
      );
    }
    if (ext === 'zip' || ext === 'rar' || ext === '7z') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src="/assets/zip.png"
            alt="ZIP"
            className="w-1/2 h-1/2 object-contain"
          />
        </div>
      );
    }
    if (ext === 'exe') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src="/assets/exe-file.png"
            alt="EXE"
            className="w-1/2 h-1/2 object-contain"
          />
        </div>
      );
    }
    if (mimeType.startsWith('audio/') || ext === 'mp3' || ext === 'wav' || ext === 'flac' || ext === 'aac' || ext === 'mpeg') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src="/assets/audio.png"
            alt="Audio"
            className="w-1/2 h-1/2 object-contain"
          />
        </div>
      );
    }
    if (mimeType.startsWith('video/') || ext === 'mp4' || ext === 'avi' || ext === 'mov' || ext === 'wmv') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src="/assets/video.png"
            alt="Video"
            className="w-1/2 h-1/2 object-contain"
          />
        </div>
      );
    }
    if (ext === 'tiff' || ext === 'tif') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src="/assets/tiff.png"
            alt="TIFF"
            className="w-1/2 h-1/2 object-contain"
          />
        </div>
      );
    }

    // Fallback generic file icon
    return (
      <div className="w-full h-full flex items-center justify-center">
        <img
          src="/assets/file.png"
          alt="FILE"
          className="w-1/2 h-1/2 object-contain"
        />
      </div>
    );
  };


  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: AttachmentFile[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      if (file.size > maxFileSize) {
        errors.push(`${file.name} is too large (max ${formatFileSize(maxFileSize)})`);
        return;
      }

      const fileObj: AttachmentFile = {
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        size: file.size,
        file: file // Store the actual File object for API calls
      };

      newFiles.push(fileObj);
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    if (selectedFiles.length + newFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Add new files to selected files (not uploaded yet)
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setError(null);
  };

  const handleRemoveSelectedFile = (fileUrl: string) => {
    // Revoke blob URL to prevent memory leak
    const fileToRemove = selectedFiles.find(f => f.url === fileUrl);
    if (fileToRemove?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(fileToRemove.url);
    }
    setSelectedFiles(prev => prev.filter(f => f.url !== fileUrl));
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) {
      setError('No files selected');
      return;
    }

    // If not persisting immediately, just update state and close modal
    if (!persistImmediately) {
      // Combine existing files with new selected files
      const updatedFiles = [...value, ...selectedFiles];
      onChange(updatedFiles);
      setSelectedFiles([]);
      onClose();
      return;
    }

    // If persisting immediately, check for required parameters
    if (!model_id || !column_id || !row_id) {
      setError('Missing required parameters for upload');
      return;
    }

    setIsUploading(true);
    setError(null);

    // Set all files as uploading
    const uploadingUrls = new Set(selectedFiles.map(file => file.url));
    setUploadingFiles(uploadingUrls);

    try {
      const fileObjects = selectedFiles.map(file => file.file).filter((file): file is File => file !== undefined);

      await addAttachmentMutation.mutateAsync({
        model_id,
        column_id,
        row_id,
        files: fileObjects,
        onProgress: (progressEvent: ProgressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          // Update progress for all files
          selectedFiles.forEach(file => {
            setUploadProgress(prev => ({ ...prev, [file.url]: percent }));
          });
        }
      });

      // Clear selected files after successful upload
      setSelectedFiles([]);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadingFiles(new Set());
      setUploadProgress({});
    }
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    setError(null);
    onClose();
  };

  const handleCancelEditTitle = () => {
    setEditingTitle(null);
    setEditingTitleValue('');
  };

  const handleSaveTitle = async (fileUrl: string) => {
    const fileIndex = value.findIndex(f => f.url === fileUrl);
    if (fileIndex === -1) {
      console.error('File not found for title update');
      return;
    }
    const file = value[fileIndex];
    if (!file?.id) {
      console.error('No asset ID found for title update');
      return;
    }

    try {
      await updateAssetMutation.mutateAsync({
        id: file.id,
        title: editingTitleValue.trim() || undefined
      });

      // Update local state
      const updatedFiles = [...value];
      updatedFiles[fileIndex] = { ...file, title: editingTitleValue.trim() };
      onChange(updatedFiles);

      setEditingTitle(null);
      setEditingTitleValue('');
    } catch (error) {
      console.error('Failed to update asset title:', error);
      setError('Failed to update title');
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
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
        className="bg-modal !max-w-4xl !p-0 flex flex-col relative overflow-hidden h-[80vh] max-h-[80vh] mx-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 icon-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Upload size={20} className="icon-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-primary truncate">Manage Attachments</h2>
              <p className="text-sm text-secondary truncate">Upload and manage your files</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={16} className="text-[var(--text-color-tertiary)]" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="p-4 space-y-4">
            {/* Upload Area - Always visible */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all mb-6 ${isDragOver
                ? 'border-blue-500 bg-blue-50'
                : selectedFiles.length >= maxFiles
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
            >
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <div className="text-xl font-medium text-gray-900 mb-2">
                {selectedFiles.length >= maxFiles
                  ? `Maximum ${maxFiles} files selected`
                  : 'Drop files here or click to select'
                }
              </div>
              <div className="text-sm text-gray-500 mb-1">
                Max {maxFiles} files, {formatFileSize(maxFileSize)} each
              </div>
              {/* <div className="text-xs text-gray-400">
              Supported: {allowedTypes.join(', ')}
            </div> */}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Selected Files ({selectedFiles.length}/{maxFiles})
                </h3>
                <div className="space-y-2">
                  {selectedFiles.map((file) => {
                    const isUploading = uploadingFiles.has(file.url);
                    const progress = uploadProgress[file.url] || 0;

                    return (
                      <div
                        key={file.url}
                        className="flex gap-3 p-3 rounded-xl border transition-all"
                      >
                        {/* Image Preview or File Icon */}
                        <div className="flex-shrink-0 relative">
                          {file.type?.startsWith('image/') ? (
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center">
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('Image load error:', e);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              {isUploading && (
                                <div className="absolute inset-0 bg-[#0000002b] flex items-center justify-center backdrop-blur-sm">
                                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center relative">
                              {isUploading ? (
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                              ) : (
                                getFileIcon(file)
                              )}
                            </div>
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          {editingTitle === file.url ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingTitleValue}
                                onChange={(e) => setEditingTitleValue(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Enter title..."
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveTitle(file.url);
                                  } else if (e.key === 'Escape') {
                                    handleCancelEditTitle();
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveTitle(file.url)}
                                disabled={updateAssetMutation.isPending}
                                className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditTitle}
                                className="p-1 text-red-600 hover:text-red-700"
                              >
                                <XIcon size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="font-medium text-gray-900 truncate">
                              {file.name}
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            {formatFileSize(file.size)}
                            {isUploading && (
                              <span className="ml-2 text-blue-600 font-medium">
                                Uploading... {Math.round(progress)}%
                              </span>
                            )}
                          </div>
                          {file.type && (
                            <div className="text-xs text-gray-400 mt-1">{file.type}</div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => window.open(file.url, '_blank')}
                            disabled={isUploading}
                            className={`p-2 transition-colors rounded ${isUploading
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-400 hover:text-blue-600'
                              }`}
                            title={isUploading ? "Preview unavailable during upload" : "Preview"}
                          >
                            <Eye className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = file.url;
                              a.download = file.name;
                              a.click();
                            }}
                            disabled={isUploading}
                            className={`p-2 transition-colors rounded ${isUploading
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-400 hover:text-green-600'
                              }`}
                            title={isUploading ? "Download unavailable during upload" : "Download"}
                          >
                            <Download className="w-4 h-4 text-gray-700" />
                          </button>
                          {/* Edit button disabled for selected files - they don't have IDs yet */}
                          <button
                            type="button"
                            onClick={() => handleRemoveSelectedFile(file.url)}
                            disabled={isUploading}
                            className={`p-2 transition-colors rounded ${isUploading
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-400 hover:text-red-600'
                              }`}
                            title={isUploading ? "Remove unavailable during upload" : "Remove"}
                          >
                            <Trash2 className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-[var(--text-color-tertiary)]"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            {selectedFiles.length > 0 && (
              <button
                type="button"
                onClick={handleUploadFiles}
                disabled={isUploading || (persistImmediately && (!model_id || !column_id || !row_id))}
                className="px-4 py-2 text-sm font-medium btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Files
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};