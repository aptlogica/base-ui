import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AccountSettingsPage from '../AccountSettingsPage';
import { useParams } from 'react-router-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

vi.mock('../../components/account/AccountSettings', () => ({
  AccountSettings: ({ workspaceId }: { workspaceId: string }) => (
    <div data-testid="account-settings">{workspaceId}</div>
  ),
}));

describe('AccountSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders invalid workspace message when workspaceId is missing', () => {
    vi.mocked(useParams).mockReturnValue({} as any);

    render(<AccountSettingsPage />);

    expect(screen.getByText('Invalid Workspace')).toBeInTheDocument();
    expect(screen.getByText('Workspace ID is required')).toBeInTheDocument();
    expect(screen.queryByTestId('account-settings')).not.toBeInTheDocument();
  });

  it('renders AccountSettings when workspaceId is present', () => {
    vi.mocked(useParams).mockReturnValue({ workspaceId: 'ws-123' } as any);

    render(<AccountSettingsPage />);

    expect(screen.getByTestId('account-settings')).toHaveTextContent('ws-123');
    expect(screen.queryByText('Invalid Workspace')).not.toBeInTheDocument();
  });
});
