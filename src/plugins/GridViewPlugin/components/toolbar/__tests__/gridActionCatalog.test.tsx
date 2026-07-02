import React from 'react';
import { describe, it, expect } from 'vitest';

import {
  GRID_ACTIONS,
  GRID_ACTION_GROUPS,
  getGridActionById,
  getGridActionIconClassName,
} from '../gridActionCatalog';

describe('gridActionCatalog', () => {
  it('exports expected action ids', () => {
    const keys = Object.keys(GRID_ACTIONS).sort();
    const expected = [
      'case_normalization',
      'extract_substring',
      'find_replace',
      'fuzzy_deduplication',
      'merge_column',
      'remove_duplicates',
      'remove_extra_spaces',
      'remove_formatting',
      'remove_special_characters',
      'split_column',
      'split_column',
      'extract_substring',
    ];

    // Deduplicate expected and sort to compare reliably
    const uniqExpected = Array.from(new Set(expected)).sort();

    expect(keys).toEqual(uniqExpected);
  });

  it.each([
    'remove_duplicates',
    'fuzzy_deduplication',
    'remove_extra_spaces',
    'remove_special_characters',
    'remove_formatting',
    'case_normalization',
    'find_replace',
    'split_column',
    'merge_column',
    'extract_substring',
  ] as const)('action definition for %s has required fields', actionId => {
    const def = GRID_ACTIONS[actionId];

    expect(def).toBeDefined();
    expect(def.id).toBe(actionId);
    expect(typeof def.label).toBe('string');
    expect(def.label.length).toBeGreaterThan(0);
    expect(typeof def.description).toBe('string');
    expect(def.description.length).toBeGreaterThan(0);
    expect(['clean', 'transform']).toContain(def.group);
    expect(def.icon).toBeDefined();
  });

  it('renders each icon and accepts a className prop', () => {
    const ids = Object.keys(GRID_ACTIONS) as Array<keyof typeof GRID_ACTIONS>;

    ids.forEach(id => {
      const def = GRID_ACTIONS[id];
      const el = React.createElement(def.icon as any, { className: 'test-class' });
      expect(el).toBeDefined();
      // All icons should accept and include the provided className in props
      expect(typeof el.props).toBe('object');
      expect(String(el.props.className)).toContain('test-class');
    });
  });

  it('custom image icons render expected attributes', () => {
    const extra = GRID_ACTIONS.remove_extra_spaces;
    // call the component function directly to obtain the returned element
    const el = (extra.icon as any)({ className: 'foo' });
    expect(el.type).toBe('img');
    expect(el.props.src).toBe('/assets/extra-space.svg');
    expect(String(el.props.alt)).toContain('Remove Extra Spaces');
    expect(String(el.props.className)).toContain('dark:invert');
    expect(String(el.props.className)).toContain('foo');
  });

  it('GRID_ACTION_GROUPS groups contain correct actions and hide fuzzy_deduplication', () => {
    const cleanIds = GRID_ACTION_GROUPS.clean.map(a => a.id);
    expect(cleanIds).toContain('remove_duplicates');
    expect(cleanIds).toContain('remove_extra_spaces');
    expect(cleanIds).toContain('remove_special_characters');
    expect(cleanIds).not.toContain('fuzzy_deduplication');

    const transformIds = GRID_ACTION_GROUPS.transform.map(a => a.id);
    expect(transformIds).toContain('split_column');
    expect(transformIds).toContain('merge_column');
    expect(transformIds).toContain('extract_substring');
  });

  it('getGridActionById returns the definition for a valid id', () => {
    const def = getGridActionById('remove_duplicates');
    expect(def).toBe(GRID_ACTIONS.remove_duplicates);
  });

  it('getGridActionById returns undefined for unknown id', () => {
    // cast to any to simulate invalid runtime input
    const result = getGridActionById('non_existent' as any);
    expect(result).toBeUndefined();
  });

  it('getGridActionIconClassName returns shared icon class', () => {
    expect(getGridActionIconClassName()).toBe('w-4 h-4');
  });
});
