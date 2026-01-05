import { describe, it, expect } from 'vitest';
import { TABS, MAIN_CARDS } from '../workspaceConfig';

describe('workspaceConfig', () => {
  it('TABS should expose expected tab labels', () => {
    expect(TABS.map(t => t.label)).toEqual(['Overview', 'Members', 'Settings']);
    expect(TABS.every(t => typeof t.icon === 'string' && t.icon.length > 0)).toBe(true);
  });

  it('MAIN_CARDS should include Create New Table and Import Data actions', () => {
    expect(MAIN_CARDS.map(c => c.title)).toEqual(['Create New Table', 'Import Data']);
    expect(MAIN_CARDS[0]).toMatchObject({ action: 'Create Table' });
    expect(MAIN_CARDS[1]).toMatchObject({ action: 'Import' });
  });
});
