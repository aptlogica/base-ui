// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
/**
 * Utility functions for handling view field configuration
 * Handles nested meta structures and various data formats
 */

export interface FieldConfig {
  id: string;
  position: number;
  isHidden: boolean;
}

/**
 * Extracts fieldConfig from view meta, handling nested structures
 * Supports:
 * - meta.fieldConfig
 * - meta.meta.fieldConfig (nested structure)
 * - String format (JSON.parse needed)
 * - Array format
 */
export function extractFieldConfigFromMeta(meta: any): FieldConfig[] {
  if (!meta) return [];
  
  // Parse if string
  let rawMeta = meta;
  if (typeof meta === 'string' && meta.trim()) {
    try {
      rawMeta = JSON.parse(meta);
    } catch {
      return [];
    }
  }
  
  // Try meta.fieldConfig first, then meta.meta.fieldConfig (nested structure)
  const fieldConfigSource = rawMeta?.fieldConfig || rawMeta?.meta?.fieldConfig;
  
  if (!fieldConfigSource) return [];
  
  // Handle array or string format
  if (Array.isArray(fieldConfigSource)) {
    return fieldConfigSource.map(fc => ({ ...fc, id: String(fc.id) }));
  }
  
  if (typeof fieldConfigSource === 'string') {
    try {
      const parsed = JSON.parse(fieldConfigSource);
      return Array.isArray(parsed) ? parsed.map(fc => ({ ...fc, id: String(fc.id) })) : [];
    } catch {
      return [];
    }
  }
  
  return [];
}

/**
 * Generates default field config (first 3-4 fields visible)
 * @param columns - Array of columns
 * @param maxVisibleFields - Maximum number of visible fields (default: 4)
 * @param excludeFields - Field types to exclude from default visibility check
 */
export function generateDefaultFieldConfig(
  columns: Array<{ id?: string; system?: boolean; hidden?: boolean; type?: string; uidt?: string; title?: string; column_name?: string }>,
  maxVisibleFields: number = 4,
  excludeFields?: (column: any) => boolean
): FieldConfig[] {
  let visibleFieldCount = 0;
  
  return columns
    .filter((c) => c.id)
    .map((c, idx: number) => {
      if (!c.id) throw new Error('Column ID is required');
      
      const shouldExclude = excludeFields ? excludeFields(c) : false;
      const isSystemField = c.system || c.hidden || false;
      // Allow Title field even if it's a system field
      const isTitleField = c.title?.toLowerCase() === 'title' || c.column_name?.toLowerCase() === 'title';
      
      // If excluded OR (system field AND not Title), hide it
      if (shouldExclude || (isSystemField && !isTitleField)) {
        return { id: String(c.id), position: idx, isHidden: true };
      }
      
      if (visibleFieldCount < maxVisibleFields) {
        visibleFieldCount++;
        return { id: String(c.id), position: idx, isHidden: false };
      }
      
      return { id: String(c.id), position: idx, isHidden: true };
    });
}

/**
 * Merges existing fieldConfig with new columns, ensuring all columns are included
 * New columns default to hidden
 */
export function mergeFieldConfigWithColumns(
  existingFieldConfig: FieldConfig[],
  columns: Array<{ id?: string }>
): FieldConfig[] {
  const configMap = new Map(existingFieldConfig.map(fc => [fc.id, fc]));
  const completeConfig = [...existingFieldConfig];
  
  // Add any columns that exist but aren't in config (default to hidden)
  columns.forEach((col, idx) => {
    const colIdStr = String(col.id);
    if (col.id && !configMap.has(colIdStr)) {
      completeConfig.push({
        id: colIdStr,
        position: idx,
        isHidden: true
      });
    }
  });
  
  // Sort by position
  completeConfig.sort((a, b) => (a.position || 0) - (b.position || 0));
  
  return completeConfig;
}

