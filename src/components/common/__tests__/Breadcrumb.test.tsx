import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import Breadcrumb from '../Breadcrumb';

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: '/base/base-1/table/table-1/view-1',
    }),
  };
});

// Mock navigation store with getState
const mockNavigationStore = {
  selectedWorkspaceId: 'workspace-1',
  selectedBaseId: 'base-1',
  selectedTableId: 'table-1',
  selectedViewId: 'view-1',
};

vi.mock('../../../stores/navigationStore', () => ({
  useNavigationStore: Object.assign(
    vi.fn(() => mockNavigationStore),
    {
      getState: () => ({
        ...mockNavigationStore,
        navigateToBase: vi.fn(),
        navigateToTable: vi.fn(),
        navigateToView: vi.fn(),
      }),
    }
  ),
}));

// Track component visibility
let mockComponentVisibility = true;

// Mock workspace data service
const mockWorkspaceDataService = {
  baseByIdQuery: {
    data: {
      data: {
        id: 'base-1',
        title: 'Test Base',
        workspace_id: 'workspace-1',
      },
    },
  },
  tableByIdQuery: {
    data: {
      data: {
        model: {
          id: 'table-1',
          title: 'Test Table',
        },
      },
    },
  },
  viewByIdQuery: {
    data: {
      id: 'view-1',
      title: 'Test View',
      type: 'grid',
    },
  },
};

vi.mock('../../../hooks/workspace/useWorkspaceDataService', () => ({
  useWorkspaceDataService: vi.fn(() => mockWorkspaceDataService),
}));

// Mock useApi hooks with tracking
let mockWorkspaceBases = {
  data: {
    data: [
      { id: 'base-1', title: 'Test Base', workspace_id: 'workspace-1' },
      { id: 'base-2', title: 'Another Base', workspace_id: 'workspace-1' },
    ],
  },
};

vi.mock('../../../hooks/useApi', () => ({
  useWorkspaceBases: () => mockWorkspaceBases,
  useBaseTables: () => ({
    data: {
      data: [
        { model: { id: 'table-1', title: 'Test Table' } },
        { model: { id: 'table-2', title: 'Another Table' } },
      ],
    },
  }),
  useTableViews: () => ({
    data: {
      data: [
        { id: 'view-1', title: 'Test View', type: 'grid' },
        { id: 'view-2', title: 'Calendar View', type: 'calendar' },
      ],
    },
  }),
  useUpdateBase: () => ({ mutateAsync: vi.fn() }),
  useDeleteBase: () => ({ mutateAsync: vi.fn() }),
  useCreateBase: () => ({ mutateAsync: vi.fn() }),
}));

// Mock navigate to first view hook
vi.mock('../../../hooks/useNavigateToBaseFirstView', () => ({
  useNavigateToBaseFirstView: () => ({
    navigateToFirstView: vi.fn(),
  }),
}));

// Mock workspace access hook
vi.mock('../../../hooks/useWorkspaceAccess', () => ({
  useWorkspaceAccess: () => ({
    canCreateBase: () => true,
    isBaseLevelAccess: () => false,
    canUpdateBase: () => true,
    canDeleteBase: () => true,
    canAssignUsers: () => true,
  }),
}));

// Mock base access hook
vi.mock('../../../hooks/useBaseAccess', () => ({
  useBaseAccess: () => ({
    canUpdateBase: () => true,
    canDeleteBase: () => true,
    canManageBaseMembers: () => true,
    baseAccess: 'owner',
  }),
}));

// Mock navigation actions
vi.mock('../../../hooks/useNavigationActions', () => ({
  useNavigationActions: () => ({
    handleBaseDeletion: vi.fn(),
  }),
}));

// Mock toast
vi.mock('../Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock tanstack query
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

// Mock route context
vi.mock('../../../contexts/RouteContext', () => ({
  useComponentVisibility: () => mockComponentVisibility,
  COMPONENT_IDS: { BREADCRUMB: 'breadcrumb' },
}));

// Mock view types
vi.mock('../../../types/viewTypes', () => ({
  getViewIconInfo: (type: string) => ({
    icon: () => <span data-testid={`view-icon-${type}`}>📋</span>,
    color: '#000',
  }),
}));

// Mock modals
vi.mock('../../modals/EditItemModal', () => ({
  EditItemModal: () => null,
}));

vi.mock('../../modals/AddBaseMembersModal', () => ({
  AddBaseMembersModal: () => null,
}));

vi.mock('../../modals/CreateBaseModal', () => ({
  CreateBaseModal: () => null,
}));

// Mock BaseMenu
vi.mock('../BaseMenu', () => ({
  BaseMenu: () => <div data-testid="base-menu">Menu</div>,
}));

// Mock helpers
vi.mock('../../../utils/helpers', () => ({
  getInitials: (title: string, fallback: string) => {
    if (!title) return fallback;
    return title.substring(0, 2).toUpperCase();
  },
}));

// Mock ReactDOM.createPortal to render inline
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (element: React.ReactNode) => element,
  };
});

// Mock getBoundingClientRect for dropdown positioning
const mockGetBoundingClientRect = vi.fn(() => ({
  top: 100,
  left: 100,
  bottom: 140,
  right: 200,
  width: 100,
  height: 40,
  x: 100,
  y: 100,
  toJSON: () => {},
}));

const renderBreadcrumb = (initialPath = '/base/base-1/table/table-1/view-1') => {
  // Mock getBoundingClientRect on elements
  Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
  
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Breadcrumb />
    </MemoryRouter>
  );
};

describe('Breadcrumb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockComponentVisibility = true;
    mockWorkspaceBases = {
      data: {
        data: [
          { id: 'base-1', title: 'Test Base', workspace_id: 'workspace-1' },
          { id: 'base-2', title: 'Another Base', workspace_id: 'workspace-1' },
        ],
      },
    };
  });

  describe('Basic Rendering', () => {
    it('renders breadcrumb navigation', () => {
      renderBreadcrumb();
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('renders with correct aria-label', () => {
      renderBreadcrumb();
      
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Breadcrumb');
    });

    it('renders base breadcrumb item', () => {
      renderBreadcrumb();
      
      expect(screen.getByText('Test Base')).toBeInTheDocument();
    });

    it('renders table breadcrumb item', () => {
      renderBreadcrumb();
      
      expect(screen.getByText('Test Table')).toBeInTheDocument();
    });

    it('renders view breadcrumb item', () => {
      renderBreadcrumb();
      
      expect(screen.getByText('Test View')).toBeInTheDocument();
    });
  });


  describe('Dropdown Interactions', () => {
    it('opens base dropdown when base item is clicked', async () => {
      const user = userEvent.setup();
      Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
      renderBreadcrumb();
      
      // Find the clickable breadcrumb segment
      const baseText = screen.getByText('Test Base');
      const baseItem = baseText.closest('div[class*="cursor-pointer"]') || baseText.parentElement;
      
      await user.click(baseItem!);
      
      await waitFor(() => {
        expect(screen.getByText('Bases')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('shows alternative bases in dropdown', async () => {
      const user = userEvent.setup();
      Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
      renderBreadcrumb();
      
      const baseText = screen.getByText('Test Base');
      const baseItem = baseText.closest('div[class*="cursor-pointer"]') || baseText.parentElement;
      
      await user.click(baseItem!);
      
      await waitFor(() => {
        expect(screen.getByText('Bases')).toBeInTheDocument();
        expect(screen.getByText('Another Base')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('closes dropdown when clicking the same item again', async () => {
      const user = userEvent.setup();
      Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
      renderBreadcrumb();
      
      const baseText = screen.getByText('Test Base');
      const baseItem = baseText.closest('div[class*="cursor-pointer"]') || baseText.parentElement;
      
      // Open dropdown
      await user.click(baseItem!);
      await waitFor(() => {
        expect(screen.getByText('Bases')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Close by clicking same item again
      await user.click(baseItem!);
      
      await waitFor(() => {
        expect(screen.queryByText('Bases')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

  });

  describe('Active Item Indicator', () => {
    it('shows active indicator on current base', async () => {
      const user = userEvent.setup();
      Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
      renderBreadcrumb();
      
      const baseText = screen.getByText('Test Base');
      const baseItem = baseText.closest('div[class*="cursor-pointer"]') || baseText.parentElement;
      
      await user.click(baseItem!);
      
      await waitFor(() => {
        // Active items have a green dot indicator
        const activeIndicator = document.querySelector('.bg-green-500');
        expect(activeIndicator).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Create Base Button', () => {
    it('shows Create New Base button when user has permission', async () => {
      const user = userEvent.setup();
      Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
      renderBreadcrumb();
      
      const baseText = screen.getByText('Test Base');
      const baseItem = baseText.closest('div[class*="cursor-pointer"]') || baseText.parentElement;
      
      await user.click(baseItem!);
      
      await waitFor(() => {
        expect(screen.getByText('Create New Base')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Visibility', () => {
    it('returns null when component visibility is false', () => {
      mockComponentVisibility = false;
      
      Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
      
      const { container } = render(
        <MemoryRouter initialEntries={['/base/base-1/table/table-1/view-1']}>
          <Breadcrumb />
        </MemoryRouter>
      );
      
      expect(container.querySelector('nav')).toBeNull();
    });
  });


  describe('Chevron Rotation', () => {
    it('rotates chevron when dropdown is open', async () => {
      const user = userEvent.setup();
      Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
      const { container } = renderBreadcrumb();
      
      const baseText = screen.getByText('Test Base');
      const baseItem = baseText.closest('div[class*="cursor-pointer"]') || baseText.parentElement;
      
      await user.click(baseItem!);
      
      await waitFor(() => {
        const rotatedChevron = container.querySelector('.rotate-180');
        expect(rotatedChevron).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });


  describe('Portal Rendering', () => {
    it('renders dropdown in portal', async () => {
      const user = userEvent.setup();
      Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
      renderBreadcrumb();
      
      const baseText = screen.getByText('Test Base');
      const baseItem = baseText.closest('div[class*="cursor-pointer"]') || baseText.parentElement;
      
      await user.click(baseItem!);
      
      await waitFor(() => {
        // Check for portal class - dropdown is portaled to body
        const portal = document.querySelector('.breadcrumb-dropdown-portal');
        expect(portal).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Event Propagation', () => {
    it('stops propagation on dropdown item click', async () => {
      const user = userEvent.setup();
      const parentClickHandler = vi.fn();
      Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
      
      render(
        <MemoryRouter initialEntries={['/base/base-1/table/table-1/view-1']}>
          <div onClick={parentClickHandler}>
            <Breadcrumb />
          </div>
        </MemoryRouter>
      );
      
      const baseText = screen.getByText('Test Base');
      const baseItem = baseText.closest('div[class*="cursor-pointer"]') || baseText.parentElement;
      
      await user.click(baseItem!);
      
      await waitFor(() => {
        expect(screen.getByText('Bases')).toBeInTheDocument();
        expect(screen.getByText('Another Base')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Click on dropdown item - parent click should be prevented by stopPropagation
      parentClickHandler.mockClear();
      await user.click(screen.getByText('Another Base'));
      
      // The stopPropagation prevents parent from receiving click
      expect(parentClickHandler).not.toHaveBeenCalled();
    });
  });
});
