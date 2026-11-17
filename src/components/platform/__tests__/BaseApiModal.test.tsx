import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BaseApiModal } from '../BaseApiModal';
import { useWorkspaceAccess } from '../../../hooks/useWorkspaceAccess';

let isAdmin = true;

vi.mock('../../../hooks/useWorkspaceAccess', () => ({
  useWorkspaceAccess: vi.fn(() => ({ isAdmin })),
}));

// The Overview panel has its own tests; here it only needs to expose Cancel and what it was given
vi.mock('../DeveloperOverview', () => ({
  default: ({ baseId, baseName, canEnable, onCancel, onOpenDocs }: any) => (
    <div data-testid="developer-overview">
      {baseId} {baseName} {String(canEnable)}
      <button type="button" onClick={onCancel}>Cancel</button>
      <button type="button" onClick={onOpenDocs}>Read the docs</button>
    </div>
  ),
}));

// The docs have their own tests (ApiDocsPage); here they only need to show what they were given and go back
vi.mock('../docs/ApiDocsView', () => ({
  default: ({ baseId, onBack, backLabel, embedded }: any) => (
    <div data-testid="api-docs-view">
      {baseId} {embedded ? 'embedded' : 'page'}
      <button type="button" onClick={onBack}>{backLabel}</button>
    </div>
  ),
}));

const BASE = { id: 'base-1', workspace_id: 'ws-1', title: 'CRM' };

const renderModal = (onClose = vi.fn()) => {
  render(<BaseApiModal isOpen onClose={onClose} base={BASE} />);
  return { onClose };
};

describe('BaseApiModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAdmin = true;
  });

  it('renders nothing while closed', () => {
    render(<BaseApiModal isOpen={false} onClose={vi.fn()} base={BASE} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it("shows the base's Developer popup with its Overview", () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Developer' })).toBeInTheDocument();
    expect(screen.getByText(/build apps on CRM/)).toBeInTheDocument();
    expect(screen.getByTestId('developer-overview')).toHaveTextContent('base-1 CRM true');
    expect(useWorkspaceAccess).toHaveBeenCalledWith('ws-1');
  });

  it("lets only the base's workspace owners and co-owners turn the API on", () => {
    isAdmin = false;
    renderModal();

    expect(screen.getByTestId('developer-overview')).toHaveTextContent('base-1 CRM false');
  });

  it('closes with Cancel, the X button and Escape', () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.keyDown(screen.getByRole('button', { name: 'Close modal' }), { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('shows Overview as the only section that can be opened', () => {
    renderModal();

    const overview = screen.getByRole('button', { name: 'Overview' });
    expect(overview).toBeEnabled();
    expect(overview).toHaveAttribute('aria-current', 'page');
    for (const label of ['API keys', 'Login settings', 'App users', 'Roles & rules', 'Test as user', 'Logs']) {
      expect(screen.getByRole('button', { name: `${label} Soon` })).toBeDisabled();
    }
  });

  it("shows the base's API docs inside the popup and goes back to Overview", () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'API docs' }));

    expect(screen.getByTestId('api-docs-view')).toHaveTextContent('base-1 embedded');
    expect(screen.queryByTestId('developer-overview')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'API docs' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back to overview' }));
    expect(screen.getByTestId('developer-overview')).toBeInTheDocument();
  });

  it('opens the docs from the Overview panel too', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Read the docs' }));
    expect(screen.getByTestId('api-docs-view')).toBeInTheDocument();
  });
});
