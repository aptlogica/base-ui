// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import type { BaseApiLogEntry, BaseApiLogFilters } from '../../../service/clientService';

// How long the log service keeps entries (LOGSERVICE_RETENTION_DAYS, 14 unless the server says otherwise)
export const LOG_RETENTION_DAYS = 14;
export const LOG_SERVICE_NAME = 'sereni-base';
export const LOG_PAGE_SIZE = 50;

// The log service refuses a window longer than the retention period, so the longest window stops a little short
const RETENTION_MARGIN_MS = 5 * 60 * 1000;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export type LevelFilter = 'all' | 'error' | 'warn' | 'info';
export type StatusFilter = 'any' | '2xx' | '4xx' | '5xx';
export type MethodFilter = 'any' | 'GET' | 'POST' | 'PATCH' | 'DELETE';
export type TimeRange = '1h' | '24h' | '7d' | 'all';

export const LEVEL_OPTIONS: { value: LevelFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'error', label: 'Errors' },
  { value: 'warn', label: 'Warnings' },
  { value: 'info', label: 'Info' },
];

export const METHOD_OPTIONS: { value: MethodFilter; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
];

export const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: '2xx', label: '2xx' },
  { value: '4xx', label: '4xx' },
  { value: '5xx', label: '5xx' },
];

export const TIME_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '1h', label: 'Last hour' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: 'all', label: `Last ${LOG_RETENTION_DAYS} days (all)` },
];

export interface LogFilterState {
  level: LevelFilter;
  method: MethodFilter;
  status: StatusFilter;
  time: TimeRange;
  search: string;
}

export const DEFAULT_LOG_FILTERS: LogFilterState = {
  level: 'all',
  method: 'any',
  status: 'any',
  time: '24h',
  search: '',
};

// A status class is a level: the API logs 5xx as error, 4xx as warning and everything else as info
const LEVEL_OF_STATUS: Record<Exclude<StatusFilter, 'any'>, Exclude<LevelFilter, 'all'>> = {
  '2xx': 'info',
  '4xx': 'warn',
  '5xx': 'error',
};

// The level to ask for, or 'none' when the level and the status ask for different ones (nothing can match)
export const effectiveLevel = (level: LevelFilter, status: StatusFilter): Exclude<LevelFilter, 'all'> | 'all' | 'none' => {
  if (status === 'any') return level;
  const fromStatus = LEVEL_OF_STATUS[status];
  if (level === 'all' || level === fromStatus) return fromStatus;
  return 'none';
};

// The window of a time range, ending at `now`
export const timeWindow = (range: TimeRange, now: number): { start: string; end: string } => {
  const spans: Record<TimeRange, number> = {
    '1h': HOUR_MS,
    '24h': DAY_MS,
    '7d': 7 * DAY_MS,
    all: LOG_RETENTION_DAYS * DAY_MS - RETENTION_MARGIN_MS,
  };
  return { start: new Date(now - spans[range]).toISOString(), end: new Date(now).toISOString() };
};

// The filters of the log endpoints for the screen's filters, or null when none can match.
// withLevel false leaves the level out: the count of the "All" chip.
export const toLogFilters = (
  state: LogFilterState,
  now: number,
  options: { withLevel?: boolean } = {}
): BaseApiLogFilters | null => {
  const { withLevel = true } = options;
  const level = effectiveLevel(withLevel ? state.level : 'all', state.status);
  if (level === 'none') return null;
  const filters: BaseApiLogFilters = { ...timeWindow(state.time, now) };
  if (level !== 'all') filters.level = level;
  if (state.method !== 'any') filters.method = state.method;
  const search = state.search.trim();
  if (search) filters.search = search;
  return filters;
};

// ---- Showing an entry ----

export type Tone = 'error' | 'warn' | 'info' | 'ok' | 'neutral';

const LEVELS: Record<string, { label: string; tone: Tone }> = {
  error: { label: 'Error', tone: 'error' },
  fatal: { label: 'Error', tone: 'error' },
  warn: { label: 'Warning', tone: 'warn' },
  info: { label: 'Info', tone: 'info' },
  debug: { label: 'Debug', tone: 'neutral' },
};

export const levelInfo = (level: string): { label: string; tone: Tone } =>
  LEVELS[level?.toLowerCase()] ?? { label: level || 'Info', tone: 'neutral' };

export const statusTone = (status: number | undefined): Tone => {
  if (status === undefined) return 'neutral';
  if (status >= 500) return 'error';
  if (status >= 400) return 'warn';
  return 'ok';
};

export const METHOD_TONES: Record<string, Tone> = { GET: 'ok', POST: 'info', PATCH: 'warn', PUT: 'warn', DELETE: 'error' };

// /api/v1/bs_3eijvir3og/tables -> /tables: the base is the screen's, so the address starts after it
export const displayPath = (path: string | undefined): string => {
  const rest = (path ?? '').replace(/^\/api\/v1\/[^/]+/, '');
  return rest || '/';
};

export const isErrorEntry = (entry: BaseApiLogEntry): boolean => (entry.fields?.status ?? 0) >= 400;

// The explanation of a request. A failed call carries its own (friendly) from the backend; a successful one is
// described here from what it did.
export const describeEntry = (entry: BaseApiLogEntry): string => {
  const f = entry.fields ?? {};
  if (f.friendly) return f.friendly;
  if (isErrorEntry(entry)) return f.error_message || entry.message;

  const route = (f.api ?? '').replace(/^\/api\/v1\/:bs/, '') || '/';
  const table = f.table ? `${f.table}` : 'the table';
  const method = (f.method ?? '').toUpperCase();
  const count = f.record_count;
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

  if (method === 'GET' && route === '/tables') return 'Listed the tables of this base.';
  if (method === 'GET' && route === '/tables/:table') return `Loaded the fields of ${table}.`;
  if (method === 'GET' && route === '/tables/:table/columns') return `Listed the columns of ${table}.`;
  if (method === 'GET' && route === '/tables/:table/records') {
    if (count === undefined) return `Loaded records from ${table}.`;
    return count === 0 ? `Loaded records from ${table}. The table is empty.` : `Loaded ${plural(count, 'record')} from ${table}.`;
  }
  if (method === 'GET' && route === '/tables/:table/records/:record') return `Loaded one record from ${table}.`;
  if (method === 'POST' && route === '/tables/:table/records') return `Created records in ${table}.`;
  if (method === 'POST' && route === '/tables/:table/records/query') return `Searched the records of ${table}.`;
  if (method === 'POST' && route === '/tables/:table/records/aggregate') return `Calculated totals for ${table}.`;
  if (method === 'POST' && route === '/tables/:table/records/delete') return `Deleted records from ${table}.`;
  if (method === 'PATCH' && route.startsWith('/tables/:table/records')) return `Updated records in ${table}.`;
  if (method === 'DELETE' && route.startsWith('/tables/:table/records')) return `Deleted a record from ${table}.`;
  return entry.message;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 10:31:44 and 26 Nov 2026, both in UTC as the column says
export const formatLogTime = (iso: string): { time: string; date: string } => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { time: iso, date: '' };
  return {
    time: d.toISOString().slice(11, 19),
    date: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
  };
};

// The label/value pairs of the opened row
export const entryDetails = (entry: BaseApiLogEntry): { label: string; value: string }[] => {
  const f = entry.fields ?? {};
  const dash = (v: string | undefined) => (v && v.length > 0 ? v : '—');
  return [
    { label: 'Request ID', value: dash(f.request_id) },
    { label: 'Event', value: dash(f.event) },
    { label: 'Endpoint', value: dash(f.api) },
    { label: 'Base', value: dash(f.base_id) },
    { label: 'Table', value: dash(f.table) },
    { label: 'Error code', value: dash(f.error_code) },
    { label: 'Raw message', value: dash(f.error_message) },
    { label: 'Service', value: dash(entry.service) },
    { label: 'Env', value: dash(entry.labels?.env) },
  ];
};

// The response the API sent, as shown and copied; '' when none was stored
export const responseJson = (entry: BaseApiLogEntry): string =>
  entry.fields?.response ? JSON.stringify(entry.fields.response, null, 2) : '';

export const entryKey = (entry: BaseApiLogEntry, index: number): string =>
  `${entry.timestamp}|${entry.fields?.request_id ?? ''}|${index}`;
