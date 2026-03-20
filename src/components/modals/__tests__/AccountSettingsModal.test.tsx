import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountSettingsModal } from '../AccountSettingsModal';

// Mock createPortal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

// Mock AccountSettings component
vi.mock('../../account/AccountSettings', () => ({
  AccountSettings: () => <div data-testid="account-settings">Account Settings Content</div>,
}));

describe('AccountSettingsModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <AccountSettingsModal {...defaultProps} isOpen={false} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders the modal when isOpen is true', () => {
      render(<AccountSettingsModal {...defaultProps} />);

      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    });

    it('renders subtitle', () => {
      render(<AccountSettingsModal {...defaultProps} />);

      expect(screen.getByText('Manage your personal profile & security settings')).toBeInTheDocument();
    });

    it('renders AccountSettings component', () => {
      render(<AccountSettingsModal {...defaultProps} />);

      expect(screen.getByTestId('account-settings')).toBeInTheDocument();
    });

    it('renders close button with aria-label', () => {
      render(<AccountSettingsModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Close modal' })).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<AccountSettingsModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Close modal' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      const { container } = render(
        <AccountSettingsModal {...defaultProps} onClose={onClose} />
      );

      const backdrop = container.querySelector('.bg-modal-backdrop');
      await user.click(backdrop!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when pressing Escape key', () => {
      const onClose = vi.fn();

      const { container } = render(
        <AccountSettingsModal {...defaultProps} onClose={onClose} />
      );

      const backdrop = container.querySelector('.bg-modal-backdrop');
      fireEvent.keyDown(backdrop!, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking inside modal content', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<AccountSettingsModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByText('Profile Settings'));

      expect(onClose).not.toHaveBeenCalled();
    });

    it('stops propagation on modal content keydown', () => {
      const onClose = vi.fn();
      const { container } = render(
        <AccountSettingsModal {...defaultProps} onClose={onClose} />
      );

      const modal = container.querySelector('.bg-card');
      fireEvent.keyDown(modal!, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('applies modal backdrop class', () => {
      const { container } = render(<AccountSettingsModal {...defaultProps} />);

      const backdrop = container.querySelector('.bg-modal-backdrop');
      expect(backdrop).toBeInTheDocument();
    });

    it('applies proper modal container classes', () => {
      const { container } = render(<AccountSettingsModal {...defaultProps} />);

      const modal = container.querySelector('.bg-card');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveClass('rounded-xl');
    });
  });

  describe('accessibility', () => {
    it('has accessible close button', () => {
      render(<AccountSettingsModal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: 'Close modal' });
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
    });
  });
});
