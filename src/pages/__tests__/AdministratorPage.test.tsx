import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, MemoryRouter } from 'react-router-dom';
import AdministratorPage from '../AdministratorPage';

// Hoist mock functions to top scope for vi.mock() to access them
const {
  mockUseWorkspaceAccess,
} = vi.hoisted(() => ({
  mockUseWorkspaceAccess: vi.fn(),
}));

// Mock the useWorkspaceAccess hook
vi.mock('../../hooks/useWorkspaceAccess', () => ({
  useWorkspaceAccess: mockUseWorkspaceAccess,
}));

// Mock the tab components
vi.mock('../../components/workspace/tabs/SettingsTabs', () => ({
  SettingsTabs: ({ tabs, activeTab, onTabChange }: any) => (
    <div data-testid="settings-tabs">
      {tabs.map((tab: any) => (
        <button
          key={tab.key}
          data-testid={`tab-${tab.key}`}
          data-active={activeTab === tab.key}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../components/workspace/tabs/TenantSettingsTab', () => ({
  TenantSettingsTab: ({ workspaceId }: any) => (
    <div data-testid="tenant-settings-tab">Tenant Settings: {workspaceId}</div>
  ),
}));

vi.mock('../../components/workspace/tabs/UserSettingsTab', () => ({
  UserSettingsTab: ({ workspaceId }: any) => (
    <div data-testid="user-settings-tab">User Settings: {workspaceId}</div>
  ),
}));

vi.mock('../../components/workspace/tabs/WorkspaceTab', () => ({
  WorkspaceTab: ({ workspaceId }: any) => (
    <div data-testid="workspace-tab">Workspace Tab: {workspaceId}</div>
  ),
}));

// Helper function to render component with router and default mocks
const renderAdministratorPage = (
  workspaceId: string = 'test-workspace',
  initialRoute: string = `/workspace/${workspaceId}/admin`,
  mockOverrides?: { canAccessAllSettingsTabs?: boolean; isWorkspaceReadOnly?: boolean }
) => {
  // Set default mock values if not already set
  if (!mockUseWorkspaceAccess.mock.calls.length) {
    mockUseWorkspaceAccess.mockReturnValue({
      canAccessAllSettingsTabs: vi.fn(() => mockOverrides?.canAccessAllSettingsTabs ?? true),
      isWorkspaceReadOnly: vi.fn(() => mockOverrides?.isWorkspaceReadOnly ?? false),
    });
  }

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/workspace/:workspaceId/admin" element={<AdministratorPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe.skip('AdministratorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering and layout', () => {
    it('should render without crashing', () => {
      renderAdministratorPage();
      expect(screen.getByTestId('settings-tabs')).toBeInTheDocument();
    });

    it('should display error message when workspaceId is missing', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      render(
        <MemoryRouter initialEntries={['/workspace/admin']}>
          <Routes>
            <Route path="/workspace/:workspaceId/admin" element={<AdministratorPage />} />
            <Route path="/workspace/admin" element={<AdministratorPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Workspace Not Found')).toBeInTheDocument();
      expect(screen.getByText('Please select a valid workspace.')).toBeInTheDocument();
    });

    it('should have flex layout structure', () => {
      const { container } = renderAdministratorPage();
      const mainDiv = container.querySelector('.flex.flex-col.h-full');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should have scrollable content area', () => {
      const { container } = renderAdministratorPage();
      const contentArea = container.querySelector('.flex-1.overflow-y-auto');
      expect(contentArea).toBeInTheDocument();
    });
  });

  describe('tab filtering based on access levels', () => {
    it('should show all tabs when user has full access (admin)', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      renderAdministratorPage();

      expect(screen.getByTestId('tab-settings')).toBeInTheDocument();
      expect(screen.getByTestId('tab-users')).toBeInTheDocument();
      expect(screen.getByTestId('tab-workspaces')).toBeInTheDocument();
    });

    it('should show only workspaces tab when user has workspace-read access', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => false),
        isWorkspaceReadOnly: vi.fn(() => true),
      });

      render(
        <MemoryRouter initialEntries={['/workspace/test-workspace/admin']}>
          <Routes>
            <Route path="/workspace/:workspaceId/admin" element={<AdministratorPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('tab-settings')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tab-users')).not.toBeInTheDocument();
      expect(screen.getByTestId('tab-workspaces')).toBeInTheDocument();
    });

    it('should show only workspaces tab when user is maintainer/full_access', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => false),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      render(
        <MemoryRouter initialEntries={['/workspace/test-workspace/admin']}>
          <Routes>
            <Route path="/workspace/:workspaceId/admin" element={<AdministratorPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('tab-settings')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tab-users')).not.toBeInTheDocument();
      expect(screen.getByTestId('tab-workspaces')).toBeInTheDocument();
    });
  });

  describe('default tab selection', () => {
    it('should default to settings tab for admin users with no URL param', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      renderAdministratorPage('test-workspace', '/workspace/test-workspace/admin');

      expect(screen.getByTestId('tenant-settings-tab')).toBeInTheDocument();
    });

    it('should default to workspaces tab for non-admin users with no URL param', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => false),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      render(
        <MemoryRouter initialEntries={['/workspace/test-workspace/admin']}>
          <Routes>
            <Route path="/workspace/:workspaceId/admin" element={<AdministratorPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('workspace-tab')).toBeInTheDocument();
    });

    it('should default to workspaces tab for workspace-read users', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => false),
        isWorkspaceReadOnly: vi.fn(() => true),
      });

      render(
        <MemoryRouter initialEntries={['/workspace/test-workspace/admin']}>
          <Routes>
            <Route path="/workspace/:workspaceId/admin" element={<AdministratorPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('workspace-tab')).toBeInTheDocument();
    });
  });

  describe('URL parameter handling', () => {
    it('should respect valid tab parameter from URL', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      renderAdministratorPage('test-workspace', '/workspace/test-workspace/admin?tab=users');

      expect(screen.getByTestId('user-settings-tab')).toBeInTheDocument();
    });

    it('should respect settings tab parameter for admin users', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      renderAdministratorPage('test-workspace', '/workspace/test-workspace/admin?tab=settings');

      expect(screen.getByTestId('tenant-settings-tab')).toBeInTheDocument();
    });

    it('should respect workspaces tab parameter', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      renderAdministratorPage('test-workspace', '/workspace/test-workspace/admin?tab=workspaces');

      expect(screen.getByTestId('workspace-tab')).toBeInTheDocument();
    });

    it('should ignore invalid tab parameter and use default', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      renderAdministratorPage('test-workspace', '/workspace/test-workspace/admin?tab=invalid-tab');

      expect(screen.getByTestId('tenant-settings-tab')).toBeInTheDocument();
    });

    it('should ignore inaccessible tab parameter and use default', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => false),
        isWorkspaceReadOnly: vi.fn(() => true),
      });

      render(
        <MemoryRouter initialEntries={['/workspace/test-workspace/admin?tab=settings']}>
          <Routes>
            <Route path="/workspace/:workspaceId/admin" element={<AdministratorPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should default to workspaces tab since settings is not accessible
      expect(screen.getByTestId('workspace-tab')).toBeInTheDocument();
    });
  });

  describe('tab change handling', () => {
    it('should update URL when tab changes', async () => {
      const user = userEvent.setup();

      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      renderAdministratorPage();

      const usersTab = screen.getByTestId('tab-users');
      await user.click(usersTab);

      await waitFor(() => {
        expect(screen.getByTestId('user-settings-tab')).toBeInTheDocument();
      });
    });

    it('should render correct tab content when clicking settings tab', async () => {
      const user = userEvent.setup();

      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      renderAdministratorPage('test-workspace', '/workspace/test-workspace/admin?tab=workspaces');

      const settingsTab = screen.getByTestId('tab-settings');
      await user.click(settingsTab);

      await waitFor(() => {
        expect(screen.getByTestId('tenant-settings-tab')).toBeInTheDocument();
      });
    });

    it('should render correct tab content when clicking users tab', async () => {
      const user = userEvent.setup();

      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      renderAdministratorPage('test-workspace', '/workspace/test-workspace/admin?tab=workspaces');

      const usersTab = screen.getByTestId('tab-users');
      await user.click(usersTab);

      await waitFor(() => {
        expect(screen.getByTestId('user-settings-tab')).toBeInTheDocument();
      });
    });

    it('should render correct tab content when clicking workspaces tab', async () => {
      const user = userEvent.setup();

      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      renderAdministratorPage('test-workspace', '/workspace/test-workspace/admin?tab=settings');

      const workspacesTab = screen.getByTestId('tab-workspaces');
      await user.click(workspacesTab);

      await waitFor(() => {
        expect(screen.getByTestId('workspace-tab')).toBeInTheDocument();
      });
    });
  });

  describe('access level changes', () => {
    it('should redirect to workspaces tab when access changes from admin to workspace-read', async () => {
      const canAccessAllSettingsTabsMock = vi.fn(() => true);
      const isWorkspaceReadOnlyMock = vi.fn(() => false);

      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: canAccessAllSettingsTabsMock,
        isWorkspaceReadOnly: isWorkspaceReadOnlyMock,
      });

      const { rerender } = render(
        <MemoryRouter initialEntries={['/workspace/test-workspace/admin?tab=settings']}>
          <Routes>
            <Route path="/workspace/:workspaceId/admin" element={<AdministratorPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Verify initial state shows settings tab
      expect(screen.getByTestId('tenant-settings-tab')).toBeInTheDocument();

      // Change mock to simulate access level change
      canAccessAllSettingsTabsMock.mockReturnValue(false);
      isWorkspaceReadOnlyMock.mockReturnValue(true);

      rerender(
        <MemoryRouter initialEntries={['/workspace/test-workspace/admin?tab=settings']}>
          <Routes>
            <Route path="/workspace/:workspaceId/admin" element={<AdministratorPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should redirect to workspaces tab
      await waitFor(() => {
        expect(screen.getByTestId('workspace-tab')).toBeInTheDocument();
      });
    });

    it('should not redirect if current tab remains accessible after access change', async () => {
      const canAccessAllSettingsTabsMock = vi.fn(() => false);
      const isWorkspaceReadOnlyMock = vi.fn(() => false);

      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: canAccessAllSettingsTabsMock,
        isWorkspaceReadOnly: isWorkspaceReadOnlyMock,
      });

      const { rerender } = render(
        <MemoryRouter initialEntries={['/workspace/test-workspace/admin?tab=workspaces']}>
          <Routes>
            <Route path="/workspace/:workspaceId/admin" element={<AdministratorPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Verify initial state
      expect(screen.getByTestId('workspace-tab')).toBeInTheDocument();

      // Rerender with same access level
      rerender(
        <MemoryRouter initialEntries={['/workspace/test-workspace/admin?tab=workspaces']}>
          <Routes>
            <Route path="/workspace/:workspaceId/admin" element={<AdministratorPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should still show workspaces tab
      expect(screen.getByTestId('workspace-tab')).toBeInTheDocument();
    });
  });

  describe('tab content rendering', () => {
    it('should render TenantSettingsTab with correct workspaceId', () => {
      const workspaceId = 'test-workspace-123';

      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      renderAdministratorPage(workspaceId, `/workspace/${workspaceId}/admin?tab=settings`);

      expect(screen.getByTestId('tenant-settings-tab')).toHaveTextContent(`Tenant Settings: ${workspaceId}`);
    });

    it('should render UserSettingsTab with correct workspaceId', () => {
      const workspaceId = 'test-workspace-456';

      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      renderAdministratorPage(workspaceId, `/workspace/${workspaceId}/admin?tab=users`);

      expect(screen.getByTestId('user-settings-tab')).toHaveTextContent(`User Settings: ${workspaceId}`);
    });

    it('should render WorkspaceTab with correct workspaceId', () => {
      const workspaceId = 'test-workspace-789';

      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      renderAdministratorPage(workspaceId, `/workspace/${workspaceId}/admin?tab=workspaces`);

      expect(screen.getByTestId('workspace-tab')).toHaveTextContent(`Workspace Tab: ${workspaceId}`);
    });

    it('should render default content (TenantSettingsTab) for unknown tab keys', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      renderAdministratorPage('test-workspace', '/workspace/test-workspace/admin?tab=unknown');

      expect(screen.getByTestId('tenant-settings-tab')).toBeInTheDocument();
    });
  });

  describe('clean URL handling', () => {
    it('should remove tab param from URL when switching to default tab', async () => {
      const user = userEvent.setup();

      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      render(
        <MemoryRouter initialEntries={['/workspace/test-workspace/admin?tab=users']}>
          <Routes>
            <Route path="/workspace/:workspaceId/admin" element={<AdministratorPage />} />
          </Routes>
        </MemoryRouter>
      );

      const settingsTab = screen.getByTestId('tab-settings');
      await user.click(settingsTab);

      await waitFor(() => {
        expect(screen.getByTestId('tenant-settings-tab')).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle rapidly changing tabs', async () => {
      const user = userEvent.setup();

      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      renderAdministratorPage();

      const usersTab = screen.getByTestId('tab-users');
      const settingsTab = screen.getByTestId('tab-settings');
      const workspacesTab = screen.getByTestId('tab-workspaces');

      await user.click(usersTab);
      await user.click(settingsTab);
      await user.click(workspacesTab);

      await waitFor(() => {
        expect(screen.getByTestId('workspace-tab')).toBeInTheDocument();
      });
    });

    it('should handle special characters in workspaceId', () => {
      const workspaceId = 'test-workspace_123-abc';

      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      render(
        <MemoryRouter initialEntries={[`/workspace/${workspaceId}/admin?tab=workspaces`]}>
          <Routes>
            <Route path="/workspace/:workspaceId/admin" element={<AdministratorPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('workspace-tab')).toHaveTextContent(workspaceId);
    });

    it('should handle multiple query parameters in URL', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      renderAdministratorPage('test-workspace', '/workspace/test-workspace/admin?tab=users&other=param');

      expect(screen.getByTestId('user-settings-tab')).toBeInTheDocument();
    });

    it('should maintain tab selection during re-renders', async () => {
      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      const { rerender } = render(
        <MemoryRouter initialEntries={['/workspace/test-workspace/admin?tab=users']}>
          <Routes>
            <Route path="/workspace/:workspaceId/admin" element={<AdministratorPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('user-settings-tab')).toBeInTheDocument();

      rerender(
        <MemoryRouter initialEntries={['/workspace/test-workspace/admin?tab=users']}>
          <Routes>
            <Route path="/workspace/:workspaceId/admin" element={<AdministratorPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('user-settings-tab')).toBeInTheDocument();
    });
  });

  describe('tab data attributes', () => {
    it('should set correct data-active attribute on active tab', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      renderAdministratorPage('test-workspace', '/workspace/test-workspace/admin?tab=settings');

      const settingsTab = screen.getByTestId('tab-settings');
      expect(settingsTab).toHaveAttribute('data-active', 'true');
    });

    it('should set data-active to false on inactive tabs', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        canAccessAllSettingsTabs: vi.fn(() => true),
        isWorkspaceReadOnly: vi.fn(() => false),
      });

      renderAdministratorPage('test-workspace', '/workspace/test-workspace/admin?tab=settings');

      const usersTab = screen.getByTestId('tab-users');
      expect(usersTab).toHaveAttribute('data-active', 'false');
    });
  });

  describe('styling and CSS classes', () => {
    it('should apply correct flex layout classes to main container', () => {
      const { container } = renderAdministratorPage();
      const mainDiv = container.querySelector('.flex.flex-col.h-full');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should apply correct classes to tabs section', () => {
      const { container } = renderAdministratorPage();
      const tabsSection = container.querySelector('.flex-shrink-0.bg-alpha-white.border-b.px-6');
      expect(tabsSection).toBeInTheDocument();
    });

    it('should apply correct classes to content section', () => {
      const { container } = renderAdministratorPage();
      const contentSection = container.querySelector('.flex-1.overflow-y-auto');
      expect(contentSection).toBeInTheDocument();
    });

    it('should apply padding to content wrapper', () => {
      const { container } = renderAdministratorPage();
      const contentWrapper = container.querySelector('.max-w-full.mx-auto.px-6.py-8.bg-alpha-white');
      expect(contentWrapper).toBeInTheDocument();
    });
  });
});
