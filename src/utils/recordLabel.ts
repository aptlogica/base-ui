// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com

// How a record is named in the UI.
//
// A link field shows each linked record by one column of the linked table, its display column:
// meta.display_column_id of the link field, chosen when the link is created and editable later.
// A record of its own table (a calendar event, a gallery card, a delete confirmation) is named by the
// first text column of the table. Both fall back to "Record <id>" when there is nothing to show.
//
// No column is special because of its name. The only exception is the system Title column of tables
// created before Title became an ordinary column (isLegacyTitleColumn); it can be removed once every
// table has been migrated.

export interface LabelColumn {
  id?: string | number;
  column_name?: string;
  columnName?: string;
  key?: string;
  title?: string;
  uidt?: string;
  type?: string;
  system?: boolean;
  isSystem?: boolean;
  deleted?: boolean;
  order_index?: number;
  position?: number;
}

export const LEGACY_TITLE_COLUMN_NAME = 'title';
export const DISPLAY_COLUMN_META_KEY = 'display_column_id';
export const INVERSE_DISPLAY_COLUMN_KEY = 'inverse_display_column_id';

// Field types that have no single readable value, so they can't label a record
const NON_LABEL_TYPES = new Set(['links', 'lookup', 'rollup', 'attachment', 'json']);
const TEXT_TYPES = new Set(['text', 'longtext']);

const columnName = (column: LabelColumn): string => String(column.column_name ?? column.columnName ?? column.key ?? '');

const columnType = (column: LabelColumn): string => String(column.uidt ?? column.type ?? '').toLowerCase();

const isSystem = (column: LabelColumn): boolean => Boolean(column.system ?? column.isSystem);

// The system Title column of a table created before Title became an ordinary column
export const isLegacyTitleColumn = (column: LabelColumn): boolean =>
  isSystem(column) && columnName(column) === LEGACY_TITLE_COLUMN_NAME;

// Whether a field of this type can label a record
export const isDisplayColumnType = (type: string | undefined): boolean => !NON_LABEL_TYPES.has(String(type ?? '').toLowerCase());

// The system Id column every table has
export const isIdColumn = (column: LabelColumn): boolean => isSystem(column) && columnName(column) === 'id';

// Whether the column can be chosen as a display column: a plain, live field. System fields are left out,
// except the Id column and the Title of an older table.
export const isDisplayColumnCandidate = (column: LabelColumn): boolean => {
  if (column.deleted || !isDisplayColumnType(columnType(column))) return false;
  return !isSystem(column) || isLegacyTitleColumn(column) || isIdColumn(column);
};

export const isTextColumn = (column: LabelColumn): boolean =>
  TEXT_TYPES.has(columnType(column)) && isDisplayColumnCandidate(column);

const orderOf = (column: LabelColumn): number => {
  const order = column.order_index ?? column.position;
  return typeof order === 'number' ? order : Number.MAX_SAFE_INTEGER;
};

// The first text column of a table by order index; keeps the first of equal indexes
export const getRecordTitleColumn = <T extends LabelColumn>(columns: readonly T[] | null | undefined): T | undefined => {
  let first: T | undefined;
  for (const column of columns ?? []) {
    if (!isTextColumn(column)) continue;
    if (!first || orderOf(column) < orderOf(first)) first = column;
  }
  return first;
};

// The column a new link shows for each linked record: the table's Id column, or its first text column
export const getDefaultDisplayColumn = <T extends LabelColumn>(columns: readonly T[] | null | undefined): T | undefined =>
  (columns ?? []).find(column => isIdColumn(column) && !column.deleted) ?? getRecordTitleColumn(columns);

// The display column id stored in the meta of a link field, if any
export const getDisplayColumnId = (meta: unknown): string => {
  const source = typeof meta === 'string' ? parseMeta(meta) : meta;
  const value = (source as Record<string, unknown> | null | undefined)?.[DISPLAY_COLUMN_META_KEY];
  return value === undefined || value === null ? '' : String(value as string | number);
};

const parseMeta = (meta: string): Record<string, unknown> | null => {
  try {
    const parsed: unknown = JSON.parse(meta);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

// The column a link field shows for each linked record: the one its meta names, else the first text column
// of the linked table. columns are the columns of the linked table.
export const getLinkDisplayColumn = <T extends LabelColumn>(linkMeta: unknown, columns: readonly T[] | null | undefined): T | undefined => {
  const id = getDisplayColumnId(linkMeta);
  if (id) {
    const chosen = (columns ?? []).find(column => String(column.id) === id);
    if (chosen && isDisplayColumnCandidate(chosen)) return chosen;
  }
  return getRecordTitleColumn(columns);
};

const isBlank = (value: unknown): boolean => value === undefined || value === null || String(value as string | number).trim() === '';

// A value as shown in a label: lists are joined, objects are not shown
const labelText = (value: unknown): string => {
  if (Array.isArray(value)) return value.filter(item => !isBlank(item) && typeof item !== 'object').map(String).join(', ');
  if (typeof value === 'object' && value !== null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint' || typeof value === 'symbol') {
    return String(value).trim();
  }
  return '';
};

export const recordFallbackLabel = (recordId: unknown): string => `Record ${String((recordId ?? '') as string | number)}`.trim();

// The label of a record: the value of the column, or "Record <id>" when the column is missing or empty
export const getRecordLabel = (
  record: Record<string, unknown> | null | undefined,
  column: LabelColumn | null | undefined,
): string => {
  if (!record) return '';
  if (column) {
    const value = record[columnName(column)];
    if (!isBlank(value)) {
      const text = labelText(value);
      if (text) return text;
    }
  }
  return recordFallbackLabel(record.id);
};

// Text to search a record by: the label column's value
export const getRecordSearchText = (
  record: Record<string, unknown> | null | undefined,
  column: LabelColumn | null | undefined,
): string => (record && column && !isBlank(record[columnName(column)]) ? labelText(record[columnName(column)]).toLowerCase() : '');
