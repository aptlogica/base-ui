// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { getStoredToken } from './clientService';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';
const API = `${API_BASE_URL}/api/v1`;

export interface ExportJob {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'expired';
  progress: number;
  file_name?: string;
  download_url?: string;
  error?: string;
}

async function authFetch(path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<Response> {
  const token = await getStoredToken();
  return fetch(`${API}${path}`, {
    ...init,
    signal,
    headers: { ...(init.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

async function readJob(res: Response): Promise<ExportJob> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // a filter that is not valid comes with the list of what is wrong
    const problems: string[] = Array.isArray(body?.data) ? body.data : [];
    const message = body?.error?.message || body?.message || 'Export failed';
    throw new Error(problems.length > 0 ? `${message}: ${problems.join('; ')}` : message);
  }
  return (body?.data ?? body) as ExportJob;
}

function saveBlob(blob: Blob, fileName: string) {
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

export type ExportFormat = 'sbase' | 'csv' | 'xlsx';
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
   * a zip of the workbook and attachments/ when files are included). In csv and xlsx links are written as text. */
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
 * are included: `zipped` says which.
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
  const res = await authFetch(`/base/${baseId}/export-dependencies`, {}, signal);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message || body?.message || 'Could not load the tables');
  const data = (body?.data ?? body) as Partial<ExportDependencies>;
  return { tables: data.tables || [], dependencies: data.dependencies || [] };
}

/**
 * Exports a base as a .sbase.zip: starts the background job (or downloads directly when without data),
 * follows its progress and downloads the file when done. onProgress gets the job percent (0 to 100).
 */
export async function exportBaseAsSbase(
  baseId: string,
  options?: ExportBaseOptions,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<void> {
  const params = new URLSearchParams();
  if (options?.includeData !== undefined) {
    params.set('include_data', String(options.includeData));
  } else {
    params.set('include_data', 'true');
  }
  if (options?.includeAttachments !== undefined) {
    params.set('include_attachments', String(options.includeAttachments));
  }
  if (options?.includeAutomations !== undefined) {
    params.set('include_automations', String(options.includeAutomations));
  }
  if (options?.includeSystemColumns !== undefined) {
    params.set('include_system_columns', String(options.includeSystemColumns));
  }
  if (options?.format && options.format !== 'sbase') {
    params.set('format', options.format);
    if (options.delimiter) params.set('delimiter', options.delimiter);
  }
  if (options?.tables && options.tables.length > 0) {
    params.set('tables', options.tables.join(','));
  }
  const query = params.toString() ? `?${params.toString()}` : '';

  // Filters are too long for a URL, so an export with filters is a POST with the options in a JSON body
  const filters = Object.fromEntries(Object.entries(options?.filters || {}).filter(([, conditions]) => conditions.length > 0));
  const initialRes = Object.keys(filters).length > 0
    ? await authFetch(`/base/${baseId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          include_data: options?.includeData ?? true,
          include_attachments: options?.includeAttachments,
          include_automations: options?.includeAutomations,
          include_system_columns: options?.includeSystemColumns,
          format: options?.format && options.format !== 'sbase' ? options.format : undefined,
          delimiter: options?.format && options.format !== 'sbase' ? options.delimiter : undefined,
          tables: options?.tables,
          filters: Object.fromEntries(Object.entries(filters).map(([table, conditions]) => [table, { conditions }])),
        }),
      }, signal)
    : await authFetch(`/base/${baseId}/export${query}`, {}, signal);
  if (initialRes.status === 200) {
    // A direct file download (no background job; a job is always answered with 202). The file is a zip (.sbase.zip,
    // or .csv.zip for a csv), except an xlsx, which is a plain workbook unless it carries files (a zip, which the
    // content type says). It is named here from the base title, because a browser hides the Content-Disposition
    // header of a cross-origin response.
    const blob = await initialRes.blob();
    onProgress?.(100);
    saveBlob(blob, exportFileName(options?.title, options?.format, blob.type !== XLSX_TYPE));
    return;
  }

  let job = await readJob(initialRes);
  onProgress?.(job.progress ?? 0);

  while (job.status === 'queued' || job.status === 'running') {
    await new Promise((r) => setTimeout(r, 1500));
    if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
    job = await readJob(await authFetch(`/export-job/${job.id}`, {}, signal));
    onProgress?.(job.progress ?? 0);
  }
  if (job.status !== 'completed') {
    throw new Error(job.error || (job.status === 'expired' ? 'The export has expired' : 'Export failed'));
  }

  const res = await authFetch(`/export-job/${job.id}/download`, {}, signal);
  if (!res.ok) {
    throw new Error('Could not download the export');
  }
  saveBlob(await res.blob(), job.file_name || exportFileName(undefined, options?.format, options?.includeAttachments !== false));
}

export interface ImportJob {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  base_id?: string;
  base_title?: string;
  error?: string;
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

/**
 * Imports a .sbase.zip file (or a csv zip, or an .xlsx workbook) as a new base in the workspace: starts the background job and follows it
 * until it is completed or failed. onProgress gets the job percent (0 to 100). Resolves with the finished job; a failed
 * job resolves too (check status), so the caller can show its error and problems.
 */
export async function importBaseFromSbase(
  workspaceId: string,
  file: File,
  options: {
    title?: string;
    includeData?: boolean;
    includeAttachments?: boolean;
    includeAutomations?: boolean;
    includeSystemColumns?: boolean;
    /** sbase (default), csv for a zip of .csv files (one table per file), or xlsx for a workbook (one table per sheet) or a zip of one */
    format?: ExportFormat;
  },
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<ImportJob> {
  const form = new FormData();
  form.append('file', file);
  if (options.title?.trim()) form.append('title', options.title.trim());
  form.append('include_data', String(options.includeData ?? true));
  form.append('include_attachments', String(options.includeAttachments ?? true));
  if (options.format && options.format !== 'sbase') {
    // a csv or xlsx has no triggers and no system columns, so those options are not sent
    form.append('format', options.format);
  } else {
    // needs the automations permission; the server refuses the import without it
    form.append('include_automations', String(options.includeAutomations ?? false));
    // restores id, created / modified time and user of the rows; needs the data
    form.append('include_system_columns', String((options.includeSystemColumns ?? false) && (options.includeData ?? true)));
  }

  const res = await authFetch(`/workspace/${workspaceId}/import-base`, { method: 'POST', body: form }, signal);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const problems: string[] | undefined = body?.data || body?.error?.details;
    const message = body?.error?.message || body?.message || 'Import failed';
    throw Object.assign(new Error(message), { problems: Array.isArray(problems) ? problems : undefined });
  }
  let job = (body?.data ?? body) as ImportJob;
  onProgress?.(job.progress ?? 0);

  while (job.status === 'queued' || job.status === 'running') {
    await new Promise((r) => setTimeout(r, 1500));
    if (signal?.aborted) throw new DOMException('Import cancelled', 'AbortError');
    const poll = await authFetch(`/import-job/${job.id}`, {}, signal);
    const pollBody = await poll.json().catch(() => ({}));
    if (!poll.ok) throw new Error(pollBody?.error?.message || pollBody?.message || 'Import failed');
    job = (pollBody?.data ?? pollBody) as ImportJob;
    onProgress?.(job.progress ?? 0);
  }
  return job;
}

