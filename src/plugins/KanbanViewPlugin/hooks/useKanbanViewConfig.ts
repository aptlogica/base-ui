import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../../../utils/helpers';
import { SortItem, filterValidSorts } from '../../../utils/sortUtils';
import { extractFieldConfigFromMeta, generateDefaultFieldConfig, mergeFieldConfigWithColumns } from '../../../utils/viewFieldConfigUtils';
import { isFormulaField } from '../../../utils/fieldUtils';
import { useViewFilterSortHandlers, type ViewFilterType } from '../../../hooks/useViewFilterSortHandlers';

export type FilterType = ViewFilterType;

interface UseKanbanViewConfigOptions {
  view?: any;
  columns: any[];
  updateViewConfig?: (viewId: string, updates: Record<string, unknown>) => Promise<void>;
  isReadOnly?: boolean;
}

export function useKanbanViewConfig({
  view,
  columns,
  updateViewConfig,
  isReadOnly = false,
}: UseKanbanViewConfigOptions) {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSearchField, setSelectedSearchField] = useState<{ key: string; title: string; type: string } | null>(null);
  
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

  // Initialize filters and sorts from view config
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
    const sortedExistingConfig = [...existingFieldConfig].sort((a, b) => (a.position || 0) - (b.position || 0));
    const backendConfigStr = JSON.stringify(sortedExistingConfig);

    if (!initializedRef.current) {
      if (existingFieldConfig.length > 0) {
        const completeConfig = mergeFieldConfigWithColumns(existingFieldConfig, columns);
        const sortedCompleteConfig = [...completeConfig].sort((a, b) => (a.position || 0) - (b.position || 0));
        
        setLocalFieldConfig(completeConfig);
        lastBackendConfigRef.current = JSON.stringify(sortedCompleteConfig);
        initializedRef.current = true;
      } else {
        const defaultFieldConfig = generateDefaultFieldConfig(
          columns,
          4,
          (col) => {
            const isSelectField = col.type === 'select' || col.uidt === 'select' || col.uidt === 'singleSelect';
            // Include attachment fields - they can be toggled and shown as fields (like Gallery)
            const isFormulaFieldType = isFormulaField(col);
            // Allow Title field even if it's a system field
            const isTitleField = col.title?.toLowerCase() === 'title' || col.column_name?.toLowerCase() === 'title';
            const isSystemField = col.system || col.hidden || false;
            // Exclude if it's select/formula, OR if it's a system field that's NOT Title
            return isSelectField || isFormulaFieldType || (isSystemField && !isTitleField);
          }
        );

        const sortedDefaultConfig = [...defaultFieldConfig].sort((a, b) => (a.position || 0) - (b.position || 0));
        const defaultConfigStr = JSON.stringify(sortedDefaultConfig);
        setLocalFieldConfig(defaultFieldConfig);
        lastBackendConfigRef.current = defaultConfigStr;
        initializedRef.current = true;
      }
      return;
    }

    if (initializedRef.current && backendConfigStr !== lastBackendConfigRef.current && existingFieldConfig.length > 0) {
      const mergedConfig = mergeFieldConfigWithColumns(existingFieldConfig, columns);
      const sortedMergedConfig = [...mergedConfig].sort((a, b) => (a.position || 0) - (b.position || 0));
      
      setLocalFieldConfig(mergedConfig);
      lastBackendConfigRef.current = JSON.stringify(sortedMergedConfig);
    } else if (initializedRef.current && existingFieldConfig.length === 0 && localFieldConfig.length > 0) {
      const mergedConfig = mergeFieldConfigWithColumns(localFieldConfig, columns);
      
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
        await updateViewConfigRef.current(viewRef.current.id, {
          fieldConfig
        });
        const sortedFieldConfig = [...fieldConfig].sort((a, b) => (a.position || 0) - (b.position || 0));
        lastBackendConfigRef.current = JSON.stringify(sortedFieldConfig);
      } catch (error) {
        console.error('Failed to save field config:', error);
      }
    }
  }, 500);

  // Handle search
  const handleSearch = useCallback((term: string, field: { key: string; title: string; type: string } | null) => {
    setSearchTerm(term);
    setSelectedSearchField(field);
  }, []);

  const {
    handleRealTimeFilter,
    handleAddFilter,
    handleRemoveFilter,
    handleUpdateFilter,
    handleSortChange,
  } = useViewFilterSortHandlers<SortItem>({
    filters,
    setFilters,
    setDraftFilter,
    isReadOnly,
    persistFilters: async (next) => {
      if (!updateViewConfig || !view?.id) return;
      await updateViewConfig(view.id, { filters: next });
    },
    persistSorts: async (next) => {
      if (!updateViewConfig || !view?.id) return;
      await updateViewConfig(view.id, { sorts: next });
    },
    sanitizeSorts: (next) => filterValidSorts(next),
  });

  const handleSortChangeWithState = useCallback(async (newSorts: SortItem[]) => {
    const validSorts = filterValidSorts(newSorts);
    setSorts(validSorts);
    await handleSortChange(validSorts);
  }, [handleSortChange]);

  // Handle field toggle with debounced persistence
  const handleFieldToggle = useCallback(async (fieldId: string) => {
    if (!updateViewConfig) return;

    setLocalFieldConfig(prevConfig => {
      let updatedFieldConfig = [...prevConfig];
      
      const configFieldIds = new Set(updatedFieldConfig.map(fc => String(fc.id)));
      columns.forEach((col, idx) => {
        if (col.id && !configFieldIds.has(String(col.id))) {
          const isSystemField = col.system || col.hidden || false;
          const isSelectField = col.type === 'select' || col.uidt === 'select' || col.uidt === 'singleSelect';
          const isAttachmentField = col.type === 'attachment' || col.uidt === 'attachment';
          const isFormulaFieldType = isFormulaField(col);
          
          updatedFieldConfig.push({
            id: String(col.id),
            position: idx,
            isHidden: isSystemField || isSelectField || isAttachmentField || isFormulaFieldType
          });
          configFieldIds.add(String(col.id));
        }
      });
      
      // Use Map for O(1) lookups instead of O(n) findIndex/find
      const fieldConfigMap = new Map(
        updatedFieldConfig.map((fc, idx) => [String(fc.id), { config: fc, index: idx }])
      );
      const columnMap = new Map(
        columns.map((col, idx) => [String(col.id), { column: col, index: idx }])
      );
      
      const fieldConfigEntry = fieldConfigMap.get(String(fieldId));
      
      if (fieldConfigEntry) {
        updatedFieldConfig[fieldConfigEntry.index] = {
          ...fieldConfigEntry.config,
          isHidden: !fieldConfigEntry.config.isHidden
        };
      } else {
        const columnEntry = columnMap.get(String(fieldId));
        if (columnEntry) {
          updatedFieldConfig.push({
            id: String(fieldId),
            position: columnEntry.index,
            isHidden: false
          });
        }
      }
      
      const sortedFieldConfig = [...updatedFieldConfig].sort((a, b) => (a.position || 0) - (b.position || 0));
      updatedFieldConfig = sortedFieldConfig.map((fc, idx) => ({
        ...fc,
        position: idx
      }));

      debouncedUpdateFieldConfig(updatedFieldConfig);

      return updatedFieldConfig;
    });
  }, [updateViewConfig, debouncedUpdateFieldConfig, columns]);

  // Handle field order change
  const handleFieldOrderChange = useCallback(async (newColumns: any[]) => {
    if (!updateViewConfig || !view?.id) return;

    const existingFieldConfig = (view?.meta?.fieldConfig || []) as any[];
    
    const newColumnMap = new Map<string, number>();
    newColumns.forEach((col, index) => {
      if (col.id) {
        newColumnMap.set(String(col.id), index);
      }
    });

    // Create Map for O(1) column lookups instead of multiple find() calls
    const newColumnDataMap = new Map<string, any>();
    newColumns.forEach((col) => {
      if (col.id) {
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
          isHidden: typeof (col?.deleted) === 'boolean' 
            ? !col.deleted 
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
          isHidden: col.deleted || false
        });
      }
    });

    const sortedFieldConfig = [...updatedFieldConfig].sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
    const finalFieldConfig = sortedFieldConfig.map((fc: any, idx: number) => ({
      ...fc,
      position: idx
    }));

    setLocalFieldConfig(finalFieldConfig);

    await updateViewConfig(view.id, {
      fieldConfig: finalFieldConfig
    });
  }, [updateViewConfig, view]);

  return {
    // State
    searchTerm,
    selectedSearchField,
    filters,
    sorts,
    draftFilter,
    localFieldConfig,
    
    // Handlers
    handleSearch,
    handleRealTimeFilter,
    handleAddFilter,
    handleRemoveFilter,
    handleUpdateFilter,
    handleSortChange: handleSortChangeWithState,
    handleFieldToggle,
    handleFieldOrderChange,
  };
}

