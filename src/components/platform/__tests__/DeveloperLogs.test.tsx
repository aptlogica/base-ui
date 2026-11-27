import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import DeveloperLogs from '../DeveloperLogs';
import { useBaseApi } from '../useBaseApi';
import { useBaseApiLogCount, useBaseApiLogs, useOldestBaseApiLog } from '../useBaseApiLogs';
import type { BaseApiLogEntry } from '../../../service/clientService';

vi.mock('../useBaseApi', () => ({ useBaseApi: vi.fn() }));
vi.mock('../useBaseApiLogs', () => ({
  useBaseApiLogs: vi.fn(),
  useBaseApiLogCount: vi.fn(),
  useOldestBaseApiLog: vi.fn(),
}));

const useBaseApiMock = vi.mocked(useBaseApi);
const useLogsMock = vi.mocked(useBaseApiLogs);
const useCountMock = vi.mocked(useBaseApiLogCount);
const useOldestMock = vi.mocked(useOldestBaseApiLog);

const fetchNextPage = vi.fn();
const refetch = vi.fn();

const errorEntry: BaseApiLogEntry = {
  timestamp: '2026-11-26T10:31:44.123Z',
  level: 'error',
  message: 'GET /api/v1/:bs/tables returned 500',
  service: 'sereni-base',
  labels: { env: 'dev', service: 'sereni-base' },
  fields: {
    event: 'log.api.server_error',
    api: '/api/v1/:bs/tables',
    path: '/api/v1/bs_3eijvir3og/tables',
    method: 'GET',
    base_id: 'bs_3eijvir3og',
    status: 500,
    duration_ms: 3,
    request_id: 'req_12590f1df22e4853a012541a55ff4f92',
    error_code: 'internal_error',
    error_message: 'Something went wrong on our side.',
    friendly: 'Something went wrong on our side while loading the tables list.',
    suggestion: 'Try again. If it keeps happening, share the request ID with support.',
    response: { data: null, error: { code: 'internal_error' } },
  },
};

const warnEntry: BaseApiLogEntry = {
  timestamp: '2026-11-26T10:25:19.000Z',
  level: 'warn',
  message: 'DELETE returned 404',
  service: 'sereni-base',
  labels: { env: 'dev' },
  fields: {
    api: '/api/v1/:bs/tables/:table/records/:record',
    path: '/api/v1/bs_3eijvir3og/tables/Default Table/records/rec_1042',
    method: 'DELETE',
    base_id: 'bs_3eijvir3og',
    table: 'Default Table',
    status: 404,
    duration_ms: 15,
    request_id: 'req_e298',
    friendly: 'Record rec_1042 was not found in Default Table, so nothing was deleted.',
    suggestion: 'It may already be deleted. Check the record ID.',
  },
};

const infoEntry: BaseApiLogEntry = {
  timestamp: '2026-11-26T10:18:36.000Z',
  level: 'info',
  message: 'GET returned 200',
  service: 'sereni-base',
  labels: { env: 'dev' },
  fields: {
    api: '/api/v1/:bs/tables/:table/records',
    path: '/api/v1/bs_3eijvir3og/tables/Default Table/records',
    method: 'GET',
    base_id: 'bs_3eijvir3og',
    table: 'Default Table',
    status: 200,
    duration_ms: 32,
    record_count: 0,
    request_id: 'req_5db2',
  },
};

const mockLogs = (entries: BaseApiLogEntry[], extra: Record<string, unknown> = {}) => {
  useLogsMock.mockReturnValue({
    data: { pages: [{ data: { count: entries.length, entries } }] },
    isLoading: false,
    isError: false,
    error: null,
    refetch,
    fetchNextPage,
    hasNextPage: false,
    isFetchingNextPage: false,
    ...extra,
  } as any);
};

const mockCounts = (count: number | undefined) => {
  useCountMock.mockImplementation(((_id: unknown, filters: unknown) => ({ data: filters === null ? undefined : count })) as any);
};

const lastListFilters = () => useLogsMock.mock.calls[useLogsMock.mock.calls.length - 1][1];

describe('DeveloperLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBaseApiMock.mockReturnValue({ data: { base_id: 'base-1', enabled: true } } as any);
    useOldestMock.mockReturnValue({ data: '2026-11-12T08:00:00Z' } as any);
    mockCounts(11);
    mockLogs([errorEntry, warnEntry, infoEntry]);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the title, the service and env chips and the retention note', () => {
    render(<DeveloperLogs baseId="base-1" />);

    expect(screen.getByRole('heading', { name: 'Logs' })).toBeInTheDocument();
    expect(screen.getByText('Every API call to this base, with its status, timing and error.')).toBeInTheDocument();
    expect(screen.getByText('service: sereni-base')).toBeInTheDocument();
    expect(screen.getByText('env: dev')).toBeInTheDocument();
    const note = screen.getByRole('note');
    expect(note).toHaveTextContent('Logs are kept for 14 days, then deleted automatically.');
    expect(note).toHaveTextContent('Oldest entry available: 12 Nov 2026.');
  });

  it('leaves out the oldest entry until it is known', () => {
    useOldestMock.mockReturnValue({ data: undefined } as any);
    render(<DeveloperLogs baseId="base-1" />);

    expect(screen.getByRole('note')).not.toHaveTextContent('Oldest entry');
  });

  it('shows one row per entry with level, request, status, duration and message', () => {
    render(<DeveloperLogs baseId="base-1" />);

    const rows = within(screen.getByRole('table')).getAllByRole('row');
    // header, 3 entries and the opened first entry's details
    expect(rows).toHaveLength(5);

    const first = rows[1];
    expect(within(first).getByText('10:31:44')).toBeInTheDocument();
    expect(within(first).getByText('26 Nov 2026')).toBeInTheDocument();
    expect(within(first).getByText('Error')).toBeInTheDocument();
    expect(within(first).getByText('GET')).toBeInTheDocument();
    expect(within(first).getByText('/tables')).toBeInTheDocument();
    expect(within(first).getByText('Base: bs_3eijvir3og')).toBeInTheDocument();
    expect(within(first).getByText('500')).toBeInTheDocument();
    expect(within(first).getByText('3 ms')).toBeInTheDocument();
    expect(within(first).getByText('Something went wrong on our side while loading the tables list.')).toBeInTheDocument();
    expect(within(first).getByText('Try again. If it keeps happening, share the request ID with support.')).toBeInTheDocument();

    const warn = rows[3];
    expect(within(warn).getByText('Warning')).toBeInTheDocument();
    expect(within(warn).getByText('/tables/Default Table/records/rec_1042')).toBeInTheDocument();
    expect(within(warn).getByText('Table: Default Table')).toBeInTheDocument();
    expect(within(warn).getByText('404')).toBeInTheDocument();
  });

  it('describes a successful call, which has no explanation from the backend', () => {
    render(<DeveloperLogs baseId="base-1" />);

    expect(screen.getByText('Loaded records from Default Table. The table is empty.')).toBeInTheDocument();
  });

  it('opens the first entry with its details and the response that was sent', () => {
    render(<DeveloperLogs baseId="base-1" />);

    expect(screen.getByText('Response sent')).toBeInTheDocument();
    expect(screen.getByText('req_12590f1df22e4853a012541a55ff4f92')).toBeInTheDocument();
    expect(screen.getByText('log.api.server_error')).toBeInTheDocument();
    expect(screen.getByText('internal_error')).toBeInTheDocument();
    expect(screen.getByText(/"code": "internal_error"/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Hide details of GET \/tables/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens another entry and closes the first', () => {
    render(<DeveloperLogs baseId="base-1" />);

    fireEvent.click(screen.getByRole('button', { name: /^Show details of DELETE/ }));

    expect(screen.getByRole('button', { name: /^Show details of GET \/tables$/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('req_e298')).toBeInTheDocument();
    expect(screen.getByText('The response of this request was not stored. Bodies are kept for failed requests.')).toBeInTheDocument();
  });

  it('closes the open entry', () => {
    render(<DeveloperLogs baseId="base-1" />);

    fireEvent.click(screen.getByRole('button', { name: /^Hide details of GET \/tables/ }));

    expect(screen.queryByText('Response sent')).not.toBeInTheDocument();
  });

  it('copies the request ID and the response JSON', async () => {
    render(<DeveloperLogs baseId="base-1" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy request ID' }));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('req_12590f1df22e4853a012541a55ff4f92');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy JSON' }));
    });
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(JSON.stringify(errorEntry.fields?.response, null, 2));
  });

  it('shows the count on All and the total in the footer', () => {
    render(<DeveloperLogs baseId="base-1" />);

    expect(screen.getByRole('button', { name: /^All\s*11$/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Showing 3 of 11 entries · newest first')).toBeInTheDocument();
  });

  it('asks for the last 24 hours with no other filter at first', () => {
    render(<DeveloperLogs baseId="base-1" />);

    const filters = lastListFilters() as Record<string, string>;
    expect(Object.keys(filters).sort()).toEqual(['end', 'start']);
    expect(Date.parse(filters.end) - Date.parse(filters.start)).toBe(24 * 60 * 60 * 1000);
  });

  it('filters by level, with its own total in the footer', () => {
    render(<DeveloperLogs baseId="base-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Errors' }));

    expect(lastListFilters()).toMatchObject({ level: 'error' });
    expect(screen.getByRole('button', { name: 'Errors' })).toHaveAttribute('aria-pressed', 'true');
    // the All chip counts without the level, the footer with it
    const countCalls = useCountMock.mock.calls.slice(-2).map((c) => c[1]);
    expect(countCalls).toContainEqual(expect.objectContaining({ level: 'error' }));
  });

  it('filters by method, time and status class (a status class is a level)', () => {
    render(<DeveloperLogs baseId="base-1" />);

    fireEvent.change(screen.getByLabelText('Method'), { target: { value: 'POST' } });
    expect(lastListFilters()).toMatchObject({ method: 'POST' });

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: '4xx' } });
    expect(lastListFilters()).toMatchObject({ method: 'POST', level: 'warn' });

    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '1h' } });
    const filters = lastListFilters() as Record<string, string>;
    expect(Date.parse(filters.end) - Date.parse(filters.start)).toBe(60 * 60 * 1000);
  });

  it('asks nothing and says why when the level and the status exclude each other', () => {
    render(<DeveloperLogs baseId="base-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Errors' }));
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: '2xx' } });

    expect(lastListFilters()).toBeNull();
    mockLogs([]);
    fireEvent.change(screen.getByLabelText('Method'), { target: { value: 'GET' } });
    expect(screen.getByText(/exclude each other/)).toBeInTheDocument();
    expect(screen.getByText('Showing 0 of 0 entries · newest first')).toBeInTheDocument();
  });

  it('searches after a short pause', () => {
    vi.useFakeTimers();
    render(<DeveloperLogs baseId="base-1" />);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'orders' } });
    expect(lastListFilters()).not.toHaveProperty('search');

    act(() => {
      vi.advanceTimersByTime(450);
    });
    expect(lastListFilters()).toMatchObject({ search: 'orders' });
  });

  it('loads older entries', () => {
    mockLogs([errorEntry], { hasNextPage: true });
    render(<DeveloperLogs baseId="base-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Load older' }));

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('cannot load older entries when there are none', () => {
    render(<DeveloperLogs baseId="base-1" />);

    expect(screen.getByRole('button', { name: 'Load older' })).toBeDisabled();
  });

  it('refreshes with a new window', () => {
    render(<DeveloperLogs baseId="base-1" />);
    const before = lastListFilters() as Record<string, string>;

    vi.useFakeTimers();
    vi.setSystemTime(Date.parse(before.end) + 60_000);
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    expect((lastListFilters() as Record<string, string>).end).not.toBe(before.end);
  });

  it('shows a spinner while the first page loads', () => {
    mockLogs([], { data: undefined, isLoading: true });
    render(<DeveloperLogs baseId="base-1" />);

    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('shows the error with a retry', () => {
    mockLogs([], { data: undefined, isError: true, error: { code: 'BSA_1003', message: 'Log service is not configured' } });
    render(<DeveloperLogs baseId="base-1" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Log service is not configured');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('says so when no call matches', () => {
    mockLogs([]);
    mockCounts(0);
    render(<DeveloperLogs baseId="base-1" />);

    expect(screen.getByText('No API calls match these filters.')).toBeInTheDocument();
  });

  it('points to Overview when the API was never turned on', () => {
    useBaseApiMock.mockReturnValue({ data: { base_id: 'base-1', enabled: false } } as any);
    mockLogs([]);
    render(<DeveloperLogs baseId="base-1" />);

    expect(screen.getByText(/Turn on the API in Overview/)).toBeInTheDocument();
  });

  it('keeps the usage section, without numbers, until API keys exist', () => {
    render(<DeveloperLogs baseId="base-1" />);

    expect(screen.getByRole('heading', { name: 'Usage by key, last 7 days' })).toBeInTheDocument();
    expect(screen.getByText(/once API keys are available/)).toBeInTheDocument();
  });
});
