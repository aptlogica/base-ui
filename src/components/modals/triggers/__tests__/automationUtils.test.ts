import { describe, it, expect } from 'vitest';
import {
  TYPE_CONFIG,
  displayTitle,
  formatDate,
  formatEvent,
  nameFromContext,
  parseEvent,
  parseQueryEvent,
  placeholderFor,
  withTriggerEvents,
} from '../automationUtils';
import type { Automation } from '../../../../service/clientService';

const TRIGGER = 'CREATE TRIGGER log_salary\nAFTER INSERT OR UPDATE ON "public"."employee"\nFOR EACH ROW EXECUTE FUNCTION log_fn();';

describe('automationUtils', () => {
  describe('TYPE_CONFIG', () => {
    it('has a config for every automation type', () => {
      expect(Object.keys(TYPE_CONFIG).sort()).toEqual(['function', 'trigger', 'webhook']);
      expect(TYPE_CONFIG.trigger.label).toBe('Triggers');
      expect(TYPE_CONFIG.function.singular).toBe('function');
    });
  });

  describe('placeholderFor', () => {
    it('puts the table alias into the trigger placeholder', () => {
      expect(placeholderFor('trigger', 'employee')).toContain('ON "public"."employee"');
    });

    it('returns a function and a webhook placeholder', () => {
      expect(placeholderFor('function', 'employee')).toContain('RETURNS trigger');
      expect(placeholderFor('webhook', 'employee')).toContain('https://');
    });
  });

  describe('nameFromContext', () => {
    it('reads the trigger name', () => {
      expect(nameFromContext(TRIGGER)).toBe('log_salary');
      expect(nameFromContext('create or replace trigger "quoted_name" before insert on t')).toBe('quoted_name');
    });

    it('reads the function name, with or without a schema', () => {
      expect(nameFromContext('CREATE OR REPLACE FUNCTION set_status() RETURNS trigger AS $$ $$')).toBe('set_status');
      expect(nameFromContext('CREATE FUNCTION "public"."audit"() RETURNS trigger')).toBe('audit');
    });

    it('falls back to the first line', () => {
      expect(nameFromContext('{"url": "x"}\nsecond line')).toBe('{"url": "x"}');
    });
  });

  describe('formatEvent', () => {
    it('joins timing and events in a fixed order', () => {
      expect(formatEvent('BEFORE', ['UPDATE', 'INSERT'])).toBe('BEFORE INSERT, BEFORE UPDATE');
    });

    it('returns an empty string with no events', () => {
      expect(formatEvent('AFTER', [])).toBe('');
    });
  });

  describe('parseEvent', () => {
    it('parses a stored event', () => {
      expect(parseEvent('BEFORE INSERT, BEFORE UPDATE')).toEqual({ timing: 'BEFORE', operations: ['INSERT', 'UPDATE'] });
    });

    it('parses a multi-word timing and lower case', () => {
      expect(parseEvent('instead of delete')).toEqual({ timing: 'INSTEAD OF', operations: ['DELETE'] });
    });

    it('returns null for empty or invalid events', () => {
      expect(parseEvent(undefined)).toBeNull();
      expect(parseEvent('')).toBeNull();
      expect(parseEvent('INSERT')).toBeNull();
      expect(parseEvent('SOMETIME INSERT')).toBeNull();
    });

    it('drops unknown operations', () => {
      expect(parseEvent('AFTER INSERT, AFTER EXPLODE')).toEqual({ timing: 'AFTER', operations: ['INSERT'] });
    });
  });

  describe('parseQueryEvent', () => {
    it('reads timing and events from a trigger query', () => {
      expect(parseQueryEvent(TRIGGER)).toEqual({ timing: 'AFTER', operations: ['INSERT', 'UPDATE'] });
    });

    it('reads UPDATE OF columns as UPDATE', () => {
      const query = 'CREATE TRIGGER t BEFORE UPDATE OF salary, bonus OR DELETE ON emp FOR EACH ROW EXECUTE FUNCTION f();';
      expect(parseQueryEvent(query)).toEqual({ timing: 'BEFORE', operations: ['UPDATE', 'DELETE'] });
    });

    it('normalises INSTEAD OF', () => {
      expect(parseQueryEvent('CREATE TRIGGER t INSTEAD  OF INSERT ON v FOR EACH ROW EXECUTE FUNCTION f();')?.timing).toBe('INSTEAD OF');
    });

    it('returns null when the query is not a trigger', () => {
      expect(parseQueryEvent('SELECT 1')).toBeNull();
    });
  });

  describe('withTriggerEvents', () => {
    it('replaces the timing and events in the query', () => {
      const result = withTriggerEvents(TRIGGER, 'BEFORE', ['DELETE', 'INSERT']);
      expect(result).toContain('CREATE TRIGGER log_salary\nBEFORE INSERT OR DELETE ON "public"."employee"');
      expect(result).toContain('EXECUTE FUNCTION log_fn();');
    });

    it('keeps UPDATE OF columns', () => {
      const query = 'CREATE TRIGGER t AFTER UPDATE OF salary ON emp FOR EACH ROW EXECUTE FUNCTION f();';
      expect(withTriggerEvents(query, 'BEFORE', ['INSERT', 'UPDATE'])).toBe(
        'CREATE TRIGGER t BEFORE INSERT OR UPDATE OF salary ON emp FOR EACH ROW EXECUTE FUNCTION f();'
      );
    });

    it('leaves a query without a trigger header unchanged', () => {
      expect(withTriggerEvents('SELECT 1', 'AFTER', ['INSERT'])).toBe('SELECT 1');
    });
  });

  describe('displayTitle', () => {
    it('uses the title, or the name in the query', () => {
      const base: Automation = { id: '1', model_id: 'm1', type: 'trigger', context: TRIGGER };
      expect(displayTitle({ ...base, title: 'Log salary' })).toBe('Log salary');
      expect(displayTitle(base)).toBe('log_salary');
    });
  });

  describe('formatDate', () => {
    it('formats a valid date', () => {
      expect(formatDate('2026-10-09T10:00:00Z')).toBe('Oct 9, 2026');
    });

    it('returns a dash for missing, invalid or zero dates', () => {
      expect(formatDate(undefined)).toBe('-');
      expect(formatDate('not a date')).toBe('-');
      expect(formatDate('0001-01-01T00:00:00Z')).toBe('-');
    });
  });
});
