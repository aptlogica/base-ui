import { describe, it, expect } from 'vitest';
import { checkFieldUsageInViews, checkCriticalFieldUsageInViews } from '../fieldUsageUtils';

describe('fieldUsageUtils', () => {
  it('returns empty usage when views are missing', () => {
    expect(checkFieldUsageInViews('col1', [])).toEqual({ isUsedInViews: false, usedInViews: [] });
    expect(checkCriticalFieldUsageInViews('col1', [])).toEqual({ isUsedInViews: false, usedInViews: [] });
  });

  it('detects visible field usage in supported view types', () => {
    const views = [
      { id: 'v1', type: 'kanban', title: 'Kanban', meta: { fieldConfig: [{ id: 'col1', isHidden: false }] } },
      { id: 'v2', type: 'grid', title: 'Grid', meta: { fieldConfig: [{ id: 'col1', isHidden: false }] } },
    ];

    const result = checkFieldUsageInViews('col1', views);
    expect(result.isUsedInViews).toBe(true);
    expect(result.usedInViews).toHaveLength(1);
    expect(result.usedInViews[0].viewId).toBe('v1');
  });

  it('ignores hidden field entries in fieldConfig', () => {
    const views = [
      { id: 'v1', type: 'gallery', name: 'Gallery', meta: { fieldConfig: [{ id: 'col1', isHidden: true }] } },
    ];

    const result = checkFieldUsageInViews('col1', views);
    expect(result.isUsedInViews).toBe(false);
  });

  it('detects usage via meta references and avoids duplicates', () => {
    const views = [
      {
        id: 'v1',
        type: 'calendar',
        title: 'Cal',
        meta: { date_field_id: 'col1', fieldConfig: [{ id: 'col1', isHidden: false }] },
      },
    ];

    const result = checkFieldUsageInViews('col1', views);
    expect(result.isUsedInViews).toBe(true);
    expect(result.usedInViews).toHaveLength(1);
  });

  it('filters critical usage by table id and detects gantt groupBy', () => {
    const views = [
      {
        id: 'g1',
        model_id: 't1',
        type: 'ganttChart',
        title: 'Gantt',
        meta: { groupBy: { column: 'col1' } },
      },
      {
        id: 'g2',
        model_id: 't2',
        type: 'ganttChart',
        title: 'Other',
        meta: { start_date_field_id: 'col1' },
      },
    ];

    const result = checkCriticalFieldUsageInViews('col1', views, 't1');
    expect(result.isUsedInViews).toBe(true);
    expect(result.usedInViews[0].viewId).toBe('g1');
    expect(result.usedInViews[0].usageType).toBe('Group By Field');
  });

  it('detects critical usage for calendar date field', () => {
    const views = [
      { id: 'c1', type: 'calendar', meta: { date_field_id: 'col1' } },
      { id: 'c2', type: 'grid', meta: { date_field_id: 'col1' } },
    ];
    const result = checkCriticalFieldUsageInViews('col1', views);
    expect(result.isUsedInViews).toBe(true);
    expect(result.usedInViews[0].viewId).toBe('c1');
  });
});
