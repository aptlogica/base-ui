// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
/**
 * Shared field utility functions for both GridViewPlugin and FormViewPlugin
 * Consolidates field type handling, default values, and data processing
 */

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
  if (!field?.meta) return getTypeDefaultValue(field?.type || 'text');

  // C!field?.metafirst
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
 * Check if a field is a system field
 */
export const isSystemField = (field: BaseField): boolean => {
  return field.isSystem ||
    ['id', 'created_at', 'updated_at', 'createdTime', 'lastModifiedTime', 'createdBy', 'lastModifiedBy'].includes(field.name || '');
};

/**
 * Get field configuration with proper defaults and type mapping
 */
export const mapFieldConfig = (field: BaseField) => {
  const baseMeta = field.meta || {};
  let meta = { ...baseMeta };

  // Helper function to determine the default value
  const determineDefaultValue = () => {
    if (field.checkboxDefault !== undefined) {
      return field.checkboxDefault;
    }
    if (meta.checkboxDefault !== undefined) {
      return meta.checkboxDefault;
    }
    return meta.defaultValue || false;
  };
  // Type-specific meta mapping
  switch (field.type) {
    case 'boolean':
    case 'checkbox':
      meta = {
        ...meta,
        icon: field.checkboxIcon || meta.checkboxIcon || meta.icon || 'check',
        color: field.checkboxColor || meta.checkboxColor || meta.color || 'green',
        defaultValue: determineDefaultValue(),
      }
      break;
    case 'rating':
      meta = {
        ...meta,
        ratingIcon: field.ratingIcon || meta.ratingIcon || 'star',
        ratingColor: field.ratingColor || meta.ratingColor || 'yellow',
        ratingMax: field.ratingMax === undefined ? meta.ratingMax || 5 : field.ratingMax,
        ratingDefault: field.ratingDefault === undefined ? meta.ratingDefault || 0 : field.ratingDefault,
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
      {
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
  }

  return meta;
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
 * Check if a field is a formula field
 */
export const isFormulaField = (field: BaseField): boolean => {
  return field.type === 'formula' || field.uidt === 'formula';
};
