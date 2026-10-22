// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { BaseColumn } from '../../../types/column.types';
import { isLegacyTitleColumn } from '../../../utils/recordLabel';

export const getSearchableColumns = (columns: BaseColumn[]) => {
  return columns.filter((col) => {
    const isSystemField = col.isSystem || col.system;
    // System fields are not searched, except the Title of a table created before Title became an ordinary column
    return !isSystemField || isLegacyTitleColumn(col);
  });
};
