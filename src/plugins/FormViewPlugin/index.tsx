import React from 'react';
import { Plugin, PluginManifest, PluginAPI } from '../../core/types';
import { matchesViewType } from '../../utils/viewType';
import { useFormData } from './hooks/useFormData';
import { FormView } from './components/FormView';

const manifest: PluginManifest = {
  id: 'form-view-plugin',
  name: 'Form View Plugin',
  version: '2.0.0',
  description: 'Clean form view with centralized data layer and UI-only components',
};

const FormViewPlugin: Plugin = {
  manifest,
  initialize: async (api: PluginAPI, config: any) => {
    // Single component: fetch and render FormView directly (no extra wrappers)
    const FormViewComponent: React.FC<{ tableId: string; viewId?: string; recordId?: string }> = ({ tableId, viewId, recordId }) => {
      const { tableData, isLoading, error, refresh, addRow, insertRowData, deleteRecord, updateField, deleteColumn, createField, updateView, submitForm, createNewField, updateFieldData, toggleFieldVisibility, setAllFieldsVisibility, updateFieldOrder, updateAppearance, deleteFieldData } = useFormData({ tableId, viewId, recordId });

      if (isLoading) return <div className="h-full flex items-center justify-center">Loading form…</div>;
      
      if (error) {
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-2">⚠️ Error Loading Form</div>
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
              <div className="text-muted-foreground text-lg mb-2">📋 No Form Data</div>
              <p className="text-muted-foreground mb-4">Form could not be loaded</p>
              <button onClick={() => refresh()} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">🔄 Retry Loading</button>
            </div>
          </div>
        );
      }
      
      // Form view should work even with no records (for creating new records)

      return (
        <FormView
          tableData={tableData!}
          viewId={viewId}
          recordId={recordId}
          onRefresh={() => refresh()}
          actions={{ addRow, insertRowData, deleteRecord, updateField, deleteColumn, createField, updateView, submitForm, createNewField, updateFieldData, toggleFieldVisibility, setAllFieldsVisibility, updateFieldOrder, updateAppearance, deleteFieldData }}
        />
      );
    };

    api.registerExtension('view', {
      id: 'form-view',
      order: 52,
      render: (props: any) => {
        const tableId = props?.table?.id;
        const viewId = props?.view?.id;
        const recordId = props?.recordId; // Optional specific record
        const rawType = props?.viewType ?? props?.view?.type;
        const validFormTypes = ['form', 'formview', 'form-view'];
        
        // Allow rendering when type matches form even if viewId is absent (slug-based route)
        if (!tableId) return null;
        if (!matchesViewType(rawType, validFormTypes)) return null;
        return <FormViewComponent tableId={tableId} viewId={viewId} recordId={recordId} />;
      },
    });
  },
};

export default FormViewPlugin; 