import React, { useState, useEffect } from 'react';
import { SortableFormField } from './SortableFormField';
import { FormField, FormConfig } from '../../../../types/form';
import { isFormulaField } from '../../../../utils/fieldUtils';

interface FormPreviewProps {
  config: FormConfig;
  selectedFieldId: string | null;
  onFieldSelect: (fieldId: string) => void;
  rowData: Record<string, any>;
  onRowDataChange: (fieldId: string, value: unknown) => void;
  onFieldOrderChange: (newFields: FormField[]) => void;
  onClear?: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  onDeleteField: (fieldId: string) => void;
  formError?: string | null;
  onResetSuccess?: () => void;
  // Props needed for attachment fields
  model_id?: string;
  column_id?: string;
  row_id?: number;
  onEdit?: (fieldId: string) => void;
  onConfigChange?: (updates: Partial<FormConfig>) => void;
}

export const FormPreview: React.FC<FormPreviewProps> = ({
  config,
  selectedFieldId,
  onFieldSelect,
  rowData,
  onRowDataChange,
  onFieldOrderChange,
  onClear,
  onSubmit,
  onDeleteField,
  formError,
  onResetSuccess,
  model_id,
  column_id,
  row_id,
  onEdit,
  onConfigChange
}) => {
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [dragOverFieldId, setDragOverFieldId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState(config.title);
  const [editedDescription, setEditedDescription] = useState(config.description || '');

  // Sync with config changes
  useEffect(() => {
    setEditedTitle(config.title);
    setEditedDescription(config.description || '');
  }, [config.title, config.description]);

  const handleDragStart = (fieldId: string) => {
    setDraggedFieldId(fieldId);
  };

  const handleDragOver = (fieldId: string) => {
    setDragOverFieldId(fieldId);
  };

  const handleDrop = (fieldId: string) => {
    if (draggedFieldId && draggedFieldId !== fieldId) {
      const oldIndex = config.fields.findIndex(f => f.id === draggedFieldId);
      const newIndex = config.fields.findIndex(f => f.id === fieldId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const updated = [...config.fields];
        const [moved] = updated.splice(oldIndex, 1);
        updated.splice(newIndex, 0, moved);
        onFieldOrderChange(updated);
      }
    }
    setDraggedFieldId(null);
    setDragOverFieldId(null);
  };

  const handleDragEnd = () => {
    setDraggedFieldId(null);
    setDragOverFieldId(null);
  };


  const appearance = config.appearance || {};

  // Compute container styles from appearance
  const containerWidth = {
    narrow: 'max-w-md',
    medium: 'max-w-2xl',
    wide: 'max-w-4xl',
    full: 'max-w-full'
  }[appearance.layoutWidth as string] || 'max-w-2xl';

  const cardStyle = appearance.cardStyle === 'elevated'
    ? 'shadow-lg'
    : 'shadow-sm';

  const rounded = {
    none: 'rounded-none',
    md: 'rounded-xl',
    lg: 'rounded-xl',
    xl: 'rounded-xl'
  }[appearance.rounded as string] || 'rounded-xl';

  const titleAlign = appearance.align === 'center' ? 'text-center' : 'text-left';

  const handleTitleSave = () => {
    if (onConfigChange && editedTitle.trim() !== config.title) {
      onConfigChange({ title: editedTitle.trim() || config.title });
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle(config.title);
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    if (onConfigChange && editedDescription.trim() !== (config.description || '')) {
      onConfigChange({ description: editedDescription.trim() });
    }
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setEditedDescription(config.description || '');
    setIsEditingDescription(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: appearance.backgroundColor || undefined }}>
      <div className={`${containerWidth} mx-auto p-8`}>
        {/* Header with banner only */}
        {!appearance.hideBanner && appearance.bannerUrl && (
          <div className="mb-8">
            <img src={String(appearance.bannerUrl)} alt="Banner" className="w-full h-48 object-cover rounded-xl" />
          </div>
        )}

        <div className={`bg-card ${rounded} ${cardStyle} p-6 border`}>
          {/* Logo inside form card (like NocoDB) */}
          {appearance.logoUrl && (
            <div className={`mb-6 ${titleAlign === 'text-center' ? 'flex justify-center' : ''}`}>
              <img src={String(appearance.logoUrl)} alt="Logo" className="h-16 object-contain" />
            </div>
          )}

          <div className={`mb-8 ${titleAlign}`}>
            {/* Editable Title */}
            {isEditingTitle ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTitleSave();
                  } else if (e.key === 'Escape') {
                    handleTitleCancel();
                  }
                }}
                className="mb-4 w-full text-2xl font-bold focus:outline-none bg-gray-100 border-none p-4 rounded-xl"
                style={{ color: appearance.textColor || undefined }}
                autoFocus
              />
            ) : (
              <h1
                className={`mb-4 text-2xl font-bold p-4 rounded-xl ${onConfigChange ? 'cursor-text hover:bg-gray-100 transition-colors' : ''}`}
                style={{ color: appearance.textColor || undefined }}
                onClick={onConfigChange ? () => setIsEditingTitle(true) : undefined}
                title={onConfigChange ? 'Click to edit' : undefined}
              >
                {config.title}
              </h1>
            )}

            {/* Editable Description */}
            {isEditingDescription ? (
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                onBlur={handleDescriptionSave}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    handleDescriptionCancel();
                  }
                }}
                placeholder="Add form description"
                rows={2}
                className="mb-4 w-full text-sm leading-relaxed focus:outline-none resize-none bg-gray-100 border-none p-4 rounded-xl"
                style={{ color: appearance.textColor || undefined }}
                autoFocus
              />
            ) : (
              <div
                className={`mb-4 p-4 rounded-xl ${onConfigChange ? 'cursor-text hover:bg-gray-100 transition-colors' : ''}`}
                onClick={onConfigChange ? () => setIsEditingDescription(true) : undefined}
                title={onConfigChange ? 'Click to edit' : undefined}
              >
                {config.description ? (
                  <p className="leading-relaxed" style={{ color: appearance.textColor || undefined }}>
                    {config.description}
                  </p>
                ) : (
                  <p className="leading-relaxed text-gray-400 italic" style={{ color: appearance.textColor || undefined }}>
                    Add form description
                  </p>
                )}
              </div>
            )}

            {formError && (
              <div
                className="mb-4 p-3 rounded border"
                style={{
                  backgroundColor: 'var(--color-bg-error-primary)',
                  color: 'var(--color-text-error-primary)',
                  borderColor: 'var(--color-border-error_subtle)'
                }}
              >
                {formError}
              </div>
            )}
            {/* Success message removed - using toast notification instead */}
          </div>

          <form 
            className={
              appearance.fieldLayout === 'grid-2' 
                ? 'grid grid-cols-1 md:grid-cols-2 gap-4' 
                : 'space-y-2'
            } 
            onSubmit={onSubmit}
          >
            {config.fields.filter(f => {
              // Always show Title fields even if they're system fields
              if (f.title?.toLowerCase().includes('title') || f.column_name === 'title') {
                return !f.is_hidden;
              }

              // Exclude audit fields by type
              const auditFieldTitles = ['Created Time', 'Last Modified Time', 'Created By', 'Last Modified By'];
              if (f.title && auditFieldTitles.includes(f.title)) {
                return false;
              }

              // Exclude formula fields
              if (isFormulaField(f)) {
                return false;
              }

              // Exclude system fields (id, created_at, updated_at)
              const systemFieldNames = ['id', 'created_at', 'updated_at'];
              if (f.system && f.column_name && systemFieldNames.includes(f.column_name.toLowerCase())) {
                return false;
              }

              // For other fields, exclude hidden fields
              return !f.is_hidden;
            }).map((field, index) => {
              const isGridLayout = appearance.fieldLayout === 'grid-2';
              return (
                <div 
                  key={field.id + index} 
                  className={isGridLayout ? '' : 'flex items-center'}
                >
                  <div className={isGridLayout ? 'w-full' : 'flex-1'}>
                    <SortableFormField
                      field={field}
                      isSelected={selectedFieldId === field.id}
                      onSelect={onFieldSelect}
                      value={rowData[field.id] ?? ''}
                      onChange={(val: unknown) => onRowDataChange(field.id, val)}
                      draggable
                      isDragging={draggedFieldId === field.id}
                      isDragOver={dragOverFieldId === field.id}
                      onDragStart={() => handleDragStart(field.id)}
                      onDragOver={() => handleDragOver(field.id)}
                      onDrop={() => handleDrop(field.id)}
                      onDragEnd={handleDragEnd}
                      onDelete={onDeleteField}
                      appearance={appearance}
                      model_id={model_id}
                      column_id={column_id}
                      row_id={row_id}
                      onEdit={onEdit}
                    />
                  </div>
                </div>
              );
            })}

            <div className="pt-6 flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl py-3 px-4 font-medium text-white transition-colors"
                style={{
                  backgroundColor: appearance.primaryColor || '#2563eb',
                  borderColor: appearance.primaryColor || '#2563eb'
                }}
              >
                Submit
              </button>
              <button
                type="button"
                className="flex-1 btn-tertiary rounded-xl py-3 px-4 font-medium"
                onClick={onClear}
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {!appearance.hideNocoBranding && (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">Powered by SereniBase</p>
          </div>
        )}
      </div>
    </div>
  );
};