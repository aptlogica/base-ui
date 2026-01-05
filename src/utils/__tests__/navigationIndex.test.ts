import { describe, it, expect } from 'vitest';
import { buildWorkspaceIndex, resolveWorkspaceIdFromBaseIdFast } from '../navigationIndex';

describe('navigationIndex', () => {
  it('buildWorkspaceIndex should return empty maps for non-arrays', () => {
    const idx = buildWorkspaceIndex(null);
    expect(idx.baseToWorkspace.size).toBe(0);
    expect(idx.tableToBase.size).toBe(0);
  });

  it('should index base->workspace and table->base using id fallbacks', () => {
    const workspaces = [
      {
        id: 'ws1',
        bases: [
          {
            id: 'b1',
            tables: [
              { id: 't1' },
              { id: 't2', base_id: 'overrideBase' },
            ],
          },
        ],
      },
      {
        id: 'ws2',
        bases: [
          {
            id: 'b2',
            workspace_id: 'ws2-explicit',
            tables: [{ id: 't3', baseId: 'b2-explicit' }],
          },
        ],
      },
    ];

    const idx = buildWorkspaceIndex(workspaces as any);
    expect(idx.baseToWorkspace.get('b1')).toBe('ws1');
    expect(idx.baseToWorkspace.get('b2')).toBe('ws2-explicit');

    expect(idx.tableToBase.get('t1')).toBe('b1');
    expect(idx.tableToBase.get('t2')).toBe('overrideBase');
    expect(idx.tableToBase.get('t3')).toBe('b2-explicit');
  });

  it('resolveWorkspaceIdFromBaseIdFast should resolve via index', () => {
    const workspaces = [{ id: 'ws1', bases: [{ id: 'b1' }] }];
    expect(resolveWorkspaceIdFromBaseIdFast('b1', workspaces as any)).toBe('ws1');
    expect(resolveWorkspaceIdFromBaseIdFast('missing', workspaces as any)).toBeUndefined();
  });
});
