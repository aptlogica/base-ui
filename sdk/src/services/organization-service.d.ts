import { HttpClient } from "../client/http-client";
import * as types from "../types/organization";
export declare class OrganizationService {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * Get all organizations (user is member of)
     * GET /organization
     */
    getAll(): Promise<import("..").StandardResponse<types.OrganizationListResponse[]>>;
    /**
     * Get organization by ID
     * GET /organization/:id
     */
    getById(id: string): Promise<import("..").StandardResponse<types.OrganizationResponse>>;
    /**
     * Update organization
     * PUT /organization/:id
     */
    update(id: string, params: types.OrganizationUpdateRequest): Promise<import("..").StandardResponse<types.OrganizationResponse>>;
}
//# sourceMappingURL=organization-service.d.ts.map