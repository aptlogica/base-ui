import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateTableModal } from '../CreateTableModal';

// Mock components
vi.mock('../../common/Fields/SingleLineText', () => ({
  SingleLineText: ({ value, onChange }: any) => (
    <input
      data-testid="single-line-text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

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

vi.mock('../../ui/Loader', () => ({
  Loader: () => <div data-testid="loader">Loading...</div>,
}));

// Mock nameValidation
vi.mock('../../../utils/nameValidation', () => ({
  validateTableName: vi.fn((name, existingTables, _currentItemId) => {
    if (!name || name.trim().length < 3) {
      return { isValid: false, error: 'Table name must be at least 3 characters' };
    }
    const isDuplicate = existingTables?.some(
      (table: any) => table.name?.toLowerCase() === name.toLowerCase() ||
                      table.title?.toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      return { isValid: false, error: 'A table with this name already exists' };
    }
    return { isValid: true, error: null };
  }),
  getDefaultTableName: vi.fn((existingTables) => {
    const count = (existingTables?.length || 0) + 1;
    return `Table ${count}`;
  }),
}));

describe('CreateTableModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onCreate: vi.fn(),
    baseId: 'base-123',
    existingTables: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <CreateTableModal {...defaultProps} isOpen={false} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders the modal when isOpen is true', () => {
      render(<CreateTableModal {...defaultProps} />);

      expect(screen.getByRole('heading', { name: 'Create Table' })).toBeInTheDocument();
      expect(screen.getByText('Add a new table to your base')).toBeInTheDocument();
    });

    it('renders form elements', () => {
      render(<CreateTableModal {...defaultProps} />);

      expect(screen.getByLabelText(/Table Name/i)).toBeInTheDocument();
      expect(screen.getByTestId('description-input')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Table' })).toBeInTheDocument();
    });

    it('pre-fills with default table name based on existing tables', () => {
      const existingTables = [{ id: '1', name: 'Table 1' }];

      render(<CreateTableModal {...defaultProps} existingTables={existingTables} />);

      expect(screen.getByLabelText(/Table Name/i)).toHaveValue('Table 2');
    });

    it('pre-fills with provided defaultName', () => {
      render(<CreateTableModal {...defaultProps} defaultName="Custom Table" />);

      expect(screen.getByLabelText(/Table Name/i)).toHaveValue('Custom Table');
    });
  });

  describe('form validation', () => {
    it('shows error when submitting with empty name', async () => {
      const onCreate = vi.fn();

      render(<CreateTableModal {...defaultProps} onCreate={onCreate} defaultName="" />);

      // Clear the default name
      const input = screen.getByLabelText(/Table Name/i);
      await userEvent.setup().clear(input);

      const submitButton = screen.getByRole('button', { name: 'Create Table' });
      expect(submitButton).toBeDisabled();
      expect(onCreate).not.toHaveBeenCalled();
    });

    it('shows validation error for short name', async () => {
      const user = userEvent.setup();

      render(<CreateTableModal {...defaultProps} defaultName="" />);

      const input = screen.getByLabelText(/Table Name/i);
      await user.clear(input);
      await user.type(input, 'AB');

      await waitFor(() => {
        expect(screen.getByText('Table name must be at least 3 characters')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: 'Create Table' });
      expect(submitButton).toBeDisabled();
    });

    it('shows validation error for duplicate name', async () => {
      const user = userEvent.setup();
      const existingTables = [{ id: 'table-1', name: 'Existing Table' }];

      render(<CreateTableModal {...defaultProps} existingTables={existingTables} defaultName="" />);

      const input = screen.getByLabelText(/Table Name/i);
      await user.clear(input);
      await user.type(input, 'Existing Table');

      await waitFor(() => {
        expect(screen.getByText('A table with this name already exists')).toBeInTheDocument();
      });
    });

    it('displays character count', async () => {
      const user = userEvent.setup();

      render(<CreateTableModal {...defaultProps} defaultName="" />);

      const input = screen.getByLabelText(/Table Name/i);
      await user.clear(input);
      await user.type(input, 'Test');

      expect(screen.getByText('4/50 characters')).toBeInTheDocument();
    });

    it('disables submit button when name is too short', () => {
      render(<CreateTableModal {...defaultProps} defaultName="AB" />);

      const submitButton = screen.getByRole('button', { name: 'Create Table' });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('form submission', () => {
    it('calls onCreate with form data on valid submission', async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn().mockResolvedValueOnce(undefined);

      render(<CreateTableModal {...defaultProps} onCreate={onCreate} defaultName="" />);

      const nameInput = screen.getByLabelText(/Table Name/i);
      const descInput = screen.getByTestId('description-input');

      await user.clear(nameInput);
      await user.type(nameInput, 'New Table');
      await user.type(descInput, 'Table description');
      await user.click(screen.getByRole('button', { name: 'Create Table' }));

      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledWith({
          name: 'New Table',
          description: 'Table description',
        });
      });
    });

    it('shows loading state while submitting', async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn().mockImplementationOnce(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(<CreateTableModal {...defaultProps} onCreate={onCreate} defaultName="Valid Name" />);

      await user.click(screen.getByRole('button', { name: 'Create Table' }));

      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeInTheDocument();
      });
    });

    it.skip('trims whitespace from name and description', async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn().mockResolvedValueOnce(undefined);

      render(<CreateTableModal {...defaultProps} onCreate={onCreate} defaultName="" />);

      const nameInput = screen.getByLabelText(/Table Name/i);
      const descInput = screen.getByTestId('description-input');

      await user.clear(nameInput);
      await user.type(nameInput, '  New Table  ');
      await user.type(descInput, '  Description  ');
      await user.click(screen.getByRole('button', { name: 'Create Table' }));

      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledWith({
          name: 'New Table',
          description: 'Description',
        });
      });
    });

    it('shows error message when onCreate fails', async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn().mockRejectedValueOnce(new Error('API Error'));

      render(<CreateTableModal {...defaultProps} onCreate={onCreate} defaultName="Valid Name" />);

      await user.click(screen.getByRole('button', { name: 'Create Table' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create table. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('interactions', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<CreateTableModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<CreateTableModal {...defaultProps} onClose={onClose} />);

      const backdrop = screen.getByLabelText('Close modal');
      await user.click(backdrop!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when pressing Escape key', () => {
      const onClose = vi.fn();

      const { container } = render(
        <CreateTableModal {...defaultProps} onClose={onClose} />
      );

      const modal = container.querySelector('.bg-modal');
      fireEvent.keyDown(modal!, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking inside modal content', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<CreateTableModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('heading', { name: 'Create Table' }));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('state reset', () => {
    it('resets form when modal reopens', async () => {
      const { rerender } = render(<CreateTableModal {...defaultProps} defaultName="Initial" />);

      expect(screen.getByLabelText(/Table Name/i)).toHaveValue('Initial');

      rerender(<CreateTableModal {...defaultProps} isOpen={false} />);
      rerender(<CreateTableModal {...defaultProps} isOpen={true} defaultName="Reset Test" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Table Name/i)).toHaveValue('Reset Test');
      });
    });
  });
});
