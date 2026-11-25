// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';
import { Download, Import, X } from 'lucide-react';
import { isActiveJob, type TransferJob } from '../../service/baseJobsService';
import { expiresIn, formatSize, jobChip, jobTitle, statusPill, timeAgo } from './jobsFormat';

export interface JobRowActions {
  onDownloadExport: (job: TransferJob) => void;
  onDownloadLog: (job: TransferJob) => void;
  /** Removes a finished job from the list; the promise ends when the server has answered */
  onRemove: (job: TransferJob) => Promise<void> | void;
}

interface JobRowProps extends JobRowActions {
  job: TransferJob;
  /** The time the row counts from; the panel passes one value so all rows agree */
  now?: number;
}

const ACTION = 'px-2.5 py-1 text-xs font-medium text-green-700 bg-card border border-green-200 rounded-lg hover:bg-gray-50 cursor-pointer';

// The icons are the ones the app already uses: Download for Export (the base menu, the export progress dialog) and Import
// for Import (the "Import Data" button of the home page)

/** What a finished job says about itself, under its name */
const detailLine = (job: TransferJob, now: number): string => {
  const parts: string[] = [];
  if (isActiveJob(job)) {
    parts.push(`Started ${timeAgo(job.created_at, now)}`);
  } else if (job.status === 'completed') {
    parts.push(`Done ${timeAgo(job.created_at, now)}`);
    if (job.type === 'export') {
      parts.push(formatSize(job.size_bytes), expiresIn(job.expires_at, now));
    } else if (job.result) {
      if (job.result.tables !== undefined) parts.push(`${job.result.tables} ${job.result.tables === 1 ? 'table' : 'tables'}`);
      if (job.result.rows !== undefined) parts.push(`${job.result.rows.toLocaleString()} rows`);
      parts.push(expiresIn(job.expires_at, now));
    }
  }
  return parts.filter(Boolean).join(' · ');
};

export const JobRow: React.FC<JobRowProps> = ({ job, now = Date.now(), onDownloadExport, onDownloadLog, onRemove }) => {
  const [showProblems, setShowProblems] = useState(false);
  const [removing, setRemoving] = useState(false);
  const pill = statusPill(job);
  const active = isActiveJob(job);
  const problems = job.result?.problems ?? [];
  const isExport = job.type === 'export';
  // the row goes when the server has deleted the job; until then the button is off, and a failed call turns it back on
  const remove = async () => {
    setRemoving(true);
    try {
      await onRemove(job);
    } catch {
      setRemoving(false);
    }
  };

  return (
    <li className="flex gap-3 px-4 py-3 border-b last:border-b-0" data-testid="job-row">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isExport ? 'bg-blue-50 text-blue-600' : 'bg-violet-50 text-violet-600'}`}
        aria-hidden="true"
      >
        {isExport ? <Download className="w-4 h-4" /> : <Import className="w-4 h-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-primary truncate" title={jobTitle(job)}>{jobTitle(job)}</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 shrink-0">{jobChip(job)}</span>
        </div>

        {job.status === 'failed' ? (
          <p className="mt-0.5 text-xs text-red-600 break-words">{job.error || 'The job failed'}</p>
        ) : (
          <p className="mt-0.5 text-xs text-secondary">{detailLine(job, now)}</p>
        )}

        {active && (
          <div
            className="mt-2 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(job.progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: `${Math.round(job.progress)}%` }} />
          </div>
        )}

        {showProblems && problems.length > 0 && (
          <ul className="mt-2 text-xs text-red-600 list-disc pl-4 space-y-0.5 max-h-32 overflow-y-auto">
            {problems.slice(0, 20).map((problem, index) => <li key={`${index}-${problem}`}>{problem}</li>)}
            {problems.length > 20 && <li className="list-none text-secondary">… {problems.length - 20} more (all of them are in the log)</li>}
          </ul>
        )}

        <div className="mt-2 flex flex-wrap gap-2 empty:hidden">
          {isExport && job.status === 'completed' && <button type="button" className={ACTION} onClick={() => onDownloadExport(job)}>Download</button>}
          {job.status === 'failed' && problems.length > 0 && (
            <button type="button" className={ACTION} onClick={() => setShowProblems((v) => !v)} aria-expanded={showProblems}>
              {showProblems ? 'Hide details' : 'View details'}
            </button>
          )}
          {!isExport && job.has_log && <button type="button" className={ACTION} onClick={() => onDownloadLog(job)}>Download log</button>}
        </div>
      </div>

      <div className="self-start shrink-0 flex items-center gap-1.5">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${pill.className}`}>{pill.label}</span>
        {!active && (
          <button
            type="button"
            onClick={remove}
            disabled={removing}
            title="Remove"
            aria-label={`Remove ${jobTitle(job)}`}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-default"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </li>
  );
};
