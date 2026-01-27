import React from 'react';
import { Plugin, PluginManifest, PluginAPI } from '../../core/types';
import { matchesViewType } from '../../utils/viewType';
import { useGanttData } from './hooks/useGanttData';
import { GanttChart } from './components/GanttChart';
import { Loader } from '../../components/ui/Loader';

interface ViewExtensionProps {
  table?: { id?: string };
  view?: { id?: string; type?: string };
  viewType?: string;
}

const manifest: PluginManifest = {
  id: 'gantt-chart-view-plugin',
  name: 'Gantt Chart View Plugin',
  version: '2.0.0',
  description: 'Clean gantt chart view with data layer separation and modern architecture',
};

const GanttChartViewPlugin: Plugin = {
  manifest,
  initialize: async (api: PluginAPI) => {
    // Single component: fetch and render GanttChart directly
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

      if (error) {
        let errorMessage: string;
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else {
          errorMessage = 'An unknown error occurred';
        }
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-2">Something went wrong while loading the gantt chart.</div>
              <p className="text-muted-foreground mb-4">{errorMessage}</p>
              <button onClick={() => refresh()} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Retry</button>
            </div>
          </div>
        );
      }
      
      // Show loading state while data is being fetched
      if (isLoading || !tableData?.data?.model) {
        return (
          <div className="h-full flex items-center justify-center">
            <Loader size={10} />
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
      render: (props: ViewExtensionProps) => {
        const tableId = props?.table?.id;
        const viewId = props?.view?.id;
        const rawType = props?.viewType ?? props?.view?.type;
        const validGanttTypes = ['gantt', 'ganttchart', 'gantt-chart', 'ganttChart'];
        
        // Allow rendering when type matches gantt even if viewId is absent (slug-based route)
        if (!tableId) return null;
        if (!matchesViewType(rawType, validGanttTypes)) return null;
        
        // Fetch once and pass gantt data; no ViewHost/context path
        return <GanttView tableId={tableId} viewId={viewId} />;
      },
    });
  },
};

export default GanttChartViewPlugin; 