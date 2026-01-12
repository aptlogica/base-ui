import { HttpClient } from "../client/http-client";
import * as types from "../types/workspace";
export declare class WorkspaceService {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * Create new workspace
     * POST /workspace/create
     */
    create(params: types.CreateWorkspace): Promise<import("..").StandardResponse<any>>;
    /**
     * Get all workspaces
     * GET /workspace/
     */
    getAll(): Promise<import("..").StandardResponse<any>>;
    /**
     * Get workspace by ID
     * GET /workspace/:id
     */
    getById(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Update workspace
     * PUT /workspace/:id
     */
    update(id: string, params: types.UpdateWorkspace): Promise<import("..").StandardResponse<any>>;
    /**
     * Delete workspace
     * DELETE /workspace/:id
     */
    delete(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Get all tables in workspace
     * GET /workspace/:id/tables
     */
    getTablesByWorkspaceId(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Get all bases in workspace
     * GET /workspace/:id/bases
     */
    getBasesByWorkspaceId(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Get workspace members
     * GET /workspace/:id/members
     */
    getMembers(workspaceId: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Get members with detailed role information
     * GET /workspace/:id/members-with-roles
     */
    getMembersWithRoles(workspaceId: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Remove user from workspace
     * POST /workspace/:id/remove
     */
    removeUserFromWorkspace(workspaceId: string, params: types.RemoveUserFromWorkspace): Promise<import("..").StandardResponse<any>>;
    /**
     * Add multiple members to workspace
     * POST /workspace/:id/bulk-add-members
     */
    bulkAddMembers(workspaceId: string, params: types.BulkAddMembersRequest): Promise<import("..").StandardResponse<any>>;
    /**
     * Remove access member from workspace
     * DELETE /workspace/:id/access/:id
     */
    removeAccessMember(accessId: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Invite multiple users to the workspace
     * Delegates to bulkAddMembers for better implementation
     */
    inviteUser(workspaceId: string, params: types.InviteMultipleUsers): Promise<import("..").StandardResponse<any>>;
}
//# sourceMappingURL=workspace-service.d.ts.map