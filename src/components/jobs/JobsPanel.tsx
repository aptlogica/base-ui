// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { TransferJob } from '../../service/baseJobsService';
import { JobRow, type JobRowActions } from './JobRow';
import { matchesTab, type JobTab } from './jobsFormat';

interface JobsPanelProps extends JobRowActions {
  workspaceName?: string;
  jobs: TransferJob[];
  loading: boolean;
  error: string;
  onRetry: () => void;
}

const TABS: { id: JobTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'running', label: 'Running' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed', label: 'Failed' },
];

/** The content of the Jobs popover: the exports and imports of the workspace, with tabs, newest first */
export const JobsPanel: React.FC<JobsPanelProps> = ({ workspaceName, jobs, loading, error, onRetry, ...actions }) => {
  const [tab, setTab] = useState<JobTab>('all');
  const counts = useMemo(() => {
    const out: Record<JobTab, number> = { all: jobs.length, running: 0, completed: 0, failed: 0 };
    for (const job of jobs) {
      for (const id of ['running', 'completed', 'failed'] as const) if (matchesTab(job, id)) out[id]++;
    }
    return out;
  }, [jobs]);
  const shown = useMemo(() => jobs.filter((job) => matchesTab(job, tab)), [jobs, tab]);
  const now = Date.now();

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h2 className="text-sm font-semibold text-primary truncate">Background Jobs{workspaceName ? ` · ${workspaceName}` : ''}</h2>
      </div>

      <div className="flex gap-1.5 px-4 py-2.5 border-b shrink-0" role="tablist" aria-label="Filter jobs">
        {TABS.map((t) => {
          const count = counts[t.id];
          const selected = tab === t.id;
          // the count shows only when there is something: green for the selected tab and for running jobs, red for failed ones
          let pill = 'bg-gray-300 text-gray-800';
          if (selected || (t.id === 'running' && count > 0)) pill = 'bg-green-600 text-white';
          else if (t.id === 'failed' && count > 0) pill = 'bg-red-600 text-white';
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={count > 0 ? `${t.label} ${count}` : t.label}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg cursor-pointer ${selected ? 'bg-green-100 text-green-800 font-semibold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t.label}
              {count > 0 && (
                <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold inline-flex items-center justify-center ${pill}`} data-testid={`jobs-tab-count-${t.id}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="overflow-y-auto min-h-0">
        {error && (
          <div className="px-4 py-3 text-sm text-red-600 flex items-center justify-between gap-3" role="alert">
            <span>{error}</span>
            <button type="button" onClick={onRetry} className="text-xs font-medium text-green-700 hover:underline shrink-0">Try again</button>
          </div>
        )}
        {loading && jobs.length === 0 && !error && (
          <div className="flex items-center gap-2 px-4 py-6 text-sm text-secondary">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading jobs…
          </div>
        )}
        {!loading && !error && shown.length === 0 && (
          <p className="px-4 py-8 text-sm text-center text-secondary">
            {jobs.length === 0 ? 'No jobs in this workspace yet.' : 'No jobs here.'}
          </p>
        )}
        {shown.length > 0 && (
          <ul aria-label="Jobs">
            {shown.map((job) => <JobRow key={job.id} job={job} now={now} {...actions} />)}
          </ul>
        )}
      </div>

      <div className="px-4 py-2 border-t text-xs text-secondary bg-gray-50 shrink-0">Finished jobs are removed after a while.</div>
    </div>
  );
};
