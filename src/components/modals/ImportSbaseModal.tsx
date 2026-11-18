// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useRef, useState } from 'react';
import { useToast } from '../common/Toast';
import { X, Upload, FileArchive, AlertTriangle, Loader2 } from 'lucide-react';
import { importBaseFromSbase, type ImportJob } from '../../service/baseExportService';

interface ImportSbaseModalProps {
  isOpen: boolean;
  workspaceId: string;
  onClose: () => void;
  /** Called once the new base exists (so the list can refresh) */
  onImported: (job: ImportJob) => void;
}

type Phase = 'pick' | 'running' | 'done' | 'failed';

// What the server is doing at this percent (the import job reports 0..100)
const stageLabel = (percent: number): string => {
  if (percent < 5) return 'Reading the file…';
  if (percent < 40) return 'Creating tables and fields…';
  if (percent < 90) return 'Importing rows…';
  return 'Finishing up…';
};

export const ImportSbaseModal: React.FC<ImportSbaseModalProps> = ({ isOpen, workspaceId, onClose, onImported }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [includeData, setIncludeData] = useState(true);
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [includeAutomations, setIncludeAutomations] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState('');
  const [phase, setPhase] = useState<Phase>('pick');
  const [percent, setPercent] = useState(0);
  const [job, setJob] = useState<ImportJob | null>(null);
  const [error, setError] = useState('');
  const [problems, setProblems] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const toast = useToast();
  // The import goes on after the dialog is closed; the code that follows it asks this whether to show a message
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  if (!isOpen) return null;

  const resetForm = () => {
    setFile(null); setTitle(''); setIncludeData(true); setIncludeAttachments(true); setIncludeAutomations(false); setDragging(false); setFileError(''); setPhase('pick'); setPercent(0); setJob(null); setError(''); setProblems([]);
  };

  // While the import runs on the server, closing only hides the dialog: the import carries on and a message tells
  // the result. Otherwise the dialog is closed and cleared.
  const close = () => {
    if (phase === 'running') {
      onClose();
      return;
    }
    abortRef.current?.abort();
    resetForm();
    onClose();
  };

  // Only a .sbase.zip can be imported (an export is always one)
  const pickFile = (picked: File | null) => {
    if (inputRef.current) inputRef.current.value = '';
    if (picked && !picked.name.toLowerCase().endsWith('.zip')) {
      setFile(null);
      setFileError('Only .zip files are supported.');
      return;
    }
    setFileError('');
    setFile(picked);
  };

  const start = async () => {
    if (!file || !workspaceId) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase('running'); setPercent(0); setError(''); setProblems([]);
    try {
      const finished = await importBaseFromSbase(workspaceId, file, { title, includeData, includeAttachments, includeAutomations }, setPercent, controller.signal);
      if (finished.status === 'completed') {
        onImported(finished);
        if (!isOpenRef.current) {
          toast.success(`“${finished.base_title || 'The base'}” was imported.`);
          resetForm();
          return;
        }
        setJob(finished); setPercent(100); setPhase('done');
      } else {
        const message = finished.error || 'Import failed';
        if (!isOpenRef.current) {
          toast.error(`Import failed: ${message}`);
          resetForm();
          return;
        }
        setError(message);
        setProblems(finished.result?.problems || []);
        setPhase('failed');
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      if (!isOpenRef.current) {
        toast.error(`Import failed: ${e?.message || 'Import failed'}`);
        resetForm();
        return;
      }
      setError(e?.message || 'Import failed');
      setProblems(e?.problems || []);
      setPhase('failed');
    }
  };

  const result = job?.result;
  const summary = result
    ? [
        result.tables != null && `${result.tables} tables`,
        result.fields != null && `${result.fields} fields`,
        result.views != null && `${result.views} views`,
        result.rows ? `${result.rows} rows` : null,
        result.attachments ? `${result.attachments} files` : null,
      ].filter(Boolean).join(', ')
    : '';

  return (
    <div className="bg-modal-backdrop" onKeyDown={(e) => e.key === 'Escape' && close()}>
      <div className="bg-modal max-w-lg! p-0! flex flex-col relative overflow-hidden" role="dialog" aria-label="Import Sereni Base">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-primary truncate">Import Sereni Base</h2>
            <p className="text-sm text-secondary truncate">Create a new base from a .sbase.zip file.</p>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center shrink-0" aria-label="Close">
            <X className="text-gray-400 h-5 w-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-y-4">
          {phase === 'pick' && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] || null)}
              />
              <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const dropped = e.dataTransfer.files?.[0];
                  if (dropped) pickFile(dropped);
                }}
                className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-colors ${dragging ? 'bg-green-50 border-green-400' : 'hover:bg-gray-50'}`}
              >
                <span className="w-12 h-12 rounded-xl border bg-card shadow-sm flex items-center justify-center">
                  {file ? <FileArchive className="w-6 h-6 text-green-600" /> : <Upload className="w-6 h-6 text-gray-600" />}
                </span>
                {file ? (
                  <>
                    <span className="text-sm text-gray-700 font-medium">{file.name}</span>
                    <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-gray-700">
                      Drag &amp; Drop your zip file here, or <span className="text-green-600 font-medium">click to add</span>
                    </span>
                    <span className="text-xs text-gray-500">Only .zip files are supported</span>
                  </>
                )}
              </div>

              {fileError && <p className="text-xs text-red-600 -mt-2" role="alert">{fileError}</p>}

              <div>
                <label className="text-sm font-medium text-gray-800 block mb-1.5" htmlFor="sbase-import-title">Name of Base</label>
                <input
                  id="sbase-import-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Same as the name in the file"
                  className="w-full text-sm px-3 h-10 border rounded-lg text-primary bg-card outline-none focus:border-primary"
                />
                <p className="text-xs text-secondary mt-1">If left empty, the base is created with the name stored in the .zip file.</p>
              </div>

              <div className="flex flex-col gap-y-2.5">
                <h3 className="text-sm font-medium text-gray-800">Advanced Settings</h3>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeData}
                    onChange={(e) => setIncludeData(e.target.checked)}
                  />
                  Import table data
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeAttachments}
                    onChange={(e) => setIncludeAttachments(e.target.checked)}
                  />
                  Import attachment
                </label>
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input type="checkbox" checked={includeAutomations} onChange={(e) => setIncludeAutomations(e.target.checked)} />
                    Import triggers and functions
                  </label>
                  <p className="text-xs text-secondary mt-1 ml-6">They run SQL from the file. Needs the automations permission.</p>
                </div>
              </div>
            </>
          )}

          {(phase === 'running' || phase === 'done') && (
            <div>
              <div className="flex items-center justify-between text-sm mb-2 gap-4">
                <span className="text-gray-700">{phase === 'done' ? `Imported “${job?.base_title || ''}”` : stageLabel(percent)}</span>
                <span className="text-gray-700 shrink-0">{percent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: `${percent}%` }} />
              </div>
              {phase === 'done' && summary && <p className="text-sm text-secondary mt-3">Created {summary}.</p>}
              {phase === 'done' && !!result?.warnings?.length && (
                <ul className="mt-3 text-sm text-amber-700 list-disc pl-5 space-y-1 max-h-40 overflow-y-auto">
                  {result.warnings.map((w) => <li key={w}>{w}</li>)}
                </ul>
              )}
            </div>
          )}

          {phase === 'failed' && (
            <div className="flex items-start gap-3 text-red-700">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{error}</p>
                {problems.length > 0 && (
                  <ul className="mt-2 text-sm list-disc pl-5 space-y-1 max-h-40 overflow-y-auto">
                    {problems.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {phase === 'running' ? (
          <div className="flex items-center gap-2 px-4 py-3 border-t shrink-0 bg-gray-50 text-xs text-secondary">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>The import is running in the background.</span>
          </div>
        ) : (
        <div className="flex items-center justify-end gap-3 p-4 border-t shrink-0">
          <button type="button" onClick={close} className="px-10 py-2 rounded-xl border bg-card hover:bg-gray-50 text-gray-700">
            {phase === 'pick' ? 'Cancel' : 'Close'}
          </button>
          {phase === 'pick' && (
            <button
              type="button"
              onClick={start}
              disabled={!file || !workspaceId}
              className="px-10 py-2 rounded-xl btn-primary font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import Base
            </button>
          )}
          {phase === 'failed' && (
            <button type="button" onClick={() => setPhase('pick')} className="px-10 py-2 rounded-xl btn-primary font-medium">Try again</button>
          )}
        </div>
        )}
      </div>
    </div>
  );
};
