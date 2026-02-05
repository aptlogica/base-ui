import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { hasLastNavigation, getLastNavigation } from '../../utils/navigationPersistence';
import { AppInitializer } from '../AppInitializer';

const mockGetState = vi.hoisted(() => vi.fn());
const mockLoadUserNavigation = vi.hoisted(() => vi.fn());
const mockLoadFromActivityData = vi.hoisted(() => vi.fn());

vi.mock('../../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../stores/navigationStore', () => ({
  useNavigationStore: Object.assign(
    vi.fn(() => ({
      getState: mockGetState,
    })),
    {
      getState: mockGetState,
    }
  ),
}));

vi.mock('../../utils/navigationPersistence', () => ({
  hasLastNavigation: vi.fn(),
  getLastNavigation: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);
const hasLastNavigationMock = vi.mocked(hasLastNavigation);
const getLastNavigationMock = vi.mocked(getLastNavigation);

const USER_ID = 'user-1';
const AUTH_MOCK_BASE = {
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  saving: false,
  restoreCompleted: true,
  userRole: null,
};
const EMPTY_NAV_STATE = {
  workspaceId: null,
  baseId: null,
  tableId: null,
  viewId: null,
};

function defaultGetStateReturn(overrides: Record<string, unknown> = {}) {
  return {
    selectedWorkspaceId: null,
    selectedBaseId: null,
    selectedTableId: null,
    selectedViewId: null,
    loadUserNavigation: mockLoadUserNavigation,
    loadFromActivityData: mockLoadFromActivityData,
    ...overrides,
  };
}

describe('AppInitializer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    useAuthMock.mockReturnValue({
      ...AUTH_MOCK_BASE,
      user: { id: USER_ID },
    });
    mockGetState.mockReturnValue(defaultGetStateReturn());
    hasLastNavigationMock.mockReturnValue(false);
    getLastNavigationMock.mockReturnValue(EMPTY_NAV_STATE);
    mockLoadFromActivityData.mockResolvedValue(false);
  });

  describe('Rendering', () => {
    it('should render children', () => {
      render(
        <AppInitializer>
          <span data-testid="child">Child content</span>
        </AppInitializer>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });
  });

  describe('When auth is loading', () => {
    it('should not run initialize when authLoading is true', async () => {
      useAuthMock.mockReturnValue({
        ...AUTH_MOCK_BASE,
        user: { id: USER_ID },
        loading: true,
      });

      render(
        <AppInitializer>
          <span data-testid="child">Child</span>
        </AppInitializer>
      );

      await waitFor(() => {
        expect(mockGetState).not.toHaveBeenCalled();
      });
    });
  });

  describe('When user is not available', () => {
    it('should not run initialize when user is null', async () => {
      useAuthMock.mockReturnValue({
        ...AUTH_MOCK_BASE,
        user: null,
      });

      render(
        <AppInitializer>
          <span data-testid="child">Child</span>
        </AppInitializer>
      );

      await waitFor(() => {
        expect(mockGetState).not.toHaveBeenCalled();
      });
    });

    it('should not run initialize when user.id is undefined', async () => {
      useAuthMock.mockReturnValue({
        ...AUTH_MOCK_BASE,
        user: {},
      });

      render(
        <AppInitializer>
          <span data-testid="child">Child</span>
        </AppInitializer>
      );

      await waitFor(() => {
        expect(mockGetState).not.toHaveBeenCalled();
      });
    });
  });

  describe('Active navigation preservation', () => {
    it('should not override when store has selectedWorkspaceId', async () => {
      mockGetState.mockReturnValue(defaultGetStateReturn({ selectedWorkspaceId: 'ws-1' }));

      render(
        <AppInitializer>
          <span data-testid="child">Child</span>
        </AppInitializer>
      );

      await waitFor(() => {
        expect(mockGetState).toHaveBeenCalled();
      });

      expect(hasLastNavigationMock).not.toHaveBeenCalled();
      expect(mockLoadFromActivityData).not.toHaveBeenCalled();
      expect(mockLoadUserNavigation).not.toHaveBeenCalled();
    });

    it('should not override when store has selectedBaseId', async () => {
      mockGetState.mockReturnValue(defaultGetStateReturn({ selectedBaseId: 'base-1' }));

      render(
        <AppInitializer>
          <span data-testid="child">Child</span>
        </AppInitializer>
      );

      await waitFor(() => {
        expect(mockGetState).toHaveBeenCalled();
      });

      expect(hasLastNavigationMock).not.toHaveBeenCalled();
      expect(mockLoadFromActivityData).not.toHaveBeenCalled();
    });

    it('should not override when store has selectedTableId', async () => {
      mockGetState.mockReturnValue(defaultGetStateReturn({ selectedTableId: 'table-1' }));

      render(
        <AppInitializer>
          <span data-testid="child">Child</span>
        </AppInitializer>
      );

      await waitFor(() => {
        expect(mockGetState).toHaveBeenCalled();
      });

      expect(hasLastNavigationMock).not.toHaveBeenCalled();
      expect(mockLoadFromActivityData).not.toHaveBeenCalled();
    });

    it('should not override when store has selectedViewId', async () => {
      mockGetState.mockReturnValue(defaultGetStateReturn({ selectedViewId: 'view-1' }));

      render(
        <AppInitializer>
          <span data-testid="child">Child</span>
        </AppInitializer>
      );

      await waitFor(() => {
        expect(mockGetState).toHaveBeenCalled();
      });

      expect(hasLastNavigationMock).not.toHaveBeenCalled();
      expect(mockLoadFromActivityData).not.toHaveBeenCalled();
    });
  });

  describe('Session storage restoration', () => {
    it('should call loadUserNavigation when hasLastNavigation is true and store is empty', async () => {
      hasLastNavigationMock.mockReturnValue(true);
      getLastNavigationMock.mockReturnValue({ ...EMPTY_NAV_STATE, workspaceId: 'ws-1' });
      mockGetState.mockReturnValue(defaultGetStateReturn());

      render(
        <AppInitializer>
          <span data-testid="child">Child</span>
        </AppInitializer>
      );

      await waitFor(() => {
        expect(hasLastNavigationMock).toHaveBeenCalledWith(USER_ID);
        expect(mockLoadUserNavigation).toHaveBeenCalledWith(USER_ID);
      });

      expect(mockLoadFromActivityData).not.toHaveBeenCalled();
    });

    it('should not call loadUserNavigation when store already has selectedWorkspaceId', async () => {
      hasLastNavigationMock.mockReturnValue(true);
      mockGetState.mockReturnValue(defaultGetStateReturn({ selectedWorkspaceId: 'ws-existing' }));

      render(
        <AppInitializer>
          <span data-testid="child">Child</span>
        </AppInitializer>
      );

      await waitFor(() => {
        expect(mockGetState).toHaveBeenCalled();
      });

      expect(mockLoadUserNavigation).not.toHaveBeenCalled();
      expect(mockLoadFromActivityData).not.toHaveBeenCalled();
    });
  });

  describe('Activity data loading', () => {
    it('should call loadFromActivityData when no active nav and no session cache', async () => {
      render(
        <AppInitializer>
          <span data-testid="child">Child</span>
        </AppInitializer>
      );

      await waitFor(() => {
        expect(mockLoadFromActivityData).toHaveBeenCalledWith(USER_ID);
      });
    });

    it('should call loadUserNavigation when loadFromActivityData returns false', async () => {
      mockLoadFromActivityData.mockResolvedValue(false);

      render(
        <AppInitializer>
          <span data-testid="child">Child</span>
        </AppInitializer>
      );

      await waitFor(() => {
        expect(mockLoadFromActivityData).toHaveBeenCalledWith(USER_ID);
        expect(mockLoadUserNavigation).toHaveBeenCalledWith(USER_ID);
      });
    });

    it('should not call loadUserNavigation when loadFromActivityData returns true', async () => {
      mockLoadFromActivityData.mockResolvedValue(true);

      render(
        <AppInitializer>
          <span data-testid="child">Child</span>
        </AppInitializer>
      );

      await waitFor(() => {
        expect(mockLoadFromActivityData).toHaveBeenCalledWith(USER_ID);
      });

      expect(mockLoadUserNavigation).not.toHaveBeenCalled();
    });

    it('should call loadUserNavigation in catch when loadFromActivityData throws', async () => {
      mockLoadFromActivityData.mockRejectedValue(new Error('Network error'));

      render(
        <AppInitializer>
          <span data-testid="child">Child</span>
        </AppInitializer>
      );

      await waitFor(() => {
        expect(mockLoadFromActivityData).toHaveBeenCalledWith(USER_ID);
        expect(mockLoadUserNavigation).toHaveBeenCalledWith(USER_ID);
      });
    });
  });

  describe('Init completion', () => {
    it('should complete init flow when loadFromActivityData returns false', async () => {
      mockLoadFromActivityData.mockResolvedValue(false);

      render(
        <AppInitializer>
          <span data-testid="child">Child</span>
        </AppInitializer>
      );

      await waitFor(() => {
        expect(mockLoadUserNavigation).toHaveBeenCalledWith(USER_ID);
        expect(mockLoadFromActivityData).toHaveBeenCalledWith(USER_ID);
      });
    });
  });

  describe('User change resets initialization', () => {
    it('should run initialize again when user id changes', async () => {
      const { rerender } = render(
        <AppInitializer>
          <span data-testid="child">Child</span>
        </AppInitializer>
      );

      await waitFor(() => {
        expect(mockLoadFromActivityData).toHaveBeenCalledWith(USER_ID);
      });

      vi.clearAllMocks();
      mockLoadFromActivityData.mockResolvedValue(false);

      useAuthMock.mockReturnValue({
        ...AUTH_MOCK_BASE,
        user: { id: 'user-2' },
      });

      rerender(
        <AppInitializer>
          <span data-testid="child">Child</span>
        </AppInitializer>
      );

      await waitFor(() => {
        expect(mockLoadFromActivityData).toHaveBeenCalledWith('user-2');
      });
    });
  });
});
