// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useMemo } from 'react';
import { useTable, useAddRow, useDeleteRecord, useInsertRowData, useUpdateField, useDeleteColumn, useCreateField, useUpdateView, useUpdateViewAppearance, useInsertRelationData, useAddAttachment } from '../../../hooks/useApi';
import type { TableData } from '../../../types/api.types';
import { fieldsToFilter } from '../../../types/constants';
import { isFormulaField } from '../../../utils/fieldUtils';

// Data layer for Form: fetch + CRUD orchestration; keeps UI components clean
export interface UseFormDataOptions {
  tableId: string;
  viewId?: string;
  recordId?: string; // For editing specific record
}

export interface FormField {
  id: string;
  key: string;
  column_name: string;
  title: string;
  type: string;
  uidt: string;
  position: number;
  order_index: number;
  isSystem: boolean;
  system: boolean;
  hidden: boolean;
  is_hidden: boolean;
  config: any;
  required?: boolean;
  description?: string;
}

export interface FormRecord {
  id: string;
  _meta: {
    id: string;
    created_at: string;
    updated_at: string;
    deleted_at: any;
  };
  data: Record<string, any>;
}

export interface UseFormDataReturn {
  // Data
  tableData?: TableData;
  isLoading: boolean;
  error: unknown;

  // CRUD ops (thin wrappers around shared hooks)
  refresh: () => void;
  addRow: ReturnType<typeof useAddRow>;
  insertRowData: ReturnType<typeof useInsertRowData>;
  deleteRecord: ReturnType<typeof useDeleteRecord>;
  updateField: ReturnType<typeof useUpdateField>;
  deleteColumn: ReturnType<typeof useDeleteColumn>;
  createField: ReturnType<typeof useCreateField>;
  updateView: ReturnType<typeof useUpdateView>;

  // Business logic operations
  submitForm: (formData: Record<string, any>, formFields: FormField[]) => Promise<void>;
  createNewField: (fieldConfig: any, allColumns: any[]) => Promise<void>;
  updateFieldData: (fieldId: string, updates: any, formFields: FormField[]) => Promise<void>;
  toggleFieldVisibility: (fieldId: string, view: any, formFields: FormField[]) => Promise<void>;
  setAllFieldsVisibility: (visible: boolean, view: any, formFields: FormField[]) => Promise<void>;
  updateFieldOrder: (newFields: any[], view: any) => Promise<void>;
  updateAppearance: (appearanceUpdates: any, view: any) => Promise<void>;
  deleteFieldData: (fieldId: string) => Promise<void>;
}

export function useFormData({ tableId }: UseFormDataOptions): UseFormDataReturn {
  const tableQuery = useTable(String(tableId));

  // Transform API response to TableData format
  const tableData = useMemo(() => {
    const raw = tableQuery.data as any;
    if (!raw) return undefined;

    // Handle both direct TableData and wrapped TableResponse
    const data = raw.data ?? raw;

    // Ensure we have the expected structure (records can be null or empty array)
    if (data?.model && data?.columns) {
      const filteredColumns = data.columns.filter((col: any) => !fieldsToFilter.includes(col.uidt));
      // Example filter, adjust as needed
      return { ...data, columns: filteredColumns, records: data.records || [] } as TableData;
    }

    return undefined;
  }, [tableQuery.data]);

  // Expose mutations as-is; UI decides how/when to call
  const addRow = useAddRow();
  const insertRowData = useInsertRowData();
  const deleteRecord = useDeleteRecord();
  const updateField = useUpdateField();
  const deleteColumn = useDeleteColumn();
  const createField = useCreateField();
  const updateView = useUpdateView();
  const updateViewAppearance = useUpdateViewAppearance();
  const insertRelationData = useInsertRelationData();
  const addAttachmentMutation = useAddAttachment();

  // Helper functions for submitForm to reduce cognitive complexity
  const validateRequiredFields = (formData: Record<string, any>, formFields: FormField[]): void => {
    const requiredFields = formFields.filter((field) => field.required);
    const missingRequired = requiredFields.filter((field) => !formData[field.id]);

    if (missingRequired.length > 0) {
      console.warn('Missing required fields:', missingRequired);
      throw new Error('Required field(s) must not be left empty.');
    }
  };

  const createRecord = async (): Promise<string> => {
    const createdRecord = await addRow.mutateAsync({
      model_id: tableData?.model?.id || ''
    });

    const backendRowId = createdRecord.id ?? createdRecord.data?.record?.id;

    if (!backendRowId) {
      throw new Error('Failed to create record - no ID returned');
    }

    return String(backendRowId);
  };

  const shouldSkipField = (field: FormField): boolean => {
    return field.type === 'attachment' || field.uidt === 'attachment' ||
           field.type === 'links' || field.uidt === 'links' ||
           isFormulaField(field);
  };

  const ensureTitleValue = (field: FormField, formData: Record<string, any>, backendRowId: string): void => {
    const isTitleField = field.title?.toLowerCase().includes('title') || field.column_name === 'title';
    if (isTitleField && !formData[field.id]) {
      formData[field.id] = `Record ${backendRowId}`;
    }
  };

  const processDateTimeValue = (value: string, field: FormField): string | null => {
    if (value.includes('T')) {
      return value; // Already in ISO format
    }
    if (!value.trim()) {
      return null;
    }
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        console.warn(`Invalid date format for field ${field.title}: ${value}`);
        return null;
      }
      return date.toISOString();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to parse date for field ${field.title}: ${value}`, errorMessage);
      return null;
    }
  };

  const processDateValue = (value: string, field: FormField): string | null => {
    if (!value.trim()) {
      return null;
    }
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        console.warn(`Invalid date format for field ${field.title}: ${value}`);
        return null;
      }
      return date.toISOString().split('T')[0];
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to parse date for field ${field.title}: ${value}`, errorMessage);
      return null;
    }
  };

  const processFieldValue = (value: any, field: FormField): any => {
    if (field.type === 'json' && typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    if (field.type === 'datetime' || field.uidt === 'datetime') {
      if (typeof value === 'string') {
        const processed = processDateTimeValue(value, field);
        return processed;
      }
    }
    if (field.type === 'date' || field.uidt === 'date') {
      if (typeof value === 'string') {
        const processed = processDateValue(value, field);
        return processed;
      }
    }
    return value;
  };

  const createInsertPromise = (field: FormField, processedValue: any, backendRowId: string): Promise<any> => {
    return insertRowData.mutateAsync({
      model_id: tableData?.model?.id || '',
      column_id: field.id,
      row_id: Number(backendRowId),
      value: processedValue
    }).catch((err: unknown) => {
      console.error(`Failed to insert field ${field.title} (${field.id}):`, err);
      console.error(`Field value was:`, processedValue);
      console.error(`Field type:`, field.type, field.uidt);
      throw err;
    });
  };

  const processRegularFields = async (formData: Record<string, any>, formFields: FormField[], backendRowId: string): Promise<void> => {
    const insertPromises: Promise<any>[] = [];

    for (const field of formFields) {
      if (shouldSkipField(field)) {
        continue;
      }

      ensureTitleValue(field, formData, backendRowId);
      const value = formData[field.id];

      if (value === undefined || value === null || value === '') {
        continue;
      }

      const processedValue = processFieldValue(value, field);
      if (processedValue === null) {
        continue; // Field processing failed, skip it
      }

      const insertPromise = createInsertPromise(field, processedValue, backendRowId);
      insertPromises.push(insertPromise);
    }

    if (insertPromises.length > 0) {
      try {
        await Promise.all(insertPromises);
      } catch (error: unknown) {
        console.error('Some field insertions failed:', error);
      }
    }
  };

  const processLinksFields = async (formData: Record<string, any>, formFields: FormField[], backendRowId: string): Promise<void> => {
    const linksPromises: Promise<any>[] = [];

    for (const field of formFields) {
      if (field.type !== 'links' && field.uidt !== 'links') {
        continue;
      }

      const linksValue = formData[field.id];
      if (!Array.isArray(linksValue) || linksValue.length === 0) {
        continue;
      }

      for (const linkedRecord of linksValue) {
        if (!linkedRecord?.id) {
          continue;
        }

        const linkPromise = insertRelationData.mutateAsync({
          model_id: tableData?.model?.id || '',
          column_id: field.id,
          source_row_id: Number(backendRowId),
          target_row_id: Number(linkedRecord.id),
          action: 'link'
        }).catch((err: unknown) => {
          console.error(`Failed to link record ${linkedRecord.id} to field ${field.title} (${field.id}):`, err);
          throw err;
        });

        linksPromises.push(linkPromise);
      }
    }

    if (linksPromises.length > 0) {
      try {
        await Promise.all(linksPromises);
      } catch (error: unknown) {
        console.error('Some links operations failed:', error);
      }
    }
  };

  const processAttachmentFields = async (formData: Record<string, any>, formFields: FormField[], backendRowId: string): Promise<void> => {
    const attachmentPromises: Promise<any>[] = [];

    for (const field of formFields) {
      if (field.type !== 'attachment' && field.uidt !== 'attachment') {
        continue;
      }

      const attachmentValue = formData[field.id];
      if (!Array.isArray(attachmentValue) || attachmentValue.length === 0) {
        continue;
      }

      const filesToUpload = attachmentValue
        .filter((file: any) => file.file instanceof File)
        .map((file: any) => file.file);

      if (filesToUpload.length === 0) {
        continue;
      }

      const uploadPromise = addAttachmentMutation.mutateAsync({
        model_id: tableData?.model?.id || '',
        column_id: field.id,
        row_id: Number(backendRowId),
        files: filesToUpload
      }).catch((err: unknown) => {
        console.error(`Failed to upload attachments for field ${field.title} (${field.id}):`, err);
        throw err;
      });

      attachmentPromises.push(uploadPromise);
    }

    if (attachmentPromises.length > 0) {
      try {
        await Promise.all(attachmentPromises);
      } catch (error: unknown) {
        console.error('Some attachment uploads failed:', error);
      }
    }
  };

  // Business logic operations
  const submitForm = async (formData: Record<string, any>, formFields: FormField[]): Promise<void> => {
    validateRequiredFields(formData, formFields);
    const backendRowId = await createRecord();
    await processRegularFields(formData, formFields, backendRowId);
    await processLinksFields(formData, formFields, backendRowId);
    await processAttachmentFields(formData, formFields, backendRowId);
  };

  const createNewField = async (fieldConfig: any, allColumns: any[]) => {
    await createField.mutateAsync({
      tableId: tableData?.model?.id || '',
      baseId: tableData?.model?.base_id || '',
      config: {
        title: fieldConfig.title || fieldConfig.key,
        uidt: fieldConfig.type || fieldConfig.uidt,
        meta: fieldConfig.meta ?? {},
        order_index: allColumns.length,
        description: fieldConfig.description || ''
      }
    });
  };

  const updateFieldData = async (fieldId: string, updates: any) => {
    // Map FieldEditor updates to API field format
    const apiUpdates: any = {};

    if (updates.name || updates.title) {
      apiUpdates.title = updates.name || updates.title;
    }
    if (updates.description !== undefined) {
      apiUpdates.description = updates.description;
    }
    if (updates.type || updates.uidt) {
      apiUpdates.uidt = updates.type || updates.uidt;
    }
    if (updates.required !== undefined) {
      apiUpdates.required = updates.required;
    }
    if (updates.config || updates.meta) {
      apiUpdates.meta = { ...(updates.config || updates.meta) };
    }

    await updateField.mutateAsync({
      fieldId: fieldId,
      updatedValue: apiUpdates
    });
  };

  const toggleFieldVisibility = async (fieldId: string, view: any) => {
    const currentFieldConfig = view.meta?.fieldConfig || [];
    
    // Optimized with Map for O(1) lookup instead of O(n) find()
    const fieldConfigMap = new Map(
      currentFieldConfig.map((fc: any) => [String(fc.id), fc])
    );
    
    const fieldIdStr = String(fieldId);
    const existingConfig = fieldConfigMap.get(fieldIdStr);
    
    const updatedFieldConfig = existingConfig
      ? currentFieldConfig.map((fc: any) =>
          String(fc.id) === fieldIdStr ? { ...fc, isHidden: !fc.isHidden } : fc
        )
      : [...currentFieldConfig, { id: fieldId, isHidden: true, position: currentFieldConfig.length }];

    const newMeta = { ...view.meta, fieldConfig: updatedFieldConfig };
    await updateView.mutateAsync({ viewId: view.id, view: { meta: newMeta } });
  };

  const setAllFieldsVisibility = async (visible: boolean, view: any, formFields: FormField[]) => {
    const updatedFieldConfig = formFields.map((field, index) => ({
      id: field.id,
      isHidden: !visible,
      position: index
    }));

    const newMeta = { ...view.meta, fieldConfig: updatedFieldConfig };
    await updateView.mutateAsync({ viewId: view.id, view: { meta: newMeta } });
  };

  const updateFieldOrder = async (newFields: any[], view: any) => {
    // Get existing fieldConfig from view meta
    const existingFieldConfig = (view?.meta?.fieldConfig || []) as any[];
    
    // Create a map of new positions from reordered fields
    const newFieldMap = new Map<string, number>();
    // Also create a map for newFields data (including isHidden) for O(1) lookups
    const newFieldsMap = new Map<string, any>();
    newFields.forEach((field, index) => {
      if (field.id) {
        const fieldIdStr = String(field.id);
        newFieldMap.set(fieldIdStr, index);
        newFieldsMap.set(fieldIdStr, field);
      }
    });

    // Update fieldConfig preserving all fields, updating positions for reordered ones
    // Optimized with Map for O(1) lookups instead of O(n) find() calls
    const updatedFieldConfig = existingFieldConfig.map((fc: any) => {
      const fcIdStr = String(fc.id);
      const newPosition = newFieldMap.get(fcIdStr);
      if (newPosition !== undefined) {
        // This field was reordered, use new position
        const newField = newFieldsMap.get(fcIdStr);
        return { 
          ...fc, 
          position: newPosition,
          // Update isHidden if provided in newFields - O(1) lookup
          isHidden: typeof newField?.isHidden === 'boolean' 
            ? newField.isHidden 
            : fc.isHidden
        };
      }
      // This field wasn't in the reordered list, keep existing config
      return fc;
    });

    // Also handle any new fields that might not be in fieldConfig yet
    const existingIds = new Set(existingFieldConfig.map((fc: any) => String(fc.id)));
    newFields.forEach((field, index) => {
      if (field.id && !existingIds.has(String(field.id))) {
        updatedFieldConfig.push({
          id: field.id,
          position: index,
          isHidden: field.isHidden || field.is_hidden || false
        });
      }
    });

    // Sort by position and re-index to ensure no gaps
    updatedFieldConfig.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
    const finalFieldConfig = updatedFieldConfig.map((fc: any, idx: number) => ({
      ...fc,
      position: idx
    }));

    const newMeta = { ...view.meta, fieldConfig: finalFieldConfig };
    await updateView.mutateAsync({ viewId: view.id, view: { meta: newMeta } });
  };

  const updateAppearance = async (appearanceUpdates: any, view: any) => {
    // Use optimized appearance-only mutation for better performance
    // This avoids invalidating all tables, bases, and workspaces
    await updateViewAppearance.mutateAsync({ 
      viewId: view.id, 
      appearance: appearanceUpdates,
      currentMeta: view.meta // Pass current meta to avoid cache lookup
    });
  };

  const deleteFieldData = async (fieldId: string) => {
    await deleteColumn.mutateAsync({
      fieldId: fieldId,
      tableId: tableData?.model?.id || ''
    });
  };


  return {
    tableData,
    isLoading: tableQuery.isLoading,
    error: tableQuery.error,
    refresh: (): void => {
      tableQuery.refetch().catch(() => {
        // Silently handle refetch errors - they're non-critical
      });
    },
    addRow,
    insertRowData,
    deleteRecord,
    updateField,
    deleteColumn,
    createField,
    updateView,
    // Business logic operations
    submitForm,
    createNewField,
    updateFieldData,
    toggleFieldVisibility,
    setAllFieldsVisibility,
    updateFieldOrder,
    updateAppearance,
    deleteFieldData,
  };
}