// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { Loader2 } from 'lucide-react';
import { getRolePillStyle } from '../userTableUtils';

type AccessDetailsWorkspace = {
  workspace_id?: string;
  workspace_name: string;
  access: string;
  bases?: Array<{
    base_id?: string;
    base_name?: string;
    access?: string;
  }>;
};

interface AccessDetailsRowProps {
  colSpan: number;
  isLoading: boolean;
  error: unknown;
  workspaces: AccessDetailsWorkspace[];
  errorText: string;
  emptyText: string;
  getRoleDisplayName: (access: string) => string;
}

export const AccessDetailsRow: React.FC<AccessDetailsRowProps> = ({
  colSpan,
  isLoading,
  error,
  workspaces,
  errorText,
  emptyText,
  getRoleDisplayName,
}) => {
  if (isLoading) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-6 py-8 bg-gray-50">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            <span className="text-sm text-gray-500">Loading access details...</span>
          </div>
        </td>
      </tr>
    );
  }

  if (error) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-6 py-8 bg-gray-50">
          <div className="text-center">
            <p className="text-sm text-red-600">{errorText}</p>
          </div>
        </td>
      </tr>
    );
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-6 py-8 bg-gray-50">
          <div className="text-center">
            <p className="text-sm text-gray-500">{emptyText}</p>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-4 bg-gray-50">
        <div className="border rounded-lg overflow-hidden bg-background">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700">Workspace(s) Access</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700">Base(s) Access</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {workspaces.map((ws, wsIndex) => {
                const baseCount = ws.bases?.length || 0;
                const workspaceRole = ws.access || '';
                const workspaceKey = ws.workspace_id || ws.workspace_name || String(wsIndex);

                if (baseCount === 0) {
                  return (
                    <tr key={workspaceKey} className="bg-background">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{ws.workspace_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">-</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-xl text-xs font-medium ${getRolePillStyle(getRoleDisplayName(workspaceRole))}`}>
                          {getRoleDisplayName(workspaceRole)}
                        </span>
                      </td>
                    </tr>
                  );
                }

                return ws.bases?.map((base, baseIndex) => {
                  const baseRole = base.access || '';
                  const baseName = base.base_name || `Base ${base.base_id || baseIndex + 1}`;
                  const baseKey = base.base_id || base.base_name || `${workspaceKey}-${baseIndex}`;

                  return (
                    <tr key={baseKey} className="bg-background">
                      {baseIndex === 0 && (
                        <td rowSpan={baseCount} className="px-4 py-3 text-sm text-gray-900 font-medium align-top border-r">
                          {ws.workspace_name}
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm text-gray-700">{baseName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-xl text-xs font-medium ${getRolePillStyle(getRoleDisplayName(baseRole))}`}>
                          {getRoleDisplayName(baseRole)}
                        </span>
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );
};
