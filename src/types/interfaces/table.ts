// sdk-dto.ts

// -------- Tables --------
export interface CreateTable {
    base_id: string;
    workspace_id: string;
    title: string;
    description?: string;
    order_index?: number;
  }
  
  export interface UpdateTable {
    title?: string;
    description?: string;
    updated_at?: string; // ISO date
  }
  
  // -------- Columns --------
  export interface AddColumn {
    model_id: string;
    title: string;
    description?: string;
    data_type: string;
    order_index?: number;
  }
  
  export interface UpdateColumn {
    column_id: string;
    title?: string;
    description?: string;
    data_type?: string;
    updated_at?: string;
  }
  
  // -------- Rows --------
  export interface CreateRow {
    model_id: string;
  }
  
  export interface InsertRowData {
    model_id: string;
    column_id: string;
    row_id: number;
    value: any;
  }
  
  export interface DeleteRow {
    model_id: string;
    row_id: number;
  }
  
  // -------- Views --------
  export interface CreateView {
    model_id: string;
    title: string;
    description?: string;
    type: string;
  }
  
  export interface UpdateView {
    view_id: string;
    title?: string;
    description?: string;
    type?: string;
    updated_at?: string;
  }
  
  // -------- Assets --------
  export interface UploadAsset {
    workspace_id: string;
    file_name: string;
    content_type: string;
    size: number;
  }
  
  export interface GetBulkAssets {
    asset_ids: string[];
  }
  
  export interface UpdateAsset {
    asset_id: string;
    file_name?: string;
    content_type?: string;
    size?: number;
    updated_at?: string;
  }
  