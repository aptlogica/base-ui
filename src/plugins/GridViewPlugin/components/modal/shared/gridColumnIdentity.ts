// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import type { GridColumn } from '../../../types/grid.types';

export const getGridColumnIdentity = (column: GridColumn) =>
  String(column.id || column.key || column.column_name || column.title || '');
