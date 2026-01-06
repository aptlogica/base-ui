import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UpdateFieldConfirmModal from '../UpdateFieldConfirmModal';

describe('UpdateFieldConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirm Field Update',
    message: 'Changing this field type may result in data loss. Are you sure?',
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <UpdateFieldConfirmModal {...defaultProps} isOpen={false} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders the modal when isOpen is true', () => {
      render(<UpdateFieldConfirmModal {...defaultProps} />);

      expect(screen.getByText('Confirm Field Update')).toBeInTheDocument();
      expect(screen.getByText('Changing this field type may result in data loss. Are you sure?')).toBeInTheDocument();
    });

    it('renders Cancel and Confirm buttons', () => {
      render(<UpdateFieldConfirmModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });

    it('displays custom title and message', () => {
      render(
        <UpdateFieldConfirmModal
          {...defaultProps}
          title="Convert to Number"
          message="Non-numeric values will be converted to 0."
        />
      );

      expect(screen.getByText('Convert to Number')).toBeInTheDocument();
      expect(screen.getByText('Non-numeric values will be converted to 0.')).toBeInTheDocument();
    });

    it('renders warning icon', () => {
      const { container } = render(<UpdateFieldConfirmModal {...defaultProps} />);

      // TriangleAlert icon should be present
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<UpdateFieldConfirmModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when Confirm button is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();

      render(<UpdateFieldConfirmModal {...defaultProps} onConfirm={onConfirm} />);

      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking inside modal content', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<UpdateFieldConfirmModal {...defaultProps} onClose={onClose} />);

      // Click on the title text
      await user.click(screen.getByText('Confirm Field Update'));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('applies modal backdrop class', () => {
      const { container } = render(<UpdateFieldConfirmModal {...defaultProps} />);

      const backdrop = container.firstElementChild;
      expect(backdrop).toHaveClass('bg-modal-backdrop');
    });

    it('applies modal content class', () => {
      const { container } = render(<UpdateFieldConfirmModal {...defaultProps} />);

      const modal = container.querySelector('.bg-modal');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper button roles', () => {
      render(<UpdateFieldConfirmModal {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('buttons have proper type attributes', () => {
      render(<UpdateFieldConfirmModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      const confirmButton = screen.getByRole('button', { name: 'Confirm' });

      expect(cancelButton).toHaveAttribute('type', 'button');
      expect(confirmButton).toHaveAttribute('type', 'button');
    });
  });
});
