// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SortableFormField, DropPosition } from './SortableFormField';
import { buildFieldRows, moveFieldOnDrop } from './fieldRows';
import { FormField, FormConfig } from '../../../../types/form';
import { isFormulaField } from '../../../../utils/fieldUtils';
import { useAddImage } from '../../../../hooks/useApi';
import { useToast } from '../../../../components/common/Toast';
import { ImagePlus } from 'lucide-react';

interface FormPreviewProps {
  config: FormConfig;
  selectedFieldId: string | null;
  rowData: Record<string, any>;
  onRowDataChange: (fieldId: string, value: unknown) => void;
  onFieldOrderChange: (newFields: FormField[]) => void;
  onClear?: () => void;
  onSubmit?: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  onDeleteField: (fieldId: string) => void;
  formError?: string | null;
  model_id?: string;
  row_id?: number;
  onEdit?: (fieldId: string) => void;
  onConfigChange?: (updates: Partial<FormConfig>) => void;
  isReadOnly?: boolean;
  isSubmitting?: boolean;
}

// Extract field filtering logic
const shouldIncludeField = (field: FormField): boolean => {
  if (field.title?.toLowerCase().includes('title') || field.column_name === 'title') {
    return !field.is_hidden;
  }

  const auditFieldTitles = ['Created Time', 'Last Modified Time', 'Created By', 'Last Modified By'];
  if (field.title && auditFieldTitles.includes(field.title)) {
    return false;
  }

  if (isFormulaField(field)) {
    return false;
  }

  const systemFieldNames = ['id', 'created_at', 'updated_at'];
  if (field.system && field.column_name && systemFieldNames.includes(field.column_name.toLowerCase())) {
    return false;
  }

  return !field.is_hidden;
};

// Extract appearance style computation
interface AppearanceStyles {
  containerWidth: string;
  cardStyle: string;
  rounded: string;
  titleAlign: string;
}

const computeAppearanceStyles = (appearance: FormConfig['appearance']): AppearanceStyles => {
  const appearanceConfig = appearance || {};

  const containerWidth = {
    narrow: 'max-w-[42rem]',
    medium: 'max-w-[57.5rem]',
    wide: 'max-w-[72rem]',
    full: 'max-w-full'
  }[appearanceConfig.layoutWidth as string] || 'max-w-[57.5rem]';

  const cardStyle = appearanceConfig.cardStyle === 'elevated' ? 'shadow-lg' : 'shadow-sm';

  const rounded = {
    none: 'rounded-none',
    md: 'rounded-lg',
    lg: 'rounded-[1.125rem]',
    xl: 'rounded-[1.75rem]'
  }[appearanceConfig.rounded as string] || 'rounded-[1.125rem]';

  const titleAlign = {
    center: 'text-center',
    right: 'text-right'
  }[appearanceConfig.align as string] || 'text-left';

  return { containerWidth, cardStyle, rounded, titleAlign };
};
interface EditableTitleProps {
  title: string;
  isEditing: boolean;
  editedTitle: string;
  onEditChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
  isReadOnly: boolean;
  canEdit: boolean;
  textColor?: string;
}

const handleTitleKeyDown = (e: React.KeyboardEvent, onSave: () => void, onCancel: () => void) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    onSave();
  } else if (e.key === 'Escape') {
    onCancel();
  }
};

const handleViewKeyDown = (e: React.KeyboardEvent, onStartEdit: () => void) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onStartEdit();
  }
};

const EditableTitle: React.FC<EditableTitleProps> = ({
  title,
  isEditing,
  editedTitle,
  onEditChange,
  onSave,
  onCancel,
  onStartEdit,
  isReadOnly,
  canEdit,
  textColor
}) => {
  if (isEditing && !isReadOnly) {
    return (
      <input
        type="text"
        value={editedTitle}
        onChange={(e) => onEditChange(e.target.value)}
        onBlur={onSave}
        onKeyDown={(e) => handleTitleKeyDown(e, onSave, onCancel)}
        className="mb-2 -mx-2 w-[calc(100%+1rem)] text-xl font-semibold focus:outline-none bg-gray-100 border-none px-2 py-1 rounded-lg"
        style={{ color: textColor || undefined }}
        autoFocus
      />
    );
  }

  if (canEdit && !isReadOnly) {
    return (
      <button
        type="button"
        className="mb-2 -mx-2 px-2 py-1 text-left text-xl font-semibold rounded-lg cursor-pointer hover:bg-gray-50 transition-colors w-[calc(100%+1rem)]"
        style={{ color: textColor || undefined }}
        onClick={onStartEdit}
        onKeyDown={(e) => handleViewKeyDown(e, onStartEdit)}
        aria-label="Click to edit title"
      >
        {title}
      </button>
    );
  }

  return (
    <h1
      className="mb-2 text-xl font-semibold py-1"
      style={{ color: textColor || undefined }}
    >
      {title}
    </h1>
  );
};

// Extract editable description component
interface EditableDescriptionProps {
  description: string | null | undefined;
  isEditing: boolean;
  editedDescription: string;
  onEditChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
  isReadOnly: boolean;
  canEdit: boolean;
  textColor?: string;
}

const handleDescriptionKeyDown = (e: React.KeyboardEvent, onCancel: () => void) => {
  if (e.key === 'Escape') {
    onCancel();
  }
};

const renderDescriptionContent = (description: string | null | undefined, textColor?: string) => {
  if (description) {
    return (
      <p className="text-sm leading-relaxed text-[var(--color-gray-600)]" style={{ color: textColor || undefined }}>
        {description}
      </p>
    );
  }
  return (
    <p className="text-sm leading-relaxed text-[var(--color-gray-500)]" style={{ color: textColor || undefined }}>
      Add form description
    </p>
  );
};

const EditableDescription: React.FC<EditableDescriptionProps> = ({
  description,
  isEditing,
  editedDescription,
  onEditChange,
  onSave,
  onCancel,
  onStartEdit,
  isReadOnly,
  canEdit,
  textColor
}) => {
  if (isEditing && !isReadOnly) {
    return (
      <textarea
        value={editedDescription}
        onChange={(e) => onEditChange(e.target.value)}
        onBlur={onSave}
        onKeyDown={(e) => handleDescriptionKeyDown(e, onCancel)}
        placeholder="Add form description"
        rows={2}
        className="-mx-2 w-[calc(100%+1rem)] text-sm leading-relaxed focus:outline-none resize-none bg-gray-100 border-none px-2 py-1 rounded-lg"
        style={{ color: textColor || undefined }}
        autoFocus
      />
    );
  }

  if (canEdit && !isReadOnly) {
    return (
      <button
        type="button"
        className="-mx-2 px-2 py-1 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors w-[calc(100%+1rem)] text-left"
        onClick={onStartEdit}
        onKeyDown={(e) => handleViewKeyDown(e, onStartEdit)}
        aria-label="Click to edit description"
      >
        {renderDescriptionContent(description, textColor)}
      </button>
    );
  }

  return (
    <div className="py-1">
      {renderDescriptionContent(description, textColor)}
    </div>
  );
};

// Extract form fields list component
interface FormFieldsListProps {
  fields: FormField[];
  selectedFieldId: string | null;
  rowData: Record<string, any>;
  onRowDataChange: (fieldId: string, value: unknown) => void;
  draggedFieldId: string | null;
  dragOverFieldId: string | null;
  dragOverPosition: DropPosition | null;
  onDragStart: (fieldId: string) => void;
  onDragOver: (fieldId: string, position?: DropPosition) => void;
  onDrop: (fieldId: string, position?: DropPosition) => void;
  onDragEnd: () => void;
  onDeleteField: (fieldId: string) => void;
  appearance: FormConfig['appearance'];
  model_id?: string;
  row_id?: number;
  onEdit?: (fieldId: string) => void;
  isReadOnly: boolean;
  isGridLayout: boolean;
  isSubmitting?: boolean;
}

interface RenderFormFieldParams {
  field: FormField;
  index: number;
  selectedFieldId: string | null;
  rowData: Record<string, any>;
  onRowDataChange: (fieldId: string, value: unknown) => void;
  draggedFieldId: string | null;
  dragOverFieldId: string | null;
  dragOverPosition: DropPosition | null;
  onDragStart: (fieldId: string) => void;
  onDragOver: (fieldId: string, position?: DropPosition) => void;
  onDrop: (fieldId: string, position?: DropPosition) => void;
  onDragEnd: () => void;
  onDeleteField: (fieldId: string) => void;
  appearance: FormConfig['appearance'];
  model_id?: string;
  row_id?: number;
  onEdit?: (fieldId: string) => void;
  isReadOnly: boolean;
  isGridLayout: boolean;
  isSubmitting?: boolean;
}

const getFormFieldDragHandlers = (
  isReadOnly: boolean,
  fieldId: string,
  onDragStart: (fieldId: string) => void,
  onDragOver: (fieldId: string, position?: DropPosition) => void,
  onDrop: (fieldId: string, position?: DropPosition) => void,
  onDragEnd: () => void
) => {
  if (isReadOnly) {
    return {
      onDragStart: undefined,
      onDragOver: undefined,
      onDrop: undefined,
      onDragEnd: undefined
    };
  }
  return {
    onDragStart: () => onDragStart(fieldId),
    onDragOver: (position: DropPosition) => onDragOver(fieldId, position),
    onDrop: (position: DropPosition) => onDrop(fieldId, position),
    onDragEnd
  };
};

const getFormFieldClasses = (isGridLayout: boolean) => {
  return {
    containerClass: isGridLayout ? '' : 'flex items-center',
    innerClass: isGridLayout ? 'w-full' : 'flex-1'
  };
};

const renderFormField = (params: RenderFormFieldParams) => {
  const {
    field,
    index,
    selectedFieldId,
    rowData,
    onRowDataChange,
    draggedFieldId,
    dragOverFieldId,
    dragOverPosition,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onDeleteField,
    appearance,
    model_id,
    row_id,
    onEdit,
    isReadOnly,
    isGridLayout,
    isSubmitting = false
  } = params;

  const { containerClass, innerClass } = getFormFieldClasses(isGridLayout);
  const dragHandlers = getFormFieldDragHandlers(isReadOnly, field.id, onDragStart, onDragOver, onDrop, onDragEnd);
  const fieldValue = rowData[field.id] ?? '';
  const isSelected = selectedFieldId === field.id;
  const isDragging = draggedFieldId === field.id;
  const isDragOver = dragOverFieldId === field.id;

  return (
    <div key={field.id + index} className={containerClass}>
      <div className={innerClass}>
        <SortableFormField
          field={field}
          isSelected={isSelected}
          value={fieldValue}
          onChange={(val: unknown) => onRowDataChange(field.id, val)}
          draggable={!isReadOnly}
          isDragging={isDragging}
          isDragOver={isDragOver}
          dropPosition={isDragOver ? dragOverPosition : null}
          onDragStart={dragHandlers.onDragStart}
          onDragOver={dragHandlers.onDragOver}
          onDrop={dragHandlers.onDrop}
          onDragEnd={dragHandlers.onDragEnd}
          onDelete={isReadOnly ? undefined : onDeleteField}
          appearance={appearance}
          model_id={model_id}
          row_id={row_id}
          onEdit={onEdit}
          isReadOnly={isReadOnly}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

const FormFieldsList: React.FC<FormFieldsListProps> = ({
  fields,
  selectedFieldId,
  rowData,
  onRowDataChange,
  draggedFieldId,
  dragOverFieldId,
  dragOverPosition,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onDeleteField,
  appearance,
  model_id,
  row_id,
  onEdit,
  isReadOnly,
  isGridLayout,
  isSubmitting = false
}) => {
  const renderField = (field: FormField, index: number) =>
    renderFormField({
      field,
      index,
      selectedFieldId,
      rowData,
      onRowDataChange,
      draggedFieldId,
      dragOverFieldId,
      dragOverPosition,
      onDragStart,
      onDragOver,
      onDrop,
      onDragEnd,
      onDeleteField,
      appearance,
      model_id,
      row_id,
      onEdit,
      isReadOnly,
      isGridLayout,
      isSubmitting
    });

  if (isGridLayout) {
    return <>{fields.map(renderField)}</>;
  }

  // Single-column layout: fields dropped beside each other share a row
  return (
    <>
      {buildFieldRows(fields, appearance?.inlineFieldIds).map((row, index) =>
        row.length === 1
          ? renderField(row[0], index)
          : (
            <div key={row.map(f => f.id).join('-')} className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="form-field-row">
              {row.map(field => renderField(field, index))}
            </div>
          )
      )}
    </>
  );
};

// Extract form header component
interface FormHeaderProps {
  appearance: FormConfig['appearance'];
  styles: AppearanceStyles;
  title: string;
  description: string | null | undefined;
  isEditingTitle: boolean;
  isEditingDescription: boolean;
  editedTitle: string;
  editedDescription: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTitleSave: () => void;
  onTitleCancel: () => void;
  onDescriptionSave: () => void;
  onDescriptionCancel: () => void;
  onStartEditTitle: () => void;
  onStartEditDescription: () => void;
  isReadOnly: boolean;
  canEdit: boolean;
  formError?: string | null;
}

const FormHeader: React.FC<FormHeaderProps> = ({
  appearance,
  styles,
  title,
  description,
  isEditingTitle,
  isEditingDescription,
  editedTitle,
  editedDescription,
  onTitleChange,
  onDescriptionChange,
  onTitleSave,
  onTitleCancel,
  onDescriptionSave,
  onDescriptionCancel,
  onStartEditTitle,
  onStartEditDescription,
  isReadOnly,
  canEdit,
  formError
}) => {
  return (
    <div className={`mb-8 ${styles.titleAlign}`}>
      <EditableTitle
        title={title}
        isEditing={isEditingTitle}
        editedTitle={editedTitle}
        onEditChange={onTitleChange}
        onSave={onTitleSave}
        onCancel={onTitleCancel}
        onStartEdit={onStartEditTitle}
        isReadOnly={isReadOnly}
        canEdit={canEdit}
        textColor={appearance?.textColor}
      />

      <EditableDescription
        description={description}
        isEditing={isEditingDescription}
        editedDescription={editedDescription}
        onEditChange={onDescriptionChange}
        onSave={onDescriptionSave}
        onCancel={onDescriptionCancel}
        onStartEdit={onStartEditDescription}
        isReadOnly={isReadOnly}
        canEdit={canEdit}
        textColor={appearance?.textColor}
      />

      {formError && (
        <div
          className="mb-4 p-3 rounded-xl border bg-[var(--color-bg-error-primary)] text-[var(--color-text-error-primary)]">
          {formError}
        </div>
      )}
    </div>
  );
};

// Extract form actions component
interface FormActionsProps {
  onSubmit?: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  onClear?: () => void;
  primaryColor?: string;
  isSubmitting?: boolean;
}

// Pick dark or white text depending on the button background brightness
const getContrastTextColor = (hex: string): string => {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return '#ffffff';
  const value = parseInt(match[1], 16);
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#101828' : '#ffffff';
};

const FormActions: React.FC<FormActionsProps> = ({ onSubmit, onClear, primaryColor, isSubmitting = false }) => {
  if (!onSubmit) return null;

  // Default to the brand color; a custom primary color from appearance settings overrides it
  const submitStyle: React.CSSProperties = primaryColor
    ? { backgroundColor: primaryColor, borderColor: primaryColor, color: getContrastTextColor(primaryColor) }
    : {
        backgroundColor: 'var(--color-bg-brand-primary)',
        borderColor: 'var(--color-bg-brand-primary)',
        color: '#181d27'
      };

  return (
    <div className="pt-6 flex justify-end gap-3 md:col-span-2">
      {onClear && (
        <button
          type="button"
          disabled={isSubmitting}
          className="rounded-lg border border-gray-300 bg-white px-4 h-10 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onClear}
        >
          Clear
        </button>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg border px-4 h-10 text-sm font-semibold shadow-sm transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={submitStyle}
      >
        Submit
      </button>
    </div>
  );
};

const FormBranding: React.FC = () => (
  <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-center gap-2">
    <span className="flex items-center justify-center w-6 h-6 rounded-md border border-gray-200 bg-white shadow-sm">
      <img src="/assets/logo.svg" alt="Sereni Base" className="w-4 h-4" />
    </span>
    <p className="text-xs text-gray-600">
      Powered by <span className="font-semibold text-gray-900">Sereni Base</span>
    </p>
  </div>
);

// Custom hook for drag and drop
interface UseDragAndDropOptions {
  fields: FormField[];
  visibleFields: FormField[];
  // Side-by-side rows are only supported in the single-column layout
  allowSideDrop: boolean;
  inlineFieldIds: string[];
  onFieldOrderChange: (newFields: FormField[]) => void;
  onInlineFieldIdsChange?: (inlineFieldIds: string[]) => void;
}

const isSameOrder = (a: FormField[], b: FormField[]) => a.length === b.length && a.every((f, i) => f.id === b[i].id);
const isSameIds = (a: string[], b: string[]) => a.length === b.length && a.every((id, i) => id === b[i]);

const useDragAndDrop = ({
  fields,
  visibleFields,
  allowSideDrop,
  inlineFieldIds,
  onFieldOrderChange,
  onInlineFieldIdsChange
}: UseDragAndDropOptions) => {
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [dragOverFieldId, setDragOverFieldId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<DropPosition | null>(null);

  const resetDragState = useCallback(() => {
    setDraggedFieldId(null);
    setDragOverFieldId(null);
    setDragOverPosition(null);
  }, []);

  const handleDragStart = useCallback((fieldId: string) => {
    setDraggedFieldId(fieldId);
  }, []);

  const handleDragOver = useCallback((fieldId: string, position: DropPosition = 'center') => {
    setDragOverFieldId(fieldId);
    setDragOverPosition(allowSideDrop ? position : 'center');
  }, [allowSideDrop]);

  const handleDrop = useCallback((fieldId: string, position: DropPosition = 'center') => {
    const result = draggedFieldId
      ? moveFieldOnDrop(fields, visibleFields, inlineFieldIds, draggedFieldId, fieldId, allowSideDrop ? position : 'center')
      : null;
    if (result) {
      if (!isSameOrder(result.fields, fields)) {
        onFieldOrderChange(result.fields);
      }
      if (!isSameIds(result.inlineFieldIds, inlineFieldIds)) {
        onInlineFieldIdsChange?.(result.inlineFieldIds);
      }
    }
    resetDragState();
  }, [draggedFieldId, fields, visibleFields, inlineFieldIds, allowSideDrop, onFieldOrderChange, onInlineFieldIdsChange, resetDragState]);

  return {
    draggedFieldId,
    dragOverFieldId,
    dragOverPosition,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd: resetDragState
  };
};

// Uploads an image file and returns its hosted URL via onUploaded
const useImageUpload = (onUploaded: (url: string) => void) => {
  const addImageMutation = useAddImage();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file', { title: 'Invalid File Type' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB', { title: 'File Too Large' });
      return;
    }

    setUploading(true);
    try {
      const response: any = await addImageMutation.mutateAsync({ files: [file] });
      const url = response?.data?.data?.url
        || response?.data?.url
        || response?.data?.data?.[0]?.url
        || response?.data?.[0]?.url
        || (typeof response?.data === 'string' ? response.data : '');
      if (!url) {
        toast.error('Failed to get image URL from response', { title: 'Upload Failed' });
        return;
      }
      onUploaded(url);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload image. Please try again.', { title: 'Upload Failed' });
    } finally {
      setUploading(false);
    }
  }, [addImageMutation, toast, onUploaded]);

  return { upload, uploading };
};

const imageButtonShadow = 'shadow-[inset_0_0_0_1px_rgba(10,13,18,0.18),inset_0_-2px_0_0_rgba(10,13,18,0.05),0_1px_2px_0_rgba(10,13,18,0.05)]';

interface FormBannerProps {
  bannerUrl?: string;
  canEdit: boolean;
  onUpload: (url: string) => void;
}

const FormBanner: React.FC<FormBannerProps> = ({ bannerUrl, canEdit, onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const { upload, uploading } = useImageUpload(onUpload);

  if (bannerUrl) {
    return <img src={bannerUrl} alt="Banner" className="w-full h-48 object-cover border-b" />;
  }

  if (!canEdit) return null;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 px-6 border-b transition-colors ${isDragOver ? 'bg-[var(--color-gray-100)]' : 'bg-[var(--color-gray-50)]'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        upload(e.dataTransfer.files?.[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => upload(e.target.files?.[0])}
      />
      <button
        type="button"
        aria-label="Upload banner"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className={`flex p-2.5 justify-center items-center rounded-lg bg-white ${imageButtonShadow}`}
      >
        {uploading
          ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          : <ImagePlus className="w-5 h-5 text-[var(--color-gray-600)]" />}
      </button>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm text-[var(--color-gray-600)]">
          <button
            type="button"
            className="font-semibold text-[var(--color-text-brand-secondary,#079455)] hover:underline"
            onClick={() => inputRef.current?.click()}
          >
            Click to add
          </button>{' '}
          a banner or drag and drop
        </p>
        <p className="text-xs text-[var(--color-gray-600)]">SVG, PNG, JPG or GIF (max. 800 × 400px)</p>
      </div>
    </div>
  );
};

interface FormLogoProps {
  logoUrl?: string;
  canEdit: boolean;
  overlapBanner: boolean;
  align: 'left' | 'center' | 'right';
  onUpload: (url: string) => void;
}

const overlapAlignClass = {
  left: 'left-6 md:left-[5.75rem]',
  center: 'left-1/2 -translate-x-1/2',
  right: 'right-6 md:right-[5.75rem]'
};

const inlineAlignClass = {
  left: '',
  center: 'justify-center',
  right: 'justify-end'
};

const FormLogo: React.FC<FormLogoProps> = ({ logoUrl, canEdit, overlapBanner, align, onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useImageUpload(onUpload);

  if (!logoUrl && !canEdit) return null;

  const positionClass = overlapBanner
    ? `absolute top-0 -translate-y-1/2 ${overlapAlignClass[align]}`
    : `mb-6 flex ${inlineAlignClass[align]}`;

  return (
    <div className={positionClass}>
      {logoUrl ? (
        <img src={logoUrl} alt="Logo" className="h-16 max-w-[10rem] object-contain rounded-lg bg-white border p-1" />
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => upload(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className={`flex items-center gap-2 h-9 px-3 rounded-lg bg-white text-sm font-semibold text-[var(--color-gray-700)] hover:bg-gray-50 ${imageButtonShadow}`}
          >
            {uploading
              ? <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              : <ImagePlus className="w-4 h-4 text-[var(--color-gray-500)]" />}
            <span>Add a logo</span>
          </button>
        </>
      )}
    </div>
  );
};

export const FormPreview: React.FC<FormPreviewProps> = ({
  config,
  selectedFieldId,
  rowData,
  onRowDataChange,
  onFieldOrderChange,
  onClear,
  onSubmit,
  onDeleteField,
  formError,
  model_id,
  row_id,
  onEdit,
  onConfigChange,
  isReadOnly = false,
  isSubmitting = false
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState(config.title);
  const [editedDescription, setEditedDescription] = useState(config.description || '');

  useEffect(() => {
    setEditedTitle(config.title);
    setEditedDescription(config.description || '');
  }, [config.title, config.description]);

  const appearance = config.appearance || {};
  const styles = useMemo(() => computeAppearanceStyles(appearance), [appearance]);
  const isGridLayout = appearance.fieldLayout === 'grid-2';

  const visibleFields = useMemo(() => {
    return config.fields.filter(shouldIncludeField);
  }, [config.fields]);

  const handleInlineFieldIdsChange = useCallback((inlineFieldIds: string[]) => {
    onConfigChange?.({ appearance: { ...appearance, inlineFieldIds } });
  }, [onConfigChange, appearance]);

  const {
    draggedFieldId,
    dragOverFieldId,
    dragOverPosition,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd
  } = useDragAndDrop({
    fields: config.fields,
    visibleFields,
    allowSideDrop: !isGridLayout && !!onConfigChange,
    inlineFieldIds: isGridLayout ? [] : appearance.inlineFieldIds ?? [],
    onFieldOrderChange,
    onInlineFieldIdsChange: handleInlineFieldIdsChange
  });

  const handleTitleSave = useCallback(() => {
    if (onConfigChange && editedTitle.trim() !== config.title) {
      onConfigChange({ title: editedTitle.trim() || config.title });
    }
    setIsEditingTitle(false);
  }, [onConfigChange, editedTitle, config.title]);

  const handleTitleCancel = useCallback(() => {
    setEditedTitle(config.title);
    setIsEditingTitle(false);
  }, [config.title]);

  const handleDescriptionSave = useCallback(() => {
    if (onConfigChange && editedDescription.trim() !== (config.description || '')) {
      onConfigChange({ description: editedDescription.trim() });
    }
    setIsEditingDescription(false);
  }, [onConfigChange, editedDescription, config.description]);

  const handleDescriptionCancel = useCallback(() => {
    setEditedDescription(config.description || '');
    setIsEditingDescription(false);
  }, [config.description]);

  const canEdit = !!onConfigChange;
  const logoOnBanner = !appearance.hideBanner && appearance.logoPosition !== 'below';

  return (
    <div className="min-h-screen" style={{ backgroundColor: appearance.backgroundColor || undefined }}>
      <div className="flex w-full py-6 px-4 flex-col items-center">
        <div className={`w-full ${styles.containerWidth} ${styles.rounded} border bg-white overflow-hidden ${styles.cardStyle}`}>
          {!appearance.hideBanner && (
            <FormBanner
              bannerUrl={appearance.bannerUrl}
              canEdit={canEdit && !isReadOnly}
              onUpload={(url) => onConfigChange?.({ appearance: { ...appearance, bannerUrl: url } })}
            />
          )}

          <div className={`relative px-6 md:px-[5.75rem] pb-10 ${logoOnBanner ? 'pt-12' : 'pt-8'}`}>
            <FormLogo
              logoUrl={appearance.logoUrl}
              canEdit={canEdit && !isReadOnly}
              overlapBanner={logoOnBanner}
              align={appearance.align || 'left'}
              onUpload={(url) => onConfigChange?.({ appearance: { ...appearance, logoUrl: url } })}
            />

          <FormHeader
            appearance={appearance}
            styles={styles}
            title={config.title}
            description={config.description}
            isEditingTitle={isEditingTitle}
            isEditingDescription={isEditingDescription}
            editedTitle={editedTitle}
            editedDescription={editedDescription}
            onTitleChange={setEditedTitle}
            onDescriptionChange={setEditedDescription}
            onTitleSave={handleTitleSave}
            onTitleCancel={handleTitleCancel}
            onDescriptionSave={handleDescriptionSave}
            onDescriptionCancel={handleDescriptionCancel}
            onStartEditTitle={() => setIsEditingTitle(true)}
            onStartEditDescription={() => setIsEditingDescription(true)}
            isReadOnly={isReadOnly}
            canEdit={canEdit}
            formError={formError}
          />

          <form
            className={isGridLayout ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-2'}
            onSubmit={onSubmit || ((e: React.SyntheticEvent<HTMLFormElement>) => {
              e.preventDefault();
            })}
          >
            <FormFieldsList
              fields={visibleFields}
              selectedFieldId={selectedFieldId}
              rowData={rowData}
              onRowDataChange={onRowDataChange}
              draggedFieldId={draggedFieldId}
              dragOverFieldId={dragOverFieldId}
              dragOverPosition={dragOverPosition}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onDeleteField={onDeleteField}
              appearance={appearance}
              model_id={model_id}
              row_id={row_id}
              onEdit={onEdit}
              isReadOnly={isReadOnly}
              isGridLayout={isGridLayout}
              isSubmitting={isSubmitting}
            />

            <FormActions
              onSubmit={onSubmit}
              onClear={onClear}
              primaryColor={appearance.primaryColor}
              isSubmitting={isSubmitting}
            />
          </form>

          {!appearance.hideNocoBranding && <FormBranding />}
          </div>
        </div>
      </div>
    </div>
  );
};
