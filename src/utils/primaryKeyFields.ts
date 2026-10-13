// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com

// A table with a custom primary key (anything but Id alone) only accepts records whose key fields are all
// filled in; the backend rejects others with PKY_1007. These helpers apply the same rule before saving.

const ID_COLUMN = 'id';

export interface KeyColumnRef {
  id?: string | number;
  column_name?: string;
  columnName?: string;
  key?: string;
  title?: string;
}

// Same rule as the backend: null, undefined and blank text are empty
export const isEmptyKeyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

// The key's column IDs when the table uses a custom key; empty for tables keyed by Id alone
export const customKeyColumnIds = (keyColumnIds: string[] | undefined, columns: KeyColumnRef[]): string[] => {
  const ids = (keyColumnIds ?? []).map(String);
  if (ids.length === 0) return [];
  if (ids.length === 1) {
    const only = columns.find(c => String(c.id) === ids[0]);
    const name = only?.column_name ?? only?.columnName ?? only?.key;
    if (name === ID_COLUMN) return [];
  }
  return ids;
};

// Key column IDs a new record must fill in: the custom key without Id, which the database assigns
export const requiredKeyColumnIds = (keyColumnIds: string[] | undefined, columns: KeyColumnRef[]): string[] =>
  customKeyColumnIds(keyColumnIds, columns).filter(id => {
    const column = columns.find(c => String(c.id) === id);
    return (column?.column_name ?? column?.columnName ?? column?.key) !== ID_COLUMN;
  });

// Key column IDs whose value is still empty; values are looked up by column ID
export const missingKeyColumnIds = (keyIds: string[], valueOf: (columnId: string) => unknown): string[] =>
  keyIds.filter(id => isEmptyKeyValue(valueOf(id)));

// "Code and Year are required: they make up the primary key."
export const missingKeyMessage = (titles: string[]): string => {
  if (titles.length === 0) return '';
  if (titles.length === 1) return `${titles[0]} is required: it is part of the primary key.`;
  const list = `${titles.slice(0, -1).join(', ')} and ${titles[titles.length - 1]}`;
  return `${list} are required: they make up the primary key.`;
};
