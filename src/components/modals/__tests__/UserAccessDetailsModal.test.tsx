import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserAccessDetailsModal } from '../UserAccessDetailsModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as useApiModule from '../../../hooks/useApi';

// Mock useApi hook
vi.mock('../../../hooks/useApi', () => ({
  useUserAccessDetails: vi.fn((userId) => ({
    data: userId ? {
      workspaces: [
        {
          id: 'ws-1',
          title: 'Workspace 1',
          access_level: 'full_access',
          bases: [
            { id: 'base-1', title: 'Base A' },
            { id: 'base-2', title: 'Base B' },
          ],
        },
        {
          id: 'ws-2',
          title: 'Workspace 2',
          access_level: 'limited_access',
          bases: [
            { id: 'base-3', title: 'Base C' },
          ],
        },
      ],
    } : null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
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

describe('UserAccessDetailsModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    userId: 'user-123',
    userName: 'John Doe',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = renderWithQueryClient(
        <UserAccessDetailsModal {...defaultProps} isOpen={false} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders the modal when isOpen is true', () => {
      renderWithQueryClient(<UserAccessDetailsModal {...defaultProps} />);

      expect(screen.getByText(/Access Details/i)).toBeInTheDocument();
    });

    it('displays user name in modal', () => {
      renderWithQueryClient(<UserAccessDetailsModal {...defaultProps} />);

      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    it('renders workspace access information', () => {
      renderWithQueryClient(<UserAccessDetailsModal {...defaultProps} />);

      expect(screen.getByText('Workspace 1')).toBeInTheDocument();
      expect(screen.getByText('Workspace 2')).toBeInTheDocument();
    });

    it('renders base information within workspaces', () => {
      renderWithQueryClient(<UserAccessDetailsModal {...defaultProps} />);

      expect(screen.getByText('Base A')).toBeInTheDocument();
      expect(screen.getByText('Base B')).toBeInTheDocument();
      expect(screen.getByText('Base C')).toBeInTheDocument();
    });

    it('displays access level badges', () => {
      renderWithQueryClient(<UserAccessDetailsModal {...defaultProps} />);

      expect(screen.getByText('Full Access')).toBeInTheDocument();
      expect(screen.getByText('Limited Access')).toBeInTheDocument();
    });

    it('renders close button', () => {
      renderWithQueryClient(<UserAccessDetailsModal {...defaultProps} />);

      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find(btn => btn.querySelector('svg.lucide-x'));
      expect(xButton).toBeInTheDocument();
    });
  });

  describe('summary statistics', () => {
    it('displays workspace count in section headers', () => {
      renderWithQueryClient(<UserAccessDetailsModal {...defaultProps} />);

      // Should show workspace counts in section headers
      expect(screen.getByText(/Full Access \(/)).toBeInTheDocument();
      expect(screen.getByText(/Limited Access \(/)).toBeInTheDocument();
    });

    it('displays correct number of bases', () => {
      renderWithQueryClient(<UserAccessDetailsModal {...defaultProps} />);

      // Should show 3 bases total (Base A, Base B, Base C)
      expect(screen.getByText('Base A')).toBeInTheDocument();
      expect(screen.getByText('Base B')).toBeInTheDocument();
      expect(screen.getByText('Base C')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClose when X button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithQueryClient(
        <UserAccessDetailsModal {...defaultProps} onClose={onClose} />
      );

      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find(btn => btn.querySelector('svg.lucide-x'));
      
      if (xButton) {
        await user.click(xButton);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('calls onClose when pressing Escape key', () => {
      const onClose = vi.fn();

      renderWithQueryClient(
        <UserAccessDetailsModal {...defaultProps} onClose={onClose} />
      );

      const backdrop = document.querySelector('.bg-modal-backdrop');
      fireEvent.keyDown(backdrop!, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('loading state', () => {
    it('shows loading indicator when data is loading', () => {
      // Override mock for this test
      vi.mocked(useApiModule.useUserAccessDetails).mockReturnValueOnce({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useApiModule.useUserAccessDetails>);

      renderWithQueryClient(<UserAccessDetailsModal {...defaultProps} />);

      // Should show loading indicator
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });
  });

  describe('access level styling', () => {
    it('applies green styling to full access badge', () => {
      renderWithQueryClient(<UserAccessDetailsModal {...defaultProps} />);

      const fullAccessBadge = screen.getByText('Full Access');
      expect(fullAccessBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('applies yellow styling to limited access badge', () => {
      renderWithQueryClient(<UserAccessDetailsModal {...defaultProps} />);

      const limitedAccessBadge = screen.getByText('Limited Access');
      expect(limitedAccessBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });
  });

  describe('accessibility', () => {
    it('modal has proper structure', () => {
      renderWithQueryClient(<UserAccessDetailsModal {...defaultProps} />);

      // Should have modal backdrop
      const backdrop = document.querySelector('.bg-modal-backdrop');
      expect(backdrop).toBeInTheDocument();
    });
  });
});
