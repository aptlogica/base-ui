import type { ViewContext } from '../types/viewRuntime';

export function validateViewContext(ctx: Partial<ViewContext>) {
  const issues: string[] = [];
  if (!ctx.tableId) issues.push('Missing tableId');
  if (!ctx.viewId) issues.push('Missing viewId');
  if (!ctx.viewType) issues.push('Missing viewType');
  if (!Array.isArray(ctx.fields)) issues.push('fields not array');
  if (!Array.isArray(ctx.rows)) issues.push('rows not array');
  return issues;
}

export function safeParseMeta<T = any>(v: unknown, fallback: T = {} as any): T {
  if (v == null) return fallback;
  if (typeof v === 'object') return v as T;
  if (typeof v === 'string') {
    try { return JSON.parse(v) as T; } catch { return fallback; }
  }
  return fallback;
}
