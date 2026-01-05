export interface TableModel {
  id: string;
  title: string;
  base_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface TableColumn {
  id: string;
  column_name: string;
  title: string;
  uidt: string;
  dt: string;
  order_index: number;
  position: number;
  system: boolean;
  hidden: boolean;
  is_hidden: boolean;
  required: boolean;
  description?: string;
  meta?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface TableRecord {
  id: string;
  [key: string]: any;
  created_at?: string;
  updated_at?: string;
}

export interface TableView {
  id: string;
  title: string;
  type: string;
  meta?: Record<string, any>;
  config?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface TableData {
  model: TableModel;
  columns: TableColumn[];
  records: TableRecord[];
  views?: TableView[];
}

export interface TableResponse {
  data: TableData;
  success: boolean;
  message?: string;
}
