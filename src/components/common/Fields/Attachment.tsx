import React, { useState } from 'react';
import { Paperclip, Maximize2, Loader2 } from 'lucide-react';
import { useAddAttachment, useRemoveAttachments } from '../../../hooks/useApi';
import { AttachmentModal } from '../../../plugins/GalleryViewPlugin/components/shared/Modals/AttachmentModal';
import { AttachmentPreviewModal } from '../../../plugins/GalleryViewPlugin/components/shared/Modals/AttachmentPreviewModal';

interface AttachmentConfig {
  maxFiles?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
  [key: string]: any;
}

interface AttachmentProps {
  value: any[]; // API format: array of objects with title, url, mime_type, size
  onChange: (value: any[]) => void;
  config?: AttachmentConfig;
  required?: boolean;
  disabled?: boolean;
  allowEdit?: boolean;
  readOnly?: boolean;
  model_id?: string;
  column_id?: string;
  row_id?: number;
  isBorder?: boolean;
  showPreview?: boolean;
  persistImmediately?: boolean; // Default: true (maintains backward compatibility)
}

export const Attachment: React.FC<AttachmentProps> = ({
  value = [],
  onChange,
  config = {},
  required = false,
  disabled = false,
  allowEdit = true,
  readOnly = false,
  model_id,
  column_id,
  row_id,
  isBorder = false,
  showPreview = true,
  persistImmediately = true // Default: upload immediately (backward compatible)
}) => {
  const { maxFiles = 5, maxFileSize = 5 * 1024 * 1024 } = config;

  // API hooks for attachment operations
  const addAttachmentMutation = useAddAttachment();
  const removeAttachmentsMutation = useRemoveAttachments();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Normalize value to always be an array
  let normalizedValue: any[] = [];
  if (Array.isArray(value)) {
    normalizedValue = value;
  } else if (value) {
    normalizedValue = [value];
  }

  const validate = (files: any[]) => {
    if (!files || !Array.isArray(files) || files.length === 0) {
      if (required) {
        return 'Please attach at least one file';
      }
      return null; // No error if not required and empty
    }
    return null;
  };

  const error = validate(normalizedValue);

  // Get thumbnail URL - use thumbnail_url if available, fallback to url
  const getThumbnailSrc = (file: any) => {
    return file.thumbnail_url || file.url;
  };

  // Get file-type icon component for non-image files
  const getFileIcon = (file: any) => {
    const mimeType: string = file?.mime_type || file?.type || '';
    const fileName: string = (file?.name || file?.title || '').toLowerCase();
    const ext: string = fileName.includes('.') ? (fileName.split('.').pop() || '') : '';

    // Check for images first (as fallback if mime_type check in renderInlineThumbnails failed)
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(ext)) {
      // Return a generic image icon or try to show thumbnail
      const fileTitle = file?.title || file?.name || 'Attachment';
      return (
        <div className="w-full h-full flex items-center justify-center bg-card">
          <img
            src={getThumbnailSrc(file) || '/assets/image.png'}
            alt={fileTitle}
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback to generic image icon if thumbnail fails
              e.currentTarget.src = '/assets/image.png';
            }}
          />
        </div>
      );
    }

    // Prefer mime when available
    if (mimeType.startsWith('application/pdf') || ext === 'pdf') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-card">
          <img
            src="/assets/pdf.png"
            alt="PDF"
            className="w-6 h-6 object-contain"
          />
        </div>
      );
    }
    if (mimeType.includes('msword') || mimeType.includes('officedocument.word') || ext === 'doc' || ext === 'docx') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-card">
          <img
            src="/assets/docx.png"
            alt="DOC"
            className="w-6 h-6 object-contain"
          />
        </div>
      );
    }
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || ext === 'xls' || ext === 'xlsx') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-card">
          <img
            src="/assets/csv.png"
            alt="Excel"
            className="w-6 h-6 object-contain"
          />
        </div>
      );
    }
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation') || ext === 'ppt' || ext === 'pptx') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-card">
          <img
            src="/assets/ppt.png"
            alt="PPT"
            className="w-6 h-6 object-contain"
          />
        </div>
      );
    }
    if (ext === 'csv') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-card">
          <img
            src="/assets/csv.png"
            alt="CSV"
            className="w-6 h-6 object-contain"
          />
        </div>
      );
    }
    if (ext === 'txt') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-card">
          <img
            src="/assets/txt.png"
            alt="TXT"
            className="w-6 h-6 object-contain"
          />
        </div>
      );
    }
    if (ext === 'zip' || ext === 'rar' || ext === '7z') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-card">
          <img
            src="/assets/zip.png"
            alt="ZIP"
            className="w-6 h-6 object-contain"
          />
        </div>
      );
    }
    if (ext === 'exe') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-card">
          <img
            src="/assets/exe-file.png"
            alt="EXE"
            className="w-6 h-6 object-contain"
          />
        </div>
      );
    }
    if (mimeType.startsWith('audio/') || ext === 'mp3' || ext === 'wav' || ext === 'flac' || ext === 'aac') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-card">
          <img
            src="/assets/audio.png"
            alt="Audio"
            className="w-6 h-6 object-contain"
          />
        </div>
      );
    }
    if (mimeType.startsWith('video/') || ext === 'mp4' || ext === 'avi' || ext === 'mov' || ext === 'wmv') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-card">
          <img
            src="/assets/video.png"
            alt="Video"
            className="w-6 h-6 object-contain"
          />
        </div>
      );
    }
    if (ext === 'tiff' || ext === 'tif') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-card">
          <img
            src="/assets/tiff.png"
            alt="TIFF"
            className="w-6 h-6 object-contain"
          />
        </div>
      );
    }

    // Fallback generic file icon
    return (
      <div className="w-full h-full flex items-center justify-center bg-card">
        <img
          src="/assets/txt.png"
          alt="FILE"
          className="w-6 h-6 object-contain"
        />
      </div>
    );
  };

  const renderInlineThumbnails = () => {
    // Use normalized value to ensure we always have an array
    const rawAttachments = normalizedValue;

    // Filter out empty objects, null values, and objects without valid URLs
    const attachmentArray = rawAttachments.filter(att =>
      att &&
      typeof att === 'object' &&
      !Array.isArray(att) &&
      (att.url || att.thumbnail_url) &&
      Object.keys(att).length > 0
    );

    // Helper function to get button title - extracted to avoid nested ternary
    const getButtonTitle = (): string => {
      if (isUploading) {
        return "Upload in progress...";
      }
      return 'Add attachment';
    };

    // Helper function to get preview button title - extracted to avoid nested ternary
    const getPreviewButtonTitle = (): string => {
      if (disabled) {
        return "Preview disabled";
      }
      if (isUploading) {
        return "Preview unavailable during upload";
      }
      return "Preview attachments";
    };

    return (
      <div className={`relative flex items-center px-2 pr-20 h-11 ${isBorder ? "field-component-border" : ""}`}>
        {/* Thumbnails row - Show only first 3 images */}
        <div className="flex items-center gap-1 min-h-8 overflow-hidden flex-wrap">
          {attachmentArray?.slice(0, 5).map((file, idx) => {
            // Check if file is an image by MIME type or extension
            const mimeType: string = file?.mime_type || file?.type || '';
            const fileName: string = (file?.name || file?.title || '').toLowerCase();
            const ext: string = fileName.includes('.') ? (fileName.split('.').pop() || '') : '';
            const isImage = mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(ext);
            return (
              <div
                className="w-8 h-8 rounded-lg bg-card flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:border-[var(--color-brand-600)] focus:outline-none flex-shrink-0 shadow-md"
                key={`${file.url}-${file.title}-${idx}`}
                title={file.title || file.name}
                aria-label={`Preview ${file.title || file.name}`}
                // onClick for preview removed as previewFile state is unused
                style={{ minWidth: '28px', minHeight: '28px' }}
              >
                {isImage ? (
                  <img
                    src={getThumbnailSrc(file)}
                    alt={file.title || file.name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      console.error('❌ Attachment - Image load error:', {
                        url: file.url,
                        thumbnail_url: file.thumbnail_url,
                        title: file.title,
                        error: e
                      });
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  getFileIcon(file)
                )}
              </div>
            );
          })}
        </div>
        {/* Floating action buttons */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 z-10">
          {!readOnly &&
            <button
              type="button"
              className="w-7 h-7 text-gray-400 flex items-center justify-center rounded-lg border shadow-xs hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => !readOnly && setIsModalOpen(true)}
              disabled={disabled || readOnly || isUploading}
              title={getButtonTitle()}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </button>
          }
          {showPreview &&
            <button
              type="button"
              className="w-7 h-7 text-gray-400 flex items-center justify-center rounded-lg border shadow-xs hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setIsPreviewModalOpen(true)}
              disabled={disabled || isUploading}
              tabIndex={0}
              aria-label="Preview attachments"
              title={getPreviewButtonTitle()}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          }
        </div>
      </div>
    );
  };

  // Handle modal change with API integration
  const handleModalChange = async (newFiles: any[]) => {
    // Always update local state
    onChange(newFiles);

    const validationError = validate(newFiles);
    setShowError(!!validationError);

    // If not persisting immediately (like in form view), just update state and return
    if (!persistImmediately) {
      return;
    }

    // If missing required params or row_id, just update state
    if (!model_id || !column_id || !row_id) {
      return;
    }

    try {
      // Calculate files to add and remove
      const currentFiles = value || [];
      const filesToAdd = newFiles.filter(newFile =>
        !currentFiles.some(currentFile => currentFile.url === newFile.url)
      );
      const filesToRemove = currentFiles.filter(currentFile =>
        !newFiles.some(newFile => newFile.id === currentFile.id)
      );

      // Make API calls for file operations
      if (filesToAdd.length > 0) {
        setIsUploading(true);

        // Extract File objects from the files to add
        const fileObjects = filesToAdd
          .map(file => file.file)
          .filter((file): file is File => file !== undefined);

        if (fileObjects.length > 0) {
          await addAttachmentMutation.mutateAsync({
            model_id,
            column_id,
            row_id,
            files: fileObjects // Pass File objects instead of URLs
            // Note: Progress display is handled in AttachmentModal component, not here
          });
        } else {
          console.warn('⚠️ Attachment - No valid File objects found in filesToAdd');
        }

        setIsUploading(false);
      }

      if (filesToRemove.length > 0) {
        const fileUrls = filesToRemove.map(file => file.id);
        await removeAttachmentsMutation.mutateAsync({
          model_id,
          column_id,
          row_id,
          attachments: fileUrls
        });
      }

      const validationError = validate(newFiles);
      setShowError(!!validationError);
    } catch (error) {
      console.error('❌ Attachment - API Error:', {
        error,
        model_id,
        column_id,
        row_id,
        newFilesCount: newFiles.length
      });
      // Revert local state on error
      onChange(value);
      setIsUploading(false);
    }
  };


  return (
    <div className="w-full relative">
      {renderInlineThumbnails()}
      {/* Modal for managing attachments */}
      <AttachmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        value={value}
        onChange={handleModalChange}
        maxFiles={maxFiles}
        maxFileSize={maxFileSize}
        persistImmediately={persistImmediately}
        {...(model_id && column_id && row_id ? { model_id, column_id, row_id } : {})}
      />

      {/* Preview Modal for viewing all images */}
      <AttachmentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        attachments={value}
        onAttachFile={() => {
          setIsPreviewModalOpen(false);
          setIsModalOpen(true);
        }}
        onAttachmentsChange={onChange}
        model_id={model_id}
        column_id={column_id}
        row_id={row_id}
        allowEdit={allowEdit && !readOnly}
        readOnly={readOnly}
      />

      {/* Error display */}
      {error && showError && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 px-2 py-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded shadow-sm">
          {error}
        </div>
      )}
    </div>
  );
};