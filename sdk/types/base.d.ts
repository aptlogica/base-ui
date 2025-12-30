import { MembershipRequest } from "./user";
export interface CreateBase {
    title: string;
    description: string;
    workspace_id: string;
    image?: File | Blob;
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
    members: BulkAddMembersRequest[];
}
//# sourceMappingURL=base.d.ts.map