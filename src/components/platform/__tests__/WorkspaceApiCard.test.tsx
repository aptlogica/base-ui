import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { WorkspaceApiCard } from '../WorkspaceApiCard';

vi.mock('../../../stores/navigationStore', () => ({
  useNavigationStore: () => ({ selectedWorkspaceId: 'ws-1' }),
}));

vi.mock('../../../hooks/useWorkspaceAccess', () => ({
  useWorkspaceAccess: () => ({ currentWorkspace: { id: 'ws-1', title: 'Acme Workspace' }, isAdmin: true }),
}));

// The Overview panel has its own tests; here it only needs to expose Cancel and what it was given
vi.mock('../DeveloperOverview', () => ({
  default: ({ workspaceId, workspaceName, canEnable, onCancel, onOpenDocs }: any) => (
    <div data-testid="developer-overview">
      {workspaceId} {workspaceName} {String(canEnable)}
      <button type="button" onClick={onCancel}>Cancel</button>
      <button type="button" onClick={onOpenDocs}>Read the docs</button>
    </div>
  ),
}));

// The docs have their own tests (ApiDocsPage); here they only need to show what they were given and go back
vi.mock('../docs/ApiDocsView', () => ({
  default: ({ workspaceId, onBack, backLabel, embedded }: any) => (
    <div data-testid="api-docs-view">
      {workspaceId} {embedded ? 'embedded' : 'page'}
      <button type="button" onClick={onBack}>{backLabel}</button>
    </div>
  ),
}));

const Where = () => <div data-testid="where">{useLocation().pathname}</div>;

// The popup links to the docs page, so the card renders inside a router
const renderCard = (props: React.ComponentProps<typeof WorkspaceApiCard>) =>
  render(
    <MemoryRouter initialEntries={['/workspace/ws-1']}>
      <Routes>
        <Route path="/workspace/:workspaceId" element={<WorkspaceApiCard {...props} />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>
  );

describe('WorkspaceApiCard', () => {
  it('opens the Developer popup on click and closes it with Cancel', () => {
    renderCard({ disabled: false, hasWorkspace: true });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Workspace API/i }));
    expect(screen.getByRole('dialog', { name: 'Developer' })).toBeInTheDocument();
    expect(screen.getByText(/build apps on Acme Workspace/)).toBeInTheDocument();
    expect(screen.getByTestId('developer-overview')).toHaveTextContent('ws-1 Acme Workspace true');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the popup with the X button and Escape', () => {
    renderCard({ disabled: false, hasWorkspace: true });

    fireEvent.click(screen.getByRole('button', { name: /Workspace API/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Workspace API/i }));
    fireEvent.keyDown(screen.getByRole('button', { name: 'Close modal' }), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows Overview as the only section that can be opened', () => {
    renderCard({ disabled: false, hasWorkspace: true });
    fireEvent.click(screen.getByRole('button', { name: /Workspace API/i }));

    const overview = screen.getByRole('button', { name: 'Overview' });
    expect(overview).toBeEnabled();
    expect(overview).toHaveAttribute('aria-current', 'page');
    for (const label of ['API keys', 'Login settings', 'App users', 'Roles & rules', 'Test as user', 'Logs']) {
      expect(screen.getByRole('button', { name: `${label} Soon` })).toBeDisabled();
    }
  });

  it('is disabled and asks for a workspace when none is selected', () => {
    renderCard({ disabled: true, hasWorkspace: false });

    const card = screen.getByRole('button', { name: /Workspace API/i });
    expect(card).toBeDisabled();
    expect(screen.getByText('Select a workspace first.')).toBeInTheDocument();

    fireEvent.click(card);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the API docs inside the popup and goes back to Overview', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    renderCard({ disabled: false, hasWorkspace: true });
    fireEvent.click(screen.getByRole('button', { name: /Workspace API/i }));

    fireEvent.click(screen.getByRole('button', { name: 'API docs' }));

    expect(open).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Developer' })).toBeInTheDocument();
    expect(screen.getByTestId('api-docs-view')).toHaveTextContent('ws-1 embedded');
    expect(screen.queryByTestId('developer-overview')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'API docs' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back to overview' }));
    expect(screen.queryByTestId('api-docs-view')).not.toBeInTheDocument();
    expect(screen.getByTestId('developer-overview')).toBeInTheDocument();
    open.mockRestore();
  });

  it('opens the docs from the Overview panel too, and reopens on Overview after closing', () => {
    renderCard({ disabled: false, hasWorkspace: true });
    fireEvent.click(screen.getByRole('button', { name: /Workspace API/i }));

    fireEvent.click(screen.getByRole('button', { name: 'Read the docs' }));
    expect(screen.getByTestId('api-docs-view')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: /Workspace API/i }));
    expect(screen.getByTestId('developer-overview')).toBeInTheDocument();
    expect(screen.queryByTestId('api-docs-view')).not.toBeInTheDocument();
  });
});
