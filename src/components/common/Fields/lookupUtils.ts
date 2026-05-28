// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { normalizeFieldType } from '../../../utils/fieldType';

export interface LookupFieldMeta {
  uidt?: string;
  meta?: any;
  config?: any;
  column_name?: string;
  title?: string;
}

export const getLookupColumnId = (field?: LookupFieldMeta): string | undefined => {
  if (!field?.meta) return undefined;

  const meta = typeof field.meta === 'string'
    ? JSON.parse(field.meta || '{}')
    : field.meta;

  return meta.lookup_column_id;
};

export const normalizeLookupValue = (value: any): any[] => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.filter((item) => item !== null && item !== undefined);
  return [value];
};

export const getFieldTypeFromSource = (sourceColumn: any): string => {
  if (!sourceColumn) return 'text';
  const uidt = sourceColumn.uidt || sourceColumn.type || 'text';
  return normalizeFieldType(uidt);
};

