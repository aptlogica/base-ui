// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { Loader2, X } from 'lucide-react';
import { useWorkspaceBases } from '../../../hooks/useApi';
import { RoleDropdown } from '../../common/dropdown/RoleDropdown';

export interface WorkspaceAssignment {
  workspaceId: string;
  role: 'maintainer' | 'workspace-read' | 'base_specific' | null;
  bases?: Array<{
    baseId: string;
    role: 'base-member' | 'base-read';
  }>;
}

interface WorkspaceItemProps {
  workspace: any;
  assignment: WorkspaceAssignment | undefined;
  onRoleChange: (workspaceId: string, role: 'maintainer' | 'workspace-read' | 'base_specific' | null) => void;
  onBaseRoleChange: (workspaceId: string, baseId: string, role: 'base-member' | 'base-read') => void;
  onToggleBase: (workspaceId: string, baseId: string) => void;
}

export const WorkspaceItem: React.FC<WorkspaceItemProps> = ({
  workspace,
  assignment,
  onRoleChange,
  onBaseRoleChange,
  onToggleBase,
}) => {
  const workspaceBasesQuery = useWorkspaceBases(workspace.id);
  const response = workspaceBasesQuery.data as { data?: any[] } | any[] | undefined;
  
  // Helper function to extract bases array from response
  const extractBases = (): any[] => {
    if (response && 'data' in response && Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  };
  
  const bases = extractBases();
  const baseCount = bases.length;

  const workspaceRoleOptions = [
    { label: 'Workspace Maintainer', value: 'maintainer' },
    { label: 'Workspace Read only', value: 'workspace-read' },
    { label: 'Base Specific Role', value: 'base_specific' },
  ];

  const baseRoleOptions = [
    { label: 'Base Member', value: 'base-member' },
    { label: 'Base Read only', value: 'base-read' },
  ];

  // Helper function to render bases list content
  const renderBasesContent = () => {
    if (workspaceBasesQuery.isLoading) {
      return (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      );
    }
    if (bases.length === 0) {
      return <p className="text-xs text-gray-500 py-2 px-3">No bases found</p>;
    }
    return bases.map((base: any) => {
      const baseAssignment = assignment?.bases?.find(b => b.baseId === base.id);
      const isBaseSelected = !!baseAssignment;

      return (
        <div key={base.id} className="flex items-center gap-3 py-1.5 px-3 min-w-0">
          <span className="text-xs text-gray-700 truncate flex-1 min-w-0" title={base.title || base.name}>
            {base.title || base.name}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="min-w-[120px]">
              <RoleDropdown
                value={baseAssignment?.role || ''}
                options={baseRoleOptions}
                onChange={(value) => {
                  if (!isBaseSelected) {
                    // If base is not selected yet, toggle it first
                    onToggleBase(workspace.id, base.id);
                  }
                  // Then set the role
                  onBaseRoleChange(
                    workspace.id,
                    base.id,
                    value as 'base-member' | 'base-read'
                  );
                }}
                placeholder="Select a role"
              />
            </div>
            {isBaseSelected && baseAssignment?.role && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  // Remove base from selection
                  onToggleBase(workspace.id, base.id);
                }}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                title="Clear selection"
                aria-label="Clear base role selection"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="border rounded-xl bg-card">
      {/* Workspace Row */}
      <div className="flex items-center gap-3 p-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-medium text-gray-900 truncate" title={workspace.title || workspace.name}>
            {workspace.title || workspace.name}
          </span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-300 text-xs font-medium rounded-lg flex-shrink-0">
            {baseCount} Base{baseCount === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="min-w-[160px]">
            <RoleDropdown
              value={assignment?.role || ''}
              options={workspaceRoleOptions}
              onChange={(value) => {
                onRoleChange(
                  workspace.id,
                  value === '' ? null : value as 'maintainer' | 'workspace-read' | 'base_specific'
                );
              }}
              placeholder="Select a role"
            />
          </div>
          {assignment?.role && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRoleChange(workspace.id, null);
              }}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              title="Clear selection"
              aria-label="Clear role selection"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Bases List (when Base Specific Role is selected) */}
      {assignment?.role === 'base_specific' && (
        <div className="m-0 p-0">
          <p className="text-xs font-semibold text-gray-500 bg-gray-100 uppercase tracking-wide px-3 py-2">BASES</p>
          {renderBasesContent()}
        </div>
      )}
    </div>
  );
};

