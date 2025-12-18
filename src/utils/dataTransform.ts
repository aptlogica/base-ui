/**
 * Shared data transformation utilities for both GridViewPlugin and FormViewPlugin
 * Handles record/field data transformations, formatting, and processing
 */

import { BaseField, processFieldValue, processFieldForBackend, processFieldFromBackend } from './fieldUtils';

export interface RecordData {
  id: string;
  data?: Record<string, any>;
  _meta?: RecordMeta;
  meta?: RecordMeta;
  [key: string]: any; // For legacy flat format
}

export interface RecordMeta {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  position?: number;
  created_by?: string;
  updated_by?: string;
}

/**
 * Convert backend record to frontend format
 */
export const transformRecordFromBackend = (
  record: any,
  fields: BaseField[]
): RecordData => {
  if (!record) return { id: '', data: {}, _meta: { id: '', created_at: '', updated_at: '' } };

  // Handle structured format
  if (record.data && record._meta) {
    const processedData: Record<string, any> = {};
    
    // Process each field value from backend format
    fields.forEach(field => {
      if (field.id && record.data[field.id] !== undefined) {
        processedData[field.id] = processFieldFromBackend(field, record.data[field.id]);
      }
    });

    return {
      ...record,
      data: processedData,
    };
  }

  // Handle legacy flat format
  const data: Record<string, any> = {};
  const meta: RecordMeta = {
    id: record.id || '',
    created_at: record.created_at || '',
    updated_at: record.updated_at || '',
    deleted_at: record.deleted_at,
    position: record.position,
    created_by: record.created_by,
    updated_by: record.updated_by,
  };

  // Extract field data from flat record
  fields.forEach(field => {
    if (field.id && record[field.id] !== undefined) {
      data[field.id] = processFieldFromBackend(field, record[field.id]);
    }
  });

  return {
    id: record.id || '',
    data,
    _meta: meta,
  };
};

/**
 * Convert frontend record to backend format
 */
export const transformRecordToBackend = (
  record: RecordData,
  fields: BaseField[]
): any => {
  const backendRecord: any = {
    id: record.id,
    ...record._meta,
  };

  // Process field data for backend
  if (record.data) {
    fields.forEach(field => {
      if (field.id && record.data![field.id] !== undefined) {
        backendRecord[field.id] = processFieldForBackend(field, record.data![field.id]);
      }
    });
  }

  return backendRecord;
};

/**
 * Transform table structure for consistent frontend usage
 */
export const convertToTableStructure = (data: any) => {
  if (!data) return { columns: [], records: [], totalCount: 0 };

  const { table, columns, records } = data;

  return {
    table: table || {},
    columns: columns || [],
    records: records || [],
    totalCount: records?.length || 0,
    hasMore: false,
  };
};

/**
 * Flatten record data for display (legacy compatibility)
 */
export const flattenRecord = (record: RecordData): Record<string, any> => {
  const flattened: Record<string, any> = {
    id: record.id,
    ...record._meta,
  };

  if (record.data) {
    Object.assign(flattened, record.data);
  }

  return flattened;
};

/**
 * Create new record with default values
 */
export const createNewRecord = (
  fields: BaseField[],
  position: number = 0
): RecordData => {
  const now = new Date().toISOString();
  const data: Record<string, any> = {};

  // Initialize with field default values
  fields.forEach(field => {
    if (field.id) {
      data[field.id] = processFieldValue(field, '');
    }
  });

  return {
    id: '', // Will be set by backend
    data,
    _meta: {
      id: '',
      created_at: now,
      updated_at: now,
      position,
    },
  };
};

/**
 * Update record field value
 */
export const updateRecordField = (
  record: RecordData,
  fieldId: string,
  value: any,
  field?: BaseField
): RecordData => {
  const processedValue = field ? processFieldValue(field, value) : value;

  return {
    ...record,
    data: {
      ...record.data,
      [fieldId]: processedValue,
    },
    _meta: {
      ...record._meta,
      updated_at: new Date().toISOString(),
    },
  };
};

/**
 * Filter records by search query
 */
export const filterRecordsBySearch = (
  records: RecordData[],
  fields: BaseField[],
  searchQuery: string
): RecordData[] => {
  if (!searchQuery.trim()) return records;

  const query = searchQuery.toLowerCase();
  
  return records.filter(record => {
    // Search in record data
    if (record.data) {
      return fields.some(field => {
        if (!field.id) return false;
        const value = record.data![field.id];
        return String(value || '').toLowerCase().includes(query);
      });
    }

    // Search in flat record (legacy)
    return fields.some(field => {
      if (!field.id) return false;
      const value = record[field.id];
      return String(value || '').toLowerCase().includes(query);
    });
  });
};

/**
 * Sort records by field
 */
export const sortRecords = (
  records: RecordData[],
  fieldId: string,
  direction: 'asc' | 'desc' = 'asc'
): RecordData[] => {
  return [...records].sort((a, b) => {
    const aValue = a.data?.[fieldId] ?? a[fieldId] ?? '';
    const bValue = b.data?.[fieldId] ?? b[fieldId] ?? '';

    const comparison = String(aValue).localeCompare(String(bValue), undefined, {
      numeric: true,
      sensitivity: 'base',
    });

    return direction === 'asc' ? comparison : -comparison;
  });
};

/**
 * Group records by field value
 */
export const groupRecordsByField = (
  records: RecordData[],
  fieldId: string
): Record<string, RecordData[]> => {
  const groups: Record<string, RecordData[]> = {};

  records.forEach(record => {
    const value = record.data?.[fieldId] ?? record[fieldId] ?? 'Uncategorized';
    const key = String(value);
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(record);
  });

  return groups;
};

/**
 * Calculate aggregate values for records
 */
export const calculateAggregates = (
  records: RecordData[],
  fieldId: string,
  operation: 'sum' | 'average' | 'count' | 'min' | 'max'
): number => {
  const values = records.map(record => {
    const value = record.data?.[fieldId] ?? record[fieldId] ?? 0;
    return Number(value) || 0;
  }).filter(v => !isNaN(v));

  switch (operation) {
    case 'sum':
      return values.reduce((sum, val) => sum + val, 0);
    case 'average':
      return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    case 'count':
      return values.length;
    case 'min':
      return values.length > 0 ? Math.min(...values) : 0;
    case 'max':
      return values.length > 0 ? Math.max(...values) : 0;
    default:
      return 0;
  }
};