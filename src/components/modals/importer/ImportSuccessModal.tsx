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
  // The following are for imports that are not a table of rows (a Sereni Base import). When they are not set the popup
  // looks and works as it does for a CSV import.
  /** Figures for the top card, instead of Total Rows and Columns */
  stats?: { label: string; value: number }[];
  /** Leaves out the "Data Quality" section (the counts of rows with errors, empty rows and duplicate rows). When rows
   * were left out and there is a log (errorRows, errorRowsFileContent), a line says so with a link to download the log. */
  hideDataQuality?: boolean;
  /** "failed" shows the popup for an import that did not finish (a red cross, "Import Failed", and the errors). */
  variant?: 'success' | 'failed';
  /** The line under the title; the default is the "Your import is complete for ..." line of a finished import */
  subtitle?: string;
  /** How many warnings the import has; when set, the Data Quality list has a line for them */
  warnings?: number;
  /** The errors of a failed import: the first of them are listed, and the rest are counted (they are all in the log) */
  errors?: string[];
};

/** How many errors of a failed import the popup lists; the others are in the log */
export const MAX_LISTED_ERRORS = 3;

type Props = {
  open: boolean;
  summary: ImportSuccessSummary | null;
  onClose: () => void;
  /** Shows a "Try again" button next to "Close" on the failed popup */
  onRetry?: () => void;
};

export const ImportSuccessModal: React.FC<Props> = ({ open, summary, onClose, onRetry }) => {
  if (!open || !summary) return null;

  const failed = summary.variant === 'failed';
  const errors = summary.errors ?? [];
  const hasLog = Boolean(summary.errorRowsFileContent || summary.errorRowsFilePath);

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
    <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/[0.169] backdrop-blur-sm p-4">
      <button
        type="button"
        aria-label="Close import summary"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div //NOSONAR
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-success-title"
        className="bg-(--color-card) border rounded-xl shadow-2xl w-full max-w-[720px] max-h-[90vh] p-6 relative"
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
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${failed ? 'bg-red-600' : 'bg-green-600'}`}>
            {failed ? <X className="w-10 h-10 text-white" /> : <Check className="w-10 h-10 text-white" />}
          </div>
          <h3 id="import-success-title" className="text-3xl font-semibold text-primary">{failed ? 'Import Failed' : 'Data Imported Successfully'}</h3>
          <p className="mt-2 text-secondary">
            {summary.subtitle ?? `Your import is complete${summary.tableTitle ? ` for "${summary.tableTitle}".` : '.'}`}
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="w-full max-w-[720px] rounded-2xl border bg-background p-6">
            {summary.stats ? (
              <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${summary.stats.length}, minmax(0, 1fr))` }}>
                {summary.stats.map((stat, index) => (
                  <div key={stat.label} className={index > 0 ? 'border-l pl-6' : ''}>
                    <div className="text-xs text-secondary">{stat.label}</div>
                    <div className="mt-1 text-2xl font-semibold text-primary">{stat.value.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            ) : (
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
            )}

            {summary.hideDataQuality && summary.errorRows > 0 && (summary.errorRowsFileContent || summary.errorRowsFilePath) && (
              <div className="mt-6 border-t pt-5 flex items-center justify-between gap-4 text-sm" role="alert">
                <span className="text-amber-700">
                  {summary.errorRows.toLocaleString()} {summary.errorRows === 1 ? 'row was' : 'rows were'} not imported.
                </span>
                <button
                  type="button"
                  onClick={handleDownloadImportLog}
                  className="text-blue-700 hover:underline shrink-0"
                >
                  Download error log
                  <ArrowRight className="inline-block h-5 w-5 ml-2" />
                </button>
              </div>
            )}

            {!summary.hideDataQuality && (
              <div className="mt-6 border-t pt-5">
                <div className="flex items-center justify-between text-sm font-medium text-primary mb-3">
                  <span>Data Quality</span>
                  {hasLog && (
                    <button
                      type="button"
                      onClick={handleDownloadImportLog}
                      className="text-blue-700 hover:underline"
                    >
                      View data import log
                      <ArrowRight className="inline-block h-5 w-5 ml-2" />
                    </button>
                  )}
                </div>
                {failed ? (
                  <ul className="flex flex-col gap-y-2 text-sm text-primary">
                    <li className="text-red-700">{errors.length.toLocaleString()} {errors.length === 1 ? 'error' : 'errors'}</li>
                    {errors.slice(0, MAX_LISTED_ERRORS).map((message, index) => (
                      <li key={`${index}-${message}`} className="pl-4 text-red-700 break-words">{message}</li>
                    ))}
                    {errors.length > MAX_LISTED_ERRORS && (
                      <li className="pl-4 text-secondary">… {(errors.length - MAX_LISTED_ERRORS).toLocaleString()} more (all of them are in the log)</li>
                    )}
                    <li>0 rows imported</li>
                  </ul>
                ) : (
                  <ul className="flex flex-col gap-y-2 text-sm text-primary">
                    <li>{summary.errorRows.toLocaleString()} rows with errors</li>
                    <li>{summary.emptyRows.toLocaleString()} empty rows found</li>
                    <li>{summary.duplicateRows.toLocaleString()} duplicate rows found</li>
                    {summary.warnings !== undefined && (
                      <li>{summary.warnings.toLocaleString()} {summary.warnings === 1 ? 'warning' : 'warnings'}</li>
                    )}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          {failed ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-12 py-3 rounded-xl border bg-card hover:bg-gray-50 text-gray-700 font-medium transition-all"
              >
                Close
              </button>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-12 py-3 rounded-xl bg-brand-600 text-black font-medium transition-all hover:bg-brand-700"
                >
                  Try again
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-16 py-3 rounded-xl bg-brand-600 text-black font-medium transition-all hover:bg-brand-700"
            >
              Okay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
