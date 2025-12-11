import React from 'react';
import { Plugin, PluginManifest, PluginAPI } from '../../core/types';
import { matchesViewType } from '../../utils/viewType';
import { useGanttData } from './hooks/useGanttData';
import { GanttChart } from './components/GanttChart';

const manifest: PluginManifest = {
  id: 'gantt-chart-view-plugin',
  name: 'Gantt Chart View Plugin',
  version: '2.0.0',
  description: 'Clean gantt chart view with data layer separation and modern architecture',
};

const GanttChartViewPlugin: Plugin = {
  manifest,
  initialize: async (api: PluginAPI, config: any) => {
    // Single component: fetch and render GanttBoard directly (following Calendar pattern)
    const GanttView: React.FC<{ tableId: string; viewId?: string }> = ({ tableId, viewId }) => {
      const {
        tableData,
        isLoading,
        error,
        refresh,
        addRow,
        insertRowData,
        deleteRecord,
        updateField,
        updateView,
        moveTask,
        createTask,
        deleteTask,
        updateTaskProgress,
        updateViewConfig
      } = useGanttData({ tableId, viewId });

      if (isLoading) return <div className="h-full flex items-center justify-center">Loading gantt chart…</div>;

      if (error) {
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-2">⚠️ Error Loading Gantt Chart</div>
              <p className="text-muted-foreground mb-4">{String(error)}</p>
              <button onClick={() => refresh()} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Retry</button>
            </div>
          </div>
        );
      }

      if (!tableData || !tableData.data || !tableData.data.model || !tableData.data.columns) {
  
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-muted-foreground text-lg mb-2">📊 No Gantt Data</div>
              <p className="text-muted-foreground mb-4">Gantt chart could not be loaded</p>
              <button onClick={() => refresh()} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">🔄 Retry Loading</button>
            </div>
          </div>
        );
      }

      return (
        <GanttChart
          tableData={tableData}
          onRefresh={() => refresh()}
          actions={{
            addRow,
            insertRowData,
            deleteRecord,
            updateField,
            updateView,
            moveTask,
            createTask,
            deleteTask,
            updateTaskProgress,
            updateViewConfig
          }}
        />
      );
    };

    api.registerExtension('view', {
      id: 'gantt-chart-view',
      order: 55,
      render: (props: any) => {
        const tableId = props?.table?.id;
        const viewId = props?.view?.id;
        const rawType = props?.viewType ?? props?.view?.type;
        const validGanttTypes = ['gantt', 'ganttchart', 'gantt-chart', 'ganttChart'];
        if (!tableId) {
          return null;
        }
        if (!matchesViewType(rawType, validGanttTypes)) {
          return null;
        }

        return <GanttView tableId={tableId} viewId={viewId} />;
      },
    });

    // Removed route registration - gantt views are handled through the view extension point
  },
};

export default GanttChartViewPlugin; 