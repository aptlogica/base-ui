// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useMemo } from 'react';
import { useTable, useUpdateView, useDeleteRecord } from '../../../hooks/useApi';
import { TableData } from '../../../types/api.types';
import { BaseColumn } from '../../../types/column.types';
import { normalizeFieldType } from '../../../utils/fieldType';
import { parseApiColumnMeta } from '../../../components/shared/table/tableUtils';
import { fieldsToFilter } from '../../../types/constants';

export interface GalleryItem {
  id: string | number;
  title: string;
  imageUrl?: string;
  imageAlt?: string;
  allImages?: any[]; // All images from the selected attachment field
  metadata: Record<string, any>;
  rawData: any;
}

export interface UseGalleryDataOptions {
  tableId: string;
  viewId?: string;
}

export interface UseGalleryDataReturn {
  tableData: TableData | undefined;
  isLoading: boolean;
  error: any;
  refresh: () => void;
  deleteRecord: (recordId: string) => Promise<void>;
  updateView: (viewId: string, updates: Record<string, unknown>) => Promise<void>;
  updateViewConfig: (viewId: string, updates: any) => Promise<void>;
  // Gallery-specific data
  galleryItems: GalleryItem[];
  attachmentField?: BaseColumn;
  attachmentFields: BaseColumn[];
  columns: BaseColumn[];
  view: any;
}

export function useGalleryData({ tableId, viewId }: UseGalleryDataOptions): UseGalleryDataReturn {
  const tableQuery = useTable(String(tableId));
  const updateViewMutation = useUpdateView();
  const deleteRecordMutation = useDeleteRecord();
  
  // SDK returns a StandardResponse with `data`; unwrap it to our canonical TableData
  const tableData = useMemo(() => {
    const raw = tableQuery.data as any;
    if (!raw) return undefined;
    return (raw.data ?? raw) as TableData;
  }, [tableQuery.data]);

  // Process raw table data for Gallery consumption
  const processedData = useMemo(() => {
    if (!tableData) {
      return {
        columns: [],
        galleryItems: [],
        attachmentField: undefined,
        attachmentFields: [],
        view: null,
      };
    }

    const columns = tableData.columns.filter(col => !fieldsToFilter.includes(col.uidt)) || [];
    const records = tableData.records || [];
    const views = tableData.views || [];

    // Find current view
    const currentView = viewId ? views.find((v: any) => String(v?.id) === String(viewId)) : null;
    const viewMeta = currentView?.meta || {};

    // Process columns with GridView compatibility
    const uiColumns: BaseColumn[] = columns.map((col: any, index: number) => ({
      id: col.id,
      key: col.column_name || col.key,
      title: col.title,
      type: normalizeFieldType(col.uidt || col.type),
      uidt: col.uidt,
      position: col.order_index ?? index,
      hidden: col.hidden || col.deleted || false,
      isHidden: col.hidden || col.deleted || false,
      system: col.system || col.virtual || false,
      meta: parseApiColumnMeta(col.meta || {}),
      config: col.meta || {},
      options: (col.meta?.options || []).map((opt: string) => ({ label: opt, value: opt }))
    }));

    // Find attachment fields
    const attachmentFieldTypes = new Set(['attachment']);
    const attachmentFields = uiColumns.filter(col => 
      attachmentFieldTypes.has(col.type || '') || attachmentFieldTypes.has(col.uidt || '')
    );

    // Get selected attachment field from view config
    const selectedAttachmentFieldId = viewMeta?.attachment_field_id;
    const attachmentField = selectedAttachmentFieldId 
      ? attachmentFields.find(f => f.id === selectedAttachmentFieldId)
      : attachmentFields[0]; // Default to first attachment field

    // Process records into gallery items - create a card for each image
    const galleryItems: GalleryItem[] = [];
    
    records.forEach((record: any) => {
      const rowData = record?.data || record;
      
      // Get title from record (prefer title field, fallback to first text field)
      const titleField = uiColumns.find(col => 
        col.key?.toLowerCase() === 'title' || 
        (col.type === 'text' && !col.system)
      );
      const title = titleField ? (rowData?.[titleField.key || ''] || record?.[titleField.key || '']) : `Record ${record?.id || ''}`;

      // Get images from selected attachment field
      let allImages: any[] = [];
      
      if (attachmentField) {
        const attachmentData = rowData?.[attachmentField.key || ''] || record?.[attachmentField.key || ''];
        if (attachmentData && Array.isArray(attachmentData) && attachmentData.length > 0) {
          // Filter out empty objects, null values, and objects without valid URLs
          allImages = attachmentData.filter(att => 
            att && 
            typeof att === 'object' && 
            !Array.isArray(att) && 
            (att.url || att.thumbnail_url) &&
            Object.keys(att).length > 0
          );
        } 
      }

      // Build metadata from all fields (include Title, attachment fields, JSON fields if visible, exclude system fields)
      const metadata: Record<string, any> = {};
      uiColumns.forEach(col => {
        const isTitleField = col.key?.toLowerCase() === 'title' || col.title?.toLowerCase() === 'title';
        const isJsonField = col.type === 'json' || col.uidt === 'json';
        const isLinksField = col.type === 'links' || col.uidt === 'links';
        const isLookupField = col.type === 'lookup' || col.uidt === 'lookup';
        
        if (!col.system || isTitleField) {
          const value = rowData?.[col.key || ''] || record?.[col.key || ''];
          if (isTitleField || isJsonField || isLinksField || isLookupField || 
              (value !== null && value !== undefined && value !== '')) {
            // Use column title as key for metadata (this matches how we look it up in GalleryCard)
            metadata[col.title] = value;
          }
        }
      });

      // Create only one card per record, with carousel for multiple images
      galleryItems.push({
        id: record?.id || '',
        title: String(title || ''),
        imageUrl: allImages.length > 0 ? allImages[0].thumbnail_url : undefined, // First image as primary (use thumbnail)
        imageAlt: allImages.length > 0 ? (allImages[0].title || allImages[0].name || `${title} - Image 1`) : undefined,
        allImages: allImages, // Keep reference to all images for carousel
        metadata,
        rawData: record
      });
    });

    return {
      columns: uiColumns,
      galleryItems,
      attachmentField,
      attachmentFields,
      view: currentView
    };
  }, [tableData, viewId]);

  const deleteRecord = async (recordId: string) => {
    if (!tableId) {
      console.error('Cannot delete record: tableId is missing');
      return;
    }
    await deleteRecordMutation.mutateAsync({
      model_id: String(tableId),
      row_id: Number(recordId)
    });
  };

  const updateView = async (viewId: string, updates: Record<string, unknown>) => {
    try {
      // Get current view to merge with updates
      const currentView = processedData.view;
      if (!currentView) {
        return;
      }
      
      // Merge updates with existing view meta
      // Remove any nested meta.meta structure to prevent double nesting
      const currentMeta = currentView.meta || {};
      const { meta: nestedMeta, ...cleanMeta } = currentMeta as any;
      
      // Merge clean meta with updates (avoid nested meta.meta structure)
      const newMeta = { ...cleanMeta, ...updates };
      
      // Update the view using the mutation
      await updateViewMutation.mutateAsync({
        viewId: viewId,
        view: { meta: newMeta }
      });
    } catch (error) {
      console.error('Failed to update view:', error);
      throw error;
    }
  };

  const updateViewConfig = async (viewId: string, updates: any) => {
    try {
      // Get current view to merge with updates
      const currentView = processedData.view;
      if (!currentView) {
        console.error('No current view found for updateViewConfig');
        return;
      }
      
      // Merge updates with existing view meta
      // Remove any nested meta.meta structure to prevent double nesting
      const currentMeta = currentView.meta || {};
      const { meta: nestedMeta, ...cleanMeta } = currentMeta as any;
      
      // Merge clean meta with updates (avoid nested meta.meta structure)
      const newMeta = { ...cleanMeta, ...updates };
      
      // Update the view using the mutation
      await updateViewMutation.mutateAsync({
        viewId: viewId,
        view: { meta: newMeta }
      });
    } catch (error) {
      console.error('Failed to update view config:', error);
      throw error;
    }
  };

  return {
    tableData,
    isLoading: tableQuery.isLoading,
    error: tableQuery.error,
    refresh: () => {
      void tableQuery.refetch().catch(() => {
        // Error handling is done by the query itself
      });
    },
    deleteRecord,
    updateView,
    updateViewConfig,
    ...processedData
  };
}
