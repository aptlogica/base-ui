// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { ArrowDownUp, Check } from 'lucide-react';
import { useNavigationStore } from '../../stores/navigationStore';
import { useTransferJobs } from '../../hooks/useTransferJobs';
import { downloadExportJob, downloadImportLog } from '../../service/baseExportService';
import { deleteJob, type TransferJob } from '../../service/baseJobsService';
import { JOBS_FLY_EVENT, type JobsFlyDetail } from '../../service/jobsEvents';
import { useToast } from '../common/Toast';
import { JobFlyer, type Flyer } from './JobFlyer';
import { JobsPanel } from './JobsPanel';

const PANEL_WIDTH = 440;
const MARGIN = 12;
/** How long the check shows on the icon after a job has finished */
const DONE_MS = 2500;

/** The home page is /workspace and /workspace/<id>; every other page of the app has more in its path */
export const isHomePath = (pathname: string): boolean => /^\/workspace(\/[^/]+)?\/?$/.test(pathname);

/**
 * The Jobs icon of the header, on the left of the settings icon, on the home page only: a badge with the number of jobs running in the selected workspace, and a popover under it
 * that lists the exports and imports of the workspace.
 */
const JobsButton: React.FC = () => {
  const { selectedWorkspaceId } = useNavigationStore();
  const { pathname } = useLocation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const { jobs, loading, error, runningCount, refresh } = useTransferJobs(selectedWorkspaceId, open);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const flyerId = useRef(0);
  const [justDone, setJustDone] = useState(false);
  const previousRunning = useRef<number | null>(null);

  // a short pop of the icon, for a job that has arrived or finished
  const pop = useCallback(() => {
    const el = buttonRef.current;
    if (el && typeof el.animate === 'function' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
    }
  }, []);

  // an export or an import was left running in the background: its icon flies into this one
  useEffect(() => {
    const onFly = (e: Event) => {
      const detail = (e as CustomEvent<JobsFlyDetail>).detail;
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!detail || !rect) return;
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        pop();
        return;
      }
      const from = detail.from ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const to = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      setFlyers((list) => [...list, { id: ++flyerId.current, kind: detail.kind, from, to }]);
    };
    window.addEventListener(JOBS_FLY_EVENT, onFly);
    return () => window.removeEventListener(JOBS_FLY_EVENT, onFly);
  }, [pop]);

  const flyerDone = useCallback((flyer: Flyer) => {
    setFlyers((list) => list.filter((f) => f.id !== flyer.id));
    pop();
  }, [pop]);

  // a job finished: the icon pops and shows a check for a moment
  useEffect(() => {
    const before = previousRunning.current;
    previousRunning.current = runningCount;
    if (before === null || runningCount >= before) return;
    pop();
    setJustDone(true);
    const timer = setTimeout(() => setJustDone(false), DONE_MS);
    return () => clearTimeout(timer);
  }, [runningCount, pop]);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; right: number; width: number; maxHeight: number } | null>(null);

  // the popover sits under the icon, with its right edge on the icon's, and stays inside the window
  const place = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(PANEL_WIDTH, window.innerWidth - MARGIN * 2);
    const top = rect.bottom + 8;
    const right = Math.max(MARGIN, window.innerWidth - rect.right);
    setPosition({ top, right: Math.min(right, window.innerWidth - width - MARGIN), width, maxHeight: Math.max(240, window.innerHeight - top - MARGIN) });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  // a click outside, or Escape, closes it
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // opening the panel shows the latest state at once
  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const run = async (action: () => Promise<void>, what: string) => {
    try {
      await action();
    } catch (e: any) {
      toast.error(e?.message || what);
    }
  };

  // it belongs to the home page: /workspace and /workspace/<id>, not a page of a base, a table or the settings
  if (!selectedWorkspaceId || !isHomePath(pathname)) return null;

  const running = runningCount > 0;
  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={running ? `Jobs, ${runningCount} running` : 'Jobs'}
        title="Jobs"
        className={`relative p-2 rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ring-color-primary) focus-visible:ring-offset-2 ${
          open
            ? 'bg-green-200 border-green-200 text-green-600'
            : running
              ? 'bg-green-50 border-green-200 text-green-600'
              : 'bg-card border-gray-200 text-gray-500 hover:bg-(--color-gray-100) hover:text-black'
        }`}
      >
        <ArrowDownUp className="w-5 h-5 relative" />
        {running && (
          <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-green-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white" data-testid="jobs-badge">
            {runningCount}
          </span>
        )}
        {!running && justDone && (
          <span className="absolute -top-2 -right-2.5 w-[18px] h-[18px] rounded-full bg-green-600 text-white flex items-center justify-center border-2 border-white" data-testid="jobs-done">
            <Check className="w-3 h-3" strokeWidth={3} />
          </span>
        )}
      </button>
      {flyers.map((flyer) => <JobFlyer key={flyer.id} flyer={flyer} onDone={flyerDone} />)}

      {open && position && createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Jobs"
          className="fixed z-[60] flex flex-col bg-card border rounded-2xl shadow-2xl overflow-hidden"
          style={{ top: position.top, right: position.right, width: position.width, maxHeight: position.maxHeight }}
        >
          <JobsPanel
            jobs={jobs}
            loading={loading}
            error={error}
            onRetry={() => void refresh()}
            onDownloadExport={(job: TransferJob) => void run(() => downloadExportJob(job.id, job.file_name), 'Could not download the export')}
            onDownloadLog={(job: TransferJob) => void run(() => downloadImportLog(job.id), 'Could not download the log')}
            onRemove={async (job: TransferJob) => { await deleteJob(job); await refresh(); }}
          />
        </div>,
        document.body,
      )}
    </>
  );
};

export default JobsButton;
