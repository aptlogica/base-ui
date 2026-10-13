// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com

// A link cell holds the linked records' primary-key values: [{"id": 12}] for a table keyed by id, or
// [{"code": "IN", "dept": "HR"}] for a composite key. Cells edited in the UI may also hold full records,
// and older cells plain ids; these helpers accept all three.

type LinkItem = unknown;
type LinkRecord = { id?: unknown; [key: string]: unknown };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasId = (item: Record<string, unknown>) => item.id !== undefined && item.id !== null && item.id !== '';

// Normalizes a cell value to a list of items
export const linkItems = (value: unknown): LinkItem[] => {
  if (value === null || value === undefined || value === '') return [];
  if (Array.isArray(value)) return value.filter(item => item !== null && item !== undefined);
  if (isObject(value)) return Object.keys(value).length === 0 ? [] : [value];
  return [value];
};

// Whether a stored key object identifies this record: every key field has the same value
export const linkKeyMatches = (key: Record<string, unknown>, record: LinkRecord): boolean => {
  const entries = Object.entries(key);
  return entries.length > 0 && entries.every(([name, value]) => record[name] !== undefined && String(record[name]) === String(value));
};

// The row id of a linked item, using records of the linked table to resolve composite keys
export const resolveLinkRowId = (item: LinkItem, records: LinkRecord[] = []): string | undefined => {
  if (item === null || item === undefined) return undefined;
  if (!isObject(item)) return String(item);
  if (hasId(item)) return String(item.id);
  const record = records.find(r => linkKeyMatches(item, r));
  return record ? String(record.id) : undefined;
};

// A readable label for an item whose record isn't loaded, e.g. "IN / HR"
export const linkItemLabel = (item: LinkItem): string => {
  if (!isObject(item)) return String(item);
  if (typeof item.title === 'string' && item.title) return item.title;
  return Object.values(item).map(v => String(v)).join(' / ');
};

// A stable identity for an item: its row id when known, otherwise its key values
export const linkItemIdentity = (item: LinkItem, records: LinkRecord[] = []): string =>
  resolveLinkRowId(item, records) ?? `key:${JSON.stringify(item)}`;

// Records of a table as cached by useTable (query key ['tables', tableId]); empty when not loaded
export const cachedTableRecords = (
  queryClient: { getQueryData: (key: unknown[]) => unknown } | undefined,
  tableId: string | undefined,
): LinkRecord[] => {
  if (!queryClient || !tableId) return [];
  const data = queryClient.getQueryData(['tables', String(tableId)]) as { data?: { records?: LinkRecord[] } } | undefined;
  return Array.isArray(data?.data?.records) ? data.data.records : [];
};

// The row ids of the items in a cell; items that can't be resolved are left out
export const linkRowIds = (value: unknown, records: LinkRecord[] = []): number[] =>
  linkItems(value)
    .map(item => Number.parseInt(String(resolveLinkRowId(item, records)), 10))
    .filter(id => Number.isFinite(id));
