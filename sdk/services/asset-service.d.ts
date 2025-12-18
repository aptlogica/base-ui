import { HttpClient } from '../client/http-client';
import * as types from '../types/table';
export declare class AssetService {
    private http;
    constructor(http: HttpClient);
    getBulk(params: types.GetBulkAssets): Promise<import("..").StandardResponse<any>>;
    updateById(id: string, params: types.UpdateAsset): Promise<import("..").StandardResponse<any>>;
    deleteById(id: string): Promise<import("..").StandardResponse<any>>;
    addImage(params: types.AddImage, extra?: (progressEvent: ProgressEvent) => void): Promise<import("..").StandardResponse<any>>;
}
//# sourceMappingURL=asset-service.d.ts.map