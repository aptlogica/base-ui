export interface AddUserRequest {
    email: string;
    firstname: string;
    lastname: string;
    profile_pic?: File;
    is_coowner?: boolean;
    membership?: MembershipRequest[];
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
export interface UserIDPayload {
    user_id: string;
}
export interface UpdateTenant {
    name: string;
}
export interface DeactivateUserPayload {
    user_id: string;
}
//# sourceMappingURL=tenant.d.ts.map