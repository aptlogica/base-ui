import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddUserModal } from '../AddUserModal';

const mockAddUser = vi.fn();
const mockEditUserMutation = vi.fn();
const mockUseWorkspaces = vi.fn();
const mockUseUserRolesAndAccess = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
const mockUseCurrentUser = vi.fn();
const mockUseUserRole = vi.fn();

vi.mock('../../../../hooks/useApi', () => ({
  useAddUser: () => ({
    mutate: mockAddUser,
    isPending: false,
  }),
  useEditUser: () => ({
    mutateAsync: mockEditUserMutation,
    isPending: false,
  }),
  useWorkspaces: () => mockUseWorkspaces(),
  useUserRolesAndAccess: (userId: string | null) => mockUseUserRolesAndAccess(userId),
}));

vi.mock('../../../common/Toast', () => ({
  useToast: () => mockToast,
}));

vi.mock('../../../../auth/useCurrentUser', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

vi.mock('../../../../hooks/useUserRole', () => ({
  useUserRole: () => mockUseUserRole(),
}));

vi.mock('../WorkspaceItem', () => ({
  WorkspaceItem: ({
    workspace,
    onRoleChange,
    onBaseRoleChange,
    onToggleBase,
  }: {
    workspace: { id: string; title?: string; name?: string };
    onRoleChange: (wsId: string, role: string | null) => void;
    onBaseRoleChange: (wsId: string, baseId: string, role: string) => void;
    onToggleBase: (wsId: string, baseId: string) => void;
  }) => (
    <div data-testid={`workspace-item-${workspace.id}`}>
      <span>{workspace.title || workspace.name}</span>
      <button type="button" onClick={() => onRoleChange(workspace.id, 'maintainer')} data-testid={`role-${workspace.id}`}>
        Set Maintainer
      </button>
      <button type="button" onClick={() => onToggleBase(workspace.id, 'base-1')} data-testid={`toggle-${workspace.id}`}>
        Toggle Base
      </button>
    </div>
  ),
}));

describe('AddUserModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    editUser: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWorkspaces.mockReturnValue({ data: [{ id: 'ws-1', title: 'Workspace 1' }], isLoading: false });
    mockUseUserRolesAndAccess.mockReturnValue({ data: null });
    mockUseCurrentUser.mockReturnValue({ id: 'current-1', email: 'current@example.com' });
    mockUseUserRole.mockReturnValue({ isOwner: () => true });
    mockAddUser.mockImplementation(
      (_payload: unknown, opts: { onSuccess?: () => void }) => {
        opts?.onSuccess?.();
      }
    );
    mockEditUserMutation.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('returns null when isOpen is false', () => {
      const { container } = render(<AddUserModal {...defaultProps} isOpen={false} />);

      expect(container.firstChild).toBeNull();
    });

    it('renders Add Users heading when not in edit mode', () => {
      render(<AddUserModal {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /add users/i })).toBeInTheDocument();
    });

    it('renders Edit User heading when in edit mode', () => {
      render(
        <AddUserModal
          {...defaultProps}
          editUser={{
            id: 'user-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
          }}
        />
      );

      expect(screen.getByRole('heading', { name: /edit user/i })).toBeInTheDocument();
    });

    it('renders first name and last name inputs', () => {
      render(<AddUserModal {...defaultProps} />);

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    });

    it('renders email input', () => {
      render(<AddUserModal {...defaultProps} />);

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('renders Add and Cancel buttons when not in edit mode', () => {
      render(<AddUserModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('renders Update and Cancel buttons when in edit mode', () => {
      render(
        <AddUserModal
          {...defaultProps}
          editUser={{
            id: 'user-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
          }}
        />
      );

      expect(screen.getByRole('button', { name: /^update$/i })).toBeInTheDocument();
    });

    it('pre-fills form when in edit mode', () => {
      render(
        <AddUserModal
          {...defaultProps}
          editUser={{
            id: 'user-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
          }}
        />
      );

      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });
  });

  describe('Close behavior', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<AddUserModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Close' }));

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const { container } = render(<AddUserModal {...defaultProps} onClose={onClose} />);

      const backdrop = container.querySelector('.absolute.inset-0');
      if (backdrop) {
        await user.click(backdrop as HTMLElement);
        expect(onClose).toHaveBeenCalled();
      }
    });
  });

  describe('Validation', () => {
    it('shows first name required when first name is empty on submit', () => {
      render(<AddUserModal {...defaultProps} />);

      const form = document.getElementById('add-user-form');
      expect(form).toBeInTheDocument();
      if (form) {
        fireEvent.submit(form);
      }

      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(mockAddUser).not.toHaveBeenCalled();
    });

    it('shows last name required when last name is empty on submit', async () => {
      const user = userEvent.setup();
      render(<AddUserModal {...defaultProps} />);

      await user.type(screen.getByLabelText(/first name/i), 'John');
      const form = document.getElementById('add-user-form');
      if (form) {
        fireEvent.submit(form);
      }

      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(mockAddUser).not.toHaveBeenCalled();
    });

    it('shows email required when email is empty on submit', async () => {
      const user = userEvent.setup();
      render(<AddUserModal {...defaultProps} />);

      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      const form = document.getElementById('add-user-form');
      if (form) {
        fireEvent.submit(form);
      }

      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(mockAddUser).not.toHaveBeenCalled();
    });

    it('shows invalid email when email format is wrong on blur', async () => {
      const user = userEvent.setup();
      render(<AddUserModal {...defaultProps} />);

      await user.type(screen.getByLabelText(/email address/i), 'invalid');
      await user.tab();

      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    });
  });

  describe('Submit add user', () => {
    it('calls addUser and onClose when form is valid and submit is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<AddUserModal {...defaultProps} onClose={onClose} />);

      await user.type(screen.getByLabelText(/first name/i), 'Jane');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      expect(mockAddUser).toHaveBeenCalledWith(
        expect.objectContaining({
          firstname: 'Jane',
          lastname: 'Doe',
          email: 'jane@example.com',
        }),
        expect.any(Object)
      );
      expect(mockToast.success).toHaveBeenCalledWith('User Jane Doe added successfully');
      expect(onClose).toHaveBeenCalled();
    });

    it('disables submit when form is invalid', () => {
      render(<AddUserModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /^add$/i })).toBeDisabled();
    });
  });

  describe('Submit edit user', () => {
    it('calls editUserMutation and onClose when form is valid and Update is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <AddUserModal
          {...defaultProps}
          onClose={onClose}
          editUser={{
            id: 'user-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
          }}
        />
      );

      await user.clear(screen.getByLabelText(/first name/i));
      await user.type(screen.getByLabelText(/first name/i), 'Johnny');
      await user.click(screen.getByRole('button', { name: /^update$/i }));

      expect(mockEditUserMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          firstname: 'Johnny',
          lastname: 'Doe',
        })
      );
      expect(mockToast.success).toHaveBeenCalledWith('User Johnny Doe updated successfully');
      expect(onClose).toHaveBeenCalled();
    });

    it('shows error toast when edit mutation fails', async () => {
      const user = userEvent.setup();
      mockEditUserMutation.mockRejectedValue(new Error('Update failed'));

      render(
        <AddUserModal
          {...defaultProps}
          editUser={{
            id: 'user-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
          }}
        />
      );

      await user.click(screen.getByRole('button', { name: /^update$/i }));

      expect(mockToast.error).toHaveBeenCalledWith('Update failed');
    });
  });

  describe('Workspace assignment', () => {
    it('renders workspace list when workspaces are loaded', () => {
      render(<AddUserModal {...defaultProps} />);

      expect(screen.getByTestId('workspace-item-ws-1')).toBeInTheDocument();
      expect(screen.getByText('Workspace 1')).toBeInTheDocument();
    });

    it('shows search input for workspaces', () => {
      render(<AddUserModal {...defaultProps} />);

      expect(screen.getByPlaceholderText(/search workspace or base/i)).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('shows error toast when add user fails', async () => {
      const user = userEvent.setup();
      mockAddUser.mockImplementation(
        (_payload: unknown, opts: { onError?: (err: Error) => void }) => {
          opts?.onError?.(new Error('Add failed'));
        }
      );

      render(<AddUserModal {...defaultProps} />);

      await user.type(screen.getByLabelText(/first name/i), 'Jane');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      expect(mockToast.error).toHaveBeenCalledWith('Add failed');
    });

    it('email input is disabled in edit mode', () => {
      render(
        <AddUserModal
          {...defaultProps}
          editUser={{
            id: 'user-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
          }}
        />
      );

      expect(screen.getByLabelText(/email address/i)).toBeDisabled();
    });
  });
});
