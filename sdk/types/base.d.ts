export interface CreateBase {
    title: string;
    description: string;
    workspace_id: string;
}
export interface UpdateBase {
    title?: string;
    description?: string;
    type?: string;
    config?: any;
    settings?: any;
    meta?: any;
    status?: string;
    visibility?: string;
    table_count?: number;
    row_count?: number;
    storage_used_bytes?: number;
    updated_at?: string;
}
//# sourceMappingURL=base.d.ts.map