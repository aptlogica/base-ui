// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@aptlogica.com
import React from 'react';
import type { GridColumn } from '../../../types/grid.types';
import { filterGridDataOperationColumns, getGridColumnIdentity } from './gridColumnIdentity';

interface ColumnSelectionSectionProps {
  columns: GridColumn[];
  selectedColumnIds: string[];
  onToggleColumn: (columnId: string) => void;
  onToggleAllColumns: () => void;
  title?: string;
  description?: string;
}

export const ColumnSelectionSection: React.FC<ColumnSelectionSectionProps> = ({
  columns,
  selectedColumnIds,
  onToggleColumn,
  onToggleAllColumns,
  title = 'Select columns',
  description = 'Choose the columns to include in this action.',
}) => {
  const selectableColumns = filterGridDataOperationColumns(columns);

  return (
    <section className="space-y-2">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-secondary">{description}</p>
      </div>

      <div className="rounded-xl border bg-card p-3">
        <div className="mb-3 flex items-center justify-between gap-2 border-b pb-3">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={selectableColumns.length > 0 && selectedColumnIds.length === selectableColumns.length}
              onChange={onToggleAllColumns}
              className="checkbox-primary-brand"
            />
            <span className="text-sm font-medium text-foreground">Select all</span>
          </label>
          <span className="text-xs text-secondary">
            {selectedColumnIds.length} selected
          </span>
        </div>

        <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
          {selectableColumns.length === 0 ? (
            <div className="px-2 py-2 text-sm text-secondary">No columns available.</div>
          ) : (
            selectableColumns.map((column) => {
              const columnId = getGridColumnIdentity(column);
              const checked = selectedColumnIds.includes(columnId);
              return (
                <label
                  key={columnId}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleColumn(columnId)}
                    className="checkbox-primary-brand"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground" title={column.title}>
                    {column.title}
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
