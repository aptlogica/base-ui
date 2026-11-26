// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import {
  downloadExportJobService,
  downloadImportLogService,
  exportBaseService,
  getExportDependenciesService,
  getImportJobService,
  importBaseService,
} from './clientService';
import { downloadTextContent } from '../components/modals/importer/importDownload';
import { requestJobsRefresh } from './jobsEvents';

export interface ExportJob {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'expired';
  progress: number;
  file_name?: string;
  download_url?: string;
  error?: string;
}

/** The message of a failed call: the one the server sent (an error of the SDK has a code), or the fallback */
const messageOf = (error: any, fallback: string): string => (typeof error?.code === 'string' && error.message ? error.message : fallback);

/** A call that was cancelled by its AbortSignal fails as an AbortError, as the caller expects */
const abortedOrElse = (error: any, signal: AbortSignal | undefined, make: () => Error): Error =>
  signal?.aborted || error?.code === 'ERR_CANCELED' ? new DOMException('Cancelled', 'AbortError') : make();

/** What the server answers in `data`: the job, or the thing itself */
const dataOf = <T>(res: any): T => (res?.data ?? res) as T;

/** An export that failed: a filter that is not valid comes with the list of what is wrong */
const exportError = (error: any, signal: AbortSignal | undefined): Error =>
  abortedOrElse(error, signal, () => {
    const problems: string[] = Array.isArray(error?.data) ? error.data : [];
    const message = messageOf(error, 'Export failed');
    return new Error(problems.length > 0 ? `${message}: ${problems.join('; ')}` : message);
  });

export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** One condition of a row filter, as the filter builder of a table view makes it. `column` is the id of the field. */
export interface ExportFilterCondition {
  column: string;
  operator: string;
  value: string;
  /** Joins this condition to the ones before it; the first condition has none */
  logic?: 'AND' | 'OR';
}

export type ExportFormat = 'sbase' | 'csv' | 'xlsx' | 'json';
/** the content type of a plain workbook; a zip of the workbook and its files has another */
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export type CsvDelimiter = 'comma' | 'semicolon' | 'tab' | 'pipe';

export interface ExportBaseOptions {
  includeData?: boolean;
  includeAttachments?: boolean;
  includeAutomations?: boolean;
  /** Writes the source columns (id, created / modified time and user) of every row. Needs includeData. */
  includeSystemColumns?: boolean;
  /** The file format: sbase (default), csv (a zip with one file per table) or xlsx (one workbook, one sheet per table;
   * a zip of the workbook and attachments/ when files are included) or json (a zip with one file per table).
   * In csv, xlsx and json links are written as text. */
  format?: ExportFormat;
  /** The field separator of a csv: comma (default), semicolon, tab or pipe. The text is always UTF-8. */
  delimiter?: CsvDelimiter;
  tables?: string[];
  /** Keeps only the rows that match, per table id. Needs includeData. Sent as the body of a POST. */
  filters?: Record<string, ExportFilterCondition[]>;
  /** The base title; names the downloaded file. It is not sent to the server. */
  title?: string;
}

/**
 * "My Base: 2026" -> "My_Base_2026.sbase.zip" (or ".csv.zip"), the same cleaning the server does for its file name. An
 * xlsx export is the plain workbook (".xlsx"), or a zip of the workbook and its attachments/ (".xlsx.zip") when files
 * are included; csv and json exports are always zips (".csv.zip", ".json.zip").
 */
function exportFileName(title?: string, format: ExportFormat = 'sbase', zipped = true): string {
  const name = (title || '').replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'base';
  if (format === 'xlsx') return zipped ? `${name}.xlsx.zip` : `${name}.xlsx`;
  return `${name}.${format}.zip`;
}

/** A field of a table that a row filter can use */
export interface ExportFieldInfo {
  id: string;
  title: string;
  uidt: string;
  /** the choices of a select or multi-select field */
  options?: string[];
}

export interface ExportTableInfo {
  id: string;
  title: string;
  fields?: ExportFieldInfo[];
}

export interface ExportDependency {
  table_id: string;
  table_title: string;
  depends_on_id: string;
  depends_on_title: string;
  kind: 'link' | 'lookup' | 'trigger';
  /** title of the field, trigger or function */
  item: string;
}

export interface ExportDependencies {
  tables: ExportTableInfo[];
  dependencies: ExportDependency[];
}

/** The tables of a base and which table needs which (links, lookups, triggers), for the export dialog's warnings. */
export async function getExportDependencies(baseId: string, signal?: AbortSignal): Promise<ExportDependencies> {
  try {
    const data = dataOf<Partial<ExportDependencies>>(await getExportDependenciesService(baseId, signal));
    return { tables: data.tables || [], dependencies: data.dependencies || [] };
  } catch (e: any) {
    throw abortedOrElse(e, signal, () => new Error(messageOf(e, 'Could not load the tables')));
  }
}

/** What starting an export gives: the file at once (no data), or a background job that the Jobs panel follows */
export type ExportStarted = { kind: 'file' } | { kind: 'job'; job: ExportJob; fallbackFileName: string };

/**
 * Starts the export of a base. Without data the file comes back at once and is saved here. Otherwise a background job is
 * started and returned: no request is made to follow it, because the Jobs panel already asks for the list of jobs while
 * one runs (see trackJob). onProgress gets 100 for a file.
 */
export async function exportBaseAsSbase(
  baseId: string,
  options?: ExportBaseOptions,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<ExportStarted> {
  // Starts the export: the SDK sends the options in the URL, or as a JSON body when there are row filters (too long for a URL)
  let started;
  try {
    started = await exportBaseService(
      baseId,
      {
        includeData: options?.includeData,
        includeAttachments: options?.includeAttachments,
        includeAutomations: options?.includeAutomations,
        includeSystemColumns: options?.includeSystemColumns,
        format: options?.format,
        delimiter: options?.delimiter,
        tables: options?.tables,
        filters: options?.filters,
      },
      signal
    );
  } catch (e) {
    throw exportError(e, signal);
  }

  if (started.kind === 'file') {
    // A direct file download (no background job; a job is always answered with 202). The file is a zip (.sbase.zip,
    // or .csv.zip for a csv), except an xlsx, which is a plain workbook unless it carries files (a zip, which the
    // content type says). It is named here from the base title, because a browser hides the Content-Disposition
    // header of a cross-origin response.
    onProgress?.(100);
    saveBlob(started.blob, exportFileName(options?.title, options?.format, started.blob.type !== XLSX_TYPE));
    return { kind: 'file' };
  }

  requestJobsRefresh(); // the Jobs panel shows the new job at once
  return {
    kind: 'job',
    job: started.job as ExportJob,
    fallbackFileName: exportFileName(options?.title, options?.format, options?.includeAttachments !== false),
  };
}

export interface ImportJob {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  base_id?: string;
  base_title?: string;
  error?: string;
  /** True when the import has an error log to download (rows were left out, there are warnings, or it failed) */
  has_log?: boolean;
  skipped_rows?: number;
  warning_count?: number;
  /** For a completed import: what was created. For an invalid file: { problems: string[] } */
  result?: {
    tables?: number;
    fields?: number;
    views?: number;
    rows?: number;
    attachments?: number;
    warnings?: string[];
    problems?: string[];
    /** A csv import leaves out the rows the database refuses: how many, how many blank and repeated rows the files had,
     * and the text of the error log that names each skipped row and says why */
    skipped_rows?: number;
    empty_rows?: number;
    duplicate_rows?: number;
    error_log?: string;
  };
}

/** Downloads the file of a finished export job (the Jobs panel's Download). */
export async function downloadExportJob(jobId: string, fileName?: string): Promise<void> {
  let file;
  try {
    file = await downloadExportJobService(jobId);
  } catch (e) {
    throw new Error(messageOf(e, 'Could not download the export'));
  }
  saveBlob(file.blob, fileName || 'export.zip');
}

/**
 * Downloads the error log of an import job as a text file: the rows that were left out and the warnings of a finished
 * import, or what went wrong in a failed one. Resolves when the browser has been handed the file.
 */
export async function downloadImportLog(jobId: string): Promise<void> {
  let log;
  try {
    log = await downloadImportLogService(jobId);
  } catch (e) {
    throw new Error(messageOf(e, 'The error log could not be downloaded'));
  }
  downloadTextContent(log.text, log.fileName || 'import_error_rows_report.txt');
}

/**
 * Imports a .sbase.zip file (or a csv or json zip, an .xlsx workbook, or one .json file) as a new base in the workspace: starts the background job and follows it
 * until it is completed or failed. onProgress gets the job percent (0 to 100). Resolves with the finished job; a failed
 * job resolves too (check status), so the caller can show its error and problems.
 */
export async function importBaseFromSbase(
  workspaceId: string,
  file: File | File[],
  options: {
    title?: string;
    includeData?: boolean;
    includeAttachments?: boolean;
    includeAutomations?: boolean;
    includeSystemColumns?: boolean;
    /** sbase (default), csv for a zip of .csv files (one table per file), xlsx for a workbook (one table per sheet) or a zip of one, or json for a zip of .json files (one table per file) */
    format?: ExportFormat;
  },
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
  /** Called once the server has started the job, before it is followed: with its id a dialog that is minimized can hand the job to the Jobs panel */
  onJobStarted?: (job: ImportJob) => void
): Promise<ImportJob> {
  // The SDK builds the form: every file as a file part, the options, and the format (a csv, xlsx or json has no
  // triggers and no system columns, so those options are not sent)
  let started;
  try {
    started = await importBaseService(workspaceId, file, options, signal);
  } catch (e: any) {
    throw abortedOrElse(e, signal, () => {
      // what is wrong with the file comes as a list
      const problems: unknown = Array.isArray(e?.data) ? e.data : e?.details;
      return Object.assign(new Error(messageOf(e, 'Import failed')), { problems: Array.isArray(problems) ? (problems as string[]) : undefined });
    });
  }
  let job = dataOf<ImportJob>(started);
  requestJobsRefresh(); // the Jobs panel shows the new job at once
  onJobStarted?.(job);
  onProgress?.(job.progress ?? 0);

  while (job.status === 'queued' || job.status === 'running') {
    await new Promise((r) => setTimeout(r, 1500));
    if (signal?.aborted) throw new DOMException('Import cancelled', 'AbortError');
    try {
      job = dataOf<ImportJob>(await getImportJobService(job.id, signal));
    } catch (e) {
      throw abortedOrElse(e, signal, () => new Error(messageOf(e, 'Import failed')));
    }
    onProgress?.(job.progress ?? 0);
  }
  return job;
}
