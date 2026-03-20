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
  useUpdateBase: () => ({ mutateAsync: vi.fn() }),
  useDeleteBase: () => ({ mutateAsync: vi.fn() }),
  useCreateBase: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('../../../hooks/useNavigateToBaseFirstView', () => ({
  useNavigateToBaseFirstView: () => ({ navigateToFirstView: vi.fn() }),
}));

vi.mock('../../../hooks/useWorkspaceAccess', () => ({
  useWorkspaceAccess: () => ({
    canCreateBase: () => canCreateBaseValue,
    isBaseLevelAccess: () => false,
    canAssignUsers: () => false,
    canUpdateBase: () => false,
    canDeleteBase: () => false,
  }),
}));

vi.mock('../../../hooks/useBaseAccess', () => ({
  useBaseAccess: () => ({
    canUpdateBase: () => false,
    canDeleteBase: () => false,
    canManageBaseMembers: () => false,
    baseAccess: 'base-read',
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
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
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

describe('Breadcrumb', () => {
  beforeEach(() => {
    mockPathname = '/workspace/ws1/base/b1/table/t1/v1';
    mockVisibility = true;
    workspaceBasesData = { data: [base] };
    baseTablesData = { data: [table] };
    tableViewsData = { data: [view] };
    canCreateBaseValue = false;
    navigateSpy.mockClear();
    navigateToTableSpy.mockClear();
    navigateToViewSpy.mockClear();
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
});
