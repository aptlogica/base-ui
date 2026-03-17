// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
/**
 * Common utilities to build initialValues for Create/Edit modals across views.
 */

export type ColumnLike = {
  id?: string;
  name?: string;
  key?: string;
  columnName?: string;
};

export type NormalizedColumnLike = {
  id?: string;
  name?: string;
  columnName?: string; // actual data key used in record.data
};

export function buildInitialValuesForEdit(params: {
  record?: any; // A record or event-like object (may contain .data and .id)
  recordId?: string | number; // If provided, will be used to resolve record from rawRecords
  columns: ColumnLike[]; // The fields array passed to the modal
  normalizedColumns?: NormalizedColumnLike[]; // Optional normalized columns with columnName mapping
  rawRecords?: any[]; // Optional raw records to resolve by id
}): Record<string, any> {
  const { record, recordId, columns, normalizedColumns, rawRecords } = params || ({} as any);

  if (!Array.isArray(columns) || columns.length === 0) return {};

  // 1) Resolve the source record object
  const targetId = String(
    (record && (record._meta?.id ?? record.id)) ?? (recordId ?? '')
  );

  let resolved: any = undefined;
  if (Array.isArray(rawRecords) && targetId) {
    resolved = rawRecords.find((r: any) => String(r?._meta?.id ?? r?.id) === targetId);
  }
  const recordData = (resolved && (resolved.data || resolved)) || (record && (record.data || record)) || {};

  // 2) Build lookup for fieldId -> dataKey using normalized columns when available
  const dataKeyById = new Map<string, string>();
  if (Array.isArray(normalizedColumns)) {
    normalizedColumns.forEach((nc: any) => {
      const fid = nc?.id == null ? '' : String(nc.id);
      if (!fid) return;
      const dataKey = String(nc.columnName || nc.name || nc.id);
      dataKeyById.set(fid, dataKey);
    });
  }

  // 3) Populate initial values using the same fields array passed to the modal
  const init: Record<string, any> = {};
  columns.forEach((c: any) => {
    const fid = c?.id == null ? '' : String(c.id);
    if (!fid) return;
    const preferredKey = dataKeyById.get(fid);
    const fallbacks = [preferredKey, c.key, c.name, c.columnName, c.column_name, fid].filter(Boolean) as string[];
    for (const k of fallbacks) {
      const val = recordData?.[k as any];
      if (val !== undefined) {
        init[fid] = val; // include false/0/'' 
        break;
      }
    }
  });

  return init;
}
