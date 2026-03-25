import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Breadcrumb from '../Breadcrumb';

const base = { id: 'b1', title: 'Base One', workspace_id: 'ws1' } as any;
const table = { id: 't1', title: 'Table One' } as any;
const view = { id: 'v1', title: 'View One', type: 'grid' } as any;

let mockPathname = '/workspace/ws1/base/b1/table/t1/v1';
let mockVisibility = true;
let workspaceBasesData: any = { data: [base] };
let baseTablesData: any = { data: [table] };
let tableViewsData: any = { data: [view] };
let canCreateBaseValue = false;
let canAssignUsersValue = false;
let canUpdateBaseFromWorkspaceValue = false;
let canDeleteBaseFromWorkspaceValue = false;
let canUpdateBaseFromBaseValue = false;
let canDeleteBaseFromBaseValue = false;
let canManageBaseMembersValue = false;
let baseAccessValue: string = 'base-read';
let isBaseLevelAccessValue = false;
let editItemModalSavePayload: { name: string; description: string; image?: File | null; removeImage?: boolean } = {
  name: base.title,
  description: '',
};
const updateBaseMutationSpy = vi.fn();
const deleteBaseMutationSpy = vi.fn();
const createBaseMutationSpy = vi.fn();
const invalidateQueriesSpy = vi.fn();
const toastInfoSpy = vi.fn();
const toastSuccessSpy = vi.fn();
const toastErrorSpy = vi.fn();

const navigateSpy = vi.fn();
const navigateToTableSpy = vi.fn();
const navigateToViewSpy = vi.fn();

const useNavigationStoreImpl = vi.hoisted(() => Object.assign(
  () => ({
    selectedWorkspaceId: 'ws1',
    selectedBaseId: 'b1',
    selectedTableId: 't1',
    selectedViewId: 'v1',
  }),
  {
    getState: () => ({
      navigateToTable: navigateToTableSpy,
      navigateToView: navigateToViewSpy,
    }),
  },
));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: mockPathname }),
  useNavigate: () => navigateSpy,
}));

vi.mock('../../../stores/navigationStore', () => ({
  useNavigationStore: useNavigationStoreImpl,
}));

vi.mock('../../../hooks/workspace/useWorkspaceDataService', () => ({
  useWorkspaceDataService: () => ({
    baseByIdQuery: { data: { data: base } },
    tableByIdQuery: { data: { data: table } },
    viewByIdQuery: { data: view },
  }),
}));

vi.mock('../../../hooks/useApi', () => ({
  useWorkspaceBases: () => ({ data: workspaceBasesData }),
  useBaseTables: () => ({ data: baseTablesData }),
  useTableViews: () => ({ data: tableViewsData }),
  useUpdateBase: () => ({ mutateAsync: updateBaseMutationSpy }),
  useDeleteBase: () => ({ mutateAsync: deleteBaseMutationSpy }),
  useCreateBase: () => ({ mutateAsync: createBaseMutationSpy }),
}));

vi.mock('../../../hooks/useNavigateToBaseFirstView', () => ({
  useNavigateToBaseFirstView: () => ({ navigateToFirstView: vi.fn() }),
}));

vi.mock('../../../hooks/useWorkspaceAccess', () => ({
  useWorkspaceAccess: () => ({
    canCreateBase: () => canCreateBaseValue,
    isBaseLevelAccess: () => isBaseLevelAccessValue,
    canAssignUsers: () => canAssignUsersValue,
    canUpdateBase: () => canUpdateBaseFromWorkspaceValue,
    canDeleteBase: () => canDeleteBaseFromWorkspaceValue,
  }),
}));

vi.mock('../../../hooks/useBaseAccess', () => ({
  useBaseAccess: () => ({
    canUpdateBase: () => canUpdateBaseFromBaseValue,
    canDeleteBase: () => canDeleteBaseFromBaseValue,
    canManageBaseMembers: () => canManageBaseMembersValue,
    baseAccess: baseAccessValue,
  }),
}));

vi.mock('../../../hooks/useNavigationActions', () => ({
  useNavigationActions: () => ({ handleBaseDeletion: vi.fn() }),
}));

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

vi.mock('../Toast', () => ({
  useToast: () => ({
    success: toastSuccessSpy,
    error: toastErrorSpy,
    info: toastInfoSpy,
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesSpy }),
}));

vi.mock('../../../contexts/RouteContext', () => ({
  useComponentVisibility: () => mockVisibility,
  COMPONENT_IDS: { BREADCRUMB: 'breadcrumb' },
}));

vi.mock('../../../types/viewTypes', () => ({
  getViewIconInfo: () => ({
    icon: (props: any) => <svg data-testid="view-icon" {...props} />,
    color: '#9333ea',
  }),
}));

vi.mock('../../../utils/helpers', () => ({
  getInitials: () => 'B',
}));

vi.mock('../BaseMenu', () => ({
  BaseMenu: ({ onEdit, onAddMembers, onDelete, canEdit, canAddMembers, canDelete }: any) => (
    <div data-testid="base-menu">
      {canEdit && (
        <button onClick={() => onEdit({ id: 'b1', title: 'Base One', workspace_id: 'ws1' })}>
          Edit Base
        </button>
      )}
      {canAddMembers && (
        <button onClick={() => onAddMembers({ id: 'b1', title: 'Base One', workspace_id: 'ws1' })}>
          Add Members
        </button>
      )}
      {canDelete && (
        <button onClick={() => onDelete({ id: 'b1', title: 'Base One', workspace_id: 'ws1' })}>
          Delete Base
        </button>
      )}
    </div>
  ),
}));

vi.mock('../../modals/EditItemModal', () => ({
  EditItemModal: ({ isOpen, onSave, onClose }: any) =>
    isOpen ? (
      <div data-testid="edit-item-modal">
        <button onClick={() => onSave(editItemModalSavePayload)}>Save Edit</button>
        <button onClick={onClose}>Close Edit</button>
      </div>
    ) : null,
}));

vi.mock('../../modals/DeleteBaseModal', () => ({
  DeleteBaseModal: ({ isOpen, base, onConfirm }: any) =>
    isOpen ? (
      <div data-testid="delete-base-modal">
        <button onClick={() => onConfirm(base?.id)}>Confirm Delete</button>
      </div>
    ) : null,
}));

vi.mock('../../modals/AddBaseMembersModal', () => ({
  AddBaseMembersModal: ({ isOpen }: any) => (isOpen ? <div data-testid="add-members-modal" /> : null),
}));

vi.mock('../../modals/CreateBaseModal', () => ({
  CreateBaseModal: ({ isOpen, onCreate }: any) =>
    isOpen ? (
      <div data-testid="create-base-modal">
        <button onClick={() => onCreate({ name: 'New Base', description: 'Desc', image: null })}>
          Confirm Create
        </button>
      </div>
    ) : null,
}));

describe('Breadcrumb', () => {
  beforeEach(() => {
    mockPathname = '/workspace/ws1/base/b1/table/t1/v1';
    mockVisibility = true;
    workspaceBasesData = { data: [base] };
    baseTablesData = { data: [table] };
    tableViewsData = { data: [view] };
    canCreateBaseValue = false;
    canAssignUsersValue = false;
    canUpdateBaseFromWorkspaceValue = false;
    canDeleteBaseFromWorkspaceValue = false;
    canUpdateBaseFromBaseValue = false;
    canDeleteBaseFromBaseValue = false;
    canManageBaseMembersValue = false;
    baseAccessValue = 'base-read';
    isBaseLevelAccessValue = false;
    editItemModalSavePayload = {
      name: base.title,
      description: '',
    };
    navigateSpy.mockClear();
    navigateToTableSpy.mockClear();
    navigateToViewSpy.mockClear();
    updateBaseMutationSpy.mockReset();
    deleteBaseMutationSpy.mockReset();
    createBaseMutationSpy.mockReset();
    invalidateQueriesSpy.mockReset();
    toastInfoSpy.mockReset();
    toastSuccessSpy.mockReset();
    toastErrorSpy.mockReset();
  });

  it('renders base, table, and view labels for a full path', () => {
    render(<Breadcrumb />);

    expect(screen.getByText('Base One')).toBeInTheDocument();
    expect(screen.getByText('Table One')).toBeInTheDocument();
    expect(screen.getByText('View One')).toBeInTheDocument();
    expect(screen.getByTestId('view-icon')).toBeInTheDocument();
  });

  it('returns null when breadcrumb is not visible on route', () => {
    mockVisibility = false;
    const { container } = render(<Breadcrumb />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when no breadcrumb items are available', () => {
    mockPathname = '/workspace';
    const { container } = render(<Breadcrumb />);
    expect(container.firstChild).toBeNull();
  });

  it('renders base and table for legacy routes without view', () => {
    mockPathname = '/base/b1/table/t1';
    render(<Breadcrumb />);

    expect(screen.getByText('Base One')).toBeInTheDocument();
    expect(screen.getByText('Table One')).toBeInTheDocument();
    expect(screen.queryByText('View One')).not.toBeInTheDocument();
  });

  it('renders base image when available', () => {
    (base as any).image = 'https://example.com/base.png';

    render(<Breadcrumb />);

    expect(screen.getByAltText('Base One')).toBeInTheDocument();
    delete (base as any).image;
  });

  it('opens base dropdown on click', async () => {
    const user = userEvent.setup();
    render(<Breadcrumb />);

    const baseButton = screen.getByRole('button', { name: /base one/i });
    await user.click(baseButton);

    expect(screen.getByText('Bases')).toBeInTheDocument();
  });

  it('opens table dropdown and navigates on table click', async () => {
    const user = userEvent.setup();
    render(<Breadcrumb />);

    const tableButton = screen.getByRole('button', { name: /table one/i });
    await user.click(tableButton);

    expect(screen.getByText('Tables')).toBeInTheDocument();
    const portal = document.querySelector('.breadcrumb-dropdown-portal') as HTMLElement;
    const portalUtils = within(portal);
    const tableOptions = portalUtils.getAllByRole('button', { name: /table one/i });
    await user.click(tableOptions[0]);

    expect(navigateToTableSpy).toHaveBeenCalledWith('ws1', 'b1', 't1');
    expect(navigateSpy).toHaveBeenCalledWith('/workspace/ws1/base/b1/table/t1/grid');
  });

  it('opens view dropdown and navigates on view click', async () => {
    const user = userEvent.setup();
    render(<Breadcrumb />);

    const viewButton = screen.getByRole('button', { name: /view one/i });
    await user.click(viewButton);

    expect(screen.getByText('Views')).toBeInTheDocument();
    const portal = document.querySelector('.breadcrumb-dropdown-portal') as HTMLElement;
    const portalUtils = within(portal);
    const viewOptions = portalUtils.getAllByRole('button', { name: /view one/i });
    await user.click(viewOptions[0]);

    expect(navigateToViewSpy).toHaveBeenCalledWith('ws1', 'b1', 't1', 'v1');
    expect(navigateSpy).toHaveBeenCalledWith('/workspace/ws1/base/b1/table/t1/v1');
  });

  it('shows Create New Base button when allowed', async () => {
    const user = userEvent.setup();
    canCreateBaseValue = true;
    render(<Breadcrumb />);

    const baseButton = screen.getByRole('button', { name: /base one/i });
    await user.click(baseButton);

    expect(screen.getByText('Create New Base')).toBeInTheDocument();
  });

  it('shows empty state when dropdown has no items', async () => {
    const user = userEvent.setup();
    workspaceBasesData = { data: [] };
    render(<Breadcrumb />);

    const baseButton = screen.getByRole('button', { name: /base one/i });
    await user.click(baseButton);

    expect(screen.getByText('No items found.')).toBeInTheDocument();
  });

  it('filters bases when base-level access is enabled', async () => {
    const user = userEvent.setup();
    isBaseLevelAccessValue = true;
    workspaceBasesData = {
      data: [
        { id: 'b1', title: 'Allowed', workspace_id: 'ws1', access_level: 'owner' },
        { id: 'b2', title: 'Hidden', workspace_id: 'ws1', access_level: 'none' },
      ],
    };

    render(<Breadcrumb />);

    const baseButton = screen.getByRole('button', { name: /base one/i });
    await user.click(baseButton);

    const portal = document.querySelector('.breadcrumb-dropdown-portal') as HTMLElement;
    const portalUtils = within(portal);
    expect(portalUtils.getByText('Allowed')).toBeInTheDocument();
    expect(portalUtils.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('renders base menu when user has permissions', async () => {
    const user = userEvent.setup();
    canUpdateBaseFromBaseValue = true;

    render(<Breadcrumb />);

    const baseButton = screen.getByRole('button', { name: /base one/i });
    await user.click(baseButton);

    expect(screen.getByTestId('base-menu')).toBeInTheDocument();
  });

  it('shows info toast when saving base with no changes', async () => {
    const user = userEvent.setup();
    canUpdateBaseFromBaseValue = true;
    editItemModalSavePayload = { name: 'Base One', description: '' };

    render(<Breadcrumb />);

    const baseButton = screen.getByRole('button', { name: /base one/i });
    await user.click(baseButton);
    await user.click(screen.getByText('Edit Base'));

    await user.click(screen.getByText('Save Edit'));

    expect(toastInfoSpy).toHaveBeenCalledWith('No changes to save');
    expect(updateBaseMutationSpy).not.toHaveBeenCalled();
  });

  it('updates base when changes are provided', async () => {
    const user = userEvent.setup();
    canUpdateBaseFromBaseValue = true;
    editItemModalSavePayload = { name: 'Base One Updated', description: 'New desc' };
    updateBaseMutationSpy.mockResolvedValueOnce(undefined);

    render(<Breadcrumb />);

    const baseButton = screen.getByRole('button', { name: /base one/i });
    await user.click(baseButton);
    await user.click(screen.getByText('Edit Base'));
    await user.click(screen.getByText('Save Edit'));

    expect(updateBaseMutationSpy).toHaveBeenCalledWith({
      baseId: 'b1',
      updates: { title: 'Base One Updated', description: 'New desc' },
    });
    expect(invalidateQueriesSpy).toHaveBeenCalled();
    expect(toastSuccessSpy).toHaveBeenCalledWith('Base updated successfully');
  });

  it('shows error toast when base update fails', async () => {
    const user = userEvent.setup();
    canUpdateBaseFromBaseValue = true;
    editItemModalSavePayload = { name: 'Base One Updated', description: 'New desc' };
    updateBaseMutationSpy.mockRejectedValueOnce(new Error('boom'));

    render(<Breadcrumb />);

    const baseButton = screen.getByRole('button', { name: /base one/i });
    await user.click(baseButton);
    await user.click(screen.getByText('Edit Base'));
    await user.click(screen.getByText('Save Edit'));

    expect(toastErrorSpy).toHaveBeenCalledWith('boom');
  });

  it('opens add members modal from base menu', async () => {
    const user = userEvent.setup();
    canAssignUsersValue = true;

    render(<Breadcrumb />);

    const baseButton = screen.getByRole('button', { name: /base one/i });
    await user.click(baseButton);
    await user.click(screen.getByText('Add Members'));

    expect(screen.getByTestId('add-members-modal')).toBeInTheDocument();
  });

  it('deletes base and triggers navigation cleanup', async () => {
    const user = userEvent.setup();
    canDeleteBaseFromBaseValue = true;
    deleteBaseMutationSpy.mockResolvedValueOnce(undefined);

    render(<Breadcrumb />);

    const baseButton = screen.getByRole('button', { name: /base one/i });
    await user.click(baseButton);
    await user.click(screen.getByText('Delete Base'));
    await user.click(screen.getByText('Confirm Delete'));

    expect(deleteBaseMutationSpy).toHaveBeenCalledWith('b1');
    expect(toastSuccessSpy).toHaveBeenCalledWith('Base deleted successfully');
    expect(invalidateQueriesSpy).toHaveBeenCalled();
  });

  it('creates base from create base modal', async () => {
    const user = userEvent.setup();
    canCreateBaseValue = true;
    createBaseMutationSpy.mockResolvedValueOnce(undefined);

    render(<Breadcrumb />);

    const baseButton = screen.getByRole('button', { name: /base one/i });
    await user.click(baseButton);
    await user.click(screen.getByText('Create New Base'));
    await user.click(screen.getByText('Confirm Create'));

    expect(createBaseMutationSpy).toHaveBeenCalledWith({
      title: 'New Base',
      description: 'Desc',
      workspace_id: 'ws1',
      image: undefined,
    });
    expect(toastSuccessSpy).toHaveBeenCalledWith('Base created successfully');
    expect(invalidateQueriesSpy).toHaveBeenCalled();
  });
});
