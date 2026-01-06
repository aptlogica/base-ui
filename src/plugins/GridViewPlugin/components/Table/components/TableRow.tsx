import React, { useState, useMemo, useCallback } from 'react';
import { EditableTableCell } from '../../../../../components/shared/table/EditableTableCell';
import { GridRecord as TableData, GridColumn as ColumnConfig } from '../../../types/grid.types';
import { Trash2 } from 'lucide-react';

interface TableRowProps {
  row: TableData;
  rowIndex: number;
  columns: ColumnConfig[];
  columnWidths: number[];
  isSelected: boolean;
  onSelect: (rowId: string, selected: boolean) => void;
  onCellChange: (rowId: string, columnKey: string, value: any) => void;
  onDelete?: (rowId: string) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
   activeCell?: { rowId: string; colKey: string } | null;
  setActiveCell?: React.Dispatch<React.SetStateAction<{ rowId: string; colKey: string } | null>>;
  tableId?: string;
  displayRowNumber?: number; // Optional: override the displayed row number (for grouped rows)
  allColumns?: ColumnConfig[]; // All columns for formula field name mapping
  canEdit?: boolean; // Permission to edit cells
}

export const TableRow: React.FC<TableRowProps> = ({
  row,
  rowIndex,
  columns,
  columnWidths,
  isSelected,
  onSelect,
  onCellChange,
  onDelete,
  onContextMenu,
    activeCell,
  setActiveCell,
  tableId,
  displayRowNumber,
  allColumns,
  canEdit = true
}) => {
  // Memoize rowId to avoid recalculating on every render
  const rowId = useMemo(() => 
    (row as any)._meta?.id || (row as any).id?.toString(),
    [row]
  );

  const handleCellChange = useCallback((columnKey: string, value: any) => {
    if (rowId) onCellChange(rowId, columnKey, value);
  }, [rowId, onCellChange]);

  // Memoize column objects to prevent recreating them on every render
  const memoizedColumnProps = useMemo(() => {
    return columns.map((column, index) => {
      const value = (row as any)[column.key] ?? (row as any).data?.[column.key] ?? (row as any)._meta?.[column.key];
      const isActive = activeCell?.rowId === rowId && activeCell?.colKey === column.key;
      
      return {
        column: {
          id: column.id || '',
          title: column.title,
          column_name: column.key,
          uidt: column.uidt || column.type || 'text',
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
        currentRowId: parseInt(rowId),
      };
    });
  }, [columns, row, columnWidths, activeCell, rowId, tableId]);

  return (
    <div
      className="group grid transition-colors min-w-full"
      style={{ gridTemplateColumns: `48px ${columnWidths.map(w => w + 'px').join(' ')} 48px`, height: '40px', minHeight: '40px', maxHeight: '40px' }}
      onContextMenu={onContextMenu}
      onClick={() => setActiveCell?.(null)}
    >
      <div className="flex-shrink-0 w-13 h-10 bg-background border-r border-b flex items-center justify-center bg-muted/30 relative select-none gap-2" style={{height: '40px', position: 'sticky', left: 0, zIndex: 11, boxShadow: '2px 0 4px -2px rgba(0,0,0,0.06)'}}>
        {/* Row number always visible, but fades out on hover or when selected */}
        <span className={`text-xs text-muted-foreground font-normal absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none transition-opacity duration-150 ${
          isSelected ? 'opacity-0' : 'group-hover:opacity-0'
        }`} style={{zIndex: 1}}>{displayRowNumber !== undefined ? displayRowNumber : rowIndex + 1}</span>
        <input
          type="checkbox"
          className={`checkbox-primary-brand ${
            isSelected 
              ? 'opacity-100 pointer-events-auto' 
              : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
          }`}
          checked={isSelected}
          onChange={(e) => {
            const rowId = (row as any)._meta?.id || (row as any).id?.toString();
            if (rowId) onSelect(rowId, e.target.checked);
          }}
          style={{zIndex: 2}}
        />
      </div>
      {memoizedColumnProps.map((props, index) => {
        const column = columns[index];
        return (
          <div
           key={column.key}
            className={`${props.isActive ? 'border border-[var(--color-brand-600)]' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setActiveCell?.({ rowId, colKey: column.key });
            }}
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
      {/* Empty cell for the last column - no border to terminate grid lines properly */}
      {/* <div className="flex-shrink-0 w-13 h-10 flex items-center justify-center bg-background relative border-b-0" style={{height: '40px'}} /> */}
    </div>
  );
};

// Memoize TableRow to prevent unnecessary re-renders
export const MemoizedTableRow = React.memo(TableRow, (prevProps, nextProps) => {
  // Custom comparison for better performance
  if (
    prevProps.rowIndex !== nextProps.rowIndex ||
    prevProps.isSelected !== nextProps.isSelected ||
    prevProps.columns.length !== nextProps.columns.length ||
    prevProps.columnWidths.length !== nextProps.columnWidths.length ||
    prevProps.activeCell?.rowId !== nextProps.activeCell?.rowId ||
    prevProps.activeCell?.colKey !== nextProps.activeCell?.colKey
  ) {
    return false; // Props changed, should re-render
  }

  // Compare row ID
  const prevRowId = (prevProps.row as any)._meta?.id || (prevProps.row as any).id?.toString();
  const nextRowId = (nextProps.row as any)._meta?.id || (nextProps.row as any).id?.toString();
  if (prevRowId !== nextRowId) {
    return false;
  }

  // CRITICAL: Compare row data values to detect changes
  // This ensures UI updates when cell values change after API calls
  // OPTIMIZED: Only do deep comparison when references are equal (likely unchanged)
  // This prevents expensive JSON.stringify on every comparison
  for (let i = 0; i < prevProps.columns.length; i++) {
    const column = prevProps.columns[i];
    const columnKey = column.key;
    
    // Get values from both rows
    const prevValue = (prevProps.row as any)[columnKey] ?? (prevProps.row as any).data?.[columnKey] ?? (prevProps.row as any)._meta?.[columnKey];
    const nextValue = (nextProps.row as any)[columnKey] ?? (nextProps.row as any).data?.[columnKey] ?? (nextProps.row as any)._meta?.[columnKey];
    
    // Fast path: Reference equality check first (most common case - no change)
    if (prevValue === nextValue) {
      continue; // Same reference, definitely unchanged
    }
    
    // If references differ, check if values are actually different
    // For primitives, !== is sufficient
    if (prevValue === null || nextValue === null || 
        typeof prevValue !== 'object' || typeof nextValue !== 'object') {
      if (prevValue !== nextValue) {
        return false; // Primitive values changed, should re-render
      }
      continue;
    }
    
    // For arrays/objects, only do expensive comparison if references differ
    // This is the rare case where content changed but we need to verify
    if (Array.isArray(prevValue) && Array.isArray(nextValue)) {
      // Quick length check first
      if (prevValue.length !== nextValue.length) {
        return false; // Different lengths, definitely changed
      }
      // Only do deep comparison if lengths match (expensive but necessary)
      if (prevValue.length > 0 && JSON.stringify(prevValue) !== JSON.stringify(nextValue)) {
        return false; // Array contents changed, should re-render
      }
    } else if (typeof prevValue === 'object' && typeof nextValue === 'object') {
      // For objects, compare keys first (cheaper than full stringify)
      const prevKeys = Object.keys(prevValue);
      const nextKeys = Object.keys(nextValue);
      if (prevKeys.length !== nextKeys.length) {
        return false; // Different number of keys, changed
      }
      // Only do deep comparison if key counts match
      if (prevKeys.length > 0 && JSON.stringify(prevValue) !== JSON.stringify(nextValue)) {
        return false; // Object contents changed, should re-render
      }
    } else {
      // Type mismatch
      return false;
    }
  }

  // Compare columns - check if any column changed (including meta/config for icon/color updates)
  for (let i = 0; i < prevProps.columns.length; i++) {
    const prevCol = prevProps.columns[i];
    const nextCol = nextProps.columns[i];
    
    if (
      prevCol.key !== nextCol.key ||
      prevCol.id !== nextCol.id ||
      prevCol.title !== nextCol.title ||
      prevCol.uidt !== nextCol.uidt
    ) {
      return false;
    }
    
    // Deep compare config (contains icon, color, etc.) - critical for UI updates
    const prevConfig = prevCol.config;
    const nextConfig = nextCol.config;
    if (prevConfig !== nextConfig) {
      if (typeof prevConfig === 'object' && typeof nextConfig === 'object' && prevConfig !== null && nextConfig !== null) {
        const prevKeys = Object.keys(prevConfig);
        const nextKeys = Object.keys(nextConfig);
        if (prevKeys.length !== nextKeys.length) {
          return false;
        }
        for (const key of prevKeys) {
          if (prevConfig[key] !== nextConfig[key]) {
            return false; // Config changed (icon, color, etc.)
          }
        }
      } else if (prevConfig !== nextConfig) {
        return false;
      }
    }
    
    // Also compare meta
    const prevMeta = prevCol.meta;
    const nextMeta = nextCol.meta;
    if (prevMeta !== nextMeta) {
      if (typeof prevMeta === 'object' && typeof nextMeta === 'object' && prevMeta !== null && nextMeta !== null) {
        const prevKeys = Object.keys(prevMeta);
        const nextKeys = Object.keys(nextMeta);
        if (prevKeys.length !== nextKeys.length) {
          return false;
        }
        for (const key of prevKeys) {
          if (prevMeta[key] !== nextMeta[key]) {
            return false;
          }
        }
      } else if (prevMeta !== nextMeta) {
        return false;
      }
    }
  }

  // Compare column widths
  for (let i = 0; i < prevProps.columnWidths.length; i++) {
    if (prevProps.columnWidths[i] !== nextProps.columnWidths[i]) {
      return false;
    }
  }

  return true; // Props are equal, skip re-render
});