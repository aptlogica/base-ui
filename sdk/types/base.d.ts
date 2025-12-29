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
    members: Array<{
        user_id: string;
        role: string;
        access_level?: string;
    }>;
}
//# sourceMappingURL=base.d.ts.map