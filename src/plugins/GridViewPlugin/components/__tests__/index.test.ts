import { describe, expect, it, vi } from 'vitest';

vi.mock('../Table', () => ({
  Table: 'TableMock',
  TableRow: 'TableRowMock',
  ContextMenu: 'ContextMenuMock',
  Search: 'SearchMock',
  ColumnDropdown: 'ColumnDropdownMock',
  ColumnContextMenu: 'ColumnContextMenuMock',
  VirtualizedTableBody: 'VirtualizedTableBodyMock',
  NewColumnModalPortal: 'NewColumnModalPortalMock',
}));

vi.mock('../shared', () => ({
  Dropdown: 'DropdownMock',
}));

describe('GridView components index exports', () => {
  it('re-exports table and shared runtime members', async () => {
    const mod = await import('../index');

    expect(mod.Table).toBe('TableMock');
    expect(mod.TableRow).toBe('TableRowMock');
    expect(mod.ContextMenu).toBe('ContextMenuMock');
    expect(mod.Search).toBe('SearchMock');
    expect(mod.ColumnDropdown).toBe('ColumnDropdownMock');
    expect(mod.ColumnContextMenu).toBe('ColumnContextMenuMock');
    expect(mod.VirtualizedTableBody).toBe('VirtualizedTableBodyMock');
    expect(mod.NewColumnModalPortal).toBe('NewColumnModalPortalMock');
    expect((mod as any).Dropdown).toBe('DropdownMock');
  });
});
