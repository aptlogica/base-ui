import { HttpClient } from '../client/http-client';
import * as types from '../types/base';
export declare class BaseService {
    private http;
    constructor(http: HttpClient);
    create(params: types.CreateBase): Promise<import("..").StandardResponse<any>>;
    getById(id: string): Promise<import("..").StandardResponse<any>>;
    getTablesByBaseId(id: string): Promise<import("..").StandardResponse<any>>;
    getAll(): Promise<import("..").StandardResponse<any>>;
    update(id: string, params: types.UpdateBase): Promise<import("..").StandardResponse<any>>;
    delete(id: string): Promise<import("..").StandardResponse<any>>;
    getMembers(id: string): Promise<import("..").StandardResponse<any>>;
}
//# sourceMappingURL=base-service.d.ts.map