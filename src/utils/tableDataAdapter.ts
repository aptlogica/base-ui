import type { ViewContext } from '../types/viewRuntime';
import type { TableData, TableModel, TableColumn, TableView } from '../types/tableData';

/**
 * Convert ViewContext to the minimal, API-like table shape used by all views.
 */
export function contextToTableData(ctx: ViewContext, withViews: boolean = true): TableData {
  const model: TableModel = {
    id: String(ctx.tableId),
    base_id: ctx.baseId,
    workspace_id: ctx.workspaceId,
    title: ctx.tableTitle,
    alias: ctx.tableAlias,
    meta: ctx.tableMeta,
  };

  const columns: TableColumn[] = (ctx.fields || []).map((f, idx) => ({
    id: String(f.id),
    column_name: String((f as any).columnName ?? (f as any).column_name ?? f.title ?? f.id),
    title: String(f.title ?? (f as any).columnName ?? (f as any).column_name ?? f.id),
    uidt: String(f.uidt || 'text'),
    meta: f.meta || {},
    order_index: typeof f.position === 'number' ? f.position : idx,
  }));

  const records: Record<string, any>[] = (ctx.rows || []).map(r => r?.data ?? {});

  const tableData: TableData = {
    model,
    columns,
    records,
  };

  if (withViews) {
    const tv: TableView = { id: String(ctx.viewId), type: String(ctx.viewType), meta: ctx.meta?.extra ?? ctx.meta };
    tableData.views = [tv];
  }

  return tableData;
}
