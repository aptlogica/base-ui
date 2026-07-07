// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useMemo } from 'react';
import type { ImportColumnMapping, ImportPreview } from './ImportTypes';
import { Dot } from 'lucide-react';
import { buildImportRowKey, stringifyImportCellValue } from './importCellValue';

type Props = {
  preview: ImportPreview;
  mappings: Record<string, ImportColumnMapping>;
  removeDuplicateRecords?: boolean;
  removeEmptyRows?: boolean;
};

export const ImportDataPreviewGrid: React.FC<Props> = ({
  preview,
  mappings,
  removeDuplicateRecords = false,
  removeEmptyRows = false
}) => {
  const filteredRows = useMemo(() => {
    const rows = preview.rows ?? [];
    const seen = new Set<string>();

    return rows.filter((row) => {
      const values = preview.columns.map((col) => stringifyImportCellValue(row[col.key]).trim());

      const isEmpty = values.every((v) => v === '');
      if (removeEmptyRows && isEmpty) return false;

      if (removeDuplicateRecords) {
        const signature = JSON.stringify(values);
        if (seen.has(signature)) return false;
        seen.add(signature);
      }
      return true;
    })
  }, [preview.rows, preview.columns, removeDuplicateRecords, removeEmptyRows]);

  const visibleColumns = useMemo(() => {
    return preview.columns.filter((c) => mappings[c.key]?.include !== false);
  }, [preview.columns, mappings]);

  const previewRows = useMemo(() => filteredRows.slice(0, 100), [filteredRows]);
  const filteredTotalRows = filteredRows.length;
  const totalRows = preview.totalRows ?? preview.rows.length;

  const formatCell = (value: unknown) => {
    const text = stringifyImportCellValue(value).trim();
    if (text.length <= 96) return text;
    return `${text.slice(0, 93)}...`;
  };

  return (
    <div className="bg-card overflow-hidden h-full">
      <div className="mb-3">
        <div className="text-sm font-semibold text-primary">Data preview</div>
        <div className="text-xs text-secondary mt-1">
          Showing {previewRows.length.toLocaleString()} of {filteredTotalRows.toLocaleString()} rows <Dot className="h-8 w-8 inline-block" /> {totalRows.toLocaleString()} total records in CSV file.
        </div>
      </div>

      <div className="border rounded-xl overflow-auto lg:h-[calc(100vh-243px)] xl:h-[calc(100vh-280px)]">
        <table className="min-w-full table-fixed text-sm">
          <thead className="sticky top-0 bg-gray-100 border-b">
            <tr>
              {visibleColumns.map((col) => (
                <th key={col.key} className="text-left px-4 py-3 font-medium text-secondary whitespace-nowrap">
                  <span className="block max-w-[130px] truncate" title={col.label}>
                    {mappings[col.key]?.sourceName || col.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, rowIndex) => (
              <tr
                key={buildImportRowKey(row, visibleColumns, rowIndex)}
                className="border-b last:border-b-0 px-4 py-3 h-11">
                {visibleColumns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-primary whitespace-nowrap">
                    <span className="block max-w-[130px] truncate" title={stringifyImportCellValue(row?.[col.key])}>
                      {formatCell(row?.[col.key])}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
            {previewRows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-secondary" colSpan={Math.max(1, visibleColumns.length)}>
                  No preview rows available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
