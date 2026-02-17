import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddBaseMembersModal } from '../AddBaseMembersModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const bulkAddMock = vi.fn();
const removeMock = vi.fn();
const refetchMock = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

// Mock useApi hooks
vi.mock('../../../hooks/useApi', () => ({
  useBulkAddBaseMembers: vi.fn(() => ({
    mutateAsync: bulkAddMock,
    isPending: false,
  })),
  useGetUsersForAssign: vi.fn(() => ({
    data: [
      { id: 'user-1', display_name: 'John Doe', email: 'john@example.com' },
      { id: 'user-2', display_name: 'Jane Smith', email: 'jane@example.com' },
      { id: 'user-3', display_name: 'Bob Wilson', email: 'bob@example.com' },
    ],
    isLoading: false,
  })),
  useBaseMembers: vi.fn(() => ({
    data: {
      data: [
        { user_id: 'user-1', user: { display_name: 'John Doe', email: 'john@example.com' }, role: 'base-member' },
      ],
    },
    isLoading: false,
    refetch: refetchMock,
  })),
  useRemoveUserFromBase: vi.fn(() => ({
    mutateAsync: removeMock,
    isPending: false,
  })),
}));

// Mock Toast
vi.mock('../../common/Toast', () => ({
  useToast: () => ({
    success: toastSuccess,
    error: toastError,
    info: vi.fn(),
    show: vi.fn(),
  }),
}));

// Mock MultiSelectTags
vi.mock('../../common/MultiSelectTags', () => ({
  MultiSelectTags: ({ options, value, onChange, placeholder }: any) => (
    <div data-testid="multi-select-tags">
      <select
        multiple
        data-testid="user-select"
        value={value}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions, (option) => option.value);
          onChange(selected);
        }}
      >
        {options?.map((opt: any) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      <span>{placeholder}</span>
    </div>
  ),
}));

// Mock RoleDropdown
vi.mock('../../common/dropdown/RoleDropdown', () => ({
  RoleDropdown: ({ value, onChange, options }: any) => (
    <select
      data-testid="role-dropdown"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options?.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
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

describe('AddBaseMembersModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    workspaceId: 'ws-123',
    baseId: 'base-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    bulkAddMock.mockResolvedValue(undefined);
    removeMock.mockResolvedValue(undefined);
  });

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = renderWithQueryClient(
        <AddBaseMembersModal {...defaultProps} isOpen={false} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders the modal when isOpen is true', () => {
      renderWithQueryClient(<AddBaseMembersModal {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /Add & Manage Members/i })).toBeInTheDocument();
    });

    it('renders user selection component', () => {
      renderWithQueryClient(<AddBaseMembersModal {...defaultProps} />);

      expect(screen.getByTestId('multi-select-tags')).toBeInTheDocument();
    });

    it('renders role dropdown', () => {
      renderWithQueryClient(<AddBaseMembersModal {...defaultProps} />);

      expect(screen.getByTestId('role-dropdown')).toBeInTheDocument();
    });

    it('renders Cancel button', () => {
      renderWithQueryClient(<AddBaseMembersModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('displays existing members section', () => {
      renderWithQueryClient(<AddBaseMembersModal {...defaultProps} />);

      expect(screen.getByText(/People with access/i)).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClose when X button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithQueryClient(<AddBaseMembersModal {...defaultProps} onClose={onClose} />);

      // Find the X close button
      const buttons = screen.getAllByRole('button');
      const xButton = buttons.find(btn => btn.querySelector('svg.lucide-x'));
      
      if (xButton) {
        await user.click(xButton);
        expect(onClose).toHaveBeenCalled();
      }
    });

    it('calls onClose when pressing Escape key', () => {
      const onClose = vi.fn();

      const { container } = renderWithQueryClient(
        <AddBaseMembersModal {...defaultProps} onClose={onClose} />
      );

      const backdrop = container.querySelector('.bg-modal-backdrop');
      fireEvent.keyDown(backdrop!, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('updates selected role when role dropdown changes', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<AddBaseMembersModal {...defaultProps} />);

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'base-read');

      expect(roleDropdown).toHaveValue('base-read');
    });

    it('adds selected members when Save is clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<AddBaseMembersModal {...defaultProps} />);

      const userSelect = screen.getByTestId('user-select');
      await user.selectOptions(userSelect, ['user-2']);

      await user.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        expect(bulkAddMock).toHaveBeenCalledWith({
          baseId: 'base-123',
          workspaceId: 'ws-123',
          members: [{ user_id: 'user-2', role: 'base-member' }],
        });
      });
      expect(toastSuccess).toHaveBeenCalled();
    });

    it('updates role for existing member when pending change exists', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<AddBaseMembersModal {...defaultProps} />);

      const roleDropdown = screen.getAllByTestId('role-dropdown')[0];
      await user.selectOptions(roleDropdown, 'base-read');

      await user.click(screen.getByRole('button', { name: 'Update' }));

      await waitFor(() => {
        expect(bulkAddMock).toHaveBeenCalledWith({
          baseId: 'base-123',
          workspaceId: 'ws-123',
          members: [{ user_id: 'user-1', role: 'base-read' }],
        });
      });
      expect(toastSuccess).toHaveBeenCalled();
    });

    it('removes member when remove button clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<AddBaseMembersModal {...defaultProps} />);

      const removeButtons = screen.getAllByLabelText('Remove member');
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(removeMock).toHaveBeenCalledWith({
          baseId: 'base-123',
          user_id: 'user-1',
        });
      });
      expect(toastSuccess).toHaveBeenCalled();
    });
  });

  describe('state reset', () => {
    it('resets form when modal reopens', async () => {
      const { rerender } = renderWithQueryClient(
        <AddBaseMembersModal {...defaultProps} />
      );

      // Close modal
      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <AddBaseMembersModal {...defaultProps} isOpen={false} />
        </QueryClientProvider>
      );

      // Reopen modal
      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <AddBaseMembersModal {...defaultProps} isOpen={true} />
        </QueryClientProvider>
      );

      await waitFor(() => {
        // Role should be reset to default
        expect(screen.getByTestId('role-dropdown')).toHaveValue('base-member');
      });
    });
  });

  describe('role options', () => {
    it('displays base-level role options only', () => {
      renderWithQueryClient(<AddBaseMembersModal {...defaultProps} />);

      const roleDropdown = screen.getByTestId('role-dropdown');
      const options = roleDropdown.querySelectorAll('option');

      const optionValues = Array.from(options).map(opt => opt.value);
      expect(optionValues).toContain('base-member');
      expect(optionValues).toContain('base-read');
    });
  });

  describe('accessibility', () => {
    it('has proper button types', () => {
      renderWithQueryClient(<AddBaseMembersModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      expect(cancelButton).toHaveAttribute('type', 'button');
    });
  });
});
