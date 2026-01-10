import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RoleBasedRoute } from '../RoleBasedRoute';
import { useUserRole } from '../../hooks/useUserRole';

// Mock the useUserRole hook
vi.mock('../../hooks/useUserRole', () => ({
  useUserRole: vi.fn(),
}));

const mockUseUserRole = vi.mocked(useUserRole);

/**
 * Helper function to create a complete mock return value for useUserRole
 * Includes hasAnyRole and hasAllRoles functions that don't exist in the actual hook
 * but are expected by RoleBasedRoute component
 */
const createMockUseUserRole = (overrides: Record<string, any> = {}) => ({
  getRole: vi.fn(),
  hasRole: vi.fn(),
  isOwner: vi.fn(),
  isCoOwner: vi.fn(),
  isMaintainer: vi.fn(),
  isBaseMember: vi.fn(),
  hasAdminRole: vi.fn(),
  hasFullAccessRole: vi.fn(),
  isAdmin: vi.fn(),
  hasAnyRole: vi.fn(),
  hasAllRoles: vi.fn(),
  ...overrides,
}) as any;

/**
 * Helper function to render RoleBasedRoute with React Router
 */
const renderWithRouter = (
  element: React.ReactElement,
  { initialEntries = ['/protected'] } = {}
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/protected" element={element} />
        <Route path="/not-found" element={<div data-testid="not-found-page">Not Found Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('RoleBasedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('No Roles Required', () => {
    it('should render children when no roles are required', () => {
      mockUseUserRole.mockReturnValue(createMockUseUserRole());

      renderWithRouter(
        <RoleBasedRoute>
          <div data-testid="protected-content">Public Access</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Public Access')).toBeInTheDocument();
    });

    it('should render complex children when no roles are required', () => {
      mockUseUserRole.mockReturnValue(createMockUseUserRole());

      const complexChildren = (
        <div>
          <h1>Dashboard</h1>
          <p>Welcome</p>
          <button>Action</button>
        </div>
      );

      renderWithRouter(
        <RoleBasedRoute>
          {complexChildren}
        </RoleBasedRoute>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should not call role checking functions when no roles required', () => {
      const mockHasAnyRole = vi.fn();
      const mockHasAllRoles = vi.fn();

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({
          hasAnyRole: mockHasAnyRole,
          hasAllRoles: mockHasAllRoles,
        })
      );

      renderWithRouter(
        <RoleBasedRoute>
          <div data-testid="protected-content">Content</div>
        </RoleBasedRoute>
      );

      expect(mockHasAnyRole).not.toHaveBeenCalled();
      expect(mockHasAllRoles).not.toHaveBeenCalled();
    });
  });

  describe('requireAll = false (hasAnyRole - default behavior)', () => {
    it('should render children when user has at least one required role', () => {
      const mockHasAnyRole = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin', 'editor']}>
          <div data-testid="protected-content">Restricted Content</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockHasAnyRole).toHaveBeenCalledWith(['admin', 'editor']);
    });

    it('should redirect to not-found when user has no required roles', () => {
      const mockHasAnyRole = vi.fn().mockReturnValue(false);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin', 'editor']}>
          <div data-testid="protected-content">Restricted Content</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should call hasAnyRole with the exact required roles array', () => {
      const mockHasAnyRole = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      const rolesArray = ['viewer', 'editor', 'admin'];
      renderWithRouter(
        <RoleBasedRoute requiredRoles={rolesArray}>
          <div data-testid="protected-content">Content</div>
        </RoleBasedRoute>
      );

      expect(mockHasAnyRole).toHaveBeenCalledWith(rolesArray);
      expect(mockHasAnyRole).toHaveBeenCalledTimes(1);
    });

    it('should handle single role in array with hasAnyRole', () => {
      const mockHasAnyRole = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin']}>
          <div data-testid="protected-content">Admin Only</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockHasAnyRole).toHaveBeenCalledWith(['admin']);
    });

    it('should handle many roles in array with hasAnyRole', () => {
      const mockHasAnyRole = vi.fn().mockReturnValue(true);
      const manyRoles = ['role1', 'role2', 'role3', 'role4', 'role5'];

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={manyRoles}>
          <div data-testid="protected-content">Content</div>
        </RoleBasedRoute>
      );

      expect(mockHasAnyRole).toHaveBeenCalledWith(manyRoles);
    });
  });

  describe('requireAll = true (hasAllRoles)', () => {
    it('should render children when user has all required roles', () => {
      const mockHasAllRoles = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAllRoles: mockHasAllRoles })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin', 'editor']} requireAll={true}>
          <div data-testid="protected-content">Restricted Content</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockHasAllRoles).toHaveBeenCalledWith(['admin', 'editor']);
    });

    it('should redirect to not-found when user does not have all required roles', () => {
      const mockHasAllRoles = vi.fn().mockReturnValue(false);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAllRoles: mockHasAllRoles })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin', 'editor']} requireAll={true}>
          <div data-testid="protected-content">Restricted Content</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should call hasAllRoles with exact required roles array when requireAll is true', () => {
      const mockHasAllRoles = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAllRoles: mockHasAllRoles })
      );

      const rolesArray = ['viewer', 'editor', 'admin'];
      renderWithRouter(
        <RoleBasedRoute requiredRoles={rolesArray} requireAll={true}>
          <div data-testid="protected-content">Content</div>
        </RoleBasedRoute>
      );

      expect(mockHasAllRoles).toHaveBeenCalledWith(rolesArray);
      expect(mockHasAllRoles).toHaveBeenCalledTimes(1);
    });

    it('should handle single role with requireAll=true', () => {
      const mockHasAllRoles = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAllRoles: mockHasAllRoles })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin']} requireAll={true}>
          <div data-testid="protected-content">Admin Content</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockHasAllRoles).toHaveBeenCalledWith(['admin']);
    });

    it('should handle many roles with requireAll=true', () => {
      const mockHasAllRoles = vi.fn().mockReturnValue(true);
      const manyRoles = ['role1', 'role2', 'role3', 'role4', 'role5'];

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAllRoles: mockHasAllRoles })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={manyRoles} requireAll={true}>
          <div data-testid="protected-content">Content</div>
        </RoleBasedRoute>
      );

      expect(mockHasAllRoles).toHaveBeenCalledWith(manyRoles);
    });

    it('should not call hasAnyRole when requireAll is true', () => {
      const mockHasAnyRole = vi.fn();
      const mockHasAllRoles = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({
          hasAnyRole: mockHasAnyRole,
          hasAllRoles: mockHasAllRoles,
        })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin', 'editor']} requireAll={true}>
          <div data-testid="protected-content">Content</div>
        </RoleBasedRoute>
      );

      expect(mockHasAllRoles).toHaveBeenCalled();
      expect(mockHasAnyRole).not.toHaveBeenCalled();
    });
  });

  describe('requireAll = false with empty roles array', () => {
    it('should render children when requireAll is false and roles array is empty', () => {
      mockUseUserRole.mockReturnValue(createMockUseUserRole());

      renderWithRouter(
        <RoleBasedRoute requiredRoles={[]} requireAll={false}>
          <div data-testid="protected-content">Content</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Navigation and Redirect', () => {
    it('should use Navigate component to redirect to /not-found', () => {
      const mockHasAnyRole = vi.fn().mockReturnValue(false);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin']}>
          <div data-testid="protected-content">Admin Content</div>
        </RoleBasedRoute>,
        { initialEntries: ['/protected'] }
      );

      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    });

    it('should maintain DOM structure when redirecting', () => {
      const mockHasAnyRole = vi.fn().mockReturnValue(false);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin']}>
          <div data-testid="protected-content">
            <span>Nested Content</span>
          </div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      expect(screen.queryByText('Nested Content')).not.toBeInTheDocument();
    });
  });

  describe('Children Rendering', () => {
    it('should render fragment children when no roles required', () => {
      mockUseUserRole.mockReturnValue(createMockUseUserRole());

      renderWithRouter(
        <RoleBasedRoute>
          <>
            <div data-testid="content1">Content 1</div>
            <div data-testid="content2">Content 2</div>
          </>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('content1')).toBeInTheDocument();
      expect(screen.getByTestId('content2')).toBeInTheDocument();
    });

    it('should render fragment children when access is granted', () => {
      const mockHasAnyRole = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin']}>
          <>
            <div data-testid="content1">Content 1</div>
            <div data-testid="content2">Content 2</div>
          </>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('content1')).toBeInTheDocument();
      expect(screen.getByTestId('content2')).toBeInTheDocument();
    });

    it('should render nested components when access is granted', () => {
      const mockHasAnyRole = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      const NestedComponent = () => (
        <div data-testid="nested">
          <span>Nested Content</span>
        </div>
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin']}>
          <NestedComponent />
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('nested')).toBeInTheDocument();
      expect(screen.getByText('Nested Content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string in required roles array', () => {
      const mockHasAnyRole = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['', 'admin']}>
          <div data-testid="protected-content">Content</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockHasAnyRole).toHaveBeenCalledWith(['', 'admin']);
    });

    it('should handle duplicate roles in required roles array', () => {
      const mockHasAnyRole = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin', 'admin', 'editor']}>
          <div data-testid="protected-content">Content</div>
        </RoleBasedRoute>
      );

      expect(mockHasAnyRole).toHaveBeenCalledWith(['admin', 'admin', 'editor']);
    });

    it('should handle case sensitivity in role names', () => {
      const mockHasAnyRole = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['Admin', 'EDITOR', 'viewer']}>
          <div data-testid="protected-content">Content</div>
        </RoleBasedRoute>
      );

      expect(mockHasAnyRole).toHaveBeenCalledWith(['Admin', 'EDITOR', 'viewer']);
    });

    it('should handle roles with special characters', () => {
      const mockHasAllRoles = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAllRoles: mockHasAllRoles })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin-user', 'editor:premium', 'viewer.ro']} requireAll={true}>
          <div data-testid="protected-content">Content</div>
        </RoleBasedRoute>
      );

      expect(mockHasAllRoles).toHaveBeenCalledWith(['admin-user', 'editor:premium', 'viewer.ro']);
    });

    it('should handle roles with spaces', () => {
      const mockHasAllRoles = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAllRoles: mockHasAllRoles })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['super admin', 'content editor']} requireAll={true}>
          <div data-testid="protected-content">Content</div>
        </RoleBasedRoute>
      );

      expect(mockHasAllRoles).toHaveBeenCalledWith(['super admin', 'content editor']);
    });
  });

  describe('Props Validation', () => {
    it('should have correct default prop values', () => {
      const mockHasAnyRole = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      renderWithRouter(
        <RoleBasedRoute>
          <div data-testid="protected-content">Content</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should apply requireAll=false behavior when not explicitly set', () => {
      const mockHasAnyRole = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin', 'editor']}>
          <div data-testid="protected-content">Content</div>
        </RoleBasedRoute>
      );

      expect(mockHasAnyRole).toHaveBeenCalled();
    });

    it('should support explicit requireAll=false', () => {
      const mockHasAnyRole = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin']} requireAll={false}>
          <div data-testid="protected-content">Content</div>
        </RoleBasedRoute>
      );

      expect(mockHasAnyRole).toHaveBeenCalled();
    });
  });

  describe('Multiple Renders and Updates', () => {
    it('should handle re-renders with different role requirements', () => {
      const mockHasAnyRole = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      const { rerender } = render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <RoleBasedRoute requiredRoles={['admin']}>
                  <div data-testid="protected-content">Admin Content</div>
                </RoleBasedRoute>
              }
            />
            <Route path="/not-found" element={<div data-testid="not-found-page">Not Found</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockHasAnyRole).toHaveBeenCalledWith(['admin']);

      mockHasAnyRole.mockClear();
      mockHasAnyRole.mockReturnValue(true);

      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <RoleBasedRoute requiredRoles={['editor']}>
                  <div data-testid="protected-content">Editor Content</div>
                </RoleBasedRoute>
              }
            />
            <Route path="/not-found" element={<div data-testid="not-found-page">Not Found</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(mockHasAnyRole).toHaveBeenCalledWith(['editor']);
    });

    it('should evaluate access each time with potentially changing role functions', () => {
      let mockHasAnyRole = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      const { rerender } = render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <RoleBasedRoute requiredRoles={['admin']}>
                  <div data-testid="protected-content">Content</div>
                </RoleBasedRoute>
              }
            />
            <Route path="/not-found" element={<div data-testid="not-found-page">Not Found</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();

      mockHasAnyRole = vi.fn().mockReturnValue(false);
      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <RoleBasedRoute requiredRoles={['admin']}>
                  <div data-testid="protected-content">Content</div>
                </RoleBasedRoute>
              }
            />
            <Route path="/not-found" element={<div data-testid="not-found-page">Not Found</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Type Safety and Interface Compliance', () => {
    it('should accept React.ReactNode as children', () => {
      mockUseUserRole.mockReturnValue(createMockUseUserRole());

      const textChild = 'Simple Text';
      renderWithRouter(
        <RoleBasedRoute>
          {textChild}
        </RoleBasedRoute>
      );

      expect(screen.getByText('Simple Text')).toBeInTheDocument();
    });

    it('should accept optional string array for requiredRoles', () => {
      const mockHasAnyRole = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      const roles: string[] = ['admin', 'editor'];
      renderWithRouter(
        <RoleBasedRoute requiredRoles={roles}>
          <div data-testid="content">Content</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should accept optional boolean for requireAll', () => {
      const mockHasAllRoles = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAllRoles: mockHasAllRoles })
      );

      const requireAll: boolean = true;
      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin']} requireAll={requireAll}>
          <div data-testid="content">Content</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('Access Control Logic', () => {
    it('should render children when access check passes with hasAnyRole', () => {
      const mockHasAnyRole = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin']}>
          <div data-testid="protected-content">Access Granted</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Access Granted')).toBeInTheDocument();
    });

    it('should redirect when access check fails with hasAnyRole', () => {
      const mockHasAnyRole = vi.fn().mockReturnValue(false);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAnyRole: mockHasAnyRole })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin']}>
          <div data-testid="protected-content">Access Granted</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render children when access check passes with hasAllRoles', () => {
      const mockHasAllRoles = vi.fn().mockReturnValue(true);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAllRoles: mockHasAllRoles })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin', 'editor']} requireAll={true}>
          <div data-testid="protected-content">All Roles Granted</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('All Roles Granted')).toBeInTheDocument();
    });

    it('should redirect when access check fails with hasAllRoles', () => {
      const mockHasAllRoles = vi.fn().mockReturnValue(false);

      mockUseUserRole.mockReturnValue(
        createMockUseUserRole({ hasAllRoles: mockHasAllRoles })
      );

      renderWithRouter(
        <RoleBasedRoute requiredRoles={['admin', 'editor']} requireAll={true}>
          <div data-testid="protected-content">Access Granted</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });
});
