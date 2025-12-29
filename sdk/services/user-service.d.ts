import { HttpClient } from "../client/http-client";
import * as types from "../types/user";
export declare class UserService {
    private http;
    constructor(http: HttpClient);
    /**
     * Get user profile by ID
     * GET /user/profile/:id
     */
    getProfile(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Update user profile
     * PATCH /user/profile/:id
     */
    updateProfile(id: string, params: types.UpdateUserProfileParams): Promise<import("..").StandardResponse<any>>;
    /**
     * Change user password
     * POST /user/change-password/:id
     */
    changePassword(id: string, params: types.ChangePasswordParams): Promise<import("..").StandardResponse<any>>;
    /**
     * Add or update user avatar
     * POST /user/profile/:id/avatar
     */
    addOrUpdateAvatar(id: string, avatarFile: File): Promise<import("..").StandardResponse<any>>;
    /**
     * Remove user avatar
     * DELETE /user/profile/:id/avatar
     */
    removeAvatar(id: string): Promise<import("..").StandardResponse<any>>;
    /**
     * Get all workspaces for current user
     * GET /user/workspaces
     */
    getWorkspaces(): Promise<import("..").StandardResponse<any>>;
    /**
     * Get detailed access information for user
     * GET /user/access-details
     */
    getUserAccessDetails(): Promise<import("..").StandardResponse<types.UserAccessDetailsResponse>>;
    /**
     * Assign user to workspace
     * POST /user/assign
     */
    assignToWorkspace(params: types.AssignToWorkspaceParams): Promise<import("..").StandardResponse<any>>;
    /**
     * Update user access permissions
     * PUT /user/access/update
     */
    updateUserAccess(params: types.UpdateUserAccessParams): Promise<import("..").StandardResponse<any>>;
    /**
     * Add new user
     * POST /user/create
     */
    addUser(userData: types.AddUserRequest): Promise<import("..").StandardResponse<any>>;
    /**
     * Remove/delete user (Tenant Admin)
     * POST /user/remove
     */
    removeUser(params: types.UserRemoveRequest): Promise<import("..").StandardResponse<any>>;
    /**
     * Activate user account (Tenant Admin)
     * POST /user/activate
     */
    activateUser(params: types.UserActivateRequest): Promise<import("..").StandardResponse<any>>;
    /**
     * Deactivate user account (Tenant Admin)
     * POST /user/deactivate
     */
    deactivateUser(params: types.UserDeactivateRequest): Promise<import("..").StandardResponse<any>>;
    /**
     * Get all users in tenant (Tenant Admin)
     * GET /user/list
     */
    listUsers(): Promise<import("..").StandardResponse<any>>;
    /**
     * Get active users available for assignment
     * GET /user/list-for-assign
     */
    listUsersForAssign(): Promise<import("..").StandardResponse<any>>;
    /**
     * Remove user from workspace
     * POST /workspace/:id/remove
     */
    removeFromWorkspace(workspaceId: string, params: types.RemoveUserFromWorkspace): Promise<import("..").StandardResponse<any>>;
}
//# sourceMappingURL=user-service.d.ts.map