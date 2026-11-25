// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useCallback, useEffect, useRef, useState } from 'react';
import { isActiveJob, listWorkspaceJobs, type TransferJob } from '../service/baseJobsService';
import { JOBS_REFRESH_EVENT } from '../service/jobsEvents';

/** How often the list is asked for again while a job is running: quickly when the panel is open, slowly when it is closed */
export const POLL_OPEN_MS = 2000;
export const POLL_CLOSED_MS = 5000;

/**
 * The jobs (exports and imports) of the selected workspace. The list is loaded when the workspace changes, and asked for
 * again while any job is queued or running; when nothing is running it is not asked for at all, and it pauses while the
 * browser tab is hidden. An export or an import that starts asks for it at once (see requestJobsRefresh).
 */
export function useTransferJobs(workspaceId: string | null | undefined, panelOpen: boolean) {
  const [jobs, setJobs] = useState<TransferJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    if (!workspaceId) return;
    const mine = ++requestId.current;
    try {
      const list = await listWorkspaceJobs(workspaceId);
      // an answer for a workspace that is no longer selected, or an older answer, is dropped
      if (mine !== requestId.current) return;
      setJobs(list);
      setError('');
    } catch (e: any) {
      if (mine !== requestId.current) return;
      setError(e?.message || 'The jobs could not be loaded');
    } finally {
      if (mine === requestId.current) setLoading(false);
    }
  }, [workspaceId]);

  // a new workspace: forget the old list and load the new one
  useEffect(() => {
    requestId.current++;
    setJobs([]);
    setError('');
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh();
  }, [workspaceId, refresh]);

  // an export or an import has just started
  useEffect(() => {
    const onStart = () => void refresh();
    window.addEventListener(JOBS_REFRESH_EVENT, onStart);
    return () => window.removeEventListener(JOBS_REFRESH_EVENT, onStart);
  }, [refresh]);

  // ask again while something is running
  const anyActive = jobs.some(isActiveJob);
  useEffect(() => {
    if (!workspaceId || !anyActive) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      timer = setTimeout(async () => {
        if (!document.hidden) await refresh();
        schedule();
      }, panelOpen ? POLL_OPEN_MS : POLL_CLOSED_MS);
    };
    schedule();
    // coming back to the tab shows the news at once
    const onVisible = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [workspaceId, anyActive, panelOpen, refresh]);

  const runningCount = jobs.filter(isActiveJob).length;
  return { jobs, loading, error, runningCount, refresh };
}
