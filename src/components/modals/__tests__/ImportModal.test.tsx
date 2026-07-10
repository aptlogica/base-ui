import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportModal } from '../ImportModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ImportColumnMapping, ImportPreview } from '../importer/ImportTypes';
import { validateTableName } from '../../../utils/nameValidation';

const {
  mockMutateAsync,
  mockToastError,
  mockNavigate,
  mockBuildImportPreview,
  mockBuildInitialMappings,
  mockUseImportData,
} = vi.hoisted(() => {
  const mockMutateAsync = vi.fn();
  return {
    mockMutateAsync,
    mockToastError: vi.fn(),
    mockNavigate: vi.fn(),
    mockBuildImportPreview: vi.fn(),
    mockBuildInitialMappings: vi.fn(),
    mockUseImportData: vi.fn(() => ({
      mutateAsync: mockMutateAsync,
      isPending: false,
    })),
  };
});

vi.mock('../../../hooks/useApi', () => ({
  useImportData: () => mockUseImportData(),
}));

vi.mock('../../../utils/nameValidation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../utils/nameValidation')>();
  return {
    ...actual,
    validateTableName: vi.fn((...args: Parameters<typeof actual.validateTableName>) =>
      actual.validateTableName(...args)
    ),
  };
});

vi.mock('../../common/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: mockToastError,
    show: vi.fn(),
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/workspace/ws-123', state: { existing: true } }),
  };
});

vi.mock('../importer/importPreviewBuilder', () => ({
  buildImportPreview: (...args: unknown[]) => mockBuildImportPreview(...args),
  buildInitialMappings: (...args: unknown[]) => mockBuildInitialMappings(...args),
}));

vi.mock('../importer/ImportCleanupOptions', () => ({
  ImportCleanupOptions: ({
    value,
    onChange,
  }: {
    value: {
      removeDuplicateRecords: boolean;
      trimExtraSpaces: boolean;
      removeEmptyRows: boolean;
    };
    onChange: (next: typeof value) => void;
  }) => (
    <div data-testid="cleanup-options">
      <button
        type="button"
        onClick={() =>
          onChange({
            ...value,
            removeDuplicateRecords: !value.removeDuplicateRecords,
            trimExtraSpaces: true,
            removeEmptyRows: true,
          })
        }
      >
        Toggle cleanup
      </button>
    </div>
  ),
}));

vi.mock('../importer/ImportDataPreviewGrid', () => ({
  ImportDataPreviewGrid: () => <div data-testid="preview-grid">Preview grid</div>,
}));

vi.mock('../importer/ImportColumnMapper', () => ({
  ImportColumnMapper: ({
    preview,
    mappings,
    onChange,
    primaryKey,
    primaryColumnError,
    onPrimaryKeyChange,
  }: {
    preview: ImportPreview;
    mappings: Record<string, ImportColumnMapping>;
    onChange: (key: string, patch: Partial<ImportColumnMapping>) => void;
    primaryKey: string | null;
    primaryColumnError?: string | null;
    onPrimaryKeyChange: (key: string | null) => void;
  }) => (
    <div data-testid="column-mapper">
      {primaryColumnError ? <div data-testid="primary-error">{primaryColumnError}</div> : null}
      <select
        data-testid="primary-key-select"
        value={primaryKey || ''}
        onChange={(event) => onPrimaryKeyChange(event.target.value || null)}
      >
        <option value="">none</option>
        {preview.columns.map((column) => (
          <option key={column.key} value={column.label}>
            {column.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onPrimaryKeyChange('Missing Column')}
      >
        Set invalid primary
      </button>
      {preview.columns.map((column) => {
        const mapping = mappings[column.key];
        const include = mapping?.include !== false;
        return (
          <div key={column.key} data-testid={`mapping-row-${column.key}`}>
            <input
              type="checkbox"
              aria-label={`include-${column.key}`}
              checked={include}
              onChange={() => onChange(column.key, { include: !include })}
            />
            <input
              aria-label={`default-${column.key}`}
              value={mapping?.defaultValue || ''}
              onChange={(event) => onChange(column.key, { defaultValue: event.target.value })}
            />
            <select
              aria-label={`type-${column.key}`}
              value={mapping?.fieldType || 'text'}
              onChange={(event) => onChange(column.key, { fieldType: event.target.value })}
            >
              <option value="text">text</option>
              <option value="boolean">boolean</option>
              <option value="rating">rating</option>
              <option value="number">number</option>
            </select>
          </div>
        );
      })}
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
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>
  );
};

const createPreview = (): ImportPreview => ({
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'active', label: 'Active' },
    { key: 'score', label: 'Score' },
  ],
  rows: [
    { name: 'Alice', active: 'true', score: '4' },
    { name: 'Bob', active: 'false', score: '2' },
  ],
  totalRows: 2,
});

const createMappings = (): Record<string, ImportColumnMapping> => ({
  name: {
    sourceName: 'Name',
    include: true,
    fieldType: 'text',
    defaultValue: 'fallback',
  },
  active: {
    sourceName: 'Active',
    include: true,
    fieldType: 'boolean',
    defaultValue: 'yes',
  },
  score: {
    sourceName: 'Score',
    include: true,
    fieldType: 'rating',
    defaultValue: '9',
  },
});

const uploadCsv = async (fileName = 'sample.csv', content = 'a,b\n1,2') => {
  const user = userEvent.setup();
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File([content], fileName, { type: 'text/csv' });
  await user.upload(fileInput, file);
  return { user, file };
};

const goToReviewStep = async () => {
  const { user } = await uploadCsv();
  await user.click(screen.getByRole('button', { name: /Next/i }));
  await screen.findByText(/Review and clean your data/i);
  return user;
};

describe('ImportModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    importType: 'csv' as const,
    workspaceId: 'ws-123',
    baseId: 'base-123',
    existingTables: [] as any[],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseImportData.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
    mockBuildImportPreview.mockResolvedValue(createPreview());
    mockBuildInitialMappings.mockReturnValue(createMappings());
    mockMutateAsync.mockResolvedValue({
      data: {
        data: {
          model: {
            id: 'table-1',
            title: 'Imported Table',
            workspace_id: 'ws-123',
            base_id: 'base-123',
          },
          views: [{ id: 'view-1' }],
          import_stats: {
            total_rows: 2,
            total_columns: 3,
            error_rows: 0,
            empty_rows: 0,
            duplicate_rows: 0,
            empty_rows_skipped: 0,
            duplicates_removed: 0,
            error_rows_file_path: '',
            error_rows_file_content: '',
          },
        },
      },
    });
  });

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = renderWithQueryClient(
        <ImportModal {...defaultProps} isOpen={false} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders the modal when isOpen is true', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);

      expect(screen.getByText(/Import CSV/i)).toBeInTheDocument();
    });

    it.each([
      ['csv', 'CSV', '.csv'],
      ['excel', 'Excel', '.xlsx,.xls'],
      ['json', 'JSON', '.json'],
      ['sql', 'SQL', '.sql'],
      ['airtable', 'Airtable', '.csv,.json'],
      ['nocodb', 'NocoDB', '.csv,.json'],
    ] as const)('renders %s import type correctly', (type, label, accept) => {
      renderWithQueryClient(<ImportModal {...defaultProps} importType={type} />);

      expect(screen.getByText(new RegExp(`Import ${label}`, 'i'))).toBeInTheDocument();
      expect(document.querySelector('input[type="file"]')).toHaveAttribute('accept', accept);
    });

    it('renders Cancel and disabled Next buttons', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();
    });
  });

  describe('file selection', () => {
    it('shows selected file name and size after upload', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      await uploadCsv('sample.csv');

      expect(screen.getByText('sample.csv')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next/i })).toBeEnabled();
    });

    it('shows 0 Bytes for empty files', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      await uploadCsv('empty.csv', '');

      expect(screen.getByText('0 Bytes')).toBeInTheDocument();
    });

    it('removes selected file when Remove file is clicked', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const { user } = await uploadCsv('remove-me.csv');

      await user.click(screen.getByRole('button', { name: /Remove file/i }));

      expect(screen.queryByText('remove-me.csv')).not.toBeInTheDocument();
      expect(screen.getByText(/browse files/i)).toBeInTheDocument();
    });

    it('shows error for invalid file extension', async () => {
      const user = userEvent.setup({ applyAccept: false });
      renderWithQueryClient(<ImportModal {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, new File(['content'], 'file.txt', { type: 'text/plain' }));

      expect(await screen.findByText(/Please select a CSV file/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Click or drag and drop to upload file/i)).toHaveClass(
        'border-red-400'
      );
    });

    it('shows error when file exceeds max size', async () => {
      const user = userEvent.setup({ applyAccept: false });
      renderWithQueryClient(<ImportModal {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const oversized = new File([new ArrayBuffer(2 * 1024 * 1024 + 1)], 'big.csv', {
        type: 'text/csv',
      });
      await user.upload(fileInput, oversized);

      expect(
        await screen.findByText(/File size exceeds 2 MB/i)
      ).toBeInTheDocument();
    });

    it('caps long filenames when deriving title', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const longName = `${'a'.repeat(60)}.csv`;
      await uploadCsv(longName);

      expect(screen.getByText(longName)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next/i })).toBeEnabled();
    });

    it('accepts files via drag and drop', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const uploadArea = screen.getByLabelText(/Click or drag and drop to upload file/i);
      const file = new File(['a,b\n1,2'], 'dropped.csv', { type: 'text/csv' });

      fireEvent.dragOver(uploadArea);
      expect(uploadArea).toHaveClass('border-brand-500');

      fireEvent.dragLeave(uploadArea);
      fireEvent.drop(uploadArea, {
        dataTransfer: { files: [file] },
      });

      expect(await screen.findByText('dropped.csv')).toBeInTheDocument();
    });

    it('ignores drop events without files', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const uploadArea = screen.getByLabelText(/Click or drag and drop to upload file/i);

      fireEvent.drop(uploadArea, {
        dataTransfer: { files: [] },
      });

      expect(screen.getByText(/browse files/i)).toBeInTheDocument();
    });

    it('opens file picker on Enter and Space', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const uploadArea = screen.getByLabelText(/Click or drag and drop to upload file/i);
      const clickSpy = vi.fn();
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fileInput.click = clickSpy;

      fireEvent.keyDown(uploadArea, { key: 'Enter' });
      fireEvent.keyDown(uploadArea, { key: ' ' });

      expect(clickSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('close interactions', () => {
    it('calls onClose from Cancel, backdrop, X, and Escape', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderWithQueryClient(<ImportModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /Cancel/i }));
      await user.click(screen.getByLabelText('Close modal'));
      await user.click(screen.getByLabelText('Close'));
      fireEvent.keyDown(screen.getByText(/Import CSV/i).closest('.fixed')!, {
        key: 'Escape',
      });

      expect(onClose).toHaveBeenCalledTimes(4);
    });

    it('does not close while importing', async () => {
      mockUseImportData.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      });
      const onClose = vi.fn();
      renderWithQueryClient(<ImportModal {...defaultProps} onClose={onClose} />);

      await userEvent.setup().click(screen.getByLabelText('Close modal'));
      await userEvent.setup().click(screen.getByLabelText('Close'));

      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByText(/Uploading.../i)).toBeInTheDocument();
    });
  });

  describe('state reset', () => {
    it('resets form when modal reopens', async () => {
      const { rerender } = renderWithQueryClient(<ImportModal {...defaultProps} />);
      await uploadCsv('reset.csv');
      expect(screen.getByText('reset.csv')).toBeInTheDocument();

      rerender(
        <MemoryRouter>
          <QueryClientProvider client={createTestQueryClient()}>
            <ImportModal {...defaultProps} isOpen={false} />
          </QueryClientProvider>
        </MemoryRouter>
      );

      rerender(
        <MemoryRouter>
          <QueryClientProvider client={createTestQueryClient()}>
            <ImportModal {...defaultProps} isOpen={true} />
          </QueryClientProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText('reset.csv')).not.toBeInTheDocument();
      });
    });
  });

  describe('preview / review step', () => {
    it('moves to review step after successful preview build', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      await goToReviewStep();

      expect(screen.getByTestId('column-mapper')).toBeInTheDocument();
      expect(screen.getByTestId('preview-grid')).toBeInTheDocument();
      expect(screen.getByTestId('cleanup-options')).toBeInTheDocument();
      expect(mockBuildImportPreview).toHaveBeenCalled();
      expect(mockBuildInitialMappings).toHaveBeenCalled();
    });

    it('shows toast and error when preview build fails', async () => {
      mockBuildImportPreview.mockRejectedValueOnce(new Error('Broken CSV'));
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const { user } = await uploadCsv();

      await user.click(screen.getByRole('button', { name: /Next/i }));

      expect(await screen.findByText('Broken CSV')).toBeInTheDocument();
      expect(mockToastError).toHaveBeenCalledWith('Broken CSV');
      expect(screen.getByText(/Import CSV/i)).toBeInTheDocument();
    });

    it('uses fallback preview error message when rejection has no message', async () => {
      mockBuildImportPreview.mockRejectedValueOnce({});
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const { user } = await uploadCsv();

      await user.click(screen.getByRole('button', { name: /Next/i }));

      expect(await screen.findByText(/Failed to read file preview/i)).toBeInTheDocument();
    });

    it('returns to select step when Back is clicked', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const user = await goToReviewStep();

      await user.click(screen.getByRole('button', { name: /Back/i }));

      expect(screen.getByText(/Import CSV/i)).toBeInTheDocument();
      expect(screen.getByText('sample.csv')).toBeInTheDocument();
    });

    it('auto-includes excluded column when selected as primary key', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const user = await goToReviewStep();

      await user.click(screen.getByLabelText('include-score'));
      expect(screen.getByLabelText('include-score')).not.toBeChecked();

      await user.selectOptions(screen.getByTestId('primary-key-select'), 'Score');

      expect(screen.getByLabelText('include-score')).toBeChecked();
    });

    it('clears primary key when primary column is excluded', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const user = await goToReviewStep();

      expect(screen.getByTestId('primary-key-select')).toHaveValue('Name');
      await user.click(screen.getByLabelText('include-name'));

      expect(screen.getByTestId('primary-key-select')).toHaveValue('');
      expect(screen.getByTestId('primary-error')).toHaveTextContent(
        'Primary column cannot be excluded.'
      );
    });

    it('clears primary error when default value is updated for primary column', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const user = await goToReviewStep();

      await user.clear(screen.getByLabelText('default-name'));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));
      expect(await screen.findByTestId('primary-error')).toHaveTextContent(
        'Primary column cannot be empty.'
      );

      await user.type(screen.getByLabelText('default-name'), 'id');

      await waitFor(() => {
        expect(screen.queryByTestId('primary-error')).not.toBeInTheDocument();
      });
    });

    it('updates cleanup options from the cleanup panel', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const user = await goToReviewStep();

      await user.click(screen.getByRole('button', { name: /Toggle cleanup/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());
      const payload = mockMutateAsync.mock.calls[0][0];
      expect(payload.config.settings).toEqual({
        remove_duplicate_records: true,
        trim_extra_spaces: true,
        remove_empty_rows: true,
      });
    });
  });

  describe('submit validation', () => {
    it('requires a file when form is submitted on select step', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);

      fireEvent.submit(document.getElementById('import-form')!);

      expect(await screen.findByText(/Please select a file to import/i)).toBeInTheDocument();
    });

    it('requires workspace id', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} workspaceId="" />);
      await goToReviewStep();

      fireEvent.submit(document.getElementById('import-form')!);

      await waitFor(() => expect(mockMutateAsync).not.toHaveBeenCalled());
      expect(screen.getByRole('button', { name: /Confirm/i })).toBeInTheDocument();
    });

    it('requires at least one included column', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const user = await goToReviewStep();

      await user.click(screen.getByLabelText('include-name'));
      await user.click(screen.getByLabelText('include-active'));
      await user.click(screen.getByLabelText('include-score'));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => expect(mockMutateAsync).not.toHaveBeenCalled());
      expect(screen.getByRole('button', { name: /Confirm/i })).toBeInTheDocument();
    });

    it('requires primary column to be included', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const user = await goToReviewStep();

      await user.click(screen.getByRole('button', { name: /Set invalid primary/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      expect(await screen.findByTestId('primary-error')).toHaveTextContent(
        'Primary column must be included.'
      );
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('requires primary column default value', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const user = await goToReviewStep();

      await user.clear(screen.getByLabelText('default-name'));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      expect(await screen.findByText(/Primary column cannot be empty/i)).toBeInTheDocument();
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('successful import', () => {
    it('submits payload with normalized field meta and navigates to table route', async () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      renderWithQueryClient(
        <ImportModal {...defaultProps} onClose={onClose} onSuccess={onSuccess} />
      );
      const user = await goToReviewStep();

      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());
      const args = mockMutateAsync.mock.calls[0][0];
      expect(args.base_id).toBe('base-123');
      expect(args.workspace_id).toBe('ws-123');
      expect(args.order_index).toBe(0);
      expect(args.primary_column).toBe('Name');
      expect(args.config.columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            column_name: 'Name',
            uidt: 'text',
            meta: expect.objectContaining({ defaultValue: 'fallback' }),
          }),
          expect.objectContaining({
            column_name: 'Active',
            uidt: 'boolean',
            meta: expect.objectContaining({ defaultValue: true }),
          }),
          expect.objectContaining({
            column_name: 'Score',
            uidt: 'rating',
            meta: expect.objectContaining({ ratingDefault: 5 }),
          }),
        ])
      );

      expect(onClose).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        '/workspace/ws-123/base/base-123/table/table-1/view-1',
        expect.objectContaining({
          state: expect.objectContaining({
            existing: true,
            importSummary: expect.objectContaining({
              totalRows: 2,
              columns: 3,
              tableTitle: 'Imported Table',
            }),
          }),
        })
      );
    });

    it('omits base_id when not provided and uses existingTables length for order_index', async () => {
      renderWithQueryClient(
        <ImportModal
          {...defaultProps}
          baseId={undefined}
          existingTables={[{ id: 't1' }, { id: 't2' }] as any[]}
        />
      );
      const user = await goToReviewStep();
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());
      const args = mockMutateAsync.mock.calls[0][0];
      expect(args.base_id).toBeUndefined();
      expect(args.order_index).toBe(2);
    });

    it('navigates to current path when import response has no table route', async () => {
      mockMutateAsync.mockResolvedValueOnce({
        data: {
          model: { title: 'Partial' },
          import_stats: { total_rows: 1, total_columns: 1 },
        },
      });
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const user = await goToReviewStep();
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(
          '/workspace/ws-123',
          expect.objectContaining({
            replace: true,
            state: expect.objectContaining({
              importSummary: expect.objectContaining({ tableTitle: 'Partial' }),
            }),
          })
        )
      );
    });

    it('handles bare response body and progress callbacks', async () => {
      mockMutateAsync.mockImplementationOnce(async (payload: any) => {
        payload.onProgress({ loaded: 50, total: 100 });
        payload.onProgress({ loaded: 5000, total: 0 });
        return {
          model: {
            id: 'table-2',
            title: 'Bare',
            workspace_id: 'ws-123',
            base_id: 'base-123',
          },
          views: [{ id: 'view-2' }],
        };
      });
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const user = await goToReviewStep();
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(
          '/workspace/ws-123/base/base-123/table/table-2/view-2',
          expect.any(Object)
        )
      );
    });

    it('normalizes boolean and rating default values in payload', async () => {
      mockBuildInitialMappings.mockReturnValue({
        name: {
          sourceName: 'Name',
          include: true,
          fieldType: 'boolean',
          defaultValue: '1',
        },
        active: {
          sourceName: 'Active',
          include: true,
          fieldType: 'boolean',
          defaultValue: 'no',
        },
        score: {
          sourceName: 'Score',
          include: true,
          fieldType: 'rating',
          defaultValue: 'abc',
        },
      });
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const user = await goToReviewStep();
      await user.selectOptions(screen.getByTestId('primary-key-select'), 'none');
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());
      const columns = mockMutateAsync.mock.calls[0][0].config.columns;
      expect(columns[0].meta.defaultValue).toBe(true);
      expect(columns[1].meta.defaultValue).toBe(false);
      expect(columns[2].meta.ratingDefault).toBe(0);
    });

    it('excludes columns with include false from payload and skips empty text defaults', async () => {
      mockBuildInitialMappings.mockReturnValue({
        name: {
          sourceName: 'Name',
          include: true,
          fieldType: 'text',
          defaultValue: '',
        },
        active: {
          sourceName: 'Active',
          include: false,
          fieldType: 'text',
          defaultValue: 'x',
        },
        score: {
          sourceName: 'Score',
          include: true,
          fieldType: 'number',
          defaultValue: '3',
        },
      });
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const user = await goToReviewStep();
      await user.selectOptions(screen.getByTestId('primary-key-select'), 'none');
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());
      const columns = mockMutateAsync.mock.calls[0][0].config.columns;
      expect(columns).toHaveLength(2);
      expect(columns.find((c: any) => c.column_name === 'Active')).toBeUndefined();
      expect(columns[0].meta.defaultValue).toBeUndefined();
      expect(columns[1].meta).toEqual(expect.objectContaining({ defaultValue: '3' }));
    });
  });

  describe('import errors', () => {
    it('shows toast when import fails', async () => {
      mockMutateAsync.mockRejectedValueOnce(new Error('Upload failed'));
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const user = await goToReviewStep();

      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Upload failed');
      });
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: /Confirm/i })).toBeInTheDocument();
    });

    it('uses fallback error message when rejection has no message', async () => {
      mockMutateAsync.mockRejectedValueOnce({});
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const user = await goToReviewStep();

      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Failed to generate import payload');
      });
    });

    it('ignores duplicate submit while already submitting', async () => {
      let resolveMutation: (value: unknown) => void = () => undefined;
      mockMutateAsync.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveMutation = resolve;
          })
      );
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const user = await goToReviewStep();

      await user.click(screen.getByRole('button', { name: /Confirm/i }));
      await screen.findByText(/Importing.../i);
      fireEvent.submit(document.getElementById('import-form')!);

      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      resolveMutation({
        data: {
          data: {
            model: {
              id: 'table-1',
              title: 'Imported Table',
              workspace_id: 'ws-123',
              base_id: 'base-123',
            },
            views: [{ id: 'view-1' }],
            import_stats: {},
          },
        },
      });
      await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
    });
  });

  describe('title validation side effects', () => {
    it('validates short derived titles without blocking Next', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      await uploadCsv('ab.csv');

      expect(screen.getByRole('button', { name: /Next/i })).toBeEnabled();
    });

    it('validates empty derived titles from extension-only filenames', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      await uploadCsv('.csv');

      expect(screen.getByText('.csv')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next/i })).toBeEnabled();
    });

    it('maps unknown table-name validation errors to a fallback message', async () => {
      vi.mocked(validateTableName).mockReturnValueOnce({
        isValid: false,
      });
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      await uploadCsv('custom.csv');

      expect(screen.getByText('custom.csv')).toBeInTheDocument();
      expect(validateTableName).toHaveBeenCalled();
    });

    it('validates duplicate derived titles against existing tables', async () => {
      renderWithQueryClient(
        <ImportModal
          {...defaultProps}
          existingTables={[{ title: 'Sales Data' }]}
        />
      );
      await uploadCsv('Sales Data.csv');

      expect(screen.getByText('Sales Data.csv')).toBeInTheDocument();
    });
  });
});
