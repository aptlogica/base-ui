// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { lazy, Suspense} from 'react';
import { Plugin, PluginManifest, PluginAPI } from '../../core/types';
import { matchesViewType } from '../../utils/viewType';
import { useKanbanData } from './hooks/useKanbanData';
// LAZY LOAD: KanbanBoard component - only load when KanbanView is actually rendered
const KanbanBoard = lazy(() => 
  import('./components').then(m => ({ default: m.KanbanBoard }))
);
import { Loader } from '../../components/ui/Loader';

interface ViewExtensionProps {
  table?: { id?: string };
  view?: { id?: string; type?: string };
  viewType?: string;
}

const manifest: PluginManifest = {
  id: 'kanban-view-plugin',
  name: 'Kanban View Plugin',
  version: '2.0.0',
  description: 'Clean kanban view with data layer separation and modern architecture',
};

const KanbanViewPlugin: Plugin = {
  manifest,
  initialize: async (api: PluginAPI) => {
    // Single component: fetch and render KanbanBoard directly
    const KanbanView: React.FC<{ tableId: string; viewId?: string }> = ({ tableId, viewId }) => {
      const { tableData, isLoading, error, refresh, addRow, insertRowData, deleteRecord, updateField, updateView, updateViewMeta, createCard, duplicateCard, deleteCard, updateFieldOptions, persistStackOrder, changeGroupByColumn, updateViewConfig } = useKanbanData({ tableId, viewId });

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
              <div className="text-red-500 text-lg mb-2">Something went wrong while loading the kanban view.</div>
              <p className="text-muted-foreground mb-4">{errorMessage}</p>
              <button onClick={() => refresh()} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Retry</button>
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
        <Suspense fallback={
          <div className="h-full flex items-center justify-center">
            <Loader size={10} />
          </div>
        }>
          <KanbanBoard
            tableData={tableData}
            viewId={viewId}
            onRefresh={() => refresh()}
            actions={{ addRow, insertRowData, deleteRecord, updateField, updateView, updateViewMeta, createCard, duplicateCard, deleteCard, updateFieldOptions, persistStackOrder, changeGroupByColumn, updateViewConfig }}
          />
        </Suspense>
      );
    };

    api.registerExtension('view', {
      id: 'kanban-view',
      order: 53,
      render: (props: ViewExtensionProps) => {
        const tableId = props?.table?.id;
        const viewId = props?.view?.id;
        const rawType = props?.viewType ?? props?.view?.type;
        const validKanbanTypes = ['kanban', 'kanbanview', 'kanban-view'];
        
        // Allow rendering when type matches kanban even if viewId is absent (slug-based route)
        if (!tableId) return null;
        if (!matchesViewType(rawType, validKanbanTypes)) return null;
        
        // Fetch once and pass kanban data; no ViewHost/context path
        return <KanbanView tableId={tableId} viewId={viewId} />;
      },
    });
  },
};

export default KanbanViewPlugin; 