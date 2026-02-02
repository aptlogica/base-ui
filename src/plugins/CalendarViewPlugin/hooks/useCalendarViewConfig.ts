import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDebounce } from '../../../utils/helpers';
import { SortItem, filterValidSorts } from '../../../utils/sortUtils';
import { GridColumn } from '../../GridViewPlugin/types/grid.types';
import { extractFieldConfigFromMeta, generateDefaultFieldConfig, mergeFieldConfigWithColumns } from '../../../utils/viewFieldConfigUtils';
import { isFormulaField } from '../../../utils/fieldUtils';

export type FilterType = { column: string; operator: string; value: string };

interface UseCalendarViewConfigOptions {
  view?: any;
  columns: GridColumn[];
  updateView?: any; // Mutation object with mutateAsync
  updateViewConfig?: (viewId: string, updates: any) => Promise<void>;
  isReadOnly?: boolean;
}

export function useCalendarViewConfig({
  view,
  columns,
  updateViewConfig,
  isReadOnly = false,
}: UseCalendarViewConfigOptions) {
  // Filters state
  const [filters, setFilters] = useState<FilterType[]>([]);
  
  // Sorts state
  const [sorts, setSorts] = useState<SortItem[]>([]);
  
  // Real-time draft filter (for preview before saving)
  const [draftFilter, setDraftFilter] = useState<FilterType | null>(null);
  
  // Local field configuration state
  const [localFieldConfig, setLocalFieldConfig] = useState<Array<{
    id: string;
    position: number;
    isHidden: boolean;
  }>>([]);
  
  // Track if we've initialized to prevent resetting user changes
  const initializedRef = useRef(false);
  const lastBackendConfigRef = useRef<string>('');
  const lastBackendFiltersRef = useRef<string>('');
  const lastBackendSortsRef = useRef<string>('');

  // Initialize filters and sorts from view meta (only on first load or when backend actually changes)
  useEffect(() => {
    if (!view?.meta) return;

    const backendFilters = view.meta.filters || [];
    const backendSorts = view.meta.sorts || [];
    const backendFiltersStr = JSON.stringify(backendFilters);
    const backendSortsStr = JSON.stringify(backendSorts);

    // Only update if backend config actually changed (prevents resetting on refetch after our own save)
    if (backendFiltersStr !== lastBackendFiltersRef.current) {
      setFilters(backendFilters);
      lastBackendFiltersRef.current = backendFiltersStr;
    }

    if (backendSortsStr !== lastBackendSortsRef.current) {
      setSorts(backendSorts);
      lastBackendSortsRef.current = backendSortsStr;
    }
  }, [view?.meta]);

  // Initialize local field config from view meta or generate from columns
  useEffect(() => {
    if (!columns.length) return;

    const existingFieldConfig = extractFieldConfigFromMeta(view?.meta);
    const backendConfigStr = JSON.stringify(existingFieldConfig.toSorted((a, b) => (a.position || 0) - (b.position || 0)));

    // If we haven't initialized yet, initialize from backend or generate default
    if (!initializedRef.current) {
      if (existingFieldConfig.length > 0) {
        // Use backend config if it exists, but ensure all columns are included
        const completeConfig = mergeFieldConfigWithColumns(existingFieldConfig, columns);
        
        setLocalFieldConfig(completeConfig);
        lastBackendConfigRef.current = JSON.stringify(completeConfig.toSorted((a, b) => (a.position || 0) - (b.position || 0)));
        initializedRef.current = true;
      } else {
        // Generate default config (first 3-4 fields visible)
        const defaultFieldConfig = generateDefaultFieldConfig(
          columns,
          4,
          (col) => {
            // Exclude attachment fields and formula fields
            const isAttachmentField = col.type === 'attachment' || col.uidt === 'attachment';
            const isFormulaFieldType = isFormulaField(col);
            return isAttachmentField || isFormulaFieldType;
          }
        );

        const defaultConfigStr = JSON.stringify(defaultFieldConfig.toSorted((a, b) => (a.position || 0) - (b.position || 0)));
        setLocalFieldConfig(defaultFieldConfig);
        lastBackendConfigRef.current = defaultConfigStr;
        initializedRef.current = true;
      }
      return;
    }

    // After initialization, only update if backend config actually changed (from a completed save)
    // This prevents overwriting local user changes
    if (initializedRef.current && backendConfigStr !== lastBackendConfigRef.current && existingFieldConfig.length > 0) {
      // Backend config changed - update local state (this happens after our save completes)
      const mergedConfig = mergeFieldConfigWithColumns(existingFieldConfig, columns);
      
      setLocalFieldConfig(mergedConfig);
      lastBackendConfigRef.current = JSON.stringify(mergedConfig.toSorted((a, b) => (a.position || 0) - (b.position || 0)));
    } else if (initializedRef.current && existingFieldConfig.length === 0 && localFieldConfig.length > 0) {
      // No backend config but we have local config - check for new columns
      const mergedConfig = mergeFieldConfigWithColumns(localFieldConfig, columns);
      
      // Only update if there are actual changes
      if (mergedConfig.length !== localFieldConfig.length) {
        setLocalFieldConfig(mergedConfig);
      }
    }
  }, [view?.meta, columns]);

  // Store current values in refs to avoid recreating debounced function
  const updateViewConfigRef = useRef(updateViewConfig);
  const viewRef = useRef(view);
  
  useEffect(() => {
    updateViewConfigRef.current = updateViewConfig;
    viewRef.current = view;
  }, [updateViewConfig, view]);

  // Debounced API call for field config updates
  const debouncedUpdateFieldConfig = useDebounce(async (fieldConfig: any[]) => {
    if (updateViewConfigRef.current && viewRef.current?.id) {
      try {
        // Use updateViewConfig which properly merges into meta
        await updateViewConfigRef.current(String(viewRef.current.id), {
          fieldConfig
        });
        // Update ref after successful save so we know the backend has the new config
        lastBackendConfigRef.current = JSON.stringify(fieldConfig.toSorted((a, b) => (a.position || 0) - (b.position || 0)));
      } catch (error) {
        console.error('Failed to save field config:', error);
      }
    }
  }, 500); // Wait 500ms after last toggle before making API call

  // Visible columns based on field config
  // Optimized with Map for O(1) field config lookups instead of O(n) find() calls
  const visibleColumns = useMemo(() => {
    // For calendar sidebar sorting, we want all columns available (like grid view)
    // The SortPopover will handle filtering out appropriate columns
    if (!Array.isArray(localFieldConfig) || localFieldConfig.length === 0) return columns;
    
    // Create a Map for O(1) field config lookups instead of O(n) find() calls
    const fieldConfigMap = new Map(
      localFieldConfig.map(fc => [String(fc.id), fc])
    );
    
    return columns.map(col => {
      const fieldConfig = fieldConfigMap.get(String(col.id));
      if (fieldConfig) {
        return {
          ...col,
          hidden: Boolean(fieldConfig.isHidden),
          is_hidden: Boolean(fieldConfig.isHidden),
          position: fieldConfig.position ?? col.position
        };
      }
      // Default to hidden if no fieldConfig entry exists
      return {
        ...col,
        hidden: true,
        is_hidden: true
      };
    }).toSorted((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [columns, localFieldConfig]);

  // Handle real-time filtering while typing
  const handleRealTimeFilter = useCallback((filter: FilterType | null) => {
    setDraftFilter(filter);
  }, []);

  // Add a filter and persist view config (only if not read-only)
  const handleAddFilter = useCallback(async (filter: FilterType) => {
    const newFilters = [...filters, filter];
    // Update local state immediately for optimistic UI
    setFilters(newFilters);
    // Clear draft filter when filter is saved
    setDraftFilter(null);

    // Only persist to backend if NOT read-only
    if (!isReadOnly && updateViewConfig && view?.id) {
      await updateViewConfig(String(view.id), {
        filters: newFilters
      });
      // Update ref after successful save
      lastBackendFiltersRef.current = JSON.stringify(newFilters);
    }
  }, [filters, updateViewConfig, view, isReadOnly]);

  // Remove a filter at given index and persist view config (only if not read-only)
  const handleRemoveFilter = useCallback(async (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    // Update local state immediately for optimistic UI
    setFilters(newFilters);

    // Only persist to backend if NOT read-only
    if (!isReadOnly && updateViewConfig && view?.id) {
      await updateViewConfig(String(view.id), {
        filters: newFilters
      });
      // Update ref after successful save
      lastBackendFiltersRef.current = JSON.stringify(newFilters);
    }
  }, [filters, updateViewConfig, view, isReadOnly]);

  // Update a filter at given index and persist view config (only if not read-only)
  const handleUpdateFilter = useCallback(async (index: number, updates: Partial<FilterType>) => {
    if (index < 0 || index >= filters.length) return;

    // Create the updated filter
    const updatedFilter = { ...filters[index], ...updates };

    // If the value is being cleared (empty string), remove the filter entirely
    if (updates.value === '' && !updatedFilter.value) {
      await handleRemoveFilter(index);
      return;
    }

    // Update the filter in place
    const newFilters = filters.map((filter, i) => 
      i === index ? updatedFilter : filter
    );
    
    // Update local state immediately for optimistic UI
    setFilters(newFilters);

    // Only persist to backend if NOT read-only
    if (!isReadOnly && updateViewConfig && view?.id) {
      await updateViewConfig(String(view.id), {
        filters: newFilters
      });
      // Update ref after successful save
      lastBackendFiltersRef.current = JSON.stringify(newFilters);
    }
  }, [filters, updateViewConfig, view, handleRemoveFilter, isReadOnly]);

  // Change sorts and persist view config (only if not read-only)
  const handleSortChange = useCallback(async (newSorts: SortItem[]) => {
    // Filter out empty sorts (with empty column) before saving
    const validSorts = filterValidSorts(newSorts);
    
    // Update local state immediately for optimistic UI
    setSorts(validSorts);

    // Only persist to backend if NOT read-only
    if (!isReadOnly && updateViewConfig && view?.id) {
      await updateViewConfig(String(view.id), {
        sorts: validSorts
      });
      // Update ref after successful save
      lastBackendSortsRef.current = JSON.stringify(validSorts);
    }
  }, [updateViewConfig, view, isReadOnly]);

  // Field toggle handler for FieldsPopover
  const handleFieldToggle = useCallback(async (fieldId: string) => {
    if (!updateViewConfig) return;

    // Use functional update to avoid dependency on localFieldConfig
    setLocalFieldConfig(prevConfig => {
      // Ensure all columns are in config before toggling
      const allColumnsConfig = mergeFieldConfigWithColumns(prevConfig, columns);
      
      const updatedFieldConfig = allColumnsConfig.map((fc: any) => {
        if (String(fc.id) === String(fieldId)) {
          return { ...fc, isHidden: !fc.isHidden };
        }
        return fc;
      });

      // Debounced API call - will only execute after 500ms of no more toggles
      debouncedUpdateFieldConfig(updatedFieldConfig);

      return updatedFieldConfig;
    });
  }, [updateViewConfig, debouncedUpdateFieldConfig, columns]);

  // Field order change handler for FieldsPopover
  const handleFieldOrderChange = useCallback(async (newColumns: GridColumn[]) => {
    if (!updateViewConfig || !view?.id) return;

    // Get existing fieldConfig from view meta
    const existingFieldConfig = (view?.meta?.fieldConfig || []) as any[];
    
    // Create a map of new positions from reordered columns
    const newColumnMap = new Map<string, number>();
    newColumns.forEach((col, index) => {
      if (col.id) {
        newColumnMap.set(String(col.id), index);
      }
    });

    // Also create a map for newColumns data (including hidden/isHidden) for O(1) lookups
    const newColumnsMap = new Map<string, any>();
    newColumns.forEach((col) => {
      if (col.id) {
        newColumnsMap.set(String(col.id), col);
      }
    });

    // Update fieldConfig preserving all columns, updating positions for reordered ones
    // Optimized with Map for O(1) lookups instead of O(n) find() calls
    const updatedFieldConfig = existingFieldConfig.map((fc: any) => {
      const fcIdStr = String(fc.id);
      const newPosition = newColumnMap.get(fcIdStr);
      if (newPosition !== undefined) {
        // This column was reordered, use new position
        const newColumn = newColumnsMap.get(fcIdStr);
        // Compute isHidden to avoid nested ternary
        let computedIsHidden = fc.isHidden;
        if (typeof newColumn?.hidden === 'boolean') {
          computedIsHidden = !!newColumn.hidden;
        } else if (typeof newColumn?.isHidden === 'boolean') {
          computedIsHidden = !!newColumn.isHidden;
        }
        return {
          ...fc,
          position: newPosition,
          isHidden: computedIsHidden
        };
      }
      // This column wasn't in the reordered list, keep existing config
      return fc;
    });

    // Also handle any new columns that might not be in fieldConfig yet
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

    // Sort by position and re-index to ensure no gaps
    const sortedFieldConfig = updatedFieldConfig.toSorted((a: any, b: any) => (a.position || 0) - (b.position || 0));
    const finalFieldConfig = sortedFieldConfig.map((fc: any, idx: number) => ({
      ...fc,
      position: idx
    }));

    // Update local state immediately for optimistic UI
    setLocalFieldConfig(finalFieldConfig);

    // Persist to backend - use updateViewConfig which properly merges into meta
    await updateViewConfig(String(view.id), {
      fieldConfig: finalFieldConfig
    });
    // Update ref after successful save
    lastBackendConfigRef.current = JSON.stringify(finalFieldConfig.toSorted((a, b) => (a.position || 0) - (b.position || 0)));
  }, [updateViewConfig, view]);

  return {
    // State
    filters,
    sorts,
    draftFilter,
    localFieldConfig,
    setLocalFieldConfig,
    visibleColumns,
    
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

