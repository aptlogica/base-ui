import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupPopover, type GroupByItem } from '../GroupPopover';

vi.mock('../../../../hooks/useSmartPopover', () => ({
  useSmartPopover: vi.fn(() => ({ position: { top: 100, left: 200 } })),
}));

vi.mock('../../../../types/fieldTypes', () => ({
  getFieldTypeIconComponent: vi.fn(() => null),
  getRelationTypeFromField: vi.fn(() => undefined),
}));

vi.mock('../../../../types/constants', () => ({
  fieldsToExcludeInFilter: [],
}));

const defaultColumns = [
  { id: 'c1', key: 'name', title: 'Name', column_name: 'name', type: 'text', system: false },
  { id: 'c2', key: 'count', title: 'Count', column_name: 'count', type: 'number', system: false },
];

describe('GroupPopover', () => {
  const mockSetGroupBy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Group trigger button', () => {
    render(
      <GroupPopover columns={defaultColumns} groupBy={[]} setGroupBy={mockSetGroupBy} />
    );
    expect(screen.getByRole('button', { name: /Group/i })).toBeInTheDocument();
  });

  it('should show group count badge when groupBy has items', () => {
    const groupBy: GroupByItem[] = [{ id: 'g1', column: 'name', direction: 'asc' }];
    render(
      <GroupPopover columns={defaultColumns} groupBy={groupBy} setGroupBy={mockSetGroupBy} />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should show No group options when open and no groups', async () => {
    render(
      <GroupPopover columns={defaultColumns} groupBy={[]} setGroupBy={mockSetGroupBy} />
    );
    await userEvent.click(screen.getByRole('button', { name: /Group/i }));
    expect(screen.getByText('No group options')).toBeInTheDocument();
  });

  it('should show Add Group Option button when open', async () => {
    render(
      <GroupPopover columns={defaultColumns} groupBy={[]} setGroupBy={mockSetGroupBy} />
    );
    await userEvent.click(screen.getByRole('button', { name: /Group/i }));
    expect(screen.getByText('Add Group Option')).toBeInTheDocument();
  });

  it('should add pending group when Add Group Option is clicked', async () => {
    render(
      <GroupPopover columns={defaultColumns} groupBy={[]} setGroupBy={mockSetGroupBy} />
    );
    await userEvent.click(screen.getByRole('button', { name: /Group/i }));
    await userEvent.click(screen.getByText('Add Group Option'));
    expect(screen.getByText('Select field')).toBeInTheDocument();
  });

  it('should call setGroupBy when remove grouping is clicked', async () => {
    const groupBy: GroupByItem[] = [{ id: 'g1', column: 'name', direction: 'asc' }];
    render(
      <GroupPopover columns={defaultColumns} groupBy={groupBy} setGroupBy={mockSetGroupBy} />
    );
    await userEvent.click(screen.getByRole('button', { name: /Group/i }));
    await userEvent.click(screen.getByTitle('Remove grouping'));
    expect(mockSetGroupBy).toHaveBeenCalled();
  });

  it('should disable Add Group Option when no unused columns remain', async () => {
    const groupBy: GroupByItem[] = [{ id: 'g1', column: 'name', direction: 'asc' }];
    render(
      <GroupPopover columns={[defaultColumns[0]]} groupBy={groupBy} setGroupBy={mockSetGroupBy} />
    );
    await userEvent.click(screen.getByRole('button', { name: /Group/i }));
    const addButton = screen.getByRole('button', { name: /Add Group Option/i });
    expect(addButton).toBeDisabled();
  });

  it('should hide already grouped columns in dropdown', async () => {
    const groupBy: GroupByItem[] = [{ id: 'g1', column: 'name', direction: 'asc' }];
    render(
      <GroupPopover columns={defaultColumns} groupBy={groupBy} setGroupBy={mockSetGroupBy} />
    );
    await userEvent.click(screen.getByRole('button', { name: /Group/i }));
    await userEvent.click(screen.getByText('Add Group Option'));
    let dropdown = document.querySelector('[data-testid^="group-field-options-"]') as HTMLElement | null;
    if (!dropdown) {
      await userEvent.click(screen.getByText('Select field'));
      dropdown = document.querySelector('[data-testid^="group-field-options-"]') as HTMLElement | null;
    }
    expect(dropdown).not.toBeNull();
    const dropdownScope = within(dropdown as HTMLElement);
    expect(dropdownScope.queryByText('Name')).not.toBeInTheDocument();
    expect(dropdownScope.getByText('Count')).toBeInTheDocument();
  });
});
