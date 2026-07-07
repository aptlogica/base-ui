// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { downloadLinkedFile, downloadTextContent } from './importDownload';

export type ImportSuccessSummary = {
  totalRows: number;
  columns: number;
  tableTitle?: string;
  errorRows: number;
  emptyRows: number;
  duplicateRows: number;
  emptyRowsSkipped: number;
  duplicatesRemoved: number;
  errorRowsFilePath?: string;
  errorRowsFileContent?: string;
};

type Props = {
  open: boolean;
  summary: ImportSuccessSummary | null;
  onClose: () => void;
};

export const ImportSuccessModal: React.FC<Props> = ({ open, summary, onClose }) => {
  if (!open || !summary) return null;

  const handleDownloadImportLog = () => {
    const textContent = summary.errorRowsFileContent?.trim();
    if (textContent) {
      downloadTextContent(textContent, 'import_error_rows_report.txt');
      return;
    }

    if (summary.errorRowsFilePath) {
      downloadLinkedFile(summary.errorRowsFilePath);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/[0.169] backdrop-blur-sm p-4">
      <button
        type="button"
        aria-label="Close import summary"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-success-title"
        className="bg-[var(--color-card)] border rounded-xl shadow-2xl w-full max-w-[720px] max-h-[90vh] p-6 relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="text-gray-500 h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h3 id="import-success-title" className="text-3xl font-semibold text-primary">Data Imported Successfully</h3>
          <p className="mt-2 text-secondary">
            Your import is complete{summary.tableTitle ? ` for "${summary.tableTitle}".` : '.'}
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="w-full max-w-[720px] rounded-2xl border bg-background p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-secondary">Total Rows</div>
                <div className="mt-1 text-2xl font-semibold text-primary">{summary.totalRows.toLocaleString()}</div>
              </div>
              <div className="border-l pl-6">
                <div className="text-xs text-secondary">Columns</div>
                <div className="mt-1 text-2xl font-semibold text-primary">{summary.columns.toLocaleString()}</div>
              </div>
            </div>

            <div className="mt-6 border-t pt-5">
              <div className="flex items-center justify-between text-sm font-medium text-primary mb-3">
                <span>Data Quality</span>
                {(summary.errorRowsFileContent || summary.errorRowsFilePath) && (
                  <button
                    type="button"
                    onClick={handleDownloadImportLog}
                    className="text-[var(--color-blue-700)] hover:underline"
                  >
                    View data import log
                    <ArrowRight className="inline-block h-5 w-5 ml-2" />
                  </button>
                )}
              </div>
              <ul className="space-y-2 text-sm text-primary">
                <li>{summary.errorRows.toLocaleString()} rows with errors</li>
                <li>{summary.emptyRows.toLocaleString()} empty rows found</li>
                <li>{summary.duplicateRows.toLocaleString()} duplicate rows found</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center gap-2 px-16 py-3 rounded-xl bg-brand-600 text-black font-medium transition-all hover:bg-brand-700"
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  );
};
