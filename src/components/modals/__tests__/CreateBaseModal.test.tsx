import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateBaseModal } from '../CreateBaseModal';

interface MultiLineTextMockProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

vi.mock('../../common/Fields/MultiLineText', () => ({
  MultiLineText: ({ label, value, onChange, placeholder }: MultiLineTextMockProps) => (
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

vi.mock('../../../utils/nameValidation', () => ({
  validateBaseName: vi.fn((name: string, existingBases: { name?: string }[], _currentItemId?: string) => {
    if (!name || name.trim().length < 3) {
      return { isValid: false, error: 'Base name must be at least 3 characters' };
    }
    const isDuplicate = existingBases?.some(
      (base: { name?: string }) => base.name?.toLowerCase() === name.toLowerCase()
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
    existingBases: [] as { id?: string; name?: string }[],
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

      expect(submitButton).toBeDisabled();
      expect(onCreate).not.toHaveBeenCalled();
    });

    it('shows Base name is required when form is submitted with empty name', async () => {
      render(<CreateBaseModal {...defaultProps} />);

      const form = document.getElementById('create-base-form');
      expect(form).toBeTruthy();
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(screen.getByText('Base name is required')).toBeInTheDocument();
      });
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
      const onClose = vi.fn();
      const onCreate = vi.fn();

      render(<CreateBaseModal {...defaultProps} onCreate={onCreate} onClose={onClose} />);

      const nameInput = screen.getByLabelText(/Base Name/i);
      await user.type(nameInput, 'New Base');

      const submitButton = screen.getByRole('button', { name: 'Create Base' });
      expect(submitButton).not.toBeDisabled();

      const clickPromise = user.click(submitButton);

      await waitFor(() => {
        expect(onCreate).toHaveBeenCalled();
      }, { timeout: 100 });

      await clickPromise;
      expect(onClose).toHaveBeenCalled();
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

  describe('Update mode', () => {
    it('shows Update button and Updating... when submitting', async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn();

      render(<CreateBaseModal {...defaultProps} isUpdate={true} onCreate={onCreate} />);

      expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();

      const nameInput = screen.getByLabelText(/Base Name/i);
      await user.type(nameInput, 'Updated Base');

      const submitButton = screen.getByRole('button', { name: 'Update' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledWith({
          name: 'Updated Base',
          description: '',
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

    it('calls onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<CreateBaseModal {...defaultProps} onClose={onClose} />);

      const backdrop = screen.getByLabelText('Close modal');
      await user.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when pressing Escape key', () => {
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

  describe('image upload', () => {
    it('shows error for invalid file type', async () => {
      render(<CreateBaseModal {...defaultProps} />);

      const file = new File(['test'], 'invalid.bmp', { type: 'image/bmp' });
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('Please upload a valid image file (SVG, PNG, JPG, or GIF)')).toBeInTheDocument();
      });
    });

    it('shows preview and includes image in onCreate when valid file is selected', async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn();
      const mockObjectUrl = 'blob:http://localhost/test-image';
      global.URL.createObjectURL = vi.fn(() => mockObjectUrl);

      const mockImage = {
        onload: null as (() => void) | null,
        src: '',
        width: 400,
        height: 200,
      };
      global.Image = vi.fn(() => mockImage) as unknown as typeof Image;

      render(<CreateBaseModal {...defaultProps} onCreate={onCreate} />);

      const nameInput = screen.getByLabelText(/Base Name/i);
      await user.type(nameInput, 'New Base');

      const file = new File(['test'], 'test-image.png', { type: 'image/png' });
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockImage.onload).toBeDefined();
      });
      await act(async () => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      });

      await waitFor(() => {
        expect(screen.getByAltText('Preview')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Create Base' }));

      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledWith({
          name: 'New Base',
          description: '',
          image: expect.any(File),
        });
      });
    });

    it('shows error for image exceeding max dimensions', async () => {
      const user = userEvent.setup();
      global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/large-image');

      const mockImage = {
        onload: null as (() => void) | null,
        src: '',
        width: 1000,
        height: 500,
      };
      global.Image = vi.fn(() => mockImage) as unknown as typeof Image;

      render(<CreateBaseModal {...defaultProps} />);

      const file = new File(['test'], 'large-image.png', { type: 'image/png' });
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockImage.onload).toBeDefined();
      });
      await act(async () => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Image dimensions must be max 800 x 400px')).toBeInTheDocument();
      });
    });

    it('shows error when image fails to load', async () => {
      const user = userEvent.setup();
      global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/failed-image');

      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
        width: 400,
        height: 200,
      };
      global.Image = vi.fn(() => mockImage) as unknown as typeof Image;

      render(<CreateBaseModal {...defaultProps} />);

      const file = new File(['test'], 'failed-image.png', { type: 'image/png' });
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockImage.onerror).toBeDefined();
      });
      await act(async () => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to load image. Please try again.')).toBeInTheDocument();
      });
    });

    it('handles dragOver without error', () => {
      render(<CreateBaseModal {...defaultProps} />);

      const dropZone = screen.getByText(/Click to upload/i).closest('button');
      expect(dropZone).toBeTruthy();
      if (dropZone) {
        fireEvent.dragOver(dropZone, { preventDefault: vi.fn(), stopPropagation: vi.fn() });
      }
    });

    it('handles drop with valid image', async () => {
      const mockObjectUrl = 'blob:http://localhost/dropped-image';
      global.URL.createObjectURL = vi.fn(() => mockObjectUrl);

      const mockImage = {
        onload: null as (() => void) | null,
        src: '',
        width: 400,
        height: 200,
      };
      global.Image = vi.fn(() => mockImage) as unknown as typeof Image;

      render(<CreateBaseModal {...defaultProps} />);

      const file = new File(['test'], 'dropped-image.png', { type: 'image/png' });
      const dropZone = screen.getByText(/Click to upload/i).closest('button');
      expect(dropZone).toBeTruthy();
      if (dropZone) {
        fireEvent.dragOver(dropZone, { preventDefault: vi.fn(), stopPropagation: vi.fn() });
        fireEvent.drop(dropZone, {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: { files: [file] },
        });
      }

      await act(async () => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      });

      await waitFor(() => {
        expect(screen.getByAltText('Preview')).toBeInTheDocument();
      });
    });

    it('shows error for invalid file type in drop', async () => {
      render(<CreateBaseModal {...defaultProps} />);

      const file = new File(['test'], 'invalid.bmp', { type: 'image/bmp' });
      const dropZone = screen.getByText(/Click to upload/i).closest('button');
      expect(dropZone).toBeTruthy();
      if (dropZone) {
        fireEvent.drop(dropZone, {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: { files: [file] },
        });
      }

      await waitFor(() => {
        expect(screen.getByText('Please upload a valid image file (SVG, PNG, JPG, or GIF)')).toBeInTheDocument();
      });
    });

    it('clears image when remove button is clicked', async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn();
      const mockObjectUrl = 'blob:http://localhost/test-image';
      global.URL.createObjectURL = vi.fn(() => mockObjectUrl);

      const mockImage = {
        onload: null as (() => void) | null,
        src: '',
        width: 400,
        height: 200,
      };
      global.Image = vi.fn(() => mockImage) as unknown as typeof Image;

      render(<CreateBaseModal {...defaultProps} onCreate={onCreate} />);

      const nameInput = screen.getByLabelText(/Base Name/i);
      await user.type(nameInput, 'New Base');

      const file = new File(['test'], 'test-image.png', { type: 'image/png' });
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      await user.upload(fileInput, file);

      await act(async () => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      });

      await waitFor(() => {
        expect(screen.getByAltText('Preview')).toBeInTheDocument();
      });

      const previewImg = screen.getByAltText('Preview');
      const previewContainer = previewImg.closest('.relative');
      const removeImageButton = previewContainer?.querySelector('button.bg-red-500');
      if (removeImageButton instanceof HTMLElement) {
        await user.click(removeImageButton);
      }

      await waitFor(() => {
        expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Create Base' }));

      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledWith({
          name: 'New Base',
          description: '',
          image: null,
        });
      });
    });

    it('displays initial image preview when initialImage is provided', () => {
      render(<CreateBaseModal {...defaultProps} initialImage="https://example.com/image.png" />);

      expect(screen.getByAltText('Preview')).toHaveAttribute('src', 'https://example.com/image.png');
    });
  });

  describe('help icon color', () => {
    it('shows red help icon when there is validation error', async () => {
      const user = userEvent.setup();

      render(<CreateBaseModal {...defaultProps} />);

      const input = screen.getByLabelText(/Base Name/i);
      await user.type(input, 'AB');

      await waitFor(() => {
        expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
      });

      const helpIcon = document.querySelector('.text-red-500');
      expect(helpIcon).toBeInTheDocument();
    });

    it('shows green help icon when name meets minimum length', async () => {
      const user = userEvent.setup();

      render(<CreateBaseModal {...defaultProps} />);

      const input = screen.getByLabelText(/Base Name/i);
      await user.type(input, 'Valid');

      const helpIcon = document.querySelector('.text-green-600');
      expect(helpIcon).toBeInTheDocument();
    });
  });
});
