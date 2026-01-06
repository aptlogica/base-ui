import { describe, it, expect } from 'vitest';
import { safeParseMeta } from '../viewDiagnostics';

describe('viewDiagnostics', () => {
  describe('safeParseMeta', () => {
    it('should return fallback for null/undefined', () => {
      expect(safeParseMeta(null, { a: 1 })).toEqual({ a: 1 });
      expect(safeParseMeta(undefined, { a: 1 })).toEqual({ a: 1 });
    });

    it('should return object as-is', () => {
      const obj = { a: 1 };
      expect(safeParseMeta(obj)).toBe(obj);
    });

    it('should parse JSON string', () => {
      expect(safeParseMeta('{"a":1}')).toEqual({ a: 1 });
    });

    it('should return fallback if JSON parsing fails', () => {
      expect(safeParseMeta('not-json', { ok: true })).toEqual({ ok: true });
    });

    it('should return default fallback when none provided', () => {
      expect(safeParseMeta('not-json')).toEqual({});
    });

    it('should return fallback for non-string, non-object types', () => {
      expect(safeParseMeta(123 as any, { a: 1 })).toEqual({ a: 1 });
      expect(safeParseMeta(true as any, { a: 1 })).toEqual({ a: 1 });
    });

    it('should support typed fallback', () => {
      type Meta = { x: number };
      const v = safeParseMeta<Meta>('not-json', { x: 7 });
      expect(v).toEqual({ x: 7 });
    });
  });
});
