import { describe, it, expect } from 'vitest';
import { createMockSemver } from '../createMockSemver';

describe('createMockSemver', () => {
  const semver = createMockSemver();

  describe('valid', () => {
    it('should accept x.y.z versions', () => {
      expect(semver.valid('1.2.3')).toBe('1.2.3');
      expect(semver.valid('0.0.0')).toBe('0.0.0');
      expect(semver.valid('10.20.30')).toBe('10.20.30');
    });

    it('should return null for invalid versions', () => {
      expect(semver.valid('1.2')).toBeNull();
      expect(semver.valid('v1')).toBeNull();
      expect(semver.valid('abc')).toBeNull();
      expect(semver.valid('')).toBeNull();
    });
  });

  describe('clean', () => {
    it('should remove non-numeric and non-dot characters', () => {
      expect(semver.clean('v1.2.3')).toBe('1.2.3');
      expect(semver.clean(' 1.2.3 ')).toBe('1.2.3');
      expect(semver.clean('1.2.3-beta.1')).toBe('1.2.3.1');
    });
  });

  describe('comparators', () => {
    it('should compare major versions', () => {
      expect(semver.gt('2.0.0', '1.9.9')).toBe(true);
      expect(semver.lt('1.0.0', '2.0.0')).toBe(true);
      expect(semver.eq('2.0.0', '2.0.0')).toBe(true);
    });

    it('should compare minor versions', () => {
      expect(semver.gt('1.2.0', '1.1.9')).toBe(true);
      expect(semver.lt('1.1.0', '1.2.0')).toBe(true);
      expect(semver.eq('1.2.0', '1.2.0')).toBe(true);
    });

    it('should compare patch versions', () => {
      expect(semver.gt('1.2.4', '1.2.3')).toBe(true);
      expect(semver.lt('1.2.3', '1.2.4')).toBe(true);
      expect(semver.gte('1.2.3', '1.2.3')).toBe(true);
      expect(semver.lte('1.2.3', '1.2.3')).toBe(true);
    });

    it('should tolerate prefixed versions', () => {
      expect(semver.gt('v1.2.4', '1.2.3')).toBe(true);
      expect(semver.eq('v1.2.3', '1.2.3')).toBe(true);
    });

    it('should treat missing parts as 0', () => {
      expect(semver.eq('1', '1.0.0')).toBe(true);
      expect(semver.eq('1.2', '1.2.0')).toBe(true);
      expect(semver.lt('1.2', '1.2.1')).toBe(true);
    });
  });

  describe('satisfies', () => {
    it('should support exact match', () => {
      expect(semver.satisfies('1.2.3', '1.2.3')).toBe(true);
      expect(semver.satisfies('1.2.3', '1.2.4')).toBe(false);
    });

    it('should support caret ranges', () => {
      expect(semver.satisfies('1.2.3', '^1.2.0')).toBe(true);
      expect(semver.satisfies('1.2.0', '^1.2.0')).toBe(true);
      expect(semver.satisfies('2.0.0', '^1.2.0')).toBe(false);
    });

    it('should support tilde ranges', () => {
      expect(semver.satisfies('1.2.3', '~1.2.0')).toBe(true);
      expect(semver.satisfies('1.3.0', '~1.2.0')).toBe(false);
      expect(semver.satisfies('1.2.0', '~1.2.0')).toBe(true);
    });

    it('should support >= comparisons', () => {
      expect(semver.satisfies('1.2.3', '>=1.2.0')).toBe(true);
      expect(semver.satisfies('1.1.9', '>=1.2.0')).toBe(false);
    });

    it('should support <= comparisons', () => {
      expect(semver.satisfies('1.2.0', '<=1.2.0')).toBe(true);
      expect(semver.satisfies('1.2.1', '<=1.2.0')).toBe(false);
    });

    it('should support > comparisons', () => {
      expect(semver.satisfies('1.2.1', '>1.2.0')).toBe(true);
      expect(semver.satisfies('1.2.0', '>1.2.0')).toBe(false);
    });

    it('should support < comparisons', () => {
      expect(semver.satisfies('1.1.9', '<1.2.0')).toBe(true);
      expect(semver.satisfies('1.2.0', '<1.2.0')).toBe(false);
    });
  });
});
