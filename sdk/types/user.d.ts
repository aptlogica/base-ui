export interface UpdateUserProfileParams {
    first_name?: string;
    last_name?: string;
    display_name?: string;
    activity_data?: any;
}
export interface ChangePasswordParams {
    old_password: string;
    new_password: string;
}
export interface AssignToWorkspaceParams {
    user_id: string;
    membership: MembershipRequest[];
}
export interface MembershipRequest {
    workspace_id: string;
    role: string;
    bases?: BaseMembership[];
}
export interface BaseMembership {
    base_id: string;
    role: string;
}
export interface RemoveUserFromWorkspace {
    workspace_id: string;
    user_id: string;
}
export interface BaseAccessInfo {
    id: string;
    title: string;
}
export interface WorkspaceAccessInfo {
    id: string;
    title: string;
    access_level: string;
    bases: BaseAccessInfo[];
}
export interface UserAccessDetailsResponse {
    workspaces: WorkspaceAccessInfo[];
}
//# sourceMappingURL=user.d.ts.map