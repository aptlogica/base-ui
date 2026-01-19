// Shared runtime types for all view plugins
// Views should consume these shapes and stay UI-only (no data fetching inside views)

export type ViewTypeId = 'grid' | 'form' | 'gallery' | 'kanban' | 'calendar' | 'gantt';

export interface ViewField {
  id: string;
  title: string;
  columnName: string;
  uidt: string;
  meta?: Record<string, unknown>;
  hidden?: boolean;
  position?: number;
}

export interface ViewRow {
  id: string | number;
  // keys should be table column_name for consistency with backend payloads
  data: Record<string, any>;
}

export interface ViewMetaBase {
  filters?: { fieldId: string; op: string; value?: unknown }[];
  sorts?: { fieldId: string; direction: 'asc' | 'desc' }[];
  group?: { fieldId: string; order?: string[] } | null;
  // extra per-view config lives in view.meta but is surfaced here for convenience
  extra?: Record<string, unknown>;
}

export interface ViewContext {
  workspaceId?: string;
  baseId?: string;
  tableId: string;
  // Optional table details provided by host when available
  tableTitle?: string;
  tableAlias?: string;
  tableMeta?: Record<string, unknown>;
  viewId: string;
  viewType: ViewTypeId;
  fields: ViewField[];
  rows: ViewRow[];
  meta: ViewMetaBase;
}
