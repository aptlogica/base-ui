// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
// =========================
// Generic API Response Wrapper
// =========================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    code?: string;
    http_status?: number;
  };
}

// =========================
// Workspace Types
// =========================

export interface Workspace {
  id: string;
  title: string;
  description: string;
  slug: string;
  meta?: Record<string, unknown>;
  is_default: boolean;
  status: string;
  access_level: string;
  created_time: string;
  last_modified_time: string;
  bases?: Base[]; // Include bases when fetched with workspace
}

export type WorkspacesResponse = ApiResponse<Workspace[]>;
export type WorkspaceResponse = ApiResponse<Workspace>;

// =========================
// Base Types
// =========================

export interface Base {
  id: string;
  workspace_id: string;
  title: string;
  description: string;
  image?: string;
  type?: string;
  status?: string;
  meta?: Record<string, unknown>;
  visibility?: string;
  created_by?: string;
  last_modified_by?: string;
  created_time?: string;
  last_modified_time?: string;
  access_level?: string;
  tables?: unknown[] | null;
  name?: string; // alias for title
  logo?: string; // alias for image
}

export type BasesResponse = ApiResponse<Base[]>;
export type BaseResponse = ApiResponse<Base>;

export interface ApplyBaseWithAiField {
  name: string;
  type: string;
  meta?: Record<string, unknown>;
}

export interface ApplyBaseWithAiTable {
  name: string;
  fields: ApplyBaseWithAiField[];
}

export interface ApplyBaseWithAiRelation {
  type: string;
  source_table: string;
  target_table: string;
}

export interface ApplyBaseWithAi {
  base_name: string;
  workspace_id: string;
  sample_data?: boolean;
  tables: ApplyBaseWithAiTable[];
  relations?: ApplyBaseWithAiRelation[];
}

export interface ApplyBaseWithAiResponse {
  base_id: string;
  data: any;
}

// =========================
// Table Types
// =========================

export interface TableResponse {
  success: boolean;
  message: string;
  data: TableData;
  meta: TableMeta;
}

export interface TableData {
  model: Model;
  columns: Column[];
  views: View[];
  records: Record<string, any>[];
}

export interface Model {
  id: string;
  base_id: string;
  workspace_id: string;
  title: string;
  description: string;
  alias: string;
  meta: { [key: string]: any };
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  model_id: string;
  base_id: string;
  column_name: string;
  title: string;
  uidt: string;
  dt: string;
  description: string;
  meta: any;
  virtual: boolean;
  system: boolean;
  deleted: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface TableItem {
  model: Model;
  columns: unknown[] | null;
  views: unknown[] | null;
  records: unknown[] | null;
  id?: string; // Convenience property for model.id
  table_id?: string; // Legacy property
}

export type TablesResponse = ApiResponse<TableItem[]>;

// =========================
// View Types
// =========================

export interface View {
  id: string;
  model_id: string;
  base_id: string;
  title: string;
  description: string;
  alias: string;
  type: string;
  is_default: boolean;
  lock_type: string;
  password: string;
  public: boolean;
  uuid: string;
  meta?: Record<string, unknown>;
  order_index: number | null;
  created_time: string;
  last_modified_time: string;
  created_by?: string;
  last_modified_by?: string;
  // Legacy fields (for backward compatibility)
  created_at?: string;
  updated_at?: string;
}

export type ViewsResponse = ApiResponse<View[]>;
export type ViewResponse = ApiResponse<View>;

export interface TableMeta {
  code: string;
  http_status: number;
}

// Type aliases for easier usage
export type TableModel = Model;
export type TableColumn = Column;
export type TableView = View;

export type ColumnType = Column['uidt'];
export type ViewType = View['type'];

// Known field types from the data
export type KnownUIDT = 
  | 'text'
  | 'number'
  | 'datetime'
  | 'date'
  | 'boolean'
  | 'percent'
  | 'select'
  | 'year';

// Known view types from the data
export type KnownViewType = 
  | 'grid'
  | 'form'
  | 'kanban'
  | 'ganttChart'
  | 'calendar';
