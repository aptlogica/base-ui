import React from 'react';
import { Plugin, PluginManifest, PluginAPI } from '../../core/types';
import { matchesViewType } from '../../utils/viewType';
import { useGalleryData } from './hooks/useGalleryData';
import { GalleryView } from './components/GalleryView';

const manifest: PluginManifest = {
  id: 'gallery-view-plugin',
  name: 'Gallery View Plugin',
  version: '1.0.0',
  description: 'Gallery view for displaying records with attachment fields in a card-based layout',
};

const GalleryViewPlugin: Plugin = {
  manifest,
  initialize: async (api: PluginAPI, config: any) => {
    // Single component: fetch and render GalleryView directly
    const GalleryViewComponent: React.FC<{ tableId: string; viewId?: string }> = ({ tableId, viewId }) => {
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
        updateViewConfig 
      } = useGalleryData({ tableId, viewId });

      if (isLoading) return <div className="h-full flex items-center justify-center">Loading gallery view…</div>;
      
      if (error) {
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-2">⚠️ Error Loading Gallery View</div>
              <p className="text-muted-foreground mb-4">{String(error)}</p>
              <button onClick={() => refresh()} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Retry</button>
            </div>
          </div>
        );
      }
      
      if (!tableData || !tableData.model || !tableData.columns) {
        console.log('🔍 Gallery Debug - No data:', {
          hasTableData: !!tableData,
          hasModel: !!tableData?.model,
          hasColumns: !!tableData?.columns,
          tableData: tableData
        });
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-muted-foreground text-lg mb-2">🖼️ No Gallery Data</div>
              <p className="text-muted-foreground mb-4">Gallery view could not be loaded</p>
              <button onClick={() => refresh()} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">🔄 Retry Loading</button>
            </div>
          </div>
        );
      }

      return (
        <GalleryView
          tableData={tableData}
          onRefresh={() => refresh()}
          actions={{ 
            addRow, 
            insertRowData, 
            deleteRecord, 
            updateField, 
            updateView, 
            updateViewConfig 
          }}
        />
      );
    };

    api.registerExtension('view', {
      id: 'gallery-view',
      order: 60,
      render: (props: any) => {
        const tableId = props?.table?.id;
        const viewId = props?.view?.id;
        const rawType = props?.viewType ?? props?.view?.type;
        const validGalleryTypes = ['gallery', 'galleryview', 'gallery-view', 'gallery_view'];
        
        // Allow rendering when type matches gallery even if viewId is absent (slug-based route)
        if (!tableId) return null;
        if (!matchesViewType(rawType, validGalleryTypes)) return null;
        
        // Fetch once and pass gallery data; no ViewHost/context path
        return <GalleryViewComponent tableId={tableId} viewId={viewId} />;
      },
    });
  },
};

export default GalleryViewPlugin;