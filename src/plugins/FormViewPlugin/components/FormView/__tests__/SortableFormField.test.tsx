import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SortableFormField } from '../SortableFormField';
import type { FormField } from '../../../../../types/form';

vi.mock('../../shared/FieldRenderer', () => ({
  default: (props: { type?: string; value?: unknown; onChange?: (v: unknown) => void }) => (
    <div data-testid="field-renderer">
      <span data-testid="field-type">{props.type ?? 'unknown'}</span>
      <input
        data-testid="field-input"
        value={String(props.value ?? '')}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => props.onChange?.(e.target.value)}
      />
    </div>
  ),
}));

describe('SortableFormField', () => {
  const mockField: FormField = {
    id: 'f1',
    name: 'Title',
    type: 'text',
    label: 'Title',
    title: 'Title',
    column_name: 'title',
    isSystem: false,
    system: false,
  };

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render field label', () => {
      render(
        <SortableFormField
          field={mockField}
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('should render required asterisk when field is required', () => {
      const requiredField: FormField = { ...mockField, required: true };
      render(
        <SortableFormField
          field={requiredField}
          value=""
          onChange={mockOnChange}
        />
      );

      const requiredSpan = document.querySelector('.field-component-required');
      expect(requiredSpan).toBeInTheDocument();
      expect(requiredSpan?.textContent).toBe('*');
    });

    it('should render FieldRenderer', () => {
      render(
        <SortableFormField
          field={mockField}
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId('field-renderer')).toBeInTheDocument();
    });

    it('should render field description when provided', () => {
      const fieldWithDesc: FormField = {
        ...mockField,
        description: 'Enter the title',
      };
      render(
        <SortableFormField
          field={fieldWithDesc}
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Enter the title')).toBeInTheDocument();
    });

    it('shows See more toggle for long description', () => {
      const longDescription = 'A'.repeat(200);
      const fieldWithDesc: FormField = { ...mockField, description: longDescription };

      render(
        <SortableFormField
          field={fieldWithDesc}
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('See more')).toBeInTheDocument();
      fireEvent.click(screen.getByText('See more'));
      expect(screen.getByText('See less')).toBeInTheDocument();
    });
  });

  describe('Value and onChange', () => {
    it('should pass value to FieldRenderer', () => {
      render(
        <SortableFormField
          field={mockField}
          value="Hello"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByTestId('field-input');
      expect(input).toHaveValue('Hello');
    });

    it('should call onChange when value changes and not readOnly', () => {
      render(
        <SortableFormField
          field={mockField}
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByTestId('field-input');
      fireEvent.change(input, { target: { value: 'New value' } });

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Read-only mode', () => {
    it('should not call onChange when isReadOnly is true', () => {
      render(
        <SortableFormField
          field={mockField}
          value=""
          onChange={mockOnChange}
          isReadOnly={true}
        />
      );

      const input = screen.getByTestId('field-input');
      fireEvent.change(input, { target: { value: 'x' } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Edit and Delete actions', () => {
    it('should render edit button when onEdit is provided and field is not system', () => {
      render(
        <SortableFormField
          field={mockField}
          value=""
          onChange={mockOnChange}
          onEdit={vi.fn()}
        />
      );

      expect(screen.getByLabelText('Edit field')).toBeInTheDocument();
    });

    it('should call onEdit with field id when edit button is clicked', () => {
      const mockOnEdit = vi.fn();
      render(
        <SortableFormField
          field={mockField}
          value=""
          onChange={mockOnChange}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByLabelText('Edit field');
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith('f1');
    });

    it('should render delete button when onDelete is provided and field is not system', () => {
      render(
        <SortableFormField
          field={mockField}
          value=""
          onChange={mockOnChange}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByLabelText('Delete field')).toBeInTheDocument();
    });

    it('should call onDelete with field id when delete button is clicked', () => {
      const mockOnDelete = vi.fn();
      render(
        <SortableFormField
          field={mockField}
          value=""
          onChange={mockOnChange}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByLabelText('Delete field');
      fireEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith('f1');
    });

    it('should not render edit button for system field', () => {
      const systemField: FormField = { ...mockField, isSystem: true, system: true };
      render(
        <SortableFormField
          field={systemField}
          value=""
          onChange={mockOnChange}
          onEdit={vi.fn()}
        />
      );

      expect(screen.queryByLabelText('Edit field')).not.toBeInTheDocument();
    });
  });

  describe('Drag and drop', () => {
    it('should render drag handle when draggable is true and onDragStart provided', () => {
      render(
        <SortableFormField
          field={mockField}
          value=""
          onChange={mockOnChange}
          draggable={true}
          onDragStart={vi.fn()}
          onDragEnd={vi.fn()}
        />
      );

      expect(screen.getByLabelText('Drag to reorder field')).toBeInTheDocument();
    });

    it('renders drag/drop zone when onDragOver or onDrop provided', () => {
      render(
        <SortableFormField
          field={mockField}
          value=""
          onChange={mockOnChange}
          onDragOver={vi.fn()}
          onDrop={vi.fn()}
        />
      );

      expect(screen.getByLabelText('Drag and drop zone')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should render without onChange', () => {
      render(
        <SortableFormField
          field={mockField}
          value=""
        />
      );

      expect(screen.getByTestId('field-renderer')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('should render with undefined value', () => {
      render(
        <SortableFormField
          field={mockField}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByTestId('field-input');
      expect(input).toHaveValue('');
    });

    it('uses default duration value when value is undefined', () => {
      const durationField: FormField = {
        ...mockField,
        type: 'duration',
        uidt: 'duration',
        config: { durationDefault: 15 },
      };

      render(
        <SortableFormField
          field={durationField}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByTestId('field-input');
      expect(input).toHaveValue('15');
    });

    it('keeps boolean false value instead of default', () => {
      const booleanField: FormField = { ...mockField, type: 'boolean', uidt: 'boolean' };
      render(
        <SortableFormField
          field={booleanField}
          value={false}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByTestId('field-input');
      expect(input).toHaveValue('false');
    });

    it('normalizes link values to empty list when object provided', () => {
      const linksField: FormField = { ...mockField, type: 'links', uidt: 'links' };
      render(
        <SortableFormField
          field={linksField}
          value={{}}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByTestId('field-input');
      expect(input).toHaveValue('');
    });
  });
});
