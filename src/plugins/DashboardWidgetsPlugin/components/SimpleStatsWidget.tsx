import React from 'react';
import * as LucideIcons from 'lucide-react';

export const SimpleStatsWidget: React.FC = () => {
  // Dashboard data disabled; render lightweight placeholder
  const loading = false;
  const error = null as any;
  const stats = { totalWorkspaces: 0, totalBases: 0, totalTables: 0, totalViews: 0 } as any;

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    color: string;
  }) => (
    <div className="bg-card rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-${color}-50`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-tertiary mb-1">
          {loading ? '...' : value.toLocaleString()}
        </h3>
        <p className="text-sm font-medium text-primary">{title}</p>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <LucideIcons.AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Failed to load data</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-xl p-6 shadow-sm border animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gray-200 w-12 h-12"></div>
            </div>
            <div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        title="Workspaces" 
        value={stats.totalWorkspaces} 
        icon={LucideIcons.Building2}
        color="blue"
      />
      <StatCard 
        title="Bases" 
        value={stats.totalBases} 
        icon={LucideIcons.Database}
        color="emerald"
      />
      <StatCard 
        title="Tables" 
        value={stats.totalTables} 
        icon={LucideIcons.Table}
        color="violet"
      />
      <StatCard 
        title="Views" 
        value={stats.totalViews} 
        icon={LucideIcons.Eye}
        color="amber"
      />
    </div>
  );
};
