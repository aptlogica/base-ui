import { describe, it, expect } from 'vitest';
import type { BaseApiLogEntry } from '../../../../service/clientService';
import {
  DEFAULT_LOG_FILTERS,
  describeEntry,
  displayPath,
  effectiveLevel,
  entryDetails,
  formatLogTime,
  levelInfo,
  responseJson,
  statusTone,
  timeWindow,
  toLogFilters,
} from '../apiLogsModel';

const NOW = Date.parse('2026-11-26T12:00:00Z');

const entry = (fields: BaseApiLogEntry['fields'], extra: Partial<BaseApiLogEntry> = {}): BaseApiLogEntry => ({
  timestamp: '2026-11-26T10:31:44.123Z',
  level: 'info',
  message: 'GET /api/v1/:bs/tables returned 200',
  service: 'sereni-base',
  labels: { env: 'dev' },
  fields,
  ...extra,
});

describe('timeWindow', () => {
  it('ends now and starts the range ago', () => {
    expect(timeWindow('1h', NOW)).toEqual({ start: '2026-11-26T11:00:00.000Z', end: '2026-11-26T12:00:00.000Z' });
    expect(timeWindow('24h', NOW).start).toBe('2026-11-25T12:00:00.000Z');
    expect(timeWindow('7d', NOW).start).toBe('2026-11-19T12:00:00.000Z');
  });

  it('keeps the longest window inside the retention period', () => {
    const { start, end } = timeWindow('all', NOW);
    const span = Date.parse(end) - Date.parse(start);
    expect(span).toBeLessThan(14 * 24 * 60 * 60 * 1000);
    expect(span).toBeGreaterThan(13 * 24 * 60 * 60 * 1000);
  });
});

describe('effectiveLevel', () => {
  it('uses the level alone, or the status alone', () => {
    expect(effectiveLevel('error', 'any')).toBe('error');
    expect(effectiveLevel('all', '4xx')).toBe('warn');
    expect(effectiveLevel('all', '2xx')).toBe('info');
    expect(effectiveLevel('all', '5xx')).toBe('error');
  });

  it('accepts a level and a status that agree, and refuses ones that do not', () => {
    expect(effectiveLevel('warn', '4xx')).toBe('warn');
    expect(effectiveLevel('error', '2xx')).toBe('none');
  });
});

describe('toLogFilters', () => {
  it('sends only the window by default', () => {
    expect(toLogFilters(DEFAULT_LOG_FILTERS, NOW)).toEqual(timeWindow('24h', NOW));
  });

  it('sends level, method and search; the status becomes a level', () => {
    const filters = toLogFilters({ level: 'all', method: 'POST', status: '5xx', time: '1h', search: '  orders ' }, NOW);
    expect(filters).toEqual({ ...timeWindow('1h', NOW), level: 'error', method: 'POST', search: 'orders' });
  });

  it('leaves the level out for the count of All, keeping the status', () => {
    expect(toLogFilters({ ...DEFAULT_LOG_FILTERS, level: 'error' }, NOW, { withLevel: false })?.level).toBeUndefined();
    expect(toLogFilters({ ...DEFAULT_LOG_FILTERS, level: 'error', status: '4xx' }, NOW, { withLevel: false })?.level).toBe('warn');
  });

  it('is null when the level and the status exclude each other', () => {
    expect(toLogFilters({ ...DEFAULT_LOG_FILTERS, level: 'info', status: '5xx' }, NOW)).toBeNull();
  });
});

describe('showing an entry', () => {
  it('names the levels and tones the statuses', () => {
    expect(levelInfo('error')).toEqual({ label: 'Error', tone: 'error' });
    expect(levelInfo('warn')).toEqual({ label: 'Warning', tone: 'warn' });
    expect(levelInfo('info')).toEqual({ label: 'Info', tone: 'info' });
    expect(statusTone(500)).toBe('error');
    expect(statusTone(404)).toBe('warn');
    expect(statusTone(200)).toBe('ok');
    expect(statusTone(undefined)).toBe('neutral');
  });

  it('drops the base from the path', () => {
    expect(displayPath('/api/v1/bs_3eijvir3og/tables')).toBe('/tables');
    expect(displayPath('/api/v1/bs_3eijvir3og/tables/Default Table/records/rec_1042')).toBe('/tables/Default Table/records/rec_1042');
    expect(displayPath('/api/v1/bs_3eijvir3og')).toBe('/');
    expect(displayPath(undefined)).toBe('/');
  });

  it('formats time and date in UTC', () => {
    expect(formatLogTime('2026-11-26T10:31:44.123Z')).toEqual({ time: '10:31:44', date: '26 Nov 2026' });
    expect(formatLogTime('nope')).toEqual({ time: 'nope', date: '' });
  });

  it('lists the details with a dash for what is missing', () => {
    const details = entryDetails(entry({ request_id: 'req_1', event: 'log.api.request', api: '/api/v1/:bs/tables', base_id: 'bs_1' }));
    expect(details.map((d) => d.label)).toEqual([
      'Request ID', 'Event', 'Endpoint', 'Base', 'Table', 'Error code', 'Raw message', 'Service', 'Env',
    ]);
    expect(details.find((d) => d.label === 'Request ID')?.value).toBe('req_1');
    expect(details.find((d) => d.label === 'Table')?.value).toBe('—');
    expect(details.find((d) => d.label === 'Env')?.value).toBe('dev');
  });

  it('pretty-prints the stored response', () => {
    expect(responseJson(entry({ response: { error: { code: 'x' } } }))).toBe('{\n  "error": {\n    "code": "x"\n  }\n}');
    expect(responseJson(entry({}))).toBe('');
  });
});

describe('describeEntry', () => {
  it('uses the explanation the backend wrote for a failed call', () => {
    const e = entry({ status: 404, friendly: 'The record was not found.', error_message: 'No record rec_1.' });
    expect(describeEntry(e)).toBe('The record was not found.');
  });

  it('falls back to the error message, then the log message, for a failed call', () => {
    expect(describeEntry(entry({ status: 400, error_message: 'bad field' }))).toBe('bad field');
    expect(describeEntry(entry({ status: 500 }))).toBe('GET /api/v1/:bs/tables returned 200');
  });

  it.each([
    [{ method: 'GET', api: '/api/v1/:bs/tables', status: 200 }, 'Listed the tables of this base.'],
    [{ method: 'GET', api: '/api/v1/:bs/tables/:table/records', table: 'Orders', record_count: 0, status: 200 }, 'Loaded records from Orders. The table is empty.'],
    [{ method: 'GET', api: '/api/v1/:bs/tables/:table/records', table: 'Orders', record_count: 1, status: 200 }, 'Loaded 1 record from Orders.'],
    [{ method: 'GET', api: '/api/v1/:bs/tables/:table/records', table: 'Orders', record_count: 12, status: 200 }, 'Loaded 12 records from Orders.'],
    [{ method: 'POST', api: '/api/v1/:bs/tables/:table/records', table: 'Orders', status: 201 }, 'Created records in Orders.'],
    [{ method: 'PATCH', api: '/api/v1/:bs/tables/:table/records/:record', table: 'Orders', status: 200 }, 'Updated records in Orders.'],
    [{ method: 'DELETE', api: '/api/v1/:bs/tables/:table/records/:record', table: 'Orders', status: 200 }, 'Deleted a record from Orders.'],
    [{ method: 'POST', api: '/api/v1/:bs/tables/:table/records/delete', table: 'Orders', status: 200 }, 'Deleted records from Orders.'],
  ])('describes a successful call %#', (fields, expected) => {
    expect(describeEntry(entry(fields))).toBe(expected);
  });

  it('shows the log message for a call it has no sentence for', () => {
    expect(describeEntry(entry({ method: 'GET', api: '/api/v1/:bs/other', status: 200 }))).toBe('GET /api/v1/:bs/tables returned 200');
  });
});
