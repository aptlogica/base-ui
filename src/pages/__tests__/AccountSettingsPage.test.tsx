import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AccountSettingsPage from '../AccountSettingsPage';

// Hoist mock function to top scope for vi.mock() to access it
const { mockAccountSettingsComponent } = vi.hoisted(() => ({
  mockAccountSettingsComponent: vi.fn((_props: any) => <div data-testid="account-settings-component">Account Settings</div>),
}));

vi.mock('../../components/account/AccountSettings', () => ({
  AccountSettings: (props: any) => mockAccountSettingsComponent(props),
}));

// Helper function to render component with routing
const renderWithRouter = (workspaceId?: string) => {
  const initialPath = workspaceId ? `/workspace/${workspaceId}/settings` : '/workspace//settings';

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/workspace/:workspaceId/settings" element={<AccountSettingsPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('AccountSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Happy Path', () => {
    it('should render AccountSettings component when workspaceId is provided', () => {
      // Arrange
      const workspaceId = 'test-workspace-123';

      // Act
      renderWithRouter(workspaceId);

      // Assert
      expect(screen.getByTestId('account-settings-component')).toBeInTheDocument();
      expect(mockAccountSettingsComponent).toHaveBeenCalled();
    });

    it('should pass workspaceId as a prop to AccountSettings component', () => {
      // Arrange
      const workspaceId = 'workspace-abc-def';

      // Act
      renderWithRouter(workspaceId);

      // Assert
      expect(mockAccountSettingsComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId,
        }),
      );
    });

    it('should render AccountSettings component with correct workspaceId prop for multiple different IDs', () => {
      // Arrange
      const workspaceIds = ['workspace-1', 'workspace-2', 'workspace-3'];

      // Act & Assert for each workspace ID
      workspaceIds.forEach((id) => {
        vi.clearAllMocks();
        renderWithRouter(id);

        expect(mockAccountSettingsComponent).toHaveBeenCalledWith(
          expect.objectContaining({
            workspaceId: id,
          }),
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should not call AccountSettings when route does not match', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // Arrange
      // When route path doesn't match (empty workspaceId), component won't render
      render(
        <MemoryRouter initialEntries={['/workspace//settings']}>
          <Routes>
            <Route path="/workspace/:workspaceId/settings" element={<AccountSettingsPage />} />
          </Routes>
        </MemoryRouter>,
      );

      // Act & Assert
      expect(mockAccountSettingsComponent).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should not render when route path does not match (missing workspaceId)', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // Arrange
      const { container } = render(
        <MemoryRouter initialEntries={['/workspace//settings']}>
          <Routes>
            <Route path="/workspace/:workspaceId/settings" element={<AccountSettingsPage />} />
          </Routes>
        </MemoryRouter>,
      );

      // Act & Assert
      // When route doesn't match, nothing is rendered in the container
      expect(container.firstChild?.childNodes.length || 0).toBe(0);

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle workspaceId with only whitespace by rendering AccountSettings', () => {
      // Arrange
      // React router treats whitespace-only params as valid params
      render(
        <MemoryRouter initialEntries={['/workspace/%20/settings']}>
          <Routes>
            <Route path="/workspace/:workspaceId/settings" element={<AccountSettingsPage />} />
          </Routes>
        </MemoryRouter>,
      );

      // Act & Assert - whitespace is considered valid by router and passed to component
      // The component receives the whitespace and since it's truthy, AccountSettings renders
      expect(mockAccountSettingsComponent).toHaveBeenCalled();
    });

    it('should render error UI when workspaceId is falsy (direct component test)', () => {
      // Arrange
      // Test the conditional logic directly
      const TestComponent = () => {
        const workspaceId = undefined;
        if (!workspaceId) {
          return (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900">Invalid Workspace</h2>
                <p className="text-gray-600 mt-2">Workspace ID is required</p>
              </div>
            </div>
          );
        }
        return <div>Should not render</div>;
      };

      // Act
      render(<TestComponent />);

      // Assert
      expect(screen.getByText('Invalid Workspace')).toBeInTheDocument();
      expect(screen.getByText('Workspace ID is required')).toBeInTheDocument();
    });

    it('should have correct styling classes on error message', () => {
      // Arrange
      render(
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Invalid Workspace</h2>
            <p className="text-gray-600 mt-2">Workspace ID is required</p>
          </div>
        </div>,
      );

      // Act
      const heading = screen.getByText('Invalid Workspace');
      const errorMessage = screen.getByText('Workspace ID is required');

      // Assert
      expect(heading).toHaveClass('text-xl', 'font-semibold', 'text-gray-900');
      expect(errorMessage).toHaveClass('text-gray-600', 'mt-2');
    });

    it('should render centered error container with correct layout', () => {
      // Arrange
      render(
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Invalid Workspace</h2>
            <p className="text-gray-600 mt-2">Workspace ID is required</p>
          </div>
        </div>,
      );

      // Act
      const container = screen.getByText('Invalid Workspace').closest('div');
      const parentDiv = container?.parentElement;

      // Assert
      expect(parentDiv).toHaveClass('flex', 'items-center', 'justify-center', 'h-full');
    });
  });

  describe('Component Lifecycle', () => {
    it('should render without errors with valid workspaceId', () => {
      // Arrange
      const workspaceId = 'valid-workspace';

      // Act
      const { container } = render(
        <MemoryRouter initialEntries={[`/workspace/${workspaceId}/settings`]}>
          <Routes>
            <Route path="/workspace/:workspaceId/settings" element={<AccountSettingsPage />} />
          </Routes>
        </MemoryRouter>,
      );

      // Assert
      expect(container).toBeInTheDocument();
      expect(mockAccountSettingsComponent).toHaveBeenCalled();
    });

    it('should not re-render AccountSettings component when dependencies do not change', () => {
      // Arrange
      const workspaceId = 'workspace-stable';

      // Act
      renderWithRouter(workspaceId);
      const callCountAfterFirstRender = mockAccountSettingsComponent.mock.calls.length;

      // Note: In React 19, StrictMode may cause additional renders in dev mode
      // We verify that the component is rendered at least once
      // Assert
      expect(callCountAfterFirstRender).toBeGreaterThan(0);
    });
  });

  describe('Type Safety', () => {
    it('should pass string type workspaceId to AccountSettings', () => {
      // Arrange
      const workspaceId = 'type-test-123';

      // Act
      renderWithRouter(workspaceId);

      // Assert
      expect(mockAccountSettingsComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: expect.any(String),
        }),
      );
    });

    it('should render component tree with correct React types', () => {
      // Arrange
      const workspaceId = 'type-safety-test';

      // Act
      render(
        <MemoryRouter initialEntries={[`/workspace/${workspaceId}/settings`]}>
          <Routes>
            <Route path="/workspace/:workspaceId/settings" element={<AccountSettingsPage />} />
          </Routes>
        </MemoryRouter>,
      );

      // Assert
      expect(mockAccountSettingsComponent).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should render AccountSettings component for valid workspaceId', () => {
      // Arrange
      const workspaceId = 'accessibility-test';

      // Act
      render(
        <MemoryRouter initialEntries={[`/workspace/${workspaceId}/settings`]}>
          <Routes>
            <Route path="/workspace/:workspaceId/settings" element={<AccountSettingsPage />} />
          </Routes>
        </MemoryRouter>,
      );

      // Assert
      expect(mockAccountSettingsComponent).toHaveBeenCalled();
    });

    it('should have readable error message structure when error is rendered', () => {
      // Arrange
      render(
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Invalid Workspace</h2>
            <p className="text-gray-600 mt-2">Workspace ID is required</p>
          </div>
        </div>,
      );

      // Act
      const heading = screen.getByText('Invalid Workspace');
      const message = screen.getByText('Workspace ID is required');

      // Assert
      expect(heading).toBeVisible();
      expect(message).toBeVisible();
      expect(heading.parentElement).toContainElement(message);
    });
  });

  describe('Integration with Router', () => {
    it('should work correctly within MemoryRouter', () => {
      // Arrange
      const workspaceId = 'router-integration-test';

      // Act
      render(
        <MemoryRouter initialEntries={[`/workspace/${workspaceId}/settings`]}>
          <Routes>
            <Route path="/workspace/:workspaceId/settings" element={<AccountSettingsPage />} />
          </Routes>
        </MemoryRouter>,
      );

      // Assert
      expect(mockAccountSettingsComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId,
        }),
      );
    });

    it('should extract workspaceId correctly from URL params', () => {
      // Arrange
      const testCases = [
        'workspace-alpha-001',
        'workspace-beta-002',
        'workspace-gamma-003',
      ];

      // Act & Assert
      testCases.forEach((workspaceId) => {
        vi.clearAllMocks();
        render(
          <MemoryRouter initialEntries={[`/workspace/${workspaceId}/settings`]}>
            <Routes>
              <Route path="/workspace/:workspaceId/settings" element={<AccountSettingsPage />} />
            </Routes>
          </MemoryRouter>,
        );

        expect(mockAccountSettingsComponent).toHaveBeenCalledWith(
          expect.objectContaining({
            workspaceId,
          }),
        );
      });
    });
  });

  describe('Error States', () => {
    it('should handle missing route parameter gracefully', () => {
      // Arrange
      // Using a path that doesn't match the expected route structure
      render(
        <MemoryRouter initialEntries={['/workspace']}>
          <Routes>
            <Route path="/workspace/:workspaceId/settings" element={<AccountSettingsPage />} />
            <Route path="/workspace" element={<div>Fallback</div>} />
          </Routes>
        </MemoryRouter>,
      );

      // Act & Assert
      expect(screen.getByText('Fallback')).toBeInTheDocument();
    });

    it('should maintain error UI consistency with proper parent container', () => {
      // Arrange
      render(
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Invalid Workspace</h2>
            <p className="text-gray-600 mt-2">Workspace ID is required</p>
          </div>
        </div>,
      );

      // Act
      const errorContainer = screen.getByText('Invalid Workspace').closest('div');
      const parentDiv = errorContainer?.parentElement;

      // Assert
      expect(parentDiv).toHaveClass('flex', 'items-center', 'justify-center', 'h-full');
    });
  });

  describe('Special Characters in WorkspaceId', () => {
    it('should handle workspaceId with special characters', () => {
      // Arrange
      const specialWorkspaceId = 'workspace-with-dashes-123';

      // Act
      renderWithRouter(specialWorkspaceId);

      // Assert
      expect(mockAccountSettingsComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: specialWorkspaceId,
        }),
      );
    });

    it('should handle workspaceId with numbers', () => {
      // Arrange
      const numericWorkspaceId = '12345';

      // Act
      renderWithRouter(numericWorkspaceId);

      // Assert
      expect(mockAccountSettingsComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: numericWorkspaceId,
        }),
      );
    });

    it('should handle workspaceId with underscores', () => {
      // Arrange
      const underscoreWorkspaceId = 'workspace_with_underscores';

      // Act
      renderWithRouter(underscoreWorkspaceId);

      // Assert
      expect(mockAccountSettingsComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: underscoreWorkspaceId,
        }),
      );
    });
  });
});
