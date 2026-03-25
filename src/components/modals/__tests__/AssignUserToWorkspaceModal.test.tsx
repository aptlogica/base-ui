import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssignUserToWorkspaceModal } from '../AssignUserToWorkspaceModal';

const bulkAddMembersMutateAsync = vi.fn();
const removeUserFromWorkspaceMutateAsync = vi.fn();
const removeUserFromBaseMutateAsync = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();
const hasAdminRole = vi.fn(() => true);

const defaultUsers = [
  { id: 'user-1', display_name: 'John Doe', email: 'john@example.com', status: 'active', email_verified: true },
  { id: 'user-2', display_name: 'Jane Smith', email: 'jane@example.com', status: 'active', email_verified: true },
];

let userRolesAndAccessData: any = null;
let workspaceMembersData: any = { data: [] };
let workspaceBasesData: any = { data: [{ id: 'base-1', title: 'Base A' }, { id: 'base-2', title: 'Base B' }] };

vi.mock('../../../hooks/useApi', () => ({
  useBulkAddMembers: vi.fn(() => ({
    mutateAsync: bulkAddMembersMutateAsync,
    isPending: false,
  })),
  useGetUsersForAssign: vi.fn(() => ({
    data: defaultUsers,
    isLoading: false,
  })),
  useWorkspaceBases: vi.fn(() => ({
    data: workspaceBasesData,
    isLoading: false,
  })),
  useWorkspaceMembers: vi.fn(() => ({
    data: workspaceMembersData,
    isLoading: false,
  })),
  useBaseMembers: vi.fn(() => ({
    data: { data: [] },
    isLoading: false,
  })),
  useUserRolesAndAccess: vi.fn(() => ({
    data: userRolesAndAccessData,
    isLoading: false,
  })),
  useRemoveUserFromWorkspace: vi.fn(() => ({
    mutateAsync: removeUserFromWorkspaceMutateAsync,
    isPending: false,
  })),
  useRemoveUserFromBase: vi.fn(() => ({
    mutateAsync: removeUserFromBaseMutateAsync,
    isPending: false,
  })),
}));

vi.mock('../../common/Toast', () => ({
  useToast: () => ({
    success: toastSuccess,
    error: toastError,
    info: vi.fn(),
    show: vi.fn(),
  }),
}));

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'current-user' },
  })),
}));

vi.mock('../../../hooks/useUserRole', () => ({
  useUserRole: vi.fn(() => ({
    hasAdminRole,
  })),
}));

vi.mock('../../common/dropdown/AdvancedDropdown', () => ({
  AdvancedDropdown: ({ label, value, onChange, options, placeholder, disabled }: any) => (
    <label>
      {label || placeholder}
      <select
        aria-label={label || placeholder || 'dropdown'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder || '--select--'}</option>
        {options?.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

vi.mock('../../common/MultiSelectTags', () => ({
  MultiSelectTags: ({ options, value, onChange, placeholder }: any) => (
    <div>
      <label htmlFor="user-select">{placeholder}</label>
      <select
        id="user-select"
        multiple
        aria-label="Select users to assign"
        value={value}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions, (option) => option.value);
          onChange(selected);
        }}
      >
        {options?.map((opt: any) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('AssignUserToWorkspaceModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    workspaceId: 'ws-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    userRolesAndAccessData = null;
    workspaceMembersData = { data: [] };
    workspaceBasesData = { data: [{ id: 'base-1', title: 'Base A' }, { id: 'base-2', title: 'Base B' }] };
    bulkAddMembersMutateAsync.mockResolvedValue({ data: { success_count: 1, failure_count: 0, failures: [] } });
    removeUserFromWorkspaceMutateAsync.mockResolvedValue({});
    removeUserFromBaseMutateAsync.mockResolvedValue({});
    hasAdminRole.mockReturnValue(true);
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('renders nothing when closed', () => {
    const { container } = renderWithQueryClient(
      <AssignUserToWorkspaceModal {...defaultProps} isOpen={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows workspace id required branch', () => {
    renderWithQueryClient(
      <AssignUserToWorkspaceModal {...defaultProps} workspaceId={''} />
    );
    expect(screen.getByText(/workspace id is required/i)).toBeInTheDocument();
  });

  it('submits add mode with workspace role', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AssignUserToWorkspaceModal {...defaultProps} />);

    await user.selectOptions(screen.getByLabelText(/select users to assign/i), 'user-1');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => expect(bulkAddMembersMutateAsync).toHaveBeenCalled());
    const payload = bulkAddMembersMutateAsync.mock.calls[0][0];
    expect(payload.workspaceId).toBe('ws-123');
    expect(payload.members[0].user_id).toBe('user-1');
    expect(payload.members[0].memberships[0].role).toBe('maintainer');
    expect(toastSuccess).toHaveBeenCalled();
  });

  it('submits add mode with specific base role mapping', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AssignUserToWorkspaceModal {...defaultProps} />);

    await user.selectOptions(screen.getByLabelText(/select users to assign/i), 'user-1');
    await user.selectOptions(screen.getByLabelText(/select role/i), 'base-member');
    await user.selectOptions(screen.getByLabelText(/select base/i), 'specific_base');
    await user.click(screen.getByLabelText(/base a/i));
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => expect(bulkAddMembersMutateAsync).toHaveBeenCalled());
    const payload = bulkAddMembersMutateAsync.mock.calls[0][0];
    expect(payload.members[0].memberships[0].role).toBe('');
    expect(payload.members[0].memberships[0].bases).toEqual([{ base_id: 'base-1', role: 'base-member' }]);
  });

  it('blocks submit when no users are selected', async () => {
    renderWithQueryClient(<AssignUserToWorkspaceModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
    await waitFor(() => expect(bulkAddMembersMutateAsync).not.toHaveBeenCalled());
  });

  it('blocks submit when specific base is selected without bases', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AssignUserToWorkspaceModal {...defaultProps} />);

    await user.selectOptions(screen.getByLabelText(/select users to assign/i), 'user-1');
    await user.selectOptions(screen.getByLabelText(/select role/i), 'base-member');
    await user.selectOptions(screen.getByLabelText(/select base/i), 'specific_base');
    const addButton = screen.getByRole('button', { name: /^add$/i });
    expect(addButton).toBeDisabled();
    await waitFor(() => {
      expect(toastError).not.toHaveBeenCalled();
      expect(bulkAddMembersMutateAsync).not.toHaveBeenCalled();
    });
  });

  it('shows partial failure toast when api returns failures', async () => {
    bulkAddMembersMutateAsync.mockResolvedValue({
      data: {
        success_count: 1,
        failure_count: 1,
        failures: [{ user_id: 'user-2', error: 'Invalid role' }],
      },
    });
    const user = userEvent.setup();
    renderWithQueryClient(<AssignUserToWorkspaceModal {...defaultProps} />);

    await user.selectOptions(screen.getByLabelText(/select users to assign/i), ['user-1', 'user-2']);
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });

  it('shows failure toast when all assignments fail', async () => {
    bulkAddMembersMutateAsync.mockResolvedValue({
      data: {
        success_count: 0,
        failure_count: 2,
        failures: [
          { user_id: 'user-1', error: 'Invalid role' },
          { user_id: 'user-2', error: 'Blocked' },
        ],
      },
    });
    const user = userEvent.setup();
    renderWithQueryClient(<AssignUserToWorkspaceModal {...defaultProps} />);

    await user.selectOptions(screen.getByLabelText(/select users to assign/i), ['user-1', 'user-2']);
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to assign users.')
      );
    });
  });

  it('assigns all base roles when base member role and all bases selected', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AssignUserToWorkspaceModal {...defaultProps} />);

    await user.selectOptions(screen.getByLabelText(/select users to assign/i), 'user-1');
    await user.selectOptions(screen.getByLabelText(/select role/i), 'base-member');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => expect(bulkAddMembersMutateAsync).toHaveBeenCalled());
    const payload = bulkAddMembersMutateAsync.mock.calls[0][0];
    expect(payload.members[0].memberships[0].bases).toEqual([
      { base_id: 'base-1', role: 'base-member' },
      { base_id: 'base-2', role: 'base-member' },
    ]);
  });

  it('shows base-only role options for maintainer-only users', async () => {
    hasAdminRole.mockReturnValue(false);
    userRolesAndAccessData = [
      {
        workspace_id: 'ws-123',
        workspace_name: 'Workspace A',
        access: 'maintainer',
        bases: [],
      },
    ];
    const user = userEvent.setup();
    renderWithQueryClient(<AssignUserToWorkspaceModal {...defaultProps} />);

    await user.selectOptions(screen.getByLabelText(/select users to assign/i), 'user-1');

    expect(screen.queryByText('Workspace Maintainer')).not.toBeInTheDocument();
    expect(screen.queryByText('Workspace Read Only')).not.toBeInTheDocument();
    expect(screen.getByText('Base Member')).toBeInTheDocument();
    expect(screen.getByText('Base Read Only')).toBeInTheDocument();
  });

  it('updates workspace role in edit mode', async () => {
    userRolesAndAccessData = [
      {
        workspace_id: 'ws-123',
        workspace_name: 'Workspace A',
        access: 'maintainer',
        bases: [],
      },
    ];
    const user = userEvent.setup();
    renderWithQueryClient(
      <AssignUserToWorkspaceModal
        {...defaultProps}
        editMode={true}
        memberToEdit="user-1"
      />
    );

    await user.selectOptions(screen.getByLabelText(/select a role/i), 'workspace-read');
    await user.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => expect(bulkAddMembersMutateAsync).toHaveBeenCalled());
    const payload = bulkAddMembersMutateAsync.mock.calls[0][0];
    expect(payload.members[0].memberships[0]).toEqual({
      workspace_id: 'ws-123',
      role: 'workspace-read',
      bases: [],
    });
  });

  it('updates base roles in edit mode when workspace access is empty', async () => {
    userRolesAndAccessData = [
      {
        workspace_id: 'ws-123',
        workspace_name: 'Workspace A',
        access: '',
        bases: [
          { base_id: 'base-1', base_name: 'Base A', access: 'base-read' },
          { base_id: 'base-2', base_name: 'Base B', access: 'base-member' },
        ],
      },
    ];

    const user = userEvent.setup();
    renderWithQueryClient(
      <AssignUserToWorkspaceModal
        {...defaultProps}
        editMode={true}
        memberToEdit="user-1"
      />
    );

    await user.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => expect(bulkAddMembersMutateAsync).toHaveBeenCalled());
    const payload = bulkAddMembersMutateAsync.mock.calls[0][0];
    expect(payload.members[0].memberships[0]).toEqual({
      workspace_id: 'ws-123',
      role: '',
      bases: [
        { base_id: 'base-1', role: 'base-read' },
        { base_id: 'base-2', role: 'base-member' },
      ],
    });
  });

  it('shows error when workspace is not found during update', async () => {
    userRolesAndAccessData = [
      {
        workspace_id: 'other-workspace',
        workspace_name: 'Other',
        access: 'maintainer',
        bases: [],
      },
    ];

    const user = userEvent.setup();
    renderWithQueryClient(
      <AssignUserToWorkspaceModal
        {...defaultProps}
        editMode={true}
        memberToEdit="user-1"
      />
    );

    await user.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Workspace not found');
      expect(bulkAddMembersMutateAsync).not.toHaveBeenCalled();
    });
  });

  it('removes workspace access in edit mode', async () => {
    userRolesAndAccessData = [
      {
        workspace_id: 'ws-123',
        workspace_name: 'Workspace A',
        access: 'maintainer',
        bases: [],
      },
    ];
    const user = userEvent.setup();
    renderWithQueryClient(
      <AssignUserToWorkspaceModal
        {...defaultProps}
        editMode={true}
        memberToEdit="user-1"
      />
    );

    const removeButton = screen.getByTitle(/remove workspace access/i);
    await user.click(removeButton);

    await waitFor(() =>
      expect(removeUserFromWorkspaceMutateAsync).toHaveBeenCalledWith({
        workspaceId: 'ws-123',
        user_id: 'user-1',
      })
    );
  });

  it('does not remove workspace access when confirmation is cancelled', async () => {
    (globalThis.confirm as unknown as vi.Mock).mockReturnValueOnce(false);
    userRolesAndAccessData = [
      {
        workspace_id: 'ws-123',
        workspace_name: 'Workspace A',
        access: 'maintainer',
        bases: [],
      },
    ];
    const user = userEvent.setup();
    renderWithQueryClient(
      <AssignUserToWorkspaceModal
        {...defaultProps}
        editMode={true}
        memberToEdit="user-1"
      />
    );

    const removeButton = screen.getByTitle(/remove workspace access/i);
    await user.click(removeButton);

    await waitFor(() => {
      expect(removeUserFromWorkspaceMutateAsync).not.toHaveBeenCalled();
    });
  });

  it('removes base access in edit mode when confirmed', async () => {
    userRolesAndAccessData = [
      {
        workspace_id: 'ws-123',
        workspace_name: 'Workspace A',
        access: '',
        bases: [{ base_id: 'base-1', base_name: 'Base A', access: 'base-member' }],
      },
    ];

    const user = userEvent.setup();
    renderWithQueryClient(
      <AssignUserToWorkspaceModal
        {...defaultProps}
        editMode={true}
        memberToEdit="user-1"
      />
    );

    const removeButton = screen.getByTitle('Remove base access');
    await user.click(removeButton);

    await waitFor(() => {
      expect(removeUserFromBaseMutateAsync).toHaveBeenCalledWith({
        baseId: 'base-1',
        user_id: 'user-1',
      });
    });
  });

  it('does not remove base access when confirmation is cancelled', async () => {
    (globalThis.confirm as unknown as vi.Mock).mockReturnValueOnce(false);
    userRolesAndAccessData = [
      {
        workspace_id: 'ws-123',
        workspace_name: 'Workspace A',
        access: '',
        bases: [{ base_id: 'base-1', base_name: 'Base A', access: 'base-member' }],
      },
    ];

    const user = userEvent.setup();
    renderWithQueryClient(
      <AssignUserToWorkspaceModal
        {...defaultProps}
        editMode={true}
        memberToEdit="user-1"
      />
    );

    const removeButton = screen.getByTitle('Remove base access');
    await user.click(removeButton);

    await waitFor(() => {
      expect(removeUserFromBaseMutateAsync).not.toHaveBeenCalled();
    });
  });
});
