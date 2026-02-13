import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const navigationStoreState = {
  setWorkspace: vi.fn(),
  selectedBaseId: 'b1',
};

vi.mock('../../../stores/navigationStore', () => ({
  useNavigationStore: () => navigationStoreState,
}));

const navigationState = {
  navigateToWorkspace: vi.fn(),
};

vi.mock('../../../hooks/useNavigation', () => ({
  useNavigation: () => navigationState,
}));

const workspaceBusinessLogicState: any = {
  workspaces: [],
  selectedWorkspace: null,
  selectedWorkspaceId: null,
  setSelectedWorkspace: vi.fn(),
  showCreateWorkspace: false,
  setShowCreateWorkspace: vi.fn(),
  newWorkspaceName: '',
  setNewWorkspaceName: vi.fn(),
  newWorkspaceDescription: '',
  setNewWorkspaceDescription: vi.fn(),
  workspaceError: null,
  handleFormSubmit: vi.fn(),
};

vi.mock('../../../hooks/workspace/useWorkspaceBusinessLogic', () => ({
  useWorkspaceBusinessLogic: () => workspaceBusinessLogicState,
}));

const workspaceAccessState = {
  canCreateWorkspace: () => true,
  isWorkspaceReadOnly: () => false,
};

vi.mock('../../../hooks/useWorkspaceAccess', () => ({
  useWorkspaceAccess: () => workspaceAccessState,
}));

const baseAccessState = {
  isBaseReadOnly: () => false,
};

vi.mock('../../../hooks/useBaseAccess', () => ({
  useBaseAccess: () => baseAccessState,
}));

const routeVisibilityState = {
  visible: true,
};

vi.mock('../../../contexts/RouteContext', () => ({
  COMPONENT_IDS: {
    WORKSPACE_DROPDOWN: 'WORKSPACE_DROPDOWN',
  },
  useComponentVisibility: () => routeVisibilityState.visible,
}));

vi.mock('../../modals/CreateWorkspaceModal', () => ({
  CreateWorkspaceModal: ({ isOpen }: any) => (isOpen ? <div>CreateWorkspaceModal</div> : null),
}));

import HeaderWorkspaceDropdown from '../HeaderWorkspaceDropdown';

function renderWithPath(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <HeaderWorkspaceDropdown />
    </MemoryRouter>
  );
}

describe('HeaderWorkspaceDropdown', () => {
  beforeEach(() => {
    navigationStoreState.setWorkspace = vi.fn();
    navigationStoreState.selectedBaseId = 'b1';
    navigationState.navigateToWorkspace = vi.fn();

    workspaceBusinessLogicState.workspaces = [
      { id: 'w1', title: 'Alpha Workspace', access_level: 'owner' },
      { id: 'w2', title: 'Beta Workspace', access_level: 'maintainer' },
    ];
    workspaceBusinessLogicState.selectedWorkspaceId = 'w1';
    workspaceBusinessLogicState.selectedWorkspace = workspaceBusinessLogicState.workspaces[0];
    workspaceBusinessLogicState.setSelectedWorkspace = vi.fn();
    workspaceBusinessLogicState.showCreateWorkspace = false;

    workspaceAccessState.canCreateWorkspace = () => true;
    workspaceAccessState.isWorkspaceReadOnly = () => false;
    baseAccessState.isBaseReadOnly = () => false;
    routeVisibilityState.visible = true;
  });

  it('returns null when route is not visible', () => {
    routeVisibilityState.visible = false;
    const { container } = renderWithPath('/homepage');
    expect(container).toBeEmptyDOMElement();
  });

  it('toggles the dropdown open/closed', async () => {
    const user = userEvent.setup();
    const { container } = renderWithPath('/homepage');

    const dropdown = container.querySelector('[data-workspace-dropdown]');
    expect(dropdown).not.toBeNull();
    expect(dropdown).toHaveClass('pointer-events-none');

    const triggerButtons = screen.getAllByRole('button', { name: /alpha workspace/i });
    await user.click(triggerButtons[0]);
    expect(dropdown).not.toHaveClass('pointer-events-none');

    const triggerButtonsAfterOpen = screen.getAllByRole('button', { name: /alpha workspace/i });
    await user.click(triggerButtonsAfterOpen[0]);
    expect(dropdown).toHaveClass('pointer-events-none');
  });

  it('selects a workspace on the homepage without navigating', async () => {
    const user = userEvent.setup();
    renderWithPath('/homepage');

    const workspaceSelectedListener = vi.fn();
    globalThis.addEventListener('workspace-selected', workspaceSelectedListener);

    const triggerButtons = screen.getAllByRole('button', { name: /alpha workspace/i });
    await user.click(triggerButtons[0]);
    await user.click(screen.getByText('Beta Workspace'));

    expect(workspaceBusinessLogicState.setSelectedWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'w2' })
    );
    expect(navigationStoreState.setWorkspace).not.toHaveBeenCalled();
    expect(navigationState.navigateToWorkspace).toHaveBeenCalledWith('w2');

    expect(workspaceSelectedListener).toHaveBeenCalledTimes(1);
    globalThis.removeEventListener('workspace-selected', workspaceSelectedListener);
  });

  it('navigates to the workspace when not on the homepage', async () => {
    const user = userEvent.setup();
    renderWithPath('/workspace/w1/database');

    const triggerButtons = screen.getAllByRole('button', { name: /alpha workspace/i });
    await user.click(triggerButtons[0]);
    await user.click(screen.getByText('Beta Workspace'));

    expect(navigationState.navigateToWorkspace).toHaveBeenCalledWith('w2');
  });

  it('shows a Read only tag when workspace or base is read-only', () => {
    baseAccessState.isBaseReadOnly = () => true;
    renderWithPath('/homepage');

    expect(screen.getByText('Read only')).toBeInTheDocument();
  });
});

