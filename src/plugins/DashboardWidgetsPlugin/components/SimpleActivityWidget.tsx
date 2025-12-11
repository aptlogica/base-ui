import React from 'react';
import * as LucideIcons from 'lucide-react';
import { formatDate } from '../../../utils/dateUtils';

export const SimpleActivityWidget: React.FC = () => {
  // Dashboard data disabled; render empty state
  const workspaces: any[] = [];
  const loading = false;
  const error = null as any;

  // Get recent activities
  const activities = React.useMemo(() => {
    if (!workspaces || workspaces.length === 0) return [];

    const allActivities: Array<{
      type: 'workspace' | 'base' | 'table' | 'view';
      name: string;
      workspace?: string;
      base?: string;
      created_at: string;
    }> = [];

    workspaces.forEach((workspace: any) => {
      // Add workspace
      allActivities.push({
        type: 'workspace',
        name: workspace.title || workspace.name || 'Unnamed Workspace',
        created_at: workspace.created_at || new Date().toISOString()
      });

      (workspace.bases || []).forEach((base: any) => {
        // Add base
        allActivities.push({
          type: 'base',
          name: base.title || base.name || 'Unnamed Base',
          workspace: workspace.title || workspace.name,
          created_at: base.created_at || new Date().toISOString()
        });

        (base.tables || []).forEach((table: any) => {
          // Add table
          allActivities.push({
            type: 'table',
            name: table.title || table.name || 'Unnamed Table',
            workspace: workspace.title || workspace.name,
            base: base.title || base.name,
            created_at: table.created_at || new Date().toISOString()
          });

          // Add views
          (table.views || []).forEach((view: any) => {
            allActivities.push({
              type: 'view',
              name: view.title || view.name || 'Unnamed View',
              workspace: workspace.title || workspace.name,
              base: base.title || base.name,
              created_at: view.created_at
            });
          });
        });
      });
    });

    // Sort by creation date and take last 5
    return allActivities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [workspaces]);

  const formatRelativeDate = (dateString: string) => {
    // Handle placeholder dates
    if (!dateString || dateString === '0001-01-01T00:00:00Z' || dateString === '1970-01-01T00:00:00Z') {
      return 'N/A';
    }
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getActivityIcon = (type: 'workspace' | 'base' | 'table' | 'view') => {
    switch (type) {
      case 'workspace': return LucideIcons.Building2;
      case 'base': return LucideIcons.Database;
      case 'table': return LucideIcons.Table;
      case 'view': return LucideIcons.Eye;
      default: return LucideIcons.File;
    }
  };

  const getActivityColor = (type: 'workspace' | 'base' | 'table' | 'view') => {
    switch (type) {
      case 'workspace': return 'blue';
      case 'base': return 'green';
      case 'table': return 'purple';
      case 'view': return 'orange';
      default: return 'gray';
    }
  };

  if (error) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <LucideIcons.AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Failed to load activity</p>
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
      <h3 className="text-lg font-semibold text-primary mb-4">Recent Activity</h3>
      
      {activities.length === 0 ? (
        <div className="text-center py-6">
          <LucideIcons.Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-secondary">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const color = getActivityColor(activity.type);
            
            return (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className={`p-1.5 rounded-md bg-${color}-100`}>
                  <Icon className={`w-4 h-4 text-${color}-600`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-primary truncate">{activity.name}</div>
                  {activity.workspace && activity.base && (
                    <div className="text-xs text-secondary truncate">
                      {activity.workspace} • {activity.base}
                    </div>
                  )}
                </div>
                <span className="text-xs text-secondary flex-shrink-0">
                  {formatRelativeDate(activity.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
