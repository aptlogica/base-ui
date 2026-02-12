import { describe, it, expect } from 'vitest';
import { VIEW_TYPES, VIEW_ICONS, ViewType, getViewIconInfo } from '../viewTypes';

describe('viewTypes', () => {
  it('includes all known view types', () => {
    const types = VIEW_TYPES.map(v => v.type);
    expect(types).toContain(ViewType.Grid);
    expect(types).toContain(ViewType.Form);
    expect(types).toContain(ViewType.Gallery);
    expect(types).toContain(ViewType.Kanban);
    expect(types).toContain(ViewType.Calendar);
    expect(types).toContain(ViewType.GanttChart);
  });

  it('returns icon info for known types', () => {
    expect(getViewIconInfo('calendar')).toBe(VIEW_ICONS.calendar);
  });

  it('falls back to grid icon for unknown types', () => {
    expect(getViewIconInfo('unknown')).toBe(VIEW_ICONS.grid);
  });
});
