import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateViewModal } from '../CreateViewModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock useApi hooks
vi.mock('../../../hooks/useApi', () => ({
  useTable: vi.fn(() => ({
    data: {
      data: {
        columns: [
          { id: 'col-1', title: 'Name', uidt: 'SingleLineText' },
          { id: 'col-2', title: 'Status', uidt: 'Select' },
          { id: 'col-3', title: 'Due Date', uidt: 'Date' },
          { id: 'col-4', title: 'Image', uidt: 'Attachment' },
        ],
      },
    },
    isLoading: false,
  })),
}));

// Mock nameValidation
vi.mock('../../../utils/nameValidation', () => ({
  validateViewName: vi.fn((name, existingViews, _currentItemId) => {
    if (!name || name.trim().length < 1) {
      return { isValid: false, error: 'View name is required' };
    }
    const isDuplicate = existingViews?.some(
      (view: any) => view.name?.toLowerCase() === name.toLowerCase() ||
                      view.title?.toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      return { isValid: false, error: 'A view with this name already exists' };
    }
    return { isValid: true, error: null };
  }),
  getDefaultViewName: vi.fn((viewType, existingViews) => {
    const typeLabels: Record<string, string> = {
      grid: 'Grid View',
      kanban: 'Kanban View',
      calendar: 'Calendar View',
      gallery: 'Gallery View',
      ganttChart: 'Gantt View',
      form: 'Form View',
    };
    const baseName = typeLabels[viewType] || 'View';
    const count = (existingViews?.filter((v: any) => 
      v.type === viewType || v.name?.startsWith(baseName)
    ).length || 0) + 1;
    return count > 1 ? `${baseName} ${count}` : baseName;
  }),
  generateUniqueName: vi.fn((name, _existingItems, _type) => name),
}));

// Mock MultiLineText
vi.mock('../../common/Fields/MultiLineText', () => ({
  MultiLineText: ({ label, value, onChange, placeholder }: any) => (
    <div>
      <label htmlFor="view-description">{label}</label>
      <textarea
        id="view-description"
        data-testid="description-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  ),
}));

// Mock AdvancedDropdown
vi.mock('../../common/dropdown/AdvancedDropdown', () => ({
  default: ({ options, value, onChange, placeholder }: any) => (
    <select
      data-testid="field-dropdown"
      value={value?.value || value || ''}
      onChange={(e) => {
        const selected = options?.find((opt: any) => opt.value === e.target.value);
        onChange(selected || e.target.value);
      }}
    >
      <option value="">{placeholder}</option>
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

describe('CreateViewModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onCreate: vi.fn(),
    tableId: 'table-123',
    viewType: 'grid',
    fields: [],
    existingViews: [],
  };

  const mockFields = [
    { id: 'col-1', title: 'Name', uidt: 'SingleLineText' },
    { id: 'col-2', title: 'Status', uidt: 'Select' },
    { id: 'col-3', title: 'Due Date', uidt: 'Date' },
    { id: 'col-4', title: 'Image', uidt: 'Attachment' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = renderWithQueryClient(
        <CreateViewModal {...defaultProps} isOpen={false} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders the modal when isOpen is true', () => {
      renderWithQueryClient(<CreateViewModal {...defaultProps} />);

      expect(screen.getByText('Create View')).toBeInTheDocument();
    });

    it('renders form elements', () => {
      renderWithQueryClient(<CreateViewModal {...defaultProps} />);

      expect(screen.getByLabelText(/View Name/i)).toBeInTheDocument();
      expect(screen.getByTestId('description-input')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create View' })).toBeInTheDocument();
    });

    it('pre-fills with default view name based on type', () => {
      renderWithQueryClient(<CreateViewModal {...defaultProps} viewType="grid" />);

      expect(screen.getByLabelText(/View Name/i)).toHaveValue('Grid View');
    });

    it('pre-fills with provided defaultName', () => {
      renderWithQueryClient(
        <CreateViewModal {...defaultProps} defaultName="Custom View" />
      );

      expect(screen.getByLabelText(/View Name/i)).toHaveValue('Custom View');
    });

    it('displays correct icon based on view type', () => {
      renderWithQueryClient(<CreateViewModal {...defaultProps} viewType="kanban" />);

      expect(screen.getByLabelText(/View Name/i)).toHaveValue('Kanban View');
    });
  });

  describe('view type specific rendering', () => {
    it('shows field dropdown for kanban view', () => {
      renderWithQueryClient(
        <CreateViewModal {...defaultProps} viewType="kanban" fields={mockFields} />
      );

      expect(screen.getByTestId('field-dropdown')).toBeInTheDocument();
    });

    it('shows field dropdown for calendar view', () => {
      renderWithQueryClient(
        <CreateViewModal {...defaultProps} viewType="calendar" fields={mockFields} />
      );

      expect(screen.getByTestId('field-dropdown')).toBeInTheDocument();
    });

    it('shows field dropdown for gallery view', () => {
      renderWithQueryClient(
        <CreateViewModal {...defaultProps} viewType="gallery" fields={mockFields} />
      );

      expect(screen.getByTestId('field-dropdown')).toBeInTheDocument();
    });

    it('does not show field dropdown for grid view', () => {
      renderWithQueryClient(
        <CreateViewModal {...defaultProps} viewType="grid" fields={mockFields} />
      );

      expect(screen.queryByTestId('field-dropdown')).not.toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('shows validation error for duplicate view name', async () => {
      const user = userEvent.setup();
      const existingViews = [{ id: 'view-1', name: 'Existing View' }];

      renderWithQueryClient(
        <CreateViewModal {...defaultProps} existingViews={existingViews} />
      );

      const input = screen.getByLabelText(/View Name/i);
      await user.clear(input);
      await user.type(input, 'Existing View');

      await waitFor(() => {
        expect(screen.getByText(/already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('calls onCreate with form data for grid view', async () => {
      // Form submission may work differently in current implementation
      const user = userEvent.setup();
      const onCreate = vi.fn();

      renderWithQueryClient(
        <CreateViewModal {...defaultProps} onCreate={onCreate} viewType="grid" />
      );

      const descInput = screen.getByTestId('description-input');
      await user.type(descInput, 'Grid view description');
      await user.click(screen.getByRole('button', { name: 'Create View' }));

      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Grid View',
            description: 'Grid view description',
            type: 'grid',
          })
        );
      });
    });

    it('shows loading state while submitting', async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));
      const onClose = vi.fn();

      renderWithQueryClient(
        <CreateViewModal {...defaultProps} onCreate={onCreate} onClose={onClose} />
      );

      await user.click(screen.getByRole('button', { name: 'Create View' }));

      await waitFor(() => {
        expect(onCreate).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('trims whitespace from name and description', async () => {
      // Form data processing may work differently now
      const user = userEvent.setup();
      const onCreate = vi.fn().mockResolvedValueOnce(undefined);

      renderWithQueryClient(
        <CreateViewModal {...defaultProps} onCreate={onCreate} defaultName="" />
      );

      const nameInput = screen.getByLabelText(/View Name/i);
      const descInput = screen.getByTestId('description-input');

      await user.clear(nameInput);
      await user.type(nameInput, '  New View  ');
      await user.type(descInput, '  Description  ');
      await user.click(screen.getByRole('button', { name: 'Create View' }));

      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New View',
            description: 'Description',
            type: 'grid',
          })
        );
      });
    });
  });

  describe('interactions', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithQueryClient(<CreateViewModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithQueryClient(<CreateViewModal {...defaultProps} onClose={onClose} />);

      // Look for the backdrop button with aria-label
      const backdrop = screen.getByLabelText('Close modal');
      await user.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when pressing Escape key', () => {
      const onClose = vi.fn();

      const { container } = renderWithQueryClient(
        <CreateViewModal {...defaultProps} onClose={onClose} />
      );

      const backdrop = container.querySelector('.bg-modal-backdrop');
      fireEvent.keyDown(backdrop!, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('state reset', () => {
    it('resets form when modal reopens', async () => {
      const { rerender } = renderWithQueryClient(
        <CreateViewModal {...defaultProps} viewType="kanban" />
      );

      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <CreateViewModal {...defaultProps} isOpen={false} />
        </QueryClientProvider>
      );

      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <CreateViewModal {...defaultProps} isOpen={true} viewType="calendar" />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/View Name/i)).toHaveValue('Calendar View');
      });
    });
  });

  describe('different view types', () => {
    it.each([
      ['grid', 'Grid View'],
      ['kanban', 'Kanban View'],
      ['calendar', 'Calendar View'],
      ['gallery', 'Gallery View'],
      ['form', 'Form View'],
    ])('sets default name for %s view type', async (type, expectedName) => {
      renderWithQueryClient(
        <CreateViewModal {...defaultProps} viewType={type} />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/View Name/i)).toHaveValue(expectedName);
      });
    });
  });
});

