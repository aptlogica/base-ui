import { describe, it, expect } from 'vitest';
import {
  syncFieldConfig,
  updateFieldPositions,
  toggleFieldVisibility,
  toggleAllFieldsVisibility,
  updateFieldWidth,
  getFieldConfig,
  isFieldHidden,
  getFieldPosition,
  getFieldWidth,
} from '../configSync';

describe('configSync', () => {
  const fields = [
    { id: 'f1', name: 'Field 1' } as any,
    { id: 'f2', name: 'Field 2' } as any,
  ];

  describe('syncFieldConfig', () => {
    it('should add missing config entries and mark needsUpdate', () => {
      const meta = { fieldConfig: [{ id: 'f1', isHidden: true, position: 0 }] };
      const result = syncFieldConfig(fields, meta);

      expect(result.needsUpdate).toBe(true);
      expect(result.updatedConfig.fieldConfig?.map(c => c.id).sort()).toEqual(['f1', 'f2']);

      const hydratedIds = result.hydratedFields.map(f => f.id);
      expect(hydratedIds).toEqual(['f1', 'f2']);

      const hydratedF1 = result.hydratedFields.find(f => f.id === 'f1')!;
      expect(hydratedF1.isHidden).toBe(true);
      expect(hydratedF1.is_hidden).toBe(true);

      const hydratedF2 = result.hydratedFields.find(f => f.id === 'f2')!;
      expect(hydratedF2.isHidden).toBe(false);
      expect(hydratedF2.is_hidden).toBe(false);
    });

    it('should remove config entries for deleted fields', () => {
      const meta = { fieldConfig: [{ id: 'f1', isHidden: false, position: 0 }, { id: 'old', isHidden: true, position: 1 }] };
      const result = syncFieldConfig(fields, meta);

      expect(result.updatedConfig.fieldConfig?.some(c => c.id === 'old')).toBe(false);
      expect(result.updatedConfig.fieldConfig?.map(c => c.id).sort()).toEqual(['f1', 'f2']);
    });

    it('should sort hydrated fields by position', () => {
      const meta = {
        fieldConfig: [
          { id: 'f1', isHidden: false, position: 1 },
          { id: 'f2', isHidden: false, position: 0 },
        ],
      };

      const result = syncFieldConfig(fields, meta);
      expect(result.hydratedFields.map(f => f.id)).toEqual(['f2', 'f1']);
    });

    it('should include width only when truthy', () => {
      const meta = {
        fieldConfig: [
          { id: 'f1', isHidden: false, position: 0, width: 0 },
          { id: 'f2', isHidden: false, position: 1, width: 120 },
        ],
      };

      const result = syncFieldConfig(fields, meta);
      const f1 = result.updatedConfig.fieldConfig!.find(c => c.id === 'f1')!;
      const f2 = result.updatedConfig.fieldConfig!.find(c => c.id === 'f2')!;

      // width=0 is dropped by current implementation (truthy spread)
      expect('width' in f1).toBe(false);
      expect(f2.width).toBe(120);
    });
  });

  describe('updateFieldPositions', () => {
    it('should rewrite positions preserving existing config', () => {
      const meta = { fieldConfig: [{ id: 'f1', isHidden: true, position: 99, custom: 'x' }] };
      const updated = updateFieldPositions(fields, meta);

      expect(updated.fieldConfig?.find(c => c.id === 'f1')).toMatchObject({
        id: 'f1',
        isHidden: true,
        position: 0,
        custom: 'x',
      });
      expect(updated.fieldConfig?.find(c => c.id === 'f2')).toMatchObject({ id: 'f2', position: 1 });
    });
  });

  describe('toggleFieldVisibility', () => {
    it('should toggle visibility for existing field', () => {
      const meta = { fieldConfig: [{ id: 'f1', isHidden: false, position: 0 }] };
      const updated = toggleFieldVisibility('f1', meta);
      expect(updated.fieldConfig?.find(c => c.id === 'f1')?.isHidden).toBe(true);
    });

    it('should add config entry when missing', () => {
      const meta = { fieldConfig: [{ id: 'f1', isHidden: false, position: 0 }] };
      const updated = toggleFieldVisibility('missing', meta);
      expect(updated.fieldConfig?.find(c => c.id === 'missing')).toMatchObject({ isHidden: true });
    });
  });

  describe('toggleAllFieldsVisibility', () => {
    it('should set all existing configs to visible=false (isHidden=true)', () => {
      const meta = { fieldConfig: [{ id: 'f1', isHidden: false }, { id: 'f2', isHidden: true }] };
      const updated = toggleAllFieldsVisibility(false, meta);
      expect(updated.fieldConfig?.every(c => c.isHidden === true)).toBe(true);
    });

    it('should set all existing configs to visible=true (isHidden=false)', () => {
      const meta = { fieldConfig: [{ id: 'f1', isHidden: true }, { id: 'f2', isHidden: true }] };
      const updated = toggleAllFieldsVisibility(true, meta);
      expect(updated.fieldConfig?.every(c => c.isHidden === false)).toBe(true);
    });
  });

  describe('updateFieldWidth', () => {
    it('should update width for existing config', () => {
      const meta = { fieldConfig: [{ id: 'f1', isHidden: false, position: 0, width: 100 }] };
      const updated = updateFieldWidth('f1', 222, meta);
      expect(updated.fieldConfig?.find(c => c.id === 'f1')?.width).toBe(222);
    });

    it('should add config entry when missing', () => {
      const meta = { fieldConfig: [{ id: 'f1', isHidden: false, position: 0 }] };
      const updated = updateFieldWidth('missing', 111, meta);
      const conf = updated.fieldConfig?.find(c => c.id === 'missing')!;
      expect(conf.width).toBe(111);
      expect(conf.isHidden).toBe(false);
    });
  });

  describe('read helpers', () => {
    it('getFieldConfig should return matching config', () => {
      const meta = { fieldConfig: [{ id: 'f1', isHidden: true, position: 2, width: 10 }] };
      expect(getFieldConfig('f1', meta)).toEqual({ id: 'f1', isHidden: true, position: 2, width: 10 });
      expect(getFieldConfig('missing', meta)).toBeUndefined();
    });

    it('isFieldHidden should default false', () => {
      const meta = { fieldConfig: [{ id: 'f1', isHidden: true }] };
      expect(isFieldHidden('f1', meta)).toBe(true);
      expect(isFieldHidden('missing', meta)).toBe(false);
    });

    it('getFieldPosition should default -1', () => {
      const meta = { fieldConfig: [{ id: 'f1', position: 5 }] };
      expect(getFieldPosition('f1', meta)).toBe(5);
      expect(getFieldPosition('missing', meta)).toBe(-1);
    });

    it('getFieldWidth should return width or undefined', () => {
      const meta = { fieldConfig: [{ id: 'f1', width: 123 }] };
      expect(getFieldWidth('f1', meta)).toBe(123);
      expect(getFieldWidth('missing', meta)).toBeUndefined();
    });
  });
});
