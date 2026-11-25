// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { authFetch } from './baseExportService';

export type TransferJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'expired';
export type TransferJobFormat = 'sbase' | 'csv' | 'xlsx' | 'json';

/** An export or an import of a base, as the server lists it for a workspace */
export interface TransferJob {
  id: string;
  type: 'export' | 'import';
  /** Empty for a job whose format the server does not know (a job from before it was kept) */
  format?: TransferJobFormat;
  base_id?: string;
  base_title?: string;
  workspace_id?: string;
  status: TransferJobStatus;
  progress: number;
  file_name?: string;
  size_bytes?: number;
  error?: string;
  /** For an import: what was created, and the problems of a file that is not valid. The text of the log is not in the list. */
  result?: {
    tables?: number;
    fields?: number;
    rows?: number;
    problems?: string[];
    warnings?: string[];
  };
  expires_at?: string | null;
  created_at: string;
  download_url?: string;
  /** An import with rows left out, warnings or a failure has a log to download */
  has_log?: boolean;
  skipped_rows?: number;
  warning_count?: number;
}

/** A job that is still working */
export const isActiveJob = (job: Pick<TransferJob, 'status'>): boolean => job.status === 'queued' || job.status === 'running';

/**
 * The exports and imports of a workspace that belong to the logged-in user, newest first. Jobs that have expired are
 * not listed.
 */
export async function listWorkspaceJobs(workspaceId: string, signal?: AbortSignal): Promise<TransferJob[]> {
  const res = await authFetch(`/workspace/${workspaceId}/transfer-jobs`, {}, signal);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error?.message || body?.message || 'The jobs could not be loaded');
  }
  const list = body?.data ?? body;
  return Array.isArray(list) ? (list as TransferJob[]) : [];
}
