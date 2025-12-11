import React, { useState, useEffect } from 'react';
import { DashboardConfig, DashboardService, Widget } from '../index';

interface DashboardGridProps {
  config: DashboardConfig;
  dashboardService: DashboardService;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({ 
  config, 
  dashboardService 
}) => {
  const [widgets, setWidgets] = useState<Widget[]>([]);

  useEffect(() => {
    const updateWidgets = () => {
      setWidgets(dashboardService.getWidgets());
    };

    updateWidgets();
    const unsubscribe = dashboardService.subscribe(updateWidgets);
    
    return unsubscribe;
  }, [dashboardService]);

  const getWidgetSize = (widget: Widget) => {
    switch (widget.size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-1 lg:col-span-1';
      case 'large':
        return 'col-span-1 lg:col-span-2';
      default:
        return 'col-span-1';
    }
  };
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-full">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-tertiary">Dashboard</h1>
          <p className="text-[var(--color-text-secondary)] mt-2">Welcome back! Here's an overview of your workspace activity.</p>
        </div>

        {/* Stats Row - Full Width */}
        <div className="mb-6">
          {widgets
            .filter(widget => widget.id === 'stats')
            .map((widget) => {
              const WidgetComponent = widget.component;
              return (
                <div key={widget.id}>
                  <WidgetComponent {...(widget.props || {})} />
                </div>
              );
            })}
        </div>

        {/* Content Row - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {widgets
            .filter(widget => widget.id !== 'stats')
            .map((widget) => {
              const WidgetComponent = widget.component;
              return (
                <div key={widget.id} className="col-span-1">
                  <div className="h-full">
                    <WidgetComponent {...(widget.props || {})} />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
