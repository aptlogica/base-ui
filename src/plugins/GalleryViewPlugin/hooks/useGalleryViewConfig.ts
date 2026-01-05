import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDebounce } from '../../../utils/helpers';
import { filterValidSorts } from '../../../utils/sortUtils';
import { SortItem } from '../../../utils/sortUtils';
import { BaseColumn } from '../../../types/column.types';
import { extractFieldConfigFromMeta, generateDefaultFieldConfig, mergeFieldConfigWithColumns } from '../../../utils/viewFieldConfigUtils';
import { isFormulaField } from '../../../utils/fieldUtils';
import { SearchField } from '../../../hooks/useSearch';

export type FilterType = { column: string; operator: string; value: string };

interface UseGalleryViewConfigOptions {
  view?: any;
  columns: BaseColumn[];
  updateView?: (viewId: string, updates: Record<string, unknown>) => Promise<void>;
  searchableColumns: BaseColumn[];
  isReadOnly?: boolean;
}

export function useGalleryViewConfig({
  view,
  columns,
  updateView,
  searchableColumns,
  isReadOnly = false,
}: UseGalleryViewConfigOptions) {
  // Filters state
  const [filters, setFilters] = useState<FilterType[]>([]);
  
  // Sorts state
  const [sorts, setSorts] = useState<SortItem[]>([]);
  
  // Real-time draft filter (for preview before saving)
  const [draftFilter, setDraftFilter] = useState<FilterType | null>(null);
  
  // Search state
  const defaultSearchField = searchableColumns.length > 0 ? {
    key: searchableColumns[0].key || searchableColumns[0].column_name || '',
    title: searchableColumns[0].title || '',
    type: searchableColumns[0].type || ''
  } : null;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSearchField, setSelectedSearchField] = useState<SearchField | null>(defaultSearchField);
  
  // Local field configuration state
  const [localFieldConfig, setLocalFieldConfig] = useState<Array<{
    id: string;
    position: number;
    isHidden: boolean;
  }>>([]);
  
  // Track if we've initialized to prevent resetting user changes
  const initializedRef = useRef(false);
  const lastBackendConfigRef = useRef<string>('');

  // Initialize filters and sorts from view config
  useEffect(() => {
    const cfgFilters = Array.isArray(view?.meta?.filters)
      ? (view.meta.filters as FilterType[])
      : [];
    setFilters(cfgFilters);
  }, [view?.id, view?.meta?.filters]);

  useEffect(() => {
    const cfgSorts = Array.isArray(view?.meta?.sorts)
      ? (view.meta.sorts as SortItem[])
      : [];
    setSorts(cfgSorts);
  }, [view?.id, view?.meta?.sorts]);

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
        // Generate default config (first 3-4 fields visible)
        const defaultFieldConfig = generateDefaultFieldConfig(
          columns,
          4,
          (col) => {
            const isAttachmentField = col.type === 'attachment' || col.uidt === 'attachment';
            const isFormulaFieldType = isFormulaField(col);
            return isAttachmentField || isFormulaFieldType;
          }
        );

        const defaultConfigStr = JSON.stringify(defaultFieldConfig.sort((a, b) => (a.position || 0) - (b.position || 0)));
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
      lastBackendConfigRef.current = JSON.stringify(mergedConfig.sort((a, b) => (a.position || 0) - (b.position || 0)));
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
        // Pass fieldConfig directly - updateView will merge it into meta
        await updateViewRef.current(viewRef.current.id, {
          fieldConfig
        });
        // Update ref after successful save so we know the backend has the new config
        lastBackendConfigRef.current = JSON.stringify(fieldConfig.sort((a, b) => (a.position || 0) - (b.position || 0)));
      } catch (error) {
        console.error('Failed to save field config:', error);
      }
    }
  }, 500); // Wait 500ms after last toggle before making API call

  // Visible columns based on field config (optimized with Map for O(1) lookups)
  const visibleColumns = useMemo(() => {
    // Create a Map for O(1) field config lookups instead of O(n) find() calls
    const fieldConfigMap = new Map(
      localFieldConfig.map(fc => [String(fc.id), fc])
    );
    
    return columns.filter(col => {
      if (!col.id) return false;
      // Include attachment fields - they can be toggled (though they're also shown as images)
      
      // Normalize ID to string for comparison
      const colIdStr = String(col.id);
      const fieldConfig = fieldConfigMap.get(colIdStr);
      
      // If fieldConfig exists, use its isHidden value
      if (fieldConfig) {
        return !fieldConfig.isHidden;
      }
      // If no fieldConfig entry (shouldn't happen after initialization), default to hidden
      return false;
    });
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
    if (!isReadOnly && updateView && view?.id) {
      await updateView(view.id, {
        filters: newFilters
      });
    }
  }, [filters, updateView, view, isReadOnly]);

  // Remove a filter at given index and persist view config (only if not read-only)
  const handleRemoveFilter = useCallback(async (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    // Update local state immediately for optimistic UI
    setFilters(newFilters);

    // Only persist to backend if NOT read-only
    if (!isReadOnly && updateView && view?.id) {
      await updateView(view.id, {
        filters: newFilters
      });
    }
  }, [filters, updateView, view, isReadOnly]);

  // Update a filter at given index and persist view config (only if not read-only)
  const handleUpdateFilter = useCallback(async (index: number, updates: Partial<FilterType>) => {
    const newFilters = [...filters];
    if (newFilters[index]) {
      newFilters[index] = { ...newFilters[index], ...updates };
      // Update local state immediately for optimistic UI
      setFilters(newFilters);

      // Only persist to backend if NOT read-only
      if (!isReadOnly && updateView && view?.id) {
        await updateView(view.id, {
          filters: newFilters
        });
      }
    }
  }, [filters, updateView, view, isReadOnly]);

  // Change sorts and persist view config (only if not read-only)
  const handleSortChange = useCallback(async (newSorts: SortItem[]) => {
    // Filter out empty sorts (with empty column) before saving
    const validSorts = filterValidSorts(newSorts);
    
    // Update local state immediately for optimistic UI
    setSorts(validSorts);

    // Only persist to backend if NOT read-only
    if (!isReadOnly && updateView && view?.id) {
      await updateView(view.id, { sorts: validSorts });
    }
  }, [updateView, view, isReadOnly]);

  // Field toggle handler for FieldsPopover
  const handleFieldToggle = useCallback(async (fieldId: string) => {
    if (!updateView || !view?.id) return;

    // Use functional update to avoid dependency on localFieldConfig
    setLocalFieldConfig(prevConfig => {
      let updatedFieldConfig = [...prevConfig];
      
      // Ensure all columns are in the config first (in case any are missing)
      const configFieldIds = new Set(updatedFieldConfig.map(fc => String(fc.id)));
      columns.forEach((col, idx) => {
        if (col.id && !configFieldIds.has(String(col.id))) {
          const isSystemField = col.system || col.hidden || false;
          const isAttachmentField = col.type === 'attachment' || col.uidt === 'attachment';
          const isFormulaFieldType = isFormulaField(col);
          
          updatedFieldConfig.push({
            id: String(col.id),
            position: idx,
            isHidden: isSystemField || isAttachmentField || isFormulaFieldType ? true : true // Default to hidden for new columns
          });
          configFieldIds.add(String(col.id));
        }
      });
      
      // Now toggle the specific field
      const fieldIndex = updatedFieldConfig.findIndex(fc => String(fc.id) === String(fieldId));
      
      if (fieldIndex >= 0) {
        // Field exists in config, toggle its visibility
        updatedFieldConfig[fieldIndex] = {
          ...updatedFieldConfig[fieldIndex],
          isHidden: !updatedFieldConfig[fieldIndex].isHidden
        };
      } else {
        // Field doesn't exist - add it (shouldn't happen after ensuring all columns are in config)
        const column = columns.find(c => String(c.id) === String(fieldId));
        if (column) {
          const columnIndex = columns.findIndex(c => String(c.id) === String(fieldId));
          updatedFieldConfig.push({
            id: String(fieldId),
            position: columnIndex,
            isHidden: false // User is toggling to show it
          });
        }
      }
      
      // Sort by position and re-index
      updatedFieldConfig.sort((a, b) => (a.position || 0) - (b.position || 0));
      updatedFieldConfig = updatedFieldConfig.map((fc, idx) => ({
        ...fc,
        position: idx
      }));

      // Debounced API call - will only execute after 500ms of no more toggles
      debouncedUpdateFieldConfig(updatedFieldConfig);

      return updatedFieldConfig;
    });
  }, [updateView, view, columns, debouncedUpdateFieldConfig]);

  // Field order change handler for FieldsPopover
  const handleFieldOrderChange = useCallback(async (newColumns: BaseColumn[]) => {
    if (!updateView || !view?.id) return;

    // Get existing fieldConfig from view meta
    const existingFieldConfig = (view?.meta?.fieldConfig || []) as any[];

    // Create a map of new positions from reordered columns
    const newColumnMap = new Map<string, number>();
    newColumns.forEach((col, index) => {
      if (col.id) {
        newColumnMap.set(String(col.id), index);
      }
    });

    // Update fieldConfig preserving all columns, updating positions for reordered ones
    const updatedFieldConfig = existingFieldConfig.map((fc: any) => {
      const newPosition = newColumnMap.get(String(fc.id));
      if (newPosition !== undefined) {
        // This column was reordered, use new position
        return {
          ...fc,
          position: newPosition,
          // Update isHidden if provided in newColumns
          isHidden: typeof (newColumns.find(c => String(c.id) === String(fc.id))?.hidden) === 'boolean'
            ? newColumns.find(c => String(c.id) === String(fc.id))?.hidden
            : fc.isHidden
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
          isHidden: col.hidden || false
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

    // Persist to backend - pass fieldConfig directly, updateView will merge it into meta
    await updateView(view.id, {
      fieldConfig: finalFieldConfig
    });
  }, [updateView, view]);

  return {
    // State
    filters,
    sorts,
    draftFilter,
    searchTerm,
    setSearchTerm,
    selectedSearchField,
    setSelectedSearchField,
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

