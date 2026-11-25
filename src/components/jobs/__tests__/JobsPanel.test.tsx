import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { JobsPanel } from '../JobsPanel';
import type { TransferJob } from '../../../service/baseJobsService';

const now = new Date().toISOString();
const J = (o: Partial<TransferJob>): TransferJob => ({ id: Math.random().toString(36), type: 'export', status: 'completed', progress: 100, created_at: now, ...o });

const jobs: TransferJob[] = [
  J({ id: 'a', type: 'export', format: 'json', base_title: 'Sales CRM', status: 'running', progress: 62 }),
  J({ id: 'b', type: 'import', format: 'csv', base_title: 'Customers', status: 'queued', progress: 0 }),
  J({ id: 'c', type: 'export', format: 'xlsx', base_title: 'Inventory', file_name: 'Inventory.xlsx', size_bytes: 4.2 * 1024 * 1024, expires_at: new Date(Date.now() + 23 * 3600 * 1000).toISOString() }),
  J({ id: 'd', type: 'import', format: 'json', base_id: 'nb', base_title: 'Orders 2024', result: { tables: 3, rows: 1240 }, has_log: true, skipped_rows: 12, expires_at: new Date(Date.now() + 15 * 60000 + 20000).toISOString() }),
  J({ id: 'e', type: 'import', format: 'xlsx', base_title: 'Leads', status: 'failed', error: 'Leads.xlsx is not a valid workbook', result: { problems: ['p1', 'p2'] }, has_log: true }),
];

const actions = () => ({ onDownloadExport: vi.fn(), onDownloadLog: vi.fn(), onRetry: vi.fn() });
const renderPanel = (over: Partial<React.ComponentProps<typeof JobsPanel>> = {}) => {
  const a = actions();
  render(<JobsPanel workspaceName="Marketing" jobs={jobs} loading={false} error="" {...a} {...over} />);
  return a;
};

describe('JobsPanel', () => {
  it('lists every job with its chip, status and the counts on the tabs (only the counts above zero)', () => {
    renderPanel();
    expect(screen.getByText('Background Jobs · Marketing')).toBeTruthy();
    expect(screen.getAllByTestId('job-row')).toHaveLength(5);
    expect(screen.getByRole('tab', { name: 'All 5' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Running 2' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Completed 2' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Failed 1' })).toBeTruthy();
    expect(screen.getByText('Export · JSON')).toBeTruthy();
    expect(screen.getByText('Import · CSV')).toBeTruthy();
    expect(screen.getByText('Running 62%')).toBeTruthy();
    expect(screen.getByText('Queued')).toBeTruthy();
    expect(screen.getByText('Completed · 12 skipped')).toBeTruthy();
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
  });

  it('the tabs filter the list', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('tab', { name: 'Running 2' }));
    expect(screen.getAllByTestId('job-row')).toHaveLength(2);
    fireEvent.click(screen.getByRole('tab', { name: 'Failed 1' }));
    expect(screen.getAllByTestId('job-row')).toHaveLength(1);
    expect(screen.getByText('Leads.xlsx is not a valid workbook')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Completed 2' }));
    expect(screen.getAllByTestId('job-row')).toHaveLength(2);
  });

  it('each state has its action: Download, View details, Download log; a finished import has no Open base button', () => {
    const a = renderPanel();
    const rows = screen.getAllByTestId('job-row');
    const row = (title: string) => rows.find((r) => within(r).queryByText(title)) as HTMLElement;

    fireEvent.click(within(row('Inventory')).getByText('Download'));
    expect(a.onDownloadExport).toHaveBeenCalledWith(expect.objectContaining({ id: 'c' }));
    expect(within(row('Inventory')).getByText(/4\.2 MB/)).toBeTruthy();
    expect(within(row('Inventory')).getByText(/expires in 23 h/)).toBeTruthy();

    expect(within(row('Orders 2024')).queryByText('Open base')).toBeNull();
    expect(within(row('Orders 2024')).getByText(/3 tables · 1,240 rows · expires in 15 min/)).toBeTruthy();
    fireEvent.click(within(row('Orders 2024')).getByText('Download log'));
    expect(a.onDownloadLog).toHaveBeenCalledWith(expect.objectContaining({ id: 'd' }));

    // a running job has no action
    expect(within(row('Sales CRM')).queryByRole('button')).toBeNull();

    // a failed job lists its problems on request, and has the log
    expect(within(row('Leads')).queryByText('p1')).toBeNull();
    fireEvent.click(within(row('Leads')).getByText('View details'));
    expect(within(row('Leads')).getByText('p1')).toBeTruthy();
    fireEvent.click(within(row('Leads')).getByText('Hide details'));
    expect(within(row('Leads')).queryByText('p1')).toBeNull();
    fireEvent.click(within(row('Leads')).getByText('Download log'));
    expect(a.onDownloadLog).toHaveBeenCalledWith(expect.objectContaining({ id: 'e' }));
  });

  it('an export has no log button, and a job with no format still shows its kind', () => {
    renderPanel({ jobs: [J({ id: 'x', type: 'export', base_title: 'Old', has_log: true }), J({ id: 'y', type: 'import', base_title: 'Older', base_id: 'b1' })] });
    expect(screen.queryByText('Download log')).toBeNull();
    expect(screen.getByText('Export')).toBeTruthy();
    expect(screen.getByText('Import')).toBeTruthy();
  });

  it('empty, loading and error states', () => {
    const { unmount } = render(<JobsPanel jobs={[]} loading={false} error="" onRetry={vi.fn()} onDownloadExport={vi.fn()} onDownloadLog={vi.fn()} />);
    expect(screen.getByText('No jobs in this workspace yet.')).toBeTruthy();
    unmount();

    const loading = render(<JobsPanel jobs={[]} loading error="" onRetry={vi.fn()} onDownloadExport={vi.fn()} onDownloadLog={vi.fn()} />);
    expect(screen.getByText('Loading jobs…')).toBeTruthy();
    loading.unmount();

    const onRetry = vi.fn();
    render(<JobsPanel jobs={[]} loading={false} error="The jobs could not be loaded" onRetry={onRetry} onDownloadExport={vi.fn()} onDownloadLog={vi.fn()} />);
    expect(screen.getByRole('alert').textContent).toContain('The jobs could not be loaded');
    fireEvent.click(screen.getByText('Try again'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('a tab with nothing in it says so', () => {
    renderPanel({ jobs: [J({ status: 'completed', base_title: 'Done' })] });
    fireEvent.click(screen.getByRole('tab', { name: 'Failed' }));
    expect(screen.getByText('No jobs here.')).toBeTruthy();
  });

  it('a count shows only when it is above zero; running counts are green and failed counts red', () => {
    renderPanel({ jobs: [J({ id: 'x', status: 'completed', base_title: 'Done' })] });
    // one completed job: All and Completed have a count, Running and Failed show only their names
    expect(screen.getByTestId('jobs-tab-count-all').textContent).toBe('1');
    expect(screen.getByTestId('jobs-tab-count-completed').textContent).toBe('1');
    expect(screen.queryByTestId('jobs-tab-count-running')).toBeNull();
    expect(screen.queryByTestId('jobs-tab-count-failed')).toBeNull();
    expect(screen.getByRole('tab', { name: 'Running' }).textContent).toBe('Running');
    expect(screen.getByRole('tab', { name: 'Failed' }).textContent).toBe('Failed');
  });

  it('the pills: green for the selected tab and for running, red for failed, grey for the others', () => {
    renderPanel();
    expect(screen.getByTestId('jobs-tab-count-all').className).toContain('bg-green-600');
    expect(screen.getByTestId('jobs-tab-count-running').className).toContain('bg-green-600');
    expect(screen.getByTestId('jobs-tab-count-failed').className).toContain('bg-red-600');
    expect(screen.getByTestId('jobs-tab-count-completed').className).toContain('bg-gray-300');
    // selecting Completed turns its pill green and All's grey
    fireEvent.click(screen.getByRole('tab', { name: 'Completed 2' }));
    expect(screen.getByTestId('jobs-tab-count-completed').className).toContain('bg-green-600');
    expect(screen.getByTestId('jobs-tab-count-all').className).toContain('bg-gray-300');
  });
});
