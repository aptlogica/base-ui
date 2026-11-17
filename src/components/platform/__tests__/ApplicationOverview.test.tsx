import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ApplicationOverview from '../ApplicationOverview';
import type { Application } from '../../../service/clientService';

const update = vi.fn();
const setBases = vi.fn();
const remove = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('../useApplications', () => ({
  useUpdateApplication: () => ({ mutateAsync: update, isPending: false }),
  useSetApplicationBases: () => ({ mutateAsync: setBases, isPending: false }),
  useDeleteApplication: () => ({ mutateAsync: remove, isPending: false }),
}));

vi.mock('../../common/Toast', () => ({
  useToast: () => ({ success: toastSuccess, error: toastError }),
}));

vi.mock('../../../service/clientService', () => ({ getApiOrigin: () => 'https://api.example.com' }));

// The picker reads the workspace's bases; here it offers two fixed ones
vi.mock('../ApplicationBasePicker', () => ({
  default: ({ selected, onChange }: any) => (
    <div data-testid="picker">
      chosen:{selected.join(',')}
      <button type="button" onClick={() => onChange(['crm', 'inv'])}>Pick CRM and Inventory</button>
      <button type="button" onClick={() => onChange([])}>Pick none</button>
    </div>
  ),
}));

const APP: Application = {
  id: 'app-1', workspace_id: 'ws-1', name: 'Portal', description: 'Customer portal', public_id: 'app_ab12cd34ef',
  base_path: '/api/v1/app_ab12cd34ef', enabled: true, enabled_at: '2026-11-03T10:00:00Z',
  bases: [{ id: 'crm', title: 'CRM' }], created_time: '', last_modified_time: '',
};
const BASE = 'https://api.example.com/api/v1/app_ab12cd34ef';

const renderOverview = (props: Partial<React.ComponentProps<typeof ApplicationOverview>> = {}) => {
  const onDeleted = vi.fn();
  const onOpenDocs = vi.fn();
  render(<ApplicationOverview workspaceId="ws-1" application={APP} canManage onOpenDocs={onOpenDocs} onDeleted={onDeleted} {...props} />);
  return { onDeleted, onOpenDocs };
};

describe('ApplicationOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    update.mockResolvedValue({ data: APP });
    setBases.mockResolvedValue({ data: APP });
    remove.mockResolvedValue({});
  });

  it('shows the address, the ID, the bases and the live docs', () => {
    renderOverview();

    expect(screen.getByRole('heading', { name: 'Portal' })).toBeInTheDocument();
    expect(screen.getByText('API on')).toBeInTheDocument();
    expect(screen.getByText(BASE)).toBeInTheDocument();
    expect(screen.getByText('app_ab12cd34ef')).toBeInTheDocument();
    expect(screen.getByText(`curl ${BASE}/bases`)).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Bases of this application' })).toHaveTextContent('CRM');
    expect(screen.getByRole('link', { name: /Open Swagger UI/ })).toHaveAttribute('href', `${BASE}/docs`);
  });

  it('hides the live docs links while the API is off', () => {
    renderOverview({ application: { ...APP, enabled: false } });

    expect(screen.getByText('API off')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Open Swagger UI/ })).not.toBeInTheDocument();
    expect(screen.getByText('Turn the API on to open the live docs.')).toBeInTheDocument();
  });

  it('lets members who cannot manage it only look', () => {
    renderOverview({ canManage: false });

    expect(screen.queryByRole('button', { name: /Edit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Turn API off/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Change bases/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete application/ })).not.toBeInTheDocument();
  });

  it('turns the API off', async () => {
    renderOverview();

    fireEvent.click(screen.getByRole('button', { name: /Turn API off/ }));

    await waitFor(() => expect(update).toHaveBeenCalledWith({ id: 'app-1', input: { enabled: false } }));
    expect(toastSuccess).toHaveBeenCalledWith(expect.stringMatching(/off/), expect.anything());
  });

  it('renames the application', async () => {
    renderOverview();

    fireEvent.click(screen.getByRole('button', { name: /Edit/ }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '  Partner portal ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(update).toHaveBeenCalledWith({
      id: 'app-1', input: { name: 'Partner portal', description: 'Customer portal' },
    }));
  });

  it('changes the bases, and needs at least one', async () => {
    renderOverview();

    fireEvent.click(screen.getByRole('button', { name: /Change bases/ }));
    expect(screen.getByTestId('picker')).toHaveTextContent('chosen:crm');

    fireEvent.click(screen.getByRole('button', { name: 'Pick none' }));
    expect(screen.getByRole('button', { name: 'Save bases' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Pick CRM and Inventory' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save bases' }));

    await waitFor(() => expect(setBases).toHaveBeenCalledWith({ id: 'app-1', baseIds: ['crm', 'inv'] }));
  });

  it('deletes after a confirmation', async () => {
    const { onDeleted } = renderOverview();

    fireEvent.click(screen.getByRole('button', { name: /Delete application/ }));
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(remove).toHaveBeenCalledWith('app-1'));
    expect(onDeleted).toHaveBeenCalled();
  });

  it('says why a change failed', async () => {
    update.mockRejectedValue(new Error('nope'));
    renderOverview();

    fireEvent.click(screen.getByRole('button', { name: /Turn API off/ }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });

  it('opens the docs', () => {
    const { onOpenDocs } = renderOverview();

    fireEvent.click(screen.getByRole('button', { name: /Read the API docs/ }));
    expect(onOpenDocs).toHaveBeenCalled();
  });
});
