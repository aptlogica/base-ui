import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateRecordModal from '../CreateRecordModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBaseAccess } from '../../../hooks/useBaseAccess';
import { getFieldDefaultValue } from '../../../utils/standardFieldUtils';

const addRowMutateAsyncMock = vi.fn(() => Promise.resolve({ id: 123 }));
const upsertRowMutateAsyncMock = vi.fn(() => Promise.resolve({ data: { record: { id: 123 } } }));
let primaryKeyColumnIds: string[] = [];
const insertRowDataMutateAsyncMock = vi.fn(() => Promise.resolve({}));
const addAttachmentMutateAsyncMock = vi.fn(() => Promise.resolve({}));
const insertRelationMutateAsyncMock = vi.fn(() => Promise.resolve({}));

// Mock hooks
vi.mock('../../../hooks/useApi', () => ({
  useUpsertRow: vi.fn(() => ({
    mutateAsync: upsertRowMutateAsyncMock,
    isPending: false,
  })),
  usePrimaryKey: vi.fn(() => ({ data: { column_ids: primaryKeyColumnIds } })),
  useAddRow: vi.fn(() => ({
    mutateAsync: addRowMutateAsyncMock,
    isPending: false,
  })),
  useInsertRowData: vi.fn(() => ({
    mutateAsync: insertRowDataMutateAsyncMock,
    isPending: false,
  })),
  useAddAttachment: vi.fn(() => ({
    mutateAsync: addAttachmentMutateAsyncMock,
    isPending: false,
  })),
  useInsertRelationData: vi.fn(() => ({
    mutateAsync: insertRelationMutateAsyncMock,
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
  createFieldRendererProps: vi.fn((field, value, onChange, options = {}) => ({
    field,
    value,
    onChange,
    ...options,
  })),
}));

vi.mock('../../../types/fieldTypes', () => ({
  getFieldTypeIconWithMargin: vi.fn(() => <span data-testid="field-icon">📝</span>),
  getRelationTypeFromField: vi.fn(() => undefined),
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

      expect(screen.getByRole('button', { name: 'Save Record' })).toBeInTheDocument();
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

  describe('record layout', () => {
    it('shows the title and save button plus a cancel button in the header', () => {
      renderWithQueryClient(
        <CreateRecordModal {...defaultProps} layout="record" title="New row" submitLabel="Save Record" />
      );

      expect(screen.getByRole('heading', { name: 'New row' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save Record' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('shows Previous and Next before the save button, with Previous enabled when records exist', () => {
      const onPrevious = vi.fn();
      renderWithQueryClient(
        <CreateRecordModal {...defaultProps} layout="record" submitLabel="Save Record" onPrevious={onPrevious} onNext={vi.fn()} hasPrevious hasNext={false} />
      );

      const previous = screen.getByRole('button', { name: 'Previous record' });
      const next = screen.getByRole('button', { name: 'Next record' });
      const save = screen.getByRole('button', { name: 'Save Record' });
      expect(previous).toBeEnabled();
      expect(next).toBeDisabled();
      expect(previous.compareDocumentPosition(save) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(next.compareDocumentPosition(save) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      fireEvent.click(previous);
      expect(onPrevious).toHaveBeenCalledTimes(1);
    });

    it('disables Previous when the table has no records', () => {
      renderWithQueryClient(
        <CreateRecordModal {...defaultProps} layout="record" onPrevious={vi.fn()} onNext={vi.fn()} hasPrevious={false} />
      );

      expect(screen.getByRole('button', { name: 'Previous record' })).toBeDisabled();
    });

    it('hides Previous and Next when no navigation handlers are given', () => {
      renderWithQueryClient(<CreateRecordModal {...defaultProps} layout="record" />);

      expect(screen.queryByRole('button', { name: 'Previous record' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Next record' })).not.toBeInTheDocument();
    });

    it('shows the renamed title column even though the backend marks it as a system field', () => {
      const fields = [
        { id: 'album', title: 'Album', column_name: 'title', type: 'text', system: true },
        { id: 'budget', title: 'Budget', column_name: 'budget', type: 'currency' },
        { id: 'sys', title: 'Internal', column_name: 'internal', type: 'text', system: true },
      ];
      renderWithQueryClient(<CreateRecordModal {...defaultProps} fields={fields as any} layout="record" />);

      expect(screen.getByTestId('field-renderer-album')).toBeInTheDocument();
      expect(screen.getByTestId('field-renderer-budget')).toBeInTheDocument();
      expect(screen.queryByTestId('field-renderer-sys')).not.toBeInTheDocument();
    });

    it('closes from the close button', () => {
      const onClose = vi.fn();
      renderWithQueryClient(<CreateRecordModal {...defaultProps} layout="record" onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalled();
    });

    it('asks to save before closing with unsaved changes, and Discard closes without saving', () => {
      const onClose = vi.fn();
      renderWithQueryClient(<CreateRecordModal {...defaultProps} layout="record" onClose={onClose} />);

      fireEvent.change(screen.getByTestId('field-input-field-1'), { target: { value: 'Hello' } });
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByText('Do you want to save the changes ?')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(upsertRowMutateAsyncMock).not.toHaveBeenCalled();
    });

    it('saves the record from the unsaved-changes prompt', async () => {
      const onClose = vi.fn();
      renderWithQueryClient(<CreateRecordModal {...defaultProps} layout="record" onClose={onClose} />);

      fireEvent.change(screen.getByTestId('field-input-field-1'), { target: { value: 'Hello' } });
      fireEvent.click(screen.getByLabelText('Close modal'));
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => expect(upsertRowMutateAsyncMock).toHaveBeenCalledWith({
        model_id: 'table-123',
        values: { 'field-1': 'Hello' },
      }));
      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    });

    it('keeps the form open when the unsaved-changes prompt is dismissed', () => {
      const onClose = vi.fn();
      renderWithQueryClient(<CreateRecordModal {...defaultProps} layout="record" onClose={onClose} />);

      fireEvent.change(screen.getByTestId('field-input-field-1'), { target: { value: 'Hello' } });
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      fireEvent.click(screen.getByRole('dialog').querySelector('[aria-label="Close"]')!);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByTestId('field-input-field-1')).toHaveValue('Hello');
    });

    it('does not show a record menu on the create form', () => {
      renderWithQueryClient(<CreateRecordModal {...defaultProps} layout="record" />);

      expect(screen.queryByRole('button', { name: 'Record menu' })).not.toBeInTheDocument();
    });

    it('does not count an empty text input as a change, but enables save once text is typed', () => {
      renderWithQueryClient(<CreateRecordModal {...defaultProps} layout="record" submitLabel="Save Record" />);
      const input = screen.getByTestId('field-input-field-2');
      const save = screen.getByRole('button', { name: 'Save Record' });

      fireEvent.input(input, { target: { value: '' } });
      expect(save).toBeDisabled();

      fireEvent.input(input, { target: { value: 'a' } });
      expect(save).toBeEnabled();
    });

    it('counts input from a non-text control as a change', () => {
      renderWithQueryClient(<CreateRecordModal {...defaultProps} layout="record" submitLabel="Save Record" />);

      fireEvent.input(screen.getByTestId('field-renderer-field-3'));

      expect(screen.getByRole('button', { name: 'Save Record' })).toBeEnabled();
    });

    it('closes on a backdrop click but not on a click inside the modal', () => {
      const onClose = vi.fn();
      const { container } = renderWithQueryClient(<CreateRecordModal {...defaultProps} layout="record" onClose={onClose} />);
      const backdrop = container.querySelector('.bg-modal-backdrop') as HTMLElement;

      fireEvent.click(container.querySelector('.bg-modal') as HTMLElement);
      fireEvent.keyDown(backdrop, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('saves from the header button and leaves out auto-generated uuid fields', async () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      const fields = [
        ...mockFields,
        { id: 'field-uuid', name: 'ref', title: 'Ref', uidt: 'uuid', meta: { idGeneration: { mode: 'auto', version: 'v4' } } },
      ];
      renderWithQueryClient(
        <CreateRecordModal
          {...defaultProps}
          fields={fields as any}
          layout="record"
          submitLabel="Save Record"
          onClose={onClose}
          onSuccess={onSuccess}
          initialValues={{ 'field-uuid': '11111111-1111-4111-8111-111111111111' }}
        />
      );

      fireEvent.change(screen.getByTestId('field-input-field-1'), { target: { value: 'Hello' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save Record' }));

      await waitFor(() => expect(upsertRowMutateAsyncMock).toHaveBeenCalledWith({
        model_id: 'table-123',
        values: { 'field-1': 'Hello' },
      }));
      await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ recordId: '123' }));
      expect(onClose).toHaveBeenCalled();
    });

    it('shows hidden fields and the required field error in the record layout', async () => {
      const fields = [
        { id: 'field-1', name: 'title', title: 'Title', uidt: 'SingleLineText' },
        { id: 'field-req', name: 'code', title: 'Code', uidt: 'SingleLineText', required: true },
        { id: 'field-hidden', name: 'secret', title: 'Secret', uidt: 'SingleLineText', hidden: true },
      ];
      renderWithQueryClient(<CreateRecordModal {...defaultProps} fields={fields as any} layout="record" submitLabel="Save Record" />);

      expect(screen.queryByTestId('field-renderer-field-hidden')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /show 1 hidden field/i }));
      expect(screen.getByTestId('field-renderer-field-hidden')).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('field-input-field-1'), { target: { value: 'Hello' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save Record' }));

      expect(await screen.findByText('Required field(s) must not be left empty.')).toBeInTheDocument();
      expect(upsertRowMutateAsyncMock).not.toHaveBeenCalled();
    });

    it('closes without prompting and hides save when the user cannot create records', () => {
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canCreateRecord: () => false,
        isBaseReadOnly: () => true,
      } as any));
      const onClose = vi.fn();
      try {
        renderWithQueryClient(<CreateRecordModal {...defaultProps} layout="record" submitLabel="Save Record" onClose={onClose} />);

        expect(screen.queryByRole('button', { name: 'Save Record' })).not.toBeInTheDocument();
        fireEvent.input(screen.getByTestId('field-renderer-field-3'));
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      } finally {
        vi.mocked(useBaseAccess).mockImplementation(() => ({
          canCreateRecord: () => true,
          isBaseReadOnly: () => false,
        } as any));
      }
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

    it('shows hidden fields when toggle is clicked', async () => {
      const user = userEvent.setup();
      const fieldsWithHidden = [
        ...mockFields,
        { id: 'field-4', name: 'hidden_field', title: 'Hidden Field', uidt: 'SingleLineText', is_hidden: true },
      ];

      renderWithQueryClient(
        <CreateRecordModal {...defaultProps} fields={fieldsWithHidden} />
      );

      await user.click(screen.getByRole('button', { name: /show 1 hidden fields/i }));
      expect(screen.getByTestId('field-renderer-field-4')).toBeInTheDocument();
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
      const submitButton = screen.queryByRole('button', { name: 'Save Record' });
      expect(submitButton).not.toBeInTheDocument();
    });

    it('allows submit when user has create permissions', () => {
      vi.clearAllMocks();
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canCreateRecord: () => true,
        isBaseReadOnly: () => false,
      } as any));

      renderWithQueryClient(<CreateRecordModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'Save Record' });
      expect(submitButton).toBeDisabled();
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
      const submitButton = screen.getByRole('button', { name: 'Save Record' });

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

  describe('save button state', () => {
    it('enables save when a field value is entered', async () => {
      vi.clearAllMocks();
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canCreateRecord: () => true,
        isBaseReadOnly: () => false,
      } as any));

      const user = userEvent.setup();
      renderWithQueryClient(<CreateRecordModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'Save Record' });
      expect(submitButton).toBeDisabled();

      await user.type(screen.getByTestId('field-input-field-1'), 'New Title');
      expect(submitButton).not.toBeDisabled();
    });

    it('enables save when initial values differ from field defaults', () => {
      vi.clearAllMocks();
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canCreateRecord: () => true,
        isBaseReadOnly: () => false,
      } as any));

      renderWithQueryClient(
        <CreateRecordModal
          {...defaultProps}
          initialValues={{ 'field-2': 'Initial Description' }}
        />
      );

      const submitButton = screen.getByRole('button', { name: 'Save Record' });
      expect(submitButton).not.toBeDisabled();
    });

    it('keeps save disabled when initial values equal field defaults', () => {
      vi.clearAllMocks();
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canCreateRecord: () => true,
        isBaseReadOnly: () => false,
      } as any));
      vi.mocked(getFieldDefaultValue).mockImplementation((field: any) => {
        if (field.id === 'field-2') return 'Initial Description';
        return null;
      });

      renderWithQueryClient(
        <CreateRecordModal
          {...defaultProps}
          initialValues={{ 'field-2': 'Initial Description' }}
        />
      );

      const submitButton = screen.getByRole('button', { name: 'Save Record' });
      expect(submitButton).toBeDisabled();
    });

    it('keeps save disabled for default boolean/rating values until user changes a field', async () => {
      vi.clearAllMocks();
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canCreateRecord: () => true,
        isBaseReadOnly: () => false,
      } as any));
      vi.mocked(getFieldDefaultValue).mockImplementation((field: any) => {
        if (field.id === 'field-boolean') return false;
        if (field.id === 'field-rating') return 3;
        return null;
      });

      const user = userEvent.setup();
      const fieldsWithDefaults = [
        { id: 'field-1', name: 'title', title: 'Title', uidt: 'SingleLineText' },
        { id: 'field-boolean', name: 'active', title: 'Active', uidt: 'Checkbox' },
        { id: 'field-rating', name: 'rating', title: 'Rating', uidt: 'Rating' },
      ];

      renderWithQueryClient(
        <CreateRecordModal {...defaultProps} fields={fieldsWithDefaults} />
      );

      const submitButton = screen.getByRole('button', { name: 'Save Record' });
      expect(submitButton).toBeDisabled();

      await user.type(screen.getByTestId('field-input-field-1'), 'New Title');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('required validation', () => {
    it('shows required field error when required value is empty', async () => {
      const user = userEvent.setup();
      const requiredFields = [
        { id: 'field-req', name: 'required', title: 'Required', uidt: 'SingleLineText', required: true },
        { id: 'field-1', name: 'title', title: 'Title', uidt: 'SingleLineText' },
      ];

      renderWithQueryClient(
        <CreateRecordModal
          {...defaultProps}
          fields={requiredFields}
        />
      );

      await user.type(screen.getByTestId('field-input-field-1'), 'Some title');
      await user.click(screen.getByRole('button', { name: 'Save Record' }));

      await waitFor(() => {
        expect(screen.getByText(/Required field\(s\) must not be left empty/i)).toBeInTheDocument();
      });
      expect(upsertRowMutateAsyncMock).not.toHaveBeenCalled();
    });
  });

  describe('primary key fields', () => {
    const keyFields = [
      { id: 'field-1', name: 'title', title: 'Title', uidt: 'SingleLineText' },
      { id: 'field-code', name: 'code', column_name: 'code', title: 'Code', uidt: 'SingleLineText' },
      { id: 'field-year', name: 'yr', column_name: 'yr', title: 'Year', uidt: 'SingleLineText', hidden: true },
    ];

    beforeEach(() => {
      primaryKeyColumnIds = ['field-code', 'field-year'];
    });

    afterEach(() => {
      primaryKeyColumnIds = [];
    });

    it('shows key fields, even hidden ones, outlined in red while empty', () => {
      renderWithQueryClient(<CreateRecordModal {...defaultProps} fields={keyFields} />);

      expect(screen.getByTestId('key-field-missing-field-code')).toHaveTextContent('Required: part of the primary key');
      expect(screen.getByTestId('key-field-missing-field-year')).toBeInTheDocument();
    });

    it('names the empty key fields and does not save', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<CreateRecordModal {...defaultProps} fields={keyFields} />);

      await user.type(screen.getByTestId('field-input-field-1'), 'A title');
      await user.click(screen.getByRole('button', { name: 'Save Record' }));

      expect(await screen.findByText('Code and Year are required: they make up the primary key.')).toBeInTheDocument();
      expect(upsertRowMutateAsyncMock).not.toHaveBeenCalled();
    });

    it('saves with insert (upsert) once every key field is filled in', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<CreateRecordModal {...defaultProps} fields={keyFields} />);

      await user.type(screen.getByTestId('field-input-field-code'), 'HR');
      await user.type(screen.getByTestId('field-input-field-year'), '2026');
      expect(screen.queryByTestId('key-field-missing-field-code')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Save Record' }));

      await waitFor(() => expect(upsertRowMutateAsyncMock).toHaveBeenCalledWith({
        model_id: 'table-123',
        values: { 'field-code': 'HR', 'field-year': '2026' },
      }));
      expect(addRowMutateAsyncMock).not.toHaveBeenCalled();
    });
  });

  describe('links persistence', () => {
    it('uses relation API for links and not insertRowData', async () => {
      const user = userEvent.setup();
      const fieldsWithLinks = [
        { id: 'field-1', name: 'title', title: 'Title', uidt: 'SingleLineText' },
        {
          id: 'field-links',
          name: 'links',
          title: 'Links',
          uidt: 'links',
          type: 'links',
          meta: { relation: { with: 'table-related' } },
        },
      ];

      renderWithQueryClient(
        <CreateRecordModal
          {...defaultProps}
          fields={fieldsWithLinks}
          initialValues={{ 'field-links': [{ id: '42', title: 'Related' }] }}
        />
      );

      await user.type(screen.getByTestId('field-input-field-1'), 'Linked title');
      await user.click(screen.getByRole('button', { name: 'Save Record' }));

      await waitFor(() => {
        expect(insertRelationMutateAsyncMock).toHaveBeenCalledWith(
          expect.objectContaining({
            model_id: 'table-123',
            column_id: 'field-links',
            source_row_id: 123,
            target_row_id: 42,
            action: 'link',
          })
        );
      });

      expect(
        insertRowDataMutateAsyncMock.mock.calls.some(
          ([payload]) => payload?.column_id === 'field-links'
        )
      ).toBe(false);
    });
  });
});
