import { describe, it, expect } from 'vitest';
import { checkFieldUsageInViews, checkCriticalFieldUsageInViews } from '../fieldUsageUtils';

describe('fieldUsageUtils', () => {
  describe('checkFieldUsageInViews', () => {
    it('should return not used for empty views', () => {
      expect(checkFieldUsageInViews('f1', [])).toEqual({ isUsedInViews: false, usedInViews: [] });
      expect(checkFieldUsageInViews('f1', null as any)).toEqual({ isUsedInViews: false, usedInViews: [] });
    });

    it('should ignore non-target view types (grid/form/etc)', () => {
      const views = [
        { id: 'v1', type: 'grid', meta: { fieldConfig: [{ id: 'f1', isHidden: false }] } },
        { id: 'v2', type: 'form', meta: { date_field_id: 'f1' } },
      ];
      expect(checkFieldUsageInViews('f1', views as any).isUsedInViews).toBe(false);
    });

    it('should treat a visible fieldConfig entry as usage', () => {
      const views = [
        { id: 'v1', type: 'gallery', title: 'Gallery', meta: { fieldConfig: [{ id: 'f1', isHidden: false }] } },
      ];
      const res = checkFieldUsageInViews('f1', views as any);
      expect(res.isUsedInViews).toBe(true);
      expect(res.usedInViews[0]).toMatchObject({ viewId: 'v1', viewType: 'gallery', usageType: 'Visible Field' });
    });

    it('should not mark hidden fieldConfig entry as used', () => {
      const views = [
        { id: 'v1', type: 'kanban', meta: { fieldConfig: [{ id: 'f1', isHidden: true }] } },
      ];
      const res = checkFieldUsageInViews('f1', views as any);
      expect(res.isUsedInViews).toBe(false);
    });

    it('should not consider empty fieldConfig as used', () => {
      const views = [
        { id: 'v1', type: 'gallery', meta: { fieldConfig: [] } },
      ];
      expect(checkFieldUsageInViews('f1', views as any).isUsedInViews).toBe(false);
    });

    it('should detect critical field references per view type', () => {
      const views = [
        { id: 'c1', type: 'calendar', name: 'Cal', meta: { date_field_id: 'f1' } },
        { id: 'k1', type: 'kanban', name: 'Kan', meta: { view_target_field: 'f1' } },
        { id: 'g1', type: 'gallery', name: 'Gal', meta: { attachment_field_id: 'f1' } },
        {
          id: 'ga1',
          type: 'ganttChart',
          name: 'Gantt',
          meta: {
            start_date_field_id: 'f1',
            end_date_field_id: 'f2',
            title_field_id: 'f3',
            progress_field_id: 'f4',
          },
        },
      ];

      const res = checkFieldUsageInViews('f1', views as any);
      expect(res.isUsedInViews).toBe(true);
      expect(res.usedInViews.map(u => u.viewId).sort()).toEqual(['c1', 'g1', 'ga1', 'k1'].sort());
    });

    it('should avoid duplicates when field is referenced multiple ways in a view', () => {
      const views = [
        {
          id: 'g1',
          type: 'ganttChart',
          meta: {
            fieldConfig: [{ id: 'f1', isHidden: false }],
            start_date_field_id: 'f1',
          },
        },
      ];
      const res = checkFieldUsageInViews('f1', views as any);
      expect(res.usedInViews).toHaveLength(1);
      expect(res.usedInViews[0].viewId).toBe('g1');
    });

    it('should detect gantt groupBy.column', () => {
      const views = [
        { id: 'g1', type: 'ganttChart', meta: { groupBy: { column: 'f1' } } },
      ];
      const res = checkFieldUsageInViews('f1', views as any);
      expect(res.isUsedInViews).toBe(true);
      expect(res.usedInViews[0]).toMatchObject({ viewId: 'g1', usageType: 'Group By Field' });
    });
  });

  describe('checkCriticalFieldUsageInViews', () => {
    it('should filter by currentTableId when provided', () => {
      const views = [
        { id: 'k1', type: 'kanban', model_id: 't1', meta: { view_target_field: 'f1' } },
        { id: 'k2', type: 'kanban', model_id: 't2', meta: { view_target_field: 'f1' } },
      ];

      const res = checkCriticalFieldUsageInViews('f1', views as any, 't1');
      expect(res.isUsedInViews).toBe(true);
      expect(res.usedInViews.map(u => u.viewId)).toEqual(['k1']);
    });

    it('should detect gantt critical groupBy.column and avoid duplicates', () => {
      const views = [
        {
          id: 'g1',
          type: 'ganttChart',
          modelId: 't1',
          meta: {
            groupBy: { column: 'f1' },
            start_date_field_id: 'f1',
          },
        },
      ];

      const res = checkCriticalFieldUsageInViews('f1', views as any);
      expect(res.isUsedInViews).toBe(true);
      expect(res.usedInViews).toHaveLength(1);
      expect(res.usedInViews[0]).toMatchObject({ viewId: 'g1', usageType: 'Group By Field' });
    });

    it('should ignore non-critical view types', () => {
      const views = [{ id: 'v1', type: 'grid', meta: { date_field_id: 'f1' } }];
      expect(checkCriticalFieldUsageInViews('f1', views as any).isUsedInViews).toBe(false);
    });
  });
});
