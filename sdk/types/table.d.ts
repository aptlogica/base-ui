export interface CreateTable {
    base_id: string;
    workspace_id: string;
    title: string;
    description?: string;
    order_index?: number;
}
export interface UpdateTable {
    title?: string;
    meta?: any;
    description?: string;
    updated_at?: string;
}
export interface AddColumn {
    model_id: string;
    base_id: string;
    title: string;
    meta: Record<string, any>;
    description: string;
    uidt: string;
    order_index: number;
}
export interface UpdateColumn {
    title?: string;
    description?: string;
    meta?: Record<string, any>;
    uidt?: string;
    virtual?: boolean;
    system?: boolean;
    deleted?: boolean;
    order_index?: number;
    updated_at?: string;
}
export interface ReorderColumn {
    source_column_id: string;
    target_column_id: string;
}
export interface CreateRow {
    model_id: string;
}
export interface InsertRowData {
    model_id: string;
    column_id: string;
    row_id: number;
    value: any;
}
export interface InsertRelationData {
    model_id: string;
    column_id: string;
    source_row_id: number;
    target_row_id: number;
    action: 'link' | 'unlink';
}
export interface AddAttachments {
    model_id: string;
    column_id: string;
    row_id: number;
    files: File[];
}
export interface RemoveAttachments {
    model_id: string;
    column_id: string;
    row_id: number;
    attachments: string[];
}
export interface DeleteRow {
    model_id: string;
    row_id: number;
}
export interface CreateView {
    model_id: string;
    title: string;
    description?: string;
    meta: Record<string, any>;
    type: string;
    order_index: number;
}
export interface UpdateView {
    view_id: string;
    title?: string;
    description?: string;
    type?: string;
    updated_at?: string;
}
export interface UploadAsset {
    workspace_id: string;
    file_name: string;
    content_type: string;
    size: number;
}
export interface GetBulkAssets {
    ids: string[];
}
export interface UpdateAsset {
    title?: string;
}
export interface AddImage {
    files: File[];
}
export interface ImportTable {
    base_id: string;
    workspace_id: string;
    title: string;
    description: string;
    order_index: number;
    file: File;
}
export interface ImportAiTable {
    prompt: string;
}
export interface AiTableField {
    name: string;
    type: string;
    constraints?: Record<string, any>;
}
export interface AiTable {
    name: string;
    fields: AiTableField[];
}
export interface ApplyImportAiTable {
    base_id: string;
    workspace_id: string;
    tables: AiTable[];
    sample_data: boolean;
    row: number;
}
//# sourceMappingURL=table.d.ts.map