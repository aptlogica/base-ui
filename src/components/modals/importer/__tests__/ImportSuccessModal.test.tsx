import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportSuccessModal, type ImportSuccessSummary } from '../ImportSuccessModal';

vi.mock('lucide-react', () => ({
  ArrowRight: () => <span data-testid="arrow-right-icon" />,
  Check: () => <span data-testid="check-icon" />,
  X: () => <span data-testid="close-icon" />,
}));

const createSummary = (overrides?: Partial<ImportSuccessSummary>): ImportSuccessSummary => ({
  totalRows: 100,
  columns: 5,
  errorRows: 2,
  emptyRows: 3,
  duplicateRows: 1,
  emptyRowsSkipped: 3,
  duplicatesRemoved: 1,
  ...overrides,
});

describe('ImportSuccessModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Visibility', () => {
    it.each<{
      scenario: string;
      open: boolean;
      summary: ImportSuccessSummary | null;
    }>([
      { scenario: 'open is false', open: false, summary: createSummary() },
      { scenario: 'summary is null', open: true, summary: null },
    ])('should render nothing when $scenario', ({ open, summary }) => {
      const { container } = render(
        <ImportSuccessModal open={open} summary={summary} onClose={mockOnClose} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('should render modal when open and summary is provided', () => {
      render(<ImportSuccessModal open={true} summary={createSummary()} onClose={mockOnClose} />);

      expect(screen.getByRole('dialog', { name: 'Data Imported Successfully' })).toBeInTheDocument();
    });
  });

  describe('Summary display', () => {
    it.each<{
      label: string;
      summary: Partial<ImportSuccessSummary>;
      text: string;
    }>([
      { label: 'total rows count', summary: { totalRows: 250 }, text: '250' },
      { label: 'columns count', summary: { columns: 8 }, text: '8' },
    ])('should display $label', ({ summary, text }) => {
      render(
        <ImportSuccessModal open summary={createSummary(summary)} onClose={mockOnClose} />
      );

      expect(screen.getByText(text)).toBeInTheDocument();
    });

    it('should display table title in success message', () => {
      render(
        <ImportSuccessModal
          open
          summary={createSummary({ tableTitle: 'Customers' })}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/for "Customers"/)).toBeInTheDocument();
    });

    it('should display generic success message when table title is missing', () => {
      render(<ImportSuccessModal open={true} summary={createSummary()} onClose={mockOnClose} />);

      expect(screen.getByText(/Your import is complete\./)).toBeInTheDocument();
    });

    it('should display data quality metrics', () => {
      render(
        <ImportSuccessModal
          open
          summary={createSummary({ errorRows: 4, emptyRows: 6, duplicateRows: 2 })}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('4 rows with errors')).toBeInTheDocument();
      expect(screen.getByText('6 empty rows found')).toBeInTheDocument();
      expect(screen.getByText('2 duplicate rows found')).toBeInTheDocument();
    });
  });

  describe('Close interactions', () => {
    it.each<{ control: string; buttonName: string }>([
      { control: 'Okay button', buttonName: 'Okay' },
      { control: 'close icon button', buttonName: 'Close' },
      { control: 'backdrop', buttonName: 'Close import summary' },
    ])('should call onClose when $control is clicked', async ({ buttonName }) => {
      const user = userEvent.setup();
      render(<ImportSuccessModal open={true} summary={createSummary()} onClose={mockOnClose} />);

      await user.click(screen.getByRole('button', { name: buttonName }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Import log download', () => {
    it.each<{
      source: string;
      summary: Partial<ImportSuccessSummary>;
    }>([
      { source: 'error rows file content', summary: { errorRowsFileContent: 'row 1 error' } },
      { source: 'error rows file path', summary: { errorRowsFilePath: '/logs/import_errors.txt' } },
    ])('should show download link when $source is provided', ({ summary }) => {
      render(
        <ImportSuccessModal open summary={createSummary(summary)} onClose={mockOnClose} />
      );

      expect(screen.getByText('View data import log')).toBeInTheDocument();
    });

    it.each<{
      scenario: string;
      summary: ImportSuccessSummary;
    }>([
      { scenario: 'no error file is provided', summary: createSummary() },
      {
        scenario: 'error file path is missing and content is empty',
        summary: createSummary({ errorRowsFileContent: '' }),
      },
    ])('should not show download link when $scenario', ({ summary }) => {
      render(<ImportSuccessModal open={true} summary={summary} onClose={mockOnClose} />);

      expect(screen.queryByText('View data import log')).not.toBeInTheDocument();
    });

    it('should download inline error log content when link is clicked', async () => {
      const user = userEvent.setup();
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

      render(
        <ImportSuccessModal
          open={true}
          summary={createSummary({ errorRowsFileContent: 'row 5: invalid email' })}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByText('View data import log'));

      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      clickSpy.mockRestore();
    });

    it('should download error log from file path when inline content is empty', async () => {
      const user = userEvent.setup();
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

      render(
        <ImportSuccessModal
          open={true}
          summary={createSummary({
            errorRowsFileContent: '   ',
            errorRowsFilePath: '/reports/import_error_rows.txt',
          })}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByText('View data import log'));

      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(createObjectURLSpy).not.toHaveBeenCalled();

      createObjectURLSpy.mockRestore();
      clickSpy.mockRestore();
    });
  });
});
