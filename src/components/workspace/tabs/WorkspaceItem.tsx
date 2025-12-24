import React from 'react';
import { Loader2 } from 'lucide-react';
import { useWorkspaceBases } from '../../../hooks/useApi';
import { RoleDropdown } from '../../common/dropdown/RoleDropdown';

export interface WorkspaceAssignment {
  workspaceId: string;
  role: 'workspace_maintainer' | 'workspace_read_only' | 'base_specific' | null;
  bases?: Array<{
    baseId: string;
    role: 'base_member' | 'base_read_only';
  }>;
}

interface WorkspaceItemProps {
  workspace: any;
  assignment: WorkspaceAssignment | undefined;
  onRoleChange: (workspaceId: string, role: 'workspace_maintainer' | 'workspace_read_only' | 'base_specific' | null) => void;
  onBaseRoleChange: (workspaceId: string, baseId: string, role: 'base_member' | 'base_read_only') => void;
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
  const bases = workspaceBasesQuery.data?.data || workspaceBasesQuery.data || [];
  const baseCount = Array.isArray(bases) ? bases.length : 0;

  const workspaceRoleOptions = [
    { label: 'Workspace Maintainer', value: 'workspace_maintainer' },
    { label: 'Workspace Read only', value: 'workspace_read_only' },
    { label: 'Base Specific Role', value: 'base_specific' },
  ];

  const baseRoleOptions = [
    { label: 'Base Member', value: 'base_member' },
    { label: 'Base Read only', value: 'base_read_only' },
  ];

  return (
    <div className="border rounded-xl bg-card">
      {/* Workspace Row */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {workspace.title || workspace.name}
          </span>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
            {baseCount} Base{baseCount !== 1 ? 's' : ''}
          </span>
        </div>
        <RoleDropdown
          value={assignment?.role || ''}
          options={workspaceRoleOptions}
          onChange={(value) => {
            onRoleChange(
              workspace.id,
              value === '' ? null : value as 'workspace_maintainer' | 'workspace_read_only' | 'base_specific'
            );
          }}
          placeholder="Select a role"
        />
      </div>

      {/* Bases List (when Base Specific Role is selected) */}
      {assignment?.role === 'base_specific' && (
        <div className="m-0 p-0">
          <p className="text-xs font-semibold text-gray-500 bg-gray-100 uppercase tracking-wide px-3 py-2">BASES</p>
          {workspaceBasesQuery.isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          ) : bases.length === 0 ? (
            <p className="text-xs text-gray-500 py-2 px-3">No bases found</p>
          ) : (
            bases.map((base: any) => {
              const baseAssignment = assignment.bases?.find(b => b.baseId === base.id);
              const isBaseSelected = !!baseAssignment;

              return (
                <div key={base.id} className="flex items-center justify-between py-1.5 px-3">
                  <span className="text-xs text-gray-700">
                    {base.title || base.name}
                  </span>
                  {isBaseSelected ? (
                    <RoleDropdown
                      value={baseAssignment.role}
                      options={baseRoleOptions}
                      onChange={(value) => {
                        onBaseRoleChange(
                          workspace.id,
                          base.id,
                          value as 'base_member' | 'base_read_only'
                        );
                      }}
                      className="min-w-[120px]"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBase(workspace.id, base.id);
                      }}
                      className="text-xs px-2 py-1 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      Select a role
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

