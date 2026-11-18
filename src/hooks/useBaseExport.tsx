// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useCallback, useRef, useState } from 'react';
import { useToast } from '../components/common/Toast';
import { exportBaseAsSbase, type ExportBaseOptions } from '../service/baseExportService';
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
  const [exp, setExp] = useState<ExportState | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // True once the user closed the progress dialog while the export was still running: the export carries on, and the
  // result is shown as a message instead
  const [hidden, setHidden] = useState(false);
  const hiddenRef = useRef(false);

  const exportBase = useCallback((base: { id: string; title?: string; name?: string }, format: BaseExportFormat) => {
    if (format !== 'sbase') {
      toast.info(`${format === 'csv' ? 'CSV' : format === 'excel' ? 'Excel' : 'JSON'} export is coming soon`);
      return;
    }
    // Open the filter modal instead of exporting directly
    setFilterBase(base);
  }, [toast]);

  const startExportWithOptions = useCallback(async (options: ExportBaseOptions) => {
    if (!filterBase) return;
    const base = filterBase;
    setFilterBase(null);

    const controller = new AbortController();
    abortRef.current = controller;
    const title = base.title || base.name || 'base';
    hiddenRef.current = false;
    setHidden(false);
    setExp({ title, percent: 0, state: 'running' });
    try {
      await exportBaseAsSbase(base.id, { ...options, title: base.title || base.name }, (percent) => setExp((e) => (e ? { ...e, percent } : e)), controller.signal);
      if (hiddenRef.current) {
        toast.success(`Export of “${title}” is ready. The download has started.`);
        setExp(null);
        return;
      }
      setExp((e) => (e ? { ...e, percent: 100, state: 'done' } : e));
      setTimeout(() => setExp(null), 1500);
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      if (hiddenRef.current) {
        toast.error(`Export of “${title}” failed: ${error?.message || 'Export failed'}`);
        setExp(null);
        return;
      }
      setExp((e) => (e ? { ...e, state: 'failed', error: error?.message || 'Export failed' } : e));
    }
  }, [filterBase, toast]);

  // While the export runs on the server, closing the dialog only hides it: the export carries on and the file
  // downloads when it is ready. A finished or failed export is simply dismissed.
  const closeProgress = useCallback(() => {
    if (exp?.state === 'running') {
      hiddenRef.current = true;
      setHidden(true);
      return;
    }
    abortRef.current?.abort();
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
          onClose={closeFilterModal}
          onExport={startExportWithOptions}
        />
      )}
      {exp && !hidden && (
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
