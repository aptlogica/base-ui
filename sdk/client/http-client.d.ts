import { AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'eventemitter3';
import { ClientConfig, StandardResponse } from '../types';
export declare class HttpClient extends EventEmitter {
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
//# sourceMappingURL=http-client.d.ts.map