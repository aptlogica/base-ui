// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useRef, useState } from 'react';
import { useToast } from '../common/Toast';
import { X, Minus, Upload, FileArchive, FileText, Loader2 } from 'lucide-react';
import { importBaseFromSbase, type ExportFormat, type ImportJob } from '../../service/baseExportService';
import { isNameDuplicate, type ExistingItem } from '../../utils/nameValidation';
import { InfoTip } from './InfoTip';
import { ImportSuccessModal, type ImportSuccessSummary } from './importer/ImportSuccessModal';
import { CSV_DIALOG_SIZE, CSV_IMPORT_SUBTITLE, CSV_IMPORT_TITLE } from './importer/CsvModeRadio';
import { pickCsvFiles, pickCsvZip } from './importer/csvFileCheck';
import { buildFailedImportLog } from './importer/importErrorLog';
import { announceJobInBackground, trackJob } from '../../service/jobsEvents';

interface ImportSbaseModalProps {
  isOpen: boolean;
  workspaceId: string;
  /** The bases of the workspace: a name typed for the new base must not be one of them */
  existingBases?: ExistingItem[];
  onClose: () => void;
  /** Called once the new base exists (so the list can refresh) */
  onImported: (job: ImportJob) => void;
  /** sbase (default), csv (a .zip of .csv files, one table per file) xlsx (an .xlsx workbook, one table per sheet, or a
   * .zip of one) or json (a .zip of .json files, one table per file, or one .json file). A csv, xlsx or json has no triggers or
   * system columns. */
  format?: ExportFormat;
  /** Optional: shown under the header before a file is imported (the CSV Single / Multiple radio) */
  modeSwitcher?: React.ReactNode;
}

// "Sales.csv.zip", "Sales.zip", "Sales.csv", "Sales.xlsx" and "Sales.json" all give "Sales"
const baseNameFromFile = (fileName: string): string => {
  const name = fileName.replace(/\\/g, '/').split('/').pop() || '';
  return name.replace(/\.(csv|xlsx|json)\.zip$/i, '').replace(/\.(zip|csv|xlsx|json)$/i, '').trim();
};

type Phase = 'pick' | 'running' | 'done' | 'failed';

// What the server is doing at this percent (the import job reports 0..100)
const stageLabel = (percent: number): string => {
  if (percent < 5) return 'Reading the file…';
  if (percent < 40) return 'Creating tables and fields…';
  if (percent < 90) return 'Importing rows…';
  return 'Finishing up…';
};

export const ImportSbaseModal: React.FC<ImportSbaseModalProps> = ({ isOpen, workspaceId, existingBases = [], onClose, onImported, format = 'sbase', modeSwitcher }) => {
  const isCsv = format === 'csv';
  const isXlsx = format === 'xlsx';
  const isJson = format === 'json';
  const isFlat = isCsv || isXlsx || isJson;
  const [file, setFile] = useState<File | null>(null);
  // a csv import also takes several loose .csv files (instead of a zip): they are listed here, and file stays empty
  const [csvFiles, setCsvFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [includeData, setIncludeData] = useState(true);
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [includeAutomations, setIncludeAutomations] = useState(false);
  const [includeSystemColumns, setIncludeSystemColumns] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState('');
  const [phase, setPhase] = useState<Phase>('pick');
  const [percent, setPercent] = useState(0);
  const [job, setJob] = useState<ImportJob | null>(null);
  const [error, setError] = useState('');
  const [problems, setProblems] = useState<string[]>([]);
  // the error log the server wrote for a failed job; an import refused at once has none, and the log is written here
  const [serverLog, setServerLog] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // the job of the import that runs, once the server has started it
  const jobIdRef = useRef<string | null>(null);
  const toast = useToast();
  // Every import is followed by its own run. Only the run the dialog shows is "attached"; closing the dialog while an
  // import runs detaches it: it carries on in the background and a message tells the result, and the dialog is free
  // for another import.
  const runCounter = useRef(0);
  const attachedRun = useRef<number | null>(null);

  if (!isOpen) return null;

  // A name typed for the new base must be free (case does not matter). An empty name uses the name in the file.
  const nameError =
    title.trim() && isNameDuplicate(title, existingBases)
      ? 'Base name already exists'
      : '';

  const resetForm = () => {
    setFile(null); setCsvFiles([]); setTitle(''); setIncludeData(true); setIncludeAttachments(true); setIncludeAutomations(false); setIncludeSystemColumns(false); setDragging(false); setFileError(''); setPhase('pick'); setPercent(0); setJob(null); setError(''); setProblems([]);;
  };

  // The Jobs panel follows the import from now on: it is tracked there, and this dialog stops asking the server for it
  const handOverToJobsPanel = () => {
    const id = jobIdRef.current;
    if (!id) return;
    trackJob({ id, type: 'import', title: chosenName });
    abortRef.current?.abort();
  };

  // While an import runs on the server, closing the dialog detaches it and clears the form, so another import can be
  // started; the import itself carries on. Otherwise the dialog is just closed and cleared.
  const close = () => {
    if (phase === 'running') {
      attachedRun.current = null;
      announceJobInBackground('import');
      // The Jobs panel follows the job from here, so this dialog stops asking for it. Before the server has answered
      // there is no job yet: the upload carries on, and the job is handed over when it starts (see onJobStarted).
      handOverToJobsPanel();
      resetForm();
      onClose();
      return;
    }
    abortRef.current?.abort();
    resetForm();
    onClose();
  };

  // Only a .zip can be imported (an export is always one), or for xlsx an .xlsx workbook, or for json one .json file, as well
  const pickFile = (picked: File | null) => {
    if (inputRef.current) inputRef.current.value = '';
    const lower = picked?.name.toLowerCase() || '';
    if (picked && !lower.endsWith('.zip') && !(isXlsx && lower.endsWith('.xlsx')) && !(isJson && lower.endsWith('.json'))) {
      setFile(null);
      setFileError(isXlsx ? 'Only .xlsx or .zip files are supported.' : isJson ? 'Only .zip or .json files are supported.' : 'Only .zip files are supported.');
      return;
    }
    setFileError('');
    setFile(picked);
  };

  // The Multiple CSV option: several .csv files or one .zip (see pickCsvFiles for the rules and the checks)
  const pickCsv = async (picked: File[]) => {
    if (inputRef.current) inputRef.current.value = '';
    if (picked.length === 0) return;
    // a zip is answered at once; .csv files are read (to check they are text) first
    const current = { csvFiles, zip: file };
    const result = pickCsvZip(picked, current) ?? (await pickCsvFiles(picked, current));
    setCsvFiles(result.csvFiles);
    setFile(result.zip);
    setFileError(result.error);
  };

  const removeCsv = (index: number) => {
    setCsvFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError('');
  };

  const looseCsv = isCsv && csvFiles.length > 0;
  const hasFile = !!file || looseCsv;
  // Files belong to rows: for a csv, xlsx or json import, attachments are off while the table data is off (and for loose CSV files, which carry none)
  // The name the new base gets when the name field is left empty: the file name without .csv, .xlsx, .json or .zip (the
  // server does the same); several loose CSV files are named "Imported CSV"
  const defaultBaseName = !isFlat ? '' : csvFiles.length > 1 ? 'Imported CSV' : baseNameFromFile(file?.name || csvFiles[0]?.name || '');
  const attachmentsOff = looseCsv || (isFlat && !includeData);
  const chosenName = file?.name || (looseCsv ? csvFiles.map((f) => f.name).join(', ') : undefined);
  const csvTotalMb = csvFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024;

  const start = async () => {
    if (!hasFile || !workspaceId || nameError) return;
    const controller = new AbortController();
    abortRef.current = controller;
    jobIdRef.current = null;
    const runId = ++runCounter.current;
    attachedRun.current = runId;
    const attached = () => attachedRun.current === runId;
    setPhase('running'); setPercent(0); setError(''); setProblems([]); setServerLog('');
    try {
      const finished = await importBaseFromSbase(
        workspaceId,
        looseCsv ? csvFiles : (file as File),
        { title, includeData, includeAttachments: includeAttachments && !attachmentsOff, includeAutomations: !isFlat && includeAutomations, includeSystemColumns: !isFlat && includeData && includeSystemColumns, format },
        (value) => { if (attached()) setPercent(value); },
        controller.signal,
        (started) => {
          jobIdRef.current = started.id;
          // minimized while the file was still going up: hand the job over now that it exists
          if (!attached()) {
            trackJob({ id: started.id, type: 'import', title: chosenName });
            controller.abort();
          }
        },
      );
      if (finished.status === 'completed') {
        onImported(finished);
        if (!attached()) {
          toast.success(`“${finished.base_title || 'The base'}” was imported.`);
          return;
        }
        setJob(finished); setPercent(100); setPhase('done');
      } else {
        const message = finished.error || 'Import failed';
        if (!attached()) {
          toast.error(`Import failed: ${message}`);
          return;
        }
        setError(message);
        setProblems(finished.result?.problems || []);
        setServerLog(finished.result?.error_log || '');
        setPhase('failed');
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      if (!attached()) {
        toast.error(`Import failed: ${e?.message || 'Import failed'}`);
        return;
      }
      setError(e?.message || 'Import failed');
      setProblems(e?.problems || []);
      setPhase('failed');
    }
  };

  // When the import is done, the same popup as for a CSV import shows what was created
  if (phase === 'done' && job) {
    const result = job.result;
    const summary: ImportSuccessSummary = {
      totalRows: result?.rows ?? 0,
      columns: result?.fields ?? 0,
      tableTitle: job.base_title,
      // the rows the database refused (csv, xlsx, json), the blank and repeated rows of the files, and the warnings: the
      // popup lists them as the one of a CSV table import does, and offers the error log as a text file
      errorRows: result?.skipped_rows ?? 0,
      emptyRows: result?.empty_rows ?? 0,
      duplicateRows: result?.duplicate_rows ?? 0,
      emptyRowsSkipped: 0,
      duplicatesRemoved: 0,
      warnings: result?.warnings?.length ?? 0,
      errorRowsFileContent: result?.error_log,
      stats: [
        { label: 'Tables', value: result?.tables ?? 0 },
        { label: 'Fields', value: result?.fields ?? 0 },
        { label: 'Views', value: result?.views ?? 0 },
        { label: 'Rows', value: result?.rows ?? 0 },
      ],
    };
    return <ImportSuccessModal open summary={summary} onClose={close} />;
  }

  // When the import failed, the same popup shows what went wrong, with the log to download and a way to try again
  if (phase === 'failed') {
    const errors = problems.length > 0 ? problems : [error];
    const summary: ImportSuccessSummary = {
      variant: 'failed',
      totalRows: 0,
      columns: 0,
      errorRows: 0,
      emptyRows: 0,
      duplicateRows: 0,
      emptyRowsSkipped: 0,
      duplicatesRemoved: 0,
      subtitle: problems.length > 0 && error ? `${chosenName ? `${chosenName}: ` : ''}${error}` : `Your import${chosenName ? ` of "${chosenName}"` : ''} did not finish.`,
      errors,
      errorRowsFileContent: serverLog || buildFailedImportLog({ format, fileName: chosenName, message: error, problems }),
      stats: [
        { label: 'Tables', value: 0 },
        { label: 'Fields', value: 0 },
        { label: 'Views', value: 0 },
        { label: 'Rows', value: 0 },
      ],
    };
    return <ImportSuccessModal open summary={summary} onClose={close} onRetry={() => setPhase('pick')} />;
  }

  // The CSV Single / Multiple dialog look (shared header, size, radio) is only for choosing a file; a running import looks as it always did
  const csvPick = !!modeSwitcher && phase === 'pick';

  return (
    <div className="bg-modal-backdrop" onKeyDown={(e) => e.key === 'Escape' && close()}>
      <div className={`bg-modal max-w-lg! p-0! flex flex-col relative overflow-hidden ${csvPick ? CSV_DIALOG_SIZE : ''}`} role="dialog" aria-label={isCsv ? 'Import Sereni Base CSV' : isXlsx ? 'Import Sereni Base Excel' : isJson ? 'Import Sereni Base JSON' : 'Import Sereni Base'}>
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {csvPick && (
              <div className="w-10 h-10 bg-brand-100 text-brand-800 rounded-xl flex items-center justify-center shrink-0">
                <Upload className="text-green-600 h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-primary truncate">{csvPick ? CSV_IMPORT_TITLE : isCsv ? 'Import Sereni Base CSV' : isXlsx ? 'Import Sereni Base Excel' : isJson ? 'Import Sereni Base JSON' : 'Import Sereni Base'}</h2>
              <p className="text-sm text-secondary truncate">{csvPick ? CSV_IMPORT_SUBTITLE : isCsv ? 'Create a new base from a .zip of CSV files.' : isXlsx ? 'Create a new base from an .xlsx file or a .zip of it.' : isJson ? 'Create a new base from .json files or a .zip of them.' : 'Create a new base from a .sbase.zip file.'}</p>
            </div>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center shrink-0" aria-label={phase === 'running' ? 'Minimize' : 'Close'} title={phase === 'running' ? 'Minimize' : undefined}>
            {phase === 'running' ? <Minus className="text-gray-400 h-5 w-5" /> : <X className="text-gray-400 h-5 w-5" />}
          </button>
        </div>

        <div className={`${csvPick ? 'p-4 flex-1 overflow-y-auto' : 'p-6'} flex flex-col gap-y-4`}>
          {csvPick && modeSwitcher}
          {phase === 'pick' && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept={isCsv ? '.csv,.zip' : isXlsx ? '.xlsx,.zip' : isJson ? '.json,.zip' : '.zip'}
                className="hidden"
                multiple={isCsv}
                onChange={(e) => (isCsv ? pickCsv(Array.from(e.target.files || [])) : pickFile(e.target.files?.[0] || null))}
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
                  if (isCsv) {
                    pickCsv(Array.from(e.dataTransfer.files || []));
                    return;
                  }
                  const dropped = e.dataTransfer.files?.[0];
                  if (dropped) pickFile(dropped);
                }}
                className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-colors ${dragging ? 'bg-green-50 border-green-400' : 'hover:bg-gray-50'}`}
              >
                <span className="w-12 h-12 rounded-xl border bg-card shadow-sm flex items-center justify-center">
                  {file ? <FileArchive className="w-6 h-6 text-green-600" /> : looseCsv ? <FileText className="w-6 h-6 text-green-600" /> : <Upload className="w-6 h-6 text-gray-600" />}
                </span>
                {looseCsv ? (
                  <>
                    <span className="text-sm text-gray-700 text-center">Drag &amp; Drop more CSV files here, or <span className="text-green-600 font-medium">click to add</span></span>
                    <span className="text-xs text-gray-500 text-center">Several .csv files, or one .zip of .csv files</span>
                  </>
                ) : file ? (
                  <>
                    <span className="text-sm text-gray-700 font-medium">{file.name}</span>
                    <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-gray-700 text-center">
                      {isCsv ? 'Drag & Drop CSV files or a .zip here, or ' : 'Drag & Drop your zip file here, or '}<span className="text-green-600 font-medium">click to add</span>
                    </span>
                    <span className="text-xs text-gray-500 text-center">{isCsv ? 'Several .csv files, or one .zip of .csv files' : isXlsx ? 'Only an .xlsx file or a .zip of it is supported' : isJson ? 'Only .json files or a .zip of them are supported' : 'Only .zip files are supported'}</span>
                  </>
                )}
              </div>

              {fileError && <p className="text-xs text-red-600 -mt-2" role="alert">{fileError}</p>}

              {looseCsv && (
                <div className="flex flex-col gap-y-1.5" aria-label="Chosen CSV files">
                  <ul className="flex flex-col gap-y-1 max-h-40 overflow-y-auto">
                    {csvFiles.map((f, i) => (
                      <li key={f.name} className="flex items-center gap-2 text-sm text-gray-700 border rounded-lg px-3 py-1.5">
                        <FileText className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="truncate flex-1">{f.name}</span>
                        <span className="text-xs text-gray-500 shrink-0">{(f.size / 1024).toFixed(f.size < 1024 * 100 ? 1 : 0)} KB</span>
                        <button type="button" onClick={() => removeCsv(i)} className="w-6 h-6 rounded hover:bg-gray-100 flex items-center justify-center shrink-0" aria-label={`Remove ${f.name}`}>
                          <X className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <span className="text-xs text-gray-500">{csvFiles.length} {csvFiles.length === 1 ? 'file' : 'files'}, {csvTotalMb.toFixed(1)} MB in total</span>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-800 block mb-1.5" htmlFor="sbase-import-title">Name of Base</label>
                <input
                  id="sbase-import-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isFlat ? 'Enter a name, or leave empty to use the file name' : 'Same as the name in the file'}
                  aria-invalid={!!nameError}
                  className={`w-full text-sm px-3 h-10 border rounded-lg text-primary bg-card outline-none ${nameError ? 'border-red-500 focus:border-red-500' : 'focus:border-primary'}`}
                />
                {nameError ? (
                  <p className="text-xs text-red-600 mt-1" role="alert">{nameError}</p>
                ) : (
                  <p className="text-xs text-secondary mt-1">{defaultBaseName ? `Leave empty to use “${defaultBaseName}”.` : isFlat ? 'Leave empty to use the file name.' : 'If left empty, the base is created with the name stored in the .zip file.'}</p>
                )}
              </div>

              <div className="flex flex-col gap-y-2.5">
                <h3 className="text-sm font-medium text-gray-800">Advanced Settings</h3>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeData}
                    onChange={(e) => setIncludeData(e.target.checked)}
                  />
                  Import table data<InfoTip label="import table data" text="Off creates empty tables." />
                </label>
                <label className={`flex items-center gap-2 text-sm text-gray-700 select-none ${attachmentsOff ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={includeAttachments && !attachmentsOff}
                    disabled={attachmentsOff}
                    onChange={(e) => setIncludeAttachments(e.target.checked)}
                  />
                  Import attachment<InfoTip label="import attachment" text={looseCsv ? 'CSV files carry no attachments. Use a .zip with an attachments folder to import them.' : isFlat && !includeData ? 'Needs table data.' : 'Restores the uploaded files.'} />
                </label>
                {!isFlat && (
                  <>
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input type="checkbox" checked={includeAutomations} onChange={(e) => setIncludeAutomations(e.target.checked)} />
                    Import triggers and functions<InfoTip label="import triggers and functions" text="Restores triggers and functions." />
                  </label>
                
                </div>
                <div>
                  <label className={`flex items-center gap-2 text-sm text-gray-700 select-none ${includeData ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                    <input type="checkbox" checked={includeData && includeSystemColumns} disabled={!includeData} onChange={(e) => setIncludeSystemColumns(e.target.checked)} />
                    Import system columns<InfoTip label="import system columns" text="Keeps original id, dates and users. Needs table data." />
                  </label>
                </div>
                  </>
                )}
              </div>
            </>
          )}

          {phase === 'running' && (
            <div>
              <div className="flex items-center justify-between text-sm mb-2 gap-4">
                <span className="text-gray-700">{stageLabel(percent)}</span>
                <span className="text-gray-700 shrink-0">{percent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: `${percent}%` }} />
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
            Cancel
          </button>
          {phase === 'pick' && (
            <button
              type="button"
              onClick={start}
              disabled={!hasFile || !workspaceId || !!nameError}
              className="px-10 py-2 rounded-xl btn-primary font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import Base
            </button>
          )}
        </div>
        )}
      </div>
    </div>
  );
};
