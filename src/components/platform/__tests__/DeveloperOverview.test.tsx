import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeveloperOverview from '../DeveloperOverview';
import { useBaseApi } from '../useBaseApi';

const enable = vi.fn();
const disable = vi.fn();
const refetch = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('../useBaseApi', () => ({
  useBaseApi: vi.fn(),
  useEnableBaseApi: () => ({ mutateAsync: enable, isPending: false }),
  useDisableBaseApi: () => ({ mutateAsync: disable, isPending: false }),
}));

vi.mock('../../common/Toast', () => ({
  useToast: () => ({ success: toastSuccess, error: toastError }),
}));

vi.mock('../../../service/clientService', () => ({
  getApiOrigin: () => 'https://api.example.com',
}));

const useBaseApiMock = vi.mocked(useBaseApi);

const mockStatus = (data: unknown, extra: Record<string, unknown> = {}) => {
  useBaseApiMock.mockReturnValue({ data, isLoading: false, error: null, refetch, ...extra } as any);
};

const OFF = { base_id: 'base-1', enabled: false };
const ON = {
  base_id: 'base-1',
  enabled: true,
  public_id: 'bs_8f3k2m9qx7',
  base_path: '/api/v1/bs_8f3k2m9qx7',
  enabled_at: '2026-11-03T10:00:00Z',
};
const BASE_URL = 'https://api.example.com/api/v1/bs_8f3k2m9qx7';

const renderOverview = (props: Partial<React.ComponentProps<typeof DeveloperOverview>> = {}) => {
  const onCancel = vi.fn();
  render(<DeveloperOverview baseId="base-1" baseName="CRM" canEnable onCancel={onCancel} {...props} />);
  return { onCancel };
};

describe('DeveloperOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('asks to enable the API for the base with the checklist', () => {
    mockStatus(OFF);
    renderOverview();

    expect(useBaseApiMock).toHaveBeenCalledWith('base-1');
    expect(screen.getByText('Enable API & app login?')).toBeInTheDocument();
    expect(screen.getByText('CRM')).toBeInTheDocument();
    expect(screen.getByText(/permanent API address \(bs_…\)/)).toBeInTheDocument();
    expect(screen.getByText(/Only this base is reachable/)).toBeInTheDocument();
  });

  it('enables the API for the base and confirms with a toast', async () => {
    mockStatus(OFF);
    enable.mockResolvedValue({ data: ON });
    renderOverview();

    fireEvent.click(screen.getByRole('button', { name: 'Enable API & app login' }));

    await waitFor(() => expect(enable).toHaveBeenCalledWith('base-1'));
    expect(toastSuccess).toHaveBeenCalled();
  });

  it('says the address is kept when the API was turned off', () => {
    mockStatus({ ...ON, enabled: false });
    renderOverview();

    expect(screen.getByText(/Turning it on again keeps its address/)).toBeInTheDocument();
    expect(screen.getByText('bs_8f3k2m9qx7')).toBeInTheDocument();
  });

  it('shows the backend message when enabling fails', async () => {
    mockStatus(OFF);
    enable.mockRejectedValue(Object.assign(new Error('The base API could not be turned on'), { code: 'BSA_1001' }));
    renderOverview();

    fireEvent.click(screen.getByRole('button', { name: 'Enable API & app login' }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('The base API could not be turned on', expect.anything()));
  });

  it('lets only owners and co-owners enable it', () => {
    mockStatus(OFF);
    renderOverview({ canEnable: false });

    expect(screen.getByRole('button', { name: 'Enable API & app login' })).toBeDisabled();
    expect(screen.getByText('Only workspace owners and co-owners can turn this on.')).toBeInTheDocument();
  });

  it('closes the popup on Cancel', () => {
    mockStatus(OFF);
    const { onCancel } = renderOverview();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('shows the base API URL once enabled and copies it', async () => {
    mockStatus(ON);
    renderOverview();

    expect(screen.getByText('Base API')).toBeInTheDocument();
    expect(screen.getByText(BASE_URL)).toBeInTheDocument();
    expect(screen.getByText('bs_8f3k2m9qx7')).toBeInTheDocument();
    expect(screen.getByText(`curl ${BASE_URL}/tables`)).toBeInTheDocument();
    expect(screen.queryByText('Enable API & app login?')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy Base URL' }));

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(BASE_URL));
  });

  it('turns the API off', async () => {
    mockStatus(ON);
    disable.mockResolvedValue({ data: { ...ON, enabled: false } });
    renderOverview();

    fireEvent.click(screen.getByRole('button', { name: /Turn API off/ }));

    await waitFor(() => expect(disable).toHaveBeenCalledWith('base-1'));
    expect(toastSuccess).toHaveBeenCalled();
  });

  it('lets only owners and co-owners turn it off', () => {
    mockStatus(ON);
    renderOverview({ canEnable: false });

    expect(screen.queryByRole('button', { name: /Turn API off/ })).not.toBeInTheDocument();
  });

  it('links to the API docs once enabled', () => {
    mockStatus(ON);
    const onOpenDocs = vi.fn();
    renderOverview({ onOpenDocs });

    fireEvent.click(screen.getByRole('button', { name: /Read the API docs/ }));

    expect(onOpenDocs).toHaveBeenCalled();
  });

  it('links to the live Swagger UI and ReDoc pages and the OpenAPI spec once enabled', async () => {
    mockStatus(ON);
    renderOverview();

    const swagger = screen.getByRole('link', { name: /Open Swagger UI/ });
    expect(swagger).toHaveAttribute('href', `${BASE_URL}/docs`);
    expect(swagger).toHaveAttribute('target', '_blank');
    expect(swagger).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: /Open ReDoc/ })).toHaveAttribute('href', `${BASE_URL}/redoc`);

    fireEvent.click(screen.getByRole('button', { name: /Copy OpenAPI spec/ }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`${BASE_URL}/openapi.json`));
  });

  it('does not link to the live docs before the API is on', () => {
    mockStatus(OFF);
    renderOverview();

    expect(screen.queryByRole('link', { name: /Open Swagger UI/ })).not.toBeInTheDocument();
  });

  it('shows an error with a retry when the status cannot be loaded', () => {
    mockStatus(undefined, { error: new Error('network down') });
    renderOverview();

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the API status for this base.');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });
});
