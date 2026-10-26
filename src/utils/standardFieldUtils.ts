// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { normalizeFieldType } from './fieldType';
/**
 * Get the standardized field type from any field object
 */
export const getStandardFieldType = (field: any): string => {
  return field.type || field.uidt || field.dt || 'text';
};

/**
 * Get the normalized field type for FieldRenderer
 */
export const getNormalizedFieldType = (field: any): string => {
  const rawType = getStandardFieldType(field);
  return normalizeFieldType(rawType);
};

/**
 * Get field configuration (meta or config)
 */
export const getFieldConfig = (field: any): any => {
  return field.config || field.meta || {};
};

/**
 * Get field options for select/multiselect fields
 */
export const getFieldOptions = (field: any): string[] => {
  const config = getFieldConfig(field);
  return config.options || [];
};

/**
 * Get field display name
 */
export const getFieldDisplayName = (field: any): string => {
  return field.name || field.title || field.column_name || 'Untitled';
};

/**
 * Check if field is required
 */
export const isFieldRequired = (field: any): boolean => {
  return !!field.required;
};

/**
 * Check if field is system field
 */
export const isFieldSystem = (field: any): boolean => {
  return !!field.system;
};

/**
 * Check if field is hidden
 */
export const isFieldHidden = (field: any): boolean => {
  return !!field.hidden || !!field.is_hidden || !!field.deleted;
};

/**
 * Get the empty/initial value for a field based on its type.
 * Column defaults (meta.defaultValue) are applied by the database, not the frontend.
 */
export const getFieldDefaultValue = (field: any): any => {
  switch (getStandardFieldType(field)) {
    case 'boolean':
    case 'checkbox':
      return false;
    case 'rating':
      return 0;
    case 'multiSelect':
      return [];
    default:
      return '';
  }
};

/**
 * Create props for FieldRenderer component
 */
export const createFieldRendererProps = (field: any, value: any, onChange: (value: any) => void, additionalConfig: any = {}) => {
  const fieldType = getNormalizedFieldType(field);
  const config = getFieldConfig(field);
  
  // Extract isBorder and className from additionalConfig to pass as direct props
  const { isBorder, className, ...configOverrides } = additionalConfig;
  
  return {
    type: fieldType,
    value,
    onChange,
    isBorder,
    className,
    config: {
      ...config,
      ...configOverrides,
      options: getFieldOptions(field),
      required: isFieldRequired(field),
    },
  };
};