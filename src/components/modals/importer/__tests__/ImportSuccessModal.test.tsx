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

  describe('For an import that is not a table of rows (a Sereni Base import)', () => {
    const baseSummary = () =>
      createSummary({
        stats: [
          { label: 'Tables', value: 3 },
          { label: 'Fields', value: 20 },
          { label: 'Rows', value: 1200 },
        ],
        hideDataQuality: true,
      });

    it('shows its own figures instead of Total Rows and Columns', () => {
      render(<ImportSuccessModal open summary={baseSummary()} onClose={mockOnClose} />);
      expect(screen.getByText('Tables')).toBeTruthy();
      expect(screen.getByText('1,200')).toBeTruthy();
      expect(screen.queryByText('Total Rows')).toBeNull();
    });

    it('leaves out the data quality section when asked to', () => {
      render(<ImportSuccessModal open summary={baseSummary()} onClose={mockOnClose} />);
      expect(screen.queryByText('Data Quality')).toBeNull();
      expect(screen.queryByText(/rows with errors/)).toBeNull();
      expect(screen.queryByText('View data import log')).toBeNull();
    });

    it('keeps the data quality section for a CSV import', () => {
      render(<ImportSuccessModal open summary={createSummary()} onClose={mockOnClose} />);
      expect(screen.getByText('Data Quality')).toBeTruthy();
    });
  });
});

describe('ImportSuccessModal for a failed import and for warnings', () => {
  const failedSummary = (overrides?: Partial<ImportSuccessSummary>): ImportSuccessSummary => ({
    variant: 'failed',
    totalRows: 0,
    columns: 0,
    errorRows: 0,
    emptyRows: 0,
    duplicateRows: 0,
    emptyRowsSkipped: 0,
    duplicatesRemoved: 0,
    subtitle: 'Your import of "a.zip" did not finish.',
    errors: ['the zip has no base.sbase.json'],
    errorRowsFileContent: 'LOG',
    ...overrides,
  });

  it('shows a red popup with the one error and Close and Try again', async () => {
    const onClose = vi.fn();
    const onRetry = vi.fn();
    render(<ImportSuccessModal open summary={failedSummary()} onClose={onClose} onRetry={onRetry} />);
    expect(screen.getByText('Import Failed')).toBeTruthy();
    expect(screen.getByText('Your import of "a.zip" did not finish.')).toBeTruthy();
    expect(screen.getByText('1 error')).toBeTruthy();
    expect(screen.getByText('the zip has no base.sbase.json')).toBeTruthy();
    expect(screen.getByText('0 rows imported')).toBeTruthy();
    expect(screen.queryByText('Data Imported Successfully')).toBeNull();
    expect(screen.queryByText('Okay')).toBeNull();
    await userEvent.click(screen.getByText('Try again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('lists three errors and counts the others', () => {
    const errors = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'];
    render(<ImportSuccessModal open summary={failedSummary({ errors })} onClose={vi.fn()} />);
    expect(screen.getByText('6 errors')).toBeTruthy();
    expect(screen.getByText('e3')).toBeTruthy();
    expect(screen.queryByText('e4')).toBeNull();
    expect(screen.getByText('… 3 more (all of them are in the log)')).toBeTruthy();
  });

  it('has no Try again button without a retry action, and no log link without a log', () => {
    render(<ImportSuccessModal open summary={failedSummary({ errorRowsFileContent: undefined })} onClose={vi.fn()} />);
    expect(screen.queryByText('Try again')).toBeNull();
    expect(screen.queryByText(/View data import log/)).toBeNull();
  });

  it('a finished import lists the warnings in Data Quality, in the singular for one', () => {
    const { rerender } = render(<ImportSuccessModal open summary={createSummary({ warnings: 1 })} onClose={vi.fn()} />);
    expect(screen.getByText('1 warning')).toBeTruthy();
    rerender(<ImportSuccessModal open summary={createSummary({ warnings: 3 })} onClose={vi.fn()} />);
    expect(screen.getByText('3 warnings')).toBeTruthy();
    // a CSV table import does not set warnings: no such line
    rerender(<ImportSuccessModal open summary={createSummary()} onClose={vi.fn()} />);
    expect(screen.queryByText(/warning/)).toBeNull();
  });
});
