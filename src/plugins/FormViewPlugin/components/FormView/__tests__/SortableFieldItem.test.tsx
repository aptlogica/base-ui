import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SortableFieldItem } from '../SortableFieldItem';
import type { FormField } from '../../../../../types/form';

describe('SortableFieldItem', () => {
  const mockField: FormField = {
    id: 'f1',
    name: 'Title',
    type: 'text',
    label: 'Title',
    title: 'Title',
  };

  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render field name', () => {
      render(
        <SortableFieldItem
          field={mockField}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('should render field type', () => {
      render(
        <SortableFieldItem
          field={mockField}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText('text')).toBeInTheDocument();
    });

    it('should have role button for accessibility', () => {
      render(
        <SortableFieldItem
          field={mockField}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByRole('button', { name: 'Select field Title' })).toBeInTheDocument();
    });

    it('should render drag handle when draggable is true', () => {
      render(
        <SortableFieldItem
          field={mockField}
          isSelected={false}
          onSelect={mockOnSelect}
          draggable={true}
        />
      );
      expect(screen.getByLabelText('Drag to reorder field')).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should call onSelect with field id when item is clicked', () => {
      render(
        <SortableFieldItem
          field={mockField}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );
      const item = screen.getByRole('button', { name: 'Select field Title' });
      fireEvent.click(item);
      expect(mockOnSelect).toHaveBeenCalledWith('f1');
    });

    it('should call onSelect when Enter key is pressed', () => {
      render(
        <SortableFieldItem
          field={mockField}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );
      const item = screen.getByRole('button', { name: 'Select field Title' });
      fireEvent.keyDown(item, { key: 'Enter' });
      expect(mockOnSelect).toHaveBeenCalledWith('f1');
    });

    it('should call onSelect when Space key is pressed', () => {
      render(
        <SortableFieldItem
          field={mockField}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );
      const item = screen.getByRole('button', { name: 'Select field Title' });
      fireEvent.keyDown(item, { key: ' ' });
      expect(mockOnSelect).toHaveBeenCalledWith('f1');
    });
  });

  describe('Visibility toggle', () => {
    it('should render visibility toggle button when onToggle is provided', () => {
      render(
        <SortableFieldItem
          field={mockField}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggle={vi.fn()}
        />
      );
      expect(screen.getByTitle('Hide field')).toBeInTheDocument();
    });

    it('should call onToggle with field id when visibility button is clicked', () => {
      const mockOnToggle = vi.fn();
      render(
        <SortableFieldItem
          field={mockField}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggle={mockOnToggle}
        />
      );
      const toggleButton = screen.getByTitle('Hide field');
      fireEvent.click(toggleButton);
      expect(mockOnToggle).toHaveBeenCalledWith('f1');
    });

    it('should show Show field title when field is hidden', () => {
      const hiddenField: FormField = { ...mockField, is_hidden: true };
      render(
        <SortableFieldItem
          field={hiddenField}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggle={vi.fn()}
        />
      );
      expect(screen.getByTitle('Show field')).toBeInTheDocument();
    });
  });

  describe('Delete', () => {
    it('should render delete button when onDelete is provided', () => {
      render(
        <SortableFieldItem
          field={mockField}
          isSelected={false}
          onSelect={mockOnSelect}
          onDelete={vi.fn()}
        />
      );
      expect(screen.getByTitle('Delete field')).toBeInTheDocument();
    });

    it('should call onDelete with field id when delete button is clicked', () => {
      const mockOnDelete = vi.fn();
      render(
        <SortableFieldItem
          field={mockField}
          isSelected={false}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
        />
      );
      const deleteButton = screen.getByTitle('Delete field');
      fireEvent.click(deleteButton);
      expect(mockOnDelete).toHaveBeenCalledWith('f1');
    });

    it('should not render delete button when onDelete is not provided', () => {
      render(
        <SortableFieldItem
          field={mockField}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.queryByTitle('Delete field')).not.toBeInTheDocument();
    });
  });

  describe('Drag and drop', () => {
    it('should have draggable attribute when draggable prop is true', () => {
      const { container } = render(
        <SortableFieldItem
          field={mockField}
          isSelected={false}
          onSelect={mockOnSelect}
          draggable={true}
        />
      );
      const draggableEl = container.querySelector('[draggable="true"]');
      expect(draggableEl).toBeInTheDocument();
    });

    it('should call onDragStart when drag starts', () => {
      const mockOnDragStart = vi.fn();
      const { container } = render(
        <SortableFieldItem
          field={mockField}
          isSelected={false}
          onSelect={mockOnSelect}
          draggable={true}
          onDragStart={mockOnDragStart}
        />
      );
      const draggableEl = container.querySelector('[draggable="true"]');
      if (draggableEl) {
        fireEvent.dragStart(draggableEl);
        expect(mockOnDragStart).toHaveBeenCalled();
      }
    });
  });

  describe('Selected state', () => {
    it('should apply selected styling when isSelected is true', () => {
      render(
        <SortableFieldItem
          field={mockField}
          isSelected={true}
          onSelect={mockOnSelect}
        />
      );
      const item = screen.getByRole('button', { name: 'Select field Title' });
      expect(item.className).toContain('border-primary');
    });
  });
});
