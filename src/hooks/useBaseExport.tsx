// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useCallback, useRef, useState } from 'react';
import { useToast } from '../components/common/Toast';
import { exportBaseAsSbase, type ExportBaseOptions, type ExportFormat } from '../service/baseExportService';
import { ExportProgressModal } from '../components/modals/ExportProgressModal';
import { ExportSbaseModal } from '../components/modals/ExportSbaseModal';
import type { BaseExportFormat } from '../components/common/BaseMenu';

interface ExportState {
  title: string;
  percent: number;
  state: 'running' | 'done' | 'failed';
  error?: string;
}

/**
 * Returns the handler of the base menu's Export items and the export dialogs (filter options + progress)
 * to render next to the menu.
 */
export function useBaseExport() {
  const toast = useToast();
  const [filterBase, setFilterBase] = useState<{ id: string; title?: string; name?: string } | null>(null);
  const [filterFormat, setFilterFormat] = useState<ExportFormat>('sbase');
  const [exp, setExp] = useState<ExportState | null>(null);
  // Every export is followed by its own run. Only the run the progress dialog shows is "attached": closing the dialog
  // while an export runs detaches it, so it carries on in the background (a message tells the result) and another
  // export can be started.
  const runCounter = useRef(0);
  const attachedRun = useRef<number | null>(null);

  const exportBase = useCallback((base: { id: string; title?: string; name?: string }, format: BaseExportFormat) => {
    // Open the filter modal instead of exporting directly. The Excel item exports an .xlsx.
    setFilterFormat(format === 'excel' ? 'xlsx' : format);
    setFilterBase(base);
  }, [toast]);

  const startExportWithOptions = useCallback(async (options: ExportBaseOptions) => {
    if (!filterBase) return;
    const base = filterBase;
    setFilterBase(null);

    const title = base.title || base.name || 'base';
    const runId = ++runCounter.current;
    attachedRun.current = runId;
    const attached = () => attachedRun.current === runId;
    setExp({ title, percent: 0, state: 'running' });
    try {
      await exportBaseAsSbase(
        base.id,
        { ...options, format: filterFormat, title: base.title || base.name },
        (percent) => { if (attached()) setExp((e) => (e ? { ...e, percent } : e)); },
      );
      if (!attached()) {
        toast.success(`Export of “${title}” is ready. The download has started.`);
        return;
      }
      setExp((e) => (e ? { ...e, percent: 100, state: 'done' } : e));
      setTimeout(() => { if (attached()) setExp(null); }, 1500);
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      if (!attached()) {
        toast.error(`Export of “${title}” failed: ${error?.message || 'Export failed'}`);
        return;
      }
      setExp((e) => (e ? { ...e, state: 'failed', error: error?.message || 'Export failed' } : e));
    }
  }, [filterBase, filterFormat, toast]);

  // While the export runs on the server, closing the dialog detaches it: the export carries on and the file downloads
  // when it is ready. A finished or failed export is simply dismissed.
  const closeProgress = useCallback(() => {
    if (exp?.state === 'running') attachedRun.current = null;
    setExp(null);
  }, [exp?.state]);

  const closeFilterModal = useCallback(() => {
    setFilterBase(null);
  }, []);

  const exportProgressModal = (
    <>
      {filterBase && (
        <ExportSbaseModal
          isOpen={!!filterBase}
          base={filterBase}
          format={filterFormat}
          onClose={closeFilterModal}
          onExport={startExportWithOptions}
        />
      )}
      {exp && (
        <ExportProgressModal
          baseTitle={exp.title}
          percent={exp.percent}
          state={exp.state}
          error={exp.error}
          onClose={closeProgress}
        />
      )}
    </>
  );

  return { exportBase, exportProgressModal };
}
