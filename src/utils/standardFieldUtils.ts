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
 * Get field default value from config
 */
export const getFieldDefaultValue = (field: any): any => {
  const config = getFieldConfig(field);
  const fieldType = getStandardFieldType(field);
  
  if (config.defaultValue !== undefined && config.defaultValue !== null) {
    return config.defaultValue;
  }
  
  // Type-specific defaults
  switch (fieldType) {
    case 'boolean':
    case 'checkbox':
      return config.checkboxDefault ?? false;
    case 'rating':
      return config.ratingDefault ?? 0;
    case 'number':
    case 'decimal':
    case 'currency':
    case 'percent':
      return config.defaultValue ?? '';
    case 'select':
      return config.singleDefault ?? '';
    case 'multiSelect':
      return config.multiDefault ?? [];
    case 'datetime':
      return config.dateTimeDefault ?? '';
    case 'date':
      return config.dateDefault ?? '';
    case 'time':
      return config.timeDefault ?? '';
    case 'year':
      return config.yearDefault ?? '';
    case 'email':
      return config.emailDefault ?? '';
    case 'url':
      return config.urlDefault ?? '';
    case 'duration':
      return config.durationDefault ?? '';
    default:
      return config.defaultValue ?? '';
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