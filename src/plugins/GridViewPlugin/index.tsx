// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { Suspense, lazy } from 'react';
import { Plugin, PluginManifest, PluginAPI } from '../../core/types';
import { matchesViewType } from '../../utils/viewType';
import { useGridData } from './hooks/useGridData';
// LAZY LOAD: Table component is huge - only load when GridView is actually rendered
const Table = lazy(() =>
  import('./components/Table/Table').then(m => ({ default: m.Table }))
);
import { Loader } from '../../components/ui/Loader';

interface ViewExtensionProps {
  table?: { id?: string };
  view?: { id?: string; type?: string };
  viewType?: string;
}

const manifest: PluginManifest = {
  id: 'grid-view-plugin',
  name: 'Grid View Plugin',
  version: '2.0.0',
  description: 'Advanced grid view with clean architecture, filtering, sorting, and editing capabilities',
};

const GridViewPlugin: Plugin = {
  manifest,
  initialize: async (api: PluginAPI) => {
    const GridView: React.FC<{ tableId: string; viewId?: string }> = ({ tableId, viewId }) => {
      const { tableData, isLoading, error, refresh, addRow, insertRowData, bulkUpdateColumn, deleteRecord, bulkDeleteRecords, updateField, deleteColumn, createField, updateView, updateRowOrder } = useGridData({ tableId, viewId });

      if (error) {
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-2">Something went wrong while loading the table.</div>
              <button onClick={() => refresh()} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Retry</button>
            </div>
          </div>
        );
      }

      // Show loading state while data is being fetched
      if (isLoading || !tableData?.model) {
        return <div className="h-full flex items-center justify-center">
          <Loader size={10} />
        </div>;
      }

      const enableVirtualization = undefined;

      return (
        <Suspense fallback={
          <div className="h-full flex items-center justify-center">
            <Loader size={10} />
          </div>
        }>
          <Table
            tableData={tableData}
            viewId={viewId}
            onRefresh={() => refresh()}
            enableVirtualization={enableVirtualization} // Virtualization control (separate from view metadata)
            actions={{ addRow, insertRowData, bulkUpdateColumn, deleteRecord, bulkDeleteRecords, updateField, deleteColumn, createField, updateView, updateRowOrder }}
          />
        </Suspense>
      );
    };

    api.registerExtension('view', {
      id: 'grid-view',
      order: 50,
      render: (props: ViewExtensionProps) => {
        const tableId = props?.table?.id;
        const viewId = props?.view?.id;
        const rawType = props?.viewType ?? props?.view?.type;
        const validGridTypes = ['grid', 'gridview', 'grid-view'];
        // Allow rendering when type matches grid even if viewId is absent (slug-based route)
        if (!tableId) return null;
        if (!matchesViewType(rawType, validGridTypes)) return null;
        // Fetch once and pass tableData; no ViewHost/context path
        return <GridView tableId={tableId} viewId={viewId} />;
      },
    });
  },
};

export default GridViewPlugin; 
