import React, { useMemo } from 'react';
import { GridColumn as ColumnConfig } from '../../../types/grid.types';

interface SkeletonRowProps {
  columns: ColumnConfig[];
  columnWidths: number[];
  rowIndex: number;
}

// Deterministic width calculation based on rowIndex and columnIndex
// This ensures consistent rendering and avoids recalculation on re-renders
const getSkeletonWidth = (colWidth: number, rowIndex: number, colIndex: number): number => {
  // Use a pseudo-random pattern based on row and column indices
  // This creates varied but consistent widths per row/column combination
  const seed = (rowIndex * 7 + colIndex * 13) % 100;
  const minWidth = colWidth * 0.55;
  const maxWidth = colWidth * 0.95;
  const variation = (maxWidth - minWidth) * (seed / 100);
  return Math.floor(minWidth + variation);
};

// Shimmer animation keyframes (inline style to avoid external CSS dependency)
const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s ease-in-out infinite',
};

// Inject shimmer keyframes if not already present
if (typeof document !== 'undefined' && !document.getElementById('skeleton-shimmer-style')) {
  const style = document.createElement('style');
  style.id = 'skeleton-shimmer-style';
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(style);
}

export const SkeletonRow: React.FC<SkeletonRowProps> = React.memo(({
  columns,
  columnWidths,
  rowIndex,
}) => {
  // Memoize skeleton widths to avoid recalculation
  const skeletonWidths = useMemo(() => {
    return columns.map((_, index) => 
      getSkeletonWidth(columnWidths[index] || 235, rowIndex, index)
    );
  }, [columns, columnWidths, rowIndex]);

  // Vary skeleton pattern per row (some rows have more/less filled cells)
  const rowPattern = useMemo(() => {
    // Create a pattern where some cells might be empty or shorter
    const pattern = rowIndex % 3;
    return pattern === 0 ? 'full' : pattern === 1 ? 'partial' : 'sparse';
  }, [rowIndex]);

  return (
    <div
      className="group grid min-w-full"
      role="status"
      aria-label="Loading row"
      style={{ 
        gridTemplateColumns: `48px ${columnWidths.map(w => w + 'px').join(' ')} 48px`, 
        height: '40px', 
        minHeight: '40px', 
        maxHeight: '40px' 
      }}
    >
      {/* Row number cell */}
      <div className="flex-shrink-0 w-[48px] h-10 border-r border-b border-border/30 flex items-center justify-center bg-background sticky left-0 z-1">
        <div 
          className="w-6 h-4 rounded"
          style={shimmerStyle}
        />
      </div>

      {/* Data cells - skeleton bars with varied patterns */}
      {columns.map((column, index) => {
        const width = skeletonWidths[index];
        const shouldShow = rowPattern === 'full' || 
                          (rowPattern === 'partial' && index % 2 === 0) ||
                          (rowPattern === 'sparse' && index % 3 === 0);
        
        return (
          <div
            key={column.id || column.key || index}
            className="flex items-center px-3 border-r border-b border-border/30 bg-background"
            style={{ width: `${columnWidths[index]}px` }}
          >
            {shouldShow && (
              <div
                className="h-4 rounded"
                style={{ 
                  ...shimmerStyle,
                  width: `${width}px`,
                  animationDelay: `${(rowIndex * 50 + index * 30) % 1000}ms`
                }}
              />
            )}
          </div>
        );
      })}

      {/* Actions cell */}
      <div className="flex-shrink-0 w-[48px] h-10 border-r border-b border-border/30 flex items-center justify-center bg-background" />
    </div>
  );
});

SkeletonRow.displayName = 'SkeletonRow';

