import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FieldsList } from '../FieldsList';
import type { FormField } from '../../../../../types/form';

vi.mock('../SortableFieldItem', () => ({
  SortableFieldItem: ({
    field,
    onSelect,
    onToggle,
    onDelete,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
  }: any) => (
    <div data-testid={`field-${field.id}`}>
      <button type="button" aria-label={`Select field ${field.title}`} onClick={() => onSelect(field.id)}>
        {field.title}
      </button>
      <button type="button" onClick={() => onToggle?.()}>{`toggle-${field.id}`}</button>
      <button type="button" onClick={() => onDelete?.(field.id)}>{`delete-${field.id}`}</button>
      <button type="button" onClick={() => onDragStart?.()}>{`drag-start-${field.id}`}</button>
      <button type="button" onClick={() => onDragOver?.()}>{`drag-over-${field.id}`}</button>
      <button type="button" onClick={() => onDrop?.()}>{`drop-${field.id}`}</button>
      <button type="button" onClick={() => onDragEnd?.()}>{`drag-end-${field.id}`}</button>
    </div>
  ),
}));

describe('FieldsList', () => {
  const mockFields: FormField[] = [
    {
      id: 'f1',
      name: 'Title',
      type: 'text',
      label: 'Title',
      title: 'Title',
      column_name: 'title',
      system: false,
      isSystem: false,
      is_hidden: false,
    },
    {
      id: 'f2',
      name: 'Description',
      type: 'longText',
      label: 'Description',
      title: 'Description',
      column_name: 'description',
      system: false,
      isSystem: false,
      is_hidden: false,
    },
  ];

  const mockOnFieldSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render search input with placeholder', () => {
      render(
        <FieldsList
          fields={mockFields}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
        />
      );

      expect(screen.getByPlaceholderText('Search fields...')).toBeInTheDocument();
    });

    it('should render selected fields count text', () => {
      render(
        <FieldsList
          fields={mockFields}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
        />
      );

      expect(screen.getByText(/Selected fields/)).toBeInTheDocument();
    });

    it('should render Select all checkbox label', () => {
      render(
        <FieldsList
          fields={mockFields}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
        />
      );

      expect(screen.getByText('Select all')).toBeInTheDocument();
    });

    it('should render field names from fields prop', () => {
      render(
        <FieldsList
          fields={mockFields}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
        />
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should filter out system fields from visible list', () => {
      const fieldsWithSystem: FormField[] = [
        ...mockFields,
        {
          id: 'f3',
          name: 'System Field',
          type: 'text',
          label: 'System',
          title: 'System',
          column_name: 'id',
          system: true,
          isSystem: true,
          is_hidden: false,
        } as FormField,
      ];

      render(
        <FieldsList
          fields={fieldsWithSystem}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
        />
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.queryByText('System Field')).not.toBeInTheDocument();
    });
  });

  describe('Search', () => {
    it('should filter fields when search term is entered', () => {
      render(
        <FieldsList
          fields={mockFields}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
        />
      );

      const input = screen.getByPlaceholderText('Search fields...');
      fireEvent.change(input, { target: { value: 'Title' } });

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.queryByText('Description')).not.toBeInTheDocument();
    });

    it('should show all matching fields when search is cleared', () => {
      render(
        <FieldsList
          fields={mockFields}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
        />
      );

      const input = screen.getByPlaceholderText('Search fields...');
      fireEvent.change(input, { target: { value: 'Desc' } });
      fireEvent.change(input, { target: { value: '' } });

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });

  describe('Field selection', () => {
    it('should call onFieldSelect when field item is clicked', () => {
      render(
        <FieldsList
          fields={mockFields}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
        />
      );

      const titleItem = screen.getByLabelText('Select field Title');
      fireEvent.click(titleItem);

      expect(mockOnFieldSelect).toHaveBeenCalledWith('f1');
    });

    it('should show selected state for selectedFieldId', () => {
      render(
        <FieldsList
          fields={mockFields}
          selectedFieldId="f1"
          onFieldSelect={mockOnFieldSelect}
        />
      );

      const titleItem = screen.getByLabelText('Select field Title');
      expect(titleItem).toBeInTheDocument();
    });
  });

  describe('Select all', () => {
    it('should disable Select all when setVisibleAllFields is not provided', () => {
      render(
        <FieldsList
          fields={mockFields}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /Select all/i });
      expect(checkbox).toBeDisabled();
    });

    it('should call setVisibleAllFields when Select all is toggled and handler is provided', () => {
      const mockSetVisibleAllFields = vi.fn();
      render(
        <FieldsList
          fields={mockFields}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
          setVisibleAllFields={mockSetVisibleAllFields}
        />
      );

      const label = screen.getByText('Select all');
      fireEvent.click(label);

      expect(mockSetVisibleAllFields).toHaveBeenCalled();
    });

    it('should toggle select all based on current state', () => {
      const mockSetVisibleAllFields = vi.fn();
      const fieldsWithHidden: FormField[] = [
        ...mockFields,
        {
          id: 'f3',
          name: 'Hidden',
          type: 'text',
          label: 'Hidden',
          title: 'Hidden',
          column_name: 'hidden',
          system: false,
          isSystem: false,
          is_hidden: true,
        },
      ];

      render(
        <FieldsList
          fields={fieldsWithHidden}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
          setVisibleAllFields={mockSetVisibleAllFields}
        />
      );

      fireEvent.click(screen.getByRole('checkbox', { name: /select all/i }));
      expect(mockSetVisibleAllFields).toHaveBeenCalledWith(true);
    });
  });

  describe('Edge cases', () => {
    it('should render empty list when fields is empty', () => {
      render(
        <FieldsList
          fields={[]}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
        />
      );

      expect(screen.getByPlaceholderText('Search fields...')).toBeInTheDocument();
      expect(screen.getByText('Select all')).toBeInTheDocument();
    });

    it('should render single field', () => {
      render(
        <FieldsList
          fields={[mockFields[0]]}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
        />
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.queryByText('Description')).not.toBeInTheDocument();
    });
  });

  describe('Drag and toggle behavior', () => {
    it('calls onFieldOrderChange when dragging between fields', () => {
      const onFieldOrderChange = vi.fn();
      render(
        <FieldsList
          fields={mockFields}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
          onFieldOrderChange={onFieldOrderChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'drag-start-f1' }));
      fireEvent.click(screen.getByRole('button', { name: 'drag-over-f2' }));
      fireEvent.click(screen.getByRole('button', { name: 'drop-f2' }));

      expect(onFieldOrderChange).toHaveBeenCalledWith([
        mockFields[1],
        mockFields[0],
      ]);
    });

    it('does not reorder when onFieldOrderChange is missing', () => {
      render(
        <FieldsList
          fields={mockFields}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'drag-start-f1' }));
      fireEvent.click(screen.getByRole('button', { name: 'drop-f2' }));
      expect(mockOnFieldSelect).not.toHaveBeenCalledWith('reordered');
    });

    it('calls onFieldToggle and onDeleteField when provided', () => {
      const onFieldToggle = vi.fn();
      const onDeleteField = vi.fn();

      render(
        <FieldsList
          fields={mockFields}
          selectedFieldId={null}
          onFieldSelect={mockOnFieldSelect}
          onFieldToggle={onFieldToggle}
          onDeleteField={onDeleteField}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'toggle-f1' }));
      fireEvent.click(screen.getByRole('button', { name: 'delete-f2' }));

      expect(onFieldToggle).toHaveBeenCalledWith('f1');
      expect(onDeleteField).toHaveBeenCalledWith('f2');
    });
  });
});
