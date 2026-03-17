// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
export interface FieldUsageInfo {
  isUsedInViews: boolean;
  usedInViews: Array<{
    viewId: string;
    viewName: string;
    viewType: string;
    usageType: string;
  }>;
}

export const checkFieldUsageInViews = (
  fieldId: string, 
  allViews: any[]
): FieldUsageInfo => {
  const usedInViews: FieldUsageInfo['usedInViews'] = [];
  
  if (!allViews || allViews.length === 0) {
    return {
      isUsedInViews: false,
      usedInViews: []
    };
  }
  
  // View types that should be checked for field usage (exclude grid views)
  const viewTypesToCheck = new Set(['kanban', 'ganttChart', 'gallery', 'calendar']);
  
  allViews.forEach((view) => {
    const viewType = view.type || 'grid';
    
    // Only check the specified view types - skip grid, form, and all other view types
    if (!viewTypesToCheck.has(viewType)) {
      return;
    }
    
    const meta = view.meta || {};
    const fieldConfig = meta.fieldConfig || [];
    
    // Check if field is in fieldConfig
    if (Array.isArray(fieldConfig) && fieldConfig.length > 0) {
      const isInFieldConfig = fieldConfig.some(
        (fc: any) => String(fc.id) === String(fieldId)
      );
      
      if (isInFieldConfig) {
        const fieldConfigEntry = fieldConfig.find((fc: any) => String(fc.id) === String(fieldId));
        const isHidden = fieldConfigEntry?.isHidden === true;
        
        if (!isHidden) {
          usedInViews.push({
            viewId: view.id,
            viewName: view.title || view.name || 'Untitled View',
            viewType: viewType,
            usageType: 'Visible Field'
          });
        }
      }
    }
    
    // Check all possible field references in view meta
    const fieldReferences: Array<{ key: string; type: string; viewTypes: string[] }> = [
      { key: 'date_field_id', type: 'Date Field', viewTypes: ['calendar'] },
      { key: 'view_target_field', type: 'Group By Field', viewTypes: ['kanban'] },
      { key: 'attachment_field_id', type: 'Attachment Field', viewTypes: ['gallery'] },
      { key: 'start_date_field_id', type: 'Start Date Field', viewTypes: ['ganttChart'] },
      { key: 'end_date_field_id', type: 'End Date Field', viewTypes: ['ganttChart'] },
      { key: 'title_field_id', type: 'Title Field', viewTypes: ['ganttChart'] },
      { key: 'progress_field_id', type: 'Progress Field', viewTypes: ['ganttChart'] },
      { key: 'groupBy.column', type: 'Group By Field', viewTypes: ['ganttChart'] }
    ];
    
    fieldReferences.forEach(({ key, type, viewTypes }) => {
      if (!viewTypes.includes(viewType)) {
        return;
      }
      
      let fieldRefId: string | null = null;
      
      if (key === 'groupBy.column') {
        fieldRefId = meta.groupBy?.column;
      } else {
        fieldRefId = meta[key];
      }
      
      if (fieldRefId && String(fieldRefId) === String(fieldId)) {
        const alreadyAdded = usedInViews.some(v => v.viewId === view.id);
        if (!alreadyAdded) {
          usedInViews.push({
            viewId: view.id,
            viewName: view.title || view.name || 'Untitled View',
            viewType: viewType,
            usageType: type
          });
        }
      }
    });
  });
  
  return {
    isUsedInViews: usedInViews.length > 0,
    usedInViews
  };
};

export const checkCriticalFieldUsageInViews = (
  fieldId: string,
  allViews: any[],
  currentTableId?: string
): FieldUsageInfo => {
  const usedInViews: FieldUsageInfo['usedInViews'] = [];
  
  if (!allViews || allViews.length === 0) {
    return {
      isUsedInViews: false,
      usedInViews: []
    };
  }
  
  const viewsToCheck = currentTableId
    ? allViews.filter((view: any) => {
        const viewTableId = String(view.model_id || view.modelId || '');
        return viewTableId === String(currentTableId);
      })
    : allViews;
  
  // Critical view types as a Set
  const criticalViewTypes = new Set(['kanban', 'ganttChart', 'gallery', 'calendar']);
  
  viewsToCheck.forEach((view) => {
    const viewType = view.type || 'grid';
    
    // Only check critical view types
    if (!criticalViewTypes.has(viewType)) {
      return;
    }
    
    const meta = view.meta || {};
    const criticalFieldChecks: Array<{ key: string; type: string }> = [];
    
    if (viewType === 'kanban') {
      criticalFieldChecks.push({ key: 'view_target_field', type: 'Group By Field' });
    } else if (viewType === 'gallery') {
      criticalFieldChecks.push({ key: 'attachment_field_id', type: 'Attachment Field' });
    } else if (viewType === 'calendar') {
      criticalFieldChecks.push({ key: 'date_field_id', type: 'Date Field' });
    } else if (viewType === 'ganttChart') {
      criticalFieldChecks.push(
        { key: 'start_date_field_id', type: 'Start Date Field' },
        { key: 'end_date_field_id', type: 'End Date Field' },
        { key: 'title_field_id', type: 'Title Field' },
        { key: 'progress_field_id', type: 'Progress Field' }
      );
      if (meta.groupBy?.column && String(meta.groupBy.column) === String(fieldId)) {
        usedInViews.push({
          viewId: view.id,
          viewName: view.title || view.name || 'Untitled View',
          viewType: 'ganttChart',
          usageType: 'Group By Field'
        });
      }
    }
    
    criticalFieldChecks.forEach(({ key, type }) => {
      const fieldRefId = meta[key];
      
      if (fieldRefId && String(fieldRefId) === String(fieldId)) {
        const alreadyAdded = usedInViews.some(v => v.viewId === view.id);
        if (!alreadyAdded) {
          usedInViews.push({
            viewId: view.id,
            viewName: view.title || view.name || 'Untitled View',
            viewType: viewType,
            usageType: type
          });
        }
      }
    });
  });
  
  return {
    isUsedInViews: usedInViews.length > 0,
    usedInViews
  };
};
