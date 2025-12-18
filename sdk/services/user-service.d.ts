import { HttpClient } from "../client/http-client";
import * as types from "../types/user";
export declare class UserService {
    private http;
    constructor(http: HttpClient);
    getProfile(id: string): Promise<import("..").StandardResponse<any>>;
    updateProfile(id: string, params: types.UpdateUserProfileParams): Promise<import("..").StandardResponse<any>>;
    changePassword(id: string, params: types.ChangePasswordParams): Promise<import("..").StandardResponse<any>>;
    addOrUpdateAvatar(id: string, avatarFile: File): Promise<import("..").StandardResponse<any>>;
    removeAvatar(id: string): Promise<import("..").StandardResponse<any>>;
    getWorkspaces(): Promise<import("..").StandardResponse<any>>;
    assignToWorkspace(params: types.AssignToWorkspaceParams): Promise<import("..").StandardResponse<any>>;
    removeFromWorkspace(workspaceId: string, params: types.RemoveUserFromWorkspace): Promise<import("..").StandardResponse<any>>;
    getUserAccessDetails(userId: string, workspaceId?: string): Promise<import("..").StandardResponse<types.UserAccessDetailsResponse>>;
}
//# sourceMappingURL=user-service.d.ts.map