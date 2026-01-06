import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const navigationStoreState = {
  selectedBaseId: 'b1',
  selectedWorkspaceId: 'w1',
};

vi.mock('../../../stores/navigationStore', () => ({
  useNavigationStore: () => navigationStoreState,
}));

const baseMembersQueryState: { data: any; refetch: any } = {
  data: [],
  refetch: vi.fn(),
};

const useBaseMembersMock = vi.fn(() => baseMembersQueryState);
vi.mock('../../../hooks/useApi', () => ({
  useBaseMembers: (...args: any[]) => useBaseMembersMock(...args),
}));

const workspaceAccessState = {
  canAssignUsers: () => true,
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
    HEADER_MEMBERS: 'HEADER_MEMBERS',
  },
  useComponentVisibility: () => routeVisibilityState.visible,
}));

vi.mock('../UserAvatarStack', () => ({
  UserAvatarStack: ({ users }: any) => (
    <div data-testid="user-avatar-stack">users:{users?.length ?? 0}</div>
  ),
}));

vi.mock('../../modals/AssignUserToWorkspaceModal', () => ({
  AssignUserToWorkspaceModal: ({ isOpen, onSuccess }: any) =>
    isOpen ? (
      <div>
        <div>AssignUserToWorkspaceModal</div>
        <button onClick={onSuccess}>mock-success</button>
      </div>
    ) : null,
}));

import HeaderMembers from '../HeaderMembers';

describe('HeaderMembers', () => {
  beforeEach(() => {
    navigationStoreState.selectedBaseId = 'b1';
    navigationStoreState.selectedWorkspaceId = 'w1';

    baseMembersQueryState.data = [];
    baseMembersQueryState.refetch = vi.fn();
    useBaseMembersMock.mockClear();

    workspaceAccessState.canAssignUsers = () => true;
    workspaceAccessState.isWorkspaceReadOnly = () => false;
    baseAccessState.isBaseReadOnly = () => false;
    routeVisibilityState.visible = true;
  });

  it('returns null when route is not visible', () => {
    routeVisibilityState.visible = false;
    const { container } = render(<HeaderMembers />);
    expect(container).toBeEmptyDOMElement();
  });

  it('returns null when no base is selected', () => {
    navigationStoreState.selectedBaseId = '' as any;
    const { container } = render(<HeaderMembers />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a Read only tag when workspace or base is read-only', () => {
    workspaceAccessState.isWorkspaceReadOnly = () => true;

    render(<HeaderMembers />);
    expect(screen.getByText('Read only')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('opens the assign modal and refetches on success', async () => {
    const user = userEvent.setup();

    baseMembersQueryState.data = {
      data: [
        { user_id: 'u1', display_name: 'Ada' },
        { user: { id: 'u2', name: 'Grace' } },
      ],
    };

    render(<HeaderMembers />);

    expect(screen.getByTestId('user-avatar-stack')).toHaveTextContent('users:2');

    const addButton = screen.getByRole('button');
    await user.click(addButton);

    expect(screen.getByText('AssignUserToWorkspaceModal')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'mock-success' }));
    expect(baseMembersQueryState.refetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('AssignUserToWorkspaceModal')).toBeNull();
  });
});
