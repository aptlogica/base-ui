// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { describe, it, expect } from 'vitest';
import { getAccessRoleDisplayName, roleFilterOptions } from '../roleDisplay';

describe('roleDisplay', () => {
  it('returns known display names', () => {
    expect(getAccessRoleDisplayName('maintainer')).toBe('Workspace Maintainer');
    expect(getAccessRoleDisplayName('workspace-read')).toBe('Workspace Read Only');
    expect(getAccessRoleDisplayName('base-member')).toBe('Base Member');
    expect(getAccessRoleDisplayName('base-read')).toBe('Base Read Only');
  });

  it('falls back to provided value or User', () => {
    expect(getAccessRoleDisplayName('custom-role')).toBe('custom-role');
    expect(getAccessRoleDisplayName('')).toBe('User');
  });

  it('exposes role filter options', () => {
    expect(roleFilterOptions).toContain('Owner');
    expect(roleFilterOptions).toContain('Base Read Only');
  });
});
