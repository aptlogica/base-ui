import { HttpClient } from "../client/http-client";
import * as types from "../types/workspace";
export declare class WorkspaceService {
    private http;
    constructor(http: HttpClient);
    create(params: types.CreateWorkspace): Promise<import("..").StandardResponse<any>>;
    getAll(): Promise<import("..").StandardResponse<any>>;
    getById(id: string): Promise<import("..").StandardResponse<any>>;
    getTablesByWorkspaceId(id: string): Promise<import("..").StandardResponse<any>>;
    update(id: string, params: types.UpdateWorkspace): Promise<import("..").StandardResponse<any>>;
    delete(id: string): Promise<import("..").StandardResponse<any>>;
    getBasesByWorkspaceId(id: string): Promise<import("..").StandardResponse<any>>;
    inviteUser(workspaceId: string, params: types.InviteMultipleUsers): Promise<import("..").StandardResponse<types.InviteMultipleUsersResponse>>;
    removeUserFromWorkspace(workspaceId: string, params: types.RemoveUserFromWorkspace): Promise<import("..").StandardResponse<any>>;
    getMembers(workspaceId: string): Promise<import("..").StandardResponse<any>>;
}
//# sourceMappingURL=workspace-service.d.ts.map