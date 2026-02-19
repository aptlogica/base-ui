import React, { memo, useMemo, useState, useEffect } from 'react';
import { Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { getFieldTypeIconWithMargin } from '../../../../types/fieldTypes';
import { GridColumn } from '../../../GridViewPlugin/types/grid.types';
import { FieldDisplay } from '../../../../components/shared/FieldDisplay';

interface KanbanCardProps {
  card: any;
  columns: GridColumn[];
  fieldConfig?: Array<{ id: string; position: number; isHidden: boolean }>;
  groupCol?: GridColumn | null;
  isDragging?: boolean;
  onEdit?: (cardId: string) => void;
}

const KanbanCard = memo<KanbanCardProps>((props) => {
  const {
    card,
    columns,
    fieldConfig = [],
    groupCol,
    isDragging = false,
    onEdit,
  } = props;

  // Create fieldConfig Map for O(1) lookups (shared across multiple useMemos)
  const fieldConfigMap = useMemo(() => {
    return new Map(fieldConfig.map(fc => [String(fc.id), fc]));
  }, [fieldConfig]);

  const visibleColumns = useMemo(() => {
    // First, sort columns by position from fieldConfig, then filter by visibility (like Grid view)
    const sortedColumns = [...(columns || [])].sort((a, b) => {
      const aConfig = fieldConfigMap.get(String(a.id));
      const bConfig = fieldConfigMap.get(String(b.id));

      const aPosition = aConfig?.position ?? 0;
      const bPosition = bConfig?.position ?? 0;

      return aPosition - bPosition;
    });

    return sortedColumns.filter(column => {
      if (!column.id) return true;
      if (groupCol && String(column.id) === String(groupCol.id)) return false;
      const fieldConfigEntry = fieldConfigMap.get(String(column.id));
      if (fieldConfigEntry) {
        return !fieldConfigEntry.isHidden;
      }
      return false;
    });
  }, [columns, fieldConfigMap, groupCol]);

  // Include Title in detailCols so it displays like other fields
  const detailCols = useMemo(() => visibleColumns, [visibleColumns]);

  // Get attachment/image columns to display at the top of the card (ALWAYS show, independent of field visibility)
  // This is separate from the attachment field that shows in the card fields list
  const imageColumn = useMemo(() => {
    // Always find the first attachment field, regardless of fieldConfig visibility
    return columns.find(col =>
      col.uidt === 'attachment' || col.type === 'attachment'
    );
  }, [columns]);

  // State for carousel
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get all image attachments from card data
  const allImages = useMemo(() => {
    if (!imageColumn?.column_name) return [];

    const attachmentValue = card?.[imageColumn.column_name] || card?.data?.[imageColumn.column_name];
    if (!attachmentValue || (typeof attachmentValue === 'object' && Object.keys(attachmentValue).length === 0)) return [];

    // Handle array of attachments
    const attachments = Array.isArray(attachmentValue) ? attachmentValue.filter(Boolean) : [attachmentValue].filter(Boolean);
    if (attachments.length === 0) return [];

    // Filter to only image attachments
    const imageAttachments = attachments.filter((att: any) => {
      if (!att || typeof att !== 'object') return false;

      const mime: string = att?.mime_type || att?.type || '';
      const name: string = String(att?.name || att?.title || '').toLowerCase();
      const ext = name.includes('.') ? name.split('.').pop() || '' : '';

      return mime.startsWith('image/') ||
        ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'tif'].includes(ext);
    });

    return imageAttachments;
  }, [imageColumn, card]);

  // Get current image URL
  const getImageUrl = useMemo(() => {
    if (!allImages || allImages.length === 0) return null;
    if (currentImageIndex >= allImages.length) return null;

    const currentImage = allImages[currentImageIndex];
    const url = currentImage?.thumbnail_url || currentImage?.url;
    return url && typeof url === 'string' && url.trim() !== '' ? url : null;
  }, [allImages, currentImageIndex]);

  const hasMultipleImages = allImages && allImages.length > 1;

  // Reset image index and error when card or images change
  useEffect(() => {
    setCurrentImageIndex(0);
    setImageError(false);
  }, [card._meta?.id, allImages.length]);

  // Reset image error when image URL changes
  useEffect(() => {
    setImageError(false);
  }, [getImageUrl]);

  // Carousel navigation functions
  const nextImage = () => {
    if (allImages && allImages.length > 1) {
      setCurrentImageIndex((prev) => {
        const newIndex = (prev + 1) % allImages.length;
        return newIndex;
      });
    }
  };

  const prevImage = () => {
    if (allImages && allImages.length > 1) {
      setCurrentImageIndex((prev) => {
        const newIndex = (prev - 1 + allImages.length) % allImages.length;
        return newIndex;
      });
    }
  };

  const goToImage = (index: number) => {
    if (allImages && index >= 0 && index < allImages.length) {
      setCurrentImageIndex(index);
    }
  };

  // Memoize drag handlers
  const handleDragStart = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.dataTransfer.setData('cardId', card._meta.id);
    e.dataTransfer.setData('sourceIndex', card._meta.position.toString());
    const stackElement = e.currentTarget.closest('.kanban-stack');

    const sourceStackId =
      stackElement instanceof HTMLElement
        ? stackElement.dataset.stackId || ''
        : '';

    if (sourceStackId) {
      e.dataTransfer.setData('sourceStackId', sourceStackId);
    }
    // Set the drag effect
    e.dataTransfer.effectAllowed = 'move';
    // Add a class to the dragged element
    const element = e.currentTarget;
    requestAnimationFrame(() => {
      element.classList.add('opacity-50', 'rotate-2', 'shadow-lg');
    });
  }, [card._meta.id, card._meta.position]);

  const handleDragEnd = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    element.classList.remove('opacity-50', 'rotate-2', 'shadow-lg');
  }, []);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const menuOwnerId = React.useRef(Symbol('kanban-card-menu'));

  React.useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [menuOpen]);

  // Close when another menu opens elsewhere
  React.useEffect(() => {
    const onOtherMenuOpen = (e: any) => {
      const src = e?.detail?.source;
      if (src !== menuOwnerId.current) {
        setMenuOpen(false);
      }
    };
    globalThis.addEventListener('kanban-menu-open', onOtherMenuOpen as EventListener);
    return () => globalThis.removeEventListener('kanban-menu-open', onOtherMenuOpen as EventListener);
  }, []);

  // Check if card is editable (for drag and click)
  const isEditable = onEdit !== undefined;

  return (
    <div //NOSONAR
      className={`kanban-card bg-card rounded-2xl border shadow-sm p-4 pt-0 group ${isEditable ? 'hover:border-[var(--color-bg-brand-primary)]' : ''} transition-all duration-200 ${isEditable ? 'hover:shadow-lg' : ''} cursor-default relative ${isDragging ? 'opacity-50 rotate-2 shadow-lg' : ''}`}
      draggable={isEditable}
      onDragStart={isEditable ? handleDragStart : undefined}
      onDragEnd={isEditable ? handleDragEnd : undefined}
      style={{ position: 'relative' }}
    >
      {/* Transparent overlay for whole card - only if editable */}
      {onEdit && (
        <div //NOSONAR
          className="absolute inset-0 z-10 bg-transparent cursor-pointer"
          onClick={e => {
            if (
              (menuRef.current?.contains(e.target as Node)) ||
              (e.target instanceof HTMLElement && e.target.closest('[aria-label="Card menu"]'))
            ) {
              return;
            }
            e.stopPropagation();
            onEdit(card._meta.id);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onEdit(card._meta.id);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Edit record"
        />
      )}

      {/* Card Image - Always show at top: images if available, otherwise placeholder */}
      <div className="mb-3 -mx-4 border-b relative">
        {getImageUrl && !imageError && allImages.length > 0 ? (
          <div className="relative">
            <img
              src={getImageUrl}
              alt={`Card ${currentImageIndex + 1}`}
              className="w-full h-56 object-contain rounded-tl-2xl rounded-tr-2xl"
              onError={() => {
                setImageError(true);
              }}
            />

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
            {hasMultipleImages && (
              <div className="absolute top-3 right-3 border bg-black/50 backdrop-blur-sm text-primary text-xs font-medium px-2.5 py-1 rounded-full shadow-lg">
                {currentImageIndex + 1} / {allImages.length}
              </div>
            )}

            {/* Navigation Dots - Only show if multiple images */}
            {hasMultipleImages && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10 bg-black/40 backdrop-blur-sm px-2 py-1.5 rounded-full">
                {allImages.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      goToImage(index);
                    }}
                    className={`transition-all cursor-pointer rounded-full w-2 h-2 ${index === currentImageIndex
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
        ) : (
          <div className="w-full h-56 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 rounded-tl-2xl rounded-tr-2xl relative overflow-hidden flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Card Fields - Title will now display like other fields */}
      <div className="space-y-4">
        {detailCols.map(col => {
          // Include links fields - they can be displayed using FieldDisplay (like Gallery)

          // Prefer card[column_name], then card.data[column_name]
          let raw = col.column_name ? card?.[col.column_name] : undefined;
          if (raw === undefined || raw === null || raw === '') {
            raw = col.column_name ? card?.data?.[col.column_name] : undefined;
          }

          // Normalize empty values to null so FieldDisplay can show "-"
          if (raw === undefined || raw === '') {
            raw = null;
          }
          // Include attachment fields - they can be displayed using FieldDisplay (like Gallery)
          // Skip complex objects that can't be displayed (but allow json, links, lookup, attachment, etc.)
          // Only consider type/uidt if those fields are defined (due to possible undefined at runtime)
          const isComplexField =
            (col.type && ['json', 'links', 'lookup', 'attachment'].includes(col.type)) ||
            (col.uidt && ['json', 'links', 'lookup', 'attachment'].includes(col.uidt));

          if (
            typeof raw === 'object' &&
            raw !== null &&
            !Array.isArray(raw) &&
            !isComplexField &&
            Object.keys(raw).length > 0
          ) {
            return null;
          }

          const fieldType = col.type || 'text';

          return (
            <div key={col.id || col.key || `field-${col.column_name}`} className="group/metadata">
              {/* Field Title with Icon */}
              <div className="flex items-center gap-2 mb-1">
                <div className="text-gray-400 flex-shrink-0">
                  {getFieldTypeIconWithMargin(fieldType === 'checkbox' ? 'boolean' : fieldType)}
                </div>
                <div className="text-gray-600 text-base font-medium">
                  {col.title}
                </div>
              </div>
              {/* Field Value */}
              <div className="ml-7 text-gray-900">
                <FieldDisplay
                  field={{
                    id: col.id,
                    title: col.title,
                    column_name: col.column_name,
                    type: col.type,
                    uidt: col.uidt,
                    system: col.system,
                    meta: col.config,
                    config: col.config,
                    model_id: card?.model_id || undefined,
                  }}
                  value={raw}
                  className=""
                  currentRowId={card._meta?.id || card.id}
                  hideActionButtons={true}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

KanbanCard.displayName = 'KanbanCard';

export default KanbanCard;
