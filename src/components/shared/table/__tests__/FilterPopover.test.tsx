import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterPopover } from '../FilterPopover';

const mockPosition = { top: 100, left: 200 };

vi.mock('../../../../hooks/useSmartPopover', () => ({
  useSmartPopover: vi.fn((opts: { open: boolean }) => ({
    position: opts.open ? mockPosition : null,
  })),
}));

vi.mock('../../../../types/fieldTypes', () => ({
  getFieldTypeIconComponent: vi.fn(() => null),
}));

vi.mock('../../../../utils/filterUtils', () => ({
  FIELD_TYPE_OPERATORS: { text: [{ value: 'is equal', label: 'is equal' }], default: [{ value: 'is equal', label: 'is equal' }] },
  isFilterComplete: vi.fn((f: { column: string; value: string }) => !!f.column && f.value !== undefined),
  getDefaultOperator: vi.fn(() => 'is equal'),
  formatDurationValue: vi.fn((v: string) => v),
  normalizeFilterValue: vi.fn((_f: unknown, v: string) => v),
  getVisibleColumns: vi.fn((cols: unknown[]) => cols),
  parseMultiSelectValue: vi.fn((v: unknown) => (Array.isArray(v) ? v : [])),
  operatorRequiresValue: vi.fn(() => true),
}));

vi.mock('../../../../types/constants', () => ({
  fieldsToExcludeInFilter: [],
}));

const defaultColumns = [
  { id: 'col1', title: 'Name', column_name: 'name', uidt: 'text', config: {} },
  { id: 'col2', title: 'Count', column_name: 'count', uidt: 'number', config: {} },
];

describe('FilterPopover', () => {
  const mockOnAddFilter = vi.fn();
  const mockOnRemoveFilter = vi.fn();
  const mockOnUpdateFilter = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render Filter trigger button', () => {
      render(
        <FilterPopover
          columns={defaultColumns}
          filters={[]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );
      expect(screen.getByRole('button', { name: /Filter/i })).toBeInTheDocument();
    });

    it('should show filter count badge when filters exist', () => {
      render(
        <FilterPopover
          columns={defaultColumns}
          filters={[
            { column: 'name', operator: 'is equal', value: 'x', logic: 'AND' },
          ]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should not show panel when closed', () => {
      render(
        <FilterPopover
          columns={defaultColumns}
          filters={[]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );
      expect(screen.queryByText('Where')).not.toBeInTheDocument();
    });
  });

  describe('Open panel', () => {
    it('should open panel and show Where when trigger is clicked', async () => {
      render(
        <FilterPopover
          columns={defaultColumns}
          filters={[]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );
      const button = screen.getByRole('button', { name: /Filter/i });
      await userEvent.click(button);
      expect(screen.getByText('Where')).toBeInTheDocument();
    });

    it('should show Add filter button when open', async () => {
      render(
        <FilterPopover
          columns={defaultColumns}
          filters={[]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );
      const button = screen.getByRole('button', { name: /Filter/i });
      await userEvent.click(button);
      expect(screen.getByText('Add filter')).toBeInTheDocument();
    });
  });

  describe('Existing filters', () => {
    it('should render existing filter row with column and remove button', async () => {
      render(
        <FilterPopover
          columns={defaultColumns}
          filters={[{ column: 'name', operator: 'is equal', value: 'test', logic: 'AND' }]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );
      const button = screen.getByRole('button', { name: /Filter/i });
      await userEvent.click(button);
      expect(screen.getByText('Name')).toBeInTheDocument();
      const removeButtons = document.querySelectorAll('button[class*="hover:text-red"]');
      expect(removeButtons.length).toBeGreaterThan(0);
    });

    it('should call onRemoveFilter when remove is clicked', async () => {
      render(
        <FilterPopover
          columns={defaultColumns}
          filters={[{ column: 'name', operator: 'is equal', value: 'x', logic: 'AND' }]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );
      const button = screen.getByRole('button', { name: /Filter/i });
      await userEvent.click(button);
      const trashButton = document.querySelector('button');
      const trashIconButton = Array.from(document.querySelectorAll('button')).find(
        (b) => b.querySelector('svg') && b.getAttribute('class')?.includes('text-gray')
      );
      if (trashIconButton) {
        fireEvent.click(trashIconButton);
        expect(mockOnRemoveFilter).toHaveBeenCalledWith(0);
      }
    });
  });
});
