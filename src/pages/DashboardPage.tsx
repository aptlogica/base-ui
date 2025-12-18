import React from 'react';
import { DashboardGrid } from '../plugins/DashboardWidgetsPlugin/components/DashboardGrid';
import { DashboardService } from '../plugins/DashboardWidgetsPlugin';

const DashboardPage: React.FC = () => {
  // Create a dashboard service instance with default config
  const dashboardService = new DashboardService({
    gridColumns: 2,
    autoRefresh: true,
    refreshInterval: 30,
    enableAnimations: true
  });

  return (
    <div className="min-h-screen bg-background">
      <DashboardGrid 
        config={{
          gridColumns: 2,
          autoRefresh: true,
          refreshInterval: 30,
          enableAnimations: true
        }}
        dashboardService={dashboardService}
      />
    </div>
  );
};

export default DashboardPage; 