import React, { useMemo, useCallback, useRef } from 'react';
import { buildInitialValuesForEdit } from '../../../../utils/initialValues';
import { Plus, List } from 'lucide-react';
import { useToast } from '../../../../components/common/Toast';
import KanbanStack from './KanbanStack';
import { KanbanFieldConfiguration } from '../KanbanFieldSelector';
import CreateRecordModal from '../../../../components/modals/CreateRecordModal';
import EditRecordModal from '../../../../components/modals/EditRecordModal';
import { compareValues } from '../../../../utils/sortUtils';
import { applyFilters as applyCardFilters } from '../../../../utils/filterUtils';
import DeleteConfirmModal from '../../../../components/modals/DeleteConfirmModal';
import { FilterPopover } from '../../../../components/shared/table/FilterPopover';
import { FieldsPopover } from '../../../../components/shared/table/FieldsPopover';
import { SortPopover } from '../../../../components/shared/table/SortPopover';
import { Search } from '../../../../components/shared/table/Search';
import { BaseColumn } from '../../../../types/column.types';
import { normalizeFieldType } from '../../../../utils/fieldType';
import { parseApiColumnMeta } from '../../../../components/shared/table/tableUtils';
import { fieldsToExcludeInFilter } from '../../../../types/constants';
import { useBaseAccess } from '../../../../hooks/useBaseAccess';
import { ColumnConfig } from '../../../../plugins/GridViewPlugin/types/grid.types';
import { useAddRow, useInsertRowData, useDeleteRecord, useUpdateField, useUpdateView, useUpdateViewMeta } from '../../../../hooks/useApi';
// Custom hooks
import { useKanbanViewConfig } from '../../hooks/useKanbanViewConfig';
import { useKanbanModals } from '../../hooks/useKanbanModals';
import { useKanbanStacks } from '../../hooks/useKanbanStacks';

// Type alias for compatibility
type Column = BaseColumn;

type KanbanActions = {
  moveCard?: (cardId: string, targetStackId: string) => Promise<void>;
  createCard?: (initialValues: Record<string, any>) => Promise<string>;
  deleteCard: (cardId: string) => Promise<void>;
  duplicateCard: (cardId: string) => Promise<string>;
  updateFieldOptions: (fieldId: string, options: string[] | Array<{ option: string; color: string }>) => Promise<void>;
  persistStackOrder?: (newOrder: string[]) => Promise<void>;
  changeGroupByColumn: (col: Column | null) => Promise<void>;
  updateViewConfig: (viewId: string, updates: Record<string, unknown>) => Promise<void>;
  addRow: ReturnType<typeof useAddRow>;
  insertRowData: ReturnType<typeof useInsertRowData>;
  deleteRecord: ReturnType<typeof useDeleteRecord>;
  updateField: ReturnType<typeof useUpdateField>;
  updateView: ReturnType<typeof useUpdateView>;
  updateViewMeta: ReturnType<typeof useUpdateViewMeta>;
};

interface KanbanBoardProps {
  tableData: {
    model: any;
    columns: any[];
    records: any[];
    views?: any[];
  };
  viewId?: string;
  onRefresh: () => void;
  actions?: KanbanActions;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tableData,
  viewId,
  onRefresh,
  actions,
}) => {
  const toast = useToast();

  // Extract base ID for permission checks
  const baseId = useMemo(() => String(tableData?.model?.base_id ?? ''), [tableData?.model?.base_id]);

  // Check permissions for read-only access
  const { isBaseReadOnly, canCreateRecord, canDeleteRecord, canUpdateRecord } = useBaseAccess(baseId || undefined);

  // Safe handlers pattern: Check read-only once at top level
  const isReadOnly = isBaseReadOnly();

  // Transform API data to UI-ready format (similar to Table and FormView components)
  const columns = useMemo(() => {
    if (!tableData?.columns || !Array.isArray(tableData.columns)) return [];

    return tableData.columns
      .slice()
      .sort((a: any, b: any) => (a?.order_index ?? 0) - (b?.order_index ?? 0))
      .map((apiColumn: any): BaseColumn => ({
        id: String(apiColumn.id ?? ''),
        key: String(apiColumn.column_name ?? apiColumn.title ?? apiColumn.id ?? ''),
        column_name: apiColumn.column_name,
        title: String(apiColumn.title ?? apiColumn.column_name ?? ''),
        type: normalizeFieldType(String(apiColumn.uidt ?? 'text')),
        uidt: apiColumn.uidt,
        width: 175,
        position: apiColumn.order_index ?? 0,
        order_index: apiColumn.order_index ?? 0,
        isSystem: Boolean(apiColumn.system),
        system: Boolean(apiColumn.system),
        hidden: Boolean(apiColumn.hidden),
        is_hidden: Boolean(apiColumn.is_hidden),
        config: parseApiColumnMeta(apiColumn.meta),
        options: parseApiColumnMeta(apiColumn.meta).options || [],
      }));
  }, [tableData?.columns]);

  // Get select columns for grouping
  const selectColumns = useMemo(() => {
    return columns.filter(col =>
      col.type === 'select' || col.type === 'singleSelect' ||
      col.uidt === 'select' || col.uidt === 'singleSelect'
    );
  }, [columns]);

  // Get searchable columns (exclude system fields except Title)
  const searchableColumns = useMemo(() => {
    return columns.filter(col => {
      const isSystemField = col.isSystem || col.system;
      const isTitle = col.title.toLowerCase() === 'title' || col.column_name?.toLowerCase() === 'title';
      return !isSystemField || isTitle;
    });
  }, [columns]);

  // Get columns for sort/filter popovers (exclude certain fields) - memoized to prevent recreation
  const sortableColumns = useMemo(() => {
    return columns
      .filter(col => {
        const uidt = String(col.uidt || col.type || '').toLowerCase();
        return !fieldsToExcludeInFilter.includes(uidt);
      })
      .map((col: any) => ({
        key: col.column_name || col.key || col.id || '',
        column_name: col.column_name,
        title: col.title,
        type: col.type,
        uidt: col.uidt,
        id: col.id,
        config: col.config || col.meta || {}, // Include config for SingleSelect/MultiSelect options
        options: col.options || col.config?.options || col.meta?.options, // Include options directly
        meta: col.meta, // Include meta as fallback
        hidden: col.hidden,
        isHidden: col.isHidden,
        system: col.system
      }));
  }, [columns]);

  // Convert BaseColumn[] to ColumnConfig[] for FieldsPopover
  const columnConfigs = useMemo((): ColumnConfig[] => {
    return columns.map((col): ColumnConfig => ({
      id: col.id ? String(col.id) : undefined,
      key: col.key || col.column_name || '',
      column_name: col.column_name,
      title: col.title || col.column_name || '',
      type: normalizeFieldType(col.type || col.uidt || 'text') as any,
      uidt: col.uidt,
      position: col.position || col.order_index || 0,
      order_index: col.order_index || 0,
      isSystem: col.isSystem || col.system || false,
      system: col.system || false,
      hidden: col.hidden || false,
      is_hidden: col.isHidden || col.is_hidden || false,
      meta: col.meta,
      config: col.config || col.meta,
    }));
  }, [columns]);

  // Convert sortableColumns to ColumnConfig[] for FilterPopover
  const sortableColumnConfigs = useMemo((): ColumnConfig[] => {
    return sortableColumns.map((col): ColumnConfig => ({
      id: col.id ? String(col.id) : undefined,
      key: col.key || col.column_name || '',
      column_name: col.column_name || col.key,
      title: col.title || col.column_name || '',
      type: normalizeFieldType(col.type || col.uidt || 'text') as any,
      uidt: col.uidt,
      position: 0,
      order_index: 0,
      isSystem: col.system || false,
      system: col.system || false,
      hidden: col.hidden || false,
      is_hidden: col.isHidden || false,
      meta: col.meta,
      config: col.config || col.meta,
    }));
  }, [sortableColumns]);

  // Get current view
  const view = useMemo(() => {
    if (viewId) {
      return tableData.views?.find((v: any) => v.id === viewId);
    }
    return tableData.views?.find((v: any) => v.type === 'kanban') || tableData.views?.[0];
  }, [tableData.views, viewId]);

  // Get group column from view config (optimized with Map for O(1) lookup)
  const columnMap = useMemo(() => {
    const map = new Map<string, any>();
    columns.forEach(col => {
      map.set(String(col.id), col);
    });
    return map;
  }, [columns]);

  const groupCol = useMemo(() => {
    if (!view) return selectColumns[0] || null;

    const viewMeta = view.meta ?? view.config ?? {};
    const targetFieldId = viewMeta.view_target_field;

    if (targetFieldId) {
      return columnMap.get(String(targetFieldId)) || selectColumns[0] || null;
    }

    return selectColumns[0] || null;
  }, [view, columnMap, selectColumns]);

  const localOptions = useMemo(() => {
    if (!groupCol) return [];
    return groupCol.options || [];
  }, [groupCol]);

  const tableId = useMemo(() => String(tableData?.model?.id ?? ''), [tableData?.model?.id]);
  const tableName = useMemo(() => String(tableData?.model?.title ?? ''), [tableData?.model?.title]);

  // Extract actions with proper defaults
  const {
    deleteCard: onDeleteCard = async () => { },
    duplicateCard: onDuplicateCard = async () => '',
    updateFieldOptions: onUpdateFieldOptions = async () => { },
    changeGroupByColumn: onChangeGroupByColumn = async () => { },
    updateViewConfig: onUpdateView = async () => { }
  } = actions || {};

  // View configuration hook (must be called before stacks useMemo that uses searchTerm)
  const {
    searchTerm,
    selectedSearchField,
    filters,
    sorts,
    draftFilter,
    localFieldConfig,
    handleSearch,
    handleAddFilter,
    handleRemoveFilter,
    handleUpdateFilter,
    handleSortChange,
    handleFieldToggle,
  } = useKanbanViewConfig({
    view,
    columns,
    updateViewConfig: onUpdateView,
    isReadOnly,
  });

  // Modals hook
  const {
    modalState,
    handleOpenCreateRecord,
    handleOpenEditRecord,
    handleOpenDeleteRecord,
    handleCloseCreateModal,
    handleCloseEditModal,
    handleCloseDeleteModal,
    handleCreateSuccess,
    handleEditSuccess,
  } = useKanbanModals();

  // Stacks hook
  const {
    uiState,
    collapsedStacks,
    setUiState,
    handleStackCollapse,
    handleCreateStackClick,
    handleNewOptionChange,
    handleStackDragStart,
  } = useKanbanStacks({
    view,
    updateView: actions?.updateView,
    onRefresh,
  });

  // PERFORMANCE: Extract field options and color map separately (only recalc when groupCol changes)
  const { fieldOptions, optionColorMap } = useMemo(() => {
    if (!groupCol) return { fieldOptions: [], optionColorMap: new Map<string, string>() };

    // Get options from the group column (this is the source of truth for stacks)
    const options = (groupCol.options || []).map((opt: any) => {
      if (typeof opt === 'string') return opt;
      // Handle different option structures
      return opt.option || opt.value || opt.label || opt.name || String(opt);
    });

    // Create a map of option names to their colors
    const colorMap = new Map<string, string>();
    (groupCol.options || []).forEach((opt: any) => {
      let optionName: string;
      if (typeof opt === 'string') {
        optionName = opt;
      } else {
        optionName = opt.option || opt.value || opt.label || opt.name || String(opt);
      }

      // Extract color if available (only if color is a non-empty string)
      if (typeof opt === 'object' && opt.color && typeof opt.color === 'string' && opt.color.trim() !== '') {
        colorMap.set(optionName, opt.color.trim());
      }
    });

    return { fieldOptions: options, optionColorMap: colorMap };
  }, [groupCol]);

  // PERFORMANCE: Memoize extractDisplayValue function (moved outside to avoid recreation)
  const extractDisplayValue = useCallback((val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);

    // Handle arrays
    if (Array.isArray(val)) {
      if (val.length === 0) return '';
      // If it's a nested array (like multiselect lookup), flatten it
      if (val.length > 0 && Array.isArray(val[0])) {
        const flattened: string[] = [];
        val.forEach((subArray: any) => {
          if (Array.isArray(subArray)) {
            subArray.forEach((item: any) => {
              if (item !== null && item !== undefined) {
                flattened.push(String(item));
              }
            });
          }
        });
        return flattened.join(', ');
      }
      // Regular array - extract first meaningful value
      const firstValue = val.find(v => v !== null && v !== undefined);
      if (firstValue) {
        if (typeof firstValue === 'object') {
          return firstValue.title || firstValue.label || firstValue.name || firstValue.id || '';
        }
        return String(firstValue);
      }
      return '';
    }

    // Handle objects
    if (typeof val === 'object') {
      // Try common properties that might contain displayable text
      return val.title || val.label || val.name || val.id || val.value || '';
    }

    return '';
  }, []);

  // PERFORMANCE: Memoize search-filtered records separately
  const searchFilteredRecords = useMemo(() => {
    if (!tableData?.records || !Array.isArray(tableData.records)) return [];

    // Apply search filter first
    if (searchTerm && selectedSearchField) {
      const searchLower = searchTerm.toLowerCase();
      return tableData.records.filter((record: any) => {
        const fieldValue = record[selectedSearchField.key];
        if (fieldValue === null || fieldValue === undefined) return false;
        return String(fieldValue).toLowerCase().includes(searchLower);
      });
    }

    return tableData.records;
  }, [tableData?.records, searchTerm, selectedSearchField]);

  // Build kanban stacks from field options (proper Kanban behavior)
  // Must be after hooks to access searchTerm and selectedSearchField
  const stacks = useMemo(() => {
    if (!searchFilteredRecords.length || !groupCol) return [];

    // PERFORMANCE: Use fieldOptions and optionColorMap from memoized values
    // Group records by their field value
    const stackMap = new Map<string, any[]>();
    const fieldOptionsSet = new Set(fieldOptions); // Use Set for O(1) lookup instead of includes()

    for (const record of searchFilteredRecords) {
      const value = record[groupCol.key];
      let stackName = 'Uncategorized'; // Default for null/undefined values

      if (value !== null && value !== undefined && value !== '') {
        const stringValue = extractDisplayValue(value);
        // Only use the value if it exists in field options, otherwise use Uncategorized
        if (stringValue && fieldOptionsSet.has(stringValue)) {
          stackName = stringValue;
        }
        // If not found in options, stackName remains 'Uncategorized' (already set above)
      }

      if (!stackMap.has(stackName)) {
        stackMap.set(stackName, []);
      }

      // PERFORMANCE: Only normalize if record doesn't already have _meta
      const normalizedRecord = record._meta
        ? record
        : {
          _meta: {
            id: String(record.id || ''),
            created_at: record.created_at || new Date().toISOString(),
            updated_at: record.updated_at || new Date().toISOString(),
            deleted_at: null,
            position: 0,
          },
          ...record,
          title: record.title || ''
        };

      stackMap.get(stackName)!.push(normalizedRecord);
    }

    // Get custom stack order from view config (for drag & drop reordering)
    const viewMeta = view?.meta ?? view?.config ?? {};
    const customStackOrder = Array.isArray(viewMeta.stackOrder) ? viewMeta.stackOrder : [];

    // Create final stack order: Uncategorized first, then custom order + remaining options
    const allStackNames = new Set([...fieldOptions, 'Uncategorized']);
    const orderedStacks = customStackOrder.filter((name: string) => allStackNames.has(name) && name !== 'Uncategorized');
    const remainingStacks = Array.from(allStackNames).filter((name: string) => !customStackOrder.includes(name) && name !== 'Uncategorized');
    const finalOrder = ['Uncategorized', ...orderedStacks, ...remainingStacks];

    // Default colors for fallback (used when option has no color or for Uncategorized)
    const defaultColors = [
      '#d1d5db', '#93c5fd', '#6ee7b7', '#fcd34d', '#fca5a5', '#c4b5fd'
    ];

    // Create stacks based on field options
    return finalOrder.map((stackName, index) => {
      // Get color from option map, or use default color
      let stackColor: string;
      if (stackName === 'Uncategorized') {
        stackColor = defaultColors[0]; // Gray for uncategorized
      } else {
        const optionColor = optionColorMap.get(stackName);
        // Only use option color if it's a valid non-empty hex/color string
        if (optionColor && optionColor.trim() && optionColor !== '') {
          stackColor = optionColor.trim();
        } else {
          // Fall back to default color if no valid color found
          stackColor = defaultColors[(index - 1) % defaultColors.length];
        }
      }

      return {
        id: stackName,
        name: stackName,
        color: stackColor,
        position: index,
        cards: stackMap.get(stackName) || [],
        isCollapsed: false
      };
    });
  }, [searchFilteredRecords, groupCol, view, fieldOptions, optionColorMap, extractDisplayValue]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle group by column change (following Grid view pattern)
  const handleGroupByChange = useCallback(async (item: Column | undefined) => {
    if (!item) return;

    try {
      // Persist to backend - updateView will automatically invalidate table query
      await onChangeGroupByColumn(item);
      // No need for manual refresh - updateView invalidates the table query automatically
    } catch (error) {
      console.error('Failed to change group by column:', error);
    }
  }, [onChangeGroupByColumn]);

  // Implement moveCard functionality
  const handleMoveCard = useCallback(async (cardId: string, targetStackId: string) => {
    if (!groupCol?.id) return;

    // Handle the value properly - empty string for Uncategorized, or the actual option value
    const value = targetStackId === 'Uncategorized' ? "" : targetStackId;
    const rowId = Number(cardId);

    try {
      // Use insertRowData for updating existing records (same as duplicate logic)
      await actions?.insertRowData.mutateAsync({
        model_id: String(tableId),
        column_id: String(groupCol.id),
        row_id: Number.isNaN(rowId) ? (cardId as any) : (rowId as any),
        value
      });
    } catch (error) {
      console.error('Failed to move card:', error);
      throw error;
    }
  }, [groupCol, tableId, actions?.insertRowData]);

  // Create records Map for O(1) lookups
  const recordsMap = useMemo(() => {
    const map = new Map<string, any>();
    tableData.records?.forEach((r: any) => {
      map.set(String(r.id), r);
    });
    return map;
  }, [tableData.records]);


  // PERFORMANCE: Memoize card order and filter/sort config separately
  const cardOrderConfig = useMemo(() => {
    const viewMeta = view?.meta || {};
    return (viewMeta.cardOrder || {}) as Record<string, string[]>;
  }, [view?.meta]);

  const hasFilters = Array.isArray(filters) && filters.length > 0;
  const hasDraftFilter = draftFilter !== null;
  const hasSorts = Array.isArray(sorts) && sorts.length > 0;
  const hasCardOrder = Object.keys(cardOrderConfig).length > 0;

  // PERFORMANCE: Memoize visible columns for sorting (only recalc when columns change)
  const sortColumnsForSorting = useMemo(() => {
    if (!hasSorts) return [];
    return columns
      .filter(c => !(c as any).deleted && c.column_name)
      .map(c => ({
        key: c.column_name || '',
        type: String(c.uidt)
      }));
  }, [columns, hasSorts]);

  const filteredStacks = useMemo(() => {
    // PERFORMANCE: Early return if no filters, sorts, or card order changes
    // Just apply collapsed state
    if (!hasFilters && !hasDraftFilter && !hasSorts && !hasCardOrder) {
      return stacks.map((stack) => ({
        ...stack,
        isCollapsed: collapsedStacks.has(stack.id)
      }));
    }

    // PERFORMANCE: Optimized applyCardOrder - single pass with Map
    const applyCardOrder = (stackId: string, cards: Record<string, unknown>[]): Record<string, unknown>[] => {
      const customOrder = cardOrderConfig[stackId];
      if (!customOrder || customOrder.length === 0) return cards;

      // Single pass: Create map and build ordered array efficiently
      const cardMap = new Map<string, Record<string, unknown>>();

      // Build map
      for (const card of cards) {
        const cardId = String((card as any)?._meta?.id || (card as any)?.id || '');
        cardMap.set(cardId, card);
      }

      // Build ordered array: custom order first, then remaining cards
      const ordered: Record<string, unknown>[] = [];
      const seen = new Set<string>();

      // Add cards in custom order (single iteration)
      for (const cardId of customOrder) {
        const cardIdStr = String(cardId);
        const card = cardMap.get(cardIdStr);
        if (card) {
          ordered.push(card);
          seen.add(cardIdStr);
        }
      }

      // Add remaining cards not in custom order (single iteration)
      for (const card of cards) {
        const cardId = String((card as any)?._meta?.id || (card as any)?.id || '');
        if (!seen.has(cardId)) {
          ordered.push(card);
        }
      }

      return ordered;
    };

    // Combine saved filters with draft filter (if any) for real-time preview
    const allFilters = hasDraftFilter
      ? [...filters, draftFilter]
      : filters;

    const applyFilters = (cards: Record<string, unknown>[]) => {
      if (!hasFilters && !hasDraftFilter) return cards;
      return applyCardFilters(cards, allFilters as Parameters<typeof applyCardFilters>[1], columns as Parameters<typeof applyCardFilters>[2]);
    };

    const sortCards = (cards: Record<string, unknown>[]) => {
      if (!hasSorts || cards.length === 0) return cards;

      // PERFORMANCE: Use pre-computed sortColumnsForSorting
      const byKey = (key: string) => sortColumnsForSorting.find(c => c.key === key);
      const getValue = (row: Record<string, unknown>, key: string) => {
        if (!row || !key) return undefined;
        return row[key];
      };

      const cmp = (ra: Record<string, unknown>, rb: Record<string, unknown>) => {
        if (!ra || !rb) return 0;

        for (const s of sorts) {
          if (!s.column) continue;
          const col = byKey(s.column);
          if (!col) continue;
          const va = getValue(ra, col.key);
          const vb = getValue(rb, col.key);
          const res = compareValues(va, vb, String(col.type));
          if (res !== 0) return s.direction === 'asc' ? res : -res;
        }
        return 0;
      };

      return [...cards].sort(cmp);
    };

    return stacks.map((stack) => {
      // Apply filters first
      const filtered = applyFilters(stack.cards);
      // Then apply custom card order (if no sorts, preserve custom order; if sorts exist, sorts take precedence)
      let ordered: Record<string, unknown>[];
      if (hasSorts) {
        ordered = sortCards(filtered); // If sorts exist, apply them (they override custom order)
      } else if (hasCardOrder) {
        ordered = applyCardOrder(stack.id, filtered); // If no sorts, use custom order if available
      } else {
        ordered = filtered;
      }
      return { ...stack, cards: ordered, isCollapsed: collapsedStacks.has(stack.id) };
    });
  }, [stacks, filters, draftFilter, columns, sorts, collapsedStacks, cardOrderConfig, hasFilters, hasDraftFilter, hasSorts, hasCardOrder, sortColumnsForSorting]);

  // Handle card movement between stacks with position
  const handleCardMove = useCallback(async (cardId: string, targetStackId: string, position: number) => {
    try {
      // First, update the group field value to move card to target stack
      await handleMoveCard(cardId, targetStackId);

      // Then update the card order in view meta (using optimized hook that doesn't invalidate table queries)
      if (view?.id && actions?.updateViewMeta) {
        const viewMeta = view?.meta || {};
        const cardOrder = (viewMeta.cardOrder || {}) as Record<string, string[]>;

        // Get the target stack's current order (or empty array if none)
        const targetStackOrder = cardOrder[targetStackId] || [];

        // Remove card from any existing stack orders (in case it's being moved from another stack)
        Object.keys(cardOrder).forEach(stackId => {
          cardOrder[stackId] = cardOrder[stackId].filter(id => id !== cardId);
        });

        // Insert card at the specified position in target stack
        const newTargetOrder = [...targetStackOrder];
        // Clamp position to valid range
        const clampedPosition = Math.max(0, Math.min(position, newTargetOrder.length));
        newTargetOrder.splice(clampedPosition, 0, cardId);

        // Update card order
        cardOrder[targetStackId] = newTargetOrder;

        // Persist to view meta using optimized hook (no table invalidation)
        await actions.updateViewMeta.mutateAsync({
          viewId: view.id,
          meta: { cardOrder },
          currentMeta: viewMeta // Pass current meta to avoid cache lookup
        });
      }

      // REMOVED: onRefresh() - redundant, insertRowData already invalidates table with refetchType: 'active'
      // The table will be refetched automatically via query invalidation from insertRowData
    } catch (error) {
      console.error('Error moving card:', error);
    }
  }, [handleMoveCard, view?.id, view?.meta, actions?.updateViewMeta]);


  const getCreateInitialValues = (): Record<string, unknown> => {
    const init: Record<string, unknown> = {};
    if (groupCol?.id && modalState.create.stackId) {
      init[groupCol.id] = modalState.create.stackId === 'Uncategorized' ? '' : modalState.create.stackId;
    }
    return init;
  };

  const getEditInitialValues = (): Record<string, unknown> => {
    if (!modalState.edit.recordId) return {};
    // Flatten cards as rawRecords-like list for the helper
    const allCards: Record<string, unknown>[] = (filteredStacks || []).flatMap((s) => Array.isArray(s.cards) ? s.cards : []);
    const matched = allCards.find(c => {
      const cardMeta = c._meta;
      if (cardMeta && typeof cardMeta === 'object' && 'id' in cardMeta) {
        return String(cardMeta.id) === String(modalState.edit.recordId);
      }
      return String(c.id) === String(modalState.edit.recordId);
    });
    return buildInitialValuesForEdit({
      record: matched,
      recordId: String(modalState.edit.recordId),
      columns: columns,
      // Kanban doesn't have normalizedColumns; keys are typically in col.column_name
    });
  };


  const handleDeleteRecordFromModal = useCallback(async (cardId: string) => {
    try {
      await onDeleteCard(cardId);
      handleCloseEditModal();
    } catch (err) {
      console.error('Failed to delete record:', err);
    }
  }, [onDeleteCard, handleCloseEditModal]);

  const confirmDeleteRecord = useCallback(async () => {
    if (!modalState.delete.recordId) return;
    try {
      await onDeleteCard(modalState.delete.recordId);
    } catch { }
    handleCloseDeleteModal();
  }, [modalState.delete.recordId, onDeleteCard, handleCloseDeleteModal]);

  // Handle new stack creation (add new option to field)
  const handleCreateStackKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const trimmed = uiState.newOption.trim();
    if (!trimmed || !groupCol?.id) return;

    try {
      // Get existing option names to check for duplicates
      const existingOptionNames = localOptions.map((opt: any) => {
        if (typeof opt === 'string') return opt;
        return opt?.option || opt?.value || opt?.label || String(opt);
      });

      // Add new option if it doesn't exist
      if (existingOptionNames.includes(trimmed)) {
        // Show toast for duplicate stack name
        toast.error(`Stack "${trimmed}" already exists`);
        setUiState(prev => ({ ...prev, newOption: '' }));
      } else {
        // Preserve existing options structure (with colors)
        const preservedOptions = localOptions.map((opt: any) => {
          if (typeof opt === 'string') {
            return { option: opt, color: '' };
          }
          return {
            option: opt?.option || opt?.value || opt?.label || String(opt),
            color: opt?.color || ''
          };
        });

        // Default colors for new options (cycle through)
        const defaultColors = [
          '#93c5fd', '#6ee7b7', '#fcd34d', '#fca5a5', '#c4b5fd', '#a78bfa', '#60a5fa', '#34d399'
        ];
        const newOptionIndex = preservedOptions.length;
        const newOptionColor = defaultColors[newOptionIndex % defaultColors.length];

        // Add new option with default color
        const next = [...preservedOptions, { option: trimmed, color: newOptionColor }];
        await onUpdateFieldOptions(groupCol.id, next);
        // Refresh to update the UI immediately
        onRefresh();
        setUiState(prev => ({ ...prev, newOption: '', isCreateStack: false }));
      }
    } catch (error) {
      console.error('Failed to create stack:', error);
    }
  }, [uiState.newOption, localOptions, groupCol?.id, onUpdateFieldOptions, onRefresh, setUiState, toast]);

  const handleCreateStackClickSave = useCallback(async () => {
    const trimmed = uiState.newOption.trim();
    if (!trimmed || !groupCol?.id) return;

    try {
      // Get existing option names to check for duplicates
      const existingOptionNames = localOptions.map((opt: any) => {
        if (typeof opt === 'string') return opt;
        return opt?.option || opt?.value || opt?.label || String(opt);
      });

      // Add new option if it doesn't exist
      if (existingOptionNames.includes(trimmed)) {
        // Show toast for duplicate stack name
        toast.error(`Stack "${trimmed}" already exists`);
        setUiState(prev => ({ ...prev, newOption: '' }));
      } else {
        // Preserve existing options structure (with colors)
        const preservedOptions = localOptions.map((opt: any) => {
          if (typeof opt === 'string') {
            return { option: opt, color: '' };
          }
          return {
            option: opt?.option || opt?.value || opt?.label || String(opt),
            color: opt?.color || ''
          };
        });

        // Default colors for new options (cycle through)
        const defaultColors = [
          '#93c5fd', '#6ee7b7', '#fcd34d', '#fca5a5', '#c4b5fd', '#a78bfa', '#60a5fa', '#34d399'
        ];
        const newOptionIndex = preservedOptions.length;
        const newOptionColor = defaultColors[newOptionIndex % defaultColors.length];

        // Add new option with default color
        const next = [...preservedOptions, { option: trimmed, color: newOptionColor }];
        await onUpdateFieldOptions(groupCol.id, next);
        // Refresh to update the UI immediately
        onRefresh();
        setUiState(prev => ({ ...prev, newOption: '', isCreateStack: false }));
      }
    } catch (error) {
      console.error('Failed to create stack:', error);
    }
  }, [uiState.newOption, localOptions, groupCol?.id, onUpdateFieldOptions, onRefresh, setUiState, toast]);

  // Enhanced stack drop handler with persistence
  const handleStackDropWithPersistence = useCallback(async (targetStackId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = e.dataTransfer.getData('stackId');
    if (!sourceId || sourceId === targetStackId) return;

    // Prevent moving Uncategorized stack
    if (sourceId === 'Uncategorized') return;

    const currentOrder = filteredStacks.map((s: any) => s.id);
    const from = currentOrder.indexOf(sourceId);
    const to = currentOrder.indexOf(targetStackId);
    if (from === -1 || to === -1) return;

    // Create new order: Uncategorized first, then reordered stacks
    const otherStacks = currentOrder.filter(id => id !== 'Uncategorized');
    const newOrder = [...otherStacks];
    const [moved] = newOrder.splice(from - 1, 1); // Adjust index since we removed Uncategorized
    const targetIndex = to - 1; // Adjust target index
    newOrder.splice(targetIndex, 0, moved);

    // Final order: Uncategorized first, then reordered stacks
    const finalOrder = ['Uncategorized', ...newOrder];

    try {
      // Store the new order in view meta (for Kanban-specific functionality)
      if (view?.id && actions?.updateViewMeta) {
        await actions.updateViewMeta.mutateAsync({
          viewId: view.id,
          meta: { stackOrder: finalOrder },
          currentMeta: view?.meta || {}
        });
      }
    } catch (err) {
      console.error('Failed to persist stack order', err);
    }
  }, [filteredStacks, view?.id, view?.meta, actions?.updateView]);

  const handleStackDelete = useCallback(async (stackId: string) => {
    if (!groupCol?.id || stackId === 'Uncategorized') return;
    try {
      // Get existing option names to check if stack exists
      const existingOptionNames = localOptions.map((opt: any) => {
        if (typeof opt === 'string') return opt;
        return opt?.option || opt?.value || opt?.label || String(opt);
      });

      // Only delete if it's a field option (proper Kanban behavior)
      if (existingOptionNames.includes(stackId)) {
        // 1. Move all records from this stack to "Uncategorized" (set to null)
        const recordsToUpdate = tableData?.records?.filter((record: any) =>
          record[groupCol.key] === stackId
        ) || [];

        // Update each record's field value to null (Uncategorized) using insertRowData
        for (const record of recordsToUpdate) {
          try {
            await actions?.insertRowData.mutateAsync({
              model_id: String(tableId),
              column_id: String(groupCol.id),
              row_id: Number(record.id),
              value: "",
            });
          } catch (error) {
            console.error(`Failed to update record ${record.id}:`, error);
          }
        }

        // 2. Remove the option from field options (preserve structure with colors)
        const preservedOptions = localOptions
          .map((opt: any) => {
            if (typeof opt === 'string') {
              return { option: opt, color: '' };
            }
            return {
              option: opt?.option || opt?.value || opt?.label || String(opt),
              color: opt?.color || ''
            };
          })
          .filter((opt: { option: string; color: string }) => opt.option !== stackId);

        await onUpdateFieldOptions(groupCol.id, preservedOptions);

        // Refresh to update the UI immediately
        onRefresh();
      } else {
        console.warn('Cannot delete stack that is not a field option:', stackId);
      }
    } catch (err) {
      console.error('Failed to delete stack', err);
    }
  }, [groupCol?.id, groupCol?.key, localOptions, onUpdateFieldOptions, onRefresh, tableData?.records, tableId, actions?.insertRowData]);

  const handleStackEdit = useCallback(async (oldName: string, newName: string) => {
    if (!groupCol?.id || oldName === newName || newName.trim() === '') return;
    try {
      // Convert options to strings for comparison (use 'option' property as the key field)
      const stringOptions = localOptions.map((opt: any) =>
        typeof opt === 'string' ? opt : (opt?.option || opt?.value || opt?.label || String(opt))
      );

      // Only edit if the old name exists in field options (proper Kanban behavior)
      if (stringOptions.includes(oldName)) {
        // 1. Update field options (preserve structure with colors)
        const preservedOptions = localOptions.map((opt: any) => {
          const optionName = typeof opt === 'string'
            ? opt
            : (opt?.option || opt?.value || opt?.label || String(opt));

          if (optionName === oldName) {
            // Update the option name but preserve the color
            const existingColor = typeof opt === 'object' && opt.color ? opt.color : '';
            return { option: newName.trim(), color: existingColor };
          }

          // Preserve existing option structure
          if (typeof opt === 'string') {
            return { option: opt, color: '' };
          }
          return {
            option: optionName,
            color: opt?.color || ''
          };
        });

        // Wait for the field options update to complete
        // This mutation will automatically invalidate the table query via useUpdateField's onSuccess
        await onUpdateFieldOptions(groupCol.id, preservedOptions);

        // 2. Update all records that have the old value to use the new value
        const recordsToUpdate = tableData?.records?.filter((record: any) =>
          record[groupCol.key] === oldName
        ) || [];

        // Update each record's field value using insertRowData (same as move card logic)
        // Don't await these - they run in parallel with minimal blocking
        recordsToUpdate.forEach(record =>
          actions?.insertRowData.mutateAsync({
            model_id: String(tableId),
            column_id: String(groupCol.id),
            row_id: Number(record.id),
            value: newName.trim(),
          }).catch(error => {
            console.error(`Failed to update record ${record.id}:`, error);
          })
        );

        // NOTE: We don't call onRefresh() here because:
        // 1. updateField mutation already invalidates table query via onSuccess
        // 2. Calling refresh would cause unnecessary refetches that could reset view state (like stackOrder)
        // 3. React Query will automatically refetch and update the UI
      } else {
        console.warn('Cannot edit stack that is not a field option:', oldName);
      }
    } catch (err) {
      console.error('Failed to edit stack name', err);
      toast.error('Failed to update stack name');
    }
  }, [groupCol?.id, groupCol?.key, localOptions, onUpdateFieldOptions, tableData?.records, tableId, actions?.insertRowData, toast]);


  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="bg-background border-b border-primary px-4 py-2">
        {/* Desktop Layout - Hidden on mobile */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KanbanFieldConfiguration
              columns={columns}
              groupByField={groupCol || undefined}
              onGroupByFieldChange={isReadOnly ? undefined : handleGroupByChange}
            />
            {!isReadOnly && handleFieldToggle && (
              <FieldsPopover
                columns={columnConfigs}
                fieldConfig={localFieldConfig}
                onFieldToggle={handleFieldToggle}
                label="Fields"
                iconComponent={List}
              />
            )}
            {handleAddFilter && (
              <FilterPopover
                columns={sortableColumnConfigs}
                filters={filters}
                onAddFilter={handleAddFilter}
                onRemoveFilter={handleRemoveFilter}
                onUpdateFilter={handleUpdateFilter}
              />
            )}
            {handleSortChange && (
              <SortPopover
                columns={sortableColumns}
                sorts={sorts}
                onChange={handleSortChange}
              />
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Search
                columns={searchableColumns}
                onSearch={handleSearch}
              />
            </div>
          </div>
        </div>

        {/* Mobile Layout - Shown on mobile */}
        <div className="flex md:hidden flex-col gap-3">
          {/* Top row: Group by selector and Search */}
          <div className="flex items-center justify-center gap-3">
            <Search
              columns={searchableColumns}
              onSearch={handleSearch}
              className="flex-1 max-w-xs"
            />
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-y-auto md:overflow-x-auto">
        <div className="flex gap-4 p-4 h-full min-w-max">
          {filteredStacks.map((stack: any, idx: number) => (
            <KanbanStack
              key={stack.id}
              stack={stack}
              columns={columns}
              fieldConfig={localFieldConfig}
              groupCol={groupCol}
              groupFieldTitle={(groupCol?.title as string) || (groupCol?.key as string) || 'Status'}
              onCardMove={isReadOnly ? undefined : handleCardMove}
              onCardCreate={(() => {
                if (isReadOnly) return undefined;
                return canCreateRecord() ? handleOpenCreateRecord : undefined;
              })()}
              onCardEdit={(() => {
                if (isReadOnly) return undefined;
                return canUpdateRecord() ? handleOpenEditRecord : undefined;
              })()}
              onCardDelete={(() => {
                if (isReadOnly) return undefined;
                return canDeleteRecord() ? handleOpenDeleteRecord : undefined;
              })()}
              onStackCollapse={handleStackCollapse}
              onStackEdit={isReadOnly ? undefined : handleStackEdit}
              onStackDragStart={isReadOnly ? undefined : handleStackDragStart}
              onStackDrop={isReadOnly ? undefined : handleStackDropWithPersistence}
              onStackDelete={isReadOnly ? undefined : handleStackDelete}
              index={idx}
            />
          ))}

          {/* Add New Stack */}
          {isReadOnly ? null : (
            <div className="w-full md:w-80 md:flex-shrink-0">
              {uiState.isCreateStack ? (
                <button
                  onClick={handleCreateStackClick}
                  className="w-full h-14 border border-dashed rounded text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New stack
                </button>
              ) : (
                <div className="p-1.5 border border-dashed rounded-xl flex items-center justify-between gap-2" ref={dropdownRef}>
                  <input
                    className="flex-1 p-2 border border-primary bg-[var(--color-alpha-white)] text-primary rounded-xl text-sm outline-none field-component-focus"
                    placeholder="Add New Stack"
                    value={uiState.newOption}
                    onChange={(e) => handleNewOptionChange(e.target.value)}
                    onKeyDown={handleCreateStackKeyDown}
                  />
                  <button
                    type="button"
                    className="p-2 btn-add-option"
                    onClick={handleCreateStackClickSave}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modalState.create.isOpen && (
        <CreateRecordModal
          isOpen={modalState.create.isOpen}
          onClose={handleCloseCreateModal}
          table={{ id: tableId, title: tableName } as any}
          fields={columns as any}
          title="New record"
          submitLabel="Save record"
          initialValues={getCreateInitialValues()}
          onSuccess={handleCreateSuccess}
        />
      )}
      {modalState.edit.isOpen && modalState.edit.recordId && (
        <EditRecordModal
          isOpen={modalState.edit.isOpen}
          onClose={handleCloseEditModal}
          table={{ id: tableId, title: tableName } as any}
          fields={columns as any}
          recordId={modalState.edit.recordId}
          title="Edit record"
          submitLabel="Update record"
          onSuccess={handleEditSuccess}
          onDelete={isReadOnly ? undefined : handleDeleteRecordFromModal}
          onDuplicate={isReadOnly ? undefined : onDuplicateCard}
          initialValues={getEditInitialValues()}
        />
      )}
      {modalState.delete.isOpen && modalState.delete.recordId && (
        <DeleteConfirmModal
          isOpen={modalState.delete.isOpen}
          title="Delete Record"
          message="This action cannot be undone."
          onClose={handleCloseDeleteModal}
          onConfirm={confirmDeleteRecord}
        />
      )}
    </div>
  );
};

export default KanbanBoard;

