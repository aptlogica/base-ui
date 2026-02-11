import { useCallback, useEffect, useRef } from 'react';
import { GridRecord as TableData, GridColumn as ColumnConfig } from '../types/grid.types';

interface UseCellEditingOptions {
  data: TableData[];
  columns: ColumnConfig[];
  tableId?: string;
  insertRowDataMutation?: any;
  onRecordsUpdate: (updater: (prev: any[]) => any[]) => void;
}

interface RecordWithId {
  id?: string | number;
  _meta?: { id?: string | number; created_at?: string };
  data?: Record<string, any>;
  [key: string]: any;
}

export function useCellEditing({
  data,
  columns,
  tableId,
  insertRowDataMutation,
  onRecordsUpdate,
}: UseCellEditingOptions) {
  // Debounce refs for cell changes
  const debounceTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingChanges = useRef<Map<string, { rowId: string; columnKey: string; value: any }>>(new Map());
  const originalValues = useRef<Map<string, any>>(new Map());

  // Clear original values when data refreshes to ensure accurate comparisons
  useEffect(() => {
    originalValues.current.clear();
  }, [data]);

  // Helper to normalize empty values
  const normalizeEmpty = useCallback((val: any, oldVal?: any): any => {
    if (val === null || val === undefined || val === '') return null;
    // For string fields, preserve space-only input - don't treat it as empty
    // For other types that might have whitespace, only trim non-string values
    if (Array.isArray(val) && val.length === 0) return null;
    // For duration fields, treat 0 as empty if original was null/undefined
    if (typeof val === 'number' && val === 0 && (oldVal === null || oldVal === undefined)) {
      return null;
    }
    return val;
  }, []);

  // Helper to get record ID as string
  const getRecordId = useCallback((record: RecordWithId): string => {
    return String(record.id ?? record._meta?.id ?? '');
  }, []);

  // Helper to check if value is empty
  const isEmptyValue = useCallback((val: any): boolean => {
    return val === null || val === undefined ||
      (typeof val === 'string' && val.trim() === '') ||
      (Array.isArray(val) && val.length === 0);
  }, []);

  // Helper to update attachment field in records
  const updateAttachmentField = useCallback((prevRecords: any[], rowId: string, columnKey: string, value: any) => {
    return prevRecords.map(record => {
      const recordId = getRecordId(record);
      if (recordId === String(rowId)) {
        let attachmentValue: any[] | null = null;
        if (Array.isArray(value) && value.length > 0) {
          attachmentValue = [...value];
        } else if (value && !Array.isArray(value)) {
          attachmentValue = [value];
        }
        return {
          ...record,
          [columnKey]: attachmentValue
        };
      }
      return record;
    });
  }, [getRecordId]);

  // Helper to update links field in records
  const updateLinksField = useCallback((prevRecords: any[], rowId: string, columnKey: string, value: any) => {
    return prevRecords.map(record => {
      const recordId = getRecordId(record);
      if (recordId === rowId) {
        const updatedRecord = { ...record };
        updatedRecord[columnKey] = value;
        if (updatedRecord.data) {
          updatedRecord.data = {
            ...updatedRecord.data,
            [columnKey]: value
          };
        }
        return updatedRecord;
      }
      return record;
    });
  }, [getRecordId]);

  // Helper to prepare backend value
  const prepareBackendValue = useCallback((value: any, column: ColumnConfig): any => {
    if (column.type === 'json' && typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    if (column.type === 'user') {
      const userConfig = column.meta || {};
      if (userConfig.allowMultiple && Array.isArray(value)) {
        return value.filter(id => id?.toString().trim()).join(',');
      }
    }
    return value;
  }, []);

  // Helper to compare values for change detection
  const hasValueChanged = useCallback((newVal: any, oldVal: any): boolean => {
    const normalizedNew = normalizeEmpty(newVal, oldVal);
    const normalizedOld = normalizeEmpty(oldVal);

    // If both are empty/null, no change
    if (normalizedNew === null && normalizedOld === null) {
      return false;
    }
    
    // If new is 0 and old was null/undefined, treat as no change
    if (normalizedNew === 0 && (normalizedOld === null || normalizedOld === undefined)) {
      return false;
    }

    // Handle arrays/objects (for multi-select, JSON, etc.)
    if (Array.isArray(normalizedNew) || Array.isArray(normalizedOld)) {
      if (Array.isArray(normalizedNew) && Array.isArray(normalizedOld)) {
        if (normalizedNew.length === 0 && normalizedOld.length === 0) {
          return false; // Both empty arrays, no change
        }
        return JSON.stringify(normalizedNew) !== JSON.stringify(normalizedOld);
      }
      return true; // One is array, one is not - changed
    }

    // Handle objects
    if (typeof normalizedNew === 'object' && typeof normalizedOld === 'object' && normalizedNew !== null && normalizedOld !== null) {
      return JSON.stringify(normalizedNew) !== JSON.stringify(normalizedOld);
    }

    // Primitive comparison
    return normalizedNew !== normalizedOld;
  }, [normalizeEmpty]);

  // Helper to check if row is newly created
  const isNewlyCreatedRow = useCallback((row: TableData, thresholdMs = 2000): boolean => {
    const rowCreationTime = row._meta?.created_at;
    if (!rowCreationTime) return false;
    const created = new Date(rowCreationTime).getTime();
    const now = Date.now();
    return (now - created) < thresholdMs;
  }, []);

  // Helper to update record in local state
  const updateLocalRecord = useCallback((prevRecords: any[], rowId: string, columnKey: string, value: any) => {
    return prevRecords.map(record => {
      const recordId = getRecordId(record);
      if (recordId === rowId) {
        const updatedRecord = { ...record };
        updatedRecord[columnKey] = value;
        if (updatedRecord.data) {
          updatedRecord.data = {
            ...updatedRecord.data,
            [columnKey]: value
          };
        }
        return updatedRecord;
      }
      return record;
    });
  }, [getRecordId]);

  // Helper to get original value from row
  const getOriginalValue = useCallback((row: TableData, columnKey: string): any => {
    return row[columnKey] ?? row.data?.[columnKey] ?? row._meta?.[columnKey];
  }, []);

  // Helper to handle attachment field updates
  const handleAttachmentField = useCallback((rowId: string, columnKey: string, value: any) => {
    if (!onRecordsUpdate) return;
    onRecordsUpdate(prevRecords => updateAttachmentField(prevRecords, rowId, columnKey, value));
  }, [onRecordsUpdate, updateAttachmentField]);

  // Helper to handle links field updates
  const handleLinksField = useCallback((rowId: string, columnKey: string, value: any) => {
    if (!onRecordsUpdate) return;
    onRecordsUpdate(prevRecords => updateLinksField(prevRecords, rowId, columnKey, value));
  }, [onRecordsUpdate, updateLinksField]);

  // Helper to process debounced cell update
  const processDebouncedUpdate = useCallback(async (
    change: { rowId: string; columnKey: string; value: any },
    column: ColumnConfig,
    row: TableData
  ) => {
    const originalValue = originalValues.current.get(`${change.rowId}-${change.columnKey}`);
    
    if (!hasValueChanged(change.value, originalValue)) {
      return;
    }

    const isEmpty = isEmptyValue(change.value);
    const isOldEmpty = isEmptyValue(originalValue);

    // For text fields, allow space-only input (don't treat as empty)
    const isTextField = column.uidt === 'SingleLineText' || column.uidt === 'LongText' || column.type === 'text';
    const isActuallyEmpty = isTextField ? (change.value === null || change.value === undefined) : isEmpty;
    const wasActuallyEmpty = isTextField ? (originalValue === null || originalValue === undefined) : isOldEmpty;

    // Skip empty-to-empty transitions
    if (isActuallyEmpty && wasActuallyEmpty) {
      return;
    }

    // Skip empty values for newly created rows
    if (isActuallyEmpty && isNewlyCreatedRow(row)) {
      return;
    }

    // Validate rowId before API call
    const numericRowId = Number(change.rowId);
    if (!tableId || Number.isNaN(numericRowId) || numericRowId <= 0) {
      return;
    }

    try {
      await insertRowDataMutation.mutateAsync({
        model_id: String(tableId),
        column_id: String(column.id),
        row_id: numericRowId,
        value: change.value,
      });
      
      // Update original value after successful save
      originalValues.current.set(`${change.rowId}-${change.columnKey}`, change.value);
      
      // Update local state immediately
      if (onRecordsUpdate) {
        onRecordsUpdate(prevRecords => updateLocalRecord(prevRecords, change.rowId, change.columnKey, change.value));
      }
    } catch (err) {
      // Handle error - but don't spam console for invalid row operations
      if (err instanceof Error && !err.message.includes('500')) {
        console.error('Failed to update cell:', err);
      }
    }
  }, [tableId, insertRowDataMutation, onRecordsUpdate, hasValueChanged, isEmptyValue, isNewlyCreatedRow, updateLocalRecord]);

  // Update a single cell value (debounced to reduce API calls)
  const handleCellChange = useCallback(async (rowId: string, columnKey: string, value: any) => {
    // Find the row and column
    const row = data.find(r => r._meta?.id === rowId);
    const column = columns.find(col => col.key === columnKey);

    if (!row || !column) return;

    // System fields are read-only, don't allow changes
    if (column.isSystem) return;

    // Skip attachment fields - they handle their own API calls
    if (column.type === 'attachment' || column.uidt === 'attachment') {
      handleAttachmentField(rowId, columnKey, value);
      return;
    }

    // Skip links fields - they handle their own API calls via insertRelationData
    // Only check uidt since 'links' is not in GridFieldType
    if (column.uidt === 'links') {
      handleLinksField(rowId, columnKey, value);
      return;
    }

    if (!column.id) return;

    // Validate rowId - must be a valid number for existing rows
    const numericRowId = Number(rowId);
    if (!rowId || Number.isNaN(numericRowId) || numericRowId <= 0) {
      return;
    }

    // Create a unique key for this cell
    const cellKey = `${rowId}-${columnKey}`;

    // Get the original value if we haven't stored it yet
    if (!originalValues.current.has(cellKey)) {
      const originalValue = getOriginalValue(row, columnKey);
      const normalizedOriginal = normalizeEmpty(originalValue);
      originalValues.current.set(cellKey, normalizedOriginal);
    }

    // Normalize incoming value
    const storedOriginal = originalValues.current.get(cellKey);
    const normalizedValue = normalizeEmpty(value, storedOriginal);

    // If both are empty/null, skip entirely (prevents API calls during initialization)
    // EXCEPTION: Allow formula fields to save initial calculated value even if original is null
    // Only check uidt since 'formula' is not in GridFieldType
    const isFormulaField = column.uidt === 'formula';
    if (normalizedValue === null && normalizeEmpty(storedOriginal) === null && !isFormulaField) {
      return;
    }

    // For formula fields, allow saving if we have a non-null value even if original was null
    if (isFormulaField && normalizedValue === null) {
      return;
    }

    // Prepare value for backend
    const backendValue = prepareBackendValue(value, column);

    // Store the pending change
    pendingChanges.current.set(cellKey, { rowId, columnKey, value: backendValue });

    // Clear existing timeout for this cell
    const existingTimeout = debounceTimeouts.current.get(cellKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout to send API call after 500ms of no typing
    const timeout = setTimeout(async () => {
      const change = pendingChanges.current.get(cellKey);
      if (change && column.id) {
        await processDebouncedUpdate(change, column, row);
      }
      pendingChanges.current.delete(cellKey);
      debounceTimeouts.current.delete(cellKey);
    }, 500);

    debounceTimeouts.current.set(cellKey, timeout);
  }, [
    data,
    columns,
    normalizeEmpty,
    getOriginalValue,
    prepareBackendValue,
    handleAttachmentField,
    handleLinksField,
    processDebouncedUpdate
  ]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      debounceTimeouts.current.forEach(timeout => clearTimeout(timeout));
      debounceTimeouts.current.clear();
      pendingChanges.current.clear();
      originalValues.current.clear();
    };
  }, []);

  return {
    handleCellChange,
  };
}
