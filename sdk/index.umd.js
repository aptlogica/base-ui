(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('axios'), require('eventemitter3')) :
    typeof define === 'function' && define.amd ? define(['exports', 'axios', 'eventemitter3'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.SereniBaseClient = {}, global.axios, global.EventEmitter));
})(this, (function (exports, axios, eventemitter3) { 'use strict';

    class HttpClient extends eventemitter3.EventEmitter {
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
        // Register new user
        register(params) {
            return this.http.post(`/auth/register`, params);
        }
        // Login user
        login(params) {
            return this.http.post(`/auth/login`, params);
        }
        // Refresh token
        refreshToken(params) {
            return this.http.post(`/auth/refresh`, params);
        }
        // Verify OTP
        verifyOtp(params) {
            return this.http.post(`/auth/otp/verify`, params);
        }
        // Resend OTP
        resendOtp(params) {
            return this.http.post(`/auth/otp/resend`, params);
        }
        // Add reset password
        resetPassword(params) {
            return this.http.post(`/auth/reset-password`, params);
        }
        // Add forgot password
        forgotPassword(params) {
            return this.http.post(`/auth/forgot-password`, params);
        }
        // identity provider
        loginByIdentityProvider(provider) {
            return this.http.get(`/auth/login/${provider}`);
        }
        // Logout user
        logout(params) {
            return this.http.post(`/auth/logout`, params);
        }
        // callback for login
        callback(queryString) {
            return this.http.post(`/auth/callback${queryString}`);
        }
    }

    class WorkspaceService {
        constructor(http) {
            this.http = http;
        }
        // create workspace
        create(params) {
            return this.http.post(`/workspace/create`, params);
        }
        // Get all workspaces
        getAll() {
            return this.http.get(`/workspace/`);
        }
        // Get a workspace by ID
        getById(id) {
            return this.http.get(`/workspace/${id}`);
        }
        // Get tables by workspace ID
        getTablesByWorkspaceId(id) {
            return this.http.get(`/workspace/${id}/tables`);
        }
        // Update a workspace by ID
        update(id, params) {
            return this.http.put(`/workspace/${id}`, params);
        }
        // Delete a workspace by ID
        delete(id) {
            return this.http.delete(`/workspace/${id}`);
        }
        // Get bases by workspace ID
        getBasesByWorkspaceId(id) {
            return this.http.get(`/workspace/${id}/bases`);
        }
        // Invite multiple users to the workspace
        inviteUser(workspaceId, params) {
            return this.http.post(`/workspace/${workspaceId}/invite`, params);
        }
        // Remove a user from the workspace
        removeUserFromWorkspace(workspaceId, params) {
            return this.http.post(`/workspace/${workspaceId}/remove`, params);
        }
        // Get members of a workspace
        getMembers(workspaceId) {
            return this.http.get(`/workspace/${workspaceId}/members`);
        }
    }

    class BaseService {
        constructor(http) {
            this.http = http;
        }
        // Create a new base
        create(params) {
            return this.http.post(`/base/create`, params);
        }
        // Get a base by ID
        getById(id) {
            return this.http.get(`/base/${id}`);
        }
        // Get tables by base ID
        getTablesByBaseId(id) {
            return this.http.get(`/base/${id}/tables`);
        }
        // Get all bases
        getAll() {
            return this.http.get(`/base/`);
        }
        // Update a base by ID
        update(id, params) {
            return this.http.put(`/base/${id}`, params);
        }
        // Delete a base by ID
        delete(id) {
            return this.http.delete(`/base/${id}`);
        }
        // Get base members
        getMembers(id) {
            return this.http.get(`/base/${id}/members`);
        }
    }

    class TableService {
        constructor(http) {
            this.http = http;
        }
        // Table-related API methods for SDK
        // Create a new table
        create(params) {
            return this.http.post(`/table/create`, params);
        }
        // Update a table by ID
        update(id, params) {
            return this.http.patch(`/table/${id}`, params);
        }
        // Get a table by ID
        getById(id, options) {
            var _a, _b;
            if (options && (options.pageNumber !== undefined || options.pageLimit !== undefined)) {
                const pageNumber = (_a = options.pageNumber) !== null && _a !== void 0 ? _a : 1;
                const pageLimit = (_b = options.pageLimit) !== null && _b !== void 0 ? _b : 30;
                return this.http.get(`/table/${id}?page=${pageNumber}&page_size=${pageLimit}`);
            }
            return this.http.get(`/table/${id}`);
        }
        // Get all tables
        getAll() {
            return this.http.get(`/table/`);
        }
        // Get columns by table ID
        getColumnsByTableId(id) {
            return this.http.get(`/table/${id}/columns`);
        }
        // Get views by table/model ID
        getViewsByModelId(id) {
            return this.http.get(`/table/${id}/views`);
        }
        // Get all records by table ID
        getAllRecords(id, options) {
            var _a, _b;
            const pageNumber = (_a = options === null || options === void 0 ? void 0 : options.pageNumber) !== null && _a !== void 0 ? _a : 1;
            const pageLimit = (_b = options === null || options === void 0 ? void 0 : options.pageLimit) !== null && _b !== void 0 ? _b : 30;
            return this.http.get(`/table/${id}/records?page=${pageNumber}&page_size=${pageLimit}`);
        }
        // Delete a table by ID
        delete(id) {
            return this.http.delete(`/table/${id}`);
        }
        // Column-related API methods
        // Add a new column
        addColumn(params) {
            return this.http.post(`/column/create`, params);
        }
        // Get a column by ID
        getColumnById(id) {
            return this.http.get(`/column/${id}`);
        }
        // Get all columns
        getAllColumns() {
            return this.http.get(`/column/`);
        }
        // Update a column by ID
        updateColumn(id, params) {
            return this.http.patch(`/column/${id}`, params);
        }
        // Delete a column by ID
        deleteColumn(id) {
            return this.http.delete(`/column/${id}`);
        }
        // Column reorder
        // Reorder columns in a table by specifying source and target column IDs
        reorderColumn(params) {
            return this.http.post(`/column/reorder`, params);
        }
        // Row-related API methods
        // Create a new row
        createRow(params) {
            return this.http.post(`/row/create`, params);
        }
        // Insert row data
        insertRowData(params) {
            // implement validations per column datatype
            // implement logic for attachment type 
            return this.http.post(`/row/data/insert`, params);
        }
        // Insert relation data for a row (e.g., for many-to-many or linked records)
        insertRelationData(params) {
            return this.http.post(`/row/data/relation`, params);
        }
        // Add attachment(s) to a row
        addAttachment(params, extra) {
            const formData = new FormData();
            formData.append('model_id', params.model_id);
            formData.append('column_id', params.column_id);
            formData.append('row_id', params.row_id.toString());
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
            return this.http.post(`/row/attachment/add`, formData, config);
        }
        // Remove attachment(s) from a row
        removeAttachments(params) {
            return this.http.post(`/row/attachment/remove`, params);
        }
        // // Get user profile by ID
        // getUserProfileByID(id: string) {
        //     return this.http.get(`/user/profile/${id}`);
        // }
        // Delete a row
        deleteRow(params) {
            return this.http.post(`/row/remove`, params);
        }
        // View-related API methods
        // Create a new view
        createView(params) {
            return this.http.post(`/view/create`, params);
        }
        // Get a view by ID
        getViewById(id) {
            return this.http.get(`/view/${id}`);
        }
        // Get all views
        getAllViews() {
            return this.http.get(`/view/`);
        }
        // Update a view by ID
        updateView(id, params) {
            return this.http.patch(`/view/${id}`, params);
        }
        // Delete a view by ID
        deleteView(id) {
            return this.http.delete(`/view/${id}`);
        }
        // Asset-related API methods
        // Get bulk assets
        getBulkAssets(params) {
            return this.http.post(`/asset/bulk`, params);
        }
        // Update asset by ID
        updateAssetById(id, params) {
            return this.http.patch(`/asset/${id}`, params);
        }
        // Delete asset by ID
        deleteAssetById(id) {
            return this.http.delete(`/asset/${id}`);
        }
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
                    'content-type': 'multipart/form-data'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            };
            if (typeof extra === 'function') {
                config.onUploadProgress = extra;
            }
            return this.http.post(`/table/import`, formData, config);
        }
        importAiTable(params) {
            return this.http.post(`/table/import/ai`, params);
        }
        applyImportAiTable(params, schema) {
            return this.http.post(`/table/import/ai/apply`, params);
        }
    }

    class UserService {
        constructor(http) {
            this.http = http;
        }
        // Get current user profile
        getProfile(id) {
            return this.http.get(`/user/profile/${id}`);
        }
        // Update current user profile
        updateProfile(id, params) {
            return this.http.patch(`/user/profile/${id}`, params);
        }
        // Change password
        changePassword(id, params) {
            return this.http.post(`/user/change-password/${id}`, params);
        }
        // Add or update user avatar
        addOrUpdateAvatar(id, avatarFile) {
            const formData = new FormData();
            formData.append("avatar", avatarFile);
            return this.http.post(`/user/profile/${id}/avatar`, formData, {
                headers: {
                    "content-type": "multipart/form-data",
                },
            });
        }
        // Remove user avatar
        removeAvatar(id) {
            return this.http.delete(`/user/profile/${id}/avatar`);
        }
        // Get workspaces for a user
        getWorkspaces() {
            return this.http.get(`/user/workspaces`);
        }
        // Assign user to workspace
        assignToWorkspace(params) {
            return this.http.post(`/user/assign`, params);
        }
        removeFromWorkspace(workspaceId, params) {
            return this.http.post(`/workspace/${workspaceId}/remove`, params);
        }
        // Get user's workspace and base access details
        getUserAccessDetails(userId, workspaceId) {
            const params = new URLSearchParams({ user_id: userId });
            if (workspaceId) {
                params.append("workspace_id", workspaceId);
            }
            return this.http.get(`/user/access-details?user_id=${userId}`);
        }
    }

    class TenantService {
        constructor(http) {
            this.http = http;
        }
        /**
         * Creates a new user under the tenant.
         * Equivalent to POST /tenant/user/create
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
            return this.http.post(`/tenant/user/create`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        }
        /**
         * Removes a user from the tenant.
         * Equivalent to POST /tenant/user/remove
         */
        async removeUser(userData) {
            return this.http.post(`/tenant/user/remove`, userData);
        }
        /**
         * activate a user from the tenant.
         * Equivalent to POST /tenant/user/activate
         */
        async activateUser(userData) {
            return this.http.post(`/tenant/user/activate`, userData);
        }
        /**
         * deactivate a user from the tenant.
         * Equivalent to POST /tenant/user/deactivate
         */
        async deactivateUser(userData) {
            return this.http.post(`/tenant/user/deactivate`, userData);
        }
        /**
         * Retrieves the list of users for the tenant.
         * Equivalent to GET /tenant/users
         */
        async getUsers() {
            return this.http.get(`/tenant/users`);
        }
        /**
         * Retrieves the tenant information.
         * Equivalent to GET /tenant
         */
        async getTenant() {
            return this.http.get(`/tenant/info`);
        }
        /**
         * Updates tenant information.
         * Equivalent to PATCH /tenant/update
         */
        async updateTenant(updateData) {
            return this.http.patch(`/tenant/info`, updateData);
        }
    }

    class AssetService {
        constructor(http) {
            this.http = http;
        }
        // Get bulk assets
        getBulk(params) {
            return this.http.post(`/asset/bulk`, params);
        }
        // Update asset by ID
        updateById(id, params) {
            return this.http.patch(`/asset/${id}`, params);
        }
        // Delete asset by ID
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

    class SereniBaseClient {
        constructor(config) {
            this.http = new HttpClient(config);
            // Initialize services
            this.auth = new AuthService(this.http);
            this.workspace = new WorkspaceService(this.http);
            this.baseService = new BaseService(this.http);
            this.tableService = new TableService(this.http);
            this.userService = new UserService(this.http);
            this.tenantService = new TenantService(this.http);
            this.assetService = new AssetService(this.http);
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

    exports.AuthService = AuthService;
    exports.HttpClient = HttpClient;
    exports.SereniBaseClient = SereniBaseClient;
    exports.default = SereniBaseClient;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.umd.js.map
