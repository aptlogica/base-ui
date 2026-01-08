import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeleteConfirmModal from '../DeleteConfirmModal';

describe('DeleteConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <DeleteConfirmModal {...defaultProps} isOpen={false} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders the modal when isOpen is true', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      expect(screen.getByText('Delete Item')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
    });

    it('renders Cancel and Delete buttons', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('displays custom title and message', () => {
      render(
        <DeleteConfirmModal
          {...defaultProps}
          title="Delete Base"
          message="This action cannot be undone. All data will be lost."
        />
      );

      expect(screen.getByText('Delete Base')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone. All data will be lost.')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<DeleteConfirmModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when Delete button is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();

      render(<DeleteConfirmModal {...defaultProps} onConfirm={onConfirm} />);

      await user.click(screen.getByRole('button', { name: 'Delete' }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking inside modal content', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<DeleteConfirmModal {...defaultProps} onClose={onClose} />);

      // Click on the title text
      await user.click(screen.getByText('Delete Item'));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('applies modal backdrop class', () => {
      const { container } = render(<DeleteConfirmModal {...defaultProps} />);

      const backdrop = container.firstElementChild;
      expect(backdrop).toHaveClass('bg-modal-backdrop');
    });

    it('applies modal content class', () => {
      const { container } = render(<DeleteConfirmModal {...defaultProps} />);

      const modal = container.querySelector('.bg-modal');
      expect(modal).toBeInTheDocument();
    });
  });
});
