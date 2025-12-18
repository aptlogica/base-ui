import { useCallback, useEffect, useRef } from 'react';
import { GridRecord as TableData, GridColumn as ColumnConfig } from '../types/grid.types';

interface UseCellEditingOptions {
  data: TableData[];
  columns: ColumnConfig[];
  tableId?: string;
  insertRowDataMutation?: any;
  onRecordsUpdate: (updater: (prev: any[]) => any[]) => void;
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
    if (typeof val === 'string' && val.trim() === '') return null;
    if (Array.isArray(val) && val.length === 0) return null;
    // For duration fields, treat 0 as empty if original was null/undefined
    if (typeof val === 'number' && val === 0 && (oldVal === null || oldVal === undefined)) {
      return null;
    }
    return val;
  }, []);

  // Update a single cell value (debounced to reduce API calls)
  const handleCellChange = useCallback(async (rowId: string, columnKey: string, value: any) => {
    // Find the row and column
    const row = data.find(r => r._meta?.id === rowId);
    const column = columns.find(col => col.key === columnKey);

    if (!row || !column) return;

    // System fields are read-only, don't allow changes
    if (column.isSystem) return;

    // Skip attachment fields - they handle their own API calls
    // But we still need to update local state for optimistic UI updates
    if (column.type === 'attachment' || column.uidt === 'attachment') {
      if (onRecordsUpdate) {
        onRecordsUpdate(prevRecords => {
          const updatedRecords = prevRecords.map(record => {
            // allRecords are in raw API format (id at top level, not _meta.id)
            const recordId = String((record as any).id || '');
            // rowId comes from _meta.id (string), so compare as strings
            if (recordId === String(rowId)) {
              // Update in raw API format (allRecords format)
              // Attachment values from API are arrays of objects or null (never empty array)
              // Match API format: array of attachment objects, or null if empty
              let attachmentValue: any[] | null = null;
              if (Array.isArray(value) && value.length > 0) {
                // Create new array reference to ensure React detects the change
                attachmentValue = [...value];
              } else if (value && !Array.isArray(value)) {
                attachmentValue = [value];
              }
              // Return new record object with new array reference to trigger React re-render
              return {
                ...record,
                [columnKey]: attachmentValue
              };
            }
            return record;
          });
          // Return new array reference to ensure React detects the change
          return updatedRecords;
        });
      }
      return;
    }

    // Skip links fields - they handle their own API calls via insertRelationData
    if (column.type === 'links' || column.uidt === 'links') {
      // Links fields use insertRelationData API, not insertRowData
      // But we still need to update local state for optimistic UI updates
      if (onRecordsUpdate) {
        onRecordsUpdate(prevRecords => {
          return prevRecords.map(record => {
            const recordId = record.id?.toString() || (record as any)._meta?.id?.toString();
            if (recordId === rowId) {
              const updatedRecord = { ...record };
              (updatedRecord as any)[columnKey] = value;
              if ((updatedRecord as any).data) {
                (updatedRecord as any).data = {
                  ...(updatedRecord as any).data,
                  [columnKey]: value
                };
              }
              return updatedRecord;
            }
            return record;
          });
        });
      }
      return;
    }

    if (!column.id) return;

    // Validate rowId - must be a valid number for existing rows
    const numericRowId = Number(rowId);
    if (!rowId || Number.isNaN(numericRowId) || numericRowId <= 0) {
      // Row ID is invalid or row not yet saved - skip API call
      return;
    }

    // Create a unique key for this cell
    const cellKey = `${rowId}-${columnKey}`;

    // Get the original value if we haven't stored it yet
    if (!originalValues.current.has(cellKey)) {
      const originalValue = (row as any)[columnKey] ?? (row as any).data?.[columnKey] ?? (row as any)._meta?.[columnKey];
      const normalizedOriginal = normalizeEmpty(originalValue);
      originalValues.current.set(cellKey, normalizedOriginal);
    }

    // Normalize incoming value
    const storedOriginal = originalValues.current.get(cellKey);
    const normalizedValue = normalizeEmpty(value, storedOriginal);

    // If both are empty/null, skip entirely (prevents API calls during initialization)
    // EXCEPTION: Allow formula fields to save initial calculated value even if original is null
    const isFormulaField = column.type === 'formula' || column.uidt === 'formula';
    if (normalizedValue === null && normalizeEmpty(storedOriginal) === null && !isFormulaField) {
      return; // Don't proceed with debounced update
    }

    // For formula fields, allow saving if we have a non-null value even if original was null
    // This allows initial calculation to be saved to backend
    if (isFormulaField && normalizedValue === null) {
      return; // Still skip if formula result is null/empty
    }

    // Prepare value for backend - convert objects/arrays appropriately
    let backendValue = value;
    if (column.type === 'json' && typeof value === 'object' && value !== null) {
      backendValue = JSON.stringify(value);
    } else if (column.type === 'user') {
      // Check if user field allows multiple selection - convert array to comma-separated string
      const userConfig = (column.meta as any) || {};
      if (userConfig.allowMultiple && Array.isArray(value)) {
        backendValue = value.filter(id => id && id.toString().trim()).join(',');
      }
    }

    // Store the pending change only if value is not empty (or explicitly different)
    pendingChanges.current.set(cellKey, { rowId, columnKey, value: backendValue });

    // Clear existing timeout for this cell
    if (debounceTimeouts.current.has(cellKey)) {
      clearTimeout(debounceTimeouts.current.get(cellKey)!);
    }

    // Set new timeout to send API call after 500ms of no typing
    const timeout = setTimeout(async () => {
      const change = pendingChanges.current.get(cellKey);
      const originalValue = originalValues.current.get(cellKey);

      if (change && column.id) {
        // Compare new value with original value
        const hasChanged = (() => {
          const newVal = change.value;
          const oldVal = originalValue;

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
        })();

        // Only make API call if value actually changed AND is not just empty-to-empty
        if (hasChanged) {
          // Additional check: Don't send empty values for new rows unless explicitly set
          const isEmptyValue = change.value === null || change.value === undefined ||
            (typeof change.value === 'string' && change.value.trim() === '') ||
            (Array.isArray(change.value) && change.value.length === 0);

          const isOldEmpty = originalValue === null || originalValue === undefined ||
            (typeof originalValue === 'string' && originalValue.trim() === '') ||
            (Array.isArray(originalValue) && originalValue.length === 0);

          if (isEmptyValue && isOldEmpty) {
            // Skip API call for empty-to-empty transitions
            pendingChanges.current.delete(cellKey);
            return;
          }

          // Additional validation: Skip API call if value is empty and row is newly created
          if (isEmptyValue) {
            const rowCreationTime = (row as any)._meta?.created_at;
            if (rowCreationTime) {
              const created = new Date(rowCreationTime).getTime();
              const now = Date.now();
              const timeSinceCreation = now - created;

              // If row was created very recently (< 2 seconds), skip empty value updates
              if (timeSinceCreation < 2000) {
                pendingChanges.current.delete(cellKey);
                return;
              }
            }
          }

          try {
            // Double-check rowId validity before making API call
            const numericRowId = Number(change.rowId);
            if (tableId && !Number.isNaN(numericRowId) && numericRowId > 0) {
              await insertRowDataMutation.mutateAsync({
                model_id: String(tableId),
                column_id: String(column.id),
                row_id: numericRowId,
                value: change.value,
              });
              
              // Update original value after successful save
              originalValues.current.set(cellKey, change.value);
              
              // CRITICAL: Update local state immediately so UI reflects the change
              if (onRecordsUpdate) {
                onRecordsUpdate(prevRecords => {
                  return prevRecords.map(record => {
                    const recordId = record.id?.toString() || (record as any)._meta?.id?.toString();
                    if (recordId === change.rowId) {
                      const updatedRecord = { ...record };
                      (updatedRecord as any)[columnKey] = change.value;
                      if ((updatedRecord as any).data) {
                        (updatedRecord as any).data = {
                          ...(updatedRecord as any).data,
                          [columnKey]: change.value
                        };
                      }
                      return updatedRecord;
                    }
                    return record;
                  });
                });
              }
            }
          } catch (err) {
            // Handle error - but don't spam console for invalid row operations
            if (err instanceof Error && !err.message.includes('500')) {
              console.error('Failed to update cell:', err);
            }
          }
        }

        // Clean up regardless of whether API was called
        pendingChanges.current.delete(cellKey);
      }
      debounceTimeouts.current.delete(cellKey);
    }, 500); // 500ms debounce delay

    debounceTimeouts.current.set(cellKey, timeout);
  }, [data, columns, insertRowDataMutation, tableId, normalizeEmpty, onRecordsUpdate]);

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

