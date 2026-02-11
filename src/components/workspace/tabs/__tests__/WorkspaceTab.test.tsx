import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { WorkspaceTab } from '../WorkspaceTab';

const mockUpdateWorkspaceMutation = vi.fn();
const mockWorkspacesQuery = vi.fn();
const mockWorkspaceMembersQuery = vi.fn();
const mockRemoveUserFromWorkspaceMutation = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
const mockUseWorkspaceAccess = vi.fn();
const mockUseUserRole = vi.fn();

vi.mock('../../../../hooks/useApi', () => ({
  useUpdateWorkspace: () => ({ mutateAsync: mockUpdateWorkspaceMutation }),
  useWorkspaces: () => mockWorkspacesQuery(),
  useWorkspaceMembers: (workspaceId: string) => mockWorkspaceMembersQuery(workspaceId),
  useRemoveUserFromWorkspace: () => ({ mutateAsync: mockRemoveUserFromWorkspaceMutation }),
}));

vi.mock('../../../common/Toast', () => ({
  useToast: () => mockToast,
}));

vi.mock('../../../../hooks/useWorkspaceAccess', () => ({
  useWorkspaceAccess: (workspaceId: string) => mockUseWorkspaceAccess(workspaceId),
}));

vi.mock('../../../../hooks/useUserRole', () => ({
  useUserRole: () => mockUseUserRole(),
}));

vi.mock('../../../modals/CreateWorkspaceModal', () => ({
  CreateWorkspaceModal: ({
    isOpen,
    onClose,
    onSuccess,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
  }) =>
    isOpen ? (
      <div data-testid="create-workspace-modal">
        <button type="button" onClick={onClose} data-testid="close-create-modal">
          Close
        </button>
        <button type="button" onClick={onSuccess} data-testid="create-success">
          Success
        </button>
      </div>
    ) : null,
}));

vi.mock('../../../modals/AssignUserToWorkspaceModal', () => ({
  AssignUserToWorkspaceModal: ({
    isOpen,
    onClose,
    onSuccess,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
  }) =>
    isOpen ? (
      <div data-testid="assign-user-modal">
        <button type="button" onClick={onClose} data-testid="close-assign-modal">
          Close
        </button>
        <button type="button" onClick={onSuccess} data-testid="assign-success">
          Success
        </button>
      </div>
    ) : null,
}));

vi.mock('../../../shared/MembersTable', () => ({
  MembersTable: ({
    members,
    onRemoveMember,
    onEditMember,
    headerActions,
  }: {
    members: Array<{ id: string; name: string }>;
    onRemoveMember?: (id: string) => void;
    onEditMember?: (id: string) => void;
    headerActions?: React.ReactNode;
  }) => (
    <div data-testid="members-table">
      {members.map((m) => (
        <div key={m.id} data-testid={`member-${m.id}`}>
          <span>{m.name}</span>
          {onRemoveMember && (
            <button type="button" onClick={() => onRemoveMember(m.id)} data-testid={`remove-${m.id}`}>
              Remove
            </button>
          )}
          {onEditMember && (
            <button type="button" onClick={() => onEditMember(m.id)} data-testid={`edit-${m.id}`}>
              Edit
            </button>
          )}
        </div>
      ))}
      {headerActions}
    </div>
  ),
}));

describe('WorkspaceTab', () => {
  const defaultWorkspaces = [
    { id: 'ws-1', title: 'Workspace One', name: 'workspace_one' },
    { id: 'ws-2', title: 'Workspace Two', name: 'workspace_two' },
  ];

  const defaultMembersData = {
    data: [
      {
        id: 'mem-1',
        user_id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        access_level: 'workspaceMember',
        created_time: '2025-01-01T00:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkspacesQuery.mockReturnValue({
      data: defaultWorkspaces,
      refetch: vi.fn(),
    });
    mockWorkspaceMembersQuery.mockReturnValue({
      data: defaultMembersData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUpdateWorkspaceMutation.mockResolvedValue(undefined);
    mockRemoveUserFromWorkspaceMutation.mockResolvedValue(undefined);
    mockUseWorkspaceAccess.mockReturnValue({
      canCreateWorkspace: () => true,
      canAssignUsers: () => true,
      isFullAccess: true,
      isWorkspaceReadOnly: () => false,
    });
    mockUseUserRole.mockReturnValue({ isAdmin: () => true });
  });

  describe('Rendering', () => {
    it('renders workspace dropdown with first workspace selected by default', () => {
      render(<WorkspaceTab workspaceId="ws-1" />);

      expect(screen.getByText('Workspace One')).toBeInTheDocument();
    });

    it('renders Select Workspace when no workspaces', () => {
      mockWorkspacesQuery.mockReturnValue({ data: [], refetch: vi.fn() });

      render(<WorkspaceTab workspaceId="ws-1" />);

      expect(screen.getByText('Select Workspace')).toBeInTheDocument();
    });

    it('renders No workspaces found when dropdown is open and list is empty', async () => {
      const user = userEvent.setup();
      mockWorkspacesQuery.mockReturnValue({ data: [], refetch: vi.fn() });

      render(<WorkspaceTab workspaceId="ws-1" />);
      await user.click(screen.getByRole('button', { name: /select workspace/i }));

      expect(screen.getByText('No workspaces found')).toBeInTheDocument();
    });

    it('renders Create Workspace button when canCreateWorkspace is true', () => {
      render(<WorkspaceTab workspaceId="ws-1" />);

      expect(screen.getByRole('button', { name: /create workspace/i })).toBeInTheDocument();
    });

    it('opens create workspace modal when Create Workspace is clicked', async () => {
      const user = userEvent.setup();
      render(<WorkspaceTab workspaceId="ws-1" />);

      await user.click(screen.getByRole('button', { name: /create workspace/i }));

      expect(screen.getByTestId('create-workspace-modal')).toBeInTheDocument();
    });

    it('renders members table when workspace is selected', () => {
      render(<WorkspaceTab workspaceId="ws-1" />);

      expect(screen.getByTestId('members-table')).toBeInTheDocument();
    });

    it('renders loading state for members when loading', () => {
      mockWorkspaceMembersQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<WorkspaceTab workspaceId="ws-1" />);

      expect(screen.getByText(/loading members/i)).toBeInTheDocument();
    });

    it('renders error state when members query fails', () => {
      mockWorkspaceMembersQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load'),
      });

      render(<WorkspaceTab workspaceId="ws-1" />);

      expect(screen.getByText(/failed to load members/i)).toBeInTheDocument();
    });
  });

  describe('Workspace selection', () => {
    it('shows workspace list when dropdown is opened', async () => {
      const user = userEvent.setup();
      render(<WorkspaceTab workspaceId="ws-1" />);

      await user.click(screen.getByRole('button', { name: /workspace one/i }));

      expect(screen.getByText('Workspace Two')).toBeInTheDocument();
    });
  });

  describe('Edit workspace', () => {
    it('opens edit modal when Edit Details is clicked', async () => {
      const user = userEvent.setup();
      render(<WorkspaceTab workspaceId="ws-1" />);

      await user.click(screen.getByRole('button', { name: /edit details/i }));

      expect(screen.getByTestId('create-workspace-modal')).toBeInTheDocument();
    });

    it('does not show Edit Details when user is not admin and not full access', () => {
      mockUseUserRole.mockReturnValue({ isAdmin: () => false });
      mockUseWorkspaceAccess.mockReturnValue({
        canCreateWorkspace: () => false,
        canAssignUsers: () => false,
        isFullAccess: false,
        isWorkspaceReadOnly: () => true,
      });

      render(<WorkspaceTab workspaceId="ws-1" />);

      expect(screen.queryByRole('button', { name: /edit details/i })).not.toBeInTheDocument();
    });
  });

  describe('Members', () => {
    it('shows Add Member button when canAssignUsers and not read only', () => {
      render(<WorkspaceTab workspaceId="ws-1" />);

      expect(screen.getByRole('button', { name: /add member/i })).toBeInTheDocument();
    });

    it('opens assign user modal when Add Member is clicked', async () => {
      const user = userEvent.setup();
      render(<WorkspaceTab workspaceId="ws-1" />);

      await user.click(screen.getByRole('button', { name: /add member/i }));

      expect(screen.getByTestId('assign-user-modal')).toBeInTheDocument();
    });

    it('displays member name in table', () => {
      render(<WorkspaceTab workspaceId="ws-1" />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('calls remove mutation and shows success when Remove member is clicked', async () => {
      const user = userEvent.setup();
      render(<WorkspaceTab workspaceId="ws-1" />);

      await user.click(screen.getByTestId('remove-mem-1'));

      expect(mockRemoveUserFromWorkspaceMutation).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        user_id: 'user-1',
      });
      expect(mockToast.success).toHaveBeenCalledWith('Member removed successfully');
    });

    it('shows error toast when remove member fails', async () => {
      const user = userEvent.setup();
      mockRemoveUserFromWorkspaceMutation.mockRejectedValue(new Error('Remove failed'));

      render(<WorkspaceTab workspaceId="ws-1" />);

      await user.click(screen.getByTestId('remove-mem-1'));

      expect(mockToast.error).toHaveBeenCalledWith('Remove failed');
    });
  });

  describe('Edge cases', () => {
    it('shows error when no workspace selected and remove is attempted', async () => {
      mockWorkspacesQuery.mockReturnValue({ data: [], refetch: vi.fn() });
      const user = userEvent.setup();

      render(<WorkspaceTab workspaceId="" />);

      expect(screen.queryByTestId('members-table')).not.toBeInTheDocument();
    });

    it('calls refetch on workspaces when create modal succeeds', async () => {
      const user = userEvent.setup();
      const refetch = vi.fn();
      mockWorkspacesQuery.mockReturnValue({ data: defaultWorkspaces, refetch });

      render(<WorkspaceTab workspaceId="ws-1" />);
      await user.click(screen.getByRole('button', { name: /create workspace/i }));
      await user.click(screen.getByTestId('create-success'));

      expect(refetch).toHaveBeenCalled();
    });
  });
});
