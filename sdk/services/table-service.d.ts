import { HttpClient } from '../client/http-client';
import * as types from '../types/table';
export declare class TableService {
    private http;
    constructor(http: HttpClient);
    /**
     * Create new table
     * POST /table/create
     */
    create(params: types.CreateTable): Promise<import("..").StandardResponse<any>>;
    /**
     * Get table by ID
     * GET /table/:id
     */
    getById(id: string, options?: {
        page?: number;
        page_size?: number;
    }): Promise<import("..").StandardResponse<any>>;
    /**
     * Get all tables
     * GET /table/
     */
    getAll(): Promise<import("..").StandardResponse<any>>;
    /**
     * Update table
     * PATCH /table/:id
     */
    update(id: string, params: types.UpdateTable): Promise<import("..").StandardResponse<any>>;
    /**
     * Delete table
     * DELETE /table/:id
     */
    delete(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Import table from CSV/file
     * POST /table/import
     */
    import(params: types.ImportTable, extra?: (progressEvent: ProgressEvent) => void): Promise<import("..").StandardResponse<any>>;
    /**
     * Import AI table
     * POST /table/import/ai
     */
    importAiTable(params: types.ImportAiTable): Promise<import("..").StandardResponse<any>>;
    /**
     * Apply AI table import
     * POST /table/import/ai/apply
     */
    applyImportAiTable(params: types.ApplyImportAiTable, schema: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Get all columns in table
     * GET /table/:id/columns
     */
    getColumnsByTableId(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Create new column in table
     * POST /column/create
     */
    addColumn(params: types.AddColumn): Promise<import("..").StandardResponse<any>>;
    /**
     * Get column by ID
     * GET /column/:id
     */
    getColumnById(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Get all columns
     * GET /column/
     */
    getAllColumns(): Promise<import("..").StandardResponse<any>>;
    /**
     * Update column
     * PATCH /column/:id
     */
    updateColumn(id: string, params: types.UpdateColumn): Promise<import("..").StandardResponse<any>>;
    /**
     * Delete column
     * DELETE /column/:id
     */
    deleteColumn(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Reorder columns in table
     * POST /column/reorder
     */
    reorderColumn(params: types.ReorderColumn): Promise<import("..").StandardResponse<any>>;
    /**
     * Get all records in table
     * GET /table/:id/records
     */
    getAllRecords(id: string, options?: {
        page?: number;
        page_size?: number;
    }): Promise<import("..").StandardResponse<any>>;
    /**
     * Create new record/row
     * POST /row/create
     */
    createRow(params: types.CreateRow): Promise<import("..").StandardResponse<any>>;
    /**
     * Delete row(s)
     * POST /row/remove
     */
    deleteRow(params: types.DeleteRow): Promise<import("..").StandardResponse<any>>;
    /**
     * Insert row data
     * POST /row/data/insert
     */
    insertRowData(params: types.InsertRowData): Promise<import("..").StandardResponse<any>>;
    /**
     * Insert relationship/link data between rows
     * POST /row/data/relation
     */
    insertRelationData(params: types.InsertRelationData): Promise<import("..").StandardResponse<any>>;
    /**
     * Add attachment to row
     * POST /row/attachment/add
     */
    addAttachment(params: types.AddAttachments, extra?: (progressEvent: ProgressEvent) => void): Promise<import("..").StandardResponse<any>>;
    /**
     * Remove attachment from row
     * POST /row/attachment/remove
     */
    removeAttachments(params: types.RemoveAttachments): Promise<import("..").StandardResponse<any>>;
    /**
     * Get all views for table
     * GET /table/:id/views
     */
    getViewsByModelId(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Create view of table data
     * POST /view/create
     */
    createView(params: types.CreateView): Promise<import("..").StandardResponse<any>>;
    /**
     * Get view by ID
     * GET /view/:id
     */
    getViewById(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Get all views
     * GET /view/
     */
    getAllViews(): Promise<import("..").StandardResponse<any>>;
    /**
     * Update view
     * PATCH /view/:id
     */
    updateView(id: string, params: types.UpdateView): Promise<import("..").StandardResponse<any>>;
    /**
     * Delete view
     * DELETE /view/:id
     */
    deleteView(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Get multiple assets by IDs
     * POST /asset/bulk
     */
    getBulkAssets(params: types.GetBulkAssets): Promise<import("..").StandardResponse<any>>;
    /**
     * Update asset metadata
     * PATCH /asset/:id
     */
    updateAssetById(id: string, params: types.UpdateAsset): Promise<import("..").StandardResponse<any>>;
    /**
     * Delete asset
     * DELETE /asset/:id
     */
    deleteAssetById(id: string): Promise<import("..").StandardResponse<any>>;
}
//# sourceMappingURL=table-service.d.ts.map