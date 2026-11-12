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
  default: ({ workspaceId, workspaceName, canEnable, onCancel }: any) => (
    <div data-testid="developer-overview">
      {workspaceId} {workspaceName} {String(canEnable)}
      <button type="button" onClick={onCancel}>Cancel</button>
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

  it('shows Overview and Logs as the sections that can be opened', () => {
    renderCard({ disabled: false, hasWorkspace: true });
    fireEvent.click(screen.getByRole('button', { name: /Workspace API/i }));

    const overview = screen.getByRole('button', { name: 'Overview' });
    expect(overview).toBeEnabled();
    expect(overview).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Logs' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Login settings' })).toBeEnabled();
    for (const label of ['App users', 'Roles & rules', 'Test as user']) {
      expect(screen.getByRole('button', { name: `${label} Soon` })).toBeDisabled();
    }
  });

  it('opens the Logs section and filters to denied requests', () => {
    renderCard({ disabled: false, hasWorkspace: true });
    fireEvent.click(screen.getByRole('button', { name: /Workspace API/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Logs' }));

    expect(screen.getByText('Every request, and the rule that allowed or blocked it.')).toBeInTheDocument();
    expect(screen.getAllByText('Allowed').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Denied only' }));
    expect(screen.queryByText('Allowed')).not.toBeInTheDocument();
    expect(screen.getAllByText('Denied').length).toBe(3);
  });

  it('is disabled and asks for a workspace when none is selected', () => {
    renderCard({ disabled: true, hasWorkspace: false });

    const card = screen.getByRole('button', { name: /Workspace API/i });
    expect(card).toBeDisabled();
    expect(screen.getByText('Select a workspace first.')).toBeInTheDocument();

    fireEvent.click(card);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the API docs page in a new tab and keeps the popup open', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    renderCard({ disabled: false, hasWorkspace: true });
    fireEvent.click(screen.getByRole('button', { name: /Workspace API/i }));

    fireEvent.click(screen.getByRole('button', { name: 'API docs' }));

    expect(open).toHaveBeenCalledWith('/workspace/ws-1/developer/api-docs', '_blank');
    expect(screen.getByRole('dialog', { name: 'Developer' })).toBeInTheDocument();
    open.mockRestore();
  });
});
