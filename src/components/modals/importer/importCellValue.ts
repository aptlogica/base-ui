// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com

export const stringifyImportCellValue = (value: unknown): string => {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();

  switch (typeof value) {
    case 'string':
      return value;
    case 'number':
    case 'boolean':
    case 'bigint':
      return `${value}`;
    case 'symbol':
      return value.description ? `Symbol(${value.description})` : 'Symbol()';
    case 'function':
      return value.name ? `[Function ${value.name}]` : '[Function]';
    case 'object':
      try {
        return JSON.stringify(value) ?? '';
      } catch {
        return '[Object]';
      }
    default:
      return '';
  }
};

export const normalizeImportCellValue = (value: unknown): string => {
  return stringifyImportCellValue(value).trim();
};

export const buildImportRowKey = (
  row: Record<string, unknown>,
  columns: Array<{ key: string }>,
  rowIndex: number
): string => {
  const signature = columns.map((column) => stringifyImportCellValue(row[column.key])).join('\u001f');
  return `${rowIndex}:${signature}`;
};
