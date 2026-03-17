// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { Plugin, PluginManifest, PluginAPI } from '../../core/types';
import { matchesViewType } from '../../utils/viewType';
import { useGalleryData } from './hooks/useGalleryData';
import { GalleryView } from './components/GalleryView';
import { Loader } from '../../components/ui/Loader';

interface ViewExtensionProps {
  table?: { id?: string };
  view?: { id?: string; type?: string };
  viewType?: string;
}

const manifest: PluginManifest = {
  id: 'gallery-view-plugin',
  name: 'Gallery View Plugin',
  version: '1.0.0',
  description: 'Gallery view for displaying records with attachment fields in a card-based layout',
};

const GalleryViewPlugin: Plugin = {
  manifest,
  initialize: async (api: PluginAPI) => {
    // Single component: fetch and render GalleryView directly
    const GalleryViewComponent: React.FC<{ tableId: string; viewId?: string }> = ({ tableId, viewId }) => {
      const galleryData = useGalleryData({ tableId, viewId });
      const { 
        tableData, 
        isLoading, 
        error, 
        refresh, 
        deleteRecord, 
        updateViewConfig 
      } = galleryData;

      if (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-2">Something went wrong while loading the gallery view.</div>
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
        <GalleryView
          tableData={tableData}
          galleryData={galleryData}
          onRefresh={() => refresh()}
          actions={{ 
            deleteRecord, 
            updateViewConfig 
          }}
        />
      );
    };

    api.registerExtension('view', {
      id: 'gallery-view',
      order: 60,
      render: (props: ViewExtensionProps) => {
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
