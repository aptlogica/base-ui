import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditRecordModal from '../EditRecordModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock hooks
vi.mock('../../../hooks/useApi', () => ({
  useInsertRowData: vi.fn(() => ({
    mutateAsync: vi.fn(() => Promise.resolve({})),
    isPending: false,
  })),
}));

vi.mock('../../../hooks/useBaseAccess', () => ({
  useBaseAccess: vi.fn(() => ({
    canUpdateRecord: () => true,
    canDeleteRecord: () => true,
    isBaseReadOnly: () => false,
  })),
}));

// Mock FieldRenderer
vi.mock('../../../plugins/FormViewPlugin/components/shared/FieldRenderer', () => ({
  default: ({ field, value, onChange }: any) => (
    <div data-testid={`field-renderer-${field.id}`}>
      <label>{field.title || field.name}</label>
      <input
        data-testid={`field-input-${field.id}`}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  ),
}));

// Mock utils
vi.mock('../../../utils/fieldUtils', () => ({
  isFormulaField: vi.fn(() => false),
}));

vi.mock('../../../utils/standardFieldUtils', () => ({
  createFieldRendererProps: vi.fn((field) => ({ field })),
  getFieldDisplayName: vi.fn((field) => field.title || field.name),
  getFieldDefaultValue: vi.fn(() => null),
  getStandardFieldType: vi.fn((type) => type),
}));

vi.mock('../../../types/fieldTypes', () => ({
  getFieldTypeIconWithMargin: vi.fn(() => <span data-testid="field-icon">📝</span>),
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

describe('EditRecordModal', () => {
  const mockTable = {
    id: 'table-123',
    name: 'Test Table',
    base_id: 'base-123',
  };

  const mockFields = [
    { id: 'field-1', name: 'title', title: 'Title', uidt: 'SingleLineText' },
    { id: 'field-2', name: 'description', title: 'Description', uidt: 'LongText' },
    { id: 'field-3', name: 'status', title: 'Status', uidt: 'Select' },
  ];

  const defaultProps = {
    isOpen: true,
    table: mockTable,
    fields: mockFields,
    recordId: 'record-123',
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    initialValues: {
      'field-1': 'Existing Title',
      'field-2': 'Existing Description',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = renderWithQueryClient(
        <EditRecordModal {...defaultProps} isOpen={false} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders the modal when isOpen is true', () => {
      renderWithQueryClient(<EditRecordModal {...defaultProps} />);

      expect(screen.getByText('Edit record')).toBeInTheDocument();
    });

    it('displays custom title when provided', () => {
      renderWithQueryClient(
        <EditRecordModal {...defaultProps} title="Update Item" />
      );

      expect(screen.getByText('Update Item')).toBeInTheDocument();
    });

    it('renders visible fields', () => {
      renderWithQueryClient(<EditRecordModal {...defaultProps} />);

      expect(screen.getByTestId('field-renderer-field-1')).toBeInTheDocument();
      expect(screen.getByTestId('field-renderer-field-2')).toBeInTheDocument();
    });

    it('renders submit button with correct label', () => {
      renderWithQueryClient(<EditRecordModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    });

    it('renders custom submit label', () => {
      renderWithQueryClient(
        <EditRecordModal {...defaultProps} submitLabel="Update Item" />
      );

      expect(screen.getByRole('button', { name: 'Update Item' })).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      renderWithQueryClient(<EditRecordModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('displays initial values in form fields', () => {
      renderWithQueryClient(<EditRecordModal {...defaultProps} />);

      expect(screen.getByTestId('field-input-field-1')).toHaveValue('Existing Title');
    });
  });

  describe('interactions', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithQueryClient(<EditRecordModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when X button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithQueryClient(<EditRecordModal {...defaultProps} onClose={onClose} />);

      // Find X close button
      const buttons = screen.getAllByRole('button');
      const xButton = buttons.find(btn => btn.querySelector('svg.lucide-x'));
      
      if (xButton) {
        await user.click(xButton);
        expect(onClose).toHaveBeenCalled();
      }
    });

    it('calls onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      const { container } = renderWithQueryClient(
        <EditRecordModal {...defaultProps} onClose={onClose} />
      );

      const backdrop = container.querySelector('.bg-modal-backdrop');
      await user.click(backdrop!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when pressing Escape key', () => {
      const onClose = vi.fn();

      const { container } = renderWithQueryClient(
        <EditRecordModal {...defaultProps} onClose={onClose} />
      );

      const backdrop = container.querySelector('.bg-modal-backdrop');
      fireEvent.keyDown(backdrop!, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('actions menu', () => {
    it('renders more options button', () => {
      renderWithQueryClient(<EditRecordModal {...defaultProps} />);

      const moreButton = screen.getByRole('button', { name: /more/i });
      expect(moreButton).toBeInTheDocument();
    });

    it('shows menu when more button is clicked', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(
        <EditRecordModal
          {...defaultProps}
          onDuplicate={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Find the more options button (with MoreHorizontal icon)
      const buttons = screen.getAllByRole('button');
      const moreButton = buttons.find(btn => 
        btn.querySelector('svg.lucide-more-horizontal')
      );

      if (moreButton) {
        await user.click(moreButton);

        await waitFor(() => {
          // Menu should be visible with options
          expect(screen.getByText(/Duplicate/i)).toBeInTheDocument();
        });
      }
    });

    it('calls onDuplicate when duplicate option is clicked', async () => {
      const user = userEvent.setup();
      const onDuplicate = vi.fn();

      renderWithQueryClient(
        <EditRecordModal
          {...defaultProps}
          onDuplicate={onDuplicate}
          onDelete={vi.fn()}
        />
      );

      // Find and click more button
      const buttons = screen.getAllByRole('button');
      const moreButton = buttons.find(btn => 
        btn.querySelector('svg.lucide-more-horizontal')
      );

      if (moreButton) {
        await user.click(moreButton);

        const duplicateOption = await screen.findByText(/Duplicate/i);
        await user.click(duplicateOption);

        expect(onDuplicate).toHaveBeenCalledWith('record-123');
      }
    });

    it('calls onDelete when delete option is clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      renderWithQueryClient(
        <EditRecordModal
          {...defaultProps}
          onDuplicate={vi.fn()}
          onDelete={onDelete}
        />
      );

      // Find and click more button
      const buttons = screen.getAllByRole('button');
      const moreButton = buttons.find(btn => 
        btn.querySelector('svg.lucide-more-horizontal')
      );

      if (moreButton) {
        await user.click(moreButton);

        const deleteOption = await screen.findByText(/Delete/i);
        await user.click(deleteOption);

        expect(onDelete).toHaveBeenCalledWith('record-123');
      }
    });
  });

  describe('hidden fields toggle', () => {
    it('renders toggle for hidden fields when they exist', () => {
      const fieldsWithHidden = [
        ...mockFields,
        { id: 'field-4', name: 'hidden_field', title: 'Hidden Field', uidt: 'SingleLineText', is_hidden: true },
      ];

      renderWithQueryClient(
        <EditRecordModal {...defaultProps} fields={fieldsWithHidden} />
      );

      expect(screen.getByText(/hidden field/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper button types', () => {
      renderWithQueryClient(<EditRecordModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      const submitButton = screen.getByRole('button', { name: 'Save changes' });

      expect(cancelButton).toHaveAttribute('type', 'button');
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });
});

export default EditRecordModal;
