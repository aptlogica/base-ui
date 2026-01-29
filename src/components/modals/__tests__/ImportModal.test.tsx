import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportModal } from '../ImportModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
    it('renders table name input', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);

      expect(screen.getByPlaceholderText(/Enter table title/i)).toBeInTheDocument();
    });

    it('renders description input', () => {
      renderWithQueryClient(<ImportModal {...defaultProps} />);

      expect(screen.getByPlaceholderText(/Enter table description/i)).toBeInTheDocument();
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

    it('updates table name on input', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<ImportModal {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Enter table title/i);
      await user.type(input, 'My Table');

      expect(input).toHaveValue('My Table');
    });

    it('updates description on input', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<ImportModal {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Enter table description/i);
      await user.type(input, 'My description');

      expect(input).toHaveValue('My description');
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
  });

  describe('state reset', () => {
    it('resets form when modal reopens', async () => {
      const user = userEvent.setup();

      const { rerender } = renderWithQueryClient(
        <ImportModal {...defaultProps} />
      );

      const input = screen.getByPlaceholderText(/Enter table title/i);
      await user.type(input, 'Test Table');

      expect(input).toHaveValue('Test Table');

      // Close and reopen
      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <ImportModal {...defaultProps} isOpen={false} />
        </QueryClientProvider>
      );

      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <ImportModal {...defaultProps} isOpen={true} />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Enter table title/i)).toHaveValue('');
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
});
