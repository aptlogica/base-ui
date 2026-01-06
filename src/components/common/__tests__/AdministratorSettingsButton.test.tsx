import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const navigationStoreState = {
  selectedWorkspaceId: 'w1',
};

vi.mock('../../../stores/navigationStore', () => ({
  useNavigationStore: () => navigationStoreState,
}));

const userRoleState = {
  isAdmin: () => false,
  isMaintainer: () => false,
};

vi.mock('../../../hooks/useUserRole', () => ({
  useUserRole: () => userRoleState,
}));

const workspaceAccessState: { currentWorkspace?: { access_level?: string } } = {
  currentWorkspace: { access_level: 'maintainer' },
};

vi.mock('../../../hooks/useWorkspaceAccess', () => ({
  useWorkspaceAccess: () => workspaceAccessState,
}));

import { RouteContextProvider } from '../../../contexts/RouteContext';
import AdministratorSettingsButton from '../AdministratorSettingsButton';

function renderWithRoute(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <RouteContextProvider>
        <AdministratorSettingsButton />
      </RouteContextProvider>
    </MemoryRouter>
  );
}

describe('AdministratorSettingsButton', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    navigationStoreState.selectedWorkspaceId = 'w1';
    userRoleState.isAdmin = () => false;
    userRoleState.isMaintainer = () => false;
    workspaceAccessState.currentWorkspace = { access_level: 'maintainer' };
  });

  it('renders when workspace is selected and user has maintainer access', () => {
    renderWithRoute('/homepage');
    expect(screen.getByRole('button', { name: 'Owner Settings' })).toBeInTheDocument();
  });

  it('navigates to /workspace/:id/administrator on click', async () => {
    const user = userEvent.setup();

    renderWithRoute('/homepage');
    await user.click(screen.getByRole('button', { name: 'Owner Settings' }));

    expect(navigateMock).toHaveBeenCalledWith('/workspace/w1/administrator');
  });

  it('does not render when no workspace is selected', () => {
    navigationStoreState.selectedWorkspaceId = '' as any;

    renderWithRoute('/homepage');
    expect(screen.queryByRole('button', { name: 'Owner Settings' })).toBeNull();
  });

  it('does not render when user has no admin/maintainer access and no workspace access_level', () => {
    workspaceAccessState.currentWorkspace = { access_level: 'viewer' };

    renderWithRoute('/homepage');
    expect(screen.queryByRole('button', { name: 'Owner Settings' })).toBeNull();
  });

  it('renders for global admin regardless of workspace access_level', () => {
    workspaceAccessState.currentWorkspace = { access_level: 'viewer' };
    userRoleState.isAdmin = () => true;

    renderWithRoute('/homepage');
    expect(screen.getByRole('button', { name: 'Owner Settings' })).toBeInTheDocument();
  });

  it('uses active styling when on an administrator path', () => {
    renderWithRoute('/workspace/w1/administrator');

    const button = screen.getByRole('button', { name: 'Owner Settings' });
    expect(button).toHaveClass('bg-green-200');
  });
});
