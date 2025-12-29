/**
 * Asset Types - File and media management
 */
export interface AssetUploadResponse {
    id: string;
    filename: string;
    original_filename: string;
    file_type: string;
    file_size: number;
    url: string;
    storage_path: string;
    created_at: string;
}
export interface GetBulkAssets {
    asset_ids: string[];
}
export interface UpdateAsset {
    filename?: string;
    description?: string;
    tags?: string[];
}
export interface UploadAsset {
    workspace_id: string;
    file_name: string;
    content_type: string;
    size: number;
}
export interface AddImage {
    files: File[];
}
//# sourceMappingURL=asset.d.ts.map