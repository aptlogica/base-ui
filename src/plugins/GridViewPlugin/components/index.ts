// Main Table component
export { Table } from './Table';

// Table sub-components
export { TableRow, ContextMenu, Search, ColumnDropdown, ColumnContextMenu, VirtualizedTableBody } from './Table';

// Table modals
export { NewColumnModalPortal } from './Table';

// Shared components
export * from './shared';

// Types
export type { 
  GridRecord as TableData, 
  GridColumn as ColumnConfig, 
  FilterState, 
  SortState,
  AttachmentFile 
} from '../types/grid.types';
