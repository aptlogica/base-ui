import { describe, it, expect, vi } from 'vitest';
import {
  createPluginId,
  validatePluginId,
  getPluginDisplayName,
  getPluginVersion,
  isPluginCompatible,
  sortPluginsByDependencies,
  parseFieldConfig,
  parseFieldConfigs,
} from '../pluginUtils';

type PluginLike = {
  manifest: {
    id: string;
    name?: string;
    version?: string;
    dependencies?: Record<string, string>;
  };
};

describe('pluginUtils', () => {
  describe('createPluginId', () => {
    it('should normalize to lowercase and hyphenate', () => {
      expect(createPluginId('My Plugin Name')).toBe('my-plugin-name');
      expect(createPluginId('My__Plugin__Name')).toBe('my-plugin-name');
      expect(createPluginId('My   Plugin---Name')).toBe('my-plugin-name');
    });

    it('should trim leading/trailing hyphens', () => {
      expect(createPluginId('---Hello---')).toBe('hello');
      expect(createPluginId('  Hello  ')).toBe('hello');
    });

    it('should remove invalid characters', () => {
      expect(createPluginId('Hello@World!')).toBe('hello-world');
      expect(createPluginId('A.B.C')).toBe('a-b-c');
    });
  });

  describe('validatePluginId', () => {
    it('should accept lowercase alphanumerics and hyphens', () => {
      expect(validatePluginId('a')).toBe(true);
      expect(validatePluginId('plugin-1')).toBe(true);
      expect(validatePluginId('abc-123-def')).toBe(true);
    });

    it('should reject empty or invalid ids', () => {
      expect(validatePluginId('')).toBe(false);
      expect(validatePluginId('Plugin')).toBe(false);
      expect(validatePluginId('plugin_1')).toBe(false);
      expect(validatePluginId('plugin!')).toBe(false);
      expect(validatePluginId('with space')).toBe(false);
    });
  });

  describe('getPluginDisplayName', () => {
    it('should use manifest name when present', () => {
      const plugin = { manifest: { id: 'p1', name: 'Plugin One' } } as any;
      expect(getPluginDisplayName(plugin)).toBe('Plugin One');
    });

    it('should fallback to id when name is missing', () => {
      const plugin = { manifest: { id: 'p1' } } as any;
      expect(getPluginDisplayName(plugin)).toBe('p1');
    });
  });

  describe('getPluginVersion', () => {
    it('should use manifest version when present', () => {
      const plugin = { manifest: { id: 'p1', version: '1.2.3' } } as any;
      expect(getPluginVersion(plugin)).toBe('1.2.3');
    });

    it('should fallback to 0.0.0', () => {
      const plugin = { manifest: { id: 'p1' } } as any;
      expect(getPluginVersion(plugin)).toBe('0.0.0');
    });
  });

  describe('isPluginCompatible', () => {
    it('should return true when no frameworkVersion requirement', () => {
      const plugin = { manifest: { id: 'p1' } } as any;
      expect(isPluginCompatible(plugin, '1.0.0')).toBe(true);
    });

    it('should return true for a compatible framework version range', () => {
      // Whether semver is available or not, the implementation should not throw,
      // and for a clearly compatible range it should return true.
      const plugin = { manifest: { id: 'p1', frameworkVersion: '^1.0.0' } } as any;
      expect(isPluginCompatible(plugin, '1.2.3')).toBe(true);
    });
  });

  describe('sortPluginsByDependencies', () => {
    it('should sort dependencies before dependents', () => {
      const a: PluginLike = { manifest: { id: 'a' } };
      const b: PluginLike = { manifest: { id: 'b', dependencies: { a: '^1.0.0' } } };
      const c: PluginLike = { manifest: { id: 'c', dependencies: { b: '^1.0.0' } } };

      const sorted = sortPluginsByDependencies([c as any, b as any, a as any]);
      expect(sorted.map(p => p.manifest.id)).toEqual(['a', 'b', 'c']);
    });

    it('should ignore missing dependencies', () => {
      const a: PluginLike = { manifest: { id: 'a', dependencies: { missing: '^1.0.0' } } };
      const sorted = sortPluginsByDependencies([a as any]);
      expect(sorted.map(p => p.manifest.id)).toEqual(['a']);
    });

    it('should throw on circular dependency', () => {
      const a: PluginLike = { manifest: { id: 'a', dependencies: { b: '^1.0.0' } } };
      const b: PluginLike = { manifest: { id: 'b', dependencies: { a: '^1.0.0' } } };

      expect(() => sortPluginsByDependencies([a as any, b as any])).toThrow(/Circular dependency/);
    });
  });

  describe('parseFieldConfig', () => {
    it('should return empty object for falsy values', () => {
      expect(parseFieldConfig(null)).toEqual({});
      expect(parseFieldConfig(undefined)).toEqual({});
      expect(parseFieldConfig('')).toEqual({});
    });

    it('should parse JSON string configs', () => {
      expect(parseFieldConfig('{"a":1}')).toEqual({ a: 1 });
    });

    it('should return empty object for invalid JSON', () => {
      expect(parseFieldConfig('{bad')).toEqual({});
    });

    it('should return objects as-is', () => {
      const obj = { a: 1 };
      expect(parseFieldConfig(obj)).toBe(obj);
    });
  });

  describe('parseFieldConfigs', () => {
    it('should passthrough falsy values', () => {
      expect(parseFieldConfigs(null)).toBe(null);
      expect(parseFieldConfigs(undefined)).toBe(undefined);
    });

    it('should parse table data shape (fields[])', () => {
      const data = {
        fields: [
          { id: 'f1', config: '{"x":1}' },
          { id: 'f2', config: { y: 2 } },
        ],
      };

      const parsed = parseFieldConfigs(data);
      expect(parsed.fields[0].config).toEqual({ x: 1 });
      expect(parsed.fields[1].config).toEqual({ y: 2 });
    });

    it('should parse workspace data shape (workspaces->bases->tables->fields)', () => {
      const data = {
        workspaces: [
          {
            id: 'w1',
            bases: [
              {
                id: 'b1',
                tables: [
                  {
                    id: 't1',
                    fields: [
                      { id: 'f1', config: '{"a":1}' },
                      { id: 'f2', config: '{"b":2}' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const parsed = parseFieldConfigs(data);
      expect(parsed.workspaces[0].bases[0].tables[0].fields[0].config).toEqual({ a: 1 });
      expect(parsed.workspaces[0].bases[0].tables[0].fields[1].config).toEqual({ b: 2 });
    });

    it('should passthrough unknown shapes', () => {
      const data = { something: true };
      expect(parseFieldConfigs(data)).toBe(data);
    });
  });
});
