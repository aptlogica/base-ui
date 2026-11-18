// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { X, Download, AlertTriangle, Loader2 } from 'lucide-react';

interface ExportProgressModalProps {
  baseTitle: string;
  percent: number;
  /** running: following the job; done: the file was handed to the browser; failed: see error */
  state: 'running' | 'done' | 'failed';
  error?: string;
  onClose: () => void;
}

// What the server is doing at this percent (the export job reports 0..100)
const stageLabel = (percent: number): string => {
  if (percent < 15) return 'Reading base structure…';
  if (percent < 65) return 'Reading rows…';
  if (percent < 100) return 'Packaging files…';
  return 'Export ready';
};

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({ baseTitle, percent, state, error, onClose }) => {
  const shown = state === 'done' ? 100 : Math.max(0, Math.min(100, Math.round(percent)));
  let label = stageLabel(shown);
  if (state === 'done') label = 'Download started';
  if (state === 'failed') label = error || 'Export failed';
  const failed = state === 'failed';
  const running = state === 'running';

  return (
    <div className="bg-modal-backdrop" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="bg-modal max-w-lg! p-0! flex flex-col relative overflow-hidden" role="dialog" aria-label="Export progress">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${failed ? 'bg-red-100' : 'bg-green-100'}`}>
              {failed ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <Download className="w-5 h-5 text-green-600" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-primary truncate">Export Sereni Base of {baseTitle}</h2>
              <p className="text-sm text-secondary truncate">The file downloads when it is ready.</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0" aria-label="Close">
            <X className="text-gray-400 h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between text-sm mb-2 gap-4">
            <span className={failed ? 'text-red-600' : 'text-gray-700'}>{label}</span>
            {!failed && <span className="text-gray-700 shrink-0">{shown}%</span>}
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden" role="progressbar" aria-valuenow={shown} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${failed ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${shown}%` }}
            />
          </div>
        </div>

        {running ? (
          <div className="flex items-center gap-2 px-4 py-3 border-t shrink-0 bg-gray-50 text-xs text-secondary">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>The export is running in the background.</span>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 p-4 border-t shrink-0">
            <button type="button" onClick={onClose} className="px-10 py-2 rounded-xl border bg-card hover:bg-gray-50 text-gray-700 transition-all">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
