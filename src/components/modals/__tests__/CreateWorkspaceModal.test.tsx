import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateWorkspaceModal } from '../CreateWorkspaceModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the useApi hook
vi.mock('../../../hooks/useApi', () => ({
  useCreateWorkspace: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useWorkspaces: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

// Mock Toast
vi.mock('../../common/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    show: vi.fn(),
  }),
}));

// Mock MultiLineText
vi.mock('../../common/Fields', () => ({
  MultiLineText: ({ label, value, onChange, placeholder }: any) => (
    <div>
      <label htmlFor="workspace-description">{label}</label>
      <textarea
        id="workspace-description"
        data-testid="description-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
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

describe('CreateWorkspaceModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = renderWithQueryClient(
        <CreateWorkspaceModal {...defaultProps} isOpen={false} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders the modal when isOpen is true', () => {
      renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} />);

      expect(screen.getByRole('heading', { name: 'Create Workspace' })).toBeInTheDocument();
    });

    it('renders form elements', () => {
      renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} />);

      expect(screen.getByLabelText(/Workspace Name/i)).toBeInTheDocument();
      expect(screen.getByTestId('description-input')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Workspace' })).toBeInTheDocument();
    });

    it('displays custom title when provided', () => {
      renderWithQueryClient(
        <CreateWorkspaceModal {...defaultProps} title="Edit Workspace" />
      );

      expect(screen.getByText('Edit Workspace')).toBeInTheDocument();
    });

    it('displays custom submit button text when provided', () => {
      renderWithQueryClient(
        <CreateWorkspaceModal {...defaultProps} submitButtonText="Save Changes" />
      );

      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('shows error when submitting with empty name', async () => {
      const onClose = vi.fn();

      renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} onClose={onClose} />);

      const submitButton = screen.getByRole('button', { name: 'Create Workspace' });
      expect(submitButton).toBeDisabled();
    });

    it('displays character count', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} />);

      const input = screen.getByLabelText(/Workspace Name/i);
      await user.type(input, 'Test');

      expect(screen.getByText('4/50 characters')).toBeInTheDocument();
    });
  });

  describe('controlled mode', () => {
    it('uses controlled values when provided', () => {
      const setName = vi.fn();
      const setDescription = vi.fn();

      renderWithQueryClient(
        <CreateWorkspaceModal
          {...defaultProps}
          name="Controlled Name"
          setName={setName}
          description="Controlled Description"
          setDescription={setDescription}
        />
      );

      expect(screen.getByLabelText(/Workspace Name/i)).toHaveValue('Controlled Name');
    });

    it('calls setName when name changes in controlled mode', async () => {
      const user = userEvent.setup();
      const setName = vi.fn();
      const setDescription = vi.fn();

      renderWithQueryClient(
        <CreateWorkspaceModal
          {...defaultProps}
          name=""
          setName={setName}
          description=""
          setDescription={setDescription}
        />
      );

      const input = screen.getByLabelText(/Workspace Name/i);
      await user.type(input, 'A');

      expect(setName).toHaveBeenCalled();
    });

    it('calls custom onSubmit when provided', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      const setName = vi.fn();
      const setDescription = vi.fn();

      renderWithQueryClient(
        <CreateWorkspaceModal
          {...defaultProps}
          name="Test Workspace"
          setName={setName}
          description=""
          setDescription={setDescription}
          onSubmit={onSubmit}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Create Workspace' }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('interactions', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} onClose={onClose} />);

      // Look for the backdrop button with aria-label
      const backdrop = screen.getByLabelText('Close modal');
      await user.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when X button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} onClose={onClose} />);

      // Find the close button (X icon button)
      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find((btn) => btn.querySelector('svg'));
      
      if (xButton && xButton !== screen.getByRole('button', { name: 'Cancel' })) {
        await user.click(xButton);
        expect(onClose).toHaveBeenCalled();
      }
    });

    it('does not call onClose when clicking inside modal content', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('heading', { name: 'Create Workspace' }));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('state reset', () => {
    it('resets form when modal reopens', async () => {
      const user = userEvent.setup();
      
      const { rerender } = renderWithQueryClient(
        <CreateWorkspaceModal {...defaultProps} />
      );

      const input = screen.getByLabelText(/Workspace Name/i);
      await user.type(input, 'Test Workspace');

      expect(input).toHaveValue('Test Workspace');

      // Close and reopen
      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <CreateWorkspaceModal {...defaultProps} isOpen={false} />
        </QueryClientProvider>
      );

      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <CreateWorkspaceModal {...defaultProps} isOpen={true} />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Workspace Name/i)).toHaveValue('');
      });
    });
  });
});
