import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ApplicationsModal } from '../ApplicationsModal';
import { useApplications } from '../useApplications';
import type { Application } from '../../../service/clientService';

let isAdmin = true;

vi.mock('../../../stores/navigationStore', () => ({
  useNavigationStore: () => ({ selectedWorkspaceId: 'ws-1' }),
}));

vi.mock('../../../hooks/useWorkspaceAccess', () => ({
  useWorkspaceAccess: () => ({ currentWorkspace: { id: 'ws-1', title: 'Acme Workspace' }, isAdmin }),
}));

vi.mock('../useApplications', () => ({ useApplications: vi.fn() }));

// The Overview, the form and the docs have their own tests; here they only show what they were given
vi.mock('../ApplicationOverview', () => ({
  default: ({ application, canManage, onOpenDocs, onDeleted }: any) => (
    <div data-testid="overview">
      {application.name} {String(canManage)}
      <button type="button" onClick={onOpenDocs}>Read the docs</button>
      <button type="button" onClick={onDeleted}>Deleted</button>
    </div>
  ),
}));

vi.mock('../ApplicationForm', () => ({
  PRIMARY_BUTTON_CLASS: '',
  default: ({ initialBaseIds, onCreated, onCancel }: any) => (
    <div data-testid="form">
      bases:{initialBaseIds.join(',')}
      <button type="button" onClick={() => onCreated({ id: 'app-new', name: 'New one' })}>Created</button>
      <button type="button" onClick={onCancel}>Cancel form</button>
    </div>
  ),
}));

vi.mock('../docs/ApiDocsView', () => ({
  default: ({ workspaceId, applicationId, onBack, backLabel }: any) => (
    <div data-testid="docs">
      {workspaceId} {applicationId ?? 'sample'}
      <button type="button" onClick={onBack}>{backLabel}</button>
    </div>
  ),
}));

const app = (id: string, name: string, bases: string[], enabled = true): Application => ({
  id, name, enabled, workspace_id: 'ws-1', public_id: `app_${id.padEnd(10, '0').slice(0, 10)}`, base_path: `/api/v1/app_${id}`,
  bases: bases.map((b) => ({ id: b, title: b.toUpperCase() })), created_time: '', last_modified_time: '',
});

const PORTAL = app('portal', 'Portal', ['crm']);
const STOCK = app('stock', 'Stock sync', ['inv', 'crm'], false);

const mockApps = (data: Application[], extra: Record<string, unknown> = {}) => {
  vi.mocked(useApplications).mockReturnValue({ data, isLoading: false, error: null, refetch: vi.fn(), ...extra } as any);
};

const appList = () => screen.getByRole('navigation', { name: 'Applications' });

describe('ApplicationsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAdmin = true;
  });

  it('renders nothing while closed', () => {
    mockApps([PORTAL]);
    render(<ApplicationsModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it("lists the workspace's applications and shows the first one", () => {
    mockApps([PORTAL, STOCK]);
    render(<ApplicationsModal isOpen onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Applications' })).toBeInTheDocument();
    expect(useApplications).toHaveBeenCalledWith('ws-1');
    expect(within(appList()).getByRole('button', { name: /Portal/ })).toHaveAttribute('aria-current', 'page');
    expect(within(appList()).getByRole('button', { name: /Stock sync/ })).toHaveTextContent('Off');
    expect(within(appList()).getByRole('button', { name: /Stock sync/ })).toHaveTextContent('2 bases');
    expect(screen.getByTestId('overview')).toHaveTextContent('Portal true');

    fireEvent.click(within(appList()).getByRole('button', { name: /Stock sync/ }));
    expect(screen.getByTestId('overview')).toHaveTextContent('Stock sync');
  });

  it('creates an application and then shows it', () => {
    mockApps([PORTAL]);
    render(<ApplicationsModal isOpen onClose={vi.fn()} />);

    fireEvent.click(within(appList()).getByRole('button', { name: 'New application' }));
    expect(screen.getByTestId('form')).toHaveTextContent('bases:');

    // The list refetches after a create; here the new application is already in it
    mockApps([PORTAL, app('app-new', 'New one', ['crm'])]);
    fireEvent.click(screen.getByRole('button', { name: 'Created' }));
    expect(screen.getByTestId('overview')).toHaveTextContent('New one');
  });

  it('offers to create the first application when there is none', () => {
    mockApps([]);
    render(<ApplicationsModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText('No applications yet')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: 'New application' });
    fireEvent.click(buttons[buttons.length - 1]);
    expect(screen.getByTestId('form')).toBeInTheDocument();
  });

  it('lets members who are not owners or co-owners look but not create', () => {
    isAdmin = false;
    mockApps([]);
    render(<ApplicationsModal isOpen onClose={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'New application' })).not.toBeInTheDocument();
    expect(screen.getByText(/Only workspace owners and co-owners can create applications/)).toBeInTheDocument();
  });

  it('shows the error with a retry', () => {
    const refetch = vi.fn();
    mockApps([], { error: new Error('boom'), refetch });
    render(<ApplicationsModal isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('opened from a base, shows an application that uses it', () => {
    mockApps([PORTAL, STOCK]);
    render(<ApplicationsModal isOpen onClose={vi.fn()} focusBaseId="inv" workspaceId="ws-1" />);

    expect(screen.getByTestId('overview')).toHaveTextContent('Stock sync');
  });

  it('opened from a base no application uses, starts a new one with that base', () => {
    mockApps([PORTAL]);
    render(<ApplicationsModal isOpen onClose={vi.fn()} focusBaseId="hr" workspaceId="ws-1" />);

    expect(screen.getByTestId('form')).toHaveTextContent('bases:hr');
  });

  it("opens the docs with the selected application's address and goes back", () => {
    mockApps([PORTAL]);
    render(<ApplicationsModal isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Read the docs' }));
    expect(screen.getByTestId('docs')).toHaveTextContent('ws-1 portal');

    fireEvent.click(screen.getByRole('button', { name: 'Back to applications' }));
    expect(screen.getByTestId('overview')).toBeInTheDocument();
  });

  it('closes with the close button', () => {
    mockApps([PORTAL]);
    const onClose = vi.fn();
    render(<ApplicationsModal isOpen onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
