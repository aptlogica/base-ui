import { MembershipRequest, BaseMembership } from "./user";
export interface CreateBase {
    title: string;
    description?: string;
    workspace_id?: string;
}
export interface UpdateBase {
    title?: string;
    description?: string;
    icon?: string;
    status?: string;
}
export interface BulkAddMembersRequest {
    user_id: string;
    memberships: MembershipRequest[];
}
export interface BulkAddBaseMembersRequest {
    members: BulkBaseMemberRequest[];
}
export interface BulkBaseMemberRequest {
    user_id: string;
    base_role: BaseMembership[];
}
//# sourceMappingURL=base.d.ts.map