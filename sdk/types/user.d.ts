export interface UpdateUserProfileParams {
    first_name?: string;
    last_name?: string;
    display_name?: string;
    dob?: string;
    country?: string;
    timezone?: string;
}
export interface ChangePasswordParams {
    current_password: string;
    new_password: string;
}
export interface AddUserRequest {
    email: string;
    firstname: string;
    lastname: string;
    profile_pic?: File;
    is_coowner?: boolean;
    membership?: MembershipRequest[];
    locale?: string;
}
export interface EditUserRequest {
    user_id: string;
    firstname?: string;
    lastname?: string;
    profile_pic?: File;
    is_coowner?: boolean;
    membership?: MembershipRequest[];
}
export interface UserCreateRequest {
    email: string;
    first_name: string;
    last_name: string;
    password?: string;
    dob?: string;
    country?: string;
    timezone?: string;
}
export interface UserRemoveRequest {
    user_id: string;
}
export interface UserActivateRequest {
    user_id: string;
}
export interface UserDeactivateRequest {
    user_id: string;
}
export interface AssignToWorkspaceParams {
    user_id: string;
    membership: MembershipRequest[];
}
export interface UpdateUserAccessParams {
    user_id: string;
    workspace_id: string;
    role: string;
    access_level?: string;
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