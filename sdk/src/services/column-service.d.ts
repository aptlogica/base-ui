import { HttpClient } from '../client/http-client';
import * as types from '../types/table';
export declare class ColumnService {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * Get all columns in table
     * GET /table/:id/columns
     */
    getColumnsByTableId(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Create new column in table
     * POST /column/create
     */
    create(params: types.AddColumn): Promise<import("..").StandardResponse<any>>;
    /**
     * Get column by ID
     * GET /column/:id
     */
    getById(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Get all columns
     * GET /column/
     */
    getAll(): Promise<import("..").StandardResponse<any>>;
    /**
     * Update column
     * PATCH /column/:id
     */
    update(id: string, params: types.UpdateColumn): Promise<import("..").StandardResponse<any>>;
    /**
     * Delete column
     * DELETE /column/:id
     */
    delete(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Reorder columns in table
     * POST /column/reorder
     */
    reorder(params: types.ReorderColumn): Promise<import("..").StandardResponse<any>>;
}
//# sourceMappingURL=column-service.d.ts.map