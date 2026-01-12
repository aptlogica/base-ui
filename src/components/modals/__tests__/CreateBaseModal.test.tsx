import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateBaseModal } from '../CreateBaseModal';

// Mock the MultiLineText component
vi.mock('../../common/Fields/MultiLineText', () => ({
  MultiLineText: ({ label, value, onChange, placeholder }: any) => (
    <div>
      <label>{label}</label>
      <textarea
        data-testid="description-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  ),
}));

// Mock nameValidation
vi.mock('../../../utils/nameValidation', () => ({
  validateBaseName: vi.fn((name, existingBases, _currentItemId) => {
    if (!name || name.trim().length < 3) {
      return { isValid: false, error: 'Base name must be at least 3 characters' };
    }
    const isDuplicate = existingBases?.some(
      (base: any) => base.name?.toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      return { isValid: false, error: 'A base with this name already exists' };
    }
    return { isValid: true, error: null };
  }),
}));

describe('CreateBaseModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onCreate: vi.fn(),
    workspaceId: 'ws-123',
    existingBases: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <CreateBaseModal {...defaultProps} isOpen={false} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders the modal when isOpen is true', () => {
      render(<CreateBaseModal {...defaultProps} />);

      expect(screen.getByRole('heading', { name: 'Create Base' })).toBeInTheDocument();
      expect(screen.getByText('Add a new base to your workspace')).toBeInTheDocument();
    });

    it('renders form elements', () => {
      render(<CreateBaseModal {...defaultProps} />);

      expect(screen.getByLabelText(/Base Name/i)).toBeInTheDocument();
      expect(screen.getByTestId('description-input')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Base' })).toBeInTheDocument();
    });

    it('displays "Update Base" title when isUpdate is true', () => {
      render(<CreateBaseModal {...defaultProps} isUpdate={true} />);

      expect(screen.getByText('Update Base')).toBeInTheDocument();
      expect(screen.getByText('Update base details')).toBeInTheDocument();
    });

    it('pre-fills name when defaultName is provided', () => {
      render(<CreateBaseModal {...defaultProps} defaultName="My Base" />);

      expect(screen.getByLabelText(/Base Name/i)).toHaveValue('My Base');
    });
  });

  describe('form validation', () => {
    it('shows error when submitting with empty name', async () => {
      const onCreate = vi.fn();

      render(<CreateBaseModal {...defaultProps} onCreate={onCreate} />);

      const submitButton = screen.getByRole('button', { name: 'Create Base' });
      
      // Button should be disabled when name is empty
      expect(submitButton).toBeDisabled();
      expect(onCreate).not.toHaveBeenCalled();
    });

    it('shows validation error for short name', async () => {
      const user = userEvent.setup();

      render(<CreateBaseModal {...defaultProps} />);

      const input = screen.getByLabelText(/Base Name/i);
      await user.type(input, 'AB');

      await waitFor(() => {
        expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for duplicate name', async () => {
      const user = userEvent.setup();
      const existingBases = [{ id: 'base-1', name: 'Existing Base' }];

      render(<CreateBaseModal {...defaultProps} existingBases={existingBases} />);

      const input = screen.getByLabelText(/Base Name/i);
      await user.type(input, 'Existing Base');

      await waitFor(() => {
        expect(screen.getByText(/already exists/i)).toBeInTheDocument();
      });
    });

    it('displays character count', async () => {
      const user = userEvent.setup();

      render(<CreateBaseModal {...defaultProps} />);

      const input = screen.getByLabelText(/Base Name/i);
      await user.type(input, 'Test');

      expect(screen.getByText(/4.*50 characters/)).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('calls onCreate with form data on valid submission', async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn();

      render(<CreateBaseModal {...defaultProps} onCreate={onCreate} />);

      const nameInput = screen.getByLabelText(/Base Name/i);
      const descInput = screen.getByTestId('description-input');

      await user.type(nameInput, 'New Base');
      await user.type(descInput, 'Base description');
      await user.click(screen.getByRole('button', { name: 'Create Base' }));

      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledWith({
          name: 'New Base',
          description: 'Base description',
          image: null,
        });
      });
    });

    it('disables submit button while submitting', async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(<CreateBaseModal {...defaultProps} onCreate={onCreate} />);

      const nameInput = screen.getByLabelText(/Base Name/i);
      await user.type(nameInput, 'New Base');
      
      const submitButton = screen.getByRole('button', { name: 'Create Base' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeInTheDocument();
      });
    });

    it('trims whitespace from name and description', async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn();

      render(<CreateBaseModal {...defaultProps} onCreate={onCreate} />);

      const nameInput = screen.getByLabelText(/Base Name/i);
      const descInput = screen.getByTestId('description-input');

      await user.type(nameInput, '  New Base  ');
      await user.type(descInput, '  Description  ');
      await user.click(screen.getByRole('button', { name: 'Create Base' }));

      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledWith({
          name: 'New Base',
          description: 'Description',
          image: null,
        });
      });
    });
  });

  describe('interactions', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<CreateBaseModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it.skip('calls onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      const { container } = render(<CreateBaseModal {...defaultProps} onClose={onClose} />);

      const backdrop = screen.getByLabelText('Close modal');
      await user.click(backdrop!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when pressing Escape key', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      const { container } = render(
        <CreateBaseModal {...defaultProps} onClose={onClose} />
      );

      const modalContent = container.querySelector('.bg-modal');
      if (modalContent) {
        fireEvent.keyDown(modalContent, { key: 'Escape', code: 'Escape' });
      }

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking inside modal content', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<CreateBaseModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('heading', { name: 'Create Base' }));

      expect(onClose).not.toHaveBeenCalled();
    });

    it('closes modal after successful creation', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onCreate = vi.fn();

      render(<CreateBaseModal {...defaultProps} onClose={onClose} onCreate={onCreate} />);

      const nameInput = screen.getByLabelText(/Base Name/i);
      await user.type(nameInput, 'New Base');
      await user.click(screen.getByRole('button', { name: 'Create Base' }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('state reset', () => {
    it('resets form when modal reopens', async () => {
      const { rerender } = render(<CreateBaseModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Base Name/i);
      expect(nameInput).toHaveValue('');

      rerender(<CreateBaseModal {...defaultProps} isOpen={false} />);
      rerender(<CreateBaseModal {...defaultProps} isOpen={true} defaultName="Reset Test" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Base Name/i)).toHaveValue('Reset Test');
      });
    });
  });
});
