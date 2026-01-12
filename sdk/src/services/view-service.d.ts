import { HttpClient } from '../client/http-client';
import * as types from '../types/table';
export declare class ViewService {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * Get all views for table
     * GET /table/:id/views
     */
    getViewsByModelId(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Create view of table data
     * POST /view/create
     */
    create(params: types.CreateView): Promise<import("..").StandardResponse<any>>;
    /**
     * Get view by ID
     * GET /view/:id
     */
    getById(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Get all views
     * GET /view/
     */
    getAll(): Promise<import("..").StandardResponse<any>>;
    /**
     * Update view
     * PATCH /view/:id
     */
    update(id: string, params: types.UpdateView): Promise<import("..").StandardResponse<any>>;
    /**
     * Delete view
     * DELETE /view/:id
     */
    delete(id: string): Promise<import("..").StandardResponse<any>>;
}
//# sourceMappingURL=view-service.d.ts.map