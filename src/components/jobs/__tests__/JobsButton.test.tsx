import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';

const { listMock, toast, downloadExport, downloadLog, nav, location } = vi.hoisted(() => ({
  listMock: vi.fn(),
  location: { pathname: '/workspace/ws1' },
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
  downloadExport: vi.fn(),
  downloadLog: vi.fn(),
  nav: { selectedWorkspaceId: 'ws1' as string | null },
}));

vi.mock('../../../service/baseJobsService', async (orig) => ({ ...(await orig<typeof import('../../../service/baseJobsService')>()), listWorkspaceJobs: listMock }));
vi.mock('../../../service/baseExportService', () => ({ downloadExportJob: downloadExport, downloadImportLog: downloadLog }));
vi.mock('react-router-dom', () => ({ useLocation: () => location }));
vi.mock('../../common/Toast', () => ({ useToast: () => toast }));
vi.mock('../../../stores/navigationStore', () => ({ useNavigationStore: () => nav }));

import JobsButton, { isHomePath } from '../JobsButton';
import { announceJobInBackground, requestJobsRefresh } from '../../../service/jobsEvents';

const now = new Date().toISOString();
const running = { id: 'a', type: 'export', format: 'json', base_title: 'Sales CRM', status: 'running', progress: 62, created_at: now };
const exported = { id: 'b', type: 'export', format: 'csv', base_title: 'Inventory', file_name: 'Inventory.csv.zip', status: 'completed', progress: 100, created_at: now };
const imported = { id: 'c', type: 'import', format: 'json', base_id: 'nb', workspace_id: 'ws1', base_title: 'Orders', status: 'completed', progress: 100, created_at: now, has_log: true };

describe('JobsButton', () => {
  beforeEach(() => {
    listMock.mockReset();
    downloadExport.mockReset();
    downloadLog.mockReset();
    toast.error.mockReset();
    nav.selectedWorkspaceId = 'ws1';
    location.pathname = '/workspace/ws1';
    listMock.mockResolvedValue([]);
  });

  it('shows nothing without a workspace', () => {
    nav.selectedWorkspaceId = null;
    const { container } = render(<JobsButton />);
    expect(container.firstChild).toBeNull();
    expect(listMock).not.toHaveBeenCalled();
  });

  it('shows on the home page only', () => {
    expect(isHomePath('/workspace')).toBe(true);
    expect(isHomePath('/workspace/')).toBe(true);
    expect(isHomePath('/workspace/ws1')).toBe(true);
    expect(isHomePath('/workspace/ws1/')).toBe(true);
    expect(isHomePath('/workspace/ws1/administrator')).toBe(false);
    expect(isHomePath('/workspace/ws1/base/b1')).toBe(false);
    expect(isHomePath('/workspace/ws1/base/b1/table/t1/grid')).toBe(false);
    expect(isHomePath('/login')).toBe(false);

    location.pathname = '/workspace/ws1/base/b1/table/t1/grid';
    const { container } = render(<JobsButton />);
    expect(container.firstChild).toBeNull();
  });

  it('the badge is the number of running jobs, and there is none when nothing runs', async () => {
    listMock.mockResolvedValue([running, { ...running, id: 'a2', status: 'queued' }, exported]);
    render(<JobsButton />);
    expect((await screen.findByTestId('jobs-badge')).textContent).toBe('2');
    expect(screen.getByRole('button', { name: 'Jobs, 2 running' })).toBeTruthy();
  });

  it('no badge when nothing is running', async () => {
    listMock.mockResolvedValue([exported]);
    render(<JobsButton />);
    await waitFor(() => expect(listMock).toHaveBeenCalled());
    expect(screen.queryByTestId('jobs-badge')).toBeNull();
    expect(screen.getByRole('button', { name: 'Jobs' })).toBeTruthy();
  });

  it('opens a popover under the icon with the jobs, and closes on Escape, on a click outside and on the icon', async () => {
    listMock.mockResolvedValue([running, exported]);
    render(<div><JobsButton /><p>outside</p></div>);
    const icon = screen.getByRole('button', { name: /^Jobs/ });
    expect(screen.queryByRole('dialog', { name: 'Jobs' })).toBeNull();

    fireEvent.click(icon);
    const dialog = await screen.findByRole('dialog', { name: 'Jobs' });
    // it is a popover: in the body (not in the header), fixed in place, and not a modal
    expect(dialog.parentElement).toBe(document.body);
    expect(dialog.className).toContain('fixed');
    expect(dialog.getAttribute('aria-modal')).toBeNull();
    expect(icon.getAttribute('aria-expanded')).toBe('true');
    expect(within(dialog).getAllByTestId('job-row')).toHaveLength(2);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Jobs' })).toBeNull();

    fireEvent.click(icon);
    await screen.findByRole('dialog', { name: 'Jobs' });
    fireEvent.mouseDown(screen.getByText('outside'));
    expect(screen.queryByRole('dialog', { name: 'Jobs' })).toBeNull();

    fireEvent.click(icon);
    await screen.findByRole('dialog', { name: 'Jobs' });
    // a click inside does not close it
    fireEvent.mouseDown(within(screen.getByRole('dialog', { name: 'Jobs' })).getByText('Sales CRM'));
    expect(screen.getByRole('dialog', { name: 'Jobs' })).toBeTruthy();
    fireEvent.click(icon);
    expect(screen.queryByRole('dialog', { name: 'Jobs' })).toBeNull();
  });

  it('opening asks for the latest list', async () => {
    render(<JobsButton />);
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Jobs' }));
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(2));
  });

  it('the row actions work: download an export, download a log; a finished import has no Open base button', async () => {
    listMock.mockResolvedValue([exported, imported]);
    render(<JobsButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Jobs' }));
    const dialog = await screen.findByRole('dialog', { name: 'Jobs' });
    await within(dialog).findByText('Inventory');

    fireEvent.click(within(dialog).getByText('Download'));
    expect(downloadExport).toHaveBeenCalledWith('b', 'Inventory.csv.zip');

    fireEvent.click(within(dialog).getByText('Download log'));
    expect(downloadLog).toHaveBeenCalledWith('c');

    expect(within(dialog).queryByText('Open base')).toBeNull();
  });

  it('a download that fails is a toast, not a crash', async () => {
    listMock.mockResolvedValue([exported]);
    downloadExport.mockRejectedValue(new Error('Could not download the export'));
    render(<JobsButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Jobs' }));
    const dialog = await screen.findByRole('dialog', { name: 'Jobs' });
    fireEvent.click(await within(dialog).findByText('Download'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Could not download the export'));
  });
});


describe('JobsButton: idle, running and the moves of the icon', () => {
  beforeEach(() => {
    listMock.mockReset();
    nav.selectedWorkspaceId = 'ws1';
    location.pathname = '/workspace/ws1';
    listMock.mockResolvedValue([]);
  });

  it('idle is a white box with a border; running is tinted, with the count and no ring', async () => {
    listMock.mockResolvedValue([exported]);
    const { unmount } = render(<JobsButton />);
    await waitFor(() => expect(listMock).toHaveBeenCalled());
    const idle = screen.getByRole('button', { name: 'Jobs' });
    expect(idle.className).toContain('bg-card');
    expect(idle.className).toContain('border-gray-200');
    expect(screen.queryByTestId('jobs-badge')).toBeNull();
    unmount();

    listMock.mockResolvedValue([running, { ...running, id: 'a2', progress: 30 }]);
    render(<JobsButton />);
    const busy = await screen.findByRole('button', { name: 'Jobs, 2 running' });
    expect(busy.className).toContain('bg-green-50');
    expect(screen.getByTestId('jobs-badge').textContent).toBe('2');
    expect(screen.queryByTestId('jobs-ring')).toBeNull();
  });

  it('the focus ring is for the keyboard only, so a click leaves no dark outline', async () => {
    render(<JobsButton />);
    const icon = screen.getByRole('button', { name: 'Jobs' });
    expect(icon.className).toContain('focus-visible:ring-2');
    expect(icon.className).not.toMatch(/(^|\s)focus:ring/);
  });

  it('a dialog closed on a running job sends an icon flying into the Jobs icon, which pops when it arrives', async () => {
    const animations: { onfinish?: () => void }[] = [];
    const animate = vi.fn(() => { const a: { onfinish?: () => void; cancel: () => void } = { cancel: vi.fn() }; animations.push(a); return a; });
    Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, writable: true, value: animate });
    render(<JobsButton />);
    await waitFor(() => expect(listMock).toHaveBeenCalled());

    act(() => announceJobInBackground('export'));
    const flyer = await screen.findByTestId('jobs-flyer');
    expect(flyer.parentElement).toBe(document.body);
    expect(flyer.className).toContain('fixed');
    // the flyer's animation was started with a path that ends in the icon
    expect(animate).toHaveBeenCalledTimes(1);
    const keyframes = (animate.mock.calls[0] as unknown as [Array<{ transform: string }>])[0];
    expect(keyframes).toHaveLength(3);
    expect(keyframes[0].transform).toContain('scale(1)');
    expect(keyframes[2].transform).toContain('scale(0.3)');

    // when it has arrived it is gone, and the icon pops
    await act(async () => { animations[0].onfinish?.(); });
    expect(screen.queryByTestId('jobs-flyer')).toBeNull();
    expect(animate).toHaveBeenCalledTimes(2);

    delete (HTMLElement.prototype as unknown as { animate?: unknown }).animate;
  });

  it('without animations in the browser there is no flyer left on the page', async () => {
    render(<JobsButton />);
    await waitFor(() => expect(listMock).toHaveBeenCalled());
    act(() => announceJobInBackground('import'));
    expect(screen.queryByTestId('jobs-flyer')).toBeNull();
  });

  it('when a running job finishes the icon shows a check for a moment', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      listMock.mockResolvedValueOnce([running]).mockResolvedValue([{ ...running, status: 'completed', progress: 100 }]);
      render(<JobsButton />);
      await screen.findByTestId('jobs-badge');
      await act(async () => { requestJobsRefresh(); });
      expect(await screen.findByTestId('jobs-done')).toBeTruthy();
      expect(screen.queryByTestId('jobs-badge')).toBeNull();
      await act(async () => { await vi.advanceTimersByTimeAsync(2600); });
      expect(screen.queryByTestId('jobs-done')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('a list that loads with nothing running shows no check', async () => {
    listMock.mockResolvedValue([exported]);
    render(<JobsButton />);
    await waitFor(() => expect(listMock).toHaveBeenCalled());
    expect(screen.queryByTestId('jobs-done')).toBeNull();
  });
});
