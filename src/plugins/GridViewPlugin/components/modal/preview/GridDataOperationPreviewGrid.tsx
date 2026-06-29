// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Dot } from 'lucide-react';
import type { GridColumn } from '../../../types/grid.types';
import type { GridDataOperationPreviewResult } from '../shared/gridDataOperation.types';

interface GridDataOperationPreviewGridProps {
  columns: GridColumn[];
  preview: GridDataOperationPreviewResult;
}

const formatCell = (value: unknown) => {
  const text = String(value ?? '');
  if (text.length <= 96) return text;
  return `${text.slice(0, 93)}...`;
};

const formatBeforeAfter = (before: unknown, after: unknown) => {
  const beforeText = formatCell(before);
  const afterText = formatCell(after);

  if (beforeText === afterText) {
    return afterText;
  }

  return { beforeText, afterText };
};

const PAGE_SIZE = 20;

export const GridDataOperationPreviewGrid: React.FC<GridDataOperationPreviewGridProps> = ({
  columns,
  preview,
}) => {
  const [page, setPage] = useState(0);
  const visibleColumns = columns.filter((column) => column.id || column.key);
  const totalPages = Math.max(1, Math.ceil(preview.previewRows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(0);
  }, [preview.actionId, preview.previewRows.length]);

  const previewRows = useMemo(() => {
    const start = page * PAGE_SIZE;
    return preview.previewRows.slice(start, start + PAGE_SIZE);
  }, [page, preview.previewRows]);

  const startRow = preview.previewRows.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const endRow = Math.min(preview.previewRows.length, (page + 1) * PAGE_SIZE);
  const canGoPrevious = page > 0;
  const canGoNext = page < totalPages - 1;

  return (
    <div className="flex min-h-0 max-h-[calc(100vh-20vh)] flex-col overflow-hidden bg-card">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-primary">Data preview</div>
          <div className="mt-1 text-xs text-secondary">
            Showing {startRow.toLocaleString()}-{endRow.toLocaleString()} of {preview.totalRows.toLocaleString()} rows
            <Dot className="inline-block h-8 w-8 align-middle" />
            {preview.affectedRows.toLocaleString()} rows affected
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
            {preview.affectedCells.toLocaleString()} cells changed
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
            {preview.affectedColumns.toLocaleString()} columns affected
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border bg-background">
        <table className="min-w-full table-fixed text-sm">
          <thead className="sticky top-0 z-10 bg-background">
            <tr>
              {visibleColumns.map((column) => {
                const columnId = String(column.key || column.id);
                return (
                  <th
                    key={columnId}
                    className="border-b px-4 py-3 text-left font-medium text-secondary whitespace-nowrap"
                  >
                    <span className="block max-w-[140px] truncate" title={column.title}>
                      {column.title}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row) => (
              <tr
                key={row.id}
                className={`border-b h-12 last:border-b-0 transition-colors ${row.rowState === 'removed'
                    ? 'bg-red-50/70 opacity-80'
                    : row.changedColumns.length > 0
                      ? 'bg-emerald-100/30'
                      : ''
                  }`}
              >
                {visibleColumns.map((column) => {
                  const columnId = String(column.key || column.id);
                  const isChanged = row.changedColumns.includes(columnId);
                  const isRemoved = row.rowState === 'removed';
                  const beforeAfter = isChanged
                    ? formatBeforeAfter(row.original[columnId], row.values[columnId])
                    : null;
                  return (
                    <td
                      key={columnId}
                      className={`px-4 py-3 align-middle whitespace-nowrap transition-colors ${isRemoved
                          ? 'border-l-2 border-red-400 bg-red-50 text-red-700 line-through'
                          : isChanged
                            ? 'border-l-2 border-emerald-400 bg-emerald-100/70 text-foreground'
                            : 'text-primary'
                        }`}
                    >
                      {isRemoved ? (
                        <span className="block max-w-[140px] truncate" title={String(row.values[columnId] ?? '')}>
                          {formatCell(row.values[columnId])}
                        </span>
                      ) : beforeAfter && typeof beforeAfter === 'object' ? (
                        <div className="min-w-0 space-y-0.5">
                          <div className="max-w-[180px] truncate text-[12px] text-secondary line-through" title={String(row.original[columnId] ?? '')}>
                            {beforeAfter.beforeText}
                          </div>
                          <div className="max-w-[180px] truncate text-sm font-medium text-black" title={String(row.values[columnId] ?? '')}>
                            {beforeAfter.afterText}
                          </div>
                        </div>
                      ) : (
                        <span className="block max-w-[140px] truncate" title={String(row.values[columnId] ?? '')}>
                          {formatCell(row.values[columnId])}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {previewRows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-sm text-secondary" colSpan={Math.max(1, visibleColumns.length)}>
                  No preview rows available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 bg-background px-3 py-3">
        <div className="text-xs text-secondary">
          Page {page + 1} of {totalPages}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={!canGoPrevious}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium text-secondary transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
              const startPage = Math.max(0, Math.min(page - 2, totalPages - 5));
              const pageIndex = startPage + index;
              if (pageIndex >= totalPages) return null;

              return (
                <button
                  key={pageIndex}
                  type="button"
                  onClick={() => setPage(pageIndex)}
                  className={`min-w-9 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${pageIndex === page
                    ? 'bg-card border text-foreground'
                    : 'text-secondary hover:bg-background'
                    }`}
                >
                  {pageIndex + 1}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
            disabled={!canGoNext}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
