import { normalizeFieldType } from "../../../utils/fieldType";

// Safely parse meta which can be object or string
export function parseApiColumnMeta(meta: any): any {
  try {
    if (typeof meta === 'object' && meta !== null) return meta;
    if (typeof meta === 'string' && meta.trim()) return JSON.parse(meta);
    return {};
  } catch {
    return {};
  }
}

// Get default value for a field type from its config using canonical type keys
export function getDefaultValueFromConfig(fieldConfig: any, fieldType: string): any {
  if (!fieldConfig || typeof fieldConfig !== 'object') return '';
  if (fieldConfig.defaultValue !== undefined && fieldConfig.defaultValue !== null) {
    return fieldConfig.defaultValue;
  }
  const t = normalizeFieldType(fieldType);
  switch (t) {
    case 'boolean':
      return fieldConfig.checkboxDefault || false;
    case 'rating':
      return fieldConfig.ratingDefault || 0;
    case 'number':
    case 'decimal':
    case 'currency':
    case 'percent':
      return fieldConfig.defaultValue || '';
    case 'select':
      return fieldConfig.singleDefault || '';
    case 'multiSelect':
      return fieldConfig.multiDefault || [];
    case 'datetime':
      return fieldConfig.dateTimeDefault || '';
    case 'date':
      return fieldConfig.dateDefault || '';
    case 'time':
      return fieldConfig.timeDefault || '';
    case 'year':
      return fieldConfig.yearDefault || '';
    case 'phoneNumber':
      return fieldConfig.phoneDefault || '';
    case 'email':
      return fieldConfig.emailDefault || '';
    case 'url':
      return fieldConfig.urlDefault || '';
    case 'duration':
      return fieldConfig.durationDefault || '';
    case 'text':
    case 'longText':
    case 'json':
      return fieldConfig.defaultValue || '';
    default:
      return fieldConfig.defaultValue || '';
  }
}
