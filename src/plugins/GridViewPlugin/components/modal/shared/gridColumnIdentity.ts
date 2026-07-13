// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import type { GridColumn } from '../../../types/grid.types';
import { normalizeFieldType, type FieldRendererType } from '../../../../../utils/fieldType';

const GRID_DATA_OPERATION_EXCLUDED_FIELD_TYPES = new Set<FieldRendererType>([
  'attachment',
  'user',
  'links',
  'lookup',
  'formula',
]);

export const getGridColumnIdentity = (column: GridColumn) =>
  String(column.id || column.key || column.column_name || column.title || '');

export const getGridColumnValueKey = (column: GridColumn) =>
  String(column.key || column.column_name || column.id || column.title || '');

export const getGridColumnFieldType = (column: GridColumn): FieldRendererType =>
  normalizeFieldType(String(column.uidt || ''));

export const isGridDataOperationSelectableColumn = (column: GridColumn): boolean =>
  Boolean(getGridColumnIdentity(column))
  && !GRID_DATA_OPERATION_EXCLUDED_FIELD_TYPES.has(getGridColumnFieldType(column));

export const filterGridDataOperationColumns = (columns: GridColumn[]): GridColumn[] =>
  columns.filter(isGridDataOperationSelectableColumn);
