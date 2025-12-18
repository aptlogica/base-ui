import { AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'eventemitter3';

interface ClientConfig {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
    auth?: {
        type: 'bearer' | 'basic';
        token?: string;
        username?: string;
        password?: string;
    };
    cache?: {
        enabled: boolean;
        ttl?: number;
    };
    retries?: {
        enabled: boolean;
        maxRetries?: number;
        retryDelay?: number;
    };
}
interface StandardResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: ErrorInfo;
    meta?: any;
}
interface ErrorInfo {
    code: string;
    message: string;
    details?: string;
}
interface PaginationParams {
    page?: number;
    limit?: number;
    offset?: number;
}
interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        offset: number;
        total?: number;
    };
    meta?: {
        total_pages?: number;
        has_next: boolean;
        has_previous: boolean;
        next_page?: number;
        previous_page?: number;
    };
}

declare class HttpClient extends EventEmitter {
    private client;
    private config;
    constructor(config: ClientConfig);
    private createAxiosInstance;
    private setupInterceptors;
    private shouldRetry;
    private retryRequest;
    private formatError;
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<StandardResponse<T>>;
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<StandardResponse<T>>;
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<StandardResponse<T>>;
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<StandardResponse<T>>;
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<StandardResponse<T>>;
    updateConfig(newConfig: Partial<ClientConfig>): void;
    setAuthToken(token: string): void;
    setHeaders(headers: Record<string, string>): void;
    clearAuth(): void;
}

interface LoginParams {
    email: string;
    password: string;
}
interface RegisterParams {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
}
interface VerifyOtpParams {
    token: string;
    otp: string;
}
interface RefreshTokenParams {
    refresh_token: string;
}
interface ResendOtpParams {
    token: string;
}
interface ResetPasswordParams {
    token: string;
    new_password: string;
}
interface ForgotPasswordParams {
    email: string;
}
interface LogoutParams {
    token: string;
}

declare class AuthService {
    private http;
    constructor(http: HttpClient);
    register(params: RegisterParams): Promise<StandardResponse<any>>;
    login(params: LoginParams): Promise<StandardResponse<any>>;
    refreshToken(params: RefreshTokenParams): Promise<StandardResponse<any>>;
    verifyOtp(params: VerifyOtpParams): Promise<StandardResponse<any>>;
    resendOtp(params: ResendOtpParams): Promise<StandardResponse<any>>;
    resetPassword(params: ResetPasswordParams): Promise<StandardResponse<any>>;
    forgotPassword(params: ForgotPasswordParams): Promise<StandardResponse<any>>;
    loginByIdentityProvider(provider: string): Promise<StandardResponse<any>>;
    logout(params: LogoutParams): Promise<StandardResponse<any>>;
    callback(queryString: string): Promise<StandardResponse<any>>;
}

interface CreateWorkspace {
    title: string;
    description: string;
}
interface UpdateWorkspace {
    title?: string;
    description?: string;
    slug?: string;
    settings?: any;
    is_default?: boolean;
    status?: string;
    updated_at?: string;
}
interface RemoveUserFromWorkspace$1 {
    workspace_id: string;
    user_id: string;
}
interface InviteMultipleUsers {
    workspace_id: string;
    user_ids: string[];
    access_level: "full_access" | "limited_access";
    bases_ids?: string;
}
interface MemberAddSuccess {
    user_id: string;
}
interface MemberAddFailure {
    user_id: string;
    error: string;
}
interface InviteMultipleUsersResponse {
    success_count: number;
    failure_count: number;
    successes: MemberAddSuccess[];
    failures: MemberAddFailure[];
}

declare class WorkspaceService {
    private http;
    constructor(http: HttpClient);
    create(params: CreateWorkspace): Promise<StandardResponse<any>>;
    getAll(): Promise<StandardResponse<any>>;
    getById(id: string): Promise<StandardResponse<any>>;
    getTablesByWorkspaceId(id: string): Promise<StandardResponse<any>>;
    update(id: string, params: UpdateWorkspace): Promise<StandardResponse<any>>;
    delete(id: string): Promise<StandardResponse<any>>;
    getBasesByWorkspaceId(id: string): Promise<StandardResponse<any>>;
    inviteUser(workspaceId: string, params: InviteMultipleUsers): Promise<StandardResponse<InviteMultipleUsersResponse>>;
    removeUserFromWorkspace(workspaceId: string, params: RemoveUserFromWorkspace$1): Promise<StandardResponse<any>>;
    getMembers(workspaceId: string): Promise<StandardResponse<any>>;
}

interface CreateBase {
    title: string;
    description: string;
    workspace_id: string;
}
interface UpdateBase {
    title?: string;
    description?: string;
    type?: string;
    config?: any;
    settings?: any;
    meta?: any;
    status?: string;
    visibility?: string;
    table_count?: number;
    row_count?: number;
    storage_used_bytes?: number;
    updated_at?: string;
}

declare class BaseService {
    private http;
    constructor(http: HttpClient);
    create(params: CreateBase): Promise<StandardResponse<any>>;
    getById(id: string): Promise<StandardResponse<any>>;
    getTablesByBaseId(id: string): Promise<StandardResponse<any>>;
    getAll(): Promise<StandardResponse<any>>;
    update(id: string, params: UpdateBase): Promise<StandardResponse<any>>;
    delete(id: string): Promise<StandardResponse<any>>;
    getMembers(id: string): Promise<StandardResponse<any>>;
}

interface CreateTable {
    base_id: string;
    workspace_id: string;
    title: string;
    description?: string;
    order_index?: number;
}
interface UpdateTable {
    title?: string;
    meta?: any;
    description?: string;
    updated_at?: string;
}
interface AddColumn {
    model_id: string;
    base_id: string;
    title: string;
    meta: Record<string, any>;
    description: string;
    uidt: string;
    order_index: number;
}
interface UpdateColumn {
    title?: string;
    description?: string;
    meta?: Record<string, any>;
    uidt?: string;
    virtual?: boolean;
    system?: boolean;
    deleted?: boolean;
    order_index?: number;
    updated_at?: string;
}
interface ReorderColumn {
    source_column_id: string;
    target_column_id: string;
}
interface CreateRow {
    model_id: string;
}
interface InsertRowData {
    model_id: string;
    column_id: string;
    row_id: number;
    value: any;
}
interface InsertRelationData {
    model_id: string;
    column_id: string;
    source_row_id: number;
    target_row_id: number;
    action: 'link' | 'unlink';
}
interface AddAttachments {
    model_id: string;
    column_id: string;
    row_id: number;
    files: File[];
}
interface RemoveAttachments {
    model_id: string;
    column_id: string;
    row_id: number;
    attachments: string[];
}
interface DeleteRow {
    model_id: string;
    row_id: number;
}
interface CreateView {
    model_id: string;
    title: string;
    description?: string;
    meta: Record<string, any>;
    type: string;
}
interface UpdateView {
    view_id: string;
    title?: string;
    description?: string;
    type?: string;
    updated_at?: string;
}
interface GetBulkAssets {
    ids: string[];
}
interface UpdateAsset {
    title?: string;
}
interface AddImage {
    files: File[];
}
interface ImportTable {
    base_id: string;
    workspace_id: string;
    title: string;
    description: string;
    order_index: number;
    file: File;
}

declare class TableService {
    private http;
    constructor(http: HttpClient);
    create(params: CreateTable): Promise<StandardResponse<any>>;
    update(id: string, params: UpdateTable): Promise<StandardResponse<any>>;
    getById(id: string, options?: {
        pageNumber?: number;
        pageLimit?: number;
    }): Promise<StandardResponse<any>>;
    getAll(): Promise<StandardResponse<any>>;
    getColumnsByTableId(id: string): Promise<StandardResponse<any>>;
    getViewsByModelId(id: string): Promise<StandardResponse<any>>;
    getAllRecords(id: string, options?: {
        pageNumber?: number;
        pageLimit?: number;
    }): Promise<StandardResponse<any>>;
    delete(id: string): Promise<StandardResponse<any>>;
    addColumn(params: AddColumn): Promise<StandardResponse<any>>;
    getColumnById(id: string): Promise<StandardResponse<any>>;
    getAllColumns(): Promise<StandardResponse<any>>;
    updateColumn(id: string, params: UpdateColumn): Promise<StandardResponse<any>>;
    deleteColumn(id: string): Promise<StandardResponse<any>>;
    reorderColumn(params: ReorderColumn): Promise<StandardResponse<any>>;
    createRow(params: CreateRow): Promise<StandardResponse<any>>;
    insertRowData(params: InsertRowData): Promise<StandardResponse<any>>;
    insertRelationData(params: InsertRelationData): Promise<StandardResponse<any>>;
    addAttachment(params: AddAttachments, extra?: (progressEvent: ProgressEvent) => void): Promise<StandardResponse<any>>;
    removeAttachments(params: RemoveAttachments): Promise<StandardResponse<any>>;
    deleteRow(params: DeleteRow): Promise<StandardResponse<any>>;
    createView(params: CreateView): Promise<StandardResponse<any>>;
    getViewById(id: string): Promise<StandardResponse<any>>;
    getAllViews(): Promise<StandardResponse<any>>;
    updateView(id: string, params: UpdateView): Promise<StandardResponse<any>>;
    deleteView(id: string): Promise<StandardResponse<any>>;
    getBulkAssets(params: GetBulkAssets): Promise<StandardResponse<any>>;
    updateAssetById(id: string, params: UpdateAsset): Promise<StandardResponse<any>>;
    deleteAssetById(id: string): Promise<StandardResponse<any>>;
    import(params: ImportTable, extra?: (progressEvent: ProgressEvent) => void): Promise<StandardResponse<any>>;
}

interface UpdateUserProfileParams {
    first_name?: string;
    last_name?: string;
    display_name?: string;
    activity_data?: any;
}
interface ChangePasswordParams {
    old_password: string;
    new_password: string;
}
interface AssignToWorkspaceParams {
    workspace_id: string;
    user_id: string;
    access_level: string;
    bases_ids: string;
}
interface RemoveUserFromWorkspace {
    workspace_id: string;
    user_id: string;
}
interface BaseAccessInfo {
    id: string;
    title: string;
}
interface WorkspaceAccessInfo {
    id: string;
    title: string;
    access_level: string;
    bases: BaseAccessInfo[];
}
interface UserAccessDetailsResponse {
    workspaces: WorkspaceAccessInfo[];
}

declare class UserService {
    private http;
    constructor(http: HttpClient);
    getProfile(id: string): Promise<StandardResponse<any>>;
    updateProfile(id: string, params: UpdateUserProfileParams): Promise<StandardResponse<any>>;
    changePassword(id: string, params: ChangePasswordParams): Promise<StandardResponse<any>>;
    addOrUpdateAvatar(id: string, avatarFile: File): Promise<StandardResponse<any>>;
    removeAvatar(id: string): Promise<StandardResponse<any>>;
    getWorkspaces(): Promise<StandardResponse<any>>;
    assignToWorkspace(params: AssignToWorkspaceParams): Promise<StandardResponse<any>>;
    removeFromWorkspace(workspaceId: string, params: RemoveUserFromWorkspace): Promise<StandardResponse<any>>;
    getUserAccessDetails(userId: string, workspaceId?: string): Promise<StandardResponse<UserAccessDetailsResponse>>;
}

interface AddUserRequest {
    email: string;
    firstname: string;
    lastname: string;
}
interface UserIDPayload {
    user_id: string;
}
interface UpdateTenant {
    name: string;
}
interface DeactivateUserPayload {
    user_id: string;
}

declare class TenantService {
    private http;
    constructor(http: HttpClient);
    /**
     * Creates a new user under the tenant.
     * Equivalent to POST /tenant/user/create
     */
    addUser(userData: AddUserRequest): Promise<StandardResponse<any>>;
    /**
     * Removes a user from the tenant.
     * Equivalent to POST /tenant/user/remove
     */
    removeUser(userData: UserIDPayload): Promise<StandardResponse<any>>;
    /**
     * activate a user from the tenant.
     * Equivalent to POST /tenant/user/activate
     */
    activateUser(userData: UserIDPayload): Promise<StandardResponse<any>>;
    /**
     * deactivate a user from the tenant.
     * Equivalent to POST /tenant/user/deactivate
     */
    deactivateUser(userData: DeactivateUserPayload): Promise<StandardResponse<any>>;
    /**
     * Retrieves the list of users for the tenant.
     * Equivalent to GET /tenant/users
     */
    getUsers(): Promise<StandardResponse<any>>;
    /**
     * Retrieves the tenant information.
     * Equivalent to GET /tenant
     */
    getTenant(): Promise<StandardResponse<any>>;
    /**
     * Updates tenant information.
     * Equivalent to PATCH /tenant/update
     */
    updateTenant(updateData: UpdateTenant): Promise<StandardResponse<any>>;
}

declare class AssetService {
    private http;
    constructor(http: HttpClient);
    getBulk(params: GetBulkAssets): Promise<StandardResponse<any>>;
    updateById(id: string, params: UpdateAsset): Promise<StandardResponse<any>>;
    deleteById(id: string): Promise<StandardResponse<any>>;
    addImage(params: AddImage, extra?: (progressEvent: ProgressEvent) => void): Promise<StandardResponse<any>>;
}

declare class SereniBaseClient {
    private http;
    readonly auth: AuthService;
    readonly workspace: WorkspaceService;
    readonly baseService: BaseService;
    readonly tableService: TableService;
    readonly userService: UserService;
    readonly tenantService: TenantService;
    readonly assetService: AssetService;
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

export { AuthService, HttpClient, SereniBaseClient, SereniBaseClient as default };
export type { ClientConfig, ErrorInfo, PaginatedResponse, PaginationParams, StandardResponse };
