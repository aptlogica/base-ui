import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportDataModal } from '../ImportDataModal';

describe('ImportDataModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelectImportType: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <ImportDataModal {...defaultProps} isOpen={false} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders the modal when isOpen is true', () => {
      render(<ImportDataModal {...defaultProps} />);

      expect(screen.getByText('Import data from')).toBeInTheDocument();
    });

    it('renders all import options', () => {
      render(<ImportDataModal {...defaultProps} />);

      expect(screen.getByText('CSV')).toBeInTheDocument();
      expect(screen.getByText('Excel')).toBeInTheDocument();
      expect(screen.getByText('SQL')).toBeInTheDocument();
      expect(screen.getByText('Json')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<ImportDataModal {...defaultProps} />);

      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find(btn => btn.querySelector('svg.lucide-x'));
      expect(xButton).toBeInTheDocument();
    });

    it('shows "Coming soon" for disabled options', () => {
      render(<ImportDataModal {...defaultProps} />);

      const comingSoonLabels = screen.getAllByText('Coming soon');
      expect(comingSoonLabels.length).toBeGreaterThan(0);
    });
  });

  describe('import option states', () => {
    it('CSV option is enabled', () => {
      render(<ImportDataModal {...defaultProps} />);

      const csvButton = screen.getByRole('button', { name: /CSV/i });
      expect(csvButton).not.toBeDisabled();
    });

    it('Excel option is disabled', () => {
      render(<ImportDataModal {...defaultProps} />);

      const excelButton = screen.getByRole('button', { name: /Excel/i });
      expect(excelButton).toBeDisabled();
    });

    it('SQL option is disabled', () => {
      render(<ImportDataModal {...defaultProps} />);

      const sqlButton = screen.getByRole('button', { name: /SQL/i });
      expect(sqlButton).toBeDisabled();
    });

    it('JSON option is disabled', () => {
      render(<ImportDataModal {...defaultProps} />);

      const jsonButton = screen.getByRole('button', { name: /Json/i });
      expect(jsonButton).toBeDisabled();
    });
  });

  describe('interactions', () => {
    it('calls onSelectImportType and onClose when CSV is clicked', async () => {
      const user = userEvent.setup();
      const onSelectImportType = vi.fn();
      const onClose = vi.fn();

      render(
        <ImportDataModal
          {...defaultProps}
          onSelectImportType={onSelectImportType}
          onClose={onClose}
        />
      );

      await user.click(screen.getByRole('button', { name: /CSV/i }));

      expect(onSelectImportType).toHaveBeenCalledWith('csv');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onSelectImportType when disabled option is clicked', async () => {
      const user = userEvent.setup();
      const onSelectImportType = vi.fn();

      render(
        <ImportDataModal {...defaultProps} onSelectImportType={onSelectImportType} />
      );

      // Try to click disabled Excel button
      await user.click(screen.getByRole('button', { name: /Excel/i }));

      expect(onSelectImportType).not.toHaveBeenCalled();
    });

    it('calls onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      const { container } = render(
        <ImportDataModal {...defaultProps} onClose={onClose} />
      );

      const backdrop = container.querySelector('.bg-modal-backdrop');
      await user.click(backdrop!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when X button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<ImportDataModal {...defaultProps} onClose={onClose} />);

      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find(btn => btn.querySelector('svg.lucide-x'));
      
      if (xButton) {
        await user.click(xButton);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('calls onClose when pressing Escape key', () => {
      const onClose = vi.fn();

      const { container } = render(
        <ImportDataModal {...defaultProps} onClose={onClose} />
      );

      const backdrop = container.querySelector('.bg-modal-backdrop');
      fireEvent.keyDown(backdrop!, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking inside modal content', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<ImportDataModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByText('Import data from'));

      expect(onClose).not.toHaveBeenCalled();
    });

    it('stops propagation on modal content keydown', () => {
      const onClose = vi.fn();
      const { container } = render(
        <ImportDataModal {...defaultProps} onClose={onClose} />
      );

      const modal = container.querySelector('.bg-modal');
      fireEvent.keyDown(modal!, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('applies disabled styling to disabled options', () => {
      render(<ImportDataModal {...defaultProps} />);

      const excelButton = screen.getByRole('button', { name: /Excel/i });
      expect(excelButton).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('applies hover styling to enabled options', () => {
      render(<ImportDataModal {...defaultProps} />);

      const csvButton = screen.getByRole('button', { name: /CSV/i });
      expect(csvButton).toHaveClass('hover:bg-gray-50', 'cursor-pointer');
    });
  });

  describe('accessibility', () => {
    it('all import options are buttons', () => {
      render(<ImportDataModal {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      // Should have at least 4 import options + close button
      expect(buttons.length).toBeGreaterThanOrEqual(5);
    });
  });
});
