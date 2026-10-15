// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import type { Column } from '../../../types/api.types';

// Field types that can't be part of a key, by lower-cased uidt
const BLOCKED_TYPES: Record<string, string> = {
  links: 'Link fields',
  lookup: 'Lookup fields',
  formula: 'Formula fields',
  attachment: 'Attachments',
  json: 'JSON fields',
  multiselect: 'Multi select fields',
  rating: 'Rating fields',
  createdtime: 'System fields',
  lastmodifiedtime: 'System fields',
  createdby: 'System fields',
  lastmodifiedby: 'System fields',
};

// Why a column can't be part of a key, or null when it can.
// Title is a system column but allowed: links and lookups show it. Computed fields are
// recognised by type, not by the virtual flag, which the server also sets on columns made with a table.
export const columnBlockReason = (column: Column): string | null => {
  if (column.column_name === 'id') return 'Already unique';
  const blocked = BLOCKED_TYPES[(column.uidt || '').toLowerCase()];
  if (blocked) return `${blocked} can't be part of a key`;
  if (column.system && column.column_name !== 'title') return "System fields can't be part of a key";
  return null;
};

export const UNIQUE_DEFAULT_CONFLICT_MESSAGE =
  'This column has a UNIQUE constraint. Its default value may be duplicated when inserting multiple rows. Remove the default value or the UNIQUE constraint to avoid duplicate-value errors.';

// Whether a column meta carries a default value (same rule as the server)
export const hasDefaultValue = (meta?: Record<string, any> | null): boolean => {
  const value = meta?.defaultValue;
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

// A key repeats its default in every new record when all of its columns have one
export const keyHasDefaultConflict = (columnIds: string[], columns: Pick<Column, 'id' | 'meta'>[]): boolean => {
  if (columnIds.length === 0) return false;
  const byId = new Map(columns.map(c => [c.id, c]));
  return columnIds.every(id => hasDefaultValue(byId.get(id)?.meta));
};
