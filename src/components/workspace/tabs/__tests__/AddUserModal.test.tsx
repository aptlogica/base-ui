import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
      <button type="button" onClick={() => onBaseRoleChange(workspace.id, 'base-1', 'base-read')} data-testid={`base-role-${workspace.id}`}>
        Set Base Read
      </button>
      <button type="button" onClick={() => onToggleBase(workspace.id, 'base-1')} data-testid={`toggle-${workspace.id}`}>
        Toggle Base
      </button>
    </div>
  ),
}));

const setMockImageDimensions = (width: number, height: number) => {
  (globalThis as any).Image = class MockImage {
    onload: (() => void) | null = null;
    width = width;
    height = height;
    set src(_value: string) {
      this.onload?.();
    }
  };
};

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
      const urlRef = globalThis.URL;
      vi.stubGlobal(
        'URL',
        Object.assign(urlRef, {
          createObjectURL: vi.fn(() => 'http://localhost/preview.png'),
        }) as any
      );
    setMockImageDimensions(400, 300);
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

    it('includes workspace membership in edit mode when access data is available', async () => {
      mockUseUserRolesAndAccess.mockReturnValue({
        data: [
          {
            workspace_id: 'ws-1',
            access: 'maintainer',
            bases: [],
          },
        ],
      });

      const user = userEvent.setup();
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

      expect(mockEditUserMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          membership: [{ workspace_id: 'ws-1', role: 'maintainer', bases: [] }],
        })
      );
    });

    it('includes base-specific memberships in edit mode when workspace access is empty', async () => {
      mockUseUserRolesAndAccess.mockReturnValue({
        data: [
          {
            workspace_id: 'ws-1',
            access: '',
            bases: [{ base_id: 'base-1', access: 'base-read' }],
          },
        ],
      });

      const user = userEvent.setup();
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

      expect(mockEditUserMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          membership: [{ workspace_id: 'ws-1', role: '', bases: [{ base_id: 'base-1', role: 'base-read' }] }],
        })
      );
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

    it('filters workspaces by search term', async () => {
      const user = userEvent.setup();
      render(<AddUserModal {...defaultProps} />);

      await user.type(screen.getByPlaceholderText(/search workspace or base/i), 'nope');
      expect(screen.getByText(/no workspaces found/i)).toBeInTheDocument();
    });

    it('shows loading state while workspaces are loading', () => {
      mockUseWorkspaces.mockReturnValue({ data: [], isLoading: true });
      render(<AddUserModal {...defaultProps} />);

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows no workspaces available when list is empty', () => {
      mockUseWorkspaces.mockReturnValue({ data: [], isLoading: false });
      render(<AddUserModal {...defaultProps} />);

      expect(screen.getByText(/no workspaces available/i)).toBeInTheDocument();
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

    it('hides co-owner toggle when editing an owner and current user is not owner', () => {
      mockUseUserRole.mockReturnValue({ isOwner: () => false });
      render(
        <AddUserModal
          {...defaultProps}
          editUser={{
            id: 'user-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            roles: [{ name: 'owner', scope_level: 'system' }],
          }}
        />
      );

      expect(screen.queryByText(/Set as Co-owner/i)).not.toBeInTheDocument();
    });

    it('shows co-owner toggle when owner edits a co-owner', () => {
      mockUseUserRole.mockReturnValue({ isOwner: () => true });
      render(
        <AddUserModal
          {...defaultProps}
          editUser={{
            id: 'user-2',
            first_name: 'Jane',
            last_name: 'Doe',
            email: 'jane@example.com',
            roles: [{ name: 'co-owner', scope_level: 'system' }],
          }}
        />
      );

      expect(screen.getByText(/Set as Co-owner/i)).toBeInTheDocument();
    });

    it('shows avatar validation error for invalid file type', async () => {
      const user = userEvent.setup();
      render(<AddUserModal {...defaultProps} />);

      const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
      const badFile = new File(['abc'], 'bad.txt', { type: 'text/plain' });
      fireEvent.change(fileInput, { target: { files: [badFile] } });

      expect(screen.getByText(/valid image file/i)).toBeInTheDocument();
    });

    it('shows avatar dimension error when image is too large', async () => {
      setMockImageDimensions(1200, 900);
      render(<AddUserModal {...defaultProps} />);

      const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
      const file = new File(['img'], 'large.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByText(/max 800 x 400px/i)).toBeInTheDocument();
    });

    it('sets avatar preview for valid image upload', async () => {
      setMockImageDimensions(600, 300);
      render(<AddUserModal {...defaultProps} />);

      const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
      const file = new File(['img'], 'ok.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
      });
      expect(screen.queryByText(/max 800 x 400px/i)).not.toBeInTheDocument();
    });

    it('hides workspace panel when co-owner toggle is enabled', async () => {
      const user = userEvent.setup();
      render(<AddUserModal {...defaultProps} />);

      const label = screen.getByText(/set as co-owner/i);
      const toggle = label.closest('div')?.querySelector('button');
      if (toggle) {
        await user.click(toggle);
      }

      expect(screen.queryByText(/select workspace\(s\) & base\(s\)/i)).not.toBeInTheDocument();
    });
  });

  describe('Membership payload', () => {
    it('includes workspace membership when assigned', async () => {
      const user = userEvent.setup();
      render(<AddUserModal {...defaultProps} />);

      await user.type(screen.getByLabelText(/first name/i), 'Jane');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');

      await user.click(screen.getByTestId('role-ws-1'));
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      expect(mockAddUser).toHaveBeenCalledWith(
        expect.objectContaining({
          membership: [{ workspace_id: 'ws-1', role: 'maintainer', bases: [] }],
        }),
        expect.any(Object)
      );
    });

    it('adds base-specific membership when toggling a base', async () => {
      const user = userEvent.setup();
      render(<AddUserModal {...defaultProps} />);

      await user.type(screen.getByLabelText(/first name/i), 'Jane');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');

      await user.click(screen.getByTestId('toggle-ws-1'));
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      expect(mockAddUser).toHaveBeenCalledWith(
        expect.objectContaining({
          membership: [{ workspace_id: 'ws-1', role: '', bases: [{ base_id: 'base-1', role: 'base-member' }] }],
        }),
        expect.any(Object)
      );
    });

    it('updates base role when base role change is triggered', async () => {
      const user = userEvent.setup();
      render(<AddUserModal {...defaultProps} />);

      await user.type(screen.getByLabelText(/first name/i), 'Jane');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');

      await user.click(screen.getByTestId('toggle-ws-1'));
      await user.click(screen.getByTestId('base-role-ws-1'));
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      expect(mockAddUser).toHaveBeenCalledWith(
        expect.objectContaining({
          membership: [{ workspace_id: 'ws-1', role: '', bases: [{ base_id: 'base-1', role: 'base-read' }] }],
        }),
        expect.any(Object)
      );
    });
  });
});
