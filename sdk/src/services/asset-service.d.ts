import { HttpClient } from '../client/http-client';
import * as types from '../types/asset';
export declare class AssetService {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * Upload assets/files
     * POST /asset/upload
     */
    upload(files: File[], description?: string, tags?: string[], extra?: (progressEvent: ProgressEvent) => void): Promise<import("..").StandardResponse<any>>;
    /**
     * Upload single image (optimized)
     * POST /asset/upload-image
     */
    uploadImage(file: File, optimize?: boolean, extra?: (progressEvent: ProgressEvent) => void): Promise<import("..").StandardResponse<any>>;
    /**
     * Get multiple assets by IDs
     * POST /asset/bulk
     */
    getBulk(params: types.GetBulkAssets): Promise<import("..").StandardResponse<any>>;
    /**
     * Update asset metadata
     * PATCH /asset/:id
     */
    updateById(id: string, params: types.UpdateAsset): Promise<import("..").StandardResponse<any>>;
    /**
     * Delete asset
     * DELETE /asset/:id
     */
    deleteById(id: string): Promise<import("..").StandardResponse<any>>;
    addImage(params: types.AddImage, extra?: (progressEvent: ProgressEvent) => void): Promise<import("..").StandardResponse<any>>;
}
//# sourceMappingURL=asset-service.d.ts.map