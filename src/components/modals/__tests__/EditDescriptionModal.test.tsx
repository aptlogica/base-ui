import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditDescriptionModal from '../EditDescriptionModal';

describe('EditDescriptionModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <EditDescriptionModal {...defaultProps} isOpen={false} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders the modal when isOpen is true', () => {
      render(<EditDescriptionModal {...defaultProps} />);

      expect(screen.getByText('Add Description')).toBeInTheDocument();
    });

    it('shows "Edit Description" title when initialValue is provided', () => {
      render(
        <EditDescriptionModal {...defaultProps} initialValue="Existing description" />
      );

      expect(screen.getByText('Edit Description')).toBeInTheDocument();
    });

    it('renders textarea with placeholder', () => {
      render(<EditDescriptionModal {...defaultProps} />);

      expect(screen.getByPlaceholderText('Enter table description...')).toBeInTheDocument();
    });

    it('renders Cancel and Save buttons', () => {
      render(<EditDescriptionModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('pre-fills textarea with initialValue', () => {
      render(
        <EditDescriptionModal {...defaultProps} initialValue="Initial description" />
      );

      expect(screen.getByRole('textbox')).toHaveValue('Initial description');
    });

    it('handles undefined initialValue gracefully', () => {
      render(<EditDescriptionModal {...defaultProps} initialValue={undefined} />);

      expect(screen.getByRole('textbox')).toHaveValue('');
    });
  });

  describe('dirty state and Save button', () => {
    it('disables Save button when no changes are made', () => {
      render(<EditDescriptionModal {...defaultProps} initialValue="Initial" />);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toBeDisabled();
    });

    it('enables Save button when content is changed', async () => {
      const user = userEvent.setup();

      render(<EditDescriptionModal {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'New description');

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).not.toBeDisabled();
    });

    it('enables Save button when clearing existing content', async () => {
      const user = userEvent.setup();

      render(<EditDescriptionModal {...defaultProps} initialValue="Existing" />);

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('interactions', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<EditDescriptionModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onSave with description when Save button is clicked', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();

      render(<EditDescriptionModal {...defaultProps} onSave={onSave} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'New description');

      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(onSave).toHaveBeenCalledWith('New description');
    });

    it('does not call onSave when clicking disabled Save button', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();

      render(<EditDescriptionModal {...defaultProps} onSave={onSave} initialValue="Initial" />);

      // Try to click the disabled button
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(onSave).not.toHaveBeenCalled();
    });

    it('updates textarea value on change', async () => {
      const user = userEvent.setup();

      render(<EditDescriptionModal {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Updated text');

      expect(textarea).toHaveValue('Updated text');
    });
  });

  describe('state reset', () => {
    it('resets to initialValue when modal reopens', async () => {
      const { rerender } = render(
        <EditDescriptionModal {...defaultProps} initialValue="First value" />
      );

      expect(screen.getByRole('textbox')).toHaveValue('First value');

      rerender(<EditDescriptionModal {...defaultProps} isOpen={false} />);
      rerender(
        <EditDescriptionModal {...defaultProps} isOpen={true} initialValue="Second value" />
      );

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('Second value');
      });
    });

    it('resets dirty state when modal reopens', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <EditDescriptionModal {...defaultProps} initialValue="Initial" />
      );

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, ' added text');

      // Button should be enabled (dirty)
      expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled();

      // Close and reopen
      rerender(<EditDescriptionModal {...defaultProps} isOpen={false} />);
      rerender(<EditDescriptionModal {...defaultProps} isOpen={true} initialValue="Initial" />);

      // Button should be disabled again (clean state)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
      });
    });
  });

  describe('styling', () => {
    it('applies disabled styling to Save button when not dirty', () => {
      render(<EditDescriptionModal {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('removes disabled styling from Save button when dirty', async () => {
      const user = userEvent.setup();

      render(<EditDescriptionModal {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'text');

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).not.toHaveClass('opacity-50');
    });
  });
});
