// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';
import { GripVertical, Trash, ChevronDown, ChevronUp, SquarePen } from 'lucide-react';
import FieldRenderer from '../shared/FieldRenderer';
import { FormField, FormConfig } from '../../../../types/form';
import { normalizeFieldType } from '../../../../utils/fieldType';
import {
  getStandardFieldType,
  getFieldDisplayName,
  getFieldDefaultValue,
} from '../../../../utils/standardFieldUtils';

// Component for truncated descriptions with "see more" functionality
const DescriptionWithSeeMore: React.FC<{ description: string; appearance?: NonNullable<FormConfig['appearance']> }> = ({ description, appearance }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 175; // Characters to show before truncation
  const shouldTruncate = description.length > maxLength;

  const displayText = isExpanded || !shouldTruncate ? description : description.substring(0, maxLength) + '...';
  const primaryColor = appearance?.primaryColor || '#2563eb';

  return (
    <div className="text-sm" style={{ color: appearance?.textColor || undefined }}>
      <p className="whitespace-pre-wrap">{displayText}</p>
      {shouldTruncate && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-1 text-xs font-medium flex items-center gap-1 transition-colors"
          style={{ color: primaryColor }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              See less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              See more
            </>
          )}
        </button>
      )}
    </div>
  );
};

interface SortableFormFieldProps {
  field: FormField;
  isSelected?: boolean;
  value?: unknown;
  onChange?: (value: unknown) => void;
  draggable?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: () => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
  onDelete?: (fieldId: string) => void;
  appearance?: NonNullable<FormConfig['appearance']>;
  // Props needed for attachment fields
  model_id?: string;
  row_id?: number;
  onEdit?: (fieldId: string) => void;
  isReadOnly?: boolean;
  isSubmitting?: boolean;
}

// Extract field configuration mapping logic
const mapFieldConfig = (field: FormField) => {
  const baseConfig = field.config || {};
  let config = { ...baseConfig };

  if (field.type === 'boolean') {
    config = {
      ...config,
      icon: field.checkboxIcon || config.checkboxIcon || config.icon || 'check',
      color: field.checkboxColor || config.checkboxColor || config.color || 'green',
      defaultValue: field.checkboxDefault ?? config.checkboxDefault ?? config.defaultValue ?? false,
    };
  } else if (field.type === 'rating') {
    config = {
      ...config,
      ratingIcon: field.ratingIcon || config.ratingIcon || 'star',
      ratingColor: field.ratingColor || config.ratingColor || 'yellow',
      ratingMax: field.ratingMax === undefined ? config.ratingMax || 5 : field.ratingMax,
      ratingDefault: field.ratingDefault === undefined ? config.ratingDefault || 0 : field.ratingDefault,
    };
  } else if (field.type === 'multiSelect') {
    config = {
      ...config,
      options: field.options || config.options || [],
      defaultValue: field.multiDefault || config.multiDefault || config.defaultValue || [],
    };
  } else if (field.type === 'select') {
    config = {
      ...config,
      options: field.options || config.options || [],
      defaultValue: field.singleDefault || config.singleDefault || config.defaultValue || '',
    };
  } else {
    const fieldTypeDefaults: Record<string, any> = {
      'text': field.defaultValue,
      'longText': field.defaultValue,
      'number': field.defaultValue,
      'decimal': field.defaultValue,
      'year': field.yearDefault,
      'time': field.timeDefault,
      'date': field.defaultValue,
      'datetime': field.dateTimeDefault,
      'email': field.emailDefault,
      'phoneNumber': field.phoneDefault,
      'url': field.urlDefault,
      'percent': field.percentDefault,
      'duration': field.durationDefault,
      'currency': field.defaultValue,
    };
    const defaultValue = fieldTypeDefaults[field.type];
    if (defaultValue !== undefined) {
      config = { ...config, defaultValue: defaultValue || config.defaultValue };
    }
  }
  return config;
};

// Extract value computation logic
const computeFieldValue = (field: FormField, value: unknown): unknown => {
  if (field.type === 'links' || field.uidt === 'links') {
    if (!value || (typeof value === 'object' && !Array.isArray(value))) {
      return [];
    }
    return value;
  }
  
  if ((field.type === 'duration' || field.uidt === 'duration') && (value === undefined || value === '')) {
    return getFieldDefaultValue(field) || null;
  }
  
  // For boolean fields, false is a valid value, so only use default if value is undefined/null
  if (field.type === 'boolean' || field.uidt === 'boolean') {
    return value ?? getFieldDefaultValue(field);
  }
  
  // For other fields, use default if value is undefined/null/empty string
  return (value !== undefined && value !== null && value !== '') ? value : getFieldDefaultValue(field);
};

// Extract FieldRenderer props preparation
const getFieldRendererProps = (
  field: FormField,
  value: unknown,
  model_id: string | undefined,
  row_id: number | undefined,
  isReadOnly: boolean,
  inputStyle: React.CSSProperties
) => {
  const baseProps = {
    type: normalizeFieldType(getStandardFieldType(field)),
    value: computeFieldValue(field, value),
    config: mapFieldConfig(field),
    style: inputStyle,
    readOnly: isReadOnly,
    allowEdit: !isReadOnly,
  };

  const isAttachment = field.type === 'attachment' || field.uidt === 'attachment';
  const isLinks = field.type === 'links' || field.uidt === 'links';

  if (isAttachment) {
    return {
      ...baseProps,
      model_id,
      column_id: field.id,
      row_id,
      isBorder: true,
      persistImmediately: false
    };
  }

  if (isLinks) {
    return {
      ...baseProps,
      field: {
        id: field.id,
        title: field.title,
        meta: field.meta || {}
      },
      currentRowId: row_id,
      currentTableId: model_id,
      persistImmediately: false,
      isBorder: true,
      disabled: isReadOnly
    };
  }

  return {
    ...baseProps,
    isBorder: true
  };
};

// Extract action buttons rendering
const ActionButtons: React.FC<{
  field: FormField;
  isReadOnly: boolean;
  onEdit?: (fieldId: string) => void;
  onDelete?: (fieldId: string) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  draggable: boolean;
}> = ({ field, isReadOnly, onEdit, onDelete, onDragStart, onDragEnd, draggable }) => {
  const hasActions = !isReadOnly && (onEdit || onDelete || (onDragStart && draggable));
  
  if (!hasActions) {
    return null;
  }

  return (
    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {!field.isSystem && onEdit && (
        <button
          type="button"
          className="p-1 text-gray-400 hover:text-gray-600 bg-[var(--color-alpha-white)] rounded shadow-sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(field.id);
          }}
          aria-label="Edit field"
        >
          <SquarePen className="w-4 h-4" />
        </button>
      )}
      {onDragStart && (
        <button
          type="button"
          className="p-1 text-gray-400 hover:text-gray-600 bg-[var(--color-alpha-white)] rounded shadow-sm cursor-grab active:cursor-grabbing"
          draggable={draggable}
          onDragStart={e => { e.stopPropagation(); onDragStart(); }}
          onDragEnd={e => { e.stopPropagation(); onDragEnd?.(); }}
          aria-label="Drag to reorder field"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}
      {!field.isSystem && onDelete && (
        <button
          type="button"
          className="p-1 text-red-500 hover:text-red-700 bg-[var(--color-alpha-white)] rounded shadow-sm cursor-pointer"
          title="Delete field"
          onClick={e => {
            e.stopPropagation();
            onDelete(field.id);
          }}
          aria-label="Delete field"
        >
          <Trash className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Extract container className computation
const getContainerClassName = (isSelected: boolean, isDragging: boolean, isDragOver: boolean, labelPosition?: string): string => {
  const spacing = labelPosition === 'left' ? 'space-y-7' : 'space-y-2';
  return `relative group ${spacing} p-4 rounded-xl transition-all select-none
    ${isSelected ? 'bg-[var(--color-utility-brand-50)] border-2 border-[var(--color-brand-200)] shadow-sm' : 'hover:bg-gray-50'}
    ${isDragging ? 'opacity-50 border-dashed border-2  border-[var(--color-brand-400)]' : ''}
    ${isDragOver ? 'ring-2 ring-[var(--ring-color-primary)]' : ''}`;
};

// Extract drag handlers setup
const createDragHandlers = (
  onDragOver?: () => void,
  onDrop?: () => void
) => {
  const handleDragOver = onDragOver ? (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver();
  } : undefined;

  const handleDrop = onDrop ? (e: React.DragEvent) => {
    e.preventDefault();
    onDrop();
  } : undefined;

  return { handleDragOver, handleDrop };
};

// Extract field content rendering
const FieldContent: React.FC<{
  field: FormField;
  appearance?: NonNullable<FormConfig['appearance']>;
  fieldRendererProps: any;
  onChange?: (value: unknown) => void;
  isReadOnly: boolean;
  isSubmitting?: boolean;
}> = ({ field, appearance = {}, fieldRendererProps, onChange, isReadOnly, isSubmitting = false }) => {
  const labelPosition = appearance?.labelPosition === 'left' ? 'flex-row items-center' : 'flex-col';
  const isSystemField = field.isSystem && field.column_name !== 'title' && field.title?.toLowerCase() !== 'title';
  
  return (
    <>
      <div className={`flex gap-4 ${labelPosition} ${appearance?.labelPosition === 'left' ? 'relative' : ''}`}>
        <label
          className={`text-sm font-medium ${appearance?.labelPosition === 'left' ? 'w-32 flex-shrink-0' : 'block'}`}
          style={{ color: appearance?.textColor || undefined }}
        >
          {getFieldDisplayName(field)}
          {field.required && <span className="ml-1 field-component-required">*</span>}
        </label>
        <div className={`flex-1 ${isSystemField || isSubmitting ? 'pointer-events-none cursor-not-allowed opacity-60' : ''} ${appearance?.labelPosition === 'left' ? 'relative' : ''}`}>
          <FieldRenderer
            {...fieldRendererProps}
            onChange={isReadOnly || isSubmitting ? undefined : onChange}
            disabled={isReadOnly || isSubmitting}
          />
        </div>
      </div>
      {typeof field.description === 'string' && field.description && (
        <div>
          <DescriptionWithSeeMore description={field.description} appearance={appearance} />
        </div>
      )}
    </>
  );
};

export const SortableFormField: React.FC<SortableFormFieldProps> = ({
  field,
  isSelected,
  value,
  onChange,
  draggable = false,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onDelete,
  appearance = {},
  model_id,
  row_id,
  onEdit,
  isReadOnly = false,
  isSubmitting = false
}) => {
  const inputStyle: React.CSSProperties = {
    color: appearance.textColor || undefined,
  };
  
  const fieldRendererProps = getFieldRendererProps(
    field,
    value,
    model_id,
    row_id,
    isReadOnly ?? false,
    inputStyle
  );

  const { handleDragOver, handleDrop } = createDragHandlers(onDragOver, onDrop);
  const containerClassName = getContainerClassName(isSelected ?? false, isDragging ?? false, isDragOver ?? false, appearance?.labelPosition);

  // Drag-and-drop zones are mouse/touch based and don't require keyboard handlers
  const ContainerTag = (handleDragOver || handleDrop) ? 'section' : 'div';
  
  return React.createElement(
    ContainerTag,
    {
      onDragOver: handleDragOver,
      onDrop: handleDrop,
      className: containerClassName,
      ...(handleDragOver || handleDrop ? { 'aria-label': 'Drag and drop zone' } : {})
    },
    <>
      <ActionButtons
        field={field}
        isReadOnly={isReadOnly}
        onEdit={onEdit}
        onDelete={onDelete}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        draggable={draggable}
      />
      <FieldContent
        field={field}
        appearance={appearance}
        fieldRendererProps={fieldRendererProps}
        onChange={onChange}
        isReadOnly={isReadOnly}
        isSubmitting={isSubmitting}
      />
    </>
  );
};