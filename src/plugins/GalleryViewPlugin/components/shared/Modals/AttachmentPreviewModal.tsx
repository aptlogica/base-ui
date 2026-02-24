import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Image, Paperclip, Edit, Trash2, Copy, Check } from 'lucide-react';
import { ImageCarousel } from './ImageCarousel';
import { useRemoveAttachments, useUpdateAssetById } from '../../../../../hooks/useApi';

interface AttachmentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: any[];
  onAttachFile?: () => void;
  onAttachmentsChange?: (attachments: any[]) => void;
  allowEdit?: boolean;
  readOnly?: boolean; // true = completely prevent editing
  // API parameters for attachment operations
  model_id?: string;
  column_id?: string;
  row_id?: number;
}

export const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({
  isOpen,
  onClose,
  attachments,
  onAttachFile,
  onAttachmentsChange,
  allowEdit = true,
  readOnly = false,
  model_id,
  column_id,
  row_id
}) => {
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // API hooks
  const removeAttachmentsMutation = useRemoveAttachments();
  const updateAssetMutation = useUpdateAssetById();

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !carouselOpen && editingIndex === null) {
        onClose();
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, carouselOpen, editingIndex, onClose]);

  // Format file size helper
  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Copy URL to clipboard
  const handleCopyUrl = async (file: any, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(file.url);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  if (!isOpen) return null;

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setCarouselOpen(true);
  };


  const handleEditAttachment = (attachment: any, index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (readOnly) return;
    setEditingIndex(index);
    setEditingTitle(attachment.title || attachment.name || '');
  };

  const handleSaveEdit = async (index: number) => {
    // Don't save if we're cancelling
    if (isCancelling) {
      return;
    }

    try {
      const attachment = attachments[index];
      if (editingTitle.trim() && editingTitle !== (attachment.title || attachment.name)) {
        // Update via API if we have the required parameters
        if (attachment.id) {
          await updateAssetMutation.mutateAsync({
            id: attachment.id,
            title: editingTitle.trim()
          });
        }

        // Update local state
        if (onAttachmentsChange) {
          const updatedAttachments = [...attachments];
          updatedAttachments[index] = {
            ...attachment,
            title: editingTitle.trim()
          };
          onAttachmentsChange(updatedAttachments);
        }
      }
      setEditingIndex(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Error updating attachment title:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsCancelling(true);
    setEditingIndex(null);
    setEditingTitle('');
    // Reset cancelling flag after a short delay
    setTimeout(() => setIsCancelling(false), 100);
  };

  const handleDeleteAttachment = async (attachment: any, index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (readOnly) return;
    try {
      // Remove via API if we have the required parameters
      if (model_id && column_id && row_id && attachment.id) {
        await removeAttachmentsMutation.mutateAsync({
          model_id,
          column_id,
          row_id,
          attachments: [attachment.id]
        });
      }

      // Update local state
      if (onAttachmentsChange) {
        const updatedAttachments = attachments.filter((_, i) => i !== index);
        onAttachmentsChange(updatedAttachments);
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };

  const handleDownloadAttachment = (attachment: any, event: React.MouseEvent) => {
    event.stopPropagation();
    const a = document.createElement('a');
    a.href = attachment.url;
    a.download = attachment.title || attachment.name || 'download';
    a.click();
  };

  return (
    <>
      {/* Preview Modal */}
      {createPortal(
        <div //NOSONAR
        className="bg-modal-backdrop" onClick={onClose}>
        <div //NOSONAR
          className="bg-[var(--color-card)] border rounded-xl shadow-2xl w-full transform transition-all duration-200 scale-100 relative max-w-6xl mx-4 min-h-[90vh] max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                <Image size={16} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Thumbnail</h2>
                <p className="text-sm text-gray-500">
                  Preview all attachments {attachments.length > 0 && `(${attachments.length})`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!readOnly && allowEdit && onAttachFile && (
              <button
                type="button"
                onClick={onAttachFile}
                className="px-4 py-2 btn-primary flex items-center gap-2"
              >
                <Paperclip size={16} />
                Attach File
              </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content - Grid of thumbnails */}
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {attachments.length > 0 ? (
              <div className="grid grid-cols-5 gap-4">
                {attachments.map((file, index) => {
                  const isHovered = hoveredCardIndex === index;
                  return (
                  <div //NOSONAR
                    key={file.id || file.url || index}
                    className="relative bg-card border rounded-xl p-2 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleImageClick(index)}
                    onMouseEnter={() => setHoveredCardIndex(index)}
                    onMouseLeave={() => setHoveredCardIndex(null)}
                  >
                    {/* File Preview */}
                    <div className="relative aspect-square mb-3 rounded-xl overflow-hidden bg-gray-50">
                      {file.mime_type?.startsWith("image/") ? (
                        <img
                          src={file.thumbnail_url || file.url}
                          alt={file.title || file.name}
                          className={`w-full h-full object-cover transition-transform duration-200 ${isHovered ? 'scale-105' : ''}`}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (() => {
                        const getFilePreview = (file: any) => {
                          const mimeType: string = file?.mime_type || file?.type || '';
                          const fileName: string = (file?.name || file?.title || '').toLowerCase();
                          const ext = fileName.includes('.') ? fileName.split('.').pop() : '';

                          if (mimeType.startsWith('application/pdf') || ext === 'pdf') {
                            return (
                              <div className="w-full h-full flex items-center justify-center bg-card rounded-xl">
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
                              <div className="w-full h-full flex items-center justify-center bg-card rounded-xl">
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
                              <div className="w-full h-full flex items-center justify-center bg-card rounded-xl">
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
                              <div className="w-full h-full flex items-center justify-center bg-card rounded-xl">
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
                              <div className="w-full h-full flex items-center justify-center bg-card rounded-xl">
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
                              <div className="w-full h-full flex items-center justify-center bg-card rounded-xl">
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
                              <div className="w-full h-full flex items-center justify-center bg-card rounded-xl">
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
                              <div className="w-full h-full flex items-center justify-center bg-card rounded-xl">
                                <img
                                  src="/assets/exe-file.png"
                                  alt="EXE"
                                  className="w-1/2 h-1/2 object-contain"
                                />
                              </div>
                            );
                          }
                          if (mimeType.startsWith('audio/') || ext === 'mp3' || ext === 'wav' || ext === 'flac' || ext === 'aac') {
                            return (
                              <div className="w-full h-full flex items-center justify-center bg-card rounded-xl">
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
                              <div className="w-full h-full flex items-center justify-center bg-card rounded-xl">
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
                              <div className="w-full h-full flex items-center justify-center bg-card rounded-xl">
                                <img
                                  src="/assets/tiff.png"
                                  alt="TIFF"
                                  className="w-1/2 h-1/2 object-contain"
                                />
                              </div>
                            );
                          }

                          return (
                            <div className="w-full h-full flex items-center justify-center bg-card rounded-xl">
                              <img
                                src="/assets/file.png"
                                alt="FILE"
                                className="w-1/2 h-1/2 object-contain"
                              />
                        </div>
                          );
                        };

                        return getFilePreview(file);
                      })()}
                    </div>

                    {/* File Name - Inline Editable with Action Icons */}
                    <div className="text-xs font-medium w-full">
                      {!readOnly && editingIndex === index ? (
                        <div className="flex items-center gap-1 border rounded-[var(--radius-lg)] bg-[--color-alpha-white] focus:border focus:border-[--color-brand-600] px-2 py-1 w-full min-w-0">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveEdit(index);
                              } else if (e.key === "Escape") {
                                handleCancelEdit();
                              }
                            }}
                            onBlur={() => handleSaveEdit(index)}
                            className="flex-1 min-w-0 w-full px-1 py-0.5 text-xs text-[var(--color-text-primary)] bg-transparent border-none outline-none placeholder-gray-400"
                            placeholder="Enter filename..."
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between gap-2">
                        <div
                              className="truncate cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded text-gray-700 flex-1"
                          title={file.title || file.name || "Unknown file"}
                        >
                          {file.title || file.name || "Unknown file"}
                            </div>
                            {/* Action Buttons - Visible only on hover of this card and when allowEdit is true and not readOnly */}
                            {!readOnly && allowEdit && (
                            <div className={`flex items-center gap-1 transition-all duration-200 ${isHovered ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyUrl(file, index, e);
                              }}
                              className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
                              title="Copy URL"
                            >
                              {copiedIndex === index ? (
                                <Check size={10} className="text-green-600" />
                              ) : (
                                <Copy size={10} />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadAttachment(file, e);
                              }}
                              className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
                              title="Download"
                            >
                              <Download size={10} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAttachment(file, index, e);
                              }}
                              className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
                              title="Edit"
                            >
                              <Edit size={10} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAttachment(file, index, e);
                              }}
                              className="p-1 text-red-600 hover:text-red-700 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                          )}
                        </div>
                        {/* File Size */}
                        {file.size && (
                          <div className="text-xs text-gray-500 mt-0.5 px-1">
                            {formatFileSize(file.size)}
                          </div>
                        )}
                        </div>
                      )}
                    </div>
                  </div>
                );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Image className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No attachments to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
      )}

      {/* Image Carousel */}
      <ImageCarousel
        isOpen={carouselOpen}
        onClose={() => setCarouselOpen(false)}
        images={attachments}
        initialIndex={selectedImageIndex}
      />
    </>
  );
};
