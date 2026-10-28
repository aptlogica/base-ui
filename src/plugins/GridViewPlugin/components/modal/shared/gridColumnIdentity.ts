// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import type { GridColumn } from '../../../types/grid.types';
import type { GridActionId } from '../../toolbar/gridActionCatalog';
import { normalizeFieldType, type FieldRendererType } from '../../../../../utils/fieldType';
import { isAutoUuidColumn } from '../../../../../utils/uuid';

const GRID_DATA_OPERATION_EXCLUDED_FIELD_TYPES = new Set<FieldRendererType>([
  'attachment',
  'user',
  'links',
  'lookup',
  'formula',
]);

// Fuzzy matching scores character-level similarity between values.
const FUZZY_DEDUPLICATION_SUPPORTED_FIELD_TYPES = new Set<FieldRendererType>([
  'text',
  'longText',
  'email',
  'phoneNumber',
  'number',
  'decimal',
  'currency',
  'percent',
  'date',
]);

export const getGridColumnIdentity = (column: GridColumn) =>
  String(column.id || column.key || column.column_name || column.title || '');

export const getGridColumnValueKey = (column: GridColumn) =>
  String(column.key || column.column_name || column.id || column.title || '');

export const getGridColumnFieldType = (column: GridColumn): FieldRendererType =>
  normalizeFieldType(String(column.uidt || ''));

// Auto-generated UUID fields are owned by the backend, so data operations can't rewrite them
export const isGridDataOperationSelectableColumn = (column: GridColumn): boolean =>
  Boolean(getGridColumnIdentity(column))
  && !GRID_DATA_OPERATION_EXCLUDED_FIELD_TYPES.has(getGridColumnFieldType(column))
  && !isAutoUuidColumn(column);

export const filterGridDataOperationColumns = (columns: GridColumn[]): GridColumn[] =>
  columns.filter(isGridDataOperationSelectableColumn);

export const isFuzzyDeduplicationSupportedColumn = (column: GridColumn): boolean =>
  isGridDataOperationSelectableColumn(column)
  && FUZZY_DEDUPLICATION_SUPPORTED_FIELD_TYPES.has(getGridColumnFieldType(column));

export const filterGridDataOperationColumnsForAction = (
  columns: GridColumn[],
  actionId?: GridActionId,
): GridColumn[] =>
  actionId === 'fuzzy_deduplication'
    ? columns.filter(isFuzzyDeduplicationSupportedColumn)
    : filterGridDataOperationColumns(columns);