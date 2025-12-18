import React from 'react';
import * as LucideIcons from 'lucide-react';
import { formatDate } from '../../../utils/dateUtils';

export const TableListWidget: React.FC = () => {
  // Dashboard data disabled; render empty state
  const workspaces: any[] = [];
  const loading = false;
  const error = null as any;

  // Get all tables from all workspaces
  const allTables = React.useMemo(() => {
    if (!workspaces || workspaces.length === 0) return [];

    const tables: Array<{
      id: string;
      name: string;
      description?: string;
      workspace: string;
      base: string;
      fieldCount: number;
      viewCount: number;
      recordCount: number;
      created_at: string;
    }> = [];

    workspaces.forEach((workspace: any) => {
      (workspace.bases || []).forEach((base: any) => {
        (base.tables || []).forEach((table: any) => {
          const fieldCount = (table.fields || []).length;
          const viewCount = (table.views || []).length;
          const recordCount = table.records?.length || table.record_count || 0;

          tables.push({
            id: table.id,
            name: table.title || table.name || 'Unnamed Table',
            description: table.description,
            workspace: workspace.title || workspace.name || 'Unnamed Workspace',
            base: base.title || base.name || 'Unnamed Base',
            fieldCount,
            viewCount,
            recordCount,
            created_at: table.created_at || new Date().toISOString()
          });
        });
      });
    });

    // Sort by creation date (newest first)
    return tables.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [workspaces]);

  if (error) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <LucideIcons.AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Failed to load tables</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
        <LucideIcons.Table className="w-5 h-5 text-purple-600" />
        All Tables
      </h3>
      
      {allTables.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {allTables.map((table) => (
            <div key={table.id} className="p-4 rounded-lg border hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-primary mb-1">{table.name}</h4>
                  {table.description && (
                    <p className="text-sm text-secondary mb-2">{table.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-secondary mb-2">
                    <span className="flex items-center gap-1">
                      <LucideIcons.Hash className="w-3 h-3" />
                      {table.fieldCount} fields
                    </span>
                    <span className="flex items-center gap-1">
                      <LucideIcons.Eye className="w-3 h-3" />
                      {table.viewCount} views
                    </span>
                    <span className="flex items-center gap-1">
                      <LucideIcons.Database className="w-3 h-3" />
                      {table.recordCount} records
                    </span>
                  </div>
                  <div className="text-xs text-quaternary">
                    {table.workspace} • {table.base}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-secondary">
                    {formatDate(table.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <LucideIcons.Table className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-secondary">No tables found</p>
        </div>
      )}
    </div>
  );
};
