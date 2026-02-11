import axios from 'axios';
import { EventEmitter } from 'eventemitter3';

function encodeToBase64(value) {
    if (globalThis.Buffer !== undefined) {
        return globalThis.Buffer.from(value, 'utf8').toString('base64');
    }
    if (globalThis.btoa !== undefined) {
        return globalThis.btoa(value);
    }
    throw new Error('No base64 encoder available in this environment.');
}
// Default upload limits (in bytes)
const DEFAULT_MAX_FILE_SIZE = 104857600; // 100MB
const DEFAULT_MAX_BULK_SIZE = 524288000; // 500MB
class HttpClient extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.client = this.createAxiosInstance();
        this.setupInterceptors();
    }
    getUploadConfig(isBulk = false) {
        const limits = this.config.uploadLimits || {};
        const maxSize = isBulk
            ? (limits.maxBulkSize || DEFAULT_MAX_BULK_SIZE)
            : (limits.maxFileSize || DEFAULT_MAX_FILE_SIZE);
        return {
            maxContentLength: maxSize,
            maxBodyLength: maxSize
        };
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
                    console.warn('[DEPRECATED] Basic authentication is deprecated and will be removed in a future version. Please use bearer token authentication instead.');
                    const credentials = encodeToBase64(`${this.config.auth.username}:${this.config.auth.password}`);
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
            throw this.formatError(error);
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
            throw this.formatError(error);
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
                ...this.config.headers,
                ...headers
            }
        });
    }
    clearAuth() {
        this.updateConfig({
            auth: undefined
        });
    }
    getUploadLimits(isBulk = false) {
        return this.getUploadConfig(isBulk);
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
    removeAccessMember(accessId) {
        return this.http.delete(`/workspace/access/${accessId}`);
    }
    /**
     * Invite multiple users to the workspace
     * Delegates to bulkAddMembers for better implementation
     */
    inviteUser(workspaceId, params) {
        const accessRole = params.access_level === 'full_access' ? 'admin' : 'viewer';
        const baseMemberships = params.bases_ids
            ? [{ base_id: params.bases_ids, role: 'editor' }]
            : undefined;
        const bulkParams = {
            members: params.user_ids.map((user_id) => ({
                user_id,
                memberships: [
                    {
                        workspace_id: workspaceId,
                        role: accessRole,
                        bases: baseMemberships,
                    },
                ],
            })),
        };
        return this.bulkAddMembers(workspaceId, bulkParams);
    }
}

// src/browser.ts
var globalObject = function() {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  return window;
}();
var { FormData: FormData$1, Blob, File } = globalObject;

let cachedConstructor = null;
function resolveFormDataConstructor() {
    if (cachedConstructor) {
        return cachedConstructor;
    }
    if ('FormData' in globalThis) {
        cachedConstructor = globalThis.FormData;
        return cachedConstructor;
    }
    cachedConstructor = FormData$1;
    if (!('FormData' in globalThis)) {
        globalThis.FormData = cachedConstructor;
    }
    if (!('File' in globalThis)) {
        globalThis.File = File;
    }
    return cachedConstructor;
}
function createFormData() {
    const FormDataImpl = resolveFormDataConstructor();
    return new FormDataImpl();
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
        const formData = createFormData();
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
        const uploadLimits = this.http.getUploadLimits(false);
        return this.http.post(`/base/create`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            ...uploadLimits
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
    async update(id, params) {
        const formData = createFormData();
        if (params.title !== undefined) {
            formData.append('title', params.title);
        }
        if (params.description !== undefined) {
            formData.append('description', params.description);
        }
        if (params.icon !== undefined) {
            formData.append('icon', params.icon);
        }
        if (params.status !== undefined) {
            formData.append('status', params.status);
        }
        if (params.visibility !== undefined) {
            formData.append('visibility', params.visibility);
        }
        const uploadLimits = this.http.getUploadLimits(false);
        const result = await this.http.put(`/base/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            ...uploadLimits
        });
        // Handle image: add if provided, else remove if requested
        if (params.image) {
            await this.uploadImage(id, params.image);
        }
        else if (params.removeImage) {
            await this.deleteImage(id);
        }
        return result;
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
    removeAccessMember(accessId) {
        return this.http.delete(`/base/access/${accessId}`);
    }
    /**
     * Upload or update base image
     * POST /base/:id/image
     */
    uploadImage(id, imageFile) {
        const formData = createFormData();
        formData.append('image', imageFile);
        return this.http.post(`/base/${id}/image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            // ...uploadLimits
        });
    }
    /**
     * Delete base image
     * DELETE /base/:id/image
     */
    deleteImage(id) {
        return this.http.delete(`/base/${id}/image`);
    }
    /**
       * Remove user from base
       * POST /base/:id/remove
       */
    removeUserFromBase(baseId, params) {
        return this.http.post(`/base/${baseId}/remove`, params);
    }
}

class ColumnService {
    constructor(http) {
        this.http = http;
    }
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
    create(params) {
        return this.http.post(`/column/create`, params);
    }
    /**
     * Get column by ID
     * GET /column/:id
     */
    getById(id) {
        return this.http.get(`/column/${id}`);
    }
    /**
     * Get all columns
     * GET /column/
     */
    getAll() {
        return this.http.get(`/column/`);
    }
    /**
     * Update column
     * PATCH /column/:id
     */
    update(id, params) {
        return this.http.patch(`/column/${id}`, params);
    }
    /**
     * Delete column
     * DELETE /column/:id
     */
    delete(id) {
        return this.http.delete(`/column/${id}`);
    }
    /**
     * Reorder columns in table
     * POST /column/reorder
     */
    reorder(params) {
        return this.http.post(`/column/reorder`, params);
    }
}

class RowService {
    constructor(http) {
        this.http = http;
    }
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
    create(params) {
        return this.http.post(`/row/create`, params);
    }
    /**
     * Delete row(s)
     * POST /row/remove
     */
    delete(params) {
        return this.http.post(`/row/remove`, params);
    }
    /**
     * Bulk delete multiple rows
     * POST /row/bulk-remove
     */
    bulkDelete(params) {
        return this.http.post(`/row/bulk-remove`, params);
    }
    /**
     * Insert row data
     * POST /row/data/insert
     */
    insertData(params) {
        return this.http.post(`/row/data/insert`, params);
    }
    /**
     * Insert relationship/link data between rows
     * POST /row/data/relation
     */
    insertRelation(params) {
        return this.http.post(`/row/data/relation`, params);
    }
    /**
     * Add attachment to row
     * POST /row/attachment/add
     */
    addAttachment(params, extra) {
        const formData = createFormData();
        formData.append('model_id', params.model_id.toString());
        formData.append('column_id', params.column_id.toString());
        formData.append('row_id', params.row_id.toString());
        if (Array.isArray(params.files)) {
            params.files.forEach((file) => {
                formData.append('files', file);
            });
        }
        const uploadLimits = this.http.getUploadLimits(true); // bulk upload
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            ...uploadLimits
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
    removeAttachment(params) {
        return this.http.post(`/row/attachment/remove`, params);
    }
}

class ViewService {
    constructor(http) {
        this.http = http;
    }
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
    create(params) {
        return this.http.post(`/view/create`, params);
    }
    /**
     * Get view by ID
     * GET /view/:id
     */
    getById(id) {
        return this.http.get(`/view/${id}`);
    }
    /**
     * Get all views
     * GET /view/
     */
    getAll() {
        return this.http.get(`/view/`);
    }
    /**
     * Update view
     * PATCH /view/:id
     */
    update(id, params) {
        return this.http.patch(`/view/${id}`, params);
    }
    /**
     * Delete view
     * DELETE /view/:id
     */
    delete(id) {
        return this.http.delete(`/view/${id}`);
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
        const formData = createFormData();
        files.forEach((file) => {
            formData.append('files', file);
        });
        if (description) {
            formData.append('description', description);
        }
        if (tags && tags.length > 0) {
            formData.append('tags', JSON.stringify(tags));
        }
        const uploadLimits = this.http.getUploadLimits(true); // bulk upload
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            ...uploadLimits
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
        const formData = createFormData();
        formData.append('file', file);
        if (optimize !== undefined) {
            formData.append('optimize', String(optimize));
        }
        const uploadLimits = this.http.getUploadLimits(false); // single file upload
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            ...uploadLimits
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
    // Add image
    addImage(params, extra) {
        const formData = new FormData();
        if (Array.isArray(params.files)) {
            params.files.forEach((file) => {
                formData.append('files', file);
            });
        }
        const config = {
            headers: {
                'content-type': 'multipart/form-data'
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        };
        if (typeof extra === 'function') {
            config.onUploadProgress = extra;
        }
        return this.http.post(`/asset/upload-image`, formData, config);
    }
}

class TableService {
    constructor(http) {
        this.http = http;
        // Initialize specialized services
        this.columnService = new ColumnService(http);
        this.rowService = new RowService(http);
        this.viewService = new ViewService(http);
        this.assetService = new AssetService(http);
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
        const formData = createFormData();
        if (params.base_id) {
            formData.append('base_id', params.base_id);
        }
        formData.append('workspace_id', params.workspace_id);
        formData.append('title', params.title);
        formData.append('description', params.description);
        formData.append('order_index', params.order_index.toString());
        if (params.file) {
            formData.append('file', params.file);
        }
        const uploadLimits = this.http.getUploadLimits(true); // bulk upload
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            ...uploadLimits
        };
        if (typeof extra === 'function') {
            config.onUploadProgress = extra;
        }
        return this.http.post(`/table/import`, formData, config);
    }
    // ============ COLUMN ENDPOINTS ============
    // Delegated to ColumnService for better code organization
    /**
     * Get all columns in table
     * GET /table/:id/columns
     */
    getColumnsByTableId(id) {
        return this.columnService.getColumnsByTableId(id);
    }
    /**
     * Create new column in table
     * POST /column/create
     */
    addColumn(params) {
        return this.columnService.create(params);
    }
    /**
     * Get column by ID
     * GET /column/:id
     */
    getColumnById(id) {
        return this.columnService.getById(id);
    }
    /**
     * Get all columns
     * GET /column/
     */
    getAllColumns() {
        return this.columnService.getAll();
    }
    /**
     * Update column
     * PATCH /column/:id
     */
    updateColumn(id, params) {
        return this.columnService.update(id, params);
    }
    /**
     * Delete column
     * DELETE /column/:id
     */
    deleteColumn(id) {
        return this.columnService.delete(id);
    }
    /**
     * Reorder columns in table
     * POST /column/reorder
     */
    reorderColumn(params) {
        return this.columnService.reorder(params);
    }
    // ============ ROW ENDPOINTS ============
    // Delegated to RowService for better code organization
    /**
     * Get all records in table
     * GET /table/:id/records
     */
    getAllRecords(id, options) {
        return this.rowService.getAllRecords(id, options);
    }
    /**
     * Create new record/row
     * POST /row/create
     */
    createRow(params) {
        return this.rowService.create(params);
    }
    /**
     * Delete row(s)
     * POST /row/remove
     */
    deleteRow(params) {
        return this.rowService.delete(params);
    }
    /**
     * Bulk delete multiple rows
     * POST /row/bulk-remove
     */
    bulkDeleteRow(params) {
        return this.rowService.bulkDelete(params);
    }
    /**
     * Insert row data
     * POST /row/data/insert
     */
    insertRowData(params) {
        return this.rowService.insertData(params);
    }
    /**
     * Insert relationship/link data between rows
     * POST /row/data/relation
     */
    insertRelationData(params) {
        return this.rowService.insertRelation(params);
    }
    /**
     * Add attachment to row
     * POST /row/attachment/add
     */
    addAttachment(params, extra) {
        return this.rowService.addAttachment(params, extra);
    }
    /**
     * Remove attachment from row
     * POST /row/attachment/remove
     */
    removeAttachments(params) {
        return this.rowService.removeAttachment(params);
    }
    // ============ VIEW ENDPOINTS ============
    // Delegated to ViewService for better code organization
    /**
     * Get all views for table
     * GET /table/:id/views
     */
    getViewsByModelId(id) {
        return this.viewService.getViewsByModelId(id);
    }
    /**
     * Create view of table data
     * POST /view/create
     */
    createView(params) {
        return this.viewService.create(params);
    }
    /**
     * Get view by ID
     * GET /view/:id
     */
    getViewById(id) {
        return this.viewService.getById(id);
    }
    /**
     * Get all views
     * GET /view/
     */
    getAllViews() {
        return this.viewService.getAll();
    }
    /**
     * Update view
     * PATCH /view/:id
     */
    updateView(id, params) {
        return this.viewService.update(id, params);
    }
    /**
     * Delete view
     * DELETE /view/:id
     */
    deleteView(id) {
        return this.viewService.delete(id);
    }
    // ============ ASSET ENDPOINTS ============
    // Delegated to AssetService for better code organization
    /**
     * Get multiple assets by IDs
     * POST /asset/bulk
     * @deprecated Use types.GetBulkAssets with 'ids' property, will be migrated to 'asset_ids'
     */
    getBulkAssets(params) {
        // Handle both old and new format
        const assetParams = 'ids' in params
            ? { asset_ids: params.ids }
            : params;
        return this.assetService.getBulk(assetParams);
    }
    /**
     * Update asset metadata
     * PATCH /asset/:id
     */
    updateAssetById(id, params) {
        return this.assetService.updateById(id, params);
    }
    /**
     * Delete asset
     * DELETE /asset/:id
     */
    deleteAssetById(id) {
        return this.assetService.deleteById(id);
    }
}

class UserService {
    constructor(http) {
        this.http = http;
        this.workspaceService = null;
    }
    // Method to inject WorkspaceService (called from main client)
    setWorkspaceService(workspaceService) {
        this.workspaceService = workspaceService;
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
    updateProfile(id, params, avatarFile) {
        const formData = createFormData();
        if (params.first_name !== undefined) {
            formData.append('first_name', params.first_name);
        }
        if (params.last_name !== undefined) {
            formData.append('last_name', params.last_name);
        }
        if (params.display_name !== undefined) {
            formData.append('display_name', params.display_name);
        }
        if (params.dob !== undefined) {
            formData.append('dob', params.dob);
        }
        if (params.country !== undefined) {
            formData.append('country', params.country);
        }
        if (params.timezone !== undefined) {
            formData.append('timezone', params.timezone);
        }
        if (params.locale !== undefined) {
            formData.append('locale', params.locale);
        }
        if (avatarFile) {
            formData.append('avatar', avatarFile); // db: "avatar"
        }
        return this.http.patch(`/user/profile/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
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
        const formData = createFormData();
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
     * GET /user/roles-and-access/:id
     * @param id - User ID
     * @param scopeId - Optional scope ID to filter by (e.g., workspace ID)
     */
    getUserRolesAndAccess(id, scopeId) {
        const params = scopeId ? { scope_id: scopeId } : undefined;
        return this.http.get(`/user/roles-and-access/${id}`, { params });
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
        const formData = createFormData();
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
     * Edit existing user
     * POST /user/edit
     */
    async editUser(userData) {
        const formData = new FormData();
        formData.append('user_id', userData.user_id);
        if (userData.firstname !== undefined) {
            formData.append('firstname', userData.firstname);
        }
        if (userData.lastname !== undefined) {
            formData.append('lastname', userData.lastname);
        }
        if (userData.profile_pic) {
            formData.append('profile_pic', userData.profile_pic);
        }
        if (userData.is_coowner !== undefined) {
            formData.append('is_coowner', String(userData.is_coowner));
        }
        if (userData.membership) {
            formData.append('membership', JSON.stringify(userData.membership));
        }
        const uploadLimits = this.http.getUploadLimits(false);
        return this.http.post(`/user/edit`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            ...uploadLimits
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
     * Delegates to WorkspaceService for better code organization
     */
    removeFromWorkspace(workspaceId, params) {
        if (this.workspaceService) {
            return this.workspaceService.removeUserFromWorkspace(workspaceId, params);
        }
        // Fallback if WorkspaceService not injected yet
        return this.http.post(`/workspace/${workspaceId}/remove`, params);
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
        // Initialize specialized services
        this.columnService = new ColumnService(this.http);
        this.rowService = new RowService(this.http);
        this.viewService = new ViewService(this.http);
        // Set up service injection for delegation
        this.userService.setWorkspaceService(this.workspace);
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

export { AuthService, HttpClient, SereniBaseClient, SereniBaseClient as default, encodeToBase64 };
//# sourceMappingURL=index.esm.js.map
