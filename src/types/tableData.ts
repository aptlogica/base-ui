// Canonical table-data contract used by all views

export interface TableModel {
  id: string;
  base_id?: string;
  workspace_id?: string;
  title?: string;
  alias?: string;
  description?: string;
  meta?: Record<string, any>;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TableColumn {
  id: string;
  model_id?: string;
  base_id?: string;
  column_name: string;
  title?: string;
  uidt?: string;
  dt?: string;
  description?: string;
  meta?: Record<string, any>;
  virtual?: boolean;
  system?: boolean;
  deleted?: boolean;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
}

export type TableRecord = Record<string, any>; // flattened by column_name

export interface TableView {
  id: string;
  model_id?: string;
  base_id?: string;
  title?: string;
  description?: string;
  alias?: string;
  type?: string;
  meta?: Record<string, any>;
  order_index?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface TableData {
  model: TableModel;
  columns: TableColumn[];
  records: TableRecord[]; // flattened objects keyed by column_name
  view?: TableView;
  views?: TableView[];
}
