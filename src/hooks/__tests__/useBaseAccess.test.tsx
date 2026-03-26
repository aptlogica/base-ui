// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useBaseAccess } from '../useBaseAccess';

let workspaceAccessState = {
  wsAccess: 'owner',
  hasFullWorkspaceAccess: true,
  isBaseLevelAccess: () => false,
  currentWorkspace: { id: 'w1' }
};

let basesState: any = { data: [] };
let navigationState = { selectedBaseId: 'b1', selectedWorkspaceId: 'w1' };

vi.mock('../useWorkspaceAccess', () => ({
  useWorkspaceAccess: () => workspaceAccessState,
}));

vi.mock('../useApi', () => ({
  useWorkspaceBases: () => basesState,
}));

vi.mock('../../stores/navigationStore', () => ({
  useNavigationStore: () => navigationState,
}));

const renderHookValue = (baseId?: string) => {
  let latest: ReturnType<typeof useBaseAccess> | null = null;
  const Probe = () => {
    latest = useBaseAccess(baseId);
    return null;
  };
  render(<Probe />);
  return latest!;
};

describe('useBaseAccess', () => {
  beforeEach(() => {
    workspaceAccessState = {
      wsAccess: 'owner',
      hasFullWorkspaceAccess: true,
      isBaseLevelAccess: () => false,
      currentWorkspace: { id: 'w1' }
    };
    basesState = { data: [] };
    navigationState = { selectedBaseId: 'b1', selectedWorkspaceId: 'w1' };
  });

  it('grants full access to workspace-level admins', () => {
    const value = renderHookValue();
    expect(value.hasFullBaseAccess).toBe(true);
    expect(value.canAccessBase).toBe(true);
    expect(value.canCreateBase()).toBe(true);
    expect(value.isBaseReadOnly()).toBe(false);
  });

  it('handles base owner access at base level', () => {
    workspaceAccessState = {
      wsAccess: 'base',
      hasFullWorkspaceAccess: false,
      isBaseLevelAccess: () => true,
      currentWorkspace: { id: 'w1' }
    };
    basesState = { data: [{ id: 'b1', access_level: 'owner' }] };
    const value = renderHookValue();
    expect(value.baseAccess).toBe('owner');
    expect(value.canAccessBase).toBe(true);
    expect(value.canUpdateBase()).toBe(true);
    expect(value.canCreateTable()).toBe(true);
  });

  it('treats base-read as read-only', () => {
    workspaceAccessState = {
      wsAccess: 'base',
      hasFullWorkspaceAccess: false,
      isBaseLevelAccess: () => true,
      currentWorkspace: { id: 'w1' }
    };
    basesState = { data: [{ id: 'b1', access_level: 'base-read' }] };
    const value = renderHookValue();
    expect(value.canAccessBase).toBe(true);
    expect(value.canCreateTable()).toBe(false);
    expect(value.isBaseReadOnly()).toBe(true);
  });

  it('blocks table creation for workspace-read', () => {
    workspaceAccessState = {
      wsAccess: 'workspace-read',
      hasFullWorkspaceAccess: false,
      isBaseLevelAccess: () => true,
      currentWorkspace: { id: 'w1' }
    };
    basesState = { data: [{ id: 'b1', access_level: 'base-member' }] };
    const value = renderHookValue();
    expect(value.canCreateTable()).toBe(false);
    expect(value.canUpdateTable()).toBe(false);
  });

  it('returns no access when base is missing', () => {
    workspaceAccessState = {
      wsAccess: 'base',
      hasFullWorkspaceAccess: false,
      isBaseLevelAccess: () => true,
      currentWorkspace: { id: 'w1' }
    };
    basesState = { data: [{ id: 'b2', access_level: 'owner' }] };
    const value = renderHookValue();
    expect(value.currentBase).toBeNull();
    expect(value.canAccessBase).toBe(false);
  });

  it('evaluates permissions for common base access levels', () => {
    workspaceAccessState = {
      wsAccess: 'base',
      hasFullWorkspaceAccess: false,
      isBaseLevelAccess: () => true,
      currentWorkspace: { id: 'w1' }
    };

    const accessCases = [
      {
        access_level: 'base-member',
        expected: {
          canAccessBase: true,
          canUpdateBase: false,
          canManageBaseMembers: false,
          canCreateTable: true,
          canUpdateTable: true,
          canDeleteTable: true,
          canCreateView: true,
          canUpdateView: true,
          canDeleteView: true,
          canCreateRecord: true,
          canUpdateRecord: true,
          canDeleteRecord: true,
          canCreateColumn: true,
          canUpdateColumn: true,
          canDeleteColumn: true,
          isBaseReadOnly: false,
        },
      },
      {
        access_level: 'base-read',
        expected: {
          canAccessBase: true,
          canUpdateBase: false,
          canManageBaseMembers: false,
          canCreateTable: false,
          canUpdateTable: false,
          canDeleteTable: false,
          canCreateView: false,
          canUpdateView: false,
          canDeleteView: false,
          canCreateRecord: false,
          canUpdateRecord: false,
          canDeleteRecord: false,
          canCreateColumn: false,
          canUpdateColumn: false,
          canDeleteColumn: false,
          isBaseReadOnly: true,
        },
      },
      {
        access_level: 'workspace-read',
        expected: {
          canAccessBase: true,
          canUpdateBase: false,
          canManageBaseMembers: false,
          canCreateTable: false,
          canUpdateTable: false,
          canDeleteTable: false,
          canCreateView: false,
          canUpdateView: false,
          canDeleteView: false,
          canCreateRecord: false,
          canUpdateRecord: false,
          canDeleteRecord: false,
          canCreateColumn: false,
          canUpdateColumn: false,
          canDeleteColumn: false,
          isBaseReadOnly: true,
        },
      },
    ];

    for (const testCase of accessCases) {
      basesState = { data: [{ id: 'b1', access_level: testCase.access_level }] };
      const value = renderHookValue();
      expect(value.baseAccess).toBe(testCase.access_level);
      expect(value.canAccessBase).toBe(testCase.expected.canAccessBase);
      expect(value.canUpdateBase()).toBe(testCase.expected.canUpdateBase);
      expect(value.canManageBaseMembers()).toBe(testCase.expected.canManageBaseMembers);
      expect(value.canCreateTable()).toBe(testCase.expected.canCreateTable);
      expect(value.canUpdateTable()).toBe(testCase.expected.canUpdateTable);
      expect(value.canDeleteTable()).toBe(testCase.expected.canDeleteTable);
      expect(value.canCreateView()).toBe(testCase.expected.canCreateView);
      expect(value.canUpdateView()).toBe(testCase.expected.canUpdateView);
      expect(value.canDeleteView()).toBe(testCase.expected.canDeleteView);
      expect(value.canCreateRecord()).toBe(testCase.expected.canCreateRecord);
      expect(value.canUpdateRecord()).toBe(testCase.expected.canUpdateRecord);
      expect(value.canDeleteRecord()).toBe(testCase.expected.canDeleteRecord);
      expect(value.canCreateColumn()).toBe(testCase.expected.canCreateColumn);
      expect(value.canUpdateColumn()).toBe(testCase.expected.canUpdateColumn);
      expect(value.canDeleteColumn()).toBe(testCase.expected.canDeleteColumn);
      expect(value.isBaseReadOnly()).toBe(testCase.expected.isBaseReadOnly);
    }
  });
});
