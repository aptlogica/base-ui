import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDebounce } from '../../../utils/helpers';
import { SortItem } from '../../../utils/sortUtils';
import { extractFieldConfigFromMeta, generateDefaultFieldConfig, mergeFieldConfigWithColumns } from '../../../utils/viewFieldConfigUtils';
import { applyFilters } from '../../../utils/filterUtils';
import { isFormulaField } from '../../../utils/fieldUtils';
import { GanttTask } from './useGanttData';
import type { Column } from '../../../types/api.types';

export type FilterType = { column: string; operator: string; value: string };

interface UseGanttViewConfigOptions {
  view?: any;
  columns: any[];
  updateView?: any;
  tasks?: GanttTask[];
  isReadOnly?: boolean;
}

export function useGanttViewConfig({
  view,
  columns,
  updateView,
  tasks = [],
  isReadOnly = false,
}: UseGanttViewConfigOptions) {
  // Filters state
  const [filters, setFilters] = useState<FilterType[]>([]);
  
  // Real-time draft filter (for preview before saving)
  const [draftFilter, setDraftFilter] = useState<FilterType | null>(null);
  
  // Sorts state
  const [sorts, setSorts] = useState<SortItem[]>([]);
  
  // Local field configuration state
  const [localFieldConfig, setLocalFieldConfig] = useState<Array<{
    id: string;
    position: number;
    isHidden: boolean;
  }>>([]);
  
  // Track if we've initialized to prevent resetting user changes
  const initializedRef = useRef(false);
  const lastBackendConfigRef = useRef<string>('');

  // Initialize filters and sorts from view meta
  useEffect(() => {
    if (view?.meta) {
      setFilters(view.meta.filters || []);
      setSorts(view.meta.sorts || []);
    }
  }, [view?.id, view?.meta?.filters, view?.meta?.sorts]);

  // Initialize local field config from view meta or generate from columns
  useEffect(() => {
    if (!columns.length) return;

    const existingFieldConfig = extractFieldConfigFromMeta(view?.meta);
    const backendConfigStr = JSON.stringify(existingFieldConfig.sort((a, b) => (a.position || 0) - (b.position || 0)));

    // If we haven't initialized yet, initialize from backend or generate default
    if (!initializedRef.current) {
      if (existingFieldConfig.length > 0) {
        // Use backend config if it exists, but ensure all columns are included
        const completeConfig = mergeFieldConfigWithColumns(existingFieldConfig, columns);
        
        setLocalFieldConfig(completeConfig);
        lastBackendConfigRef.current = JSON.stringify(completeConfig.sort((a, b) => (a.position || 0) - (b.position || 0)));
        initializedRef.current = true;
      } else {
        // Generate default config (first 3-4 fields visible by default)
        const defaultFieldConfig = generateDefaultFieldConfig(
          columns,
          4,
          (col) => {
            // Exclude attachment fields, formula fields, and system fields (except Title)
            const isAttachmentField = col.type === 'attachment' || col.uidt === 'attachment';
            const isFormulaFieldType = isFormulaField(col);
            const isSystemField = col.system && col.column_name?.toLowerCase() !== 'title';
            return isAttachmentField || isFormulaFieldType || isSystemField;
          }
        );

        const defaultConfigStr = JSON.stringify(defaultFieldConfig.sort((a, b) => (a.position || 0) - (b.position || 0)));
        setLocalFieldConfig(defaultFieldConfig);
        lastBackendConfigRef.current = defaultConfigStr;
        initializedRef.current = true;
      }
      return;
    }

    // After initialization, only update if backend config actually changed
    if (initializedRef.current && backendConfigStr !== lastBackendConfigRef.current && existingFieldConfig.length > 0) {
      const mergedConfig = mergeFieldConfigWithColumns(existingFieldConfig, columns);
      
      setLocalFieldConfig(mergedConfig);
      lastBackendConfigRef.current = JSON.stringify(mergedConfig.sort((a, b) => (a.position || 0) - (b.position || 0)));
    } else if (initializedRef.current && existingFieldConfig.length === 0 && localFieldConfig.length > 0) {
      // No backend config but we have local config - check for new columns
      const mergedConfig = mergeFieldConfigWithColumns(localFieldConfig, columns);
      
      if (mergedConfig.length !== localFieldConfig.length) {
        setLocalFieldConfig(mergedConfig);
      }
    }
  }, [view?.meta, columns]);

  // Store current values in refs to avoid recreating debounced function
  const updateViewRef = useRef(updateView);
  const viewRef = useRef(view);
  
  useEffect(() => {
    updateViewRef.current = updateView;
    viewRef.current = view;
  }, [updateView, view]);

  // Debounced API call for field config updates
  const debouncedUpdateFieldConfig = useDebounce(async (fieldConfig: any[]) => {
    if (updateViewRef.current && viewRef.current?.id) {
      try {
        await updateViewRef.current(viewRef.current.id, {
          meta: {
            ...viewRef.current.meta,
            fieldConfig
          }
        });
        lastBackendConfigRef.current = JSON.stringify(fieldConfig.sort((a, b) => (a.position || 0) - (b.position || 0)));
      } catch (error) {
        console.error('Failed to save field config:', error);
      }
    }
  }, 500);

  // Visible columns based on field config (optimized with Map for O(1) lookups)
  const visibleColumns = useMemo(() => {
    if (!Array.isArray(localFieldConfig) || localFieldConfig.length === 0) return columns;

    // Create a Map for O(1) field config lookups instead of O(n) find() calls
    const fieldConfigMap = new Map(
      localFieldConfig.map(fc => [String(fc.id), fc])
    );

    return columns
      .map(col => {
        const fieldConfig = fieldConfigMap.get(String(col.id));
        if (fieldConfig) {
          return {
            ...col,
            hidden: Boolean(fieldConfig.isHidden),
            is_hidden: Boolean(fieldConfig.isHidden),
            position: fieldConfig.position ?? col.position
          };
        }
        return col;
      })
      .filter(col => !col.hidden && !col.is_hidden)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [columns, localFieldConfig]);

  // Handle real-time filtering while typing
  const handleRealTimeFilter = useCallback((filter: FilterType | null) => {
    setDraftFilter(filter);
  }, []);

  // Add a filter and persist view config (only if not read-only)
  const handleAddFilter = useCallback(async (filter: FilterType) => {
    const newFilters = [...filters, filter];
    setFilters(newFilters); // Always update local state
    setDraftFilter(null);

    // Only persist to backend if NOT read-only
    if (!isReadOnly && updateView && view?.id) {
      await updateView(view.id, {
        meta: {
          ...view.meta,
          filters: newFilters
        }
      });
    }
  }, [filters, updateView, view, isReadOnly]);

  // Remove a filter and persist view config (only if not read-only)
  const handleRemoveFilter = useCallback(async (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters); // Always update local state

    // Only persist to backend if NOT read-only
    if (!isReadOnly && updateView && view?.id) {
      await updateView(view.id, {
        meta: {
          ...view.meta,
          filters: newFilters
        }
      });
    }
  }, [filters, updateView, view, isReadOnly]);

  // Update a filter at given index and persist view config (only if not read-only)
  const handleUpdateFilter = useCallback(async (index: number, updates: Partial<FilterType>) => {
    const newFilters = [...filters];
    if (newFilters[index]) {
      newFilters[index] = { ...newFilters[index], ...updates };
      setFilters(newFilters); // Always update local state

      // Only persist to backend if NOT read-only
      if (!isReadOnly && updateView && view?.id) {
        await updateView(view.id, {
          meta: {
            ...view.meta,
            filters: newFilters
          }
        });
      }
    }
  }, [filters, updateView, view, isReadOnly]);

  // Handle sort change and persist view config (only if not read-only)
  const handleSortChange = useCallback(async (newSorts: SortItem[]) => {
    setSorts(newSorts); // Always update local state

    // Only persist to backend if NOT read-only
    if (!isReadOnly && updateView && view?.id) {
      await updateView(view.id, {
        meta: {
          ...view.meta,
          sorts: newSorts
        }
      });
    }
  }, [updateView, view, isReadOnly]);

  // Handle field toggle with debounced persistence
  const handleFieldToggle = useCallback(async (fieldId: string) => {
    if (!updateView) return;

    setLocalFieldConfig(prevConfig => {
      const updatedFieldConfig = prevConfig.map((fc: any) => {
        if (String(fc.id) === String(fieldId)) {
          return { ...fc, isHidden: !Boolean(fc.isHidden) };
        }
        return fc;
      });

      debouncedUpdateFieldConfig(updatedFieldConfig);

      return updatedFieldConfig;
    });
  }, [updateView, debouncedUpdateFieldConfig]);

  // Handle field order change (optimized with Map to avoid multiple find() calls)
  const handleFieldOrderChange = useCallback(async (newColumns: any[]) => {
    if (!updateView || !view?.id) return;

    const existingFieldConfig = (view?.meta?.fieldConfig || []) as any[];
    
    // Create Maps for O(1) lookups instead of O(n) find() calls
    const newColumnMap = new Map<string, number>();
    const newColumnDataMap = new Map<string, any>();
    newColumns.forEach((col, index) => {
      if (col.id) {
        newColumnMap.set(String(col.id), index);
        newColumnDataMap.set(String(col.id), col);
      }
    });

    const updatedFieldConfig = existingFieldConfig.map((fc: any) => {
      const newPosition = newColumnMap.get(String(fc.id));
      if (newPosition !== undefined) {
        const col = newColumnDataMap.get(String(fc.id));
        return { 
          ...fc, 
          position: newPosition,
          isHidden: typeof (col?.hidden) === 'boolean' 
            ? !!col.hidden
            : typeof (col?.isHidden) === 'boolean'
            ? !!col.isHidden
            : fc.isHidden
        };
      }
      return fc;
    });

    const existingIds = new Set(existingFieldConfig.map((fc: any) => String(fc.id)));
    newColumns.forEach((col, index) => {
      if (col.id && !existingIds.has(String(col.id))) {
        updatedFieldConfig.push({
          id: col.id,
          position: index,
          isHidden: !!(col.hidden || col.isHidden)
        });
      }
    });

    updatedFieldConfig.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
    const finalFieldConfig = updatedFieldConfig.map((fc: any, idx: number) => ({
      ...fc,
      position: idx
    }));

    setLocalFieldConfig(finalFieldConfig);

    await updateView(view.id, {
      meta: {
        ...view.meta,
        fieldConfig: finalFieldConfig
      }
    });
  }, [updateView, view]);

  // Apply filters to tasks
  // Includes both saved filters and draft/real-time filter for preview
  const filteredTasks = useMemo(() => {
    const hasFilters = Array.isArray(filters) && filters.length > 0;
    const hasDraftFilter = draftFilter !== null;
    
    if (!hasFilters && !hasDraftFilter) return tasks;
    
    // Combine saved filters with draft filter (if any) for real-time preview
    const allFilters = hasDraftFilter 
      ? [...filters, draftFilter]
      : filters;
    
    // Convert tasks to records format for filtering
    const records = tasks.map(task => ({
      data: task.rawData,
      id: task.id
    }));
    
    // Map columns to the format expected by applyFilters (with key property)
    const columnsForFiltering = columns.map(col => ({
      key: col.column_name,  // Use column_name as the key
      column_name: col.column_name,
      title: col.title,
      type: col.uidt,
      uidt: col.uidt,
      id: col.id
    }));
    
    // Apply filters using the standard filter utility (includes both saved and draft)
    const filteredRecords = applyFilters(records, allFilters, columnsForFiltering);
    
    // Create a Set for O(1) lookups instead of O(n) some() calls
    const filteredRecordIds = new Set(
      filteredRecords.map(record => String(record.id))
    );
    
    // Convert back to tasks using Set lookup
    const filtered = tasks.filter(task => 
      filteredRecordIds.has(String(task.id))
    );
    
    return filtered;
  }, [tasks, filters, draftFilter, columns]);

  // Create sorted tasks list for sidebar only (don't affect the chart)
  const sortedTasksForSidebar = useMemo(() => {
    if (!sorts || sorts.length === 0) return filteredTasks;
    
    const sorted = [...filteredTasks].sort((a, b) => {
      for (const sort of sorts) {
        const aValue = a.rawData?.[sort.column];
        const bValue = b.rawData?.[sort.column];
        
        if (aValue === bValue) continue;
        
        const comparison = aValue < bValue ? -1 : 1;
        return sort.direction === 'asc' ? comparison : -comparison;
      }
      return 0;
    });
    
    return sorted;
  }, [filteredTasks, sorts]);

  return {
    // State
    filters,
    sorts,
    localFieldConfig,
    visibleColumns,
    filteredTasks,
    sortedTasksForSidebar,
    
    // Handlers
    handleRealTimeFilter,
    handleAddFilter,
    handleRemoveFilter,
    handleUpdateFilter,
    handleSortChange,
    handleFieldToggle,
    handleFieldOrderChange,
  };
}

