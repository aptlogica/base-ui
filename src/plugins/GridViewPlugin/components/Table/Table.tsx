import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense, lazy } from 'react';
import { GroupPopover } from '../../../../components/shared/table/GroupPopover';
import { SortPopover } from '../../../../components/shared/table/SortPopover';
import { NewColumnModalPortal } from './modals/NewColumnModalPortal';
import { normalizeFieldType } from '../../../../utils/fieldType';
import { parseApiColumnMeta } from '../../../../components/shared/table/tableUtils';
import { GridRecord as TableData, GridColumn as ColumnConfig } from '../../types/grid.types';
import { FilterPopover } from '../../../../components/shared/table/FilterPopover';
import { FieldsPopover } from '../../../../components/shared/table/FieldsPopover';
import { ContextMenu } from './components/ContextMenu';
import { ColumnContextMenu } from './components/ColumnContextMenu';
import { VirtualizedTableBody } from './components/VirtualizedTableBody';
import { Search } from '../../../../components/shared/table/Search';
import DeleteConfirmModal from '../../../../components/modals/DeleteConfirmModal';
import ReactDOM from 'react-dom';
import { Plus, List, Lock } from 'lucide-react';
import EditRecordModal from '../../../../components/modals/EditRecordModal';
import { buildInitialValuesForEdit } from '../../../../utils/initialValues';
import { useToast } from '../../../../components/common/Toast';
import { sortRowsByDataKey } from '../../../../utils/sortUtils';
import { applyFilters } from '../../../../utils/filterUtils';
import { formatCompactNumber } from '../../../../utils/helpers';
const NewColumnModal = lazy(() =>
  import('../../../../components/modals/NewColumnModal').then(m => ({ default: m.NewColumnModal }))
);
import UpdateFieldConfirmModal from '../../../../components/modals/UpdateFieldConfirmModal';
import { useAllViews } from '../../../../hooks/useApi';
import { getFieldTypeIconComponent } from '../../../../types/fieldTypes';
import { ColumnDropdown } from './components/ColumnDropdown';
import { Loader } from '../../../../components/ui/Loader';
import { useTableViewConfig, type GroupByItem } from '../../hooks/useTableViewConfig';
import type { SearchField } from '../../../../hooks/useSearch';
import { useFrontendPagination } from '../../../../hooks/useFrontendPagination';
import { useCellEditing } from '../../hooks/useCellEditing';
import { useColumnManagement } from '../../hooks/useColumnManagement';
import { useTableModals } from '../../hooks/useTableModals';
import { useBaseAccess } from '../../../../hooks/useBaseAccess';

type TableActions = {
  addRow: any;
  insertRowData: any;
  deleteRecord: any;
  bulkDeleteRecords: any;
  updateField: any;
  deleteColumn: any;
  createField: any;
  updateView: any;
  updateRowOrder: any;
};

interface TableProps {
  tableData?: {
    model: any;
    columns: any[];
    records: any[];
    views?: any[];
  };
  viewId?: string;
  onRefresh: () => void;
  viewConfig?: Record<string, any>;
  actions?: TableActions;
}

export const Table: React.FC<TableProps> = ({
  tableData,
  viewId,
  onRefresh,
  viewConfig,
  actions,
}) => {
  const toast = useToast();
  const { data: allViews = [] } = useAllViews();
  const [activeCell, setActiveCell] = useState<{ rowId: string; colKey: string } | null>(null);
  const newColumnModalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const tableBodyRef = useRef<HTMLDivElement>(null);
  const [tableBodyHeight, setTableBodyHeight] = useState(600); // Default height

  // Extract IDs from tableData.model
  const tableId = useMemo(() => String(tableData?.model?.id ?? ''), [tableData?.model?.id]);
  const baseId = useMemo(() => String(tableData?.model?.base_id ?? ''), [tableData?.model?.base_id]);

  // Check permissions for read-only access
  const { isBaseReadOnly, canCreateColumn, canDeleteRecord, canUpdateRecord, canCreateRecord, canUpdateColumn, canDeleteColumn } = useBaseAccess(baseId || undefined);

  // Resolve current view and base meta from tableData; allow override via viewConfig
  const currentView = useMemo(() => {
    if (!tableData) return undefined as any;
    const anyTD: any = tableData;

    // If viewId is provided, find the specific view by ID
    if (viewId && Array.isArray(anyTD.views)) {
      const foundView = anyTD.views.find((v: any) => String(v.id) === String(viewId));
      if (foundView) return foundView;
    }

    // Fallback to existing logic
    if (anyTD.view) return anyTD.view;
    if (Array.isArray(anyTD.views) && anyTD.views.length > 0) return anyTD.views[0];
    return undefined;
  }, [tableData, viewId]);

  const effectiveViewId = useMemo(() => {
    return currentView?.id ? String(currentView.id) : undefined;
  }, [currentView]);

  // Effective view meta used to seed/sync local UI state
  const baseMeta = useMemo(() => (viewConfig ?? (currentView?.meta ?? {})), [viewConfig, currentView]);

  // Transform API columns to UI-ready format
  const columns = useMemo(() => {
    if (!tableData?.columns || !Array.isArray(tableData.columns)) return [];

    return tableData.columns
      .slice()
      .sort((a: any, b: any) => (a?.order_index ?? 0) - (b?.order_index ?? 0))
      .map((apiColumn: any): ColumnConfig => {
        const parsedMeta = parseApiColumnMeta(apiColumn.meta);
        return {
          id: apiColumn.id ? String(apiColumn.id) : undefined,
          key: String(apiColumn.column_name ?? apiColumn.title ?? apiColumn.id ?? ''),
          column_name: apiColumn.column_name,
          title: String(apiColumn.title ?? apiColumn.column_name ?? ''),
          type: normalizeFieldType(String(apiColumn.uidt ?? 'text')),
          uidt: apiColumn.uidt,
          width: 235,
          position: apiColumn.order_index ?? 0,
          order_index: apiColumn.order_index ?? 0,
          isSystem: Boolean(apiColumn.system) && String(apiColumn.column_name ?? '').toLowerCase() !== 'title',
          system: Boolean(apiColumn.system) && String(apiColumn.column_name ?? '').toLowerCase() !== 'title',
          hidden: Boolean(apiColumn.hidden),
          is_hidden: Boolean(apiColumn.is_hidden),
          description: apiColumn.description || '', // Include description from API
          meta: apiColumn.meta, // Keep original meta for backward compatibility
          config: parsedMeta, // Parsed config for components to use
        };
      });
  }, [tableData?.columns]);

  // Get searchable columns (exclude system fields except Title)
  const searchableColumns = useMemo(() => {
    return columns.filter(col => {
      const isSystemField = col.isSystem || col.system;
      const isTitle = col.title.toLowerCase() === 'title' || col.column_name?.toLowerCase() === 'title';
      return !isSystemField || isTitle;
    });
  }, [columns]);

  const allRecords = useMemo(() => {
    if (!tableData?.records || !Array.isArray(tableData.records)) return [];
    return tableData.records.map((record: any): TableData => {
      const meta = {
        id: String(record.id ?? ''),
        created_at: String(record.created_at ?? ''),
        updated_at: String(record.updated_at ?? ''),
        deleted_at: null as any,
        position: Number(record.position ?? 0),
      };

      // Create data object with all record fields
      const dataObj: Record<string, any> = {};
      Object.keys(record).forEach(key => {
        if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
          dataObj[key] = record[key];
        }
      });

      return { id: meta.id, _meta: meta, data: dataObj } as TableData;
    });
  }, [tableData?.records]); // Full dataset from backend

  // Global click handler to remove active cell when clicking outside table rows
  useEffect(() => {
    if (!activeCell) return;

    const handleDocumentClick = (e: MouseEvent) => {
      // Check if the click is inside the table body (rows area)
      if (tableRef?.current?.contains(e.target as Node)) {
        return; // Don't close if inside table rows
      }
      // Also check excluded refs (modals, backdrop)
      for (const ref of [newColumnModalRef, editModalRef, backdropRef]) {
        if (ref?.current?.contains(e.target as Node)) {
          return;
        }
      }
      setActiveCell(null);
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [activeCell, newColumnModalRef, editModalRef, backdropRef]);

  // View configuration hook
  const {
    viewConfigState,
    setViewConfigState,
    searchTerm,
    setSearchTerm,
    selectedSearchField,
    setSelectedSearchField,
    realTimeFilter,
    localFieldConfig,
    visibleColumns,
    handleAddFilter,
    handleRemoveFilter,
    handleUpdateFilter: handleUpdateFilterFromHook,
    handleGroupByChange,
    handleSortChange,
    handleEnsureAllFieldsRegistered,
    handleFieldToggle,
    handleFieldOrderChange,
    updateViewConfigBackend,
  } = useTableViewConfig({
    baseMeta,
    effectiveViewId,
    columns,
    updateViewMutation: actions?.updateView,
    searchableColumns,
    isReadOnly: isBaseReadOnly(),
  });

  // Memoized filter update handler to prevent recreation
  const handleUpdateFilter = useCallback((index: number, updates: Partial<any>) => {
    handleUpdateFilterFromHook(index, updates);
  }, [handleUpdateFilterFromHook]);

  // Memoized search handler to prevent recreation
  const handleSearch = useCallback((searchTerm: string, selectedField: SearchField | null) => {
    setSearchTerm(searchTerm);
    setSelectedSearchField(selectedField);
  }, [setSearchTerm, setSelectedSearchField]);

  // Table modals hook
  const {
    contextMenu,
    handleContextMenu: originalHandleContextMenu,
    handleCloseContextMenu,
    colMenu,
    handleColContextMenu,
    handleCloseColMenu,
  } = useTableModals();

  // Edit record modal state
  const [isEditRecordModalOpen, setIsEditRecordModalOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const openEditRecordModal = useCallback((rowId: string) => {
    setSelectedRecordId(rowId);
    setIsEditRecordModalOpen(true);
    handleCloseContextMenu();
  }, [handleCloseContextMenu]);

  const closeEditRecordModal = useCallback(() => {
    setIsEditRecordModalOpen(false);
    setSelectedRecordId(null);
  }, []);

  // Wrap handleContextMenu to prevent opening for readonly users.
  // Multi-select is supported with delete-only action.
  const handleContextMenu = useCallback((e: React.MouseEvent, rowId: string) => {
    if (isBaseReadOnly() || !canCreateRecord()) {
      e.preventDefault();
      e.stopPropagation();
      return; // Don't show context menu for readonly users
    }
    originalHandleContextMenu(e, rowId);
  }, [isBaseReadOnly, canCreateRecord, originalHandleContextMenu]);

  // Column management hook
  const {
    isColumnModalOpen,
    setIsColumnModalOpen,
    editColumn,
    editColumnIndex,
    editModalOpen,
    setEditModalOpen,
    editModalPosition,
    deleteConfirmModalOpen,
    setDeleteConfirmModalOpen,
    columnToDelete,
    updateFieldConfirmModalOpen,
    setUpdateFieldConfirmModalOpen,
    setPendingEditColumnChanges,
    dragColumnIndex,
    hoverColumnIndex,
    handleAddColumn,
    handleEditColumn: handleEditColumnFromHook,
    handleSaveEditColumn,
    handleConfirmUpdateField,
    handleDeleteColumn,
    handleConfirmDeleteColumn,
    handleColumnDragStart: handleColumnDragStartFromHook,
    handleColumnDragEnter: handleColumnDragEnterFromHook,
    handleColumnDragEnd: handleColumnDragEndFromHook,
    setEditColumn,
    setEditColumnIndex,
  } = useColumnManagement({
    tableId,
    baseId,
    columns,
    allViews,
    tableData,
    actions,
    onRefresh,
    toast,
    updateViewConfigBackend,
    viewConfigState,
    setViewConfigState,
  });

  const canReorderColumns = useMemo(() => !isBaseReadOnly() && canUpdateColumn(), [isBaseReadOnly, canUpdateColumn]);

  // TanStack Query hooks - Mutations provided by data layer hook
  const deleteRecordMutation = actions?.deleteRecord;
  const bulkDeleteRecordsMutation = actions?.bulkDeleteRecords;
  const addRowMutation = actions?.addRow;

  // Track expanded groups for expand/collapse functionality
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Refs
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const addColumnButtonRef = useRef<HTMLButtonElement | null>(null);
  const [openColumnDropdownIndex, setOpenColumnDropdownIndex] = useState<number | null>(null);

  // Static column widths (no resize). Prefer view meta widths, else column.width, else 235.
  const columnWidths = useMemo(() => {
    return (visibleColumns || []).map((c) => {
      const widthKey = String(c.id || c.key);
      const fromView = viewConfigState.columnWidths?.[widthKey] ?? viewConfigState.columnWidths?.[c.key];

      let width = 235;

      if (typeof c.width === 'number') {
        width = c.width;
      }

      if (typeof fromView === 'number') {
        width = fromView;
      }

      return width;
    });
  }, [visibleColumns, viewConfigState.columnWidths]);


  // Memoize minimal columns for sorting (only recreates when visibleColumns change)
  const minimalColumnsForSorting = useMemo(() => {
    return visibleColumns.map(c => ({ key: c.key, type: String(c.type) }));
  }, [visibleColumns]);

  // This ensures filters/search work on entire dataset, not just loaded page
  const filteredAndSortedData = useMemo(() => {
    // Start with ALL records (full dataset from backend)
    let result = [...allRecords];

    // Apply search filtering
    if (searchTerm.trim() && selectedSearchField?.key) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(row => {
        // Search in specific field
        const value = row.data?.[selectedSearchField?.key] ?? (row as any)[selectedSearchField?.key];
        return value?.toString().toLowerCase().includes(lowerSearchTerm);
      });
    }

    // Combine saved filters with real-time filter if it exists
    const allFilters = realTimeFilter
      ? [...viewConfigState.filters, realTimeFilter]
      : viewConfigState.filters;

    // Apply all filters at once
    if (allFilters.length > 0) {
      result = applyFilters(result, allFilters, columns);
    }

    // Apply sorting using shared util for consistency
    if (viewConfigState.sorts.length > 0) {
      result = sortRowsByDataKey(minimalColumnsForSorting, viewConfigState.sorts as any, result);
    }


    return result;
  }, [
    allRecords,
    viewConfigState.filters,
    viewConfigState.sorts,
    searchTerm,
    selectedSearchField,
    columns,
    realTimeFilter,
    minimalColumnsForSorting // Memoized columns for sorting
  ]);

  // Grouping logic
  const groupedData = useMemo(() => {
    if (!viewConfigState.groupBy.length) return null;

    // Recursive grouping function
    const groupRows = (rows: TableData[], groupByItems: GroupByItem[], level: number = 0): any[] => {
      if (level >= groupByItems.length) return rows;

      const currentGroup = groupByItems[level];
      const groups: { [key: string]: TableData[] } = {};

      rows.forEach(row => {
        const value = row.data && currentGroup.column in row.data ? row.data[currentGroup.column] : '';
        const key = Array.isArray(value) ? value.join(', ') : String(value || '(Empty)');
        if (!groups[key]) groups[key] = [];
        groups[key].push(row);
      });

      // Sort group keys (groups themselves are sorted by group direction)
      let groupKeys = Object.keys(groups);
      groupKeys.sort((a, b) => {
        if (a === '(Empty)') return 1;
        if (b === '(Empty)') return -1;
        return currentGroup.direction === 'desc' ? b.localeCompare(a) : a.localeCompare(b);
      });

      // Note: Rows within each group are already sorted from filteredAndSortedData
      return groupKeys.map(key => ({
        groupValue: key,
        groupColumn: currentGroup.column,
        groupDirection: currentGroup.direction,
        level: level,
        rows: level < groupByItems.length - 1 ? groupRows(groups[key], groupByItems, level + 1) : groups[key]
      }));
    };

    // Use already-sorted data - this ensures rows within groups respect sort settings
    return groupRows(filteredAndSortedData, viewConfigState.groupBy);
  }, [filteredAndSortedData, viewConfigState.groupBy]);

  const totalTableWidth = useMemo(() => {
    return 48 + columnWidths.reduce((sum, w) => sum + w, 0) + 48;
  }, [columnWidths]);

  const {
    allLoadedData: paginatedData,
    loadNextPage,
    hasMore,
    isLoadingMore,
  } = useFrontendPagination({
    data: filteredAndSortedData,
    pageSize: 30,
    initialPage: 1,
  });

  const { handleCellChange } = useCellEditing({
    data: paginatedData,
    columns,
    tableId,
    insertRowDataMutation: actions?.insertRowData,
    onRecordsUpdate: () => { },
  });

  // Measure table body container height
  useEffect(() => {
    const element = tableRef.current;
    if (!element) return;

    const updateHeight = () => {
      const containerHeight = element.clientHeight;
      const headerHeight = headerRef.current?.clientHeight || 35;
      const footerHeight = 48; // Footer is fixed at bottom
      const addRowButtonHeight = 40;
      const availableHeight = containerHeight - headerHeight - footerHeight - addRowButtonHeight;
      setTableBodyHeight(Math.max(200, availableHeight)); // Minimum 200px
    };

    // Initial measurement
    updateHeight();

    // Observe resize
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(element);

    // Also listen to window resize
    window.addEventListener('resize', updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [paginatedData.length, columnWidths.length]); // Track paginated data length

  // Toggle selection for a single row
  const handleRowSelect = useCallback((rowId: string, selected: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(rowId);
      } else {
        newSet.delete(rowId);
      }
      return newSet;
    });
  }, []);

  // Select or clear all rows currently visible in the filtered set
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedRows(new Set(paginatedData.map(row => (row._meta && typeof row._meta.id === 'string') ? row._meta.id : '').filter(Boolean)));
    } else {
      setSelectedRows(new Set());
    }
  }, [filteredAndSortedData]);

  // Add a new row via mutation; list refresh is handled via onRefresh/react-query
  const addNewRow = useCallback(async () => {
    try {
      if (!addRowMutation) return;

      await addRowMutation.mutateAsync({ model_id: tableId });

      toast.success('Row added', { title: 'Success', duration: 3000 });
      onRefresh?.();
    } catch (err) {
      console.error('Failed to add row', err);
      toast.error('Failed to add row', { title: 'Error', duration: 3500 });
    }
  }, [addRowMutation, tableId, toast, onRefresh]);

  // Delete a row by id (memoized to prevent recreation)
  const handleDelete = useCallback(async (rowId: string) => {
    try {
      const numericRowId = Number(rowId);
      if (!tableId || Number.isNaN(numericRowId)) {
        // Fallback: just remove locally if no numeric row id
        // legacy onDataChange removed
        return;
      }
      await deleteRecordMutation.mutateAsync({ model_id: String(tableId), row_id: numericRowId });

      // We don't update local state directly; records will be refetched via react-query
      toast.success('Row deleted', { title: 'Success' });
      try { onRefresh?.(); } catch { }
    } catch (err) {
      console.error('[Delete] Failed to delete record:', rowId, err);
      alert('Failed to delete record. Please try again.');
    }
  }, [deleteRecordMutation, tableId, toast, onRefresh]);

  // Bulk delete selected rows
  const handleBulkDelete = useCallback(async () => {
    if (selectedRows.size === 0 || !tableId || !bulkDeleteRecordsMutation) {
      return;
    }

    try {
      // Convert selected row IDs to numeric IDs
      const rowIds: number[] = [];
      for (const rowId of selectedRows) {
        const numericRowId = Number(rowId);
        if (!Number.isNaN(numericRowId)) {
          rowIds.push(numericRowId);
        }
      }

      if (rowIds.length === 0) {
        toast.error('No valid rows selected for deletion', { title: 'Error' });
        return;
      }

      await bulkDeleteRecordsMutation.mutateAsync({
        model_id: String(tableId),
        row_ids: rowIds
      });

      // Clear selection after successful deletion
      setSelectedRows(new Set());

      toast.success(`${rowIds.length} row${rowIds.length > 1 ? 's' : ''} deleted`, { title: 'Success' });
      try { onRefresh?.(); } catch { }
    } catch (err) {
      console.error('[Bulk Delete] Failed to delete records:', err);
      toast.error('Failed to delete records. Please try again.', { title: 'Error' });
    }
  }, [selectedRows, tableId, bulkDeleteRecordsMutation, toast, onRefresh, setSelectedRows]);

  // Column drag and drop handler wrapper (uses hook's handleColumnDragEnd with proper params)
  const handleColumnDragStart = useCallback((index: number) => {
    if (!canReorderColumns) return;
    handleColumnDragStartFromHook(index, visibleColumns);
  }, [canReorderColumns, handleColumnDragStartFromHook, visibleColumns]);

  const handleColumnDragEnter = useCallback((index: number) => {
    if (!canReorderColumns) return;
    handleColumnDragEnterFromHook(index);
  }, [canReorderColumns, handleColumnDragEnterFromHook]);

  const handleColumnDragEnd = useCallback(async () => {
    if (!canReorderColumns) return;
    await handleColumnDragEndFromHook(
      visibleColumns,
      localFieldConfig,
      effectiveViewId,
      baseMeta,
      actions?.updateView,
      handleFieldOrderChange
    );
  }, [canReorderColumns, handleColumnDragEndFromHook, visibleColumns, localFieldConfig, effectiveViewId, baseMeta, actions?.updateView, handleFieldOrderChange]);

  // Wrapper for handleEditColumn to use hook's version
  const handleEditColumn = useCallback((col: ColumnConfig, index: number, event?: { target: HTMLElement }) => {
    handleEditColumnFromHook(col, index, event);
  }, [handleEditColumnFromHook]);

  // Scroll synchronization between header and body
  useEffect(() => {
    const header = headerRef.current;
    const body = tableRef.current;

    if (!header || !body) return;

    let isScrolling = false;

    const handleHeaderScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
        body.scrollLeft = header.scrollLeft;
        setTimeout(() => { isScrolling = false; }, 10);
      }
    };

    const handleBodyScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
        header.scrollLeft = body.scrollLeft;
        setTimeout(() => { isScrolling = false; }, 10);
      }
    };

    header.addEventListener('scroll', handleHeaderScroll);
    body.addEventListener('scroll', handleBodyScroll);

    return () => {
      header.removeEventListener('scroll', handleHeaderScroll);
      body.removeEventListener('scroll', handleBodyScroll);
    };
  }, []);




  return (
    <div ref={tableContainerRef} className="w-full h-[calc(100vh-43px)] bg-background flex flex-col relative" >
      {/* Fixed Header - Toolbar */}
      <div className="sticky top-0 z-30 bg-muted border-b border-border/50" onClick={() => setActiveCell(null)}>
        <div className="flex items-center bg-background gap-2 px-4 py-2">
          {/* Desktop Layout - Hidden on mobile */}
          <div className="hidden md:flex items-center justify-between w-full">
            <div className='flex items-center gap-2'>
              {!isBaseReadOnly() && (
                <FieldsPopover
                  columns={columns as any}
                  fieldConfig={localFieldConfig}
                  onFieldToggle={handleFieldToggle}
                  onEnsureAllFieldsRegistered={handleEnsureAllFieldsRegistered}
                  label="Fields"
                  iconComponent={List}
                />
              )}
              <FilterPopover
                columns={columns}
                filters={viewConfigState.filters}
                onAddFilter={handleAddFilter}
                onRemoveFilter={handleRemoveFilter}
                onUpdateFilter={handleUpdateFilter}
              />
              {!isBaseReadOnly() && (
                <GroupPopover
                  columns={columns}
                  groupBy={viewConfigState.groupBy}
                  setGroupBy={handleGroupByChange}
                />
              )}
              <SortPopover
                columns={columns}
                sorts={viewConfigState.sorts}
                onChange={handleSortChange}
              />
            </div>
            <Search
              columns={searchableColumns}
              onSearch={handleSearch}
            />
          </div>

          {/* Mobile Layout - Shown on mobile */}
          <div className="flex md:hidden flex-col gap-3 w-full">
            {/* Bottom row: Search */}
            <div className="w-full">
              <Search
                columns={searchableColumns}
                onSearch={handleSearch}
              />
            </div>
          </div>

        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div
          ref={tableRef}
          className="h-full overflow-auto"
          data-scroll-container="table"
          onClick={() => setActiveCell(null)}
        >
          <div className="bg-background w-full">
            {/* Sticky Table Header */}
            <div ref={headerRef} className="sticky top-0 z-20 w-full" onClick={() => setActiveCell(null)}>
              <div
                className="grid bg-background"
                style={{
                  gridTemplateColumns: `48px ${columnWidths.map(w => w + 'px').join(' ')} 48px`,
                  minWidth: '100vw',
                  height: '35px'
                }}
              >
                {/* Row selector header */}
                <div
                  className="group flex-shrink-0 bg-gray-100 border-r border-b border-border/30 flex items-center justify-center"
                  style={{ position: 'sticky', left: 0, zIndex: 3, height: '35px', boxShadow: 'inset 1px 0 0 var(--color-border), 2px 0 4px -2px rgba(0,0,0,0.06)' }}
                >
                  <input
                    type="checkbox"
                    className="hidden group-hover:inline-block w-4 h-4 text-primary rounded-xl focus:ring-primary checkbox-primary-brand"
                    checked={selectedRows.size === filteredAndSortedData.length && filteredAndSortedData.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <span className="text-xs font-medium text-tertiary ml-2 inline-block group-hover:hidden">#</span>
                </div>

                {/* Column headers */}
                {visibleColumns.map((column, index) => {
                  const isColumnDraggable = !column.isSystem && canReorderColumns;
                  return (
                    <div
                      key={`${column.id || column.key || 'column'}-${index}`}
                      role="columnheader"
                      className={`relative flex-shrink-0 bg-gray-100 border-b group border-r ${editModalOpen && editColumnIndex === index ? 'overflow-visible' : 'overflow-hidden'} ${(column as any).isNew !== undefined && (column as any).isNew ? 'ring-2 ring-yellow-300 bg-yellow-50' : ''} ${dragColumnIndex === index ? 'opacity-50' : ''} ${hoverColumnIndex === index ? 'bg-blue-50' : ''}`}
                      style={{
                        width: `${columnWidths[index]}px`,
                        minWidth: '80px',
                        whiteSpace: 'nowrap',
                        height: '35px',
                        maxHeight: '35px'
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setOpenColumnDropdownIndex(null);
                        handleColContextMenu(e, index);
                      }}
                      draggable={isColumnDraggable}
                      onDragStart={() => {
                        if (isColumnDraggable && index !== undefined) {
                          handleColumnDragStart(index);
                        }
                      }}
                      onDragEnter={() => {
                        if (isColumnDraggable && index !== undefined) {
                          handleColumnDragEnter(index);
                        }
                      }}
                      onDragEnd={handleColumnDragEnd}
                      onDragOver={(e) => {
                        if (isColumnDraggable) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <div className={`h-full flex items-center justify-between px-4 relative ${editModalOpen && editColumnIndex === index ? 'overflow-visible' : 'overflow-hidden'}`} style={{ height: '35px' }}>
                        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                          {/* Column type icon */}
                          <span className="field-header-icon">{getFieldTypeIconComponent(column.type)}</span>
                          {/* Column title */}
                          <span
                            className="text-[12px] font-medium text-tertiary truncate block max-w-full"
                            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {column.title}
                            {column.isSystem && (
                              <Lock className="w-3 h-3 ml-1 inline text-tertiary" />
                            )}
                          </span>
                        </div>
                        {/* Column dropdown - hide for readonly users */}
                        {!column.isSystem && !isBaseReadOnly() && (canUpdateColumn() || canDeleteColumn()) && (
                          <ColumnDropdown
                            onEdit={() => {
                              handleEditColumn(column, index, { target: document.createElement('div') });
                            }}
                            onDelete={() => handleDeleteColumn(column.id!)}
                            isOpen={openColumnDropdownIndex === index}
                            onOpenChange={(open) => {
                              if (open) {
                                handleCloseColMenu();
                              }
                              setOpenColumnDropdownIndex(prev => {
                                if (open) {
                                  return index;
                                }
                                return prev === index ? null : prev;
                              });
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add column button - only show if user can create columns and not read-only */}
                {canCreateColumn() && !isBaseReadOnly() && (
                  <div className="flex-shrink-0 bg-gray-100 hover:bg-gray-200  flex items-center justify-center h-[35px] border-r border-b relative">
                    <button
                      ref={addColumnButtonRef}
                      className="p-1 rounded hover:bg-muted/70 transition-colors duration-200"
                      title="Add column"
                      onClick={() => setIsColumnModalOpen(prev => !prev)}
                    >
                      <Plus className="w-5 h-5 text-tertiary" />
                    </button>
                    <NewColumnModalPortal
                      ref={newColumnModalRef}
                      isOpen={isColumnModalOpen}
                      onClose={() => setIsColumnModalOpen(false)}
                      onAddColumn={handleAddColumn}
                      fields={columns}
                      isAddNewColumn={true}
                      excludeRefs={[addColumnButtonRef]}
                      addColumnButtonRef={addColumnButtonRef as React.RefObject<HTMLButtonElement>}
                      tableId={tableId}
                    />
                  </div>
                )}
              </div>
            </div>

            <div ref={tableBodyRef}>
              {(() => {
                return (
                  <VirtualizedTableBody
                    data={paginatedData}
                    columns={visibleColumns}
                    columnWidths={columnWidths}
                    selectedRows={selectedRows}
                    onRowSelect={handleRowSelect}
                    onCellChange={handleCellChange}
                    onContextMenu={handleContextMenu}
                    activeCell={activeCell}
                    setActiveCell={setActiveCell}
                    tableId={tableId}
                    height={tableBodyHeight}
                    width={totalTableWidth}
                    groupedData={groupedData}
                    expandedGroups={expandedGroups}
                    setExpandedGroups={setExpandedGroups}
                    visibleColumns={visibleColumns}
                    outerRef={tableRef}
                    canEdit={canUpdateRecord() && !isBaseReadOnly()}
                    allColumns={columns}
                    onScroll={(scrollTop) => {
                      const estimatedItemCount = groupedData
                        ? groupedData.reduce((sum, g) => sum + 1 + (expandedGroups.has(`${g.groupColumn}-${g.groupValue}-0`) ? g.rows.length : 0), 0)
                        : paginatedData.length;
                      const totalContentHeight = estimatedItemCount * 40;
                      const scrollThreshold = totalContentHeight - tableBodyHeight - 100;

                      // Load next page when near bottom and more pages available
                      if (scrollTop >= scrollThreshold && hasMore) {
                        loadNextPage();
                      }
                    }}
                  />
                );
              })()}

              {/* FRONTEND PAGINATION: Add row button with optional loading indicator */}
              {!isBaseReadOnly() && canCreateRecord() && (
                <div className="relative" style={{ height: '40px', width: `${totalTableWidth}px`, minWidth: `${totalTableWidth}px` }}>
                  <div className="flex-shrink-0 w-[48px] h-10 border-r border-b border-border/30 flex items-center justify-center bg-gray-100 hover:bg-gray-200" style={{ height: '40px', position: 'sticky', left: 0, zIndex: 2, boxShadow: 'inset 1px 0 0 var(--color-border), 2px 0 4px -2px rgba(0,0,0,0.06)' }}>
                    <button className="p-1 rounded hover:bg-muted/50 transition-colors" title="Add row" onClick={() => { setActiveCell(null); addNewRow(); }}>
                      <Plus className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              )}

              {/* Infinite scroll: show loading indicator at the bottom while paging */}
              {isLoadingMore && (
                <div className="w-full flex items-center justify-center py-2 opacity-60">
                  <Loader size={4} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="sticky bottom-0 z-30 bg-card border-t flex items-center px-4 h-12">
        {!isBaseReadOnly() && canCreateRecord() && (
          <button
            onClick={() => { setActiveCell(null); addNewRow(); }}
            className="flex items-center gap-2 px-5 py-1.5 text-sm font-medium btn-primary !rounded-lg transition-colors duration-200"
            title="Add new row"
          >
            <Plus className="w-5 h-5" />
            Add Row
          </button>
        )}
        <div className="ml-auto flex items-center gap-3 text-sm">
          {/* Virtualization is always enabled - indicator removed to reduce UI clutter */}
          <div className="text-muted-foreground">
            {selectedRows?.size > 0 && (
              <>
                <span>{formatCompactNumber(selectedRows.size)} selected</span>
                <span className="mx-2">•</span>
              </>
            )}
            {hasMore ? (
              <span>
                Showing {formatCompactNumber(paginatedData.length)} of {formatCompactNumber(filteredAndSortedData.length)} rows
              </span>
            ) : (
              <span>{formatCompactNumber(filteredAndSortedData.length)} {filteredAndSortedData.length === 1 ? 'row' : 'rows'}</span>
            )}
          </div>
        </div>
      </div>


      {/* Context menu for row actions - hide for readonly users */}
      {contextMenu.open && contextMenu.rowId !== null && !isBaseReadOnly() && canCreateRecord() && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          onDelete={() => {
            // If multiple rows are selected, delete all selected rows using bulk delete
            // Otherwise, delete just the right-clicked row
            if (selectedRows.size > 1 && selectedRows.has(contextMenu.rowId!)) {
              handleBulkDelete();
            } else {
              // Delete just the right-clicked row
              handleDelete(contextMenu.rowId!);
            }
            handleCloseContextMenu();
          }}
          canDeleteRecord={canDeleteRecord()}
          onEdit={() => openEditRecordModal(contextMenu.rowId!)}
          canEditRecord={selectedRows.size <= 1 && canUpdateRecord()}
        />
      )}

      {/* Column context menu - hide for readonly users */}
      {colMenu.open && colMenu.colIndex !== null && !isBaseReadOnly() && (canUpdateColumn() || canDeleteColumn()) && (
        <>
          {/* Overlay to close menu on click outside */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={handleCloseColMenu}
          />
          <ColumnContextMenu
            x={colMenu.x}
            y={colMenu.y}
            onClose={handleCloseColMenu}
            onEdit={() => {
              handleEditColumn(visibleColumns[colMenu.colIndex!], colMenu.colIndex!, { target: null });
              handleCloseColMenu();
            }}
            onDelete={() => {
              handleDeleteColumn(visibleColumns[colMenu.colIndex!].id!);
              handleCloseColMenu();
            }}
            canUpdate={canUpdateColumn()}
            canDelete={canDeleteColumn()}
          />
        </>
      )}

      {/* Edit Column Modal */}
      {editModalOpen && editColumn && editModalPosition && ReactDOM.createPortal(
        <>
          <div ref={backdropRef} className="fixed inset-0 z-50 bg-modal-backdrop" onClick={() => {
            setEditModalOpen(false);
            setEditColumn(null);
            setEditColumnIndex(null);
          }} />
          <div ref={editModalRef} className="fixed z-50" style={{ top: editModalPosition.top, left: editModalPosition.left }}>
            <Suspense fallback={
              <div className="bg-background border rounded-xl shadow-lg p-8 min-w-[400px]">
                <Loader size={8} />
              </div>
            }>
              <NewColumnModal
                isOpen={editModalOpen}
                onClose={() => { setEditModalOpen(false); setEditColumn(null); setEditColumnIndex(null); }}
                onSave={handleSaveEditColumn}
                initialValues={editColumn}
                fields={columns}
                isAddNewColumn={false}
                isAddNewField={true}
                currentTableId={tableId}
              />
            </Suspense>
          </div>
        </>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModalOpen && columnToDelete !== null && (
        <DeleteConfirmModal
          isOpen={deleteConfirmModalOpen}
          onClose={() => setDeleteConfirmModalOpen(false)}
          onConfirm={handleConfirmDeleteColumn}
          message={`Are you sure you want to delete the column "${columns.find(col => col.id === columnToDelete)?.title || 'Unknown Column'}"? This action cannot be undone.`}
          title="Delete Column"
        />
      )}

      {updateFieldConfirmModalOpen &&
        <UpdateFieldConfirmModal
          isOpen={updateFieldConfirmModalOpen}
          title="Field Type Change"
          message='This action cannot be undone. Converting data types may result in data loss; any incompatible filters will be removed. Proceed with caution!'
          onClose={() => {
            setUpdateFieldConfirmModalOpen(false);
            setPendingEditColumnChanges(null);
          }}
          onConfirm={handleConfirmUpdateField}
        />
      }

      {/* Edit Record Modal */}
      <EditRecordModal
        isOpen={isEditRecordModalOpen}
        onClose={closeEditRecordModal}
        onSuccess={() => { try { onRefresh?.(); } catch {} closeEditRecordModal(); }}
        recordId={selectedRecordId || ''}
        table={tableData?.model}
        fields={tableData?.columns}
        initialValues={buildInitialValuesForEdit({ recordId: selectedRecordId, columns: tableData?.columns || [], rawRecords: tableData?.records || [] })}
        onDelete={async (id: string) => { 
          try { 
            await handleDelete(id); 
          } catch {} 
          finally { 
            closeEditRecordModal(); 
          } 
        }}
        title="Edit record"
        submitLabel="Update record"
      />
    </div>

  );
};
