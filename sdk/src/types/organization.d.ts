/**
 * Organization Types
 */
export interface OrganizationResponse {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    status: string;
    created_at: string;
    updated_at: string;
}
export interface OrganizationListResponse extends OrganizationResponse {
}
export interface OrganizationUpdateRequest {
    name?: string;
    slug?: string;
    description?: string;
    logo_url?: string;
    status?: string;
}
//# sourceMappingURL=organization.d.ts.map