import React, { useEffect, useState } from 'react';
import { GripVertical, Trash, ChevronDown, ChevronUp, SquarePen } from 'lucide-react';
import FieldRenderer, { FieldRendererProps } from '../shared/FieldRenderer';
import { FormField, FormConfig } from '../../../../types/form';
import { normalizeFieldType, FieldRendererType } from '../../../../utils/fieldType';
import {
  getStandardFieldType,
  getFieldDisplayName,
  getFieldDefaultValue,
} from '../../../../utils/standardFieldUtils';

// Component for truncated descriptions with "see more" functionality
const DescriptionWithSeeMore: React.FC<{ description: string; appearance?: FormConfig['appearance'] }> = ({ description, appearance }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

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
  onSelect?: (fieldId: string) => void;
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
  appearance?: FormConfig['appearance'];
  // Props needed for attachment fields
  model_id?: string;
  column_id?: string;
  row_id?: number;
  onEdit?: (fieldId: string) => void;
  isReadOnly?: boolean;
}


export const SortableFormField: React.FC<SortableFormFieldProps> = ({
  field,
  isSelected,
  onSelect,
  value,
  onChange,
  draggable = false,
  isDragging = false,
  isDragOver = false,
  onDragStart = () => { },
  onDragOver = () => { },
  onDrop = () => { },
  onDragEnd = () => { },
  onDelete,
  appearance = {},
  model_id,
  column_id,
  row_id,
  onEdit,
  isReadOnly = false
}) => {
  // Apply appearance settings
  const labelPosition = appearance.labelPosition === 'left' ? 'flex-row items-center' : 'flex-col';

  // Create style object for input fields
  const inputStyle: React.CSSProperties = {
    color: appearance.textColor || undefined,
  };
  // Map field.type to FieldRenderer's expected type using shared util
  const mapFieldType = (type: string): FieldRendererType => normalizeFieldType(type);

  // Map field configuration to the format expected by field components
  const mapFieldConfig = (field: FormField) => {
    const baseConfig = field.config || {};
    // Always start with all config properties
    let config = { ...baseConfig };

    // For boolean fields, override with direct field properties if present
    if (field.type === 'boolean') {
      config = {
        ...config,
        icon: field.checkboxIcon || config.checkboxIcon || config.icon || 'check',
        color: field.checkboxColor || config.checkboxColor || config.color || 'green',
        defaultValue: field.checkboxDefault !== undefined ? field.checkboxDefault :
          config.checkboxDefault !== undefined ? config.checkboxDefault :
            config.defaultValue || false,
      };
    }
    // For rating fields, override with direct field properties if present
    else if (field.type === 'rating') {
      config = {
        ...config,
        ratingIcon: field.ratingIcon || config.ratingIcon || 'star',
        ratingColor: field.ratingColor || config.ratingColor || 'yellow',
        ratingMax: field.ratingMax !== undefined ? field.ratingMax : config.ratingMax || 5,
        ratingDefault: field.ratingDefault !== undefined ? field.ratingDefault : config.ratingDefault || 0,
      };
    }
    // For multiSelect fields
    else if (field.type === 'multiSelect') {
      config = {
        ...config,
        options: field.options || config.options || [],
        defaultValue: field.multiDefault || config.multiDefault || config.defaultValue || [],
      };
    }
    // For select fields
    else if (field.type === 'select') {
      config = {
        ...config,
        options: field.options || config.options || [],
        defaultValue: field.singleDefault || config.singleDefault || config.defaultValue || '',
      };
    }
    // For all other types, just use config and override defaultValue if present on field
    else {
      // Map legacy defaultValue properties for other types
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

  useEffect(() => {
    // Field configuration mapping is now handled by mapFieldConfig
  }, [field]);

  return (
    <div
      onDragOver={onDragOver !== undefined ? (e => { e.preventDefault(); onDragOver(); }) : undefined}
      onDrop={onDrop !== undefined ? (e => { e.preventDefault(); onDrop(); }) : undefined}
      className={`relative group space-y-2 p-4 rounded-xl transition-all select-none
        ${isSelected ? 'bg-[var(--color-utility-brand-50)] border-2 border-[var(--color-brand-200)] shadow-sm' : 'hover:bg-gray-100'}
        ${isDragging ? 'opacity-50 border-dashed border-2  border-[var(--color-brand-400)]' : ''}
        ${isDragOver ? 'ring-2 ring-[var(--ring-color-primary)]' : ''}`}
    // onClick={() => onSelect?.(field.id)}
    >
      {/* Drag Handle and Action Buttons - hide when handlers are undefined */}
      {(onEdit || onDelete || onDragStart) && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!field.isSystem && onEdit && (
            <button className='p-1 text-gray-400 hover:text-gray-600 bg-[var(--color-alpha-white)] rounded shadow-sm'
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(field.id);
              }}
            >
              <SquarePen className="w-4 h-4" />
            </button>
          )}
          {onDragStart && (
            <div
              className="p-1 text-gray-400 hover:text-gray-600 bg-[var(--color-alpha-white)] rounded shadow-sm cursor-grab active:cursor-grabbing"
              draggable={draggable}
              onDragStart={e => { e.stopPropagation(); onDragStart(); }}
              onDragEnd={e => { e.stopPropagation(); onDragEnd(); }}
            >
              <GripVertical className="w-4 h-4 " />
            </div>
          )}
          {!field.isSystem && onDelete && (
            <button
              type='button'
              className=" p-1 text-red-500 hover:text-red-700 bg-[var(--color-alpha-white)] rounded shadow-sm cursor-pointer"
              title="Delete field"
              onClick={e => {
                e.stopPropagation();
                onDelete(field.id);
              }}
            >
              <Trash className="w-4 h-4 " />
            </button>
          )}
        </div>
      )}

      <div className={`flex gap-4 ${labelPosition}`}>
        <label
          className={`text-sm font-medium ${appearance.labelPosition === 'left' ? 'w-32 flex-shrink-0' : 'block'}`}
          style={{ color: appearance.textColor || undefined }}
          onClick={(e) => e.stopPropagation()}
        >
          {getFieldDisplayName(field)}
          {field.required && <span className="ml-1 field-component-required">*</span>}
        </label>
        <div className={`flex-1 ${field.isSystem && field.column_name !== 'title' && field.title?.toLowerCase() !== 'title' ? 'pointer-events-none cursor-not-allowed' : ''}`} onClick={(e) => e.stopPropagation()}>
          <FieldRenderer
            type={mapFieldType(getStandardFieldType(field))}
            value={(() => {
              // Special handling for links fields
              if (field.type === 'links' || field.uidt === 'links') {
                // If value is undefined, null, or empty object, use empty array
                if (!value || (typeof value === 'object' && !Array.isArray(value))) {
                  return [];
                }
                return value;
              }
              // Special handling for duration fields: when value is explicitly undefined or empty string (from clearing),
              // pass null instead of default value to show format string placeholder
              if ((field.type === 'duration' || field.uidt === 'duration') && (value === undefined || value === '')) {
                return null;
              }
              // For other fields, use existing logic
              return value ? value : getFieldDefaultValue(field);
            })()}
            onChange={onChange}
            config={mapFieldConfig(field)}
            style={inputStyle}
            // Pass attachment-specific props for attachment fields
            {...(field.type === 'attachment' || field.uidt === 'attachment' ? {
              model_id,
              column_id: field.id,
              row_id,
              isBorder: true, // Form view: show border like other fields
              persistImmediately: false // Form view: don't persist immediately, use form state
            } : {})}
            // Pass links-specific props for links fields
            {...(field.type === 'links' || field.uidt === 'links' ? {
              field: {
                id: field.id,
                title: field.title,
                meta: field.meta || {}
              },
              currentRowId: row_id,
              currentTableId: model_id,
              persistImmediately: false, // Form view: don't persist immediately, use form state
              isBorder: true // Form view: show border like other fields
            } : {})}
            // Pass isBorder for all other field types
            {...(!(field.type === 'attachment' || field.uidt === 'attachment' || field.type === 'links' || field.uidt === 'links') ? {
              isBorder: true // Form view: show border like other fields
            } : {})}
          />
        </div>
      </div>
      {typeof field.description === 'string' && field.description && (
        <div onClick={(e) => e.stopPropagation()}>
          <DescriptionWithSeeMore description={field.description} appearance={appearance} />
        </div>
      )}
    </div>
  );
};