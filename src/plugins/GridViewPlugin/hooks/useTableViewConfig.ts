import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDebounce } from '../../../utils/helpers';
import { parseFieldConfig } from '../../../utils/pluginUtils';
import { filterValidSorts } from '../../../utils/sortUtils';
import { GridColumn as ColumnConfig } from '../types/grid.types';
import { SearchField } from '../../../hooks/useSearch';

export type FilterType = { column: string; operator: string; value: string };
export type GroupByItem = {
  id: string;
  column: string;
  direction: 'asc' | 'desc';
};
export type SortType = { column: string; direction: 'asc' | 'desc' };

export interface ViewConfigState {
  filters: FilterType[];
  groupBy: GroupByItem[];
  sorts: SortType[];
  columnWidths: Record<string, number>;
}

interface UseTableViewConfigOptions {
  baseMeta?: Record<string, any>;
  effectiveViewId?: string;
  columns: ColumnConfig[];
  updateViewMutation?: any;
  searchableColumns: ColumnConfig[];
}

export function useTableViewConfig({
  baseMeta,
  effectiveViewId,
  columns,
  updateViewMutation,
  searchableColumns,
}: UseTableViewConfigOptions) {
  // View configuration state
  const [viewConfigState, setViewConfigState] = useState<ViewConfigState>({
    filters: [],
    groupBy: [],
    sorts: [],
    columnWidths: {},
  });

  // Search state
  const defaultSearchField = searchableColumns.length > 0 ? {
    key: searchableColumns[0].key,
    title: searchableColumns[0].title,
    type: searchableColumns[0].type
  } : null;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSearchField, setSelectedSearchField] = useState<SearchField | null>(defaultSearchField);

  // Real-time filtering while typing
  const [realTimeFilter, setRealTimeFilter] = useState<{ column: string; operator: string; value: string } | null>(null);

  // Local field configuration state
  const [localFieldConfig, setLocalFieldConfig] = useState<any[]>([]);

  // Helper to parse/normalize viewConfig/meta
  const getConfigObj = useCallback((config: any) => {
    return parseFieldConfig(config);
  }, []);

  // Sync local view state from external viewConfig/meta when it changes
  useEffect(() => {
    const configObj = getConfigObj(baseMeta);
    setViewConfigState(prev => ({
      filters: Array.isArray(configObj.filters) ? configObj.filters as FilterType[] : [],
      groupBy: Array.isArray(configObj.groupBy) ? configObj.groupBy as GroupByItem[] : [],
      sorts: Array.isArray(configObj.sorts) ? configObj.sorts as SortType[] : [],
      columnWidths: configObj.columnWidths || {},
    }));
  }, [baseMeta, getConfigObj]);

  // Initialize local field config from view meta or generate from columns
  useEffect(() => {
    const existingFieldConfig = Array.isArray(baseMeta?.fieldConfig)
      ? baseMeta.fieldConfig
      : [];

    // Build complete fieldConfig for ALL columns (including system fields)
    const currentFieldConfig: any[] = existingFieldConfig.length > 0
      ? existingFieldConfig.slice()
      : columns
        .filter(c => c.id) // Only include columns with valid IDs
        .map((c, idx) => ({
          id: c.id,
          position: idx,
          // Hide system fields by default, except Title field
          isHidden: c.isSystem && c.key?.toLowerCase() !== 'title' ? true : !!(c.hidden || c.isHidden)
        }));

    setLocalFieldConfig(prev => (JSON.stringify(prev) === JSON.stringify(currentFieldConfig) ? prev : currentFieldConfig));
  }, [baseMeta?.fieldConfig, columns]);

  // Visible columns based on field config (optimized with Map for O(1) lookups)
  const visibleColumns = useMemo(() => {
    // Create a Map for O(1) field config lookups instead of O(n) find() calls
    const fieldConfigMap = new Map(
      localFieldConfig.map(fc => [String(fc.id), fc])
    );

    // Sort columns by position from fieldConfig, then filter by visibility
    const sortedColumns = [...columns].sort((a, b) => {
      const aConfig = fieldConfigMap.get(String(a.id));
      const bConfig = fieldConfigMap.get(String(b.id));

      const aPosition = aConfig?.position ?? a.position ?? 0;
      const bPosition = bConfig?.position ?? b.position ?? 0;

      return aPosition - bPosition;
    });

    // Filter by visibility using Map lookup
    return sortedColumns.filter(column => {
      if (!column.id) return true; // Show columns without IDs (fallback)

      const fieldConfig = fieldConfigMap.get(String(column.id));
      if (fieldConfig) {
        return !fieldConfig.isHidden; // Show if not hidden
      }

      // If no fieldConfig entry exists, show the column by default
      return true;
    });
  }, [columns, localFieldConfig]);

  // Persist the entire view configuration
  const updateViewConfigBackend = useCallback(async (newConfig: any) => {
    if (effectiveViewId && updateViewMutation) {
      await updateViewMutation.mutateAsync({
        viewId: effectiveViewId,
        view: {
          meta: {
            ...baseMeta,
            ...newConfig
          }
        }
      });
    }
  }, [effectiveViewId, updateViewMutation, baseMeta]);

  // Store current values in refs to avoid recreating debounced function
  const effectiveViewIdRef = useRef(effectiveViewId);
  const baseMetaRef = useRef(baseMeta);

  useEffect(() => {
    effectiveViewIdRef.current = effectiveViewId;
    baseMetaRef.current = baseMeta;
  }, [effectiveViewId, baseMeta]);

  // Debounced API call for field config updates
  const debouncedUpdateFieldConfig = useDebounce(async (fieldConfig: any[]) => {
    if (effectiveViewIdRef.current && updateViewMutation) {
      await updateViewMutation.mutateAsync({
        viewId: effectiveViewIdRef.current,
        view: {
          meta: {
            ...baseMetaRef.current,
            fieldConfig
          }
        }
      });
    }
  }, 500);

  // Handle real-time filtering while typing
  const handleRealTimeFilter = useCallback((filter: { column: string; operator: string; value: string; logic?: 'AND' | 'OR' } | null) => {
    setRealTimeFilter(filter);
  }, []);

  // Add a filter and persist view config
  const handleAddFilter = useCallback(async (filter: any) => {
    const newFilters = [...viewConfigState.filters, filter];
    const newConfig = { ...viewConfigState, filters: newFilters };
    setViewConfigState(newConfig);
    await updateViewConfigBackend(newConfig);
  }, [viewConfigState, updateViewConfigBackend]);

  // Remove a filter at given index and persist view config
  const handleRemoveFilter = useCallback(async (idx: number) => {
    // Use functional update to avoid stale closure issues
    let newConfig: any;
    setViewConfigState(prev => {
      const newFilters = prev.filters.filter((_, i) => i !== idx);
      newConfig = { ...prev, filters: newFilters };
      return newConfig;
    });
    // Clear real-time filter when a saved filter is removed
    setRealTimeFilter(null);
    // Update backend asynchronously
    await updateViewConfigBackend(newConfig);
  }, [updateViewConfigBackend]);

  // Update a filter at given index and persist view config
  const handleUpdateFilter = useCallback(async (idx: number, updates: Partial<any>) => {
    // Use functional update to avoid stale closure issues
    let newConfig: any;
    setViewConfigState(prev => {
      const newFilters = [...prev.filters];
      if (newFilters[idx]) {
        newFilters[idx] = { ...newFilters[idx], ...updates };
        newConfig = { ...prev, filters: newFilters };
        return newConfig;
      }
      return prev;
    });
    // Update backend asynchronously
    if (newConfig) {
      await updateViewConfigBackend(newConfig);
    }
  }, [updateViewConfigBackend]);

  // Expose handleUpdateFilter for use in Table component
  // (This is already returned, but making it explicit)

  // Change groupBy and persist view config
  const handleGroupByChange = useCallback(async (newGroupBy: GroupByItem[] | ((prev: GroupByItem[]) => GroupByItem[])) => {
    const resolvedGroupBy = typeof newGroupBy === 'function' ? newGroupBy(viewConfigState.groupBy) : newGroupBy;
    // Filter out empty groups (with empty column) before saving
    const validGroupBy = Array.isArray(resolvedGroupBy) ? resolvedGroupBy.filter(g => g.column && g.column.trim()) : [];
    const newConfig = { ...viewConfigState, groupBy: validGroupBy };
    setViewConfigState(newConfig);
    await updateViewConfigBackend(newConfig);
  }, [viewConfigState, updateViewConfigBackend]);

  // Change sorts and persist view config
  const handleSortChange = useCallback(async (newSorts: any) => {
    // Filter out empty sorts (with empty column) before saving
    const validSorts = filterValidSorts(Array.isArray(newSorts) ? newSorts : []);
    const newConfig = { ...viewConfigState, sorts: validSorts };
    setViewConfigState(newConfig);
    await updateViewConfigBackend(newConfig);
  }, [viewConfigState, updateViewConfigBackend]);

  // Ensure all fields are registered in fieldConfig when FieldsPopover opens
  const handleEnsureAllFieldsRegistered = useCallback(async () => {
    const existing = Array.isArray(baseMeta?.fieldConfig) ? baseMeta.fieldConfig : [];
    const existingIds = new Set(existing.map((fc: any) => String(fc.id)));

    // Find columns not in fieldConfig
    const missingColumns = columns.filter(c => c.id && !existingIds.has(String(c.id)));

    if (missingColumns.length > 0) {
      // Add missing columns to fieldConfig
      const maxPosition = existing.length > 0 ? Math.max(...existing.map((fc: any) => fc.position || 0)) : -1;
      const newFieldConfig = [
        ...existing,
        ...missingColumns.map((c, idx) => ({
          id: c.id,
          position: maxPosition + 1 + idx,
          // Hide system fields by default, except Title field
          isHidden: c.isSystem && c.key?.toLowerCase() !== 'title' ? true : false
        }))
      ];

      // Update local state and persist
      setLocalFieldConfig(newFieldConfig);

      if (effectiveViewId && updateViewMutation) {
        await updateViewMutation.mutateAsync({
          viewId: effectiveViewId,
          view: {
            meta: {
              ...baseMeta,
              fieldConfig: newFieldConfig
            }
          }
        });
      }
    }
  }, [baseMeta, effectiveViewId, columns, updateViewMutation]);

  // Toggle field visibility in this view and persist to view meta
  const handleFieldToggle = useCallback(async (fieldId: string) => {
    // Use functional update to avoid dependency on localFieldConfig
    setLocalFieldConfig(prevConfig => {
      const updatedFieldConfig = prevConfig.map((fc: any) => {
        if (String(fc.id) === String(fieldId)) {
          return { ...fc, isHidden: !Boolean(fc.isHidden) };
        }
        return fc;
      });

      // Debounced API call - will only execute after 500ms of no more toggles
      debouncedUpdateFieldConfig(updatedFieldConfig);

      return updatedFieldConfig;
    });
  }, [debouncedUpdateFieldConfig]);

  // Reorder fields (visibility+position) from FieldsPopover and persist
  const handleFieldOrderChange = useCallback(async (newColumns: ColumnConfig[]) => {
    // Create a map of new positions from reordered columns
    const newColumnMap = new Map<string, number>();
    newColumns.forEach((col, index) => {
      if (col.id) {
        newColumnMap.set(String(col.id), index);
      }
    });

    // Update fieldConfig preserving all columns, updating positions for reordered ones
    const updatedFieldConfig = localFieldConfig.map((fc: any) => {
      const newPosition = newColumnMap.get(String(fc.id));
      if (newPosition !== undefined) {
        // This column was reordered, use new position
        return { ...fc, position: newPosition };
      }
      // This column wasn't in the reordered list (hidden), keep existing position but adjust
      return fc;
    });

    // Also handle any new columns that might not be in fieldConfig yet
    const existingIds = new Set(localFieldConfig.map((fc: any) => String(fc.id)));
    newColumns.forEach((col, index) => {
      if (col.id && !existingIds.has(String(col.id))) {
        updatedFieldConfig.push({
          id: col.id,
          position: index,
          isHidden: !!(col.hidden || col.isHidden)
        });
      }
    });

    // Sort by position and re-index to ensure no gaps
    updatedFieldConfig.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
    const finalFieldConfig = updatedFieldConfig.map((fc: any, idx: number) => ({
      ...fc,
      position: idx
    }));

    // Update local state immediately for optimistic UI
    setLocalFieldConfig(finalFieldConfig);

    // Persist to backend
    if (effectiveViewId && updateViewMutation) {
      try {
        await updateViewMutation.mutateAsync({
          viewId: effectiveViewId,
          view: {
            meta: {
              ...baseMeta,
              fieldConfig: finalFieldConfig
            }
          }
        });
      } catch (error: any) {
        console.error('Failed to save field order:', error);
      }
    }
  }, [localFieldConfig, baseMeta, effectiveViewId, updateViewMutation]);

  return {
    viewConfigState,
    setViewConfigState,
    searchTerm,
    setSearchTerm,
    selectedSearchField,
    setSelectedSearchField,
    realTimeFilter,
    localFieldConfig,
    setLocalFieldConfig,
    visibleColumns,
    handleRealTimeFilter,
    handleAddFilter,
    handleRemoveFilter,
    handleUpdateFilter,
    handleGroupByChange,
    handleSortChange,
    handleEnsureAllFieldsRegistered,
    handleFieldToggle,
    handleFieldOrderChange,
    updateViewConfigBackend,
  };
}

