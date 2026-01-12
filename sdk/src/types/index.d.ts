export interface ClientConfig {
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
    uploadLimits?: {
        maxFileSize?: number;
        maxBulkSize?: number;
        allowedFileTypes?: string[];
    };
}
export interface StandardResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: ErrorInfo;
    meta?: any;
}
export interface ErrorInfo {
    code: string;
    message: string;
    details?: string;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    offset?: number;
}
export interface PaginatedResponse<T> {
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
//# sourceMappingURL=index.d.ts.map