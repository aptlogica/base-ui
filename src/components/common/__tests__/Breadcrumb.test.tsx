import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Breadcrumb from '../Breadcrumb';

let mockPathname = '/workspace/ws1/base/b1/table/t1/v1';
let mockVisibility = true;

const navigateSpy = vi.fn();
const navigateToTableSpy = vi.fn();
const navigateToViewSpy = vi.fn();

const base = { id: 'b1', title: 'Base One', workspace_id: 'ws1' } as any;
const table = { id: 't1', title: 'Table One' } as any;
const view = { id: 'v1', title: 'View One', type: 'grid' } as any;

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
  useWorkspaceBases: () => ({ data: { data: [base] } }),
  useBaseTables: () => ({ data: { data: [table] } }),
  useTableViews: () => ({ data: { data: [view] } }),
  useUpdateBase: () => ({ mutateAsync: vi.fn() }),
  useDeleteBase: () => ({ mutateAsync: vi.fn() }),
  useCreateBase: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('../../../hooks/useNavigateToBaseFirstView', () => ({
  useNavigateToBaseFirstView: () => ({ navigateToFirstView: vi.fn() }),
}));

vi.mock('../../../hooks/useWorkspaceAccess', () => ({
  useWorkspaceAccess: () => ({
    canCreateBase: () => false,
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
});
