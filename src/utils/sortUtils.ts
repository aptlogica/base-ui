export interface SortItem { column: string; direction: 'asc' | 'desc' }

export type ValueGetter<T> = (row: T, key: string) => any;

export interface MinimalColumn { key: string; type: string }

export function compareValues(a: any, b: any, type: string): number {
  const nullish = (v: any) => v === null || v === undefined || v === '';
  if (nullish(a) && nullish(b)) return 0;
  if (nullish(a)) return 1; // nulls last
  if (nullish(b)) return -1;
  switch (type) {
    case 'number':
    case 'decimal':
    case 'currency':
    case 'percent':
    case 'year':
    case 'rating': {
      const na = Number(a);
      const nb = Number(b);
      if (Number.isNaN(na) && Number.isNaN(nb)) return 0;
      if (Number.isNaN(na)) return 1;
      if (Number.isNaN(nb)) return -1;
      return na === nb ? 0 : na < nb ? -1 : 1;
    }
    case 'date':
    case 'datetime':
    case 'time': {
      const da = Date.parse(String(a));
      const db = Date.parse(String(b));
      if (Number.isNaN(da) && Number.isNaN(db)) return 0;
      if (Number.isNaN(da)) return 1;
      if (Number.isNaN(db)) return -1;
      return da === db ? 0 : da < db ? -1 : 1;
    }
    case 'boolean': {
      const ba = (String(a).toLowerCase() === 'true' || String(a) === '1') ? 1 : 0;
      const bb = (String(b).toLowerCase() === 'true' || String(b) === '1') ? 1 : 0;
      // Asc: true first, Desc: false first
      return ba === bb ? 0 : ba > bb ? -1 : 1;
    }
    case 'multiSelect': {
      const sa = Array.isArray(a) ? a.map(String).join(',') : String(a ?? '');
      const sb = Array.isArray(b) ? b.map(String).join(',') : String(b ?? '');
      return sa.localeCompare(sb, undefined, { sensitivity: 'base' });
    }
    default: {
      const sa = String(a);
      const sb = String(b);
      return sa.localeCompare(sb, undefined, { sensitivity: 'base' });
    }
  }
}

export function buildComparator<T>(columns: MinimalColumn[], sorts: SortItem[], getValue: ValueGetter<T>) {
  const byKey = (key: string) => columns.find(c => c.key === key);
  return (ra: T, rb: T) => {
    for (const s of sorts) {
      const col = byKey(s.column);
      if (!col) continue;
      const va = getValue(ra, col.key);
      const vb = getValue(rb, col.key);
      const res = compareValues(va, vb, String(col.type));
      if (res !== 0) return s.direction === 'asc' ? res : -res;
    }
    return 0;
  };
}

// Filter out invalid sorts (empty column or missing direction)
export function filterValidSorts(sorts: SortItem[]): SortItem[] {
  if (!Array.isArray(sorts)) return [];
  return sorts.filter(s => s.column && s.column.trim() && s.direction);
}

// Filter out invalid groups (empty column or missing direction)
export function filterValidGroups<T extends { column: string; direction?: string }>(groups: T[]): T[] {
  if (!Array.isArray(groups)) return [];
  return groups.filter(g => g.column && g.column.trim() && (g.direction !== undefined && g.direction !== null));
}

// Convenience: if all views share rows shaped like { data: Record<string, any> }
export function sortRowsByDataKey<T extends { data?: Record<string, any> }>(
  columns: MinimalColumn[],
  sorts: SortItem[],
  rows: T[]
): T[] {
  const validSorts = filterValidSorts(sorts);
  if (validSorts.length === 0) return rows;
  const cmp = buildComparator<T>(columns, validSorts, (row, key) => row?.data?.[key]);
  return [...rows].sort(cmp);
}
