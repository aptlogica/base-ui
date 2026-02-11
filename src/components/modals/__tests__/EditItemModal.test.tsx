import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditItemModal } from '../EditItemModal';

// Mock the MultiLineText component
vi.mock('../../common/Fields/MultiLineText', () => ({
  MultiLineText: ({ label, value, onChange, placeholder }: any) => (
    <div>
      <label htmlFor="edit-description">{label}</label>
      <textarea
        id="edit-description"
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
  validateTableName: vi.fn((name, existingItems, currentItemId) => {
    if (!name || name.trim().length < 3) {
      return { isValid: false, error: 'Name must be at least 3 characters' };
    }
    const isDuplicate = existingItems?.some(
      (item: any) => item.id !== currentItemId && 
        (item.name?.toLowerCase() === name.toLowerCase() ||
         item.title?.toLowerCase() === name.toLowerCase())
    );
    if (isDuplicate) {
      return { isValid: false, error: 'A table with this name already exists' };
    }
    return { isValid: true, error: null };
  }),
  validateViewName: vi.fn((name, existingItems, currentItemId) => {
    if (!name || name.trim().length < 3) {
      return { isValid: false, error: 'Name must be at least 3 characters' };
    }
    const isDuplicate = existingItems?.some(
      (item: any) => item.id !== currentItemId && 
        (item.name?.toLowerCase() === name.toLowerCase() ||
         item.title?.toLowerCase() === name.toLowerCase())
    );
    if (isDuplicate) {
      return { isValid: false, error: 'A view with this name already exists' };
    }
    return { isValid: true, error: null };
  }),
  validateBaseName: vi.fn((name, existingItems, currentItemId) => {
    if (!name || name.trim().length < 3) {
      return { isValid: false, error: 'Name must be at least 3 characters' };
    }
    const isDuplicate = existingItems?.some(
      (item: any) => item.id !== currentItemId && 
        item.name?.toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      return { isValid: false, error: 'A base with this name already exists' };
    }
    return { isValid: true, error: null };
  }),
}));

describe('EditItemModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    title: 'Edit Item',
    subtitle: 'Update item details',
    icon: <span data-testid="icon">📝</span>,
    itemType: 'table' as const,
    existingItems: [],
    currentItemId: 'item-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <EditItemModal {...defaultProps} isOpen={false} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders the modal when isOpen is true', () => {
      render(<EditItemModal {...defaultProps} />);

      expect(screen.getByText('Edit Item')).toBeInTheDocument();
      expect(screen.getByText('Update item details')).toBeInTheDocument();
    });

    it('renders form elements', () => {
      render(<EditItemModal {...defaultProps} />);

      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
      expect(screen.getByTestId('description-input')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
    });

    it('pre-fills name and description from initial values', () => {
      render(
        <EditItemModal
          {...defaultProps}
          initialName="Existing Table"
          initialDescription="Existing Description"
        />
      );

      expect(screen.getByLabelText(/Name/i)).toHaveValue('Existing Table');
      expect(screen.getByTestId('description-input')).toHaveValue('Existing Description');
    });
  });

  describe('form validation for table', () => {
    it('disables submit button when name is empty', async () => {
      const onSave = vi.fn();

      render(<EditItemModal {...defaultProps} onSave={onSave} initialName="" />);

      const submitButton = screen.getByRole('button', { name: 'Update' });
      expect(submitButton).toBeDisabled();
      expect(onSave).not.toHaveBeenCalled();
    });

    it('shows validation error for short name', async () => {
      const user = userEvent.setup();

      render(<EditItemModal {...defaultProps} initialName="" />);

      const input = screen.getByLabelText(/Name/i);
      await user.type(input, 'AB');

      await waitFor(() => {
        expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for duplicate table name', async () => {
      const user = userEvent.setup();
      const existingItems = [
        { id: 'other-table', name: 'Existing Table' }
      ];

      render(
        <EditItemModal
          {...defaultProps}
          existingItems={existingItems}
          initialName=""
        />
      );

      const input = screen.getByLabelText(/Name/i);
      await user.type(input, 'Existing Table');

      await waitFor(() => {
        expect(screen.getByText(/already exists/i)).toBeInTheDocument();
      });
    });

    it('allows saving when name matches current item (editing same item)', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const existingItems = [
        { id: 'item-123', name: 'Current Name' }
      ];

      render(
        <EditItemModal
          {...defaultProps}
          onSave={onSave}
          existingItems={existingItems}
          currentItemId="item-123"
          initialName="Current Name"
        />
      );

      await user.click(screen.getByRole('button', { name: 'Update' }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });
    });
  });

  describe('form validation for view', () => {
    it('shows validation error for duplicate view name', async () => {
      const user = userEvent.setup();
      const existingItems = [
        { id: 'other-view', name: 'Existing View' }
      ];

      render(
        <EditItemModal
          {...defaultProps}
          itemType="view"
          existingItems={existingItems}
          initialName=""
        />
      );

      const input = screen.getByLabelText(/Name/i);
      await user.type(input, 'Existing View');

      await waitFor(() => {
        expect(screen.getByText(/already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('form validation for base', () => {
    it('shows validation error for duplicate base name', async () => {
      const user = userEvent.setup();
      const existingItems = [
        { id: 'other-base', name: 'Existing Base' }
      ];

      render(
        <EditItemModal
          {...defaultProps}
          itemType="base"
          existingItems={existingItems}
          initialName=""
        />
      );

      const input = screen.getByLabelText(/Name/i);
      await user.type(input, 'Existing Base');

      await waitFor(() => {
        expect(screen.getByText(/already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('calls onSave with form data on valid submission', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);

      render(
        <EditItemModal
          {...defaultProps}
          onSave={onSave}
          initialName="Valid Name"
          initialDescription="Description"
        />
      );

      await user.click(screen.getByRole('button', { name: 'Update' }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith({
          name: 'Valid Name',
          description: 'Description',
        });
      });
    });

    it('trims whitespace from name and description', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);

      render(<EditItemModal {...defaultProps} onSave={onSave} initialName="" />);

      const nameInput = screen.getByLabelText(/Name/i);
      const descInput = screen.getByTestId('description-input');

      await user.type(nameInput, '  Updated Name  ');
      await user.type(descInput, '  Updated Description  ');
      
      // Wait for validation to complete
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Update' })).not.toBeDisabled();
      });

      await user.click(screen.getByRole('button', { name: 'Update' }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith({
          name: 'Updated Name',
          description: 'Updated Description',
        });
      });
    });

    it.skip('shows loading state while submitting', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 500)));

      render(
        <EditItemModal
          {...defaultProps}
          onSave={onSave}
          initialName="Valid Name"
        />
      );

      await user.click(screen.getByRole('button', { name: 'Update' }));

      await waitFor(() => {
        expect(screen.getByText(/Updating/)).toBeInTheDocument();
      });
    });

    it('shows error message when name is empty on submit', async () => {
      const onSave = vi.fn();

      render(<EditItemModal {...defaultProps} onSave={onSave} initialName="" />);

      const form = document.getElementById('edit-item-form') as HTMLFormElement;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Table name is required/i)).toBeInTheDocument();
      });
      expect(onSave).not.toHaveBeenCalled();
    });

    it.skip('handles submit error and displays error message', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));

      render(
        <EditItemModal
          {...defaultProps}
          onSave={onSave}
          initialName="Valid Name"
        />
      );

      await user.click(screen.getByRole('button', { name: 'Update' }));

      await waitFor(
        () => {
          expect(screen.getByText(/Failed to update/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('includes image in save data for base type', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);
      const mockObjectUrl = 'blob:http://localhost/test-image';
      global.URL.createObjectURL = vi.fn(() => mockObjectUrl);
      
      const mockImage = {
        onload: null as (() => void) | null,
        src: '',
        width: 400,
        height: 200,
      };
      global.Image = vi.fn(() => mockImage) as unknown as typeof Image;

      render(
        <EditItemModal
          {...defaultProps}
          itemType="base"
          onSave={onSave}
          initialName="Test Base"
        />
      );

      const file = new File(['test'], 'test-image.png', { type: 'image/png' });
      const fileInput = document.getElementById('edit-image-upload') as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.queryByAltText('Preview')).toBeInTheDocument();
      });

      await act(async () => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      });

      await user.click(screen.getByRole('button', { name: 'Update' }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith({
          name: 'Test Base',
          description: '',
          image: expect.any(File),
        });
      });
    });

    it('handles workspace itemType with default validation', async () => {
      const user = userEvent.setup();

      render(
        <EditItemModal
          {...defaultProps}
          itemType="workspace"
          initialName="Test Workspace"
        />
      );

      const input = screen.getByLabelText(/Name/i);
      await user.type(input, 'New Workspace');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Update' })).not.toBeDisabled();
      });
    });
  });

  describe('interactions', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<EditItemModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<EditItemModal {...defaultProps} onClose={onClose} />);

      // Look for the backdrop button with aria-label
      const backdrop = screen.getByLabelText('Close modal');
      await user.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when pressing Escape key', () => {
      const onClose = vi.fn();

      const { container } = render(<EditItemModal {...defaultProps} onClose={onClose} />);

      const backdrop = container.querySelector('.bg-modal-backdrop');
      fireEvent.keyDown(backdrop!, { key: 'Escape', code: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('state reset', () => {
    it('resets form when modal reopens with new initial values', async () => {
      const { rerender } = render(
        <EditItemModal {...defaultProps} initialName="First Name" initialDescription="First Description" />
      );

      expect(screen.getByLabelText(/Name/i)).toHaveValue('First Name');
      expect(screen.getByTestId('description-input')).toHaveValue('First Description');

      rerender(<EditItemModal {...defaultProps} isOpen={false} />);
      rerender(
        <EditItemModal
          {...defaultProps}
          isOpen={true}
          initialName="Second Name"
          initialDescription="Second Description"
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Name/i)).toHaveValue('Second Name');
        expect(screen.getByTestId('description-input')).toHaveValue('Second Description');
      });
    });

    it('handles undefined initial values gracefully', () => {
      render(
        <EditItemModal
          {...defaultProps}
          initialName={undefined}
          initialDescription={undefined}
        />
      );

      expect(screen.getByLabelText(/Name/i)).toHaveValue('');
      expect(screen.getByTestId('description-input')).toHaveValue('');
    });
  });

  describe('image upload for base type', () => {
    const baseProps = {
      ...defaultProps,
      itemType: 'base' as const,
      title: 'Edit Base',
      subtitle: 'Update base details',
    };

    it('renders image upload section when itemType is base', () => {
      render(<EditItemModal {...baseProps} initialName="Test Base" />);

      expect(screen.getByText('Image')).toBeInTheDocument();
      expect(screen.getByText(/Click to upload/i)).toBeInTheDocument();
      expect(screen.getByText(/SVG, PNG, JPG or GIF/i)).toBeInTheDocument();
    });

    it('does not render image upload section for table type', () => {
      render(<EditItemModal {...defaultProps} itemType="table" initialName="Test Table" />);

      expect(screen.queryByText('Image')).not.toBeInTheDocument();
    });

    it('does not render image upload section for view type', () => {
      render(<EditItemModal {...defaultProps} itemType="view" initialName="Test View" />);

      expect(screen.queryByText('Image')).not.toBeInTheDocument();
    });

    it('does not render image upload section for workspace type', () => {
      render(<EditItemModal {...defaultProps} itemType="workspace" initialName="Test Workspace" />);

      expect(screen.queryByText('Image')).not.toBeInTheDocument();
    });

    it('displays initial image preview when provided', () => {
      render(
        <EditItemModal
          {...baseProps}
          initialName="Test Base"
          initialImage="https://example.com/image.png"
        />
      );

      const previewImage = screen.getByAltText('Preview');
      expect(previewImage).toBeInTheDocument();
      expect(previewImage).toHaveAttribute('src', 'https://example.com/image.png');
    });

    it('shows remove button when image preview is displayed', () => {
      render(
        <EditItemModal
          {...baseProps}
          initialName="Test Base"
          initialImage="https://example.com/image.png"
        />
      );

      // The remove button is the X button near the image preview
      const previewImage = screen.getByAltText('Preview');
      expect(previewImage).toBeInTheDocument();
      
      // Find the remove button by its class (red background button)
      const buttons = screen.getAllByRole('button');
      const removeButton = buttons.find(btn => 
        btn.className.includes('bg-red-500')
      );
      expect(removeButton).toBeInTheDocument();
    });

    it('clears image preview when remove button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <EditItemModal
          {...baseProps}
          initialName="Test Base"
          initialImage="https://example.com/image.png"
        />
      );

      expect(screen.getByAltText('Preview')).toBeInTheDocument();

      // Find and click the remove button (button inside the image preview area)
      const buttons = screen.getAllByRole('button');
      const removeButton = buttons.find(btn => 
        btn.className.includes('bg-red-500')
      );
      
      if (removeButton) {
        await user.click(removeButton);
      }

      await waitFor(() => {
        expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
      });
    });

    it('has hidden file input with correct accept attribute', () => {
      render(<EditItemModal {...baseProps} initialName="Test Base" />);

      const fileInput = document.getElementById('edit-image-upload') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', 'image/svg+xml,image/png,image/jpeg,image/jpg,image/gif');
      expect(fileInput).toHaveClass('hidden');
    });

    it('uploads image when valid file is selected', async () => {
      const user = userEvent.setup();
      
      // Mock URL.createObjectURL
      const mockObjectUrl = 'blob:http://localhost/test-image';
      global.URL.createObjectURL = vi.fn(() => mockObjectUrl);
      
      // Mock Image constructor for dimension validation
      const mockImage = {
        onload: null as (() => void) | null,
        src: '',
        width: 400,
        height: 200,
      };
      global.Image = vi.fn(() => mockImage) as unknown as typeof Image;

      render(<EditItemModal {...baseProps} initialName="Test Base" />);

      // Create a mock file
      const file = new File(['test'], 'test-image.png', { type: 'image/png' });
      const fileInput = document.getElementById('edit-image-upload') as HTMLInputElement;

      // Simulate file selection
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.queryByAltText('Preview')).toBeInTheDocument();
      });

      await act(async () => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      });

      // Check that preview is displayed
      await waitFor(() => {
        const previewImage = screen.queryByAltText('Preview');
        expect(previewImage).toBeInTheDocument();
        expect(previewImage).toHaveAttribute('src', mockObjectUrl);
      });
    });

    it('rejects invalid file types via accept attribute', () => {
      render(<EditItemModal {...baseProps} initialName="Test Base" />);

      const fileInput = document.getElementById('edit-image-upload') as HTMLInputElement;
      
      // The accept attribute enforces file type validation at the browser level
      expect(fileInput).toHaveAttribute('accept', 'image/svg+xml,image/png,image/jpeg,image/jpg,image/gif');
    });

    it('shows error for image exceeding max dimensions', async () => {
      const user = userEvent.setup();
      
      // Mock URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/large-image');
      
      // Mock Image with dimensions exceeding max (800x400)
      const mockImage = {
        onload: null as (() => void) | null,
        src: '',
        width: 1000, // exceeds 800
        height: 500,  // exceeds 400
      };
      global.Image = vi.fn(() => mockImage) as unknown as typeof Image;

      render(<EditItemModal {...baseProps} initialName="Test Base" />);

      const file = new File(['test'], 'large-image.png', { type: 'image/png' });
      const fileInput = document.getElementById('edit-image-upload') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.queryByAltText('Preview')).toBeInTheDocument();
      });

      await act(async () => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      });

      await waitFor(() => {
        expect(screen.getByText(/Image dimensions must be max 800 x 400px/i)).toBeInTheDocument();
      });
    });

    it('shows error when image dimensions are invalid but keeps preview', async () => {
      const user = userEvent.setup();
      
      const mockObjectUrl = 'blob:http://localhost/large-image';
      global.URL.createObjectURL = vi.fn(() => mockObjectUrl);
      
      const mockImage = {
        onload: null as (() => void) | null,
        src: '',
        width: 1000,
        height: 500,
      };
      global.Image = vi.fn(() => mockImage) as unknown as typeof Image;

      render(<EditItemModal {...baseProps} initialName="Test Base" />);

      const file = new File(['test'], 'large-image.png', { type: 'image/png' });
      const fileInput = document.getElementById('edit-image-upload') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        const previewImage = screen.queryByAltText('Preview');
        expect(previewImage).toBeInTheDocument();
        expect(previewImage).toHaveAttribute('src', mockObjectUrl);
      });

      await act(async () => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      });

      await waitFor(() => {
        expect(screen.getByText(/Image dimensions must be max 800 x 400px/i)).toBeInTheDocument();
        expect(screen.queryByAltText('Preview')).toBeInTheDocument();
      });
    });

    it('handles drag and drop image upload', async () => {
      const mockObjectUrl = 'blob:http://localhost/dropped-image';
      global.URL.createObjectURL = vi.fn(() => mockObjectUrl);
      
      const mockImage = {
        onload: null as (() => void) | null,
        src: '',
        width: 400,
        height: 200,
      };
      global.Image = vi.fn(() => mockImage) as unknown as typeof Image;

      render(<EditItemModal {...baseProps} initialName="Test Base" />);

      const file = new File(['test'], 'dropped-image.png', { type: 'image/png' });
      const dropZone = screen.getByText(/Click to upload/i).closest('div');

      fireEvent.dragOver(dropZone!, { preventDefault: vi.fn(), stopPropagation: vi.fn() });
      fireEvent.drop(dropZone!, {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(screen.queryByAltText('Preview')).toBeInTheDocument();
      });

      await act(async () => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      });
    });

    it('shows error for invalid file type in drag and drop', async () => {
      render(<EditItemModal {...baseProps} initialName="Test Base" />);

      const file = new File(['test'], 'invalid.bmp', { type: 'image/bmp' });
      const dropZone = screen.getByText(/Click to upload/i).closest('div');

      fireEvent.dragOver(dropZone!, { preventDefault: vi.fn(), stopPropagation: vi.fn() });
      fireEvent.drop(dropZone!, {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/Please upload a valid image file/i)).toBeInTheDocument();
      });
    });

    it('shows error when image fails to load', async () => {
      const user = userEvent.setup();
      const mockObjectUrl = 'blob:http://localhost/failed-image';
      global.URL.createObjectURL = vi.fn(() => mockObjectUrl);
      
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
        width: 400,
        height: 200,
      };
      global.Image = vi.fn(() => mockImage) as unknown as typeof Image;

      render(<EditItemModal {...baseProps} initialName="Test Base" />);

      const file = new File(['test'], 'failed-image.png', { type: 'image/png' });
      const fileInput = document.getElementById('edit-image-upload') as HTMLInputElement;
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.queryByAltText('Preview')).toBeInTheDocument();
      });

      await act(async () => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to load image/i)).toBeInTheDocument();
      });
    });

    it('shows error for invalid file type in file input', async () => {
      render(<EditItemModal {...baseProps} initialName="Test Base" />);

      const file = new File(['test'], 'invalid.txt', { type: 'text/plain' });
      const fileInput = document.getElementById('edit-image-upload') as HTMLInputElement;

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText(/Please upload a valid image file/i)).toBeInTheDocument();
      });
    });
  });
});
