// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { BaseColumn } from '../../../types/column.types';

export const getSearchableColumns = (columns: BaseColumn[]) => {
  return columns.filter((col) => {
    const isSystemField = col.isSystem || col.system;
    const title = (col.title || '').toLowerCase();
    const columnName = (col.column_name || '').toLowerCase();
    const isTitle = title === 'title' || columnName === 'title';
    return !isSystemField || isTitle;
  });
};
