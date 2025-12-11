// Main Table component
export { Table } from './Table';

// Table sub-components
export { TableHeader } from './components/TableHeader';
export { TableRow } from './components/TableRow';
export { ContextMenu } from './components/ContextMenu';
export { default as Search } from './components/Search';

// Table modals
export { NewColumnModalPortal } from './modals/NewColumnModalPortal';

// Types
export type { 
  GridRecord as TableData, 
  GridColumn as ColumnConfig, 
  FilterState, 
  SortState,
  AttachmentFile 
} from '../../types/grid.types';