import React from 'react';
import { Plugin, PluginManifest, PluginAPI } from '../../core/types';
import { matchesViewType } from '../../utils/viewType';
import { useCalendarData } from './hooks/useCalendarData';
import CalendarView from './components/CalendarView';

const manifest: PluginManifest = {
  id: 'calendar-view-plugin',
  name: 'Calendar View Plugin',
  version: '2.0.0',
  description: 'Clean calendar view with data layer separation and modern architecture',
};

const CalendarViewPlugin: Plugin = {
  manifest,
  initialize: async (api: PluginAPI, config: any) => {
    // Single component: fetch and render CalendarView directly (no extra wrappers)
    const CalendarViewWrapper: React.FC<{ tableId: string; viewId?: string }> = ({ tableId, viewId }) => {
      const { tableData, isLoading, error, refresh, addRow, insertRowData, deleteRecord, updateField, updateView, updateEvent, createEvent, deleteEvent, changeDateField, updateViewConfig } = useCalendarData({ tableId, viewId });

      if (isLoading) return <div className="h-full flex items-center justify-center">Loading calendar…</div>;
      
      if (error) {
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-2">⚠️ Error Loading Calendar</div>
              <p className="text-muted-foreground mb-4">{String(error)}</p>
              <button onClick={() => refresh()} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Retry</button>
            </div>
          </div>
        );
      }
      
      if (!tableData || !tableData.model || !tableData.columns) {
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-muted-foreground text-lg mb-2">📅 No Calendar Data</div>
              <p className="text-muted-foreground mb-4">Calendar could not be loaded</p>
              <button onClick={() => refresh()} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">🔄 Retry Loading</button>
            </div>
          </div>
        );
      }

      return (
        <CalendarView
          tableData={tableData!}
          viewId={viewId}
          onRefresh={() => refresh()}
          actions={{ addRow, insertRowData, deleteRecord, updateField, updateView, updateEvent, createEvent, deleteEvent, changeDateField, updateViewConfig }}
        />
      );
    };

    api.registerExtension('view', {
      id: 'calendar-view',
      order: 51,
      render: (props: any) => {
        const tableId = props?.table?.id;
        const viewId = props?.view?.id;
        const rawType = props?.viewType ?? props?.view?.type;
        const validCalendarTypes = ['calendar', 'calendarview', 'calendar-view'];
        
        if (!tableId) return null;
        if (!matchesViewType(rawType, validCalendarTypes)) return null;
        
        return <CalendarViewWrapper tableId={tableId} viewId={viewId} />;
      },
    });
  },
};

export default CalendarViewPlugin;