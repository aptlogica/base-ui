// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com

/** The event that tells the Jobs panel to ask for its list again: an export or an import has just started. */
export const JOBS_REFRESH_EVENT = 'transfer-jobs:refresh';

export const requestJobsRefresh = (): void => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(JOBS_REFRESH_EVENT));
};

/** The event that says an export or an import was left running in the background (its dialog was closed) */
export const JOBS_FLY_EVENT = 'transfer-jobs:fly';

export interface JobsFlyDetail {
  kind: 'export' | 'import';
  /** Where the animation starts, in window coordinates; the middle of the window when not given */
  from?: { x: number; y: number };
}

/** An export or an import carries on in the background: the Jobs icon shows it, like a browser's download icon does */
export const announceJobInBackground = (kind: JobsFlyDetail['kind']): void => {
  if (typeof window === 'undefined') return;
  const detail: JobsFlyDetail = { kind, from: { x: window.innerWidth / 2, y: window.innerHeight / 2 } };
  window.dispatchEvent(new CustomEvent<JobsFlyDetail>(JOBS_FLY_EVENT, { detail }));
};

/** A job started by this page whose result the page will tell when it finishes (a message, the download of an export file) */
export interface TrackedJob {
  id: string;
  type: 'export' | 'import';
  /** The title of the base, for the message */
  title?: string;
  /** The name to save an export file under when the server gives none */
  fileName?: string;
}

/** The event that says a job is now followed: the Jobs panel then looks for its end */
export const JOBS_TRACK_EVENT = 'transfer-jobs:track';

const tracked = new Map<string, TrackedJob>();

/**
 * Follow a job in the background. No request is made for it here: the Jobs panel already asks for the list of jobs while
 * any of them runs, and tells the page when a followed job has finished (see claimFinishedJobs).
 */
export const trackJob = (job: TrackedJob): void => {
  tracked.set(job.id, job);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(JOBS_TRACK_EVENT));
    requestJobsRefresh();
  }
};

/** Takes the followed jobs that have ended (completed, failed or expired) out of the list: each one is answered once */
export const claimFinishedJobs = <J extends { id: string; status: string }>(jobs: J[]): { tracked: TrackedJob; job: J }[] => {
  const ended: { tracked: TrackedJob; job: J }[] = [];
  for (const job of jobs) {
    const meta = tracked.get(job.id);
    if (meta && (job.status === 'completed' || job.status === 'failed' || job.status === 'expired')) {
      tracked.delete(job.id);
      ended.push({ tracked: meta, job });
    }
  }
  return ended;
};

/** For tests: forget every followed job */
export const clearTrackedJobs = (): void => tracked.clear();
