import { AuthService } from './services/auth-service';
import { WorkspaceService } from './services/workspace-service';
import { BaseService } from './services/base-service';
import { TableService } from './services/table-service';
import { ClientConfig } from './types';
import { UserService } from './services/user-service';
import { AssetService } from './services/asset-service';
import { OrganizationService } from './services/organization-service';
export declare class SereniBaseClient {
    private http;
    readonly auth: AuthService;
    readonly workspace: WorkspaceService;
    readonly baseService: BaseService;
    readonly tableService: TableService;
    readonly userService: UserService;
    readonly assetService: AssetService;
    readonly organization: OrganizationService;
    constructor(config: ClientConfig);
    /**
     * Set authentication token
     */
    setAuth(token: string): void;
    /**
     * Set custom headers for all HTTP requests
     */
    setHeaders(headers: Record<string, string>): void;
    /**
     * Clear authentication
     */
    clearAuth(): void;
    /**
     * Update client configuration
     */
    updateConfig(config: Partial<ClientConfig>): void;
    /**
     * Listen to HTTP events
     */
    on(event: string, listener: (...args: any[]) => void): void;
    /**
     * Remove HTTP event listener
     */
    off(event: string, listener: (...args: any[]) => void): void;
}
export * from './types';
export * from './client/http-client';
export * from './services/auth-service';
export default SereniBaseClient;
//# sourceMappingURL=index.d.ts.map