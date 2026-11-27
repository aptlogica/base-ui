// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronRight, Clock, Loader2, RefreshCw } from 'lucide-react';
import { apiErrorMessage } from '../../utils/apiErrors';
import { useBaseApi } from './useBaseApi';
import { useBaseApiLogCount, useBaseApiLogs, useOldestBaseApiLog } from './useBaseApiLogs';
import {
  DEFAULT_LOG_FILTERS,
  LEVEL_OPTIONS,
  LOG_RETENTION_DAYS,
  LOG_SERVICE_NAME,
  METHOD_OPTIONS,
  METHOD_TONES,
  STATUS_OPTIONS,
  TIME_OPTIONS,
  describeEntry,
  displayPath,
  entryDetails,
  entryKey,
  formatLogTime,
  levelInfo,
  responseJson,
  statusTone,
  toLogFilters,
  type LogFilterState,
} from './apiLogs/apiLogsModel';
import type { BaseApiLogEntry } from '../../service/clientService';

interface DeveloperLogsProps {
  baseId: string | null;
}

const SEARCH_DELAY_MS = 400;
const FIELD_CLASS =
  'min-h-[42px] px-2.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] text-sm font-normal text-primary';
const BUTTON_CLASS =
  'min-h-[36px] px-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] hover:bg-gray-50 text-[13px] text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const dateLabel = (iso: string | undefined): string => (iso ? formatLogTime(iso).date : '');

// A button that copies text and says so for a moment
const CopyTextButton: React.FC<Readonly<{ text: string; label: string; copiedLabel?: string }>> = ({ text, label, copiedLabel = 'Copied' }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available (e.g. insecure context); nothing else to do
    }
  };
  return (
    <button type="button" onClick={handleCopy} disabled={!text} className={`${BUTTON_CLASS} flex items-center gap-1.5`}>
      {copied && <Check className="w-3.5 h-3.5 text-green-600" aria-hidden="true" />}
      {copied ? copiedLabel : label}
    </button>
  );
};

// The opened part of a row: every detail of the request and the response the API sent
const EntryDetails: React.FC<Readonly<{ entry: BaseApiLogEntry }>> = ({ entry }) => {
  const tone = levelInfo(entry.level).tone;
  const json = responseJson(entry);
  return (
    <tr>
      <td colSpan={6} className={`px-2 pb-4 border-b api-logs-open-${tone}`}>
        <div className={`flex flex-wrap gap-5 p-4 bg-[var(--color-card)] border rounded-xl api-logs-panel-${tone}`}>
          <dl className="flex-[1_1_280px] m-0 grid grid-cols-[110px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[13px]">
            {entryDetails(entry).map(({ label, value }) => (
              <React.Fragment key={label}>
                <dt className="text-secondary">{label}</dt>
                <dd className="m-0 font-mono text-xs break-all text-primary">{value}</dd>
              </React.Fragment>
            ))}
          </dl>
          <div className="flex-[1_1_320px] min-w-0 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[13px] font-medium text-primary">Response sent</span>
              <div className="flex gap-2">
                <CopyTextButton text={entry.fields?.request_id ?? ''} label="Copy request ID" />
                <CopyTextButton text={json} label="Copy JSON" />
              </div>
            </div>
            {json ? (
              <pre className="m-0 p-3 rounded-xl bg-gray-50 border font-mono text-xs leading-normal whitespace-pre overflow-x-auto text-primary">
                {json}
              </pre>
            ) : (
              <p className="m-0 p-3 rounded-xl bg-gray-50 border text-xs text-secondary">
                The response of this request was not stored. Bodies are kept for failed requests.
              </p>
            )}
            {entry.fields?.response_truncated && (
              <p className="m-0 text-xs text-secondary">The response was cut at the size limit of a log entry.</p>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

const HEADERS: { label: string; className?: string }[] = [
  { label: 'Time (UTC)' },
  { label: 'Level' },
  { label: 'Request' },
  { label: 'Status' },
  { label: 'Duration', className: 'text-right' },
  { label: 'Message' },
];

const EntryRow: React.FC<Readonly<{ entry: BaseApiLogEntry; open: boolean; onToggle: () => void }>> = ({ entry, open, onToggle }) => {
  const f = entry.fields ?? {};
  const level = levelInfo(entry.level);
  const { time, date } = formatLogTime(entry.timestamp);
  const method = (f.method ?? '').toUpperCase();
  const suggestion = f.suggestion;
  const cell = 'px-2 py-3 border-b align-top';
  return (
    <>
      <tr // NOSONAR: the button in the first cell is the keyboard control; the row is a bigger click target
        onClick={onToggle}
        className={`cursor-pointer ${open ? `api-logs-open-${level.tone}` : ''}`}
      >
        <td className={`${cell} text-secondary whitespace-nowrap`}>
          <button
            type="button"
            aria-expanded={open}
            aria-label={`${open ? 'Hide' : 'Show'} details of ${method} ${displayPath(f.path)}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="flex items-center gap-1.5 text-left"
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden="true" />
            <span className="flex flex-col">
              <span>{time}</span>
              <span className="text-xs text-[var(--text-color-tertiary)]">{date}</span>
            </span>
          </button>
        </td>
        <td className={cell}>
          <span className={`inline-block text-xs font-medium px-2 py-[3px] rounded-full api-logs-tone-${level.tone}`}>{level.label}</span>
        </td>
        <td className={cell}>
          <div className="flex flex-col gap-1">
            <span className="flex items-baseline gap-2">
              <code className={`font-mono text-xs font-semibold api-logs-fg-${METHOD_TONES[method] ?? 'neutral'}`}>{method}</code>
              <code className="font-mono text-xs text-primary break-all">{displayPath(f.path)}</code>
            </span>
            <span className="text-xs text-[var(--text-color-tertiary)]">{f.table ? `Table: ${f.table}` : `Base: ${f.base_id ?? '—'}`}</span>
          </div>
        </td>
        <td className={cell}>
          <span className={`inline-block text-xs font-semibold px-2 py-[3px] rounded-md api-logs-tone-${statusTone(f.status)}`}>{f.status ?? '—'}</span>
        </td>
        <td className={`${cell} text-right whitespace-nowrap text-gray-700`}>{f.duration_ms === undefined ? '—' : `${f.duration_ms} ms`}</td>
        <td className={cell}>
          <div className="flex flex-col gap-1 max-w-[360px]">
            <span className="text-[13px] text-primary">{describeEntry(entry)}</span>
            {suggestion && <span className="text-xs text-secondary">{suggestion}</span>}
          </div>
        </td>
      </tr>
      {open && <EntryDetails entry={entry} />}
    </>
  );
};

// Developer > Logs: every call to the base's API, newest first, read from the log service
const DeveloperLogs: React.FC<DeveloperLogsProps> = ({ baseId }) => {
  const [filters, setFilters] = useState<LogFilterState>(DEFAULT_LOG_FILTERS);
  const [searchText, setSearchText] = useState('');
  // The windows of the time filter end here, so every page and every count of the list is of the same period.
  // It moves when a filter changes or Refresh is pressed.
  const [anchor, setAnchor] = useState(() => Date.now());
  // undefined: the first entry is open, as the screen first shows it; a key or null: the reader's choice
  const [openKey, setOpenKey] = useState<string | null | undefined>(undefined);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(searchTimer.current), []);

  const status = useBaseApi(baseId);
  const listFilters = useMemo(() => toLogFilters(filters, anchor), [filters, anchor]);
  const allFilters = useMemo(() => toLogFilters(filters, anchor, { withLevel: false }), [filters, anchor]);

  const logs = useBaseApiLogs(baseId, listFilters);
  const countAll = useBaseApiLogCount(baseId, allFilters);
  // With a level chosen the footer needs its own number; with All it is the same count
  const countLevel = useBaseApiLogCount(baseId, filters.level === 'all' ? null : listFilters);
  const oldest = useOldestBaseApiLog(baseId, anchor);

  const change = (patch: Partial<LogFilterState>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setAnchor(Date.now());
    setOpenKey(undefined);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => change({ search: value }), SEARCH_DELAY_MS);
  };

  const refresh = () => {
    setAnchor(Date.now());
    setOpenKey(undefined);
  };

  const entries = useMemo(() => logs.data?.pages.flatMap((page) => page?.data?.entries ?? []) ?? [], [logs.data]);
  const nothingCanMatch = listFilters === null;
  const total = nothingCanMatch ? 0 : (filters.level === 'all' ? countAll.data : countLevel.data);
  const first = entries[0];
  const env = first?.labels?.env;
  const effectiveOpen = openKey === undefined && first ? entryKey(first, 0) : openKey;
  const oldestDate = dateLabel(oldest.data);

  const emptyText = (() => {
    if (nothingCanMatch) return 'No API calls match: the level and the status you chose exclude each other.';
    if (status.data && !status.data.enabled) return 'No API calls yet. Turn on the API in Overview and every call to it will show up here.';
    return 'No API calls match these filters.';
  })();

  return (
    <div className="api-logs p-6 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h3 className="m-0 text-2xl font-semibold text-primary">Logs</h3>
          <p className="m-0 text-sm text-secondary">Every API call to this base, with its status, timing and error.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full api-logs-tone-neutral">service: {first?.service ?? LOG_SERVICE_NAME}</span>
          {env && <span className="text-xs px-2.5 py-1 rounded-full api-logs-tone-warn">env: {env}</span>}
        </div>
      </div>

      <div role="note" className="api-logs-note flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-[13px]">
        <Clock className="w-[18px] h-[18px] flex-shrink-0" aria-hidden="true" />
        <span>
          Logs are kept for <strong>{LOG_RETENTION_DAYS} days</strong>, then deleted automatically.
          {oldestDate && (
            <>
              {' '}Oldest entry available: <strong>{oldestDate}</strong>.
            </>
          )}
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div role="group" aria-label="Level" className="flex gap-1 p-1 rounded-xl border bg-[var(--color-card)]">
          {LEVEL_OPTIONS.map(({ value, label }) => {
            const selected = filters.level === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => change({ level: value })}
                className={`min-h-[36px] px-3 rounded-xl text-[13px] transition-colors ${selected ? 'api-logs-tone-ok font-medium' : 'bg-transparent text-gray-700 hover:bg-gray-100'}`}
              >
                {label}
                {value === 'all' && countAll.data !== undefined && !nothingCanMatch && (
                  <span className="ml-1 font-normal text-secondary">{countAll.data}</span>
                )}
              </button>
            );
          })}
        </div>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-primary flex-[0_1_130px]">
          Method
          <select value={filters.method} onChange={(e) => change({ method: e.target.value as LogFilterState['method'] })} className={FIELD_CLASS}>
            {METHOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-primary flex-[0_1_130px]">
          Status
          <select value={filters.status} onChange={(e) => change({ status: e.target.value as LogFilterState['status'] })} className={FIELD_CLASS}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-primary flex-[0_1_170px]">
          Time
          <select value={filters.time} onChange={(e) => change({ time: e.target.value as LogFilterState['time'] })} className={FIELD_CLASS}>
            {TIME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-primary flex-[1_1_220px]">
          Search
          <input
            type="search"
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Path, table or request ID"
            className={`${FIELD_CLASS} px-3`}
          />
        </label>
      </div>

      <section aria-label="Log entries" className="bg-[var(--color-card)] border rounded-xl px-4 pt-2 pb-3">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs text-secondary">
                {HEADERS.map(({ label, className }) => (
                  <th key={label} scope="col" className={`px-2 py-3 font-medium border-b ${className ?? ''}`}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.isLoading && !nothingCanMatch && (
                <tr>
                  <td colSpan={6} className="py-10 text-center">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" aria-label="Loading" />
                  </td>
                </tr>
              )}
              {logs.isError && (
                <tr>
                  <td colSpan={6} className="py-6">
                    <div role="alert" className="p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800 flex items-center justify-between gap-3">
                      <span>{apiErrorMessage(logs.error, 'Could not load the API logs. Please try again.')}</span>
                      <button type="button" onClick={() => void logs.refetch()} className="font-medium underline">
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {!logs.isLoading && !logs.isError && entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-secondary">{emptyText}</td>
                </tr>
              )}
              {entries.map((entry, index) => {
                const key = entryKey(entry, index);
                return (
                  <EntryRow
                    key={key}
                    entry={entry}
                    open={effectiveOpen === key}
                    onToggle={() => setOpenKey(effectiveOpen === key ? null : key)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 px-2 text-[13px] text-secondary">
          <span>
            {`Showing ${entries.length}${total === undefined ? '' : ` of ${Math.max(total, entries.length)}`} ${(total ?? entries.length) === 1 ? 'entry' : 'entries'} · newest first`}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={refresh} className={`${BUTTON_CLASS} flex items-center gap-1.5`}>
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void logs.fetchNextPage()}
              disabled={!logs.hasNextPage || logs.isFetchingNextPage}
              className={`${BUTTON_CLASS} min-h-[40px] px-3.5 flex items-center gap-1.5`}
            >
              {logs.isFetchingNextPage && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
              Load older
            </button>
          </div>
        </div>
      </section>

      <section aria-labelledby="api-logs-usage-title" className="bg-[var(--color-card)] border rounded-xl p-5 flex flex-col gap-3.5">
        <h3 id="api-logs-usage-title" className="m-0 text-base font-semibold text-primary">Usage by key, last 7 days</h3>
        <p className="m-0 text-sm text-secondary">
          Calls per API key will show here once API keys are available. Until then every call is made without a key.
        </p>
      </section>
    </div>
  );
};

export default DeveloperLogs;
