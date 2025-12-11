import { HttpClient } from "../client/http-client";
import type * as types from "../types/tenant";
export declare class TenantService {
    private http;
    constructor(http: HttpClient);
    /**
     * Creates a new user under the tenant.
     * Equivalent to POST /tenant/user/create
     */
    addUser(userData: types.AddUserRequest): Promise<import("..").StandardResponse<any>>;
    /**
     * Removes a user from the tenant.
     * Equivalent to POST /tenant/user/remove
     */
    removeUser(userData: types.UserIDPayload): Promise<import("..").StandardResponse<any>>;
    /**
     * activate a user from the tenant.
     * Equivalent to POST /tenant/user/activate
     */
    activateUser(userData: types.UserIDPayload): Promise<import("..").StandardResponse<any>>;
    /**
     * deactivate a user from the tenant.
     * Equivalent to POST /tenant/user/deactivate
     */
    deactivateUser(userData: types.DeactivateUserPayload): Promise<import("..").StandardResponse<any>>;
    /**
     * Retrieves the list of users for the tenant.
     * Equivalent to GET /tenant/users
     */
    getUsers(): Promise<import("..").StandardResponse<any>>;
    /**
     * Retrieves the tenant information.
     * Equivalent to GET /tenant
     */
    getTenant(): Promise<import("..").StandardResponse<any>>;
    /**
     * Updates tenant information.
     * Equivalent to PATCH /tenant/update
     */
    updateTenant(updateData: types.UpdateTenant): Promise<import("..").StandardResponse<any>>;
}
//# sourceMappingURL=tenant-service.d.ts.map