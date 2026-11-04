import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeveloperOverview from '../DeveloperOverview';
import { useWorkspaceApi } from '../useWorkspaceApi';

const mutateAsync = vi.fn();
const refetch = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();
let isPending = false;

vi.mock('../useWorkspaceApi', () => ({
  useWorkspaceApi: vi.fn(),
  useEnableWorkspaceApi: () => ({ mutateAsync, isPending }),
}));

vi.mock('../../common/Toast', () => ({
  useToast: () => ({ success: toastSuccess, error: toastError }),
}));

vi.mock('../../../service/clientService', () => ({
  getApiOrigin: () => 'https://api.example.com',
}));

const useWorkspaceApiMock = vi.mocked(useWorkspaceApi);

const mockStatus = (data: unknown, extra: Record<string, unknown> = {}) => {
  useWorkspaceApiMock.mockReturnValue({ data, isLoading: false, error: null, refetch, ...extra } as any);
};

const renderOverview = (props: Partial<React.ComponentProps<typeof DeveloperOverview>> = {}) => {
  const onCancel = vi.fn();
  render(
    <DeveloperOverview workspaceId="ws-1" workspaceName="Acme Workspace" canEnable onCancel={onCancel} {...props} />
  );
  return { onCancel };
};

describe('DeveloperOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isPending = false;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('shows a spinner while the status loads', () => {
    mockStatus(undefined, { isLoading: true });
    renderOverview();

    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('asks to enable the API with the Stage 1 checklist', () => {
    mockStatus({ workspace_id: 'ws-1', enabled: false });
    renderOverview();

    expect(screen.getByText('Enable API & app login?')).toBeInTheDocument();
    expect(screen.getByText('Acme Workspace')).toBeInTheDocument();
    expect(screen.getByText(/permanent API address/)).toBeInTheDocument();
    expect(screen.getByText(/API keys, app login and access rules/)).toBeInTheDocument();
    expect(screen.getByText(/Every table stays locked/)).toBeInTheDocument();
    expect(screen.queryByText(/turn it off/i)).not.toBeInTheDocument();
  });

  it('enables the API for the workspace and confirms with a toast', async () => {
    mockStatus({ workspace_id: 'ws-1', enabled: false });
    mutateAsync.mockResolvedValue({ data: { enabled: true } });
    renderOverview();

    fireEvent.click(screen.getByRole('button', { name: 'Enable API & app login' }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith('ws-1'));
    expect(toastSuccess).toHaveBeenCalled();
  });

  it('shows the backend message when enabling fails', async () => {
    mockStatus({ workspace_id: 'ws-1', enabled: false });
    mutateAsync.mockRejectedValue(Object.assign(new Error('The workspace API could not be turned on'), { code: 'WSA_1001' }));
    renderOverview();

    fireEvent.click(screen.getByRole('button', { name: 'Enable API & app login' }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('The workspace API could not be turned on', expect.anything()));
  });

  it('lets only owners and co-owners enable it', () => {
    mockStatus({ workspace_id: 'ws-1', enabled: false });
    renderOverview({ canEnable: false });

    expect(screen.getByRole('button', { name: 'Enable API & app login' })).toBeDisabled();
    expect(screen.getByText('Only workspace owners and co-owners can turn this on.')).toBeInTheDocument();
  });

  it('closes the popup on Cancel', () => {
    mockStatus({ workspace_id: 'ws-1', enabled: false });
    const { onCancel } = renderOverview();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('shows the base API URL once enabled and copies it', async () => {
    mockStatus({
      workspace_id: 'ws-1',
      enabled: true,
      public_id: 'ws_8f3k2m9qx7',
      base_path: '/api/v1/ws_8f3k2m9qx7',
      enabled_at: '2026-11-03T10:00:00Z',
    });
    renderOverview();

    expect(screen.getByText('Base API')).toBeInTheDocument();
    expect(screen.getByText('https://api.example.com/api/v1/ws_8f3k2m9qx7')).toBeInTheDocument();
    expect(screen.getByText('ws_8f3k2m9qx7')).toBeInTheDocument();
    expect(screen.queryByText('Enable API & app login?')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy Base URL' }));

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://api.example.com/api/v1/ws_8f3k2m9qx7')
    );
  });

  it('links to the API docs once enabled', () => {
    mockStatus({ workspace_id: 'ws-1', enabled: true, public_id: 'ws_8f3k2m9qx7', base_path: '/api/v1/ws_8f3k2m9qx7' });
    const onOpenDocs = vi.fn();
    renderOverview({ onOpenDocs });

    fireEvent.click(screen.getByRole('button', { name: /Read the API docs/ }));

    expect(onOpenDocs).toHaveBeenCalled();
  });

  it('shows an error with a retry when the status cannot be loaded', () => {
    mockStatus(undefined, { error: new Error('network down') });
    renderOverview();

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the API status for this workspace.');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });
});
