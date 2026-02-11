import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { UserSettingsTab } from '../UserSettingsTab';

const mockUseGetTenantUsers = vi.fn();
const mockRemoveTenantUserMutation = vi.fn();
const mockActivateTenantUserMutation = vi.fn();
const mockDeactivateTenantUserMutation = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };

vi.mock('../../../../hooks/useApi', () => ({
  useGetTenantUsers: () => mockUseGetTenantUsers(),
  useRemoveTenantUser: () => ({
    mutateAsync: mockRemoveTenantUserMutation,
  }),
  useActivateTenantUser: () => ({
    mutateAsync: mockActivateTenantUserMutation,
  }),
  useDeactivateTenantUser: () => ({
    mutateAsync: mockDeactivateTenantUserMutation,
  }),
}));

vi.mock('../../../common/Toast', () => ({
  useToast: () => mockToast,
}));

vi.mock('../../../shared/UserTable', () => ({
  UserTable: ({
    users,
    onRemoveUser,
    onEditUser,
    onActivateUser,
    onDeactivateUser,
    headerActions,
  }: {
    users: Array<{ id: string; first_name: string; last_name: string }>;
    onRemoveUser?: (id: string) => void;
    onEditUser?: (user: { id: string }) => void;
    onActivateUser?: (id: string) => void;
    onDeactivateUser?: (id: string) => void;
    headerActions?: React.ReactNode;
  }) => (
    <div data-testid="user-table">
      {users.map((u) => (
        <div key={u.id} data-testid={`user-row-${u.id}`}>
          <span>{u.first_name} {u.last_name}</span>
          {onRemoveUser && (
            <button type="button" onClick={() => onRemoveUser(u.id)} data-testid={`remove-${u.id}`}>
              Remove
            </button>
          )}
          {onEditUser && (
            <button type="button" onClick={() => onEditUser(u)} data-testid={`edit-${u.id}`}>
              Edit
            </button>
          )}
          {onActivateUser && (
            <button type="button" onClick={() => onActivateUser(u.id)} data-testid={`activate-${u.id}`}>
              Activate
            </button>
          )}
          {onDeactivateUser && (
            <button type="button" onClick={() => onDeactivateUser(u.id)} data-testid={`deactivate-${u.id}`}>
              Deactivate
            </button>
          )}
        </div>
      ))}
      {headerActions}
    </div>
  ),
}));

vi.mock('../AddUserModal', () => ({
  AddUserModal: ({
    isOpen,
    onClose,
    editUser,
  }: {
    isOpen: boolean;
    onClose: () => void;
    editUser?: { id: string } | null;
  }) =>
    isOpen ? (
      <div data-testid="add-user-modal">
        <button type="button" onClick={onClose} data-testid="close-modal">
          Close
        </button>
        {editUser && <span data-testid="edit-user-id">{editUser.id}</span>}
      </div>
    ) : null,
}));

vi.mock('../../../ui/Loader', () => ({
  Loader: ({ text }: { text?: string }) => <div data-testid="loader">{text ?? 'Loading'}</div>,
}));

describe('UserSettingsTab', () => {
  const defaultUsers = [
    {
      id: 'user-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      roles: 'workspaceMember',
      status: 'active',
    },
    {
      id: 'user-2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      roles: 'workspaceMember',
      status: 'inactive',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetTenantUsers.mockReturnValue({
      data: defaultUsers,
      isLoading: false,
      error: null,
    });
    mockRemoveTenantUserMutation.mockResolvedValue(undefined);
    mockActivateTenantUserMutation.mockResolvedValue(undefined);
    mockDeactivateTenantUserMutation.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('renders user table with users', () => {
      render(<UserSettingsTab workspaceId="workspace-1" />);

      expect(screen.getByTestId('user-table')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('renders Add User button in header', () => {
      render(<UserSettingsTab workspaceId="workspace-1" />);

      expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument();
    });

    it('shows loader when loading', () => {
      mockUseGetTenantUsers.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      });

      render(<UserSettingsTab workspaceId="workspace-1" />);

      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('shows error state when request fails', () => {
      mockUseGetTenantUsers.mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Failed to load'),
      });

      render(<UserSettingsTab workspaceId="workspace-1" />);

      expect(screen.getByText(/error loading users/i)).toBeInTheDocument();
    });

    it('filters out owner users from table', () => {
      mockUseGetTenantUsers.mockReturnValue({
        data: [
          ...defaultUsers,
          { id: 'owner-1', first_name: 'Owner', last_name: 'User', email: 'owner@example.com', roles: 'owner' },
        ],
        isLoading: false,
        error: null,
      });

      render(<UserSettingsTab workspaceId="workspace-1" />);

      expect(screen.queryByText('Owner User')).not.toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Add User modal', () => {
    it('opens AddUserModal when Add User button is clicked', async () => {
      const user = userEvent.setup();
      render(<UserSettingsTab workspaceId="workspace-1" />);

      await user.click(screen.getByRole('button', { name: /add user/i }));

      expect(screen.getByTestId('add-user-modal')).toBeInTheDocument();
    });

    it('closes modal when modal close is clicked', async () => {
      const user = userEvent.setup();
      render(<UserSettingsTab workspaceId="workspace-1" />);

      await user.click(screen.getByRole('button', { name: /add user/i }));
      await user.click(screen.getByTestId('close-modal'));

      expect(screen.queryByTestId('add-user-modal')).not.toBeInTheDocument();
    });

    it('opens modal in edit mode when Edit is clicked on a user', async () => {
      const user = userEvent.setup();
      render(<UserSettingsTab workspaceId="workspace-1" />);

      await user.click(screen.getByTestId('edit-user-1'));

      expect(screen.getByTestId('add-user-modal')).toBeInTheDocument();
      expect(screen.getByTestId('edit-user-id')).toHaveTextContent('user-1');
    });
  });

  describe('Remove user', () => {
    it('calls remove mutation and shows success when Remove is clicked', async () => {
      const user = userEvent.setup();
      render(<UserSettingsTab workspaceId="workspace-1" />);

      await user.click(screen.getByTestId('remove-user-1'));

      expect(mockRemoveTenantUserMutation).toHaveBeenCalledWith('user-1');
      expect(mockToast.success).toHaveBeenCalledWith('User removed successfully');
    });

    it('shows error toast when remove fails', async () => {
      const user = userEvent.setup();
      mockRemoveTenantUserMutation.mockRejectedValue(new Error('Remove failed'));

      render(<UserSettingsTab workspaceId="workspace-1" />);

      await user.click(screen.getByTestId('remove-user-1'));

      expect(mockToast.error).toHaveBeenCalledWith('Remove failed');
    });
  });

  describe('Activate and deactivate', () => {
    it('calls activate mutation and shows success when Activate is clicked', async () => {
      const user = userEvent.setup();
      render(<UserSettingsTab workspaceId="workspace-1" />);

      await user.click(screen.getByTestId('activate-user-2'));

      expect(mockActivateTenantUserMutation).toHaveBeenCalledWith('user-2');
      expect(mockToast.success).toHaveBeenCalledWith('User activated successfully');
    });

    it('calls deactivate mutation and shows success when Deactivate is clicked', async () => {
      const user = userEvent.setup();
      render(<UserSettingsTab workspaceId="workspace-1" />);

      await user.click(screen.getByTestId('deactivate-user-1'));

      expect(mockDeactivateTenantUserMutation).toHaveBeenCalledWith('user-1');
      expect(mockToast.success).toHaveBeenCalledWith('User deactivated successfully');
    });

    it('shows error toast when activate fails', async () => {
      const user = userEvent.setup();
      mockActivateTenantUserMutation.mockRejectedValue(new Error('Activate failed'));

      render(<UserSettingsTab workspaceId="workspace-1" />);

      await user.click(screen.getByTestId('activate-user-2'));

      expect(mockToast.error).toHaveBeenCalledWith('Activate failed');
    });
  });
});
