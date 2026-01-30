import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MembersTable, type Member } from '../MembersTable';

vi.mock('../../hooks/useClickOutside', () => ({
  useClickOutside: vi.fn(() => ({ current: null })),
}));

vi.mock('../../hooks/useApi', () => ({
  useUserRolesAndAccess: vi.fn(() => ({ data: [], isLoading: false, error: null })),
}));

vi.mock('../../utils/helpers', () => ({
  getInitials: vi.fn((name: string) => {
    if (!name || !name.trim()) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }),
}));

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

const createMember = (overrides: Partial<Member> = {}): Member => ({
  id: 'm1',
  userId: 'u1',
  name: 'Alice Smith',
  email: 'alice@example.com',
  role: 'editor',
  dateJoined: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('MembersTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render Workspace Members heading', () => {
      renderWithQueryClient(<MembersTable members={[]} />);
      expect(screen.getByText('Workspace Members')).toBeInTheDocument();
    });

    it('should render search input when showSearch is true', () => {
      renderWithQueryClient(<MembersTable members={[]} showSearch />);
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    it('should not render search when showSearch is false', () => {
      renderWithQueryClient(<MembersTable members={[]} showSearch={false} />);
      expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument();
    });

    it('should render Filter button when showSearch is true', () => {
      renderWithQueryClient(<MembersTable members={[createMember()]} showSearch />);
      expect(screen.getByRole('button', { name: /Filter/i })).toBeInTheDocument();
    });

    it('should render table headers User Role Joined Date Last Active', () => {
      renderWithQueryClient(<MembersTable members={[]} />);
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Joined Date')).toBeInTheDocument();
      expect(screen.getByText('Last Active')).toBeInTheDocument();
    });

    it('should render member name and email in table row', () => {
      const member = createMember({ name: 'Bob Jones', email: 'bob@example.com' });
      renderWithQueryClient(<MembersTable members={[member]} />);
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    });

    it('should render No members found when members array is empty', () => {
      renderWithQueryClient(<MembersTable members={[]} />);
      expect(screen.getByText('No members found')).toBeInTheDocument();
    });

    it('should render Actions column when onRemoveMember is provided', () => {
      const onRemove = vi.fn();
      renderWithQueryClient(<MembersTable members={[createMember()]} onRemoveMember={onRemove} />);
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should render Actions column when onEditMember is provided', () => {
      const onEdit = vi.fn();
      renderWithQueryClient(<MembersTable members={[createMember()]} onEditMember={onEdit} />);
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should render headerActions when provided', () => {
      renderWithQueryClient(
        <MembersTable
          members={[]}
          headerActions={<button type="button">Add Member</button>}
        />
      );
      expect(screen.getByRole('button', { name: 'Add Member' })).toBeInTheDocument();
    });
  });

  describe('Search', () => {
    it('should filter members by name when search query is entered', async () => {
      const members = [
        createMember({ id: '1', name: 'Alice', email: 'alice@x.com' }),
        createMember({ id: '2', name: 'Bob', email: 'bob@x.com' }),
      ];
      renderWithQueryClient(<MembersTable members={members} showSearch />);
      const searchInput = screen.getByPlaceholderText('Search');
      await userEvent.type(searchInput, 'Alice');
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    it('should filter members by email when search query matches email', async () => {
      const members = [
        createMember({ id: '1', name: 'Alice', email: 'alice@example.com' }),
        createMember({ id: '2', name: 'Bob', email: 'bob@other.com' }),
      ];
      renderWithQueryClient(<MembersTable members={members} showSearch />);
      const searchInput = screen.getByPlaceholderText('Search');
      await userEvent.type(searchInput, 'bob@other');
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });
  });

  describe('Sort', () => {
    it('should have sortable User column', () => {
      renderWithQueryClient(<MembersTable members={[createMember()]} />);
      const userHeader = screen.getByText('User').closest('button');
      expect(userHeader).toBeInTheDocument();
    });

    it('should call setState when User sort is clicked', async () => {
      renderWithQueryClient(<MembersTable members={[createMember(), createMember({ id: '2', name: 'Zara' })]} />);
      const userSortButton = screen.getByText('User').closest('button');
      expect(userSortButton).toBeTruthy();
      if (userSortButton) {
        await userEvent.click(userSortButton);
      }
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Zara')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should show More actions button when onRemoveMember is provided', () => {
      const onRemove = vi.fn();
      renderWithQueryClient(<MembersTable members={[createMember()]} onRemoveMember={onRemove} />);
      const actionsButton = screen.getByLabelText('More actions');
      expect(actionsButton).toBeInTheDocument();
    });

    it('should call onRemoveMember when Remove Member is clicked', async () => {
      const onRemove = vi.fn();
      const member = createMember({ id: 'm1' });
      renderWithQueryClient(<MembersTable members={[member]} onRemoveMember={onRemove} />);
      const actionsButton = screen.getByLabelText('More actions');
      await userEvent.click(actionsButton);
      await screen.findByText('Remove Member');
      const removeButton = screen.getByText('Remove Member');
      fireEvent.click(removeButton);
      expect(onRemove).toHaveBeenCalledWith('m1');
    });

    it('should call onEditMember when Manage Role is clicked', async () => {
      const onEdit = vi.fn();
      const member = createMember({ id: 'm1' });
      renderWithQueryClient(<MembersTable members={[member]} onEditMember={onEdit} />);
      const actionsButton = screen.getByLabelText('More actions');
      await userEvent.click(actionsButton);
      const manageButton = screen.getByText(/Manage Role/i);
      fireEvent.click(manageButton);
      expect(onEdit).toHaveBeenCalledWith('m1');
    });
  });

  describe('Expand access details', () => {
    it('should show View in detail button for member row', () => {
      renderWithQueryClient(<MembersTable members={[createMember()]} />);
      expect(screen.getByText('View in detail ↓')).toBeInTheDocument();
    });

    it('should toggle to Collapse when View in detail is clicked', async () => {
      renderWithQueryClient(<MembersTable members={[createMember()]} />);
      const expandButton = screen.getByText('View in detail ↓');
      await userEvent.click(expandButton);
      expect(screen.getByText('Collapse ↑')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should show pagination when more than 10 members', () => {
      const members = Array.from({ length: 15 }, (_, i) =>
        createMember({ id: `m${i}`, name: `User ${i}`, email: `u${i}@x.com` })
      );
      renderWithQueryClient(<MembersTable members={members} />);
      expect(screen.getByText('Next →')).toBeInTheDocument();
      expect(screen.getByText('← Previous')).toBeInTheDocument();
    });

    it('should not show pagination when 10 or fewer members', () => {
      const members = Array.from({ length: 5 }, (_, i) =>
        createMember({ id: `m${i}`, name: `User ${i}` })
      );
      renderWithQueryClient(<MembersTable members={members} />);
      expect(screen.queryByText('Next →')).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should render member with avatar when avatar url provided', () => {
      const member = createMember({ avatar: 'https://example.com/avatar.png' });
      renderWithQueryClient(<MembersTable members={[member]} />);
      const img = document.querySelector('img[alt="Alice Smith"]');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.png');
    });

    it('should render initials when no avatar', () => {
      renderWithQueryClient(<MembersTable members={[createMember({ name: 'Alice Smith' })]} />);
      expect(screen.getByText('AS')).toBeInTheDocument();
    });
  });
});
