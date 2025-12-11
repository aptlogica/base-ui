/**
 * Shared utilities for syncing field/view configuration between table and view props
 * Used by both GridViewPlugin and FormViewPlugin
 */

import { BaseField } from './fieldUtils';

export interface FieldConfig {
  id: string;
  isHidden?: boolean;
  position?: number;
  width?: number;
  [key: string]: any;
}

export interface ViewConfig {
  fieldConfig?: FieldConfig[];
  [key: string]: any;
}

export interface ViewMeta {
  fieldConfig?: FieldConfig[];
  [key: string]: any;
}

export interface ConfigSyncResult {
  hydratedFields: BaseField[];
  needsUpdate: boolean;
  updatedConfig: ViewMeta; // Changed to ViewMeta
}

/**
 * Sync field configuration between table fields and view meta
 */
export const syncFieldConfig = (
  tableFields: BaseField[],
  viewMeta: ViewMeta
): ConfigSyncResult => {
  const baseFields = tableFields || [];
  const currentFieldConfig = viewMeta?.fieldConfig || [];

  let newFieldConfig = [...currentFieldConfig];
  let configNeedsUpdate = false;

  // Remove config entries for fields that no longer exist
  const baseFieldIds = new Set(baseFields.map(f => f.id));
  newFieldConfig = newFieldConfig.filter(conf => baseFieldIds.has(conf.id));

  // Add config entries for new fields
  baseFields.forEach((field, index) => {
    if (!newFieldConfig.find(conf => conf.id === field.id)) {
      newFieldConfig.push({
        id: field.id!,
        isHidden: false,
        position: newFieldConfig.length,
      });
      configNeedsUpdate = true;
    }
  });

  // Create hydrated fields with config applied
  const hydratedFields = baseFields.map(field => {
    const config = newFieldConfig.find(conf => conf.id === field.id) || {
      isHidden: false,
      position: -1,
      width: undefined
    };
    return {
      ...field,
      is_hidden: config.isHidden || false,
      isHidden: config.isHidden || false,
      hidden: config.isHidden || false,
      position: config.position ?? -1,
      width: config.width,
    };
  }).sort((a, b) => (a.position || 0) - (b.position || 0));

  const updatedConfig = {
    ...viewMeta,
    fieldConfig: newFieldConfig.map(({ id, isHidden, position, width, ...rest }) => ({ 
      id, 
      isHidden, 
      position,
      ...(width && { width }),
      ...rest 
    })),
  };

  return {
    hydratedFields,
    needsUpdate: configNeedsUpdate,
    updatedConfig,
  };
};

/**
 * Update field position in meta
 */
export const updateFieldPositions = (
  fields: BaseField[],
  currentMeta: ViewMeta
): ViewMeta => {
  const currentFieldConfig = currentMeta?.fieldConfig || [];
  const newFieldConfig = fields.map((field, index) => {
    const existingConfig = currentFieldConfig.find(c => c.id === field.id) || {};
    return {
      ...existingConfig,
      id: field.id!,
      position: index,
    };
  });

  return {
    ...currentMeta,
    fieldConfig: newFieldConfig,
  };
};

/**
 * Toggle field visibility in meta
 */
export const toggleFieldVisibility = (
  fieldId: string,
  currentMeta: ViewMeta
): ViewMeta => {
  const currentFieldConfig = currentMeta?.fieldConfig || [];
  
  const newFieldConfig = currentFieldConfig.map(conf => {
    if (conf.id === fieldId) {
      return { ...conf, isHidden: !conf.isHidden };
    }
    return conf;
  });

  // If field not found in config, add it
  if (!newFieldConfig.find(c => c.id === fieldId)) {
    newFieldConfig.push({ 
      id: fieldId, 
      isHidden: true, 
      position: newFieldConfig.length 
    });
  }

  return {
    ...currentMeta,
    fieldConfig: newFieldConfig,
  };
};

/**
 * Toggle all fields visibility in meta
 */
export const toggleAllFieldsVisibility = (
  visible: boolean,
  currentMeta: ViewMeta
): ViewMeta => {
  const currentFieldConfig = currentMeta?.fieldConfig || [];
  const isHidden = !visible;

  const newFieldConfig = currentFieldConfig.map(conf => ({
    ...conf,
    isHidden,
  }));

  return {
    ...currentMeta,
    fieldConfig: newFieldConfig,
  };
};

/**
 * Update field width in meta
 */
export const updateFieldWidth = (
  fieldId: string,
  width: number,
  currentMeta: ViewMeta
): ViewMeta => {
  const currentFieldConfig = currentMeta?.fieldConfig || [];
  
  const newFieldConfig = currentFieldConfig.map(conf => {
    if (conf.id === fieldId) {
      return { ...conf, width };
    }
    return conf;
  });

  // If field not found in config, add it
  if (!newFieldConfig.find(c => c.id === fieldId)) {
    newFieldConfig.push({ 
      id: fieldId, 
      width, 
      isHidden: false,
      position: newFieldConfig.length 
    });
  }

  return {
    ...currentMeta,
    fieldConfig: newFieldConfig,
  };
};

/**
 * Get field config by ID
 */
export const getFieldConfig = (
  fieldId: string,
  viewMeta: ViewMeta
): FieldConfig | undefined => {
  const fieldConfig = viewMeta?.fieldConfig || [];
  return fieldConfig.find(conf => conf.id === fieldId);
};

/**
 * Check if field is hidden
 */
export const isFieldHidden = (
  fieldId: string,
  viewMeta: ViewMeta
): boolean => {
  const config = getFieldConfig(fieldId, viewMeta);
  return config?.isHidden || false;
};

/**
 * Get field position
 */
export const getFieldPosition = (
  fieldId: string,
  viewMeta: ViewMeta
): number => {
  const config = getFieldConfig(fieldId, viewMeta);
  return config?.position ?? -1;
};

/**
 * Get field width
 */
export const getFieldWidth = (
  fieldId: string,
  viewMeta: ViewMeta
): number | undefined => {
  const config = getFieldConfig(fieldId, viewMeta);
  return config?.width;
};