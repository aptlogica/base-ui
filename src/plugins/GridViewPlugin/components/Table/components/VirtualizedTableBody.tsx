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
  onDelete: (rowId: string) => void;
  onContextMenu: (e: React.MouseEvent, rowId: string) => void;
  activeCell: { rowId: string; colKey: string } | null;
  setActiveCell: React.Dispatch<React.SetStateAction<{ rowId: string; colKey: string } | null>>;
  tableId?: string;
  height: number;
  width: number;
  rowHeight?: number;
  onScroll?: (scrollOffset: number) => void;
  outerRef?: React.RefObject<HTMLDivElement | null>; 
  groupedData?: any[] | null;
  expandedGroups?: Set<string>;
  setExpandedGroups?: React.Dispatch<React.SetStateAction<Set<string>>>;
  visibleColumns?: ColumnConfig[];
  allColumns?: ColumnConfig[]; // All columns for formula field name mapping
  canEdit?: boolean; // Permission to edit cells
}

const ROW_HEIGHT = 40; // Row height in pixels
const GROUP_HEADER_HEIGHT = 40; // Group header height in pixels

// Flatten grouped data into a single array for virtualization
type FlattenedItem =
  | { type: 'group'; group: any; level: number; index: number }
  | { type: 'row'; row: TableData; rowIndex: number; groupRowNumber?: number };

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
  onDelete,
  onContextMenu,
  activeCell,
  setActiveCell,
  tableId,
  height,
  width,
  rowHeight = ROW_HEIGHT,
  canEdit = true,
  onScroll,
  outerRef,
  groupedData,
  expandedGroups = new Set(),
  setExpandedGroups,
  visibleColumns = columns,
  allColumns,
}) => {
  // Calculate total table width (selector + columns + add column button)
  const totalWidth = 48 + columnWidths.reduce((sum, w) => sum + w, 0) + 48;

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
      return item.type === 'group' ? GROUP_HEADER_HEIGHT : ROW_HEIGHT;
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

  // Ensure we have valid dimensions
  if (!height || !width) {
    return null;
  }

  // Render group header
  const renderGroupHeader = useCallback((item: FlattenedItem & { type: 'group' }) => {
    const { group, level } = item;
    const isNestedGroup = Array.isArray(group.rows) && group.rows.length > 0 && group.rows[0].groupValue;
    const column = visibleColumns.find(col => col.key === group.groupColumn);
    const columnTitle = column?.title || group.groupColumn;
    const groupId = `${group.groupColumn}-${group.groupValue}-${level}`;
    const isExpanded = expandedGroups.has(groupId);

    const toggleGroup = () => {
      if (setExpandedGroups) {
        setExpandedGroups(prev => {
          const next = new Set(prev);
          if (next.has(groupId)) {
            next.delete(groupId);
          } else {
            next.add(groupId);
          }
          return next;
        });
      }
    };

    return (
      <div
        className="grid border-b border-primary/10 font-semibold text-foreground text-sm cursor-pointer transition-all duration-200"
        style={{
          gridTemplateColumns: `48px ${columnWidths.map(w => w + 'px').join(' ')} 48px`,
          height: '40px',
          minHeight: '40px',
          maxHeight: '40px',
          backgroundColor: level === 0
            ? 'var(--color-utility-purple-50)'
            : level === 1
              ? 'var(--color-utility-gray-blue-50)'
              : 'var(--color-gray-50)',
          borderLeft: level > 0 ? `3px solid ${level === 1 ? 'var(--color-utility-purple-300)' : 'var(--color-gray-300)'}` : 'none',
          paddingLeft: `${12 + level * 24}px`,
          boxShadow: level === 0 ? 'var(--shadow-xs)' : 'none'
        }}
        onClick={toggleGroup}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = level === 0
            ? 'var(--color-utility-purple-100)'
            : level === 1
              ? 'var(--color-utility-gray-blue-100)'
              : 'var(--color-gray-100)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = level === 0
            ? 'var(--color-utility-purple-50)'
            : level === 1
              ? 'var(--color-utility-gray-blue-50)'
              : 'var(--color-gray-50)';
        }}
      >
        <div className="col-span-full flex items-center px-4 py-2 gap-3">
          <div
            className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded transition-all duration-200"
            style={{
              backgroundColor: isExpanded ? 'var(--color-utility-purple-100)' : 'var(--color-utility-purple-50)'
            }}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 transition-transform" style={{ color: 'var(--color-utility-purple-600)' }} />
            ) : (
              <ChevronRight className="w-4 h-4 transition-transform" style={{ color: 'var(--color-utility-purple-600)' }} />
            )}
          </div>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="font-bold text-sm tracking-wide" style={{ color: 'var(--color-utility-purple-700)' }}>
              {columnTitle}:
            </span>
            <span className="font-semibold text-foreground">{group.groupValue}</span>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: 'var(--color-utility-purple-100)',
                color: 'var(--color-utility-purple-700)',
                borderColor: 'var(--color-utility-purple-300)'
              }}
            >
              {isNestedGroup ? group.rows.length : group.rows.length} {isNestedGroup ? 'group' : 'row'}{group.rows.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    );
  }, [visibleColumns, columnWidths, expandedGroups, setExpandedGroups]);

  // Render regular row
  const renderRow = useCallback((item: FlattenedItem & { type: 'row' }) => {
    const { row, rowIndex, groupRowNumber } = item;
    const rowId =
      typeof row._meta?.id === 'string'
        ? row._meta.id
        : String(row._meta?.id || row.id || `row-${rowIndex}`);

    return (
      <MemoizedTableRow
        row={row}
        rowIndex={rowIndex}
        displayRowNumber={groupRowNumber}
        columns={columns}
        columnWidths={columnWidths}
        isSelected={selectedRows.has(rowId)}
        onSelect={onRowSelect}
        onCellChange={onCellChange}
        onDelete={onDelete}
        onContextMenu={e => onContextMenu(e, rowId)}
        activeCell={activeCell}
        setActiveCell={setActiveCell}
        tableId={tableId}
        allColumns={allColumns || columns}
        canEdit={canEdit}
      />
    );
  }, [columns, columnWidths, selectedRows, onRowSelect, onCellChange, onDelete, onContextMenu, activeCell, setActiveCell, tableId, allColumns]);

  const virtualItems = virtualizer.getVirtualItems();

  // Render only the virtualized content - no inner scroll container
  // The outer container (tableRef) handles all scrolling
  return (
    <>
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
                top: 0,
                left: 0,
                width: `${totalWidth}px`,
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
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
    </>
  );
};
