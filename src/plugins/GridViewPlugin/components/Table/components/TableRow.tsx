import React, { useMemo, useCallback } from 'react';
import { EditableTableCell } from '../../../../../components/shared/table/EditableTableCell';
import { GridRecord as TableData, GridColumn as ColumnConfig } from '../../../types/grid.types';

interface TableRowProps {
  row: TableData;
  rowIndex: number;
  columns: ColumnConfig[];
  columnWidths: number[];
  isSelected: boolean;
  onSelect: (rowId: string, selected: boolean) => void;
  onCellChange: (rowId: string, columnKey: string, value: any) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  activeCell?: { rowId: string; colKey: string } | null;
  setActiveCell?: React.Dispatch<React.SetStateAction<{ rowId: string; colKey: string } | null>>;
  tableId?: string;
  displayRowNumber?: number; // Optional: override the displayed row number (for grouped rows)
  allColumns?: ColumnConfig[]; // All columns for formula field name mapping
  canEdit?: boolean; // Permission to edit cells
  canSelectRows?: boolean;
  pinnedColumnIds?: string[];
  pinnedColumnOffsets?: Record<string, number>;
}

// Helper to extract row ID
const getRowId = (row: TableData): string => {
  return (row as any)._meta?.id || (row as any).id?.toString() || '';
};

// Helper to get cell value from row
const getCellValue = (row: TableData, columnKey: string): any => {
  return (row as any)[columnKey] ?? (row as any).data?.[columnKey] ?? (row as any)._meta?.[columnKey];
};

const getColumnIdentity = (column: ColumnConfig): string => {
  return String(column.id || column.key || '');
};

export const TableRow: React.FC<TableRowProps> = ({
  row,
  rowIndex,
  columns,
  columnWidths,
  isSelected,
  onSelect,
  onCellChange,
  onContextMenu,
  activeCell,
  setActiveCell,
  tableId,
  displayRowNumber,
  allColumns,
  canEdit = true,
  canSelectRows = true,
  pinnedColumnIds = [],
  pinnedColumnOffsets = {},
}) => {
  // Memoize rowId to avoid recalculating on every render
  const rowId = useMemo(() => getRowId(row), [row]);

  const handleCellChange = useCallback((columnKey: string, value: any) => {
    if (rowId) onCellChange(rowId, columnKey, value);
  }, [rowId, onCellChange]);

  // Check if any cell in this row is active or if the row is selected via checkbox
  const isRowActive = useMemo(() => {
    return activeCell?.rowId === rowId || isSelected;
  }, [activeCell, rowId, isSelected]);

  // Memoize column objects to prevent recreating them on every render
  const memoizedColumnProps = useMemo(() => {
    const pinnedSet = new Set(pinnedColumnIds.map(String));
    let lastPinnedColumnId: string | null = null;
    columns.forEach((column) => {
      const identity = getColumnIdentity(column);
      if (pinnedSet.has(identity)) {
        lastPinnedColumnId = identity;
      }
    });

    return columns.map((column, index) => {
      const value = getCellValue(row, column.key);
      const isActive = activeCell?.rowId === rowId && activeCell?.colKey === column.key;
      const columnIdentity = getColumnIdentity(column);
      const isPinned = pinnedSet.has(columnIdentity);

      return {
        columnIdentity,
        column: {
          id: column.id || '',
          title: column.title,
          column_name: column.key,
          uidt: column.type || column.uidt || 'text',
          system: column.isSystem || column.system || false,
          meta: column.meta || {}, // Pass original meta
          config: column.config || {}, // Pass parsed config (used by EditableTableCell)
          width: column.width,
          order_index: column.order_index || column.position || 0,
          model_id: tableId,
        },
        value,
        width: columnWidths[index],
        isLast: index === columns.length - 1,
        isSystemField: column.isSystem || column.system || false,
        isActive,
        currentRowId: Number.parseInt(rowId),
        isPinned,
        isLastPinned: isPinned && columnIdentity === lastPinnedColumnId,
        pinnedLeft: isPinned ? (pinnedColumnOffsets[columnIdentity] ?? 48) : 0,
      };
    });
  }, [columns, row, columnWidths, activeCell, rowId, tableId, pinnedColumnIds, pinnedColumnOffsets]);

  // Handle row click to deselect active cell
  const handleRowClick = useCallback(() => {
    setActiveCell?.(null);
  }, [setActiveCell]);

  // Handle row keyboard events
  const handleRowKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setActiveCell?.(null);
    }
  }, [setActiveCell]);

  // Handle cell click to set active cell
  const handleCellClick = useCallback((e: React.MouseEvent, columnKey: string) => {
    e.stopPropagation();
    setActiveCell?.({ rowId, colKey: columnKey });
  }, [rowId, setActiveCell]);

  // Handle cell keyboard events
  const handleCellKeyDown = useCallback((e: React.KeyboardEvent, columnKey: string) => {
    // Only handle Enter/space for activating cells, not when already editing
    const isAlreadyActive = activeCell?.rowId === rowId && activeCell?.colKey === columnKey;
    if (!isAlreadyActive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setActiveCell?.({ rowId, colKey: columnKey });
    }
  }, [rowId, setActiveCell, activeCell]);

  return (
    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
    <div
      className={`group grid transition-colors min-w-full ${isRowActive ? 'relative z-[2] border-[var(--color-brand-600)]' : ''}`}
      style={{
        gridTemplateColumns: `48px ${columnWidths.map(w => w + 'px').join(' ')} 48px`,
        height: '40px',
        minHeight: '40px',
        maxHeight: '40px',
        boxSizing: 'border-box',
        overflow: 'visible',
        boxShadow: isRowActive
          ? 'inset 0 1px 0 var(--color-brand-600), inset 0 -1px 0 var(--color-brand-600), inset -1px 0 0 var(--color-brand-600)'
          : undefined,
      }}
      onContextMenu={onContextMenu}
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      role="row"
      tabIndex={0}
    >
      <div
        className={`flex-shrink-0 w-13 bg-background border-r hover:bg-gray-50 ${isRowActive ? 'border-b border-t border-[var(--color-brand-600)]' : 'border-b border-border/30'} flex items-center justify-center relative select-none gap-2`}
        style={{
          height: '40px',
          position: 'sticky',
          left: 0,
          zIndex: 11,
          boxShadow: isRowActive
            ? 'inset 1px 0 0 var(--color-brand-600), inset 0 -1px 0 var(--color-brand-600)'
            : 'inset 1px 0 0 var(--color-border), inset 0 -1px 0 var(--color-border)'
        }}
      >
        {(() => {
          const hoverHideClass = canSelectRows ? 'group-hover:opacity-0' : '';
          const rowNumberClassName = `text-xs text-muted-foreground font-normal absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none transition-opacity duration-150 ${isSelected ? 'opacity-0' : hoverHideClass}`;
          return (
            <span className={rowNumberClassName} style={{ zIndex: 1 }}>{displayRowNumber ?? rowIndex + 1}</span>
          );
        })()}
        {canSelectRows && (
          <input
            type="checkbox"
            className={`checkbox-primary-brand ${isSelected
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
              }`}
            checked={isSelected}
            onChange={(e) => {
              const currentRowId = getRowId(row);
              if (currentRowId) onSelect(currentRowId, e.target.checked);
            }}
            style={{ zIndex: 2 }}
          />
        )}
      </div>
      {memoizedColumnProps.map((props, index) => {
        const column = columns[index];
        let borderClass: string;
        if (props.isActive) {
          borderClass = 'border border-[var(--color-brand-600)]';
        } else if (isRowActive) {
          // Keep row-level top/bottom border visible on each cell
          borderClass = props.isLast
            ? 'border-t border-b border-r border-[var(--color-brand-600)]'
            : 'border-t border-b border-[var(--color-brand-600)]';
        } else {
          borderClass = 'border-b border-border/30';
        }

        let zIndex: number | undefined;
        if (props.isPinned) {
          zIndex = props.isActive ? 20 : 18;
        }

        return (
          // eslint-disable-next-line jsx-a11y/prefer-tag-over-role, jsx-a11y/no-noninteractive-element-to-interactive-role
          <div
            key={`${column.id || column.key || 'column'}-${index}`}
            className={borderClass}
            style={{
              height: '40px',
              minHeight: '40px',
              maxHeight: '40px',
              overflow: 'hidden',
              boxSizing: 'border-box',
              position: props.isPinned ? 'sticky' : 'relative',
              left: props.isPinned ? `${props.pinnedLeft}px` : undefined,
              zIndex,
              boxShadow: props.isLastPinned ? '2px 0 4px -3px rgba(15,23,42,0.12)' : undefined,
            }}
            onClick={(e) => handleCellClick(e, column.key)}
            onKeyDown={(e) => handleCellKeyDown(e, column.key)}
            role="gridcell"
            tabIndex={0}
          >
            <EditableTableCell
              column={props.column}
              value={props.value}
              onChange={(value) => handleCellChange(column.key, value)}
              width={props.width}
              isLast={props.isLast}
              isSystemField={props.isSystemField}
              allowEdit={canEdit}
              currentRowId={props.currentRowId}
              rowData={row as any} // Pass entire row object for formula evaluation
              allColumns={allColumns || columns} // Pass all columns for formula field name mapping
            />
          </div>
        );
      })}
    </div>
  );
};

// Helper functions for memo comparison to reduce cognitive complexity
const compareBasicProps = (prevProps: TableRowProps, nextProps: TableRowProps): boolean => {
  return (
    prevProps.rowIndex === nextProps.rowIndex &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.columns.length === nextProps.columns.length &&
    prevProps.columnWidths.length === nextProps.columnWidths.length &&
    prevProps.activeCell?.rowId === nextProps.activeCell?.rowId &&
    prevProps.activeCell?.colKey === nextProps.activeCell?.colKey
  );
};

const compareRowIds = (prevProps: TableRowProps, nextProps: TableRowProps): boolean => {
  const prevRowId = getRowId(prevProps.row);
  const nextRowId = getRowId(nextProps.row);
  return prevRowId === nextRowId;
};

const compareArrayValue = (prevValue: any[], nextValue: any[]): boolean => {
  if (prevValue.length !== nextValue.length) return false;
  if (prevValue.length === 0) return true;
  return JSON.stringify(prevValue) === JSON.stringify(nextValue);
};

const compareObjectValue = (prevValue: Record<string, any>, nextValue: Record<string, any>): boolean => {
  const prevKeys = Object.keys(prevValue);
  const nextKeys = Object.keys(nextValue);
  if (prevKeys.length !== nextKeys.length) return false;
  if (prevKeys.length === 0) return true;
  return JSON.stringify(prevValue) === JSON.stringify(nextValue);
};

const isPrimitive = (value: any): boolean => {
  return value === null || typeof value !== 'object';
};

const compareSingleCellValue = (prevValue: any, nextValue: any): boolean => {
  // Fast path: Reference equality check first
  if (prevValue === nextValue) return true;

  // Check primitives
  if (isPrimitive(prevValue) || isPrimitive(nextValue)) {
    return prevValue === nextValue;
  }

  // Check arrays
  if (Array.isArray(prevValue) && Array.isArray(nextValue)) {
    return compareArrayValue(prevValue, nextValue);
  }

  // Check objects (both are objects at this point)
  return compareObjectValue(prevValue, nextValue);
};

const compareCellValues = (prevProps: TableRowProps, nextProps: TableRowProps): boolean => {
  for (const column of prevProps.columns) {
    const columnKey = column.key;
    const prevValue = getCellValue(prevProps.row, columnKey);
    const nextValue = getCellValue(nextProps.row, columnKey);

    if (!compareSingleCellValue(prevValue, nextValue)) {
      return false;
    }
  }
  return true;
};

const compareColumnBasic = (prevCol: ColumnConfig, nextCol: ColumnConfig): boolean => {
  return (
    prevCol.key === nextCol.key &&
    prevCol.id === nextCol.id &&
    prevCol.title === nextCol.title &&
    prevCol.uidt === nextCol.uidt
  );
};

const compareColumnConfig = (prevConfig: any, nextConfig: any): boolean => {
  if (prevConfig === nextConfig) return true;
  if (typeof prevConfig !== 'object' || typeof nextConfig !== 'object' || prevConfig === null || nextConfig === null) {
    return prevConfig === nextConfig;
  }
  const prevKeys = Object.keys(prevConfig);
  const nextKeys = Object.keys(nextConfig);
  if (prevKeys.length !== nextKeys.length) return false;
  for (const key of prevKeys) {
    if (prevConfig[key] !== nextConfig[key]) return false;
  }
  return true;
};

const compareColumnMeta = (prevMeta: any, nextMeta: any): boolean => {
  if (prevMeta === nextMeta) return true;
  if (typeof prevMeta !== 'object' || typeof nextMeta !== 'object' || prevMeta === null || nextMeta === null) {
    return prevMeta === nextMeta;
  }
  const prevKeys = Object.keys(prevMeta);
  const nextKeys = Object.keys(nextMeta);
  if (prevKeys.length !== nextKeys.length) return false;
  for (const key of prevKeys) {
    if (prevMeta[key] !== nextMeta[key]) return false;
  }
  return true;
};

const compareColumns = (prevProps: TableRowProps, nextProps: TableRowProps): boolean => {
  for (let i = 0; i < prevProps.columns.length; i++) {
    const prevCol = prevProps.columns[i];
    const nextCol = nextProps.columns[i];

    if (!compareColumnBasic(prevCol, nextCol)) return false;
    if (!compareColumnConfig(prevCol.config, nextCol.config)) return false;
    if (!compareColumnMeta(prevCol.meta, nextCol.meta)) return false;
  }
  return true;
};

const compareColumnWidths = (prevProps: TableRowProps, nextProps: TableRowProps): boolean => {
  if (prevProps.columnWidths.length !== nextProps.columnWidths.length) return false;
  for (let i = 0; i < prevProps.columnWidths.length; i++) {
    if (prevProps.columnWidths[i] !== nextProps.columnWidths[i]) return false;
  }
  return true;
};

const comparePinnedState = (prevProps: TableRowProps, nextProps: TableRowProps): boolean => {
  const prevPinnedIds = prevProps.pinnedColumnIds || [];
  const nextPinnedIds = nextProps.pinnedColumnIds || [];
  if (prevPinnedIds.length !== nextPinnedIds.length) return false;
  for (let i = 0; i < prevPinnedIds.length; i++) {
    if (prevPinnedIds[i] !== nextPinnedIds[i]) return false;
  }

  const prevOffsets = prevProps.pinnedColumnOffsets || {};
  const nextOffsets = nextProps.pinnedColumnOffsets || {};
  const prevKeys = Object.keys(prevOffsets);
  const nextKeys = Object.keys(nextOffsets);
  if (prevKeys.length !== nextKeys.length) return false;
  for (const key of prevKeys) {
    if (prevOffsets[key] !== nextOffsets[key]) return false;
  }

  return true;
};

// Memoize TableRow to prevent unnecessary re-renders
export const MemoizedTableRow = React.memo(TableRow, (prevProps, nextProps) => {
  // Custom comparison for better performance
  if (!compareBasicProps(prevProps, nextProps)) {
    return false; // Props changed, should re-render
  }

  if (!compareRowIds(prevProps, nextProps)) {
    return false;
  }

  if (!compareCellValues(prevProps, nextProps)) {
    return false;
  }

  if (!compareColumns(prevProps, nextProps)) {
    return false;
  }

  if (!compareColumnWidths(prevProps, nextProps)) {
    return false;
  }

  if (!comparePinnedState(prevProps, nextProps)) {
    return false;
  }

  return true; // Props are equal, skip re-render
});
