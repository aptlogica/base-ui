// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com

import { BaseColumn } from '../../../types/column.types';
import type { FieldType } from '../../../types/fieldTypes';
import type { FieldRendererType } from '../../../utils/fieldType';

export interface GridTable {
  id: string;
  title: string;
  description?: string;
  base_id: string;
  workspace_id: string;
}

// Grid-specific column interface extending BaseColumn
export interface GridColumn extends Omit<BaseColumn, 'type' | 'meta'> {
  type: GridFieldType; // Use strict typing for better type safety
  options?: string[] | GridSelectOption[]; // Support both formats
  meta?: GridColumnMeta; // Column metadata
  config?: GridColumnConfig;
}

// Unified Record interface merging GridRecord and TableData
export interface GridRecord {
  id: string;
  // Support both new structured format and legacy flat format
  data?: Record<string, any>;
  _meta?: GridRecordMeta;
  meta?: GridRecordMeta;
  // For legacy/flat format compatibility
  [key: string]: any;
}

export interface GridRecordMeta {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  position: number;
  created_by?: string;
  updated_by?: string;
  [key: string]: any; // Additional meta fields
}

export interface GridColumnMeta {
  description?: string;
  defaultValue?: any;
  options?: GridSelectOption[] | string[];
  validation?: GridValidationRule[];
  [key: string]: any; // Additional meta fields
}

export interface GridColumnConfig {
  displayAsProgress?: boolean;
  precision?: number;
  currency?: string;
  dateFormat?: string;
  timeFormat?: string;
  options?: string[];
  [key: string]: any; // Additional config fields
}

export interface GridSelectOption {
  id: string;
  value: string;
  label: string;
  color?: string;
}

export interface GridValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'range';
  value?: any;
  message?: string;
}

export interface AttachmentFile {
  name: string;
  url: string;
  type: string;
  size: number;
  file?: File; // Store the actual File object for API calls
}

export type GridFieldType =
  | FieldType
  | FieldRendererType
  | 'checkbox'
  | 'password';

export interface GridData {
  table: GridTable;
  columns: GridColumn[];
  records: GridRecord[];
  totalCount?: number;
  hasMore?: boolean;
}

export interface GridViewConfigBase {
  filters: GridFilter[];
  sorts: GridSort[];
  groupBy: GridGroupBy | null;
  columnVisibility: Record<string, boolean>;
  columnWidths: Record<string, number>;
  pageSize: number;
}

export interface GridState extends GridViewConfigBase {
  // View state
  selectedRecords: Set<string>;
  editingCell: GridCellPosition | null;
  loading: boolean;
  error: string | null;
  
  // Filter state
  quickFilter: string;
  
  // Group state
  expandedGroups: Set<string>;
  
  // Pagination state
  page: number;
}

export interface GridCellPosition {
  recordId: string;
  columnKey: string;
}

export interface GridFilter {
  id: string;
  columnKey: string;
  operator: GridFilterOperator;
  value: any;
  condition?: 'and' | 'or';
}

export type GridFilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'between'
  | 'in'
  | 'notIn';

export interface GridSort {
  columnKey: string;
  direction: 'asc' | 'desc';
  priority: number;
}

export interface GridGroupBy {
  columnKey: string;
  direction: 'asc' | 'desc';
}

// Legacy type aliases for backward compatibility
export type ColumnConfig = GridColumn;
export type TableData = GridRecord;

// Simplified filter and sort states for Table components
export interface FilterState {
  [columnKey: string]: string[];
}

export interface SortState {
  column: string | null;
  direction: 'asc' | 'desc';
}

export interface GridViewConfig extends GridViewConfigBase {
  id?: string;
  name: string;
  type: 'grid';
}

// API Response types
export interface GridApiResponse {
  data: {
    model: any;
    columns: any[];
    records: any[];
  };
  meta?: {
    totalCount: number;
    hasMore: boolean;
    page: number;
    pageSize: number;
  };
}

// Action types for grid operations
export interface GridActions {
  // Record operations
  createRecord: (data: Record<string, any>) => Promise<GridRecord>;
  updateRecord: (recordId: string, data: Record<string, any>) => Promise<GridRecord>;
  deleteRecord: (recordId: string) => Promise<void>;
  duplicateRecord: (recordId: string) => Promise<GridRecord>;
  
  // Column operations
  createColumn: (column: Partial<GridColumn>) => Promise<GridColumn>;
  updateColumn: (columnId: string, updates: Partial<GridColumn>) => Promise<GridColumn>;
  deleteColumn: (columnId: string) => Promise<void>;
  reorderColumns: (columnIds: string[]) => Promise<void>;
  
  // View operations
  updateView: (config: Partial<GridViewConfig>) => Promise<void>;
  resetView: () => Promise<void>;
  
  // Selection operations
  selectRecord: (recordId: string) => void;
  selectAllRecords: () => void;
  clearSelection: () => void;
  
  // UI operations
  startCellEdit: (position: GridCellPosition) => void;
  cancelCellEdit: () => void;
  commitCellEdit: (value: any) => Promise<void>;
  
  // Data operations
  refreshData: () => Promise<void>;
  loadMore: () => Promise<void>;
}

// Event types
export interface GridEvents {
  onRecordCreate?: (record: GridRecord) => void;
  onRecordUpdate?: (record: GridRecord, changes: Record<string, any>) => void;
  onRecordDelete?: (recordId: string) => void;
  onColumnCreate?: (column: GridColumn) => void;
  onColumnUpdate?: (column: GridColumn, changes: Partial<GridColumn>) => void;
  onColumnDelete?: (columnId: string) => void;
  onViewChange?: (config: GridViewConfig) => void;
  onSelectionChange?: (selectedRecords: Set<string>) => void;
  onError?: (error: Error) => void;
}

export interface GridProps extends GridEvents {
  tableId: string;
  viewId?: string;
  viewConfig?: GridViewConfig;
  readonly?: boolean;
  height?: number | string;
  className?: string;
}
