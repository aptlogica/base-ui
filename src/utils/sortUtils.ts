export interface SortItem { column: string; direction: 'asc' | 'desc' }

export type ValueGetter<T> = (row: T, key: string) => any;

export interface MinimalColumn { key: string; type: string }

const isNullish = (v: any) => v === null || v === undefined || v === '';

const compareNullish = (a: any, b: any): number | null => {
  if (isNullish(a) && isNullish(b)) return 0;
  if (isNullish(a)) return 1;   // nulls last
  if (isNullish(b)) return -1;
  return null;
};

const compareNumbers = (a: number, b: number): number => {
  if (Number.isNaN(a) && Number.isNaN(b)) return 0;
  if (Number.isNaN(a)) return 1;
  if (Number.isNaN(b)) return -1;
  if (a === b) return 0;
  return a < b ? -1 : 1;
};

const compareDates = (a: any, b: any): number =>
  compareNumbers(Date.parse(String(a)), Date.parse(String(b)));

const parseBoolean = (v: any): number =>
  String(v).toLowerCase() === 'true' || String(v) === '1' ? 1 : 0;

export function compareValues(a: any, b: any, type: string): number {
  const nullCheck = compareNullish(a, b);
  if (nullCheck !== null) return nullCheck;

  switch (type) {
    case 'number':
    case 'decimal':
    case 'currency':
    case 'percent':
    case 'year':
    case 'rating':
      return compareNumbers(Number(a), Number(b));

    case 'date':
    case 'datetime':
    case 'time':
      return compareDates(a, b);

    case 'boolean': {
      const ba = parseBoolean(a);
      const bb = parseBoolean(b);
      if (ba === bb) return 0;
      return ba > bb ? -1 : 1;
    }

    case 'multiSelect': {
      const sa = Array.isArray(a) ? a.map(String).join(',') : String(a ?? '');
      const sb = Array.isArray(b) ? b.map(String).join(',') : String(b ?? '');
      return sa.localeCompare(sb, undefined, { sensitivity: 'base' });
    }

    default:
      return String(a).localeCompare(String(b), undefined, {
        sensitivity: 'base'
      });
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
  return sorts.filter(s => s?.column.trim() && s.direction);
}

// Filter out invalid groups (empty column or missing direction)
export function filterValidGroups<T extends { column: string; direction?: string }>(groups: T[]): T[] {
  if (!Array.isArray(groups)) return [];
  return groups.filter(g => g?.column.trim() && (g.direction !== undefined && g.direction !== null));
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
