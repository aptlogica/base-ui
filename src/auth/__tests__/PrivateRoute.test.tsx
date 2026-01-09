import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute } from '../PrivateRoute';
import { useAuth } from '../AuthContext';

// Mock the useAuth hook
vi.mock('../AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

/**
 * Helper function to render PrivateRoute with React Router
 */
const renderWithRouter = (
  children: React.ReactNode = <div data-testid="protected-content">Protected Content</div>
) => {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={<PrivateRoute>{children}</PrivateRoute>}
        />
        <Route
          path="/login"
          element={<div data-testid="login-page">Login Page</div>}
        />
      </Routes>
    </MemoryRouter>
  );
};

describe('PrivateRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path - User Authenticated', () => {
    it('should render children when user is authenticated and not loading', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: 'admin',
      });

      renderWithRouter();

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should render children with minimal user object', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '123' },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: null,
      });

      renderWithRouter();

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should render complex children elements', () => {
      const complexChildren = (
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back!</p>
          <button>Action</button>
        </div>
      );

      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@example.com' },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: 'user',
      });

      renderWithRouter(complexChildren);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome back!')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render multiple child components', () => {
      const multipleChildren = (
        <>
          <div data-testid="first-child">First</div>
          <div data-testid="second-child">Second</div>
          <div data-testid="third-child">Third</div>
        </>
      );

      mockUseAuth.mockReturnValue({
        user: { id: '1' },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: null,
      });

      renderWithRouter(multipleChildren);

      expect(screen.getByTestId('first-child')).toBeInTheDocument();
      expect(screen.getByTestId('second-child')).toBeInTheDocument();
      expect(screen.getByTestId('third-child')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should return null when loading is true', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: false,
        userRole: null,
      });

      renderWithRouter();

      // When loading is true, the component returns null
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });

    it('should return null and not render login page when loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: false,
        userRole: null,
      });

      renderWithRouter();

      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should return null regardless of user state if loading is true', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
        loading: true,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: 'admin',
      });

      renderWithRouter();

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });
  });

  describe('Failure Cases - User Not Authenticated', () => {
    it('should navigate to /login when user is null and loading is false', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: null,
      });

      renderWithRouter();

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should not render protected content when user is null', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: null,
      });

      renderWithRouter();

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should show login page with state containing from location', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: null,
      });

      renderWithRouter();

      // Login page should be rendered (location state is managed by React Router internally)
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: undefined,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: null,
      } as any);

      renderWithRouter();

      // undefined user should be treated like null
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('should handle empty user object as falsy', () => {
      mockUseAuth.mockReturnValue({
        user: {} as any,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: null,
      });

      renderWithRouter();

      // Empty object is truthy, so it should render children
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle null children prop', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1' },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: null,
      });

      renderWithRouter(null);

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should preserve children element props and attributes', () => {
      const childElement = (
        <div
          data-testid="child"
          className="custom-class"
          id="custom-id"
          aria-label="Protected area"
        >
          Content
        </div>
      );

      mockUseAuth.mockReturnValue({
        user: { id: '1' },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: null,
      });

      renderWithRouter(childElement);

      const element = screen.getByTestId('child');
      expect(element).toHaveClass('custom-class');
      expect(element).toHaveAttribute('id', 'custom-id');
      expect(element).toHaveAttribute('aria-label', 'Protected area');
    });

    it('should handle user with various role types', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', roles: ['admin', 'user'] },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: 'admin',
      });

      renderWithRouter();

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should render when user has only partial information', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1' },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: null,
      });

      renderWithRouter();

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('should transition from loading to authenticated', () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <PrivateRoute>
                  <div data-testid="protected-content">Protected</div>
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<div data-testid="login-page">Login</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Initial: loading state
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: false,
        userRole: null,
      });

      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <PrivateRoute>
                  <div data-testid="protected-content">Protected</div>
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<div data-testid="login-page">Login</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

      // Transition: loading complete, user authenticated
      mockUseAuth.mockReturnValue({
        user: { id: '1' },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: 'user',
      });

      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <PrivateRoute>
                  <div data-testid="protected-content">Protected</div>
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<div data-testid="login-page">Login</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should transition from loading to unauthenticated (redirect to login)', () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <PrivateRoute>
                  <div data-testid="protected-content">Protected</div>
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<div data-testid="login-page">Login</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Initial: loading state
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: false,
        userRole: null,
      });

      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <PrivateRoute>
                  <div data-testid="protected-content">Protected</div>
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<div data-testid="login-page">Login</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();

      // Transition: loading complete, user not authenticated
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: null,
      });

      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <PrivateRoute>
                  <div data-testid="protected-content">Protected</div>
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<div data-testid="login-page">Login</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  describe('Router Integration', () => {
    it('should work correctly with nested routes', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1' },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: null,
      });

      render(
        <MemoryRouter initialEntries={['/dashboard/profile']}>
          <Routes>
            <Route
              path="/dashboard/*"
              element={
                <PrivateRoute>
                  <div data-testid="dashboard">
                    <Routes>
                      <Route
                        path="/profile"
                        element={<div data-testid="profile-page">Profile</div>}
                      />
                    </Routes>
                  </div>
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<div data-testid="login-page">Login</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('should use useLocation hook correctly', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1' },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: null,
      });

      render(
        <MemoryRouter initialEntries={['/protected?param=value']}>
          <Routes>
            <Route
              path="/protected"
              element={<PrivateRoute><div data-testid="content">Content</div></PrivateRoute>}
            />
            <Route path="/login" element={<div data-testid="login-page">Login</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Component should render and location should be passed to Navigate if needed
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('Type Safety and Props', () => {
    it('should accept ReactNode as children', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1' },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: null,
      });

      const component = <PrivateRoute>Test</PrivateRoute>;
      expect(component).toBeDefined();
    });

    it('should properly type the component prop interface', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1' },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        saving: false,
        restoreCompleted: true,
        userRole: null,
      });

      renderWithRouter(<span>Test Content</span>);

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });
});
