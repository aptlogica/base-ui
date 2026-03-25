import { describe, expect, it } from 'vitest';

describe('Table barrel exports', () => {
  it('exports table runtime modules', async () => {
    const mod = await import('../index');

    expect(mod.Table).toBeDefined();
    expect(mod.TableRow).toBeDefined();
    expect(mod.ContextMenu).toBeDefined();
    expect(mod.ColumnDropdown).toBeDefined();
    expect(mod.ColumnContextMenu).toBeDefined();
    expect(mod.VirtualizedTableBody).toBeDefined();
    expect(mod.Search).toBeDefined();
    expect(mod.NewColumnModalPortal).toBeDefined();
  }, 120000);
});
