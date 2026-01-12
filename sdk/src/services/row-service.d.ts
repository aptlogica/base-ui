import { HttpClient } from '../client/http-client';
import * as types from '../types/table';
export declare class RowService {
    private readonly http;
    constructor(http: HttpClient);
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
    create(params: types.CreateRow): Promise<import("..").StandardResponse<any>>;
    /**
     * Delete row(s)
     * POST /row/remove
     */
    delete(params: types.DeleteRow): Promise<import("..").StandardResponse<any>>;
    /**
     * Bulk delete multiple rows
     * POST /row/bulk-remove
     */
    bulkDelete(params: types.BulkDeleteRow): Promise<import("..").StandardResponse<any>>;
    /**
     * Insert row data
     * POST /row/data/insert
     */
    insertData(params: types.InsertRowData): Promise<import("..").StandardResponse<any>>;
    /**
     * Insert relationship/link data between rows
     * POST /row/data/relation
     */
    insertRelation(params: types.InsertRelationData): Promise<import("..").StandardResponse<any>>;
    /**
     * Add attachment to row
     * POST /row/attachment/add
     */
    addAttachment(params: types.AddAttachments, extra?: (progressEvent: ProgressEvent) => void): Promise<import("..").StandardResponse<any>>;
    /**
     * Remove attachment from row
     * POST /row/attachment/remove
     */
    removeAttachment(params: types.RemoveAttachments): Promise<import("..").StandardResponse<any>>;
}
//# sourceMappingURL=row-service.d.ts.map