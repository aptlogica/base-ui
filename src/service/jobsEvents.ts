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
