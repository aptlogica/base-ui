import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImportCsvModal } from '../ImportCsvModal';

vi.mock('../ImportModal', () => ({
  ImportModal: ({ modeSwitcher }: any) => (
    <div data-testid="single-popup">
      {modeSwitcher}
    </div>
  ),
}));
vi.mock('../ImportSbaseModal', () => ({
  ImportSbaseModal: ({ modeSwitcher, format }: any) => (
    <div data-testid="multiple-popup" data-format={format}>
      {modeSwitcher}
    </div>
  ),
}));

const props = { isOpen: true, onClose: vi.fn(), workspaceId: 'w1', onImported: vi.fn() };

describe('ImportCsvModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<ImportCsvModal {...props} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('defaults to Single and shows the single-file popup under the radio', () => {
    render(<ImportCsvModal {...props} />);
    expect(screen.getByTestId('single-popup')).toBeInTheDocument();
    expect(screen.queryByTestId('multiple-popup')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Single CSV file')).toBeChecked();
  });

  it('swaps to the zip popup (csv format) when Multiple is chosen, and back', () => {
    render(<ImportCsvModal {...props} />);
    fireEvent.click(screen.getByLabelText('Multiple CSV files'));
    expect(screen.getByTestId('multiple-popup')).toHaveAttribute('data-format', 'csv');
    expect(screen.queryByTestId('single-popup')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Multiple CSV files')).toBeChecked();

    fireEvent.click(screen.getByLabelText('Single CSV file'));
    expect(screen.getByTestId('single-popup')).toBeInTheDocument();
  });

  it('starts on Single again after it is closed and reopened', () => {
    const { rerender } = render(<ImportCsvModal {...props} />);
    fireEvent.click(screen.getByLabelText('Multiple CSV files'));
    rerender(<ImportCsvModal {...props} isOpen={false} />);
    rerender(<ImportCsvModal {...props} isOpen />);
    expect(screen.getByTestId('single-popup')).toBeInTheDocument();
  });
});
