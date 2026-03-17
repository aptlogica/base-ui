// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { Suspense, lazy } from 'react';
import { Plugin, PluginManifest, PluginAPI } from '../../core/types';
import { matchesViewType } from '../../utils/viewType';
import { useFormData } from './hooks/useFormData';
// LAZY LOAD: FormView component - only load when FormView is actually rendered
const FormView = lazy(() => 
  import('./components/FormView').then(m => ({ default: m.FormView }))
);
import { Loader } from '../../components/ui/Loader';

interface ViewExtensionProps {
  table?: { id?: string };
  view?: { id?: string; type?: string };
  viewType?: string;
  recordId?: string;
}

const manifest: PluginManifest = {
  id: 'form-view-plugin',
  name: 'Form View Plugin',
  version: '2.0.0',
  description: 'Clean form view with centralized data layer and UI-only components',
};

const FormViewPlugin: Plugin = {
  manifest,
  initialize: async (api: PluginAPI) => {
    // Single component: fetch and render FormView directly (no extra wrappers)
    const FormViewComponent: React.FC<{ tableId: string; viewId?: string; recordId?: string }> = ({ tableId, viewId, recordId }) => {
      const { tableData, isLoading, error, refresh, addRow, insertRowData, deleteRecord, updateField, deleteColumn, createField, updateView, submitForm, createNewField, updateFieldData, toggleFieldVisibility, setAllFieldsVisibility, updateFieldOrder, updateAppearance, deleteFieldData } = useFormData({ tableId, viewId, recordId });

      if (isLoading) {
        return (
          <div className="h-full flex items-center justify-center">
            <Loader size={10} />
          </div>
        );
      }
      
      if (error) {
        let errorMessage = 'Unknown error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-2">Something went wrong while loading the form.</div>
              <p className="text-muted-foreground mb-4">{errorMessage}</p>
              <button onClick={() => refresh()} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Retry</button>
            </div>
          </div>
        );
      }
      
      if (!tableData?.model || !tableData?.columns) {
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-muted-foreground text-lg mb-2">No form data</div>
              <p className="text-muted-foreground mb-4">Form could not be loaded</p>
              <button onClick={() => refresh()} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Retry</button>
            </div>
          </div>
        );
      }
      
      // Form view should work even with no records (for creating new records)

      return (
        <Suspense fallback={
          <div className="h-full flex items-center justify-center">
            <Loader size={10} />
          </div>
        }>
          <FormView
            tableData={tableData}
            viewId={viewId}
            recordId={recordId}
            onRefresh={() => refresh()}
            actions={{ addRow, insertRowData, deleteRecord, updateField, deleteColumn, createField, updateView, submitForm, createNewField, updateFieldData, toggleFieldVisibility, setAllFieldsVisibility, updateFieldOrder, updateAppearance, deleteFieldData }}
          />
        </Suspense>
      );
    };

    api.registerExtension('view', {
      id: 'form-view',
      order: 52,
      render: (props: ViewExtensionProps) => {
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
