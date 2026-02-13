// Main Table component
export { Table } from './Table';

// Table sub-components
export { TableRow } from './components/TableRow';
export { ContextMenu } from './components/ContextMenu';
export { ColumnDropdown } from './components/ColumnDropdown';
export { ColumnContextMenu } from './components/ColumnContextMenu';
export { VirtualizedTableBody } from './components/VirtualizedTableBody';
export { Search } from '../../../../components/shared/table/Search';

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
