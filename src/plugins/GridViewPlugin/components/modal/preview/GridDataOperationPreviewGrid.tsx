// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Dot, Check, Trash2, Eraser, Loader2 } from 'lucide-react';
import type { GridColumn } from '../../../types/grid.types';
import type { GridDataOperationPreviewResult, GridScanProgress } from '../shared/gridDataOperation.types';
import { filterGridDataOperationColumns } from '../shared/gridColumnIdentity';

interface GridDataOperationPreviewGridProps {
  columns: GridColumn[];
  preview: GridDataOperationPreviewResult;
  scanProgress?: GridScanProgress | null;
  onRowAction?: (rowId: string, action: 'keep' | 'delete' | 'clear') => void;
}

const stringifyCellValue = (value: unknown) => {
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

const formatCell = (value: unknown) => {
  const text = stringifyCellValue(value);
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
const GROUPS_PAGE_SIZE = 5;

const getRowClassName = (row: GridDataOperationPreviewResult['previewRows'][number], isGroupView = false) => {
  if (row.rowState === 'removed') {
    return 'bg-red-50/70 opacity-80';
  }
  if (row.changedColumns.length > 0 || row.rowState === 'changed') {
    return 'bg-emerald-100/30';
  }
  if (isGroupView && row.rowState === 'kept') {
    return 'bg-emerald-50/40 dark:bg-emerald-950/20';
  }
  return '';
};

const getCellClassName = (isRemoved: boolean, isChanged: boolean, _isGroupView = false) => {
  if (isRemoved) {
    return 'border-l-2 border-red-400 bg-red-50 text-red-700 line-through';
  }
  if (isChanged) {
    return 'border-l-2 border-emerald-400 bg-emerald-100/70 text-foreground';
  }
  return 'text-primary';
};

const renderCellContent = (
  isRemoved: boolean,
  beforeAfter: { beforeText: string; afterText: string } | string | null,
  row: GridDataOperationPreviewResult['previewRows'][number],
  columnId: string
) => {
  if (isRemoved) {
    return (
      <span className="block max-w-[140px] truncate" title={stringifyCellValue(row.values[columnId])}>
        {formatCell(row.values[columnId])}
      </span>
    );
  }

  if (beforeAfter && typeof beforeAfter === 'object') {
    return (
      <div className="min-w-0 space-y-0.5">
        <div className="max-w-[180px] truncate text-[12px] text-secondary line-through" title={stringifyCellValue(row.original[columnId])}>
          {beforeAfter.beforeText}
        </div>
        <div className="max-w-[180px] truncate text-sm font-medium text-black" title={stringifyCellValue(row.values[columnId])}>
          {beforeAfter.afterText}
        </div>
      </div>
    );
  }

  return (
    <span className="block max-w-[140px] truncate" title={stringifyCellValue(row.values[columnId])}>
      {formatCell(row.values[columnId])}
    </span>
  );
};

export const GridDataOperationPreviewGrid: React.FC<GridDataOperationPreviewGridProps> = ({
  columns,
  preview,
  scanProgress,
  onRowAction,
}) => {
  const [page, setPage] = useState(0);
  const visibleColumns = filterGridDataOperationColumns(columns);

  const isFuzzy = preview.actionId === 'fuzzy_deduplication';

  const groupedDuplicates = useMemo(() => {
    if (!isFuzzy) return null;
    const groups: Record<string, typeof preview.previewRows> = {};
    preview.previewRows.forEach((row) => {
      if (row.groupId) {
        if (!groups[row.groupId]) {
          groups[row.groupId] = [];
        }
        groups[row.groupId].push(row);
      }
    });
    return Object.values(groups);
  }, [isFuzzy, preview.previewRows]);

  const totalPages = Math.max(
    1,
    Math.ceil((isFuzzy && groupedDuplicates ? groupedDuplicates.length : preview.previewRows.length) / (isFuzzy ? GROUPS_PAGE_SIZE : PAGE_SIZE))
  );

  useEffect(() => {
    setPage(0);
  }, [preview.actionId, preview.previewRows.length]);

  const previewRows = useMemo(() => {
    if (isFuzzy) return null;
    const start = page * PAGE_SIZE;
    return preview.previewRows.slice(start, start + PAGE_SIZE);
  }, [isFuzzy, page, preview.previewRows]);

  const displayedGroups = useMemo(() => {
    if (!groupedDuplicates) return null;
    const start = page * GROUPS_PAGE_SIZE;
    return groupedDuplicates.slice(start, start + GROUPS_PAGE_SIZE);
  }, [groupedDuplicates, page]);

  const startRow = preview.previewRows.length === 0 ? 0 : page * (isFuzzy ? GROUPS_PAGE_SIZE : PAGE_SIZE) + 1;
  const endRow = Math.min(
    preview.previewRows.length,
    (page + 1) * (isFuzzy ? GROUPS_PAGE_SIZE : PAGE_SIZE)
  );
  const canGoPrevious = page > 0;
  const canGoNext = page < totalPages - 1;

  return (
    <div className="flex min-h-0 max-h-[calc(100vh-20vh)] flex-col overflow-hidden bg-card">
      {scanProgress && preview.actionId === 'fuzzy_deduplication' && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50/90 px-4 py-2.5 text-xs text-emerald-900 shadow-2xs dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
          <div className="flex items-center gap-2 font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
            {scanProgress.scannedRows >= scanProgress.totalRows && scanProgress.totalRows > 0 ? (
              <span>
                Scanning complete (<strong className="font-bold">{scanProgress.duplicatesDetected.toLocaleString()}</strong> duplicates detected) • Preparing preview...
              </span>
            ) : (
              <>
                <span>
                  Scanning rows: <strong className="font-bold">{scanProgress.scannedRows.toLocaleString()}</strong> / {scanProgress.totalRows.toLocaleString()}
                </span>
                <span className="text-emerald-400">•</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                  <strong className="font-bold">{scanProgress.duplicatesDetected.toLocaleString()}</strong> duplicates detected
                </span>
              </>
            )}
          </div>
          <div className="h-2 w-36 overflow-hidden rounded-full bg-emerald-200/80 dark:bg-emerald-800/80">
            <div
              className="h-2 rounded-full bg-emerald-600 transition-all duration-75 dark:bg-emerald-400"
              style={{
                width: `${Math.min(100, Math.round((scanProgress.scannedRows / (scanProgress.totalRows || 1)) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-primary">Data preview</div>
          <div className="mt-1 text-xs text-secondary">
            {isFuzzy && groupedDuplicates ? (
              <>
                Showing {groupedDuplicates.length.toLocaleString()} similarity groups ({preview.affectedRows.toLocaleString()} duplicate records detected)
              </>
            ) : (
              <>
                Showing {startRow.toLocaleString()}-{endRow.toLocaleString()} of {preview.totalRows.toLocaleString()} rows
                <Dot className="inline-block h-8 w-8 align-middle" />
                {preview.affectedRows.toLocaleString()} rows affected
              </>
            )}
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

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border bg-background p-4 space-y-4">
        {isFuzzy && displayedGroups ? (
          displayedGroups.map((group, groupIdx) => {
            const keeper = group.find((r) => r.rowState === 'kept') || group[0];
            return (
              <div key={keeper.id} className="border rounded-xl p-4 bg-background shadow-sm border-border/80">
                <div className="flex items-center justify-between border-b pb-2 mb-3">
                  <span className="text-sm font-semibold text-primary">
                    Similarity Group {page * GROUPS_PAGE_SIZE + groupIdx + 1}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                    {group.length} records
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left">
                    <thead>
                      <tr className="border-b bg-gray-50 text-secondary">
                        <th className="px-3 py-2 font-medium w-[240px]">Resolution Action</th>
                        {visibleColumns.map((col) => (
                          <th key={String(col.key || col.id)} className="px-3 py-2 font-medium">
                            {col.title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.map((row) => {
                        const isRemoved = row.rowState === 'removed';
                        const isChanged = row.rowState === 'changed';
                        const isChecked = isRemoved || isChanged;

                        return (
                          <tr key={row.id} className={`border-b last:border-0 h-10 ${getRowClassName(row, true)}`}>
                            <td className="px-3 py-1.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      onRowAction?.(row.id, preview.duplicateAction === 'remove_duplicates' ? 'clear' : 'delete');
                                    } else {
                                      onRowAction?.(row.id, 'keep');
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                  title={isChecked ? "Ticked: Record marked for delete or clear" : "Unticked: Record is kept"}
                                />
                                {isChecked ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => onRowAction?.(row.id, 'delete')}
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all ${isRemoved
                                        ? 'bg-red-600 border-red-600 text-white shadow-xs'
                                        : 'bg-background text-foreground hover:bg-foreground/10 border-border'
                                        }`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Delete</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onRowAction?.(row.id, 'clear')}
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all ${isChanged
                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                        : 'bg-background text-foreground hover:bg-foreground/10 border-border'
                                        }`}
                                    >
                                      <Eraser className="w-3 h-3" />
                                      <span>Clear Cells</span>
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Kept</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            {visibleColumns.map((column) => {
                              const columnId = String(column.key || column.id);
                              const isCellChanged = row.changedColumns.includes(columnId);
                              const beforeAfter = isCellChanged
                                ? formatBeforeAfter(row.original[columnId], row.values[columnId])
                                : null;
                              return (
                                <td
                                  key={columnId}
                                  className={`px-3 py-1.5 align-middle whitespace-nowrap ${getCellClassName(isRemoved, isCellChanged, true)}`}
                                >
                                  {renderCellContent(isRemoved, beforeAfter, row, columnId)}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        ) : previewRows ? (
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
                  className={`border-b h-12 last:border-b-0 transition-colors ${getRowClassName(row)}`}
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
                        className={`px-4 py-3 align-middle whitespace-nowrap transition-colors ${getCellClassName(isRemoved, isChanged)}`}
                      >
                        {renderCellContent(isRemoved, beforeAfter, row, columnId)}
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
        ) : null}
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
