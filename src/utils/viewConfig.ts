import { safeParseMeta } from './viewDiagnostics';

export type Filters = { fieldId: string; op: string; value?: unknown }[];
export type Sorts = { fieldId: string; direction: 'asc' | 'desc' }[];
export type Group = { fieldId: string; order?: string[] } | null;

export function readViewConfig(view: any) {
  const meta = safeParseMeta(view?.meta, {} as any);
  return {
    filters: Array.isArray(meta.filters) ? meta.filters : ([] as Filters),
    sorts: Array.isArray(meta.sorts) ? meta.sorts : ([] as Sorts),
    group: (meta.group ?? null) as Group,
    extra: meta,
  };
}

export function writeViewConfig(view: any, patch: Partial<{ filters: Filters; sorts: Sorts; group: Group }> & { [k: string]: any }) {
  const meta = safeParseMeta(view?.meta, {} as any);
  const next = { ...meta, ...patch };
  return next; // caller should persist via service
}
