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
interface ValidateTokenParams {
    token: string;
}
interface VerifyTokenParams {
    token: string;
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
    /**
     * Login with email and password
     * POST /auth/login
     */
    login(params: LoginParams): Promise<StandardResponse<any>>;
    /**
     * Verify email with OTP
     * POST /auth/otp/verify
     */
    verifyOtp(params: VerifyOtpParams): Promise<StandardResponse<any>>;
    /**
     * Resend OTP
     * POST /auth/otp/resend
     */
    resendOtp(params: ResendOtpParams): Promise<StandardResponse<any>>;
    /**
     * Request password reset
     * POST /auth/forgot-password
     */
    forgotPassword(params: ForgotPasswordParams): Promise<StandardResponse<any>>;
    /**
     * Reset password with token
     * POST /auth/reset-password
     */
    resetPassword(params: ResetPasswordParams): Promise<StandardResponse<any>>;
    /**
     * Validate if token is valid
     * POST /auth/validate-token
     */
    validateToken(params: ValidateTokenParams): Promise<StandardResponse<any>>;
    /**
     * Verify token validity
     * POST /auth/verify-token
     */
    verifyToken(params: VerifyTokenParams): Promise<StandardResponse<any>>;
    /**
     * Logout and invalidate token
     * POST /auth/logout
     */
    logout(params: LogoutParams): Promise<StandardResponse<any>>;
    /**
     * Login with identity provider
     * @deprecated Use OAuth/identity provider flows
     */
    loginByIdentityProvider(provider: string): Promise<StandardResponse<any>>;
    /**
     * Callback for identity provider login
     * @deprecated Use OAuth/identity provider flows
     */
    callback(queryString: string): Promise<StandardResponse<any>>;
    /**
     * Refresh token
     * @deprecated Use standard refresh token flow
     */
    refreshToken(params: RefreshTokenParams): Promise<StandardResponse<any>>;
    /**
     * Register new user
     * @deprecated Use standard auth flow
     */
    register(params: RegisterParams): Promise<StandardResponse<any>>;
}

interface CreateWorkspace {
    title: string;
    description?: string;
}
interface UpdateWorkspace {
    title?: string;
    description?: string;
    slug?: string;
    meta?: Record<string, any>;
    is_default?: boolean;
    status?: string;
}
interface RemoveUserFromWorkspace$1 {
    user_id: string;
}
interface InviteMultipleUsers {
    workspace_id: string;
    user_ids: string[];
    access_level: "full_access" | "limited_access";
    bases_ids?: string;
}
interface BulkAddMembersRequest$1 {
    members: Array<{
        user_id: string;
        role: string;
        access_level?: string;
    }>;
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
    /**
     * Create new workspace
     * POST /workspace/create
     */
    create(params: CreateWorkspace): Promise<StandardResponse<any>>;
    /**
     * Get all workspaces
     * GET /workspace/
     */
    getAll(): Promise<StandardResponse<any>>;
    /**
     * Get workspace by ID
     * GET /workspace/:id
     */
    getById(id: string): Promise<StandardResponse<any>>;
    /**
     * Update workspace
     * PUT /workspace/:id
     */
    update(id: string, params: UpdateWorkspace): Promise<StandardResponse<any>>;
    /**
     * Delete workspace
     * DELETE /workspace/:id
     */
    delete(id: string): Promise<StandardResponse<any>>;
    /**
     * Get all tables in workspace
     * GET /workspace/:id/tables
     */
    getTablesByWorkspaceId(id: string): Promise<StandardResponse<any>>;
    /**
     * Get all bases in workspace
     * GET /workspace/:id/bases
     */
    getBasesByWorkspaceId(id: string): Promise<StandardResponse<any>>;
    /**
     * Get workspace members
     * GET /workspace/:id/members
     */
    getMembers(workspaceId: string): Promise<StandardResponse<any>>;
    /**
     * Get members with detailed role information
     * GET /workspace/:id/members-with-roles
     */
    getMembersWithRoles(workspaceId: string): Promise<StandardResponse<any>>;
    /**
     * Remove user from workspace
     * POST /workspace/:id/remove
     */
    removeUserFromWorkspace(workspaceId: string, params: RemoveUserFromWorkspace$1): Promise<StandardResponse<any>>;
    /**
     * Add multiple members to workspace
     * POST /workspace/:id/bulk-add-members
     */
    bulkAddMembers(workspaceId: string, params: BulkAddMembersRequest$1): Promise<StandardResponse<any>>;
    /**
     * Invite multiple users to the workspace (deprecated - use bulkAddMembers)
     * @deprecated Use bulkAddMembers instead
     */
    inviteUser(workspaceId: string, params: InviteMultipleUsers): Promise<StandardResponse<InviteMultipleUsersResponse>>;
}

interface CreateBase {
    title: string;
    description?: string;
    workspace_id?: string;
}
interface UpdateBase {
    title?: string;
    description?: string;
    icon?: string;
    status?: string;
}
interface BulkAddMembersRequest {
    members: Array<{
        user_id: string;
        role: string;
        access_level?: string;
    }>;
}

declare class BaseService {
    private http;
    constructor(http: HttpClient);
    /**
     * Create new base (database)
     * POST /base/create
     */
    create(params: CreateBase): Promise<StandardResponse<any>>;
    /**
     * Get base by ID
     * GET /base/:id
     */
    getById(id: string): Promise<StandardResponse<any>>;
    /**
     * Update base
     * PUT /base/:id
     */
    update(id: string, params: UpdateBase): Promise<StandardResponse<any>>;
    /**
     * Delete base
     * DELETE /base/:id
     */
    delete(id: string): Promise<StandardResponse<any>>;
    /**
     * Get all tables in base
     * GET /base/:id/tables
     */
    getTablesByBaseId(id: string): Promise<StandardResponse<any>>;
    /**
     * Get all bases
     * GET /base/
     */
    getAll(): Promise<StandardResponse<any>>;
    /**
     * Get base members
     * GET /base/:id/members
     */
    getMembers(id: string): Promise<StandardResponse<any>>;
    /**
     * Get members with role details
     * GET /base/:id/members-with-roles
     */
    getMembersWithRoles(id: string): Promise<StandardResponse<any>>;
    /**
     * Add multiple members to base
     * POST /base/:id/bulk-add-members
     */
    bulkAddMembers(id: string, params: BulkAddMembersRequest): Promise<StandardResponse<any>>;
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
    order_index: number;
}
interface UpdateView {
    view_id: string;
    title?: string;
    description?: string;
    type?: string;
    updated_at?: string;
}
interface GetBulkAssets$1 {
    ids: string[];
}
interface UpdateAsset$1 {
    title?: string;
}
interface ImportTable {
    base_id: string;
    workspace_id: string;
    title: string;
    description: string;
    order_index: number;
    file: File;
}
interface ImportAiTable {
    prompt: string;
}
interface AiTableField {
    name: string;
    type: string;
    constraints?: Record<string, any>;
}
interface AiTable {
    name: string;
    fields: AiTableField[];
}
interface ApplyImportAiTable {
    base_id: string;
    workspace_id: string;
    tables: AiTable[];
    sample_data: boolean;
    row: number;
}

declare class TableService {
    private http;
    constructor(http: HttpClient);
    /**
     * Create new table
     * POST /table/create
     */
    create(params: CreateTable): Promise<StandardResponse<any>>;
    /**
     * Get table by ID
     * GET /table/:id
     */
    getById(id: string, options?: {
        page?: number;
        page_size?: number;
    }): Promise<StandardResponse<any>>;
    /**
     * Get all tables
     * GET /table/
     */
    getAll(): Promise<StandardResponse<any>>;
    /**
     * Update table
     * PATCH /table/:id
     */
    update(id: string, params: UpdateTable): Promise<StandardResponse<any>>;
    /**
     * Delete table
     * DELETE /table/:id
     */
    delete(id: string): Promise<StandardResponse<any>>;
    /**
     * Import table from CSV/file
     * POST /table/import
     */
    import(params: ImportTable, extra?: (progressEvent: ProgressEvent) => void): Promise<StandardResponse<any>>;
    /**
     * Import AI table
     * POST /table/import/ai
     */
    importAiTable(params: ImportAiTable): Promise<StandardResponse<any>>;
    /**
     * Apply AI table import
     * POST /table/import/ai/apply
     */
    applyImportAiTable(params: ApplyImportAiTable, schema: string): Promise<StandardResponse<any>>;
    /**
     * Get all columns in table
     * GET /table/:id/columns
     */
    getColumnsByTableId(id: string): Promise<StandardResponse<any>>;
    /**
     * Create new column in table
     * POST /column/create
     */
    addColumn(params: AddColumn): Promise<StandardResponse<any>>;
    /**
     * Get column by ID
     * GET /column/:id
     */
    getColumnById(id: string): Promise<StandardResponse<any>>;
    /**
     * Get all columns
     * GET /column/
     */
    getAllColumns(): Promise<StandardResponse<any>>;
    /**
     * Update column
     * PATCH /column/:id
     */
    updateColumn(id: string, params: UpdateColumn): Promise<StandardResponse<any>>;
    /**
     * Delete column
     * DELETE /column/:id
     */
    deleteColumn(id: string): Promise<StandardResponse<any>>;
    /**
     * Reorder columns in table
     * POST /column/reorder
     */
    reorderColumn(params: ReorderColumn): Promise<StandardResponse<any>>;
    /**
     * Get all records in table
     * GET /table/:id/records
     */
    getAllRecords(id: string, options?: {
        page?: number;
        page_size?: number;
    }): Promise<StandardResponse<any>>;
    /**
     * Create new record/row
     * POST /row/create
     */
    createRow(params: CreateRow): Promise<StandardResponse<any>>;
    /**
     * Delete row(s)
     * POST /row/remove
     */
    deleteRow(params: DeleteRow): Promise<StandardResponse<any>>;
    /**
     * Insert row data
     * POST /row/data/insert
     */
    insertRowData(params: InsertRowData): Promise<StandardResponse<any>>;
    /**
     * Insert relationship/link data between rows
     * POST /row/data/relation
     */
    insertRelationData(params: InsertRelationData): Promise<StandardResponse<any>>;
    /**
     * Add attachment to row
     * POST /row/attachment/add
     */
    addAttachment(params: AddAttachments, extra?: (progressEvent: ProgressEvent) => void): Promise<StandardResponse<any>>;
    /**
     * Remove attachment from row
     * POST /row/attachment/remove
     */
    removeAttachments(params: RemoveAttachments): Promise<StandardResponse<any>>;
    /**
     * Get all views for table
     * GET /table/:id/views
     */
    getViewsByModelId(id: string): Promise<StandardResponse<any>>;
    /**
     * Create view of table data
     * POST /view/create
     */
    createView(params: CreateView): Promise<StandardResponse<any>>;
    /**
     * Get view by ID
     * GET /view/:id
     */
    getViewById(id: string): Promise<StandardResponse<any>>;
    /**
     * Get all views
     * GET /view/
     */
    getAllViews(): Promise<StandardResponse<any>>;
    /**
     * Update view
     * PATCH /view/:id
     */
    updateView(id: string, params: UpdateView): Promise<StandardResponse<any>>;
    /**
     * Delete view
     * DELETE /view/:id
     */
    deleteView(id: string): Promise<StandardResponse<any>>;
    /**
     * Get multiple assets by IDs
     * POST /asset/bulk
     */
    getBulkAssets(params: GetBulkAssets$1): Promise<StandardResponse<any>>;
    /**
     * Update asset metadata
     * PATCH /asset/:id
     */
    updateAssetById(id: string, params: UpdateAsset$1): Promise<StandardResponse<any>>;
    /**
     * Delete asset
     * DELETE /asset/:id
     */
    deleteAssetById(id: string): Promise<StandardResponse<any>>;
}

interface UpdateUserProfileParams {
    first_name?: string;
    last_name?: string;
    display_name?: string;
    dob?: string;
    country?: string;
    timezone?: string;
}
interface ChangePasswordParams {
    current_password: string;
    new_password: string;
}
interface UserCreateRequest {
    email: string;
    first_name: string;
    last_name: string;
    password?: string;
    dob?: string;
    country?: string;
    timezone?: string;
}
interface UserRemoveRequest {
    user_id: string;
}
interface UserActivateRequest {
    user_id: string;
}
interface UserDeactivateRequest {
    user_id: string;
}
interface AssignToWorkspaceParams {
    user_id: string;
    membership: MembershipRequest[];
}
interface UpdateUserAccessParams {
    user_id: string;
    workspace_id: string;
    role: string;
    access_level?: string;
}
interface MembershipRequest {
    workspace_id: string;
    role: string;
    bases?: BaseMembership[];
}
interface BaseMembership {
    base_id: string;
    role: string;
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
    /**
     * Get user profile by ID
     * GET /user/profile/:id
     */
    getProfile(id: string): Promise<StandardResponse<any>>;
    /**
     * Update user profile
     * PATCH /user/profile/:id
     */
    updateProfile(id: string, params: UpdateUserProfileParams): Promise<StandardResponse<any>>;
    /**
     * Change user password
     * POST /user/change-password/:id
     */
    changePassword(id: string, params: ChangePasswordParams): Promise<StandardResponse<any>>;
    /**
     * Add or update user avatar
     * POST /user/profile/:id/avatar
     */
    addOrUpdateAvatar(id: string, avatarFile: File): Promise<StandardResponse<any>>;
    /**
     * Remove user avatar
     * DELETE /user/profile/:id/avatar
     */
    removeAvatar(id: string): Promise<StandardResponse<any>>;
    /**
     * Get all workspaces for current user
     * GET /user/workspaces
     */
    getWorkspaces(): Promise<StandardResponse<any>>;
    /**
     * Get detailed access information for user
     * GET /user/access-details
     */
    getUserAccessDetails(): Promise<StandardResponse<UserAccessDetailsResponse>>;
    /**
     * Assign user to workspace
     * POST /user/assign
     */
    assignToWorkspace(params: AssignToWorkspaceParams): Promise<StandardResponse<any>>;
    /**
     * Update user access permissions
     * PUT /user/access/update
     */
    updateUserAccess(params: UpdateUserAccessParams): Promise<StandardResponse<any>>;
    /**
     * Create new user (Tenant Admin)
     * POST /user/create
     */
    createUser(params: UserCreateRequest): Promise<StandardResponse<any>>;
    /**
     * Remove/delete user (Tenant Admin)
     * POST /user/remove
     */
    removeUser(params: UserRemoveRequest): Promise<StandardResponse<any>>;
    /**
     * Activate user account (Tenant Admin)
     * POST /user/activate
     */
    activateUser(params: UserActivateRequest): Promise<StandardResponse<any>>;
    /**
     * Deactivate user account (Tenant Admin)
     * POST /user/deactivate
     */
    deactivateUser(params: UserDeactivateRequest): Promise<StandardResponse<any>>;
    /**
     * Get all users in tenant (Tenant Admin)
     * GET /user/list
     */
    listUsers(): Promise<StandardResponse<any>>;
    /**
     * Get active users available for assignment
     * GET /user/list-for-assign
     */
    listUsersForAssign(): Promise<StandardResponse<any>>;
    /**
     * Remove user from workspace
     * POST /workspace/:id/remove
     */
    removeFromWorkspace(workspaceId: string, params: RemoveUserFromWorkspace): Promise<StandardResponse<any>>;
}

interface GetBulkAssets {
    asset_ids: string[];
}
interface UpdateAsset {
    filename?: string;
    description?: string;
    tags?: string[];
}

declare class AssetService {
    private http;
    constructor(http: HttpClient);
    /**
     * Upload assets/files
     * POST /asset/upload
     */
    upload(files: File[], description?: string, tags?: string[], extra?: (progressEvent: ProgressEvent) => void): Promise<StandardResponse<any>>;
    /**
     * Upload single image (optimized)
     * POST /asset/upload-image
     */
    uploadImage(file: File, optimize?: boolean, extra?: (progressEvent: ProgressEvent) => void): Promise<StandardResponse<any>>;
    /**
     * Get multiple assets by IDs
     * POST /asset/bulk
     */
    getBulk(params: GetBulkAssets): Promise<StandardResponse<any>>;
    /**
     * Update asset metadata
     * PATCH /asset/:id
     */
    updateById(id: string, params: UpdateAsset): Promise<StandardResponse<any>>;
    /**
     * Delete asset
     * DELETE /asset/:id
     */
    deleteById(id: string): Promise<StandardResponse<any>>;
}

/**
 * Organization Types
 */
interface OrganizationResponse {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    status: string;
    created_at: string;
    updated_at: string;
}
interface OrganizationListResponse extends OrganizationResponse {
}
interface OrganizationUpdateRequest {
    name?: string;
    slug?: string;
    description?: string;
    logo_url?: string;
    status?: string;
}

declare class OrganizationService {
    private http;
    constructor(http: HttpClient);
    /**
     * Get all organizations (user is member of)
     * GET /organization
     */
    getAll(): Promise<StandardResponse<OrganizationListResponse[]>>;
    /**
     * Get organization by ID
     * GET /organization/:id
     */
    getById(id: string): Promise<StandardResponse<OrganizationResponse>>;
    /**
     * Update organization
     * PUT /organization/:id
     */
    update(id: string, params: OrganizationUpdateRequest): Promise<StandardResponse<OrganizationResponse>>;
}

declare class SereniBaseClient {
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

export { AuthService, HttpClient, SereniBaseClient, SereniBaseClient as default };
export type { ClientConfig, ErrorInfo, PaginatedResponse, PaginationParams, StandardResponse };
