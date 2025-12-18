import { useMemo } from 'react';
import { useTable, useViewById } from './useApi';

export interface NormalizedField {
  id: string;
  name: string;
  title: string;
  columnName: string;
  type: string; // Standardized on uidt
  description: string;
  config: any;
  options: string[];
  required: boolean;
  system: boolean;
  virtual: boolean;
  hidden: boolean;
  orderIndex: number;
}

export interface NormalizedRecord {
  id: string | number;
  data: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface NormalizedTable {
  id: string;
  title: string;
  description: string;
  alias: string;
  baseId: string;
  workspaceId: string;
  meta: any;
  createdAt: string;
  updatedAt: string;
}

export interface NormalizedView {
  id: string;
  title: string;
  description: string;
  type: string;
  alias: string;
  config: any;
  meta: any;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NormalizedTableData {
  table: NormalizedTable | null;
  fields: NormalizedField[];
  records: NormalizedRecord[];
  views: NormalizedView[];
  view: NormalizedView | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Normalizes table data from the API into a consistent format for all plugins and components
 */
// Helper function to detect authentication errors
const isAuthError = (error: any): boolean => {
  if (!error) return false;
  const message = error.message || '';
  const status = error?.response?.status;
  return message.includes('Token expired') ||
    message.includes('Unauthorized') ||
    status === 401 ||
    status === 403;
};

export const useNormalizedTableData = (
  tableId: string,
  viewId?: string
): NormalizedTableData => {
  const { data: tableData, isLoading: tableLoading, error: tableError } = useTable(tableId);
  const { data: viewData, isLoading: viewLoading, error: viewError } = useViewById(viewId || '');

  return useMemo(() => {
    const isLoading = tableLoading || (viewId ? viewLoading : false);
    const error = tableError || viewError || null;

    // Don't expose authentication errors - let the redirect happen
    const exposedError = (error && !isAuthError(error)) ? error : null;

    if (!tableData?.data) {
      return {
        table: null,
        fields: [],
        records: [],
        views: [],
        view: null,
        isLoading,
        error: exposedError?.message || null,
      };
    }

    const { model, columns, records, views } = tableData.data;

    // Normalize table
    const normalizedTable: NormalizedTable = {
      id: model.id,
      title: model.title,
      description: model.description || '',
      alias: model.alias,
      baseId: model.base_id,
      workspaceId: model.workspace_id,
      meta: model.meta || {},
      createdAt: model.created_at,
      updatedAt: model.updated_at,
    };

    // Normalize fields (columns)
    const normalizedFields: NormalizedField[] = (columns || []).map((col: any) => ({
      id: col.id,
      name: col.title || col.column_name,
      title: col.title,
      columnName: col.column_name,
      type: col.uidt || col.dt || 'text', // Standardize on uidt
      description: col.description || '',
      config: col.meta || col.config || {},
      options: (col.meta?.options || col.config?.options || []),
      required: !!col.required,
      system: !!col.system,
      virtual: !!col.virtual,
      hidden: !!col.deleted || !!col.is_hidden,
      orderIndex: col.order_index || 0,
    }));

    // Normalize records
    const normalizedRecords: NormalizedRecord[] = (records || []).map((record: any) => ({
      id: record.id,
      data: record,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));

    // Normalize views
    const normalizedViews: NormalizedView[] = (views || []).map((view: any) => ({
      id: view.id,
      title: view.title || view.name,
      // Prefer explicit description, fallback to meta.description if present
      description: view.description || view?.meta?.description || '',
      type: view.type,
      alias: view.alias,
      // Do not mirror meta into config; expose only actual config if backend still supplies it (legacy)
      config: view?.config,
      meta: view?.meta ?? {},
      isDefault: !!view.is_default,
      createdAt: view.created_at,
      updatedAt: view.updated_at,
    }));

    // Find current view
    const currentView = viewId
      ? normalizedViews.find(v => v.id === viewId) || null
      : null;

    return {
      table: normalizedTable,
      fields: normalizedFields,
      records: normalizedRecords,
      views: normalizedViews,
      view: currentView,
      isLoading,
      error: exposedError?.message || null,
    };
  }, [tableData, viewData, tableId, viewId, tableLoading, viewLoading, tableError, viewError]);
};

/**
 * Utility functions for working with normalized field data
 */
export const fieldUtils = {
  getFieldType: (field: NormalizedField | any): string => {
    return field.type || field.uidt || field.dt || 'text';
  },

  getFieldConfig: (field: NormalizedField | any): any => {
    return field.config || field.meta || {};
  },

  getFieldOptions: (field: NormalizedField | any): string[] => {
    const config = fieldUtils.getFieldConfig(field);
    return config.options || [];
  },

  isFieldRequired: (field: NormalizedField | any): boolean => {
    return !!field.required;
  },

  isFieldSystem: (field: NormalizedField | any): boolean => {
    return !!field.system;
  },

  isFieldHidden: (field: NormalizedField | any): boolean => {
    return !!field.hidden || !!field.is_hidden || !!field.deleted;
  },

  getFieldName: (field: NormalizedField | any): string => {
    return field.name || field.title || field.column_name || 'Untitled';
  }
};