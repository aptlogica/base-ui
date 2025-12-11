// Main Table component
export { Table } from './Table';

// Table sub-components
export { TableHeader, TableRow, ContextMenu, Search } from './Table';

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
