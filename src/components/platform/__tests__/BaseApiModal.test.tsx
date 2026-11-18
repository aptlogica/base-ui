import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BaseApiModal } from '../BaseApiModal';

vi.mock('../../../hooks/useWorkspaceAccess', () => ({
  useWorkspaceAccess: () => ({ isAdmin: true }),
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

vi.mock('../docs/ApiDocsView', () => ({
  default: ({ baseId, onBack, backLabel, embedded }: any) => (
    <div data-testid="api-docs-view">
      {baseId} {embedded ? 'embedded' : 'page'}
      <button type="button" onClick={onBack}>{backLabel}</button>
    </div>
  ),
}));

const renderModal = (onClose = vi.fn()) => {
  render(<BaseApiModal isOpen onClose={onClose} baseId="base-1" baseName="Acme CRM" />);
  return { onClose };
};

describe('BaseApiModal', () => {
  it('renders nothing when closed', () => {
    render(<BaseApiModal isOpen={false} onClose={vi.fn()} baseId="base-1" baseName="Acme CRM" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the Developer popup for the base and closes with Cancel', () => {
    const { onClose } = renderModal();

    expect(screen.getByRole('dialog', { name: 'Developer' })).toBeInTheDocument();
    expect(screen.getByText(/build apps on Acme CRM/)).toBeInTheDocument();
    expect(screen.getByTestId('developer-overview')).toHaveTextContent('base-1 Acme CRM true');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes with the X button and Escape', () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(screen.getByRole('button', { name: 'Close modal' }), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('shows Overview as the only section that can be opened', () => {
    renderModal();

    const overview = screen.getByRole('button', { name: 'Overview' });
    expect(overview).toBeEnabled();
    expect(overview).toHaveAttribute('aria-current', 'page');
    for (const label of ['API keys', 'Login settings', 'App users', 'Roles & rules', 'Test as user', 'Logs']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${label}\\s*Soon$`) })).toBeDisabled();
    }
  });

  it('shows the API docs inside the popup and goes back to Overview', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'API docs' }));

    expect(screen.getByTestId('api-docs-view')).toHaveTextContent('base-1 embedded');
    expect(screen.queryByTestId('developer-overview')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'API docs' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back to overview' }));
    expect(screen.queryByTestId('api-docs-view')).not.toBeInTheDocument();
    expect(screen.getByTestId('developer-overview')).toBeInTheDocument();
  });

  it('opens the docs from the Overview panel too', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Read the docs' }));
    expect(screen.getByTestId('api-docs-view')).toBeInTheDocument();
  });
});
