import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateRecordModal from '../CreateRecordModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBaseAccess } from '../../../hooks/useBaseAccess';

// Mock hooks
vi.mock('../../../hooks/useApi', () => ({
  useAddRow: vi.fn(() => ({
    mutateAsync: vi.fn(() => Promise.resolve({ id: 'row-123' })),
    isPending: false,
  })),
  useInsertRowData: vi.fn(() => ({
    mutateAsync: vi.fn(() => Promise.resolve({})),
    isPending: false,
  })),
  useAddAttachment: vi.fn(() => ({
    mutateAsync: vi.fn(() => Promise.resolve({})),
    isPending: false,
  })),
}));

vi.mock('../../../hooks/useBaseAccess', () => ({
  useBaseAccess: vi.fn(() => ({
    canCreateRecord: () => true,
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
vi.mock('../../../utils/fieldType', () => ({
  normalizeFieldType: vi.fn((type) => type),
}));

vi.mock('../../../utils/fieldUtils', () => ({
  isFormulaField: vi.fn(() => false),
}));

vi.mock('../../common/Toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock('../../../utils/standardFieldUtils', () => ({
  getStandardFieldType: vi.fn((type) => type),
  getFieldDisplayName: vi.fn((field) => field.title || field.name),
  getFieldDefaultValue: vi.fn(() => null),
  createFieldRendererProps: vi.fn((field) => ({ field })),
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

describe('CreateRecordModal', () => {
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
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = renderWithQueryClient(
        <CreateRecordModal {...defaultProps} isOpen={false} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders the modal when isOpen is true', () => {
      renderWithQueryClient(<CreateRecordModal {...defaultProps} />);

      expect(screen.getByText('New record')).toBeInTheDocument();
    });

    it('displays custom title when provided', () => {
      renderWithQueryClient(
        <CreateRecordModal {...defaultProps} title="Add New Item" />
      );

      expect(screen.getByText('Add New Item')).toBeInTheDocument();
    });

    it('renders visible fields', () => {
      renderWithQueryClient(<CreateRecordModal {...defaultProps} />);

      expect(screen.getByTestId('field-renderer-field-1')).toBeInTheDocument();
      expect(screen.getByTestId('field-renderer-field-2')).toBeInTheDocument();
    });

    it('renders submit button with correct label', () => {
      renderWithQueryClient(<CreateRecordModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Save record' })).toBeInTheDocument();
    });

    it('renders custom submit label', () => {
      renderWithQueryClient(
        <CreateRecordModal {...defaultProps} submitLabel="Create Item" />
      );

      expect(screen.getByRole('button', { name: 'Create Item' })).toBeInTheDocument();
    });

    it('renders close button', () => {
      renderWithQueryClient(<CreateRecordModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClose when Close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithQueryClient(<CreateRecordModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Close' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('hidden fields toggle', () => {
    it('renders toggle for hidden fields when they exist', () => {
      const fieldsWithHidden = [
        ...mockFields,
        { id: 'field-4', name: 'hidden_field', title: 'Hidden Field', uidt: 'SingleLineText', is_hidden: true },
      ];

      renderWithQueryClient(
        <CreateRecordModal {...defaultProps} fields={fieldsWithHidden} />
      );

      expect(screen.getByText(/hidden field/i)).toBeInTheDocument();
    });
  });

  describe('initial values', () => {
    it('accepts initial values prop', () => {
      const initialValues = {
        'field-1': 'Initial Title',
        'field-2': 'Initial Description',
      };

      // Test that the component accepts the prop without errors
      renderWithQueryClient(
        <CreateRecordModal {...defaultProps} initialValues={initialValues} />
      );

      expect(screen.getByText('New record')).toBeInTheDocument();
    });
  });

  describe('read-only access', () => {
    it('disables submit button when user is read-only', () => {
      vi.clearAllMocks();
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canCreateRecord: () => false,
        isBaseReadOnly: () => true,
      } as any));

      renderWithQueryClient(<CreateRecordModal {...defaultProps} />);

      // When user cannot create, the footer with buttons is not rendered
      const submitButton = screen.queryByRole('button', { name: 'Save record' });
      expect(submitButton).not.toBeInTheDocument();
    });

    it('allows submit when user has create permissions', () => {
      vi.clearAllMocks();
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canCreateRecord: () => true,
        isBaseReadOnly: () => false,
      } as any));

      renderWithQueryClient(<CreateRecordModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'Save record' });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('has proper button types', () => {
      vi.clearAllMocks();
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canCreateRecord: () => true,
        isBaseReadOnly: () => false,
      } as any));

      renderWithQueryClient(<CreateRecordModal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: 'Close' });
      const submitButton = screen.getByRole('button', { name: 'Save record' });

      expect(closeButton).toHaveAttribute('type', 'button');
      expect(submitButton).toHaveAttribute('type', 'button');
    });
  });

  describe('title field badge removal', () => {
    it('does not render title field badge', () => {
      vi.clearAllMocks();
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canCreateRecord: () => true,
        isBaseReadOnly: () => false,
      } as any));

      renderWithQueryClient(<CreateRecordModal {...defaultProps} />);

      // The badge should not exist
      expect(screen.queryByText('Title Field')).not.toBeInTheDocument();
    });

    it('still renders title field input', () => {
      vi.clearAllMocks();
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canCreateRecord: () => true,
        isBaseReadOnly: () => false,
      } as any));

      renderWithQueryClient(<CreateRecordModal {...defaultProps} />);

      // The title field renderer should be visible
      expect(screen.getByTestId('field-renderer-field-1')).toBeInTheDocument();
    });

    it('title field is visible and functional', () => {
      vi.clearAllMocks();
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canCreateRecord: () => true,
        isBaseReadOnly: () => false,
      } as any));

      renderWithQueryClient(
        <CreateRecordModal {...defaultProps} />
      );

      // Title field input should be present
      const titleFieldInput = screen.getByTestId('field-input-field-1');
      expect(titleFieldInput).toBeInTheDocument();
    });
  });
});
