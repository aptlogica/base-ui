export interface CreateWorkspace {
    title: string;
    description: string;
}
export interface UpdateWorkspace {
    title?: string;
    description?: string;
    slug?: string;
    settings?: any;
    is_default?: boolean;
    status?: string;
    updated_at?: string;
}
export interface InviteUser {
    workspace_id: string;
    user_id: string;
    access_level: string;
    bases_ids: string;
}
export interface RemoveUserFromWorkspace {
    workspace_id: string;
    user_id: string;
}
export interface InviteMultipleUsers {
    workspace_id: string;
    user_ids: string[];
    access_level: "full_access" | "limited_access";
    bases_ids?: string;
}
export interface MemberAddSuccess {
    user_id: string;
}
export interface MemberAddFailure {
    user_id: string;
    error: string;
}
export interface InviteMultipleUsersResponse {
    success_count: number;
    failure_count: number;
    successes: MemberAddSuccess[];
    failures: MemberAddFailure[];
}
//# sourceMappingURL=workspace.d.ts.map