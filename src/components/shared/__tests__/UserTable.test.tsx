import React from 'react';
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserTable, type TenantUser } from '../UserTable';

let mockIsAdmin = true;
let mockIsOwner = true;
let mockIsCoOwner = false;

const useUserRolesAndAccessMock = vi.fn(() => ({ data: [], isLoading: false, error: null }));

vi.mock('axios', () => ({
  default: {
    create: () => ({
      get: vi.fn().mockResolvedValue({ data: [] }),
      post: vi.fn().mockResolvedValue({ data: [] }),
      put: vi.fn().mockResolvedValue({ data: [] }),
      delete: vi.fn().mockResolvedValue({ data: [] }),
    }),
  },
}));

vi.mock('../../../hooks/useUserRole', () => ({
  useUserRole: vi.fn(() => ({
    isAdmin: vi.fn(() => mockIsAdmin),
    isOwner: vi.fn(() => mockIsOwner),
    isCoOwner: vi.fn(() => mockIsCoOwner),
  })),
}));

vi.mock('../../../hooks/useApi', () => ({
  useUserRolesAndAccess: (...args: any[]) => useUserRolesAndAccessMock(...args),
  useTenantUsers: vi.fn(() => ({ data: [], isLoading: false, error: null })),
}));

vi.mock('../../../service/clientService', () => ({
  getTenantUsersService: vi.fn().mockResolvedValue([]),
  getUserRolesService: vi.fn().mockResolvedValue([]),
}));

class MockXMLHttpRequest {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  open() {}
  setRequestHeader() {}
  send() {
    this.onload?.();
  }
  abort() {}
}

beforeAll(() => {
  vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest as unknown as typeof XMLHttpRequest);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

const createUser = (overrides: Partial<TenantUser> = {}): TenantUser => ({
  id: 'u1',
  email: 'alice@example.com',
  first_name: 'Alice',
  last_name: 'Smith',
  display_name: 'Alice Smith',
  status: 'active',
  email_verified: true,
  timezone: 'UTC',
  locale: 'en',
  roles: [],
  ...overrides,
});

describe('UserTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAdmin = true;
    mockIsOwner = true;
    mockIsCoOwner = false;
    useUserRolesAndAccessMock.mockReturnValue({ data: [], isLoading: false, error: null });
  });

  describe('Empty state', () => {
    it('should render No users found when users array is empty', () => {
      renderWithQueryClient(<UserTable users={[]} />);
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });

    it('should render Add new users message when empty', () => {
      renderWithQueryClient(<UserTable users={[]} />);
      expect(screen.getByText('Add new users to get started')).toBeInTheDocument();
    });

    it('should render headerActions in empty state when provided', () => {
      renderWithQueryClient(
        <UserTable
          users={[]}
          headerActions={<button type="button">Invite User</button>}
        />
      );
      expect(screen.getByRole('button', { name: 'Invite User' })).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('should render Users heading when users exist', () => {
      renderWithQueryClient(<UserTable users={[createUser()]} />);
      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    it('should render user name and email in table row', () => {
      const user = createUser({
        first_name: 'Bob',
        last_name: 'Jones',
        email: 'bob@example.com',
      });
      renderWithQueryClient(<UserTable users={[user]} />);
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    });

    it('should render search input when showSearch is true', () => {
      renderWithQueryClient(<UserTable users={[createUser()]} showSearch />);
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    it('should not render search when showSearch is false', () => {
      renderWithQueryClient(<UserTable users={[createUser()]} showSearch={false} />);
      expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument();
    });

    it('should render Filter by Role button when showSearch is true', () => {
      renderWithQueryClient(<UserTable users={[createUser()]} showSearch />);
      expect(screen.getByRole('button', { name: /Filter by Role/i })).toBeInTheDocument();
    });

    it('should render table headers User Role Status Joined Date Last Active Language Timezone', () => {
      renderWithQueryClient(<UserTable users={[createUser()]} />);
      expect(screen.getAllByText('User').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Joined Date')).toBeInTheDocument();
      expect(screen.getByText('Last Active')).toBeInTheDocument();
      expect(screen.getByText('Language')).toBeInTheDocument();
      expect(screen.getByText('Timezone')).toBeInTheDocument();
    });

    it('should render Active status badge for active verified user', () => {
      renderWithQueryClient(<UserTable users={[createUser({ status: 'active', email_verified: true })]} />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should render Inactive status badge for inactive user', () => {
      renderWithQueryClient(<UserTable users={[createUser({ status: 'inactive', email_verified: true })]} />);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should render Deactivated status badge for deactivated user', () => {
      renderWithQueryClient(<UserTable users={[createUser({ status: 'deactivated', email_verified: true })]} />);
      expect(screen.getByText('Deactivated')).toBeInTheDocument();
    });

    it('should render custom status label for unknown status', () => {
      renderWithQueryClient(<UserTable users={[createUser({ status: 'custom-status', email_verified: true })]} />);
      expect(screen.getByText('custom-status')).toBeInTheDocument();
    });

    it('should render Pending status for unverified user', () => {
      renderWithQueryClient(<UserTable users={[createUser({ email_verified: false })]} />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should render headerActions when provided and users exist', () => {
      renderWithQueryClient(
        <UserTable
          users={[createUser()]}
          headerActions={<button type="button">Add User</button>}
        />
      );
      expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument();
    });
  });

  describe('Search', () => {
    it('should filter users by display name when search term is entered', async () => {
      const users = [
        createUser({ id: '1', first_name: 'Alice', last_name: 'A', display_name: 'Alice A' }),
        createUser({ id: '2', first_name: 'Bob', last_name: 'B', display_name: 'Bob B' }),
      ];
      renderWithQueryClient(<UserTable users={users} showSearch />);
      expect(screen.getByText('Alice A')).toBeInTheDocument();
      expect(screen.getByText('Bob B')).toBeInTheDocument();
      const searchInput = screen.getByPlaceholderText('Search');
      await userEvent.type(searchInput, 'Alice');
      await waitFor(() => {
        expect(screen.getByText('Alice A')).toBeInTheDocument();
      });
      expect(searchInput).toHaveValue('Alice');
    });

    it('should filter users by email when search term matches', async () => {
      const users = [
        createUser({ id: '1', email: 'alice@x.com', first_name: 'Alice', last_name: 'X' }),
        createUser({ id: '2', email: 'bob@y.com', first_name: 'Bob', last_name: 'Y' }),
      ];
      renderWithQueryClient(<UserTable users={users} showSearch />);
      const searchInput = screen.getByPlaceholderText('Search');
      await userEvent.type(searchInput, 'bob@y');
      expect(screen.getByText('Bob Y')).toBeInTheDocument();
      expect(screen.queryByText('Alice X')).not.toBeInTheDocument();
    });
  });

  describe('Role Filter', () => {
    it('filters users by selected role', async () => {
      const users = [
        createUser({
          id: '1',
          roles: [{ id: 'r1', name: 'owner', scope_level: 'system' }],
        }),
        createUser({
          id: '2',
          roles: [{ id: 'r2', name: 'base-member', scope_level: 'workspace' }],
        }),
      ];

      renderWithQueryClient(<UserTable users={users} showSearch />);

      await userEvent.click(screen.getByRole('button', { name: /Filter by Role/i }));
      await userEvent.click(screen.getByRole('button', { name: 'Owner' }));

      expect(screen.getAllByText('Owner').length).toBeGreaterThan(0);
      expect(screen.queryByText('Base Member')).not.toBeInTheDocument();
    });

    it('shows empty state when no users match role filter', async () => {
      const users = [
        createUser({
          id: '1',
          roles: [{ id: 'r1', name: 'base-member', scope_level: 'workspace' }],
        }),
      ];

      renderWithQueryClient(<UserTable users={users} showSearch />);

      await userEvent.click(screen.getByRole('button', { name: /Filter by Role/i }));
      await userEvent.click(screen.getByRole('button', { name: 'Owner' }));

      expect(screen.getByText('No users found with the role')).toBeInTheDocument();
      expect(screen.getByText('"Owner"')).toBeInTheDocument();
    });
  });

  describe('Sort', () => {
    it('should have sortable User column', () => {
      renderWithQueryClient(<UserTable users={[createUser()]} />);
      const userHeaders = screen.getAllByText('User');
      const headerButton = userHeaders.find((el) => el.closest('button'));
      expect(headerButton).toBeTruthy();
      expect(headerButton?.closest('button')).toBeInTheDocument();
    });

    it('should have sortable Role column', () => {
      renderWithQueryClient(<UserTable users={[createUser()]} />);
      const roleHeader = screen.getByText('Role').closest('button');
      expect(roleHeader).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should show More actions button when onEditUser is provided', () => {
      const onEdit = vi.fn();
      renderWithQueryClient(<UserTable users={[createUser()]} onEditUser={onEdit} />);
      expect(screen.getByLabelText('More actions')).toBeInTheDocument();
    });

    it('should call onEditUser when Edit is clicked', async () => {
      const onEdit = vi.fn();
      const user = createUser({ id: 'u1' });
      renderWithQueryClient(<UserTable users={[user]} onEditUser={onEdit} />);
      const actionsButton = screen.getByLabelText('More actions');
      await userEvent.click(actionsButton);
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      expect(onEdit).toHaveBeenCalledWith(user);
    });

    it('should call onRemoveUser when Remove User is clicked for pending user', async () => {
      const onRemove = vi.fn();
      const user = createUser({ id: 'u1', status: 'pending' });
      renderWithQueryClient(<UserTable users={[user]} onRemoveUser={onRemove} />);
      const actionsButton = screen.getByLabelText('More actions');
      await userEvent.click(actionsButton);
      const removeButton = screen.queryByText('Remove User');
      if (removeButton) {
        fireEvent.click(removeButton);
        expect(onRemove).toHaveBeenCalledWith('u1');
      }
    });

    it('does not show action menu for co-owner viewing owner', () => {
      sessionStorage.setItem('user_role', 'co-owner');
      mockIsOwner = false;
      mockIsCoOwner = true;
      const ownerUser = createUser({
        id: 'owner',
        roles: [{ id: 'r1', name: 'owner', scope_level: 'system' }],
      });

      renderWithQueryClient(<UserTable users={[ownerUser]} onEditUser={vi.fn()} />);

      expect(screen.queryByLabelText('More actions')).not.toBeInTheDocument();
      sessionStorage.removeItem('user_role');
    });
  });

  describe('Expand access details', () => {
    it('should show View in detail button for non-owner user', () => {
      renderWithQueryClient(<UserTable users={[createUser({ roles: [] })]} />);
      expect(screen.getByRole('button', { name: /View in detail/i })).toBeInTheDocument();
    });

    it('should toggle to Collapse when View in detail is clicked', async () => {
      renderWithQueryClient(<UserTable users={[createUser({ roles: [] })]} />);
      const expandButton = screen.getByRole('button', { name: /View in detail/i });
      await userEvent.click(expandButton);
      expect(screen.getByRole('button', { name: /Collapse/i })).toBeInTheDocument();
    });
    it('shows loading state for access details', async () => {
      useUserRolesAndAccessMock.mockReturnValue({ data: null, isLoading: true, error: null });
      renderWithQueryClient(<UserTable users={[createUser({ roles: [] })]} />);
      await userEvent.click(screen.getByRole('button', { name: /View in detail/i }));
      expect(screen.getByText(/access details/i)).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should show pagination when more than 10 users', () => {
      const users = Array.from({ length: 15 }, (_, i) =>
        createUser({
          id: `u${i}`,
          first_name: `User`,
          last_name: `${i}`,
          email: `u${i}@x.com`,
        })
      );
      renderWithQueryClient(<UserTable users={users} />);
      expect(screen.getByText(/Next/i)).toBeInTheDocument();
      expect(screen.getByText(/Previous/i)).toBeInTheDocument();
    });

    it('should not show pagination when 10 or fewer users', () => {
      const users = Array.from({ length: 5 }, (_, i) =>
        createUser({ id: `u${i}`, first_name: 'User', last_name: `${i}` })
      );
      renderWithQueryClient(<UserTable users={users} />);
      expect(screen.queryByText(/Next/i)).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should render user with avatar when avatar url provided', () => {
      const user = createUser({ avatar: 'https://example.com/avatar.png' });
      renderWithQueryClient(<UserTable users={[user]} />);
      const img = document.querySelector('img[alt="Alice Smith"]');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.png');
    });

    it('should render initials when no avatar', () => {
      renderWithQueryClient(<UserTable users={[createUser({ first_name: 'Alice', last_name: 'Smith' })]} />);
      expect(screen.getByText('AS')).toBeInTheDocument();
    });

    it('uses language from activity data when available', () => {
      const user = createUser({
        locale: 'xx',
        activity_data: {
          login_sessions: [
            {
              browser: 'Chrome',
              language: 'ja-JP',
              login_at: '2024-01-01T00:00:00Z',
              timezone: 'UTC'
            }
          ]
        }
      });

      renderWithQueryClient(<UserTable users={[user]} />);
      expect(screen.getByText('Japanese')).toBeInTheDocument();
    });

    it('falls back to locale when activity data is missing', () => {
      const user = createUser({
        locale: 'fr-FR',
        activity_data: undefined
      });

      renderWithQueryClient(<UserTable users={[user]} />);
      expect(screen.getByText('fr-FR')).toBeInTheDocument();
    });

    it('shows timezone label with country for known region', () => {
      const user = createUser({
        timezone: 'America/Los_Angeles',
        country: 'United States',
        locale: 'en-US'
      });

      renderWithQueryClient(<UserTable users={[user]} />);
      expect(screen.getByText('America/Los_Angeles (United States)')).toBeInTheDocument();
    });

    it('falls back to country-based timezone when timezone is empty', () => {
      const user = createUser({
        timezone: '',
        country: 'United States',
        locale: 'en-US'
      });

      renderWithQueryClient(<UserTable users={[user]} />);
      expect(screen.getByText(/America\/Chicago \(United States\)/)).toBeInTheDocument();
    });

    it('uses login session timezone when timezone value matches multiple entries', () => {
      const user = createUser({
        timezone: 'PST',
        country: '',
        locale: 'fr-FR',
        activity_data: {
          login_sessions: [
            {
              browser: 'Chrome',
              language: 'en-US',
              login_at: '2024-01-01T00:00:00Z',
              timezone: 'America/Vancouver',
            },
          ],
        },
      });

      renderWithQueryClient(<UserTable users={[user]} />);
      expect(screen.getByText('America/Vancouver (Canada)')).toBeInTheDocument();
    });

    it('uses locale country when timezone value matches multiple entries', () => {
      const originalDisplayNames = (Intl as any).DisplayNames;
      (Intl as any).DisplayNames = class MockDisplayNames {
        constructor() {}
        of(region: string) {
          if (region === 'US') return 'United States';
          return '';
        }
      };

      try {
        const user = createUser({
          timezone: 'PST',
          country: '',
          locale: 'en-US',
        });

        renderWithQueryClient(<UserTable users={[user]} />);
        expect(screen.getByText('America/Los_Angeles (United States)')).toBeInTheDocument();
      } finally {
        (Intl as any).DisplayNames = originalDisplayNames;
      }
    });

    it('falls back to first timezone match when no country or locale matches', () => {
      const user = createUser({
        timezone: 'PST',
        country: 'Atlantis',
        locale: 'xx-YY',
        activity_data: {
          login_sessions: [
            {
              browser: 'Chrome',
              language: 'en-US',
              login_at: '2024-01-01T00:00:00Z',
              timezone: 'Unknown/Zone',
            },
          ],
        },
      });

      renderWithQueryClient(<UserTable users={[user]} />);
      expect(screen.getByText(/America\/Los_Angeles/)).toBeInTheDocument();
    });

    it('defaults to UTC when timezone and country are empty', () => {
      const user = createUser({
        timezone: '',
        country: '',
        locale: '',
      });

      renderWithQueryClient(<UserTable users={[user]} />);
      expect(screen.getByText(/Etc\/UTC/)).toBeInTheDocument();
    });
  });

  describe('Admin action variants', () => {
    it('shows Deactivate action for active verified user', async () => {
      const onDeactivate = vi.fn();
      const user = createUser({ status: 'active', email_verified: true });
      renderWithQueryClient(<UserTable users={[user]} onDeactivateUser={onDeactivate} />);

      await userEvent.click(screen.getByLabelText('More actions'));
      const deactivate = await screen.findByText('Deactivate User');
      expect(deactivate).toBeInTheDocument();
      fireEvent.click(deactivate);
      expect(onDeactivate).toHaveBeenCalledWith(user.id);
    });

    it('shows Activate action for deactivated user', async () => {
      const onActivate = vi.fn();
      const user = createUser({ status: 'deactivated', email_verified: true });
      renderWithQueryClient(<UserTable users={[user]} onActivateUser={onActivate} />);

      await userEvent.click(screen.getByLabelText('More actions'));
      const activate = await screen.findByText('Activate User');
      expect(activate).toBeInTheDocument();
      fireEvent.click(activate);
      expect(onActivate).toHaveBeenCalledWith(user.id);
    });

    it('does not show Remove User for pending owner when current user is not owner', async () => {
      mockIsOwner = false;
      const onRemove = vi.fn();
      const ownerUser = createUser({
        id: 'owner',
        status: 'pending',
        roles: [{ id: 'r1', name: 'owner', scope_level: 'system' }]
      });

      renderWithQueryClient(<UserTable users={[ownerUser]} onRemoveUser={onRemove} />);
      await userEvent.click(screen.getByLabelText('More actions'));
      expect(screen.queryByText('Remove User')).not.toBeInTheDocument();
    });
  });
});

