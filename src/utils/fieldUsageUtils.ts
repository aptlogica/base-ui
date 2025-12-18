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
  // Only check: kanban, calendar, ganttChart, and gallery
  const viewTypesToCheck = ['kanban', 'ganttChart', 'gallery', 'calendar'];
  
  allViews.forEach((view) => {
    const viewType = view.type || 'grid';
    
    // Only check the specified view types - skip grid, form, and all other view types
    if (!viewTypesToCheck.includes(viewType)) {
      return;
    }
    
    const meta = view.meta || {};
    
    // Check if field is in fieldConfig (used by Gallery, Kanban, etc.)
    // Only check for specific view types: kanban, calendar, ganttChart, gallery
    const fieldConfig = meta.fieldConfig || [];
    
    // Only check if fieldConfig exists and has entries
    // Empty fieldConfig means view hasn't been configured yet, so field is NOT explicitly used
    if (Array.isArray(fieldConfig) && fieldConfig.length > 0) {
      // fieldConfig exists - check if field is explicitly in it
      const isInFieldConfig = fieldConfig.some(
        (fc: any) => String(fc.id) === String(fieldId)
      );
      
      // If field is in fieldConfig and NOT hidden, it's used
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
    // Only check for kanban, calendar, ganttChart, and gallery views
    const fieldReferences: Array<{ key: string; type: string; viewTypes: string[] }> = [
      // Calendar view
      { key: 'date_field_id', type: 'Date Field', viewTypes: ['calendar'] },
      // Kanban view  
      { key: 'view_target_field', type: 'Group By Field', viewTypes: ['kanban'] },
      // Gallery view
      { key: 'attachment_field_id', type: 'Attachment Field', viewTypes: ['gallery'] },
      // Gantt chart view
      { key: 'start_date_field_id', type: 'Start Date Field', viewTypes: ['ganttChart'] },
      { key: 'end_date_field_id', type: 'End Date Field', viewTypes: ['ganttChart'] },
      { key: 'title_field_id', type: 'Title Field', viewTypes: ['ganttChart'] },
      { key: 'progress_field_id', type: 'Progress Field', viewTypes: ['ganttChart'] },
      // Group by field in Gantt (nested in groupBy object)
      { key: 'groupBy.column', type: 'Group By Field', viewTypes: ['ganttChart'] }
    ];
    
    fieldReferences.forEach(({ key, type, viewTypes }) => {
      // Only check field references for the appropriate view types
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
        // Avoid duplicates (field might be in both fieldConfig and as a special field)
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

// Check if field is used as a CRITICAL field in kanban, gantt, gallery, or calendar views
// Critical fields are those that are essential for the view to function
// These fields cannot be deleted or have their type changed
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
  
  // Filter to only current table views if tableId is provided
  const viewsToCheck = currentTableId
    ? allViews.filter((view: any) => {
        const viewTableId = String(view.model_id || view.modelId || '');
        return viewTableId === String(currentTableId);
      })
    : allViews;
  
  // View types that have critical fields that cannot be deleted or have type changed
  const criticalViewTypes = ['kanban', 'ganttChart', 'gallery', 'calendar'];
  
  viewsToCheck.forEach((view) => {
    const viewType = view.type || 'grid';
    
    // Only check critical view types
    if (!criticalViewTypes.includes(viewType)) {
      return;
    }
    
    const meta = view.meta || {};
    
    // Check critical field references for each view type
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
      // Also check groupBy.column for Gantt
      if (meta.groupBy?.column && String(meta.groupBy.column) === String(fieldId)) {
        usedInViews.push({
          viewId: view.id,
          viewName: view.title || view.name || 'Untitled View',
          viewType: 'ganttChart',
          usageType: 'Group By Field'
        });
      }
    }
    
    // Check each critical field reference
    criticalFieldChecks.forEach(({ key, type }) => {
      const fieldRefId = meta[key];
      
      if (fieldRefId && String(fieldRefId) === String(fieldId)) {
        // Avoid duplicates
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
