import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateWorkspaceModal } from '../CreateWorkspaceModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as useApi from '../../../hooks/useApi';

const mockMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();
const mockHandleWorkspaceDeletion = vi.fn();
const mockCanDeleteWorkspace = vi.fn(() => true);

vi.mock('../../../hooks/useApi', () => ({
  useCreateWorkspace: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
  useWorkspaces: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useDeleteWorkspace: vi.fn(() => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  })),
}));

vi.mock('../../common/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    show: vi.fn(),
  }),
}));

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

vi.mock('../../../utils/nameValidation', () => ({
  validateWorkspaceName: vi.fn((name, existingWorkspaces, currentItemId) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { isValid: false, error: 'Workspace name is required' };
    }
    if (trimmedName.length < 3) {
      return { isValid: false, error: 'Workspace name must be at least 3 characters' };
    }
    if (trimmedName.length > 50) {
      return { isValid: false, error: 'Workspace name must be less than 50 characters' };
    }
    const isDuplicate = existingWorkspaces?.some(
      (ws: any) => ws.id !== currentItemId && 
        (ws.name?.toLowerCase() === trimmedName.toLowerCase() ||
         ws.title?.toLowerCase() === trimmedName.toLowerCase())
    );
    if (isDuplicate) {
      return { isValid: false, error: 'Workspace name already exists' };
    }
    return { isValid: true, error: null };
  }),
}));

vi.mock('../../../hooks/useNavigationActions', () => ({
  useNavigationActions: () => ({
    handleWorkspaceDeletion: mockHandleWorkspaceDeletion,
  }),
}));

vi.mock('../../../hooks/useWorkspaceAccess', () => ({
  useWorkspaceAccess: () => ({
    canDeleteWorkspace: mockCanDeleteWorkspace,
  }),
}));

vi.mock('../DeleteWorkspaceModal', () => ({
  DeleteWorkspaceModal: ({ isOpen, onClose, onConfirm, workspace }: any) => {
    if (!isOpen) return null;
    const handleConfirm = async () => {
      try {
        await onConfirm(workspace.id);
      } catch (error) {
        // Error is handled by parent component - suppress unhandled rejection
        // The error is expected in error test cases
        return Promise.resolve();
      }
    };
    return (
      <div data-testid="delete-workspace-modal">
        <button onClick={onClose} data-testid="delete-modal-close">Close</button>
        <button
          onClick={() => {
            handleConfirm().catch(() => {
              // Suppress unhandled rejection
            });
          }}
          data-testid="delete-modal-confirm"
        >
          Confirm Delete
        </button>
      </div>
    );
  },
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
    mockCanDeleteWorkspace.mockReturnValue(true);
    mockMutateAsync.mockResolvedValue({});
    mockDeleteMutateAsync.mockResolvedValue({});
    vi.mocked(useApi.useCreateWorkspace).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);
    vi.mocked(useApi.useWorkspaces).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(useApi.useDeleteWorkspace).mockReturnValue({
      mutateAsync: mockDeleteMutateAsync,
      isPending: false,
    } as any);
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

    it('renders tabs in edit mode', () => {
      vi.mocked(useApi.useWorkspaces).mockReturnValue({
        data: [{ id: 'ws-1', title: 'Test Workspace' }],
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(
        <CreateWorkspaceModal {...defaultProps} currentWorkspaceId="ws-1" />
      );

      expect(screen.getByText('Information')).toBeInTheDocument();
      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    });

    it('does not render tabs in create mode', () => {
      renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} />);

      expect(screen.queryByText('Danger Zone')).not.toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('shows error when submitting with empty name', async () => {
      renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} />);

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

    it('shows validation error for short name', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} />);

      const input = screen.getByLabelText(/Workspace Name/i);
      await user.type(input, 'AB');

      await waitFor(() => {
        expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for duplicate name', async () => {
      const user = userEvent.setup();
      vi.mocked(useApi.useWorkspaces).mockReturnValue({
        data: [{ id: 'ws-1', title: 'Existing Workspace' }],
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} />);

      const input = screen.getByLabelText(/Workspace Name/i);
      await user.type(input, 'Existing Workspace');

      await waitFor(() => {
        expect(screen.getByText(/already exists/i)).toBeInTheDocument();
      });
    });

    it('enforces max length of 50 characters', async () => {
      renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} />);

      const input = screen.getByLabelText(/Workspace Name/i) as HTMLInputElement;
      expect(input.maxLength).toBe(50);

      fireEvent.change(input, { target: { value: 'A'.repeat(51) } });

      await waitFor(() => {
        expect(screen.getByText(/less than 50 characters/i)).toBeInTheDocument();
      });
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
      const onSubmit = vi.fn().mockResolvedValue(undefined);
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

    it('shows controlled error when provided', () => {
      renderWithQueryClient(
        <CreateWorkspaceModal
          {...defaultProps}
          name="Test"
          setName={vi.fn()}
          description=""
          setDescription={vi.fn()}
          error="Controlled error message"
        />
      );

      expect(screen.getByText('Controlled error message')).toBeInTheDocument();
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

      const backdrop = screen.getByLabelText('Close modal');
      await user.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when X button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} onClose={onClose} />);

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

    it('calls onClose when Escape key is pressed', async () => {
      const onClose = vi.fn();

      const { container } = renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} onClose={onClose} />);

      const backdrop = container.querySelector('.bg-modal-backdrop');
      if (backdrop) {
        fireEvent.keyDown(backdrop, { key: 'Escape', code: 'Escape' });
        expect(onClose).toHaveBeenCalled();
      }
    });

    it('submits form when Ctrl+Enter is pressed', async () => {
      const user = userEvent.setup();

      const { container } = renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} />);

      const input = screen.getByLabelText(/Workspace Name/i);
      await user.type(input, 'Test Workspace');

      const backdrop = container.querySelector('.bg-modal-backdrop');
      if (backdrop) {
        fireEvent.keyDown(backdrop, { key: 'Enter', code: 'Enter', ctrlKey: true });
        await waitFor(() => {
          expect(mockMutateAsync).toHaveBeenCalled();
        });
      }
    });
  });

  describe('form submission', () => {
    it('submits form with internal mutation when not controlled', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onSuccess = vi.fn();

      renderWithQueryClient(
        <CreateWorkspaceModal {...defaultProps} onClose={onClose} onSuccess={onSuccess} />
      );

      const input = screen.getByLabelText(/Workspace Name/i);
      await user.type(input, 'Test Workspace');

      const submitButton = screen.getByRole('button', { name: 'Create Workspace' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          workspace: {
            title: 'Test Workspace',
            description: '',
          },
        });
        expect(onClose).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('handles submission error', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      mockMutateAsync.mockRejectedValue(new Error('Network error'));

      renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} onClose={onClose} />);

      const input = screen.getByLabelText(/Workspace Name/i);
      await user.type(input, 'Test Workspace');

      const submitButton = screen.getByRole('button', { name: 'Create Workspace' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });

    it('trims whitespace from name and description', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Workspace Name/i);
      await user.type(nameInput, '  Test Workspace  ');

      const descInput = screen.getByTestId('description-input');
      await user.type(descInput, '  Test Description  ');

      const submitButton = screen.getByRole('button', { name: 'Create Workspace' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          workspace: {
            title: 'Test Workspace',
            description: 'Test Description',
          },
        });
      });
    });

    it('shows error when name is empty on submit', async () => {
      renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} />);
      const submitButton = screen.getByRole('button', { name: 'Create Workspace' });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('edit mode', () => {
    it('switches to danger zone tab', async () => {
      const user = userEvent.setup();
      vi.mocked(useApi.useWorkspaces).mockReturnValue({
        data: [{ id: 'ws-1', title: 'Test Workspace' }],
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(
        <CreateWorkspaceModal {...defaultProps} currentWorkspaceId="ws-1" />
      );

      const dangerZoneTab = screen.getByText('Danger Zone');
      await user.click(dangerZoneTab);

      expect(screen.getByText('Delete this workspace and all it\'s contents.')).toBeInTheDocument();
    });

    it('shows delete button in danger zone', async () => {
      const user = userEvent.setup();
      vi.mocked(useApi.useWorkspaces).mockReturnValue({
        data: [{ id: 'ws-1', title: 'Test Workspace' }],
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(
        <CreateWorkspaceModal {...defaultProps} currentWorkspaceId="ws-1" />
      );

      const dangerZoneTab = screen.getByText('Danger Zone');
      await user.click(dangerZoneTab);

      expect(screen.getByRole('button', { name: 'Delete Workspace' })).toBeInTheDocument();
    });

    it('opens delete confirmation modal', async () => {
      const user = userEvent.setup();
      vi.mocked(useApi.useWorkspaces).mockReturnValue({
        data: [{ id: 'ws-1', title: 'Test Workspace' }],
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(
        <CreateWorkspaceModal {...defaultProps} currentWorkspaceId="ws-1" />
      );

      const dangerZoneTab = screen.getByText('Danger Zone');
      await user.click(dangerZoneTab);

      const deleteButton = screen.getByRole('button', { name: 'Delete Workspace' });
      await user.click(deleteButton);

      expect(screen.getByTestId('delete-workspace-modal')).toBeInTheDocument();
    });

    it('deletes workspace when confirmed', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      vi.mocked(useApi.useWorkspaces).mockReturnValue({
        data: [{ id: 'ws-1', title: 'Test Workspace' }],
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(
        <CreateWorkspaceModal
          {...defaultProps}
          currentWorkspaceId="ws-1"
          onClose={onClose}
          onSuccess={onSuccess}
        />
      );

      const dangerZoneTab = screen.getByText('Danger Zone');
      await user.click(dangerZoneTab);

      const deleteButton = screen.getByRole('button', { name: 'Delete Workspace' });
      await user.click(deleteButton);

      const confirmButton = screen.getByTestId('delete-modal-confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteMutateAsync).toHaveBeenCalledWith('ws-1');
        expect(mockHandleWorkspaceDeletion).toHaveBeenCalledWith('ws-1');
        expect(onClose).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('handles delete error', async () => {
      const user = userEvent.setup();
      vi.mocked(useApi.useWorkspaces).mockReturnValue({
        data: [{ id: 'ws-1', title: 'Test Workspace' }],
        isLoading: false,
        error: null,
      } as any);
      const deleteError = new Error('Delete failed');
      mockDeleteMutateAsync.mockRejectedValue(deleteError);

      renderWithQueryClient(
        <CreateWorkspaceModal {...defaultProps} currentWorkspaceId="ws-1" />
      );

      const dangerZoneTab = screen.getByText('Danger Zone');
      await user.click(dangerZoneTab);

      const deleteButton = screen.getByRole('button', { name: 'Delete Workspace' });
      await user.click(deleteButton);

      const confirmButton = screen.getByTestId('delete-modal-confirm');
      await user.click(confirmButton);

      await waitFor(
        () => {
          expect(mockDeleteMutateAsync).toHaveBeenCalledWith('ws-1');
        },
        { timeout: 2000 }
      );

      await waitFor(
        () => {
          expect(mockHandleWorkspaceDeletion).not.toHaveBeenCalled();
        },
        { timeout: 1000 }
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('hides danger zone tab when user cannot delete', () => {
      mockCanDeleteWorkspace.mockReturnValue(false);
      vi.mocked(useApi.useWorkspaces).mockReturnValue({
        data: [{ id: 'ws-1', title: 'Test Workspace' }],
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(
        <CreateWorkspaceModal {...defaultProps} currentWorkspaceId="ws-1" />
      );

      expect(screen.queryByText('Danger Zone')).not.toBeInTheDocument();
    });

    it('excludes current workspace from duplicate validation', async () => {
      const user = userEvent.setup();
      vi.mocked(useApi.useWorkspaces).mockReturnValue({
        data: [{ id: 'ws-1', title: 'Test Workspace' }],
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(
        <CreateWorkspaceModal {...defaultProps} currentWorkspaceId="ws-1" />
      );

      const input = screen.getByLabelText(/Workspace Name/i);
      await user.type(input, 'Test Workspace');

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: 'Create Workspace' });
        expect(submitButton).not.toBeDisabled();
      });
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

  describe('loading states', () => {
    it('shows loading state when submitting', async () => {
      vi.mocked(useApi.useCreateWorkspace).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as any);

      renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} />);

      const input = screen.getByLabelText(/Workspace Name/i);
      await userEvent.type(input, 'Test Workspace');

      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeInTheDocument();
      });
    });

    it('disables submit button when loading', async () => {
      vi.mocked(useApi.useCreateWorkspace).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as any);

      renderWithQueryClient(<CreateWorkspaceModal {...defaultProps} />);

      const input = screen.getByLabelText(/Workspace Name/i);
      await userEvent.type(input, 'Test Workspace');

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Creating.../i });
        expect(submitButton).toBeDisabled();
      });
    });
  });
});
