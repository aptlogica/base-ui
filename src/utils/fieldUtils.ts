/**
 * Shared field utility functions for both GridViewPlugin and FormViewPlugin
 * Consolidates field type handling, default values, and data processing
 */

import { FieldType } from '../types/fieldTypes';

export interface BaseField {
  id?: string;
  name?: string;
  type: string;
  meta?: Record<string, any>; // Changed from config to meta
  required?: boolean;
  [key: string]: any;
}

/**
 * Get default value for a field based on its type and meta
 */
export const getFieldDefaultValue = (field: BaseField): any => {
  if (!field || !field.meta) return getTypeDefaultValue(field?.type || 'text');

  // Check for defaultValue in meta first
  if (field.meta.defaultValue !== undefined && field.meta.defaultValue !== null) {
    return field.meta.defaultValue;
  }

  // Type-specific default values from meta
  switch (field.type) {
    case 'checkbox':
    case 'boolean':
      return field.meta.checkboxDefault ?? false;
    case 'rating':
      return field.meta.ratingDefault ?? 0;
    case 'number':
    case 'decimal':
    case 'currency':
    case 'percent':
      return field.meta.defaultValue ?? '';
    case 'select':
      return field.meta.singleDefault ?? '';
    case 'multiSelect':
      return field.meta.multiDefault ?? [];
    case 'links':
      return field.meta.linksDefault ?? [];
    case 'datetime':
      return field.meta.dateTimeDefault ?? '';
    case 'date':
      return field.meta.dateDefault ?? '';
    case 'time':
      return field.meta.timeDefault ?? '';
    case 'year':
      return field.meta.yearDefault ?? '';
    case 'phone':
    case 'phoneNumber':
      return field.meta.phoneDefault ?? '';
    case 'email':
      return field.meta.emailDefault ?? '';
    case 'url':
      return field.meta.urlDefault ?? '';
    case 'duration':
      return field.meta.durationDefault ?? '';
    default:
      return field.meta.defaultValue ?? getTypeDefaultValue(field.type);
  }
};

/**
 * Get base default value for field type (no config)
 */
export const getTypeDefaultValue = (type: string): any => {
  switch (type) {
    case 'checkbox':
    case 'boolean':
      return false;
    case 'rating':
      return 0;
    case 'number':
    case 'decimal':
    case 'currency':
    case 'percent':
    case 'year':
      return '';
    case 'multiSelect':
      return [];
    case 'links':
      return [];
    case 'json':
      return {};
    default:
      return '';
  }
};

/**
 * Process field value based on field type for consistent data handling
 */
export const processFieldValue = (field: BaseField, value: unknown): any => {
  if (!field) return String(value);

  switch (field.type) {
    case 'formula':
      // Formula fields are calculated, not stored - return empty string for now
      // In the future, this will be replaced with actual formula evaluation
      return '';
    case 'checkbox':
    case 'boolean':
      return Boolean(value);
    case 'number':
    case 'decimal':
    case 'currency':
    case 'percent':
    case 'year':
    case 'rating':
      return Number(value) || 0;
    case 'multiSelect':
      // Ensure it's an array
      return Array.isArray(value) ? value : [];
    case 'json':
      // Preserve objects for JSON fields
      return value as any;
    default:
      return String(value);
  }
};

/**
 * Map field type aliases to canonical types
 */
export const mapFieldType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'dropdown': 'multiSelect',
    'radio': 'select',
    'textarea': 'longText',
    'file': 'attachment',
    'phone': 'phoneNumber',
  };
  
  return typeMap[type] || type;
};

/**
 * Check if a field is a system field
 */
export const isSystemField = (field: BaseField): boolean => {
  return field.isSystem || 
         ['id', 'created_at', 'updated_at', 'createdTime', 'lastModifiedTime', 'createdBy', 'lastModifiedBy'].includes(field.name || '');
};

/**
 * Check if a field type supports options (select, multiSelect)
 */
export const fieldSupportsOptions = (type: string): boolean => {
  return ['select', 'multiSelect', 'singleSelect'].includes(type);
};

/**
 * Get field configuration with proper defaults and type mapping
 */
export const mapFieldConfig = (field: BaseField) => {
  const baseMeta = field.meta || {};
  let meta = { ...baseMeta };

  // Type-specific meta mapping
  switch (field.type) {
    case 'boolean':
    case 'checkbox':
      meta = {
        ...meta,
        icon: field.checkboxIcon || meta.checkboxIcon || meta.icon || 'check',
        color: field.checkboxColor || meta.checkboxColor || meta.color || 'green',
        defaultValue: field.checkboxDefault !== undefined ? field.checkboxDefault :
          meta.checkboxDefault !== undefined ? meta.checkboxDefault :
          meta.defaultValue || false,
      };
      break;
    case 'rating':
      meta = {
        ...meta,
        ratingIcon: field.ratingIcon || meta.ratingIcon || 'star',
        ratingColor: field.ratingColor || meta.ratingColor || 'yellow',
        ratingMax: field.ratingMax !== undefined ? field.ratingMax : meta.ratingMax || 5,
        ratingDefault: field.ratingDefault !== undefined ? field.ratingDefault : meta.ratingDefault || 0,
      };
      break;
    case 'multiSelect':
      meta = {
        ...meta,
        options: field.options || meta.options || [],
        defaultValue: field.multiDefault || meta.multiDefault || meta.defaultValue || [],
      };
      break;
    case 'select':
      meta = {
        ...meta,
        options: field.options || meta.options || [],
        defaultValue: field.singleDefault || meta.singleDefault || meta.defaultValue || '',
      };
      break;
    default:
      // Handle other field types with specific defaults
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
        meta = { ...meta, defaultValue: defaultValue || meta.defaultValue };
      }
  }

  return meta;
};

/**
 * Initialize form/record data with field default values
 */
export const initializeFieldData = (fields: BaseField[]): Record<string, any> => {
  const data: Record<string, any> = {};
  fields.forEach(field => {
    if (field.id) {
      const defaultValue = getFieldDefaultValue(field);
      data[field.id] = defaultValue;
    }
  });
  return data;
};

/**
 * Validate required fields in data
 */
export const validateRequiredFields = (fields: BaseField[], data: Record<string, any>): BaseField[] => {
  return fields.filter(field => {
    if (!field.required) return false;
    const value = data[field.id || ''];
    return !String(value ?? '').trim();
  });
};

/**
 * Process field value for backend submission
 */
export const processFieldForBackend = (field: BaseField, value: any): any => {
  switch (field.type) {
    case 'formula':
      // Formula fields should not be sent to backend - they're calculated
      return null;
    case 'multiSelect':
      // Convert array to JSON string for backend
      return Array.isArray(value) ? JSON.stringify(value) : value;
    case 'user':
      // For user fields with allowMultiple, convert array to comma-separated string
      const userConfig = (field.meta as any) || {};
      if (userConfig.allowMultiple && Array.isArray(value)) {
        return value.filter(id => id && id.toString().trim()).join(',');
      }
      // For single user, return as-is (string ID)
      return value;
    case 'json':
      // Stringify objects for backend
      return typeof value === 'object' ? JSON.stringify(value) : value;
    default:
      return value;
  }
};

/**
 * Process field value from backend response
 */
export const processFieldFromBackend = (field: BaseField, value: any): any => {
  switch (field.type) {
    case 'formula':
      // Formula fields are calculated, not stored - return empty string
      return '';
    case 'multiSelect':
      // Parse JSON string from backend to array
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      }
      return Array.isArray(value) ? value : [];
    case 'user':
      // For user fields with allowMultiple, parse comma-separated string to array
      const userConfig = (field.meta as any) || {};
      if (userConfig.allowMultiple) {
        if (typeof value === 'string' && value.trim()) {
          // Split by comma and filter out empty values
          return value.split(',').map(id => id.trim()).filter(id => id.length > 0);
        }
        return Array.isArray(value) ? value : [];
      }
      // For single user, return as-is (string ID or null)
      return value;
    case 'json':
      // Parse JSON string from backend to object
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return {};
        }
      }
      return value;
    default:
      return value;
  }
};

/**
 * Check if a field is a formula field
 */
export const isFormulaField = (field: BaseField): boolean => {
  return field.type === 'formula' || field.uidt === 'formula';
};

/**
 * Check if a field should be editable (not formula, not system, not virtual)
 */
export const isEditableField = (field: BaseField): boolean => {
  return !isFormulaField(field) && !field.system && !field.virtual;
};