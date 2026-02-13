import { describe, expect, it } from 'vitest';

describe('Grid shared barrel exports', () => {
  it('exports shared runtime modules', async () => {
    const mod = await import('../index');

    expect(mod.Dropdown).toBeDefined();
  });
});
