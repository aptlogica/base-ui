import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { getFieldTypeIconWithMargin } from '../../../types/fieldTypes';
import { GalleryItem } from '../hooks/useGalleryData';
import { FieldDisplay } from '../../../components/shared/FieldDisplay';

interface GalleryCardProps {
  item: GalleryItem;
  onEdit?: () => void;
  visibleColumns?: any[];
}

export const GalleryCard: React.FC<GalleryCardProps> = ({
  item,
  onEdit,
  visibleColumns
}) => {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isImage = (file: any) => String(file?.mime_type || file?.type || '').startsWith('image/');

  const getFilePreview = (file: any, size: 'large' | 'small' = 'large') => {
    const mime: string = file?.mime_type || file?.type || '';
    const name: string = String(file?.name || file?.title || '').toLowerCase();
    const ext = name.includes('.') ? name.split('.').pop() : '';

    const iconSize = size === 'large' ? 'w-16 h-16' : 'w-8 h-8';

    if (mime.startsWith('application/pdf') || ext === 'pdf') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src="/assets/pdf.png"
            alt="PDF"
            className={`${iconSize} object-contain`}
          />
        </div>
      );
    }

    if (mime.includes('msword') || mime.includes('officedocument.word') || ext === 'doc' || ext === 'docx') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src="/assets/docx.png"
            alt="DOC"
            className={`${iconSize} object-contain`}
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
            className={`${iconSize} object-contain`}
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
            className={`${iconSize} object-contain`}
          />
        </div>
      );
    }
    if (mime.startsWith('audio/') || ext === 'mp3' || ext === 'wav' || ext === 'flac' || ext === 'aac') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src="/assets/audio.png"
            alt="Audio"
            className={`${iconSize} object-contain`}
          />
        </div>
      );
    }
    if (mime.startsWith('video/') || ext === 'mp4' || ext === 'avi' || ext === 'mov' || ext === 'wmv') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src="/assets/video.png"
            alt="Video"
            className={`${iconSize} object-contain`}
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
            className={`${iconSize} object-contain`}
          />
        </div>
      );
    }

    // Default for other files
    return (
      <div className="w-full h-full flex items-center justify-center">
        <img
          src="/assets/txt.png"
          alt="FILE"
          className={`${iconSize} object-contain`}
        />
      </div>
    );
  };

  // Reset image index when item changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [item.id]);

  const handleImageError = () => {
    setImageError(true);
  };

  // Carousel navigation functions (memoized to prevent recreation)
  const nextImage = useCallback(() => {
    if (item.allImages && item.allImages.length > 1) {
      setCurrentImageIndex((prev) => {
        const newIndex = (prev + 1) % (item.allImages?.length || 1);
        return newIndex;
      });
    }
  }, [item.allImages]);

  const prevImage = useCallback(() => {
    if (item.allImages && item.allImages.length > 1) {
      setCurrentImageIndex((prev) => {
        const newIndex = (prev - 1 + (item.allImages?.length || 1)) % (item.allImages?.length || 1);
        return newIndex;
      });
    }
  }, [item.allImages]);

  const goToImage = useCallback((index: number) => {
    setCurrentImageIndex(index);
  }, []);

  // Memoize current image data
  const currentImage = useMemo(() => {
    return item.allImages && item.allImages.length > 0 
      ? item.allImages[currentImageIndex] 
      : null;
  }, [item.allImages, currentImageIndex]);
  
  const hasMultipleImages = useMemo(() => 
    item.allImages && item.allImages.length > 1,
    [item.allImages]
  );

  // Helper functions to reduce cognitive complexity
  const getRawValue = useCallback((col: any): any => {
    // Prefer rawData[column_name], then metadata[column_name] or metadata[key]
    let raw = col.column_name ? item.rawData?.[col.column_name] : undefined;
    if (raw === undefined || raw === null || raw === '') {
      raw = col.column_name ? item.metadata?.[col.column_name] : undefined;
    }
    if (raw === undefined || raw === null || raw === '') {
      raw = col.key ? item.metadata?.[col.key] : undefined;
    }
    if (raw === undefined || raw === null || raw === '') {
      const titleKey = Object.keys(item.metadata || {}).find(
        key => key.toLowerCase() === (col.title || '').toLowerCase()
      );
      if (titleKey) {
        raw = item.metadata?.[titleKey];
      }
    }
    // Normalize empty values to null
    return raw === undefined || raw === '' ? null : raw;
  }, [item]);

  const getFieldTypeFlags = useCallback((col: any) => {
    return {
      fieldType: col.type || 'text',
      isLinksField: col.type === 'links' || col.uidt === 'links',
      isLookupField: col.type === 'lookup' || col.uidt === 'lookup',
      isJsonField: col.type === 'json' || col.uidt === 'json',
      isAttachmentField: col.type === 'attachment' || col.uidt === 'attachment',
    };
  }, []);

  const shouldShowAttachmentField = useCallback((raw: any): boolean => {
    if (Array.isArray(raw)) {
      return raw.length > 0;
    }
    if (raw !== null && raw !== undefined && typeof raw === 'object') {
      return Object.keys(raw).length > 0;
    }
    return false;
  }, []);

  const shouldSkipComplexObject = useCallback((raw: any, isComplexField: boolean): boolean => {
    return (
      typeof raw === 'object' &&
      raw !== null &&
      !Array.isArray(raw) &&
      !isComplexField &&
      Object.keys(raw).length > 0
    );
  }, []);

  // Process a single column and return JSX or null
  const renderFieldColumn = useCallback((col: any) => {
    const raw = getRawValue(col);
    const { fieldType, isLinksField, isLookupField, isJsonField, isAttachmentField } = getFieldTypeFlags(col);
    const isComplexField = isJsonField || isLinksField || isLookupField || isAttachmentField;

    // For attachment fields, only show if they have actual attachments
    if (isAttachmentField && !shouldShowAttachmentField(raw)) {
      return null;
    }

    // Skip complex objects that can't be displayed (except json, links, lookup, attachment which are handled by FieldDisplay)
    if (shouldSkipComplexObject(raw, isComplexField)) {
      return null;
    }

    // Show all visible fields (including empty ones) - FieldDisplay will show "-" for empty values
    return (
      <div key={col.id || col.key || `field-${col.column_name}`} className="group/metadata">
        {/* Field Title with Icon */}
        <div className="flex items-center gap-2 mb-1">
          <div className="text-gray-400 flex-shrink-0">
            {getFieldTypeIconWithMargin(fieldType === 'checkbox' ? 'boolean' : fieldType)}
          </div>
          <div className="text-gray-600 text-base">
            {col.title}
          </div>
        </div>
        {/* Field Value */}
        <div className={`ml-5 text-gray-900 cursor-default${onEdit ? '' : ' pointer-events-none'}`}>
            <FieldDisplay
              field={{
                id: col.id,
                title: col.title,
                column_name: col.column_name,
                type: col.type,
                uidt: col.uidt,
                system: col.system,
                meta: col.meta,
                config: col.config,
                model_id: col.model_id,
              }}
              value={raw}
              className=""
              hideActionButtons={true}
            />
          </div>
        </div>
      );
  }, [getRawValue, getFieldTypeFlags, shouldShowAttachmentField, shouldSkipComplexObject]);

  // Iterate over visibleColumns (like Kanban) instead of metadata entries to show all fields including empty ones
  const formatMetadata = useMemo(() => {
    if (!visibleColumns || visibleColumns.length === 0) return null;
    
    // Iterate over visible columns (like KanbanCard does) to ensure all visible fields are shown
    return visibleColumns.map(renderFieldColumn).filter(Boolean); // Filter out null entries (attachment fields without values, complex objects)
  }, [visibleColumns, renderFieldColumn]);

  // Memoize image checks to prevent recalculation
  const hasImages = useMemo(() => item.allImages && item.allImages.length > 0, [item.allImages]);
  const hasImageFiles = useMemo(() => {
    if (!hasImages || !item.allImages) return false;
    return item.allImages.some((file: any) => {
      const mime: string = file?.mime_type || file?.type || '';
      const name: string = String(file?.name || file?.title || '').toLowerCase();
      const ext = name.includes('.') ? name.split('.').pop() || '' : '';
      return mime.startsWith('image/') || 
             ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'tif'].includes(ext);
    });
  }, [hasImages, item.allImages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onEdit && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onEdit();
    }
  };

  return (
    <div //NOSONAR
      className={`group relative bg-card rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 transform ${onEdit ? 'cursor-pointer hover:-translate-y-1' : 'cursor-default'}`}
      onClick={onEdit}
      onKeyDown={onEdit ? handleKeyDown : undefined}
    >
      {/* Image Section with Carousel - Only show if we have image files */}
      {hasImageFiles && (
        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
          {currentImage && isImage(currentImage) && (currentImage.thumbnail_url || currentImage.url) && !imageError ? (
            <img
              src={currentImage.thumbnail_url || currentImage.url}
              srcSet={currentImage.url ? `${currentImage.url} 2x` : undefined}
              alt={currentImage.title || currentImage.name || `${item.title} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            getFilePreview(currentImage, 'large')
          )}

          {/* Carousel Navigation Arrows - Only show if multiple images */}
          {hasMultipleImages && (
            <div className='opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="bg-black absolute left-3 top-1/2 transform -translate-y-1/2 p-2 backdrop-blur-sm text-white rounded-full hover:bg-black/90 transition-all z-10 cursor-pointer shadow-lg hover:scale-110"
                title="Previous image"
                type="button"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="bg-black absolute right-3 top-1/2 transform -translate-y-1/2 p-2 backdrop-blur-sm text-white rounded-full hover:bg-black/90 transition-all z-10 cursor-pointer shadow-lg hover:scale-110"
                title="Next image"
                type="button"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Image Counter - Only show if multiple images */}
          {hasMultipleImages && item.allImages && (
            <div className="absolute top-3 right-3 bg-black backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg">
              {currentImageIndex + 1} / {item.allImages.length}
            </div>
          )}
          {/* Navigation Dots - Only show if multiple images */}
          {hasMultipleImages && item.allImages && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10 bg-black/40 backdrop-blur-sm px-2 py-1.5 rounded-full">
              {item.allImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goToImage(index);
                  }}
                  className={`transition-all cursor-pointer rounded-full w-2 h-2 ${
                    index === currentImageIndex
                      ? 'bg-white shadow-sm'
                      : 'bg-white/60 border hover:bg-white/80'
                  }`}
                  title={`Go to image ${index + 1}`}
                  type="button"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Image Placeholder - Show a simple placeholder for records without images */}
      {!hasImageFiles && (
        <div className="aspect-square bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 relative overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200/50 rounded-full flex items-center justify-center mb-3 mx-auto">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="p-5 min-h-[140px] flex flex-col">
        {/* Metadata - Title will now display like other fields */}
        <div className="space-y-4 flex-1">
          {formatMetadata}
        </div>
      </div>
    </div>
  );
};

// Memoize GalleryCard to prevent unnecessary re-renders
export const MemoizedGalleryCard = React.memo(GalleryCard, (prevProps, nextProps) => {
  // Custom comparison for better performance
  // Only re-render if item data actually changed
  if (prevProps.item.id !== nextProps.item.id) return false;
  if (prevProps.item.imageUrl !== nextProps.item.imageUrl) return false;
  if (prevProps.item.title !== nextProps.item.title) return false;
  if (prevProps.onEdit !== nextProps.onEdit) return false;
  
  // Compare metadata (shallow comparison for performance)
  const prevMetadata = JSON.stringify(prevProps.item.metadata);
  const nextMetadata = JSON.stringify(nextProps.item.metadata);
  if (prevMetadata !== nextMetadata) return false;
  
  // Compare visibleColumns length (deep comparison would be expensive)
  if (prevProps.visibleColumns?.length !== nextProps.visibleColumns?.length) return false;
  
  // Compare allImages length
  if (prevProps.item.allImages?.length !== nextProps.item.allImages?.length) return false;
  
  return true; // Props are equal, skip re-render
});
