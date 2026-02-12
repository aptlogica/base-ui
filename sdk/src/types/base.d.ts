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
    visibility?: string;
    image?: File | Blob;
    removeImage?: boolean;
}
export interface BulkAddMembersRequest {
    user_id: string;
    memberships: MembershipRequest[];
}
export interface BulkAddBaseMembersRequest {
    members: BulkAddMembersRequest[];
}
export interface RemoveUserFromBase {
    user_id: string;
}
//# sourceMappingURL=base.d.ts.map