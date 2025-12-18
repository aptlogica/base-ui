import React from 'react';
import GalleryView from './GalleryView';
import type { ViewContext } from '../../../types/viewRuntime';

export interface GalleryViewPageProps {
  tableId: string;
  viewId?: string;
  context?: ViewContext;
}

const GalleryViewPage: React.FC<GalleryViewPageProps> = ({ tableId, viewId, context }) => {
  if (!tableId) return <div className="p-8 text-center text-red-500">Table not found</div>;
  return (
    <div>
      <GalleryView 
        tableId={tableId}
        viewId={viewId}
        context={context}
        model={context ? { id: context.tableId, base_id: context.baseId, workspace_id: context.workspaceId, title: context.tableTitle, alias: context.tableAlias, meta: context.tableMeta } : undefined}
      />
    </div>
  );
};

export default GalleryViewPage; 