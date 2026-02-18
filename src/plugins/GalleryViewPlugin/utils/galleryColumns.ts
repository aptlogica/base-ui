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
