import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditRecordModal from '../EditRecordModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBaseAccess } from '../../../hooks/useBaseAccess';

const updateRowDataMutateAsyncMock = vi.fn(() => Promise.resolve({}));
const addAttachmentMutateAsyncMock = vi.fn(() => Promise.resolve({}));
const removeAttachmentsMutateAsyncMock = vi.fn(() => Promise.resolve({}));
const insertRelationMutateAsyncMock = vi.fn(() => Promise.resolve({}));

// Mock hooks
vi.mock('../../../hooks/useApi', () => ({
  useUpdateRowData: vi.fn(() => ({
    mutateAsync: updateRowDataMutateAsyncMock,
    isPending: false,
  })),
  useAddAttachment: vi.fn(() => ({
    mutateAsync: addAttachmentMutateAsyncMock,
    isPending: false,
  })),
  useRemoveAttachments: vi.fn(() => ({
    mutateAsync: removeAttachmentsMutateAsyncMock,
    isPending: false,
  })),
  useInsertRelationData: vi.fn(() => ({
    mutateAsync: insertRelationMutateAsyncMock,
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
  default: ({ field, value, onChange, persistImmediately }: any) => (
    <div data-testid={`field-renderer-${field.id}`}>
      <label>{field.title || field.name}</label>
      {(field.type === 'attachment' || field.uidt === 'attachment') && (
        <div data-testid={`attachment-persist-${field.id}`}>
          {String(persistImmediately)}
        </div>
      )}
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

vi.mock('../../common/Toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock('../../../utils/standardFieldUtils', () => ({
  createFieldRendererProps: vi.fn((field, value, onChange, options = {}) => ({
    field,
    value,
    onChange,
    ...options,
  })),
  getFieldDisplayName: vi.fn((field) => field.title || field.name),
  getFieldDefaultValue: vi.fn(() => null),
  getStandardFieldType: vi.fn((type) => type),
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
      // Initial values population may work differently in current implementation
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

      const xButton = screen.getByRole('button', { name: 'Close' });
      await user.click(xButton);
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      const { container } = renderWithQueryClient(
        <EditRecordModal {...defaultProps} onClose={onClose} />
      );

      // Look for the actual backdrop button with aria-label
      const backdrop = screen.getByLabelText('Close modal');
      await user.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close modal on Escape key press', () => {
      const onClose = vi.fn();

      const { container } = renderWithQueryClient(
        <EditRecordModal {...defaultProps} onClose={onClose} />
      );

      const backdrop = container.querySelector('.bg-modal-backdrop');
      fireEvent.keyDown(backdrop!, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('actions menu', () => {
    it('renders more options button', () => {
      renderWithQueryClient(<EditRecordModal {...defaultProps} />);

      const moreButton = screen.getByLabelText('Record menu');
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

      const moreButton = screen.getByLabelText('Record menu');
      await user.click(moreButton);

      await waitFor(() => {
        expect(screen.getByText(/Delete record/i)).toBeInTheDocument();
      });
    });

    it('does not render duplicate option in menu', async () => {
      const user = userEvent.setup();
      const onDuplicate = vi.fn();

      renderWithQueryClient(
        <EditRecordModal
          {...defaultProps}
          onDuplicate={onDuplicate}
          onDelete={vi.fn()}
        />
      );

      const moreButton = screen.getByLabelText('Record menu');
      await user.click(moreButton);

      await waitFor(() => {
        expect(screen.queryByText(/Duplicate/i)).not.toBeInTheDocument();
      });
      expect(onDuplicate).not.toHaveBeenCalled();
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

      const moreButton = screen.getByLabelText('Record menu');
      await user.click(moreButton);

      const deleteOption = await screen.findByText(/Delete record/i);
      await user.click(deleteOption);

      expect(onDelete).toHaveBeenCalledWith('record-123');
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

  describe('read-only access', () => {
    it('hides submit button when user cannot update', () => {
      vi.clearAllMocks();
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canUpdateRecord: () => false,
        canDeleteRecord: () => false,
        isBaseReadOnly: () => true,
      } as any));

      renderWithQueryClient(<EditRecordModal {...defaultProps} />);

      // When user cannot update, the footer with buttons is not rendered
      const updateButton = screen.queryByRole('button', { name: 'Save changes' });
      expect(updateButton).not.toBeInTheDocument();
    });

    it('hides delete button when user cannot delete', () => {
      vi.clearAllMocks();
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canUpdateRecord: () => true,
        canDeleteRecord: () => false,
        isBaseReadOnly: () => false,
      } as any));

      renderWithQueryClient(<EditRecordModal {...defaultProps} onDelete={vi.fn()} />);

      const deleteButton = screen.queryByRole('button', { name: /delete/i });
      expect(deleteButton).not.toBeInTheDocument();
    });

    it('shows delete button when user can delete', async () => {
      const user = userEvent.setup();
      
      vi.clearAllMocks();
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canUpdateRecord: () => true,
        canDeleteRecord: () => true,
        isBaseReadOnly: () => false,
      } as any));

      renderWithQueryClient(<EditRecordModal {...defaultProps} onDelete={vi.fn()} />);

      // Click the menu button to open the dropdown
      const menuButton = screen.getByLabelText('Record menu');
      await user.click(menuButton);

      // Now find the delete button in the menu
      const deleteButton = await screen.findByText(/Delete record/i);
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('form field rendering', () => {
    it('renders all fields from the record', () => {
      vi.clearAllMocks();
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canUpdateRecord: () => true,
        canDeleteRecord: () => true,
        isBaseReadOnly: () => false,
      } as any));

      renderWithQueryClient(<EditRecordModal {...defaultProps} />);

      // Field renderer should be present for field-1
      expect(screen.getByTestId('field-renderer-field-1')).toBeInTheDocument();
    });

    it('does not render title field badge', () => {
      vi.clearAllMocks();
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canUpdateRecord: () => true,
        canDeleteRecord: () => true,
        isBaseReadOnly: () => false,
      } as any));

      renderWithQueryClient(<EditRecordModal {...defaultProps} />);

      // The title badge should not exist
      expect(screen.queryByText('Title Field')).not.toBeInTheDocument();
    });

    it('passes persistImmediately=false to attachment fields', () => {
      const fieldsWithAttachment = [
        ...mockFields,
        { id: 'field-4', name: 'files', title: 'Files', uidt: 'attachment', type: 'attachment' },
      ];

      renderWithQueryClient(
        <EditRecordModal
          {...defaultProps}
          fields={fieldsWithAttachment}
          initialValues={{
            ...defaultProps.initialValues,
            'field-4': [{ id: 'att-1', url: '/files/1.png', title: '1.png' }],
          }}
        />
      );

      expect(screen.getByTestId('attachment-persist-field-4')).toHaveTextContent('false');
    });
  });

  describe('accessibility', () => {
    it('has proper button types', () => {
      vi.clearAllMocks();
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canUpdateRecord: () => true,
        canDeleteRecord: () => true,
        isBaseReadOnly: () => false,
      } as any));

      renderWithQueryClient(<EditRecordModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      const submitButton = screen.getByRole('button', { name: 'Save changes' });

      expect(cancelButton).toHaveAttribute('type', 'button');
      expect(submitButton).toHaveAttribute('type', 'button');
    });
  });

  describe('save button state', () => {
    it('disables save when no values are changed', () => {
      vi.clearAllMocks();
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canUpdateRecord: () => true,
        canDeleteRecord: () => true,
        isBaseReadOnly: () => false,
      } as any));

      renderWithQueryClient(<EditRecordModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'Save changes' });
      expect(submitButton).toBeDisabled();
    });

    it('enables save when a field value is updated', async () => {
      vi.clearAllMocks();
      vi.mocked(useBaseAccess).mockImplementation(() => ({
        canUpdateRecord: () => true,
        canDeleteRecord: () => true,
        isBaseReadOnly: () => false,
      } as any));

      const user = userEvent.setup();
      renderWithQueryClient(<EditRecordModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'Save changes' });
      expect(submitButton).toBeDisabled();

      await user.clear(screen.getByTestId('field-input-field-1'));
      await user.type(screen.getByTestId('field-input-field-1'), 'Updated Title');

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('required validation', () => {
    it('shows required field error when required value is empty', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const fieldsWithRequired = [
        { id: 'field-req', name: 'required', title: 'Required', uidt: 'SingleLineText', required: true },
        { id: 'field-1', name: 'title', title: 'Title', uidt: 'SingleLineText' },
      ];

      renderWithQueryClient(
        <EditRecordModal
          {...defaultProps}
          onClose={onClose}
          fields={fieldsWithRequired}
          initialValues={{ 'field-1': 'Existing Title', 'field-req': '' }}
        />
      );

      await user.clear(screen.getByTestId('field-input-field-1'));
      await user.type(screen.getByTestId('field-input-field-1'), 'Updated Title');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(screen.getByText(/Required field\(s\) must not be left empty/i)).toBeInTheDocument();
      });
      expect(updateRowDataMutateAsyncMock).not.toHaveBeenCalled();
    });
  });

  describe('links persistence', () => {
    it('uses relation API for links update and not row update payload', async () => {
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
        <EditRecordModal
          {...defaultProps}
          recordId="123"
          fields={fieldsWithLinks}
          initialValues={{
            'field-1': 'Existing Title',
            'field-links': [{ id: '100', title: 'Existing linked record' }],
          }}
        />
      );

      await user.clear(screen.getByTestId('field-input-field-links'));
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(insertRelationMutateAsyncMock).toHaveBeenCalledWith(
          expect.objectContaining({
            model_id: 'table-123',
            column_id: 'field-links',
            source_row_id: 123,
            target_row_id: 100,
            action: 'unlink',
          })
        );
      });

      expect(
        updateRowDataMutateAsyncMock.mock.calls.some(
          ([payload]) => Boolean(payload?.values?.['field-links'])
        )
      ).toBe(false);
    });
  });
});

