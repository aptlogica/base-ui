import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ColumnSelectionSection } from '../ColumnSelectionSection';

type ColumnSelectionSectionProps = ComponentProps<typeof ColumnSelectionSection>;
type GridColumn = ColumnSelectionSectionProps['columns'][number];

const createProps = (overrides: Partial<ColumnSelectionSectionProps> = {}): ColumnSelectionSectionProps => ({
  columns: [] as ColumnSelectionSectionProps['columns'],
  selectedColumnIds: [],
  onToggleColumn: vi.fn(),
  onToggleAllColumns: vi.fn(),
  ...overrides,
});

describe('ColumnSelectionSection', () => {
  it('renders the default title, description, and unchecked select-all state when no columns are provided', () => {
    render(<ColumnSelectionSection {...createProps()} />);

    expect(screen.getByText('Select columns')).toBeInTheDocument();
    expect(screen.getByText('Choose the columns to include in this action.')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select all' })).not.toBeChecked();
  });

  it('shows the empty-state message when there are no columns to select', () => {
    render(<ColumnSelectionSection {...createProps()} />);

    expect(screen.getByText('No columns available.')).toBeInTheDocument();
  });

  it('calls onToggleColumn with the column id when the column has an id', () => {
    const onToggleColumn = vi.fn();
    const columns: GridColumn[] = [
      { id: 'column-id', key: 'fallback-key', title: 'ID Column', type: 'text' },
    ];

    render(
      <ColumnSelectionSection
        {...createProps({
          columns,
          onToggleColumn,
        })}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'ID Column' }));

    expect(onToggleColumn).toHaveBeenCalledWith('column-id');
  });

  it('calls onToggleColumn with the column key when the column id is missing', () => {
    const onToggleColumn = vi.fn();
    const columns: GridColumn[] = [{ id: '', key: 'column-key', title: 'Key Column', type: 'text' }];

    render(
      <ColumnSelectionSection
        {...createProps({
          columns,
          onToggleColumn,
        })}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Key Column' }));

    expect(onToggleColumn).toHaveBeenCalledWith('column-key');
  });

  it('calls onToggleColumn with the column_name when both id and key are missing', () => {
    const onToggleColumn = vi.fn();
    const columns: GridColumn[] = [{ id: '', key: '', column_name: 'column_name_id', title: 'Column Name', type: 'text' }];

    render(
      <ColumnSelectionSection
        {...createProps({
          columns,
          onToggleColumn,
        })}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Column Name' }));

    expect(onToggleColumn).toHaveBeenCalledWith('column_name_id');
  });

  it('calls onToggleColumn with the title when id, key, and column_name are missing', () => {
    const onToggleColumn = vi.fn();
    const columns: GridColumn[] = [{ id: '', key: '', column_name: '', title: 'Title Column', type: 'text' }];

    render(
      <ColumnSelectionSection
        {...createProps({
          columns,
          onToggleColumn,
        })}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Title Column' }));

    expect(onToggleColumn).toHaveBeenCalledWith('Title Column');
  });

  it('marks select all as checked when every selectable column is selected', () => {
    const columns: GridColumn[] = [
      { id: 'column-1', key: 'key-1', title: 'First Column', type: 'text' },
      { id: 'column-2', key: 'key-2', title: 'Second Column', type: 'text' },
    ];

    render(
      <ColumnSelectionSection
        {...createProps({
          columns,
          selectedColumnIds: ['column-1', 'column-2'],
        })}
      />
    );

    expect(screen.getByRole('checkbox', { name: 'Select all' })).toBeChecked();
  });

  it('keeps select all unchecked when only some selectable columns are selected', () => {
    const columns: GridColumn[] = [
      { id: 'column-1', key: 'key-1', title: 'First Column', type: 'text' },
      { id: 'column-2', key: 'key-2', title: 'Second Column', type: 'text' },
    ];

    render(
      <ColumnSelectionSection
        {...createProps({
          columns,
          selectedColumnIds: ['column-1'],
        })}
      />
    );

    expect(screen.getByRole('checkbox', { name: 'Select all' })).not.toBeChecked();
  });

  it('calls onToggleAllColumns when select all is toggled', () => {
    const onToggleAllColumns = vi.fn();
    const columns: GridColumn[] = [
      { id: 'column-1', key: 'key-1', title: 'First Column', type: 'text' },
      { id: 'column-2', key: 'key-2', title: 'Second Column', type: 'text' },
    ];

    render(
      <ColumnSelectionSection
        {...createProps({
          columns,
          onToggleAllColumns,
        })}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));

    expect(onToggleAllColumns).toHaveBeenCalledTimes(1);
  });

  it('hides unsupported field types from the column list', () => {
    const columns: GridColumn[] = [
      { id: 'column-1', title: 'Name', uidt: 'text' },
      { id: 'column-2', title: 'Attachment', uidt: 'attachment' },
      { id: 'column-3', title: 'Formula', uidt: 'formula' },
      { id: 'column-4', title: 'Lookup', uidt: 'lookup' },
    ];

    render(<ColumnSelectionSection {...createProps({ columns })} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.queryByText('Attachment')).toBeNull();
    expect(screen.queryByText('Formula')).toBeNull();
    expect(screen.queryByText('Lookup')).toBeNull();
  });
});
