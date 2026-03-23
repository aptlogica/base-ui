import { describe, it, expect } from 'vitest';
import { calculateDropdownPosition } from '../dropdownPosition';

const makeRect = (rect: Partial<DOMRect>): DOMRect => ({
  x: rect.left ?? 0,
  y: rect.top ?? 0,
  width: rect.width ?? 0,
  height: rect.height ?? 0,
  top: rect.top ?? 0,
  right: rect.right ?? 0,
  bottom: rect.bottom ?? 0,
  left: rect.left ?? 0,
  toJSON: () => ({}),
});

describe('calculateDropdownPosition', () => {
  it('positions below when there is enough space', () => {
    const rect = makeRect({ top: 100, bottom: 120, left: 50, right: 150 });
    const result = calculateDropdownPosition({
      rect,
      dropdownMinHeight: 200,
      dropdownWidth: 240,
      viewportHeight: 800,
      viewportWidth: 1200,
    });

    expect(result.top).toBe(126);
    expect(result.bottom).toBeUndefined();
    expect(result.left).toBe(50);
  });

  it('positions above when space below is insufficient and above is larger', () => {
    const rect = makeRect({ top: 180, bottom: 200, left: 50, right: 150 });
    const result = calculateDropdownPosition({
      rect,
      dropdownMinHeight: 220,
      dropdownWidth: 200,
      viewportHeight: 250,
      viewportWidth: 1200,
    });

    expect(result.bottom).toBe(250 - 180 + 6);
    expect(result.top).toBeUndefined();
  });

  it('clamps left when it would overflow left margin', () => {
    const rect = makeRect({ top: 50, bottom: 70, left: 0, right: 100 });
    const result = calculateDropdownPosition({
      rect,
      dropdownMinHeight: 100,
      dropdownWidth: 200,
      viewportHeight: 600,
      viewportWidth: 800,
      sideMargin: 10,
    });

    expect(result.left).toBe(10);
  });

  it('clamps left when it would overflow right edge', () => {
    const rect = makeRect({ top: 50, bottom: 70, left: 550, right: 650 });
    const result = calculateDropdownPosition({
      rect,
      dropdownMinHeight: 100,
      dropdownWidth: 200,
      viewportHeight: 600,
      viewportWidth: 700,
      sideMargin: 10,
    });

    expect(result.left).toBe(700 - 200 - 10);
  });

  it('aligns right when requested', () => {
    const rect = makeRect({ top: 50, bottom: 70, left: 100, right: 260 });
    const result = calculateDropdownPosition({
      rect,
      dropdownMinHeight: 100,
      dropdownWidth: 120,
      viewportHeight: 600,
      viewportWidth: 800,
      align: 'right',
    });

    expect(result.left).toBe(260 - 120);
  });
});
