// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useCallback, useState } from 'react';
import { useToast } from '../components/common/Toast';
import { announceJobInBackground } from '../service/jobsEvents';
import { exportBaseAsSbase, type ExportBaseOptions, type ExportFormat } from '../service/baseExportService';
import { ExportSbaseModal } from '../components/modals/ExportSbaseModal';
import type { BaseExportFormat } from '../components/common/BaseMenu';

/**
 * Returns the handler of the base menu's Export items and the export dialogs (filter options)
 * to render next to the menu.
 */
export function useBaseExport() {
  const toast = useToast();
  const [filterBase, setFilterBase] = useState<{ id: string; title?: string; name?: string } | null>(null);
  const [filterFormat, setFilterFormat] = useState<ExportFormat>('sbase');

  const exportBase = useCallback((base: { id: string; title?: string; name?: string }, format: BaseExportFormat) => {
    // Open the filter modal instead of exporting directly. The Excel item exports an .xlsx.
    setFilterFormat(format === 'excel' ? 'xlsx' : format);
    setFilterBase(base);
  }, [toast]);

  const startExportWithOptions = useCallback(async (options: ExportBaseOptions) => {
    if (!filterBase) return;
    const base = filterBase;
    setFilterBase(null);

    // No progress dialog: the export runs in the background and an icon flies into the Jobs button. A message tells
    // the result, and the file downloads when it is ready.
    const title = base.title || base.name || 'base';
    announceJobInBackground('export');
    try {
      await exportBaseAsSbase(base.id, { ...options, format: filterFormat, title: base.title || base.name });
      toast.success(`Export of “${title}” is ready. The download has started.`);
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      toast.error(`Export of “${title}” failed: ${error?.message || 'Export failed'}`);
    }
  }, [filterBase, filterFormat, toast]);

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
    </>
  );

  return { exportBase, exportProgressModal };
}
