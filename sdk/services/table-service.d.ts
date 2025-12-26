import { HttpClient } from '../client/http-client';
import * as types from '../types/table';
export declare class TableService {
    private http;
    constructor(http: HttpClient);
    create(params: types.CreateTable): Promise<import("..").StandardResponse<any>>;
    update(id: string, params: types.UpdateTable): Promise<import("..").StandardResponse<any>>;
    getById(id: string, options?: {
        pageNumber?: number;
        pageLimit?: number;
    }): Promise<import("..").StandardResponse<any>>;
    getAll(): Promise<import("..").StandardResponse<any>>;
    getColumnsByTableId(id: string): Promise<import("..").StandardResponse<any>>;
    getViewsByModelId(id: string): Promise<import("..").StandardResponse<any>>;
    getAllRecords(id: string, options?: {
        pageNumber?: number;
        pageLimit?: number;
    }): Promise<import("..").StandardResponse<any>>;
    delete(id: string): Promise<import("..").StandardResponse<any>>;
    addColumn(params: types.AddColumn): Promise<import("..").StandardResponse<any>>;
    getColumnById(id: string): Promise<import("..").StandardResponse<any>>;
    getAllColumns(): Promise<import("..").StandardResponse<any>>;
    updateColumn(id: string, params: types.UpdateColumn): Promise<import("..").StandardResponse<any>>;
    deleteColumn(id: string): Promise<import("..").StandardResponse<any>>;
    reorderColumn(params: types.ReorderColumn): Promise<import("..").StandardResponse<any>>;
    createRow(params: types.CreateRow): Promise<import("..").StandardResponse<any>>;
    insertRowData(params: types.InsertRowData): Promise<import("..").StandardResponse<any>>;
    insertRelationData(params: types.InsertRelationData): Promise<import("..").StandardResponse<any>>;
    addAttachment(params: types.AddAttachments, extra?: (progressEvent: ProgressEvent) => void): Promise<import("..").StandardResponse<any>>;
    removeAttachments(params: types.RemoveAttachments): Promise<import("..").StandardResponse<any>>;
    deleteRow(params: types.DeleteRow): Promise<import("..").StandardResponse<any>>;
    createView(params: types.CreateView): Promise<import("..").StandardResponse<any>>;
    getViewById(id: string): Promise<import("..").StandardResponse<any>>;
    getAllViews(): Promise<import("..").StandardResponse<any>>;
    updateView(id: string, params: types.UpdateView): Promise<import("..").StandardResponse<any>>;
    deleteView(id: string): Promise<import("..").StandardResponse<any>>;
    getBulkAssets(params: types.GetBulkAssets): Promise<import("..").StandardResponse<any>>;
    updateAssetById(id: string, params: types.UpdateAsset): Promise<import("..").StandardResponse<any>>;
    deleteAssetById(id: string): Promise<import("..").StandardResponse<any>>;
    import(params: types.ImportTable, extra?: (progressEvent: ProgressEvent) => void): Promise<import("..").StandardResponse<any>>;
    importAiTable(params: types.ImportAiTable): Promise<import("..").StandardResponse<any>>;
    applyImportAiTable(params: types.ApplyImportAiTable, schema: string): Promise<import("..").StandardResponse<any>>;
}
//# sourceMappingURL=table-service.d.ts.map