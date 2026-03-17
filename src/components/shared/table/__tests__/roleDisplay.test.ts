import { describe, it, expect } from 'vitest';
import { getAccessRoleDisplayName, roleFilterOptions } from '../roleDisplay';

describe('roleDisplay', () => {
  it('includes expected filter options', () => {
    expect(roleFilterOptions).toContain('Owner');
    expect(roleFilterOptions).toContain('Base Read Only');
  });

  it('maps access roles to display names', () => {
    expect(getAccessRoleDisplayName('maintainer')).toBe('Workspace Maintainer');
    expect(getAccessRoleDisplayName('workspace-read')).toBe('Workspace Read Only');
    expect(getAccessRoleDisplayName('base-member')).toBe('Base Member');
    expect(getAccessRoleDisplayName('base-read')).toBe('Base Read Only');
  });

  it('falls back to access or User', () => {
    expect(getAccessRoleDisplayName('custom-role')).toBe('custom-role');
    expect(getAccessRoleDisplayName('')).toBe('User');
  });
});
