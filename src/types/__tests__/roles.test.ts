import { describe, it, expect } from 'vitest';
import { ROLES, ROLE_LABELS, getRoleLabel } from '../roles';

describe('roles', () => {
  it('exposes role values', () => {
    expect(ROLES.Owner).toBe('owner');
    expect(ROLES.CoOwner).toBe('co-owner');
  });

  it('maps role labels for known roles', () => {
    expect(ROLE_LABELS[ROLES.Owner]).toBe('Owner');
    expect(ROLE_LABELS[ROLES.BaseMemberReadOnly]).toBe('Base Read Only');
  });

  it('returns label for known role and fallback for unknown role', () => {
    expect(getRoleLabel(ROLES.WorkspaceMaintainer)).toBe('Workspace Maintainer');
    expect(getRoleLabel('custom-role')).toBe('custom-role');
  });
});
