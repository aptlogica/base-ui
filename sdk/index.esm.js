import axios from 'axios';
import { EventEmitter } from 'eventemitter3';

class HttpClient extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.client = this.createAxiosInstance();
        this.setupInterceptors();
    }
    createAxiosInstance() {
        return axios.create({
            baseURL: this.config.baseURL,
            timeout: this.config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                ...this.config.headers,
            },
        });
    }
    setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use((config) => {
            // Add authentication
            if (this.config.auth) {
                if (this.config.auth.type === 'bearer' && this.config.auth.token) {
                    config.headers.Authorization = `Bearer ${this.config.auth.token}`;
                }
                else if (this.config.auth.type === 'basic' && this.config.auth.username && this.config.auth.password) {
                    const credentials = btoa(`${this.config.auth.username}:${this.config.auth.password}`);
                    config.headers.Authorization = `Basic ${credentials}`;
                }
            }
            this.emit('request', config);
            return config;
        }, (error) => {
            this.emit('request-error', error);
            return Promise.reject(error);
        });
        // Response interceptor
        this.client.interceptors.response.use((response) => {
            this.emit('response', response);
            return response;
        }, async (error) => {
            var _a;
            this.emit('response-error', error);
            // Auto-retry logic
            if (((_a = this.config.retries) === null || _a === void 0 ? void 0 : _a.enabled) && this.shouldRetry(error)) {
                return this.retryRequest(error);
            }
            return Promise.reject(this.formatError(error));
        });
    }
    shouldRetry(error) {
        const retryableStatuses = [408, 429, 500, 502, 503, 504];
        return error.response && retryableStatuses.includes(error.response.status);
    }
    async retryRequest(error) {
        var _a, _b;
        const maxRetries = ((_a = this.config.retries) === null || _a === void 0 ? void 0 : _a.maxRetries) || 3;
        const retryDelay = ((_b = this.config.retries) === null || _b === void 0 ? void 0 : _b.retryDelay) || 1000;
        const retryCount = error.config.__retryCount || 0;
        if (retryCount >= maxRetries) {
            return Promise.reject(this.formatError(error));
        }
        error.config.__retryCount = retryCount + 1;
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retryCount)));
        return this.client.request(error.config);
    }
    formatError(error) {
        var _a, _b;
        if ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) {
            const errorInfo = error.response.data.error;
            const customError = new Error(errorInfo.message || 'API Error');
            customError.code = errorInfo.code;
            customError.details = errorInfo.details;
            customError.status = error.response.status;
            return customError;
        }
        return error;
    }
    async get(url, config) {
        const response = await this.client.get(url, config);
        return response.data;
    }
    async post(url, data, config) {
        const response = await this.client.post(url, data, config);
        return response.data;
    }
    async put(url, data, config) {
        const response = await this.client.put(url, data, config);
        return response.data;
    }
    async patch(url, data, config) {
        const response = await this.client.patch(url, data, config);
        return response.data;
    }
    async delete(url, config) {
        const response = await this.client.delete(url, config);
        return response.data;
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.client = this.createAxiosInstance();
        this.setupInterceptors();
    }
    setAuthToken(token) {
        this.updateConfig({
            auth: { type: 'bearer', token }
        });
    }
    setHeaders(headers) {
        this.updateConfig({
            headers: {
                ...(this.config.headers || {}),
                ...headers
            }
        });
    }
    clearAuth() {
        this.updateConfig({
            auth: undefined
        });
    }
}

class AuthService {
    constructor(http) {
        this.http = http;
    }
    /**
     * Login with email and password
     * POST /auth/login
     */
    login(params) {
        return this.http.post(`/auth/login`, params);
    }
    /**
     * Verify email with OTP
     * POST /auth/otp/verify
     */
    verifyOtp(params) {
        return this.http.post(`/auth/otp/verify`, params);
    }
    /**
     * Resend OTP
     * POST /auth/otp/resend
     */
    resendOtp(params) {
        return this.http.post(`/auth/otp/resend`, params);
    }
    /**
     * Request password reset
     * POST /auth/forgot-password
     */
    forgotPassword(params) {
        return this.http.post(`/auth/forgot-password`, params);
    }
    /**
     * Reset password with token
     * POST /auth/reset-password
     */
    resetPassword(params) {
        return this.http.post(`/auth/reset-password`, params);
    }
    /**
     * Validate if token is valid
     * POST /auth/validate-token
     */
    validateToken(params) {
        return this.http.post(`/auth/validate-token`, params);
    }
    /**
     * Verify token validity
     * POST /auth/verify-token
     */
    verifyToken(params) {
        return this.http.post(`/auth/verify-token`, params);
    }
    /**
     * Logout and invalidate token
     * POST /auth/logout
     */
    logout(params) {
        return this.http.post(`/auth/logout`, params);
    }
    /**
     * Login with identity provider
     * @deprecated Use OAuth/identity provider flows
     */
    loginByIdentityProvider(provider) {
        return this.http.get(`/auth/login/${provider}`);
    }
    /**
     * Callback for identity provider login
     * @deprecated Use OAuth/identity provider flows
     */
    callback(queryString) {
        return this.http.post(`/auth/callback${queryString}`);
    }
    /**
     * Refresh token
     * @deprecated Use standard refresh token flow
     */
    refreshToken(params) {
        return this.http.post(`/auth/refresh`, params);
    }
    /**
     * Register new user
     * @deprecated Use standard auth flow
     */
    register(params) {
        return this.http.post(`/auth/register`, params);
    }
}

class WorkspaceService {
    constructor(http) {
        this.http = http;
    }
    /**
     * Create new workspace
     * POST /workspace/create
     */
    create(params) {
        return this.http.post(`/workspace/create`, params);
    }
    /**
     * Get all workspaces
     * GET /workspace/
     */
    getAll() {
        return this.http.get(`/workspace/`);
    }
    /**
     * Get workspace by ID
     * GET /workspace/:id
     */
    getById(id) {
        return this.http.get(`/workspace/${id}`);
    }
    /**
     * Update workspace
     * PUT /workspace/:id
     */
    update(id, params) {
        return this.http.put(`/workspace/${id}`, params);
    }
    /**
     * Delete workspace
     * DELETE /workspace/:id
     */
    delete(id) {
        return this.http.delete(`/workspace/${id}`);
    }
    /**
     * Get all tables in workspace
     * GET /workspace/:id/tables
     */
    getTablesByWorkspaceId(id) {
        return this.http.get(`/workspace/${id}/tables`);
    }
    /**
     * Get all bases in workspace
     * GET /workspace/:id/bases
     */
    getBasesByWorkspaceId(id) {
        return this.http.get(`/workspace/${id}/bases`);
    }
    /**
     * Get workspace members
     * GET /workspace/:id/members
     */
    getMembers(workspaceId) {
        return this.http.get(`/workspace/${workspaceId}/members`);
    }
    /**
     * Get members with detailed role information
     * GET /workspace/:id/members-with-roles
     */
    getMembersWithRoles(workspaceId) {
        return this.http.get(`/workspace/${workspaceId}/members-with-roles`);
    }
    /**
     * Remove user from workspace
     * POST /workspace/:id/remove
     */
    removeUserFromWorkspace(workspaceId, params) {
        return this.http.post(`/workspace/${workspaceId}/remove`, params);
    }
    /**
     * Add multiple members to workspace
     * POST /workspace/:id/bulk-add-members
     */
    bulkAddMembers(workspaceId, params) {
        return this.http.post(`/workspace/${workspaceId}/bulk-add-members`, params);
    }
    /**
     * Remove access member from workspace
     * DELETE /workspace/:id/access/:id
     */
    removeAccessMember(workspaceId, accessId) {
        return this.http.delete(`/workspace/${workspaceId}/access/${accessId}`);
    }
    /**
     * Invite multiple users to the workspace (deprecated - use bulkAddMembers)
     * @deprecated Use bulkAddMembers instead
     */
    inviteUser(workspaceId, params) {
        return this.http.post(`/workspace/${workspaceId}/invite`, params);
    }
}

class BaseService {
    constructor(http) {
        this.http = http;
    }
    /**
     * Create new base (database)
     * POST /base/create
     */
    async create(params) {
        const formData = new FormData();
        formData.append('title', params.title);
        if (params.description) {
            formData.append('description', params.description);
        }
        if (params.workspace_id) {
            formData.append('workspace_id', params.workspace_id);
        }
        if (params.image) {
            formData.append('image', params.image);
        }
        return this.http.post(`/base/create`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
    /**
     * Get base by ID
     * GET /base/:id
     */
    getById(id) {
        return this.http.get(`/base/${id}`);
    }
    /**
     * Update base
     * PUT /base/:id
     */
    update(id, params) {
        return this.http.put(`/base/${id}`, params);
    }
    /**
     * Delete base
     * DELETE /base/:id
     */
    delete(id) {
        return this.http.delete(`/base/${id}`);
    }
    /**
     * Get all tables in base
     * GET /base/:id/tables
     */
    getTablesByBaseId(id) {
        return this.http.get(`/base/${id}/tables`);
    }
    /**
     * Get all bases
     * GET /base/
     */
    getAll() {
        return this.http.get(`/base/`);
    }
    /**
     * Get base members
     * GET /base/:id/members
     */
    getMembers(id) {
        return this.http.get(`/base/${id}/members`);
    }
    /**
     * Get members with role details
     * GET /base/:id/members-with-roles
     */
    getMembersWithRoles(id) {
        return this.http.get(`/base/${id}/members-with-roles`);
    }
    /**
     * Add multiple members to base
     * POST /base/:id/bulk-add-members
     */
    bulkAddMembers(id, params) {
        return this.http.post(`/base/${id}/bulk-add-members`, params);
    }
    /**
     * Remove access member from base
     * DELETE /base/:id/access/:id
     */
    removeAccessMember(baseId, accessId) {
        return this.http.delete(`/base/${baseId}/access/${accessId}`);
    }
    /**
     * Upload or update base image
     * POST /base/:id/image
     */
    uploadImage(id, imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        return this.http.post(`/base/${id}/image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
    /**
     * Delete base image
     * DELETE /base/:id/image
     */
    deleteImage(id) {
        return this.http.delete(`/base/${id}/image`);
    }
}

class TableService {
    constructor(http) {
        this.http = http;
    }
    // ============ TABLE ENDPOINTS ============
    /**
     * Create new table
     * POST /table/create
     */
    create(params) {
        return this.http.post(`/table/create`, params);
    }
    /**
     * Get table by ID
     * GET /table/:id
     */
    getById(id, options) {
        var _a, _b;
        if (options && (options.page !== undefined || options.page_size !== undefined)) {
            const page = (_a = options.page) !== null && _a !== void 0 ? _a : 1;
            const page_size = (_b = options.page_size) !== null && _b !== void 0 ? _b : 30;
            return this.http.get(`/table/${id}?page=${page}&page_size=${page_size}`);
        }
        return this.http.get(`/table/${id}`);
    }
    /**
     * Get all tables
     * GET /table/
     */
    getAll() {
        return this.http.get(`/table/`);
    }
    /**
     * Update table
     * PATCH /table/:id
     */
    update(id, params) {
        return this.http.patch(`/table/${id}`, params);
    }
    /**
     * Delete table
     * DELETE /table/:id
     */
    delete(id) {
        return this.http.delete(`/table/${id}`);
    }
    /**
     * Import table from CSV/file
     * POST /table/import
     */
    import(params, extra) {
        const formData = new FormData();
        formData.append('base_id', params.base_id);
        formData.append('workspace_id', params.workspace_id);
        formData.append('title', params.title);
        formData.append('description', params.description);
        formData.append('order_index', params.order_index.toString());
        if (params.file) {
            formData.append('file', params.file);
        }
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        };
        if (typeof extra === 'function') {
            config.onUploadProgress = extra;
        }
        return this.http.post(`/table/import`, formData, config);
    }
    /**
     * Import AI table
     * POST /table/import/ai
     */
    importAiTable(params) {
        return this.http.post(`/table/import/ai`, params);
    }
    /**
     * Apply AI table import
     * POST /table/import/ai/apply
     */
    applyImportAiTable(params, schema) {
        return this.http.post(`/table/import/ai/apply`, params);
    }
    // ============ COLUMN ENDPOINTS ============
    /**
     * Get all columns in table
     * GET /table/:id/columns
     */
    getColumnsByTableId(id) {
        return this.http.get(`/table/${id}/columns`);
    }
    /**
     * Create new column in table
     * POST /column/create
     */
    addColumn(params) {
        return this.http.post(`/column/create`, params);
    }
    /**
     * Get column by ID
     * GET /column/:id
     */
    getColumnById(id) {
        return this.http.get(`/column/${id}`);
    }
    /**
     * Get all columns
     * GET /column/
     */
    getAllColumns() {
        return this.http.get(`/column/`);
    }
    /**
     * Update column
     * PATCH /column/:id
     */
    updateColumn(id, params) {
        return this.http.patch(`/column/${id}`, params);
    }
    /**
     * Delete column
     * DELETE /column/:id
     */
    deleteColumn(id) {
        return this.http.delete(`/column/${id}`);
    }
    /**
     * Reorder columns in table
     * POST /column/reorder
     */
    reorderColumn(params) {
        return this.http.post(`/column/reorder`, params);
    }
    // ============ ROW ENDPOINTS ============
    /**
     * Get all records in table
     * GET /table/:id/records
     */
    getAllRecords(id, options) {
        var _a, _b;
        const page = (_a = options === null || options === void 0 ? void 0 : options.page) !== null && _a !== void 0 ? _a : 1;
        const page_size = (_b = options === null || options === void 0 ? void 0 : options.page_size) !== null && _b !== void 0 ? _b : 30;
        return this.http.get(`/table/${id}/records?page=${page}&page_size=${page_size}`);
    }
    /**
     * Create new record/row
     * POST /row/create
     */
    createRow(params) {
        return this.http.post(`/row/create`, params);
    }
    /**
     * Delete row(s)
     * POST /row/remove
     */
    deleteRow(params) {
        return this.http.post(`/row/remove`, params);
    }
    /**
     * Insert row data
     * POST /row/data/insert
     */
    insertRowData(params) {
        return this.http.post(`/row/data/insert`, params);
    }
    /**
     * Insert relationship/link data between rows
     * POST /row/data/relation
     */
    insertRelationData(params) {
        return this.http.post(`/row/data/relation`, params);
    }
    /**
     * Add attachment to row
     * POST /row/attachment/add
     */
    addAttachment(params, extra) {
        const formData = new FormData();
        formData.append('model_id', params.model_id);
        formData.append('column_id', params.column_id);
        if (Array.isArray(params.files)) {
            params.files.forEach((file) => {
                formData.append('files', file);
            });
        }
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        };
        if (typeof extra === 'function') {
            config.onUploadProgress = extra;
        }
        return this.http.post(`/row/attachment/add`, formData, config);
    }
    /**
     * Remove attachment from row
     * POST /row/attachment/remove
     */
    removeAttachments(params) {
        return this.http.post(`/row/attachment/remove`, params);
    }
    // ============ VIEW ENDPOINTS ============
    /**
     * Get all views for table
     * GET /table/:id/views
     */
    getViewsByModelId(id) {
        return this.http.get(`/table/${id}/views`);
    }
    /**
     * Create view of table data
     * POST /view/create
     */
    createView(params) {
        return this.http.post(`/view/create`, params);
    }
    /**
     * Get view by ID
     * GET /view/:id
     */
    getViewById(id) {
        return this.http.get(`/view/${id}`);
    }
    /**
     * Get all views
     * GET /view/
     */
    getAllViews() {
        return this.http.get(`/view/`);
    }
    /**
     * Update view
     * PATCH /view/:id
     */
    updateView(id, params) {
        return this.http.patch(`/view/${id}`, params);
    }
    /**
     * Delete view
     * DELETE /view/:id
     */
    deleteView(id) {
        return this.http.delete(`/view/${id}`);
    }
    // ============ ASSET ENDPOINTS ============
    /**
     * Get multiple assets by IDs
     * POST /asset/bulk
     */
    getBulkAssets(params) {
        return this.http.post(`/asset/bulk`, params);
    }
    /**
     * Update asset metadata
     * PATCH /asset/:id
     */
    updateAssetById(id, params) {
        return this.http.patch(`/asset/${id}`, params);
    }
    /**
     * Delete asset
     * DELETE /asset/:id
     */
    deleteAssetById(id) {
        return this.http.delete(`/asset/${id}`);
    }
}

class UserService {
    constructor(http) {
        this.http = http;
    }
    /**
     * Get user profile by ID
     * GET /user/profile/:id
     */
    getProfile(id) {
        return this.http.get(`/user/profile/${id}`);
    }
    /**
     * Update user profile
     * PATCH /user/profile/:id
     */
    updateProfile(id, params) {
        return this.http.patch(`/user/profile/${id}`, params);
    }
    /**
     * Change user password
     * POST /user/change-password/:id
     */
    changePassword(id, params) {
        return this.http.post(`/user/change-password/${id}`, params);
    }
    /**
     * Add or update user avatar
     * POST /user/profile/:id/avatar
     */
    addOrUpdateAvatar(id, avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        return this.http.post(`/user/profile/${id}/avatar`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    }
    /**
     * Remove user avatar
     * DELETE /user/profile/:id/avatar
     */
    removeAvatar(id) {
        return this.http.delete(`/user/profile/${id}/avatar`);
    }
    /**
     * Get all workspaces for current user
     * GET /user/workspaces
     */
    getWorkspaces() {
        return this.http.get(`/user/workspaces`);
    }
    /**
     * Get detailed access information for user
     * GET /user/access-details
     */
    getUserAccessDetails() {
        return this.http.get(`/user/access-details`);
    }
    /**
     * Get user roles and access
     * GET /user/roles-and-access
     */
    getUserRolesAndAccess(id) {
        return this.http.get(`/user/roles-and-access/${id}`);
    }
    /**
     * Assign user to workspace
     * POST /user/assign
     */
    assignToWorkspace(params) {
        return this.http.post(`/user/assign`, params);
    }
    /**
     * Update user access permissions
     * PUT /user/access/update
     */
    updateUserAccess(params) {
        return this.http.put(`/user/access/update`, params);
    }
    /**
     * Add new user
     * POST /user/create
     */
    async addUser(userData) {
        const formData = new FormData();
        formData.append('email', userData.email);
        formData.append('firstname', userData.firstname);
        formData.append('lastname', userData.lastname);
        if (userData.profile_pic) {
            formData.append('profile_pic', userData.profile_pic);
        }
        if (userData.is_coowner !== undefined) {
            formData.append('is_coowner', String(userData.is_coowner));
        }
        if (userData.membership) {
            formData.append('membership', JSON.stringify(userData.membership));
        }
        return this.http.post(`/user/create`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
    /**
     * Remove/delete user (Tenant Admin)
     * POST /user/remove
     */
    removeUser(params) {
        return this.http.post(`/user/remove`, params);
    }
    /**
     * Activate user account (Tenant Admin)
     * POST /user/activate
     */
    activateUser(params) {
        return this.http.post(`/user/activate`, params);
    }
    /**
     * Deactivate user account (Tenant Admin)
     * POST /user/deactivate
     */
    deactivateUser(params) {
        return this.http.post(`/user/deactivate`, params);
    }
    /**
     * Get all users in tenant (Tenant Admin)
     * GET /user/list
     */
    listUsers() {
        return this.http.get(`/user/list`);
    }
    /**
     * Get active users available for assignment
     * GET /user/list-for-assign
     */
    listUsersForAssign() {
        return this.http.get(`/user/list-for-assign`);
    }
    /**
     * Remove user from workspace
     * POST /workspace/:id/remove
     */
    removeFromWorkspace(workspaceId, params) {
        return this.http.post(`/workspace/${workspaceId}/remove`, params);
    }
}

class AssetService {
    constructor(http) {
        this.http = http;
    }
    /**
     * Upload assets/files
     * POST /asset/upload
     */
    upload(files, description, tags, extra) {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });
        if (description) {
            formData.append('description', description);
        }
        if (tags && tags.length > 0) {
            formData.append('tags', JSON.stringify(tags));
        }
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        };
        if (typeof extra === 'function') {
            config.onUploadProgress = extra;
        }
        return this.http.post(`/asset/upload`, formData, config);
    }
    /**
     * Upload single image (optimized)
     * POST /asset/upload-image
     */
    uploadImage(file, optimize, extra) {
        const formData = new FormData();
        formData.append('file', file);
        if (optimize !== undefined) {
            formData.append('optimize', String(optimize));
        }
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        };
        if (typeof extra === 'function') {
            config.onUploadProgress = extra;
        }
        return this.http.post(`/asset/upload-image`, formData, config);
    }
    /**
     * Get multiple assets by IDs
     * POST /asset/bulk
     */
    getBulk(params) {
        return this.http.post(`/asset/bulk`, params);
    }
    /**
     * Update asset metadata
     * PATCH /asset/:id
     */
    updateById(id, params) {
        return this.http.patch(`/asset/${id}`, params);
    }
    /**
     * Delete asset
     * DELETE /asset/:id
     */
    deleteById(id) {
        return this.http.delete(`/asset/${id}`);
    }
}

class OrganizationService {
    constructor(http) {
        this.http = http;
    }
    /**
     * Get all organizations (user is member of)
     * GET /organization
     */
    getAll() {
        return this.http.get(`/organization`);
    }
    /**
     * Get organization by ID
     * GET /organization/:id
     */
    getById(id) {
        return this.http.get(`/organization/${id}`);
    }
    /**
     * Update organization
     * PUT /organization/:id
     */
    update(id, params) {
        return this.http.put(`/organization/${id}`, params);
    }
}

class SereniBaseClient {
    constructor(config) {
        this.http = new HttpClient(config);
        // Initialize services
        this.auth = new AuthService(this.http);
        this.workspace = new WorkspaceService(this.http);
        this.baseService = new BaseService(this.http);
        this.tableService = new TableService(this.http);
        this.userService = new UserService(this.http);
        this.assetService = new AssetService(this.http);
        this.organization = new OrganizationService(this.http);
    }
    /**
     * Set authentication token
     */
    setAuth(token) {
        this.http.setAuthToken(token);
    }
    /**
     * Set custom headers for all HTTP requests
     */
    setHeaders(headers) {
        this.http.setHeaders(headers);
    }
    /**
     * Clear authentication
     */
    clearAuth() {
        this.http.clearAuth();
    }
    /**
     * Update client configuration
     */
    updateConfig(config) {
        this.http.updateConfig(config);
    }
    /**
     * Listen to HTTP events
     */
    on(event, listener) {
        this.http.on(event, listener);
    }
    /**
     * Remove HTTP event listener
     */
    off(event, listener) {
        this.http.off(event, listener);
    }
}

export { AuthService, HttpClient, SereniBaseClient, SereniBaseClient as default };
//# sourceMappingURL=index.esm.js.map
