import { describe, it, expect } from 'vitest';
import {
  sortByPosition,
  buildPositionSignature,
  resolveColumnHiddenState,
  buildReorderedFieldConfig,
} from '../viewConfigShared';

describe('viewConfigShared', () => {
  it('sorts by position and treats missing positions as 0', () => {
    const items = [{ id: 'a', position: 2 }, { id: 'b' }, { id: 'c', position: 1 }];
    const sorted = sortByPosition(items);
    expect(sorted.map((i) => i.id)).toEqual(['b', 'c', 'a']);
  });

  it('builds a stable position signature', () => {
    const items = [{ id: 'a', position: 2 }, { id: 'b', position: 0 }];
    const signature = buildPositionSignature(items);
    const signatureReordered = buildPositionSignature([{ id: 'b', position: 0 }, { id: 'a', position: 2 }]);
    expect(signature).toBe(signatureReordered);
  });

  it('resolves column hidden state from multiple flags', () => {
    expect(resolveColumnHiddenState({ hidden: true }, false)).toBe(true);
    expect(resolveColumnHiddenState({ isHidden: true }, false)).toBe(true);
    expect(resolveColumnHiddenState({ is_hidden: true }, false)).toBe(true);
    expect(resolveColumnHiddenState({ is_hidden: false }, true)).toBe(false);
    expect(resolveColumnHiddenState(undefined, true)).toBe(true);
  });

  it('builds reordered field config with updated positions and hidden states', () => {
    const existing = [
      { id: 'a', position: 0, isHidden: false },
      { id: 'b', position: 1, isHidden: true },
    ];
    const newColumns = [
      { id: 'b', hidden: false },
      { id: 'a', is_hidden: true },
      { id: 'c', isHidden: true },
    ];

    const result = buildReorderedFieldConfig(existing, newColumns);

    expect(result.map((r) => r.id)).toEqual(['b', 'a', 'c']);
    expect(result.map((r) => r.position)).toEqual([0, 1, 2]);
    expect(result.find((r) => r.id === 'b')?.isHidden).toBe(false);
    expect(result.find((r) => r.id === 'a')?.isHidden).toBe(true);
    expect(result.find((r) => r.id === 'c')?.isHidden).toBe(true);
  });
});
