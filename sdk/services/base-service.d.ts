import { HttpClient } from '../client/http-client';
import * as types from '../types/base';
export declare class BaseService {
    private http;
    constructor(http: HttpClient);
    /**
     * Create new base (database)
     * POST /base/create
     */
    create(params: types.CreateBase): Promise<import("..").StandardResponse<any>>;
    /**
     * Get base by ID
     * GET /base/:id
     */
    getById(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Update base
     * PUT /base/:id
     */
    update(id: string, params: types.UpdateBase): Promise<import("..").StandardResponse<any>>;
    /**
     * Delete base
     * DELETE /base/:id
     */
    delete(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Get all tables in base
     * GET /base/:id/tables
     */
    getTablesByBaseId(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Get all bases
     * GET /base/
     */
    getAll(): Promise<import("..").StandardResponse<any>>;
    /**
     * Get base members
     * GET /base/:id/members
     */
    getMembers(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Get members with role details
     * GET /base/:id/members-with-roles
     */
    getMembersWithRoles(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Add multiple members to base
     * POST /base/:id/bulk-add-members
     */
    bulkAddMembers(id: string, params: types.BulkAddBaseMembersRequest): Promise<import("..").StandardResponse<any>>;
    /**
     * Remove access member from base
     * DELETE /base/:id/access/:id
     */
    removeAccessMember(accessId: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Upload or update base image
     * POST /base/:id/image
     */
    uploadImage(id: string, imageFile: File): Promise<import("..").StandardResponse<any>>;
    /**
     * Delete base image
     * DELETE /base/:id/image
     */
    deleteImage(id: string): Promise<import("..").StandardResponse<any>>;
    /**
       * Remove user from base
       * POST /base/:id/remove
       */
    removeUserFromBase(baseId: string, params: types.RemoveUserFromBase): Promise<import("..").StandardResponse<any>>;
}
//# sourceMappingURL=base-service.d.ts.map