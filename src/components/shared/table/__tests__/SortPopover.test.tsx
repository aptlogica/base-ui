import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortPopover } from '../SortPopover';
import type { SortItem } from '../../../../utils/sortUtils';

const mockPosition = { top: 100, left: 200 };

vi.mock('../../../../hooks/useSmartPopover', () => ({
  useSmartPopover: vi.fn((opts: { open: boolean }) => ({
    position: opts.open ? mockPosition : null,
  })),
}));

vi.mock('../../../../types/fieldTypes', () => ({
  getFieldTypeIconComponent: vi.fn(() => null),
  getRelationTypeFromField: vi.fn(() => undefined),
}));

vi.mock('../../../../utils/sortUtils', () => ({
  filterValidSorts: vi.fn((s: unknown[]) => s),
}));

const defaultColumns = [
  { id: 'c1', key: 'name', column_name: 'name', title: 'Name', uidt: 'text', type: 'text' },
  { id: 'c2', key: 'count', column_name: 'count', title: 'Count', uidt: 'number', type: 'number' },
];

const ControlledSortPopover = ({ initialSorts = [] }: { initialSorts?: SortItem[] }) => {
  const [sorts, setSorts] = React.useState<SortItem[]>(initialSorts);
  return (
    <SortPopover
      columns={defaultColumns}
      sorts={sorts}
      onChange={setSorts}
    />
  );
};

describe('SortPopover', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render Sort trigger button', () => {
      render(
        <SortPopover
          columns={defaultColumns}
          sorts={[]}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByRole('button', { name: /Sort/i })).toBeInTheDocument();
    });

    it('should show sort count badge when sorts exist', () => {
      render(
        <SortPopover
          columns={defaultColumns}
          sorts={[{ column: 'name', direction: 'asc' }]}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should not show panel when closed', () => {
      render(
        <SortPopover
          columns={defaultColumns}
          sorts={[]}
          onChange={mockOnChange}
        />
      );
      expect(screen.queryByText('No sort options')).not.toBeInTheDocument();
    });
  });

  describe('Open panel', () => {
    it('should open panel and show No sort options when no sorts', async () => {
      render(
        <SortPopover
          columns={defaultColumns}
          sorts={[]}
          onChange={mockOnChange}
        />
      );
      const button = screen.getByRole('button', { name: /Sort/i });
      await userEvent.click(button);
      expect(screen.getByText('No sort options')).toBeInTheDocument();
    });

    it('should show Add Sort Option button when open', async () => {
      render(
        <SortPopover
          columns={defaultColumns}
          sorts={[]}
          onChange={mockOnChange}
        />
      );
      const button = screen.getByRole('button', { name: /Sort/i });
      await userEvent.click(button);
      const addButton = screen.getByText('Add Sort Option');
      expect(addButton).toBeInTheDocument();
      expect(addButton).toBeEnabled();
    });
  });

  describe('Existing sorts', () => {
    it('should render existing sort row with column name', async () => {
      render(
        <SortPopover
          columns={defaultColumns}
          sorts={[{ column: 'name', direction: 'asc' }]}
          onChange={mockOnChange}
        />
      );
      const button = screen.getByRole('button', { name: /Sort/i });
      await userEvent.click(button);
      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('should show Select field for sort without column', async () => {
      render(
        <SortPopover
          columns={defaultColumns}
          sorts={[{ column: '', direction: 'asc' }]}
          onChange={mockOnChange}
        />
      );
      const button = screen.getByRole('button', { name: /Sort/i });
      await userEvent.click(button);
      expect(screen.getByText('Select field')).toBeInTheDocument();
    });
  });

  describe('Add sort', () => {
    it('should add pending sort when Add Sort Option is clicked', async () => {
      render(
        <SortPopover
          columns={defaultColumns}
          sorts={[]}
          onChange={mockOnChange}
        />
      );
      const button = screen.getByRole('button', { name: /Sort/i });
      await userEvent.click(button);
      const addButton = screen.getByText('Add Sort Option');
      await userEvent.click(addButton);
      expect(screen.getByText('Select field')).toBeInTheDocument();
    });

    it('should hide already selected fields when adding another sort', async () => {
      render(<ControlledSortPopover />);

      const trigger = screen.getByRole('button', { name: /Sort/i });
      await userEvent.click(trigger);

      const addButton = screen.getByTestId('add-sort-button');
      await userEvent.click(addButton);

      const firstOptions = await screen.findByTestId('sort-field-options-0');
      await userEvent.click(within(firstOptions).getByText('Name'));

      // Now add another sort and ensure previously used column is hidden
      await userEvent.click(screen.getByTestId('add-sort-button'));
      const secondOptions = await screen.findByTestId('sort-field-options-1');

      expect(within(secondOptions).queryByText('Name')).not.toBeInTheDocument();
      expect(within(secondOptions).getByText('Count')).toBeInTheDocument();
    });
  });

  describe('Remove sort', () => {
    it('should call onChange with filtered sorts when remove is clicked', async () => {
      render(
        <SortPopover
          columns={defaultColumns}
          sorts={[{ column: 'name', direction: 'asc' }]}
          onChange={mockOnChange}
        />
      );
      const button = screen.getByRole('button', { name: /Sort/i });
      await userEvent.click(button);
      const removeButton = screen.getByTitle('Remove sort');
      await userEvent.click(removeButton);
      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Limit add button', () => {
    it('should disable Add Sort Option when all columns are used', async () => {
      render(
        <SortPopover
          columns={defaultColumns}
          sorts={[
            { column: 'name', direction: 'asc' },
            { column: 'count', direction: 'desc' }
          ]}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button', { name: /Sort/i });
      await userEvent.click(trigger);

      const addButton = screen.getByTestId('add-sort-button');
      expect(addButton).toBeDisabled();
    });
  });
});
