// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { downloadExportJob } from '../service/baseExportService';
import type { TransferJob } from '../service/baseJobsService';
import { claimFinishedJobs, JOBS_TRACK_EVENT } from '../service/jobsEvents';
import { invalidateBaseQueries } from '../utils/queryInvalidation';

/**
 * Acts on the jobs this page left running in the background (see trackJob), from the list of jobs the Jobs panel already
 * asks for, so a job needs no requests of its own. There is no message:
 *  - an import that is done (completed or failed) refreshes the list of bases;
 *  - an export that is ready is downloaded.
 */
export function useJobCompletionNotices(jobs: TransferJob[], workspaceId: string | null | undefined): void {
  const queryClient = useQueryClient();
  // a job that is followed from now on: look at the list again
  const [trackedCount, setTrackedCount] = useState(0);

  useEffect(() => {
    const onTrack = () => setTrackedCount((n) => n + 1);
    window.addEventListener(JOBS_TRACK_EVENT, onTrack);
    return () => window.removeEventListener(JOBS_TRACK_EVENT, onTrack);
  }, []);

  useEffect(() => {
    for (const { tracked, job } of claimFinishedJobs(jobs)) {
      if (tracked.type === 'import') {
        invalidateBaseQueries(queryClient, job.workspace_id || workspaceId);
      } else if (job.status === 'completed') {
        // a failed export has nothing to download; the Jobs panel shows its error
        void downloadExportJob(job.id, job.file_name || tracked.fileName).catch(() => {});
      }
    }
  }, [jobs, trackedCount, queryClient, workspaceId]);
}
