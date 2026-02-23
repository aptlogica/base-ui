import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MemoizedTableRow } from './TableRow';
import { GridRecord as TableData, GridColumn as ColumnConfig } from '../../../types/grid.types';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface VirtualizedTableBodyProps {
  data: TableData[];
  columns: ColumnConfig[];
  columnWidths: number[];
  selectedRows: Set<string>;
  onRowSelect: (rowId: string, selected: boolean) => void;
  onCellChange: (rowId: string, columnKey: string, value: any) => void;
  onContextMenu: (e: React.MouseEvent, rowId: string) => void;
  activeCell: { rowId: string; colKey: string } | null;
  setActiveCell: React.Dispatch<React.SetStateAction<{ rowId: string; colKey: string } | null>>;
  tableId?: string;
  height: number;
  width: number;
  onScroll?: (scrollOffset: number) => void;
  outerRef?: React.RefObject<HTMLDivElement | null>; 
  groupedData?: any[] | null;
  expandedGroups?: Set<string>;
  setExpandedGroups?: React.Dispatch<React.SetStateAction<Set<string>>>;
  visibleColumns?: ColumnConfig[];
  allColumns?: ColumnConfig[]; // All columns for formula field name mapping
  canEdit?: boolean; // Permission to edit cells
  canSelectRows?: boolean;
  pinnedColumnIds?: string[];
  pinnedColumnOffsets?: Record<string, number>;
}

const ROW_HEIGHT = 40; // Row height in pixels
const GROUP_HEADER_HEIGHT = 40; // Group header height in pixels

// Flatten grouped data into a single array for virtualization
type FlattenedItem =
  | { type: 'group'; group: any; level: number; index: number; isFirstTopLevelGroup?: boolean }
  | { type: 'row'; row: TableData; rowIndex: number; groupRowNumber?: number };

const getGroupId = (group: any, level: number) => `${group.groupColumn}-${group.groupValue}-${level}`;

const isNestedGroupRows = (group: any) =>
  Array.isArray(group.rows) && group.rows.length > 0 && group.rows[0].groupValue;

const getGroupItemLabel = (rowCount: number, isNestedGroup: boolean) => {
  const itemTypeLabel = isNestedGroup ? 'group' : 'row';
  return rowCount > 1 ? `${itemTypeLabel}s` : itemTypeLabel;
};

const getLastPinnedColumnId = (visibleColumns: ColumnConfig[], pinnedColumnIds: string[]) => {
  let lastPinnedColumnId: string | null = null;
  visibleColumns.forEach((col) => {
    const identity = String(col.id || col.key || '');
    if (pinnedColumnIds.includes(identity)) {
      lastPinnedColumnId = identity;
    }
  });
  return lastPinnedColumnId;
};

const getGroupToggleBackgroundColor = (level: number, isExpanded: boolean) => {
  if (level === 0) {
    return isExpanded ? 'var(--color-gray-200)' : 'var(--color-gray-100)';
  }
  return isExpanded ? 'var(--color-gray-100)' : 'var(--color-bg-card)';
};

const flattenGroupedData = (
  groupedData: any[],
  expandedGroups: Set<string>,
  level: number = 0,
  startIndex: number = 0
): { items: FlattenedItem[]; index: number } => {
  const items: FlattenedItem[] = [];
  let currentIndex = startIndex;

  for (const group of groupedData) {
    const groupId = `${group.groupColumn}-${group.groupValue}-${level}`;
    const isExpanded = expandedGroups.has(groupId);
    const isNestedGroup = Array.isArray(group.rows) && group.rows.length > 0 && group.rows[0].groupValue;

    // Add group header
    items.push({
      type: 'group',
      group,
      level,
      isFirstTopLevelGroup: level === 0 ? items.filter(item => item.type === 'group' && item.level === 0).length === 0 : false,
      index: currentIndex++
    });

    // Add rows or nested groups if expanded
    if (isExpanded) {
      if (isNestedGroup) {
        // Recursively flatten nested groups
        const nested = flattenGroupedData(group.rows, expandedGroups, level + 1, currentIndex);
        items.push(...nested.items);
        currentIndex = nested.index;
      } else {
        // Add rows in this group
        group.rows.forEach((row: TableData, rowIndex: number) => {
          items.push({
            type: 'row',
            row,
            rowIndex,
            groupRowNumber: rowIndex + 1
          });
          currentIndex++;
        });
      }
    }
  }

  return { items, index: currentIndex };
};

export const VirtualizedTableBody: React.FC<VirtualizedTableBodyProps> = ({
  data,
  columns,
  columnWidths,
  selectedRows,
  onRowSelect,
  onCellChange,
  onContextMenu,
  activeCell,
  setActiveCell,
  tableId,
  height,
  width,
  canEdit = true,
  canSelectRows = true,
  onScroll,
  outerRef,
  groupedData,
  expandedGroups = new Set(),
  setExpandedGroups,
  visibleColumns = columns,
  allColumns,
  pinnedColumnIds = [],
  pinnedColumnOffsets = {},
}) => {
  // Calculate total table width (selector + columns + add column button)
  const totalWidth = 48 + columnWidths.reduce((sum, w) => sum + w, 0);

  // Use outerRef if provided (from Table.tsx tableRef), otherwise create our own
  // This ensures we use the outer container for scrolling, not an inner one
  const fallbackRef = useRef<HTMLDivElement>(null);
  const parentRef = (outerRef as React.RefObject<HTMLDivElement>) || fallbackRef;

  // Flatten data for virtualization (supports both grouped and ungrouped)
  // Optimized: removed unnecessary dependencies (height, rowHeight, columns don't affect flattening)
  const flattenedItems = useMemo(() => {
    if (groupedData && groupedData.length > 0) {
      const flattened = flattenGroupedData(groupedData, expandedGroups);
      return flattened.items;
    } else {
      // Ungrouped data - convert to flattened format
      return data.map((row, index) => ({
        type: 'row' as const,
        row,
        rowIndex: index
      }));
    }
  }, [data, groupedData, expandedGroups]);

  // Get item size function
  const getItemSize = useCallback(
    (index: number) => {
      const item = flattenedItems[index];
      if (!item) return ROW_HEIGHT;
      if (item.type === 'group') {
        const topLevelGap = item.level === 0 && !item.isFirstTopLevelGroup ? 8 : 0;
        return GROUP_HEADER_HEIGHT + topLevelGap;
      }
      return ROW_HEIGHT;
    },
    [flattenedItems]
  );

  // Create virtualizer
  const virtualizer = useVirtualizer({
    count: flattenedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: getItemSize,
    overscan: 5, // Render 5 extra items above/below for smooth scrolling
  });

  // Handle scroll for infinite scrolling
  useEffect(() => {
    const scrollElement = parentRef?.current;
    if (!scrollElement || !onScroll) return;

    const handleScroll = () => {
      const scrollTop = scrollElement.scrollTop;
      onScroll(scrollTop);
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [onScroll, parentRef]);

  // Reset virtualizer when data changes (important for dynamic sizing)
  useEffect(() => {
    virtualizer.measure();
  }, [flattenedItems.length, expandedGroups.size, virtualizer]);

  const getGroupBackgroundColor = useCallback((level: number, isHover: boolean = false): string => {
    if (level === 0) return isHover ? 'var(--color-gray-100)' : 'var(--color-gray-50)';
    if (level === 1) return isHover ? 'var(--color-gray-50)' : 'var(--color-bg-card)';
    return isHover ? 'var(--color-bg-card)' : 'var(--color-bg-primary)';
  }, []);

  const getGroupRailColor = useCallback((level: number): string => {
    if (level === 0) return 'var(--color-gray-300)';
    if (level === 1) return 'var(--color-gray-200)';
    return 'var(--color-gray-150, var(--color-gray-200))';
  }, []);

  const toggleGroup = useCallback((groupId: string) => {
    if (!setExpandedGroups) return;
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, [setExpandedGroups]);

  const setGroupHover = useCallback((e: React.MouseEvent<HTMLDivElement>, level: number, isHover: boolean) => {
    e.currentTarget.style.backgroundColor = getGroupBackgroundColor(level, isHover);
  }, [getGroupBackgroundColor]);

  type GroupColumnCellProps = {
    group: any;
    level: number;
    column: ColumnConfig;
    columnIndex: number;
    groupColumnIndex: number;
    groupId: string;
    isExpanded: boolean;
    isNestedGroup: boolean;
    rowCount: number;
    columnTitle: string;
    lastPinnedColumnId: string | null;
  };

  const renderGroupColumnCell = useCallback(({
    group,
    level,
    column,
    columnIndex,
    groupColumnIndex,
    groupId,
    isExpanded,
    isNestedGroup,
    rowCount,
    columnTitle,
    lastPinnedColumnId,
  }: GroupColumnCellProps) => {
    const columnIdentity = String(column.id || column.key || '');
    const isPinned = pinnedColumnIds.includes(columnIdentity);
    const isGroupedColumn = columnIndex === groupColumnIndex;
    const itemCountLabel = getGroupItemLabel(rowCount, isNestedGroup);
    const groupToggleBackgroundColor = getGroupToggleBackgroundColor(level, isExpanded);

    return (
      <div
        key={`group-cell-${groupId}-${columnIdentity}-${columnIndex}`}
        className="border-r border-b border-border/30 flex items-center px-3 min-w-0"
        style={{
          position: isPinned ? 'sticky' : 'relative',
          left: isPinned ? `${pinnedColumnOffsets[columnIdentity] ?? 48}px` : undefined,
          zIndex: isPinned ? 19 : undefined,
          boxShadow: isPinned && columnIdentity === lastPinnedColumnId ? '2px 0 4px -3px rgba(15,23,42,0.12)' : undefined,
        }}
      >
        {isGroupedColumn && (
          <div className="flex items-center gap-1.5 min-w-0 w-full" style={{ paddingLeft: `${8 + level * 20}px` }}>
            <div
              className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md transition-all duration-200"
              style={{
                backgroundColor: groupToggleBackgroundColor
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 transition-transform text-gray-700" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 transition-transform text-gray-700" />
              )}
            </div>
            <div
              className="flex items-center gap-2 min-w-0 px-2 py-1 rounded-md"
              style={{
                borderLeft: `${level > 0 ? 2 : 0}px solid ${getGroupRailColor(level)}`,
                paddingLeft: `${level > 0 ? 8 : 0}px`,
                backgroundColor: level > 0 ? 'var(--color-bg-card)' : 'transparent',
              }}
            >
              <span className="font-medium text-[11px] tracking-wide uppercase whitespace-nowrap text-gray-500">
                {columnTitle}:
              </span>
              <span className={`truncate ${level === 0 ? 'font-semibold text-foreground' : 'font-medium text-secondary'}`}>
                {group.groupValue}
              </span>
              <span className="text-xs text-gray-500 whitespace-nowrap px-1.5 py-0.5 rounded bg-gray-100">
                {`${rowCount} ${itemCountLabel}`}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }, [getGroupRailColor, pinnedColumnIds, pinnedColumnOffsets]);

  // Render group header aligned to grid columns (not full-width banner)
  const renderGroupHeader = useCallback((item: FlattenedItem & { type: 'group' }) => {
    const { group, level, isFirstTopLevelGroup } = item;
    const isNestedGroup = isNestedGroupRows(group);
    const column = visibleColumns.find(col => col.key === group.groupColumn);
    // Noco-like UX: always render grouping labels in the left grouping lane
    // (first visible data column), regardless of which field is grouped at this depth.
    const groupColumnIndex = 0;
    const columnTitle = column?.title || group.groupColumn;
    const groupId = getGroupId(group, level);
    const isExpanded = expandedGroups.has(groupId);
    const lastPinnedColumnId = getLastPinnedColumnId(visibleColumns, pinnedColumnIds);
    const rowCount = group.rows.length;
    const handleToggleGroup = () => toggleGroup(groupId);

    const handleGroupKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggleGroup();
      }
    };

    const topLevelGap = level === 0 && !isFirstTopLevelGroup ? 8 : 0;

    return (
      <div
        style={{
          paddingTop: `${topLevelGap}px`,
          height: `${GROUP_HEADER_HEIGHT + topLevelGap}px`,
          boxSizing: 'border-box',
        }}
      >
      <div //NOSONAR
        className="grid border-b border-primary/10 font-semibold text-foreground text-sm cursor-pointer transition-all duration-200"
        style={{
          gridTemplateColumns: `48px ${columnWidths.map(w => w + 'px').join(' ')} 48px`,
          height: '40px',
          minHeight: '40px',
          maxHeight: '40px',
          backgroundColor: getGroupBackgroundColor(level, false),
          borderLeft: 'none',
          boxShadow: level === 0 ? 'var(--shadow-xs)' : 'none'
        }}
        onClick={handleToggleGroup}
        onKeyDown={handleGroupKeyDown}
        onMouseEnter={(e) => setGroupHover(e, level, true)}
        onMouseLeave={(e) => setGroupHover(e, level, false)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`Toggle group ${columnTitle}: ${group.groupValue}`}
      >
        <div
          className="flex-shrink-0 border-r border-b border-border/30"
          style={{
            position: 'sticky',
            left: 0,
            zIndex: 20,
            boxShadow: 'inset 1px 0 0 var(--color-border), 2px 0 4px -2px rgba(0,0,0,0.06)'
          }}
        />

        {visibleColumns.map((visibleColumn, index) => renderGroupColumnCell({
          group,
          level,
          column: visibleColumn,
          columnIndex: index,
          groupColumnIndex,
          groupId,
          isExpanded,
          isNestedGroup,
          rowCount,
          columnTitle,
          lastPinnedColumnId,
        }))}

        <div className="border-b border-border/30" />
      </div>
      </div>
    );
  }, [visibleColumns, columnWidths, expandedGroups, getGroupBackgroundColor, pinnedColumnIds, renderGroupColumnCell, setGroupHover, toggleGroup]);

  // Render regular row
  const renderRow = useCallback((item: FlattenedItem & { type: 'row' }) => {
    const { row, rowIndex, groupRowNumber } = item;
    const rowId =
      typeof row._meta?.id === 'string'
        ? row._meta.id
        : String(row._meta?.id ?? row.id ?? `row-${rowIndex}`);

    return (
      <MemoizedTableRow
        row={row}
        rowIndex={rowIndex}
        displayRowNumber={groupRowNumber}
        columns={columns}
        columnWidths={columnWidths}
        isSelected={selectedRows.has(rowId)}
        onSelect={onRowSelect}
        canSelectRows={canSelectRows}
        onCellChange={onCellChange}
        onContextMenu={e => onContextMenu(e, rowId)}
        activeCell={activeCell}
        setActiveCell={setActiveCell}
        tableId={tableId}
        allColumns={allColumns ?? columns}
        canEdit={canEdit}
        pinnedColumnIds={pinnedColumnIds}
        pinnedColumnOffsets={pinnedColumnOffsets}
      />
    );
  }, [columns, columnWidths, selectedRows, onRowSelect, onCellChange, onContextMenu, activeCell, setActiveCell, tableId, allColumns, canEdit, pinnedColumnIds, pinnedColumnOffsets]);

  const virtualItems = virtualizer.getVirtualItems();

  // Ensure we have valid dimensions
  if (!height || !width) {
    return null;
  }

  // Render only the virtualized content - no inner scroll container
  // The outer container (tableRef) handles all scrolling
  return (
    <div
      data-virtualized="true"
      data-virtualizer="tanstack-react-virtual"
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: `${totalWidth}px`,
        position: 'relative',
      }}
    >
        {virtualItems.map((virtualItem) => {
          const item = flattenedItems[virtualItem.index];
          if (!item) return null;

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              style={{
                position: 'absolute',
                top: `${virtualItem.start}px`,
                left: 0,
                width: `${totalWidth}px`,
                height: `${virtualItem.size}px`,
                overflow: 'visible',
              }}
            >
              {item.type === 'group'
                ? renderGroupHeader(item)
                : renderRow(item)}
            </div>
          );
        })}
    </div>
  );
};
