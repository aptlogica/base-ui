
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
    meta: Record<string, any>;
    order_index: number | null;
    created_at: string;
    updated_at: string;
  }
  
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