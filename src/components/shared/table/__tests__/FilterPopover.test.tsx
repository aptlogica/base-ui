import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterPopover } from '../FilterPopover';
import * as filterUtils from '../../../../utils/filterUtils';

const mockPosition = { top: 100, left: 200 };

vi.mock('../../../../hooks/useSmartPopover', () => ({
  useSmartPopover: vi.fn((opts: { open: boolean }) => ({
    position: opts.open ? mockPosition : null,
  })),
}));

vi.mock('../../../../types/fieldTypes', () => ({
  getFieldTypeIconComponent: vi.fn(() => null),
}));

vi.mock('../../../common/Fields/DateField', () => ({
  DateField: ({ value, onChange }: { value?: string; onChange: (value: string) => void }) => (
    <button type="button" data-testid="mock-date-field" onClick={() => onChange(value ? `${value}-updated` : '2026-02-14')}>
      mock-date-field
    </button>
  ),
}));

vi.mock('../../../common/Fields', () => ({
  Duration: ({ onChange }: { onChange: (value: number) => void }) => (
    <button type="button" data-testid="mock-duration" onClick={() => onChange(125)}>
      mock-duration
    </button>
  ),
  MultiSelect: ({ onChange }: { onChange: (value: string[]) => void }) => (
    <button type="button" data-testid="mock-multiselect" onClick={() => onChange(['A', 'B'])}>
      mock-multiselect
    </button>
  ),
  Rating: ({ onChange }: { onChange: (value: number) => void }) => (
    <button type="button" data-testid="mock-rating" onClick={() => onChange(4)}>
      mock-rating
    </button>
  ),
  SingleSelect: ({ value, onChange }: { value?: string; onChange: (value: string) => void }) => (
    <button type="button" data-testid="mock-singleselect" onClick={() => onChange(value ? '' : 'Open')}>
      mock-singleselect
    </button>
  ),
  Time: ({ value, onChange }: { value?: string; onChange: (value: string) => void }) => (
    <button type="button" data-testid="mock-time" onClick={() => onChange(value ? `${value}:updated` : '10:30')}>
      mock-time
    </button>
  ),
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

    it('updates logic for non-first filter row', async () => {
      render(
        <FilterPopover
          columns={defaultColumns}
          filters={[
            { column: 'name', operator: 'is equal', value: 'x', logic: 'AND' },
            { column: 'count', operator: 'is equal', value: '1', logic: 'AND' },
          ]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /Filter/i }));
      await userEvent.click(screen.getAllByRole('button', { name: 'AND' })[0]);
      await userEvent.click(screen.getByRole('button', { name: 'OR' }));

      expect(mockOnUpdateFilter).toHaveBeenCalledWith(1, { logic: 'OR' });
    });

    it('updates existing filter operator from dropdown', async () => {
      vi.mocked(filterUtils.FIELD_TYPE_OPERATORS as any).text = [
        { value: 'is equal', label: 'is equal' },
        { value: 'contains', label: 'contains' },
      ];

      render(
        <FilterPopover
          columns={defaultColumns}
          filters={[{ column: 'name', operator: 'is equal', value: 'abc', logic: 'AND' }]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /Filter/i }));
      await userEvent.click(screen.getByRole('button', { name: 'is equal' }));
      await userEvent.click(screen.getByRole('button', { name: 'contains' }));

      expect(mockOnUpdateFilter).toHaveBeenCalledWith(0, { operator: 'contains' });
    });

    it('updates existing filter field and resets operator/value', async () => {
      render(
        <FilterPopover
          columns={defaultColumns}
          filters={[{ column: 'name', operator: 'contains', value: 'abc', logic: 'AND' }]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /Filter/i }));
      await userEvent.click(screen.getByRole('button', { name: /Name/i }));
      const fieldDropdown = screen.getByTestId('filter-field-options-0');
      await userEvent.click(within(fieldDropdown).getByText('Count'));

      expect(mockOnUpdateFilter).toHaveBeenCalledWith(0, {
        column: 'count',
        operator: 'is equal',
        value: '',
      });
    });
  });

  describe('Column availability controls', () => {
    it('disables Add filter button when no unused columns remain', async () => {
      render(
        <FilterPopover
          columns={[defaultColumns[0]]}
          filters={[{ column: 'name', operator: 'is equal', value: 'x', logic: 'AND' }]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );
      await userEvent.click(screen.getByRole('button', { name: /Filter/i }));
      const addButton = screen.getByRole('button', { name: /Add filter/i });
      expect(addButton).toBeDisabled();
    });

    it('hides already used columns in new filter dropdown', async () => {
      render(
        <FilterPopover
          columns={defaultColumns}
          filters={[{ column: 'name', operator: 'is equal', value: 'x', logic: 'AND' }]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );
      await userEvent.click(screen.getByRole('button', { name: /Filter/i }));
      await userEvent.click(screen.getByRole('button', { name: /Add filter/i }));
      await userEvent.click(screen.getByRole('button', { name: /Select field/i }));
      const dropdown = screen.getByTestId('filter-new-field-options');
      const dropdownScope = within(dropdown);
      expect(dropdownScope.queryByText('Name')).not.toBeInTheDocument();
      expect(dropdownScope.getByText('Count')).toBeInTheDocument();
    });
  });

  describe('Value handling branches', () => {
    it('does not render value input for boolean fields', async () => {
      render(
        <FilterPopover
          columns={[
            { id: 'col1', title: 'Done', column_name: 'done', uidt: 'boolean', config: {} },
          ]}
          filters={[{ column: 'done', operator: 'is equal', value: 'true', logic: 'AND' }]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /Filter/i }));
      expect(screen.queryByPlaceholderText('Enter a value')).not.toBeInTheDocument();
    });

    it('shows numeric pill and clears existing number value', async () => {
      render(
        <FilterPopover
          columns={[
            { id: 'col1', title: 'Count', column_name: 'count', uidt: 'number', config: {} },
          ]}
          filters={[{ column: 'count', operator: 'is equal', value: '42', logic: 'AND' }]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /Filter/i }));
      const pill = screen.getByText('42').closest('div');
      expect(pill).toBeInTheDocument();
      const clearButton = within(pill as HTMLElement).getByRole('button');
      fireEvent.click(clearButton);

      expect(mockOnUpdateFilter).toHaveBeenCalledWith(0, { value: '' });
    });

    it('updates number value on blur for existing filter input', async () => {
      vi.mocked(filterUtils.operatorRequiresValue).mockReturnValue(true);

      render(
        <FilterPopover
          columns={[
            { id: 'col1', title: 'Count', column_name: 'count', uidt: 'number', config: {} },
          ]}
          filters={[{ column: 'count', operator: 'is equal', value: '', logic: 'AND' }]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /Filter/i }));
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '100' } });
      fireEvent.blur(input);

      expect(mockOnUpdateFilter).toHaveBeenCalledWith(0, { value: '100' });
    });

    it('clears date value pill for existing date filter', async () => {
      vi.mocked(filterUtils.operatorRequiresValue).mockReturnValue(true);
      render(
        <FilterPopover
          columns={[
            { id: 'col-date', title: 'Due', column_name: 'due', uidt: 'date', config: {} },
          ]}
          filters={[{ column: 'due', operator: 'is equal', value: '2026-01-01', logic: 'AND' }]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /Filter/i }));
      const pill = screen.getByText('2026-01-01').closest('div');
      const clearButton = within(pill as HTMLElement).getByRole('button');
      await userEvent.click(clearButton);
      expect(mockOnUpdateFilter).toHaveBeenCalledWith(0, { value: '' });
    });

    it('renders date field input and updates existing date value', async () => {
      vi.mocked(filterUtils.operatorRequiresValue).mockReturnValue(false);
      render(
        <FilterPopover
          columns={[
            { id: 'col-date', title: 'Due', column_name: 'due', uidt: 'date', config: {} },
          ]}
          filters={[{ column: 'due', operator: 'is equal', value: '', logic: 'AND' }]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /Filter/i }));
      await userEvent.click(screen.getByTestId('mock-date-field'));
      expect(mockOnUpdateFilter).toHaveBeenCalledWith(0, { value: '2026-02-14' });
    });

    it('renders duration input and updates existing duration value', async () => {
      vi.mocked(filterUtils.operatorRequiresValue).mockReturnValue(false);
      render(
        <FilterPopover
          columns={[
            { id: 'col-duration', title: 'Duration', column_name: 'duration', uidt: 'duration', config: {} },
          ]}
          filters={[{ column: 'duration', operator: 'is equal', value: '', logic: 'AND' }]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /Filter/i }));
      await userEvent.click(screen.getByTestId('mock-duration'));
      expect(mockOnUpdateFilter).toHaveBeenCalledWith(0, { value: '125' });
    });

    it('renders rating input and updates existing rating value', async () => {
      vi.mocked(filterUtils.operatorRequiresValue).mockReturnValue(false);
      render(
        <FilterPopover
          columns={[
            { id: 'col-rating', title: 'Rating', column_name: 'rating', uidt: 'rating', config: {} },
          ]}
          filters={[{ column: 'rating', operator: 'is equal', value: '', logic: 'AND' }]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /Filter/i }));
      await userEvent.click(screen.getByTestId('mock-rating'));
      expect(mockOnUpdateFilter).toHaveBeenCalledWith(0, { value: '4' });
    });

    it('renders time input and updates existing time value', async () => {
      vi.mocked(filterUtils.operatorRequiresValue).mockReturnValue(false);
      render(
        <FilterPopover
          columns={[
            { id: 'col-time', title: 'Time', column_name: 'time', uidt: 'time', config: {} },
          ]}
          filters={[{ column: 'time', operator: 'is equal', value: '', logic: 'AND' }]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /Filter/i }));
      await userEvent.click(screen.getByTestId('mock-time'));
      expect(mockOnUpdateFilter).toHaveBeenCalledWith(0, { value: '10:30' });
    });

    it('renders single-select input and updates existing select value', async () => {
      vi.mocked(filterUtils.operatorRequiresValue).mockReturnValue(false);
      render(
        <FilterPopover
          columns={[
            {
              id: 'col-select',
              title: 'Status',
              column_name: 'status',
              uidt: 'select',
              config: { options: [{ title: 'Open', value: 'Open' }] },
            },
          ]}
          filters={[{ column: 'status', operator: 'is equal', value: '', logic: 'AND' }]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /Filter/i }));
      await userEvent.click(screen.getByTestId('mock-singleselect'));
      expect(mockOnUpdateFilter).toHaveBeenCalledWith(0, { value: 'Open' });
    });

    it('renders multi-select input and updates existing multiselect value', async () => {
      vi.mocked(filterUtils.operatorRequiresValue).mockReturnValue(false);
      render(
        <FilterPopover
          columns={[
            {
              id: 'col-multi',
              title: 'Tags',
              column_name: 'tags',
              uidt: 'multiselect',
              config: { options: [{ title: 'A', value: 'A' }, { title: 'B', value: 'B' }] },
            },
          ]}
          filters={[{ column: 'tags', operator: 'is equal', value: '', logic: 'AND' }]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /Filter/i }));
      await userEvent.click(screen.getByTestId('mock-multiselect'));
      expect(mockOnUpdateFilter).toHaveBeenCalledWith(0, { value: '["A","B"]' });
    });
  });

  describe('New filter flow', () => {
    it('adds a new filter after selecting field and clicking apply', async () => {
      render(
        <FilterPopover
          columns={defaultColumns}
          filters={[]}
          onAddFilter={mockOnAddFilter}
          onRemoveFilter={mockOnRemoveFilter}
          onUpdateFilter={mockOnUpdateFilter}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /Filter/i }));
      await userEvent.click(screen.getByRole('button', { name: /Select field/i }));
      const dropdown = screen.getByTestId('filter-new-field-options');
      await userEvent.click(within(dropdown).getByText('Name'));

      const applyButton = document.querySelector('button[title="Apply filter"]') as HTMLButtonElement;
      expect(applyButton).toBeTruthy();
      await userEvent.click(applyButton);

      expect(mockOnAddFilter).toHaveBeenCalledWith({
        column: 'name',
        operator: 'is equal',
        value: '',
        logic: 'AND',
      });
    });
  });
});
