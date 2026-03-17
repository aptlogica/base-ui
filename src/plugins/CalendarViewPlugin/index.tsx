// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { Plugin, PluginManifest, PluginAPI } from '../../core/types';
import { matchesViewType } from '../../utils/viewType';
import { useCalendarData } from './hooks/useCalendarData';
import CalendarView from './components/CalendarView';
import { Loader } from '../../components/ui/Loader';

interface ViewExtensionProps {
  table?: { id?: string };
  view?: { id?: string; type?: string };
  viewType?: string;
}

const manifest: PluginManifest = {
  id: 'calendar-view-plugin',
  name: 'Calendar View Plugin',
  version: '2.0.0',
  description: 'Clean calendar view with data layer separation and modern architecture',
};

const CalendarViewPlugin: Plugin = {
  manifest,
  initialize: async (api: PluginAPI) => {
    // Single component: fetch and render CalendarView directly
    const CalendarViewWrapper: React.FC<{ tableId: string; viewId?: string }> = ({ tableId, viewId }) => {
      const { tableData, uiColumns, uiData, uiTableId, events, dateField, view, isLoading, error, refresh, addRow, insertRowData, deleteRecord, updateField, updateView, updateEvent, createEvent, deleteEvent, changeDateField, updateViewConfig } = useCalendarData({ tableId, viewId });

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
              <div className="text-red-500 text-lg mb-2">Something went wrong while loading the calendar view.</div>
              <p className="text-muted-foreground mb-4">{errorMessage}</p>
              <button onClick={() => refresh().catch(console.error)} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Retry</button>
            </div>
          </div>
        );
      }
      
      // Show loading state while data is being fetched
      if (isLoading || !tableData?.model) {
        return (
          <div className="h-full flex items-center justify-center">
            <Loader size={10} />
          </div>
        );
      }

      return (
        <CalendarView
          tableData={tableData}
          uiColumns={uiColumns}
          uiData={uiData}
          uiTableId={uiTableId}
          events={events}
          dateField={dateField}
          view={view}
          viewId={viewId}
          onRefresh={() => refresh().catch(console.error)}
          actions={{ addRow, insertRowData, deleteRecord, updateField, updateView, updateEvent, createEvent, deleteEvent, changeDateField, updateViewConfig }}
        />
      );
    };

    api.registerExtension('view', {
      id: 'calendar-view',
      order: 51,
      render: (props: ViewExtensionProps) => {
        const tableId = props?.table?.id;
        const viewId = props?.view?.id;
        const rawType = props?.viewType ?? props?.view?.type;
        const validCalendarTypes = ['calendar', 'calendarview', 'calendar-view'];
        
        // Allow rendering when type matches calendar even if viewId is absent (slug-based route)
        if (!tableId) return null;
        if (!matchesViewType(rawType, validCalendarTypes)) return null;
        
        // Fetch once and pass calendar data; no ViewHost/context path
        return <CalendarViewWrapper tableId={tableId} viewId={viewId} />;
      },
    });
  },
};

export default CalendarViewPlugin;
