// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { isActiveJob, type TransferJob, type TransferJobFormat } from '../../service/baseJobsService';

const FORMAT_LABELS: Record<TransferJobFormat, string> = { sbase: 'Sereni Base', csv: 'CSV', xlsx: 'Excel', json: 'JSON' };

/** "Export · JSON", or just "Export" for a job whose format is not known */
export const jobChip = (job: TransferJob): string => {
  const kind = job.type === 'export' ? 'Export' : 'Import';
  return job.format && FORMAT_LABELS[job.format] ? `${kind} · ${FORMAT_LABELS[job.format]}` : kind;
};

/** What a row is called: the base, or the file when the base is not known yet (an import that is still running) */
export const jobTitle = (job: TransferJob): string =>
  job.base_title?.trim() || job.file_name?.trim() || (job.type === 'export' ? 'Export' : 'Import');

/** "just now", "1 min ago", "3 h ago", "2 days ago" */
export const timeAgo = (iso: string | undefined | null, now: number = Date.now()): string => {
  if (!iso) return '';
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
};

/** "4.2 MB", "310 KB", "12 B" */
export const formatSize = (bytes: number | undefined): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** "expires in 23 h", "expires in 12 min", or '' when there is no expiry or it is over */
export const expiresIn = (iso: string | undefined | null, now: number = Date.now()): string => {
  if (!iso) return '';
  const minutes = Math.round((new Date(iso).getTime() - now) / 60000);
  if (minutes <= 0) return '';
  if (minutes < 60) return `expires in ${minutes} min`;
  return `expires in ${Math.round(minutes / 60)} h`;
};

export type JobTab = 'all' | 'running' | 'completed' | 'failed';

export const matchesTab = (job: TransferJob, tab: JobTab): boolean => {
  if (tab === 'running') return isActiveJob(job);
  if (tab === 'completed') return job.status === 'completed';
  if (tab === 'failed') return job.status === 'failed';
  return true;
};

/** The pill of a row: its words and its colours */
export const statusPill = (job: TransferJob): { label: string; className: string } => {
  switch (job.status) {
    case 'queued':
      return { label: 'Queued', className: 'bg-gray-100 text-gray-600' };
    case 'running':
      return { label: `Running ${Math.round(job.progress)}%`, className: 'bg-green-100 text-green-700' };
    case 'completed':
      return (job.skipped_rows ?? 0) > 0
        ? { label: `Completed · ${job.skipped_rows} skipped`, className: 'bg-amber-100 text-amber-700' }
        : { label: 'Completed', className: 'bg-emerald-50 text-emerald-700' };
    case 'failed':
      return { label: 'Failed', className: 'bg-red-100 text-red-700' };
    default:
      return { label: 'Expired', className: 'bg-gray-100 text-gray-500' };
  }
};
