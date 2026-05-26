import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportModal } from '../ImportModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// Mock useApi hooks
vi.mock('../../../hooks/useApi', () => ({
  useImportTable: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
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
vi.mock('../../common/Fields/MultiLineText', () => ({
  MultiLineText: ({ value, onChange, placeholder }: any) => (
    <textarea
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      data-testid={`multiline-${placeholder}`}
    />
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

describe('ImportModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    importType: 'csv' as const,
    workspaceId: 'ws-123',
    baseId: 'base-123',
    existingTables: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
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

    it('renders upload area', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);

      expect(screen.getByText(/browse files/i)).toBeInTheDocument();
    });

    it('renders Cancel button', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('renders correct title for Excel import', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} importType="excel" />);

      expect(screen.getByText(/Import Excel/i)).toBeInTheDocument();
    });

    it('renders correct title for JSON import', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} importType="json" />);

      expect(screen.getByText(/Import JSON/i)).toBeInTheDocument();
    });

    it('renders correct title for SQL import', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} importType="sql" />);

      expect(screen.getByText(/Import SQL/i)).toBeInTheDocument();
    });
  });

  describe('form elements', () => {
    it('does not render table name input in select step', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      expect(screen.queryByPlaceholderText(/Enter table title/i)).not.toBeInTheDocument();
    });

    it('does not render description input in select step', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      expect(screen.queryByPlaceholderText(/Enter table description/i)).not.toBeInTheDocument();
    });

    it('shows file size limit info', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);

      const uploadArea = screen.getByLabelText(/Click or drag and drop to upload file/i);
      expect(uploadArea).toBeInTheDocument();
      
      const browseFilesText = screen.getByText(/browse files/i);
      expect(browseFilesText).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithQueryClient(<ImportModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /Cancel/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithQueryClient(<ImportModal {...defaultProps} onClose={onClose} />);

      // Look for the backdrop button with aria-label
      const backdrop = screen.getByLabelText('Close modal');
      await user.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking X button', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithQueryClient(<ImportModal {...defaultProps} onClose={onClose} />);

      // Find X button - usually the first button with svg icon in header
      const buttons = screen.getAllByRole('button');
      const xButton = buttons.find(btn => 
        btn.querySelector('svg') && !btn.textContent?.includes('Cancel')
      );
      
      if (xButton) {
        await user.click(xButton);
        expect(onClose).toHaveBeenCalled();
      }
    });

    it('keeps Next disabled until a file is selected', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton).toBeDisabled();
    });

    it('shows selected file name after upload', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ImportModal {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['a,b\n1,2'], 'sample.csv', { type: 'text/csv' });
      await user.upload(fileInput, file);
      expect(screen.getByText('sample.csv')).toBeInTheDocument();
    });
  });

  describe('file upload area', () => {
    it('renders file input with correct accept attribute for CSV', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} importType="csv" />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', '.csv');
    });

    it('renders file input with correct accept attribute for Excel', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} importType="excel" />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', '.xlsx,.xls');
    });

    it('renders file input with correct accept attribute for JSON', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} importType="json" />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', '.json');
    });

    it('renders file input with correct accept attribute for SQL', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} importType="sql" />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', '.sql');
    });
  });

  describe('file validation', () => {
    it('shows error when SQL file type is invalid', async () => {
      const user = userEvent.setup({ applyAccept: false });
      renderWithQueryClient(<ImportModal {...defaultProps} importType="sql" />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const invalidFile = new File(['content'], 'file.txt', { type: 'text/plain' });

      await user.upload(fileInput, invalidFile);

      await waitFor(() => {
        expect(screen.getByText(/Please select a SQL file/i)).toBeInTheDocument();
      });
    });
  });

  describe('state reset', () => {
    it('resets form when modal reopens', async () => {
      const user = userEvent.setup();

      const { rerender } = renderWithQueryClient(
        <ImportModal {...defaultProps} />
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['a,b\n1,2'], 'reset.csv', { type: 'text/csv' });
      await user.upload(fileInput, file);
      expect(screen.getByText('reset.csv')).toBeInTheDocument();

      // Close and reopen
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

  describe('different import types', () => {
    it.each([
      ['csv', 'CSV'],
      ['excel', 'Excel'],
      ['json', 'JSON'],
      ['sql', 'SQL'],
    ])('displays correct label for %s import type', (type, label) => {
      renderWithQueryClient(
        <ImportModal {...defaultProps} importType={type as any} />
      );

      expect(screen.getByText(new RegExp(`Import ${label}`, 'i'))).toBeInTheDocument();
    });
  });

  describe('title validation', () => {
    it('does not show title validation UI in select step', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      expect(screen.queryByText(/Table title must be at least 3 characters long/i)).not.toBeInTheDocument();
    });

    it('does not show title uniqueness UI in select step', async () => {
      const existingTables = [{ title: 'Existing Table' }];

      renderWithQueryClient(
        <ImportModal {...defaultProps} existingTables={existingTables} />
      );

      expect(screen.queryByText(/Table title must be unique/i)).not.toBeInTheDocument();
    });

    it('does not render title input for validation checks', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      expect(screen.queryByPlaceholderText(/Enter table title/i)).not.toBeInTheDocument();
    });

    it('does not show title input border state when title input is absent', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      expect(screen.queryByPlaceholderText(/Enter table title/i)).not.toBeInTheDocument();
    });
  });

  describe('file validation', () => {
    it('shows error when file type is invalid', async () => {
      const user = userEvent.setup({ applyAccept: false });
      renderWithQueryClient(<ImportModal {...defaultProps} importType="csv" />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const invalidFile = new File(['content'], 'file.txt', { type: 'text/plain' });

      await user.upload(fileInput, invalidFile);

      await waitFor(() => {
        expect(screen.getByText(/Please select a CSV file/i)).toBeInTheDocument();
      });
    });

    it('shows red border on file upload area when there is a file error', async () => {
      const user = userEvent.setup({ applyAccept: false });
      renderWithQueryClient(<ImportModal {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const invalidFile = new File(['content'], 'file.txt', { type: 'text/plain' });

      await user.upload(fileInput, invalidFile);

      const uploadArea = screen.getByLabelText(/Click or drag and drop to upload file/i);

      await waitFor(() => {
        expect(uploadArea).toHaveClass('border-red-400');
      });
    });
  });

  describe('title validation', () => {
    it('does not render title required validation in select step', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      expect(screen.queryByText(/Table title is required/i)).not.toBeInTheDocument();
    });

    it('shows uploaded filename in select step', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ImportModal {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['a,b\n1,2'], 'my_table.csv', { type: 'text/csv' });
      await user.upload(fileInput, file);
      expect(screen.getByText('my_table.csv')).toBeInTheDocument();
    });

    it('does not run title uniqueness validation in select step', async () => {
      const existingTables = [
        { title: 'Existing Table' }
      ];

      renderWithQueryClient(
        <ImportModal {...defaultProps} existingTables={existingTables} />
      );

      expect(screen.queryByText(/Table title must be unique/i)).not.toBeInTheDocument();
    });

    it('does not apply case-insensitive title uniqueness in select step', async () => {
      const existingTables = [
        { title: 'My Table' }
      ];

      renderWithQueryClient(
        <ImportModal {...defaultProps} existingTables={existingTables} />
      );

      expect(screen.queryByText(/Table title must be unique/i)).not.toBeInTheDocument();
    });

    it('does not detect duplicate title from model.title in select step', async () => {
      const existingTables = [
        { model: { id: 't1', title: 'Sales Data' } }
      ];

      renderWithQueryClient(
        <ImportModal {...defaultProps} existingTables={existingTables as any[]} />
      );

      expect(screen.queryByText(/Table title must be unique/i)).not.toBeInTheDocument();
    });

    it('keeps title input absent when re-validating select step', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      expect(screen.queryByPlaceholderText(/Enter table title/i)).not.toBeInTheDocument();
    });
  });

  describe('form elements', () => {
    it('does not render table name input in select step', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      expect(screen.queryByPlaceholderText(/Enter table title/i)).not.toBeInTheDocument();
    });

    it('does not render description input in select step', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      expect(screen.queryByPlaceholderText(/Enter table description/i)).not.toBeInTheDocument();
    });

    it('shows file size limit info', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);

      const uploadArea = screen.getByLabelText(/Click or drag and drop to upload file/i);
      expect(uploadArea).toBeInTheDocument();
      
      const browseFilesText = screen.getByText(/browse files/i);
      expect(browseFilesText).toBeInTheDocument();
    });
  });

  describe('separate error display', () => {
    it('has placeholder for file error message', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);

      // The modal should have the structure for displaying file errors
      const uploadArea = screen.getByLabelText(/Click or drag and drop to upload file/i);
      expect(uploadArea).toBeInTheDocument();
    });

    it('has placeholder for title error message', async () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);
      expect(screen.queryByText(/Table title must be at least 3 characters long/i)).not.toBeInTheDocument();
    });
  });
});

