// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SortableFormField, DropPosition } from './SortableFormField';
import { buildFieldRows, moveFieldOnDrop } from './fieldRows';
import { FormField, FormConfig } from '../../../../types/form';
import { isFormulaField } from '../../../../utils/fieldUtils';
import { useImageUpload } from '../shared/useImageUpload';
import { ImagePlus, Trash2 } from 'lucide-react';

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
interface InlineEditProps {
  isEditing: boolean;
  onEditChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
  isReadOnly: boolean;
  canEdit: boolean;
  textColor?: string;
}

interface EditableTitleProps extends InlineEditProps {
  title: string;
  editedTitle: string;
}

// An empty text color falls back to the theme color
const getTextStyle = (textColor?: string): React.CSSProperties => ({ color: textColor || undefined });

const handleTitleKeyDown = (e: React.KeyboardEvent, onSave: () => void, onCancel: () => void) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    onSave();
  } else if (e.key === 'Escape') {
    onCancel();
  }
};

// Inline editors mount only after the user chooses to edit, so move focus into them
const focusOnMount = (element: HTMLElement | null) => element?.focus();

const handleViewKeyDown = (e: React.KeyboardEvent, onStartEdit: () => void) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onStartEdit();
  }
};

const EditableTitle: React.FC<Readonly<EditableTitleProps>> = ({
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
        className="mb-2 [text-align:inherit] -mx-2 w-[calc(100%+1rem)] text-xl font-semibold focus:outline-none bg-[var(--color-hover-bg)] text-[var(--color-text-primary)] border-none px-2 py-1 rounded-lg"
        style={getTextStyle(textColor)}
        ref={focusOnMount}
      />
    );
  }

  if (canEdit && !isReadOnly) {
    return (
      <button
        type="button"
        className="mb-2 -mx-2 px-2 py-1 [text-align:inherit] text-[1.25rem] text-[var(--color-text-primary)] font-semibold rounded-lg cursor-pointer hover:bg-[var(--color-hover-bg)] transition-colors w-[calc(100%+1rem)]"
        style={getTextStyle(textColor)}
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
      className="mb-2 text-xl font-semibold py-1 text-[var(--color-text-primary)]"
      style={getTextStyle(textColor)}
    >
      {title}
    </h1>
  );
};

// Extract editable description component
interface EditableDescriptionProps extends InlineEditProps {
  description: string | null | undefined;
  editedDescription: string;
}

const handleDescriptionKeyDown = (e: React.KeyboardEvent, onCancel: () => void) => {
  if (e.key === 'Escape') {
    onCancel();
  }
};

const renderDescriptionContent = (description: string | null | undefined, textColor?: string) => {
  if (description) {
    return (
      <p className="text-sm leading-relaxed text-[var(--color-gray-600)]" style={getTextStyle(textColor)}>
        {description}
      </p>
    );
  }
  return (
    <p className="text-[0.875rem] font-medium leading-relaxed text-[var(--color-gray-500)]" style={getTextStyle(textColor)}>
      Add form description
    </p>
  );
};

const EditableDescription: React.FC<Readonly<EditableDescriptionProps>> = ({
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
        className="-mx-2 w-[calc(100%+1rem)] text-sm leading-relaxed focus:outline-none resize-none bg-[var(--color-hover-bg)] text-[var(--color-text-primary)] border-none px-2 py-1 rounded-lg"
        style={getTextStyle(textColor)}
        ref={focusOnMount}
      />
    );
  }

  if (canEdit && !isReadOnly) {
    return (
      <button
        type="button"
        className="-mx-2 px-2 py-1 rounded-lg cursor-pointer hover:bg-[var(--color-hover-bg)] transition-colors w-[calc(100%+1rem)] text-left"
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

type RenderFormFieldParams = Omit<FormFieldsListProps, 'fields'> & {
  field: FormField;
};

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
    <div key={field.id} className={containerClass}>
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

const FormFieldsList: React.FC<Readonly<FormFieldsListProps>> = ({ fields, ...fieldProps }) => {
  const { appearance, isGridLayout } = fieldProps;
  const renderField = (field: FormField) => renderFormField({ ...fieldProps, field });

  if (isGridLayout) {
    return <>{fields.map((field) => renderField(field))}</>;
  }

  // Single-column layout: fields dropped beside each other share a row
  return (
    <>
      {buildFieldRows(fields, appearance?.inlineFieldIds).map((row) =>
        row.length === 1
          ? renderField(row[0])
          : (
            <div key={row.map(f => f.id).join('-')} className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="form-field-row">
              {row.map(field => renderField(field))}
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

const FormHeader: React.FC<Readonly<FormHeaderProps>> = ({
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
    <div className="mb-8">
      <div className={styles.titleAlign}>
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
      </div>

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
  const value = Number.parseInt(match[1], 16);
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#101828' : '#ffffff';
};

const FormActions: React.FC<Readonly<FormActionsProps>> = ({ onSubmit, onClear, primaryColor, isSubmitting = false }) => {
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
          className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-card)] px-4 h-10 text-sm font-semibold text-[var(--color-text-secondary)] shadow-sm transition-colors hover:bg-[var(--color-hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
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
  <div className="mt-6 pt-6 border-t border-[var(--color-border-secondary)] flex items-center justify-center gap-2">
    <img src="/assets/sereni-logo.svg" alt="Sereni Base" className="w-[1.625rem] h-[1.625rem]" />
    <p className="text-xs text-[var(--color-text-tertiary)]">
      Powered by <span className="font-semibold text-[var(--color-text-primary)]">Sereni Base</span>
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
    const dropPosition = allowSideDrop ? position : 'center';
    const result = draggedFieldId
      ? moveFieldOnDrop(fields, visibleFields, inlineFieldIds, draggedFieldId, fieldId, dropPosition)
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

const imageButtonShadow = 'shadow-[inset_0_0_0_1px_rgba(10,13,18,0.18),inset_0_-2px_0_0_rgba(10,13,18,0.05),0_1px_2px_0_rgba(10,13,18,0.05)]';

interface FormBannerProps {
  bannerUrl?: string;
  canEdit: boolean;
  onUpload: (url: string) => void;
  onRemove: () => void;
}

const FormBanner: React.FC<Readonly<FormBannerProps>> = ({ bannerUrl, canEdit, onUpload, onRemove }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const { upload, uploading } = useImageUpload(onUpload);

  if (bannerUrl) {
    if (!canEdit) {
      return <img src={bannerUrl} alt="Banner" className="w-full h-48 object-cover border-b" />;
    }

    return (
      <div className="relative group">
        <img src={bannerUrl} alt="Banner" className="w-full h-48 object-cover border-b" />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <div
          className={`absolute inset-0 flex items-center justify-center gap-2 transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}
        >
          <button
            type="button"
            aria-label="Change banner"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className={`flex p-2.5 justify-center items-center rounded-lg bg-[var(--color-card)] hover:bg-[var(--color-hover-bg)] ${imageButtonShadow}`}
          >
            {uploading
              ? <div className="w-5 h-5 border-2 border-[var(--color-gray-300)] border-t-[var(--color-gray-600)] rounded-full animate-spin" />
              : <ImagePlus className="w-5 h-5 text-[var(--color-gray-600)]" />}
          </button>
          <button
            type="button"
            aria-label="Remove banner"
            disabled={uploading}
            onClick={onRemove}
            className={`flex p-2.5 justify-center items-center rounded-lg bg-[var(--color-card)] hover:bg-[var(--color-hover-bg)] ${imageButtonShadow}`}
          >
            <Trash2 className="w-5 h-5 text-[var(--color-error-600)]" />
          </button>
        </div>
      </div>
    );
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
        void upload(e.dataTransfer.files?.[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { void upload(e.target.files?.[0]); }}
      />
      <button
        type="button"
        aria-label="Upload banner"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className={`flex p-2.5 justify-center items-center rounded-lg bg-[var(--color-card)] border ${imageButtonShadow}`}
      >
        {uploading
          ? <div className="w-5 h-5 border-2 border-[var(--color-gray-300)] border-t-[var(--color-gray-600)] rounded-full animate-spin" />
          : <ImagePlus className="w-5 h-5 text-[var(--color-gray-600)]" />}
      </button>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-[0.875rem] font-normal text-[var(--color-text-tertiary)]">
          <button
            type="button"
            className="font-semibold text-[var(--color-brand-600)] hover:underline text-sm"
            onClick={() => inputRef.current?.click()}
          >
            Click to add
          </button>{' '}
          a banner or drag and drop
        </p>
        <p className="text-[0.75rem] text-[var(--color-text-tertiary)] font-normal">SVG, PNG, JPG or GIF (max. 800 × 400px)</p>
      </div>
    </div>
  );
};

interface FormLogoProps {
  logoUrl?: string;
  canEdit: boolean;
  overlapBanner: boolean;
  onUpload: (url: string) => void;
  onRemove: () => void;
}

const FormLogo: React.FC<Readonly<FormLogoProps>> = ({ logoUrl, canEdit, overlapBanner, onUpload, onRemove }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useImageUpload(onUpload);

  if (!logoUrl && !canEdit) return null;

  const positionClass = overlapBanner
    ? 'absolute top-0 -translate-y-1/2 left-6 md:left-[5.75rem]'
    : 'mb-6 flex';

  return (
    <div className={positionClass}>
      {logoUrl ? (
        <div className="relative group inline-flex">
          <img src={logoUrl} alt="Logo" className="h-16 max-w-[10rem] object-contain rounded-lg bg-[var(--color-card)] border border-[var(--color-border-primary)] p-1" />
          {canEdit && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <button
                type="button"
                aria-label="Remove logo"
                onClick={onRemove}
                className={`flex p-2 justify-center items-center rounded-lg bg-[var(--color-card)] hover:bg-[var(--color-hover-bg)] ${imageButtonShadow}`}
              >
                <Trash2 className="w-4 h-4 text-[var(--color-error-600)]" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { void upload(e.target.files?.[0]); }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className={`flex items-center gap-2 h-9 px-3 rounded-lg bg-[var(--color-card)] text-sm font-semibold text-[var(--color-gray-700)] hover:bg-[var(--color-hover-bg)] border ${imageButtonShadow}`}
          >
            {uploading
              ? <div className="w-4 h-4 border-2 border-[var(--color-gray-300)] border-t-[var(--color-gray-600)] rounded-full animate-spin" />
              : <ImagePlus className="w-4 h-4 text-[var(--color-gray-500)]" />}
            <span className='text-[0.875rem] font-semibold text-[var(--color-text-primary)]'>Add a logo</span>
          </button>
        </>
      )}
    </div>
  );
};

export const FormPreview: React.FC<Readonly<FormPreviewProps>> = ({
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
  const [editedDescription, setEditedDescription] = useState(config.description ?? '');

  useEffect(() => {
    setEditedTitle(config.title);
    setEditedDescription(config.description ?? '');
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
    if (onConfigChange && editedDescription.trim() !== (config.description ?? '')) {
      onConfigChange({ description: editedDescription.trim() });
    }
    setIsEditingDescription(false);
  }, [onConfigChange, editedDescription, config.description]);

  const handleDescriptionCancel = useCallback(() => {
    setEditedDescription(config.description ?? '');
    setIsEditingDescription(false);
  }, [config.description]);

  const canEdit = !!onConfigChange;
  const logoOnBanner = !appearance.hideBanner && appearance.logoPosition !== 'below';

  return (
    <div className="min-h-screen" style={{ backgroundColor: appearance.backgroundColor || undefined }}>
      <div className="flex w-full py-6 px-4 flex-col items-center">
        <div className={`w-full ${styles.containerWidth} ${styles.rounded} border border-[var(--color-border-primary)] bg-[var(--color-card)] overflow-hidden ${styles.cardStyle}`}>
          {!appearance.hideBanner && (
            <FormBanner
              bannerUrl={appearance.bannerUrl}
              canEdit={canEdit && !isReadOnly}
              onUpload={(url) => onConfigChange?.({ appearance: { ...appearance, bannerUrl: url } })}
              onRemove={() => onConfigChange?.({ appearance: { ...appearance, bannerUrl: undefined } })}
            />
          )}

          <div className={`relative px-6 md:px-[5.75rem] pb-10 ${logoOnBanner ? 'pt-12' : 'pt-8'}`}>
            <FormLogo
              logoUrl={appearance.logoUrl}
              canEdit={canEdit && !isReadOnly}
              overlapBanner={logoOnBanner}
              onUpload={(url) => onConfigChange?.({ appearance: { ...appearance, logoUrl: url } })}
              onRemove={() => onConfigChange?.({ appearance: { ...appearance, logoUrl: undefined } })}
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
              onSubmit={onSubmit ?? ((e: React.SyntheticEvent<HTMLFormElement>) => {
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
