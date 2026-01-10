import { useCallback } from 'react';
import type { Column } from '../../../types/api.types';

interface UseGanttFieldConfigOptions {
  currentView?: any;
  updateView?: any;
  onRefresh: () => void;
  startDateField?: Column;
  endDateField?: Column;
  progressField?: Column;
  completionField?: Column;
}

export function useGanttFieldConfig({
  currentView,
  updateView,
  onRefresh,
  startDateField,
  endDateField,
  progressField,
  completionField,
}: UseGanttFieldConfigOptions) {
  const handleStartDateFieldChange = useCallback(async (field: Column | undefined) => {
    if (updateView && currentView?.id) {
      await updateView(currentView.id, {
        meta: {
          ...currentView.meta,
          start_date_field_id: field?.id || ''
        }
      });
      onRefresh();
    }
  }, [updateView, currentView, onRefresh]);

  const handleEndDateFieldChange = useCallback(async (field: Column | undefined) => {
    if (updateView && currentView?.id) {
      await updateView(currentView.id, {
        meta: {
          ...currentView.meta,
          end_date_field_id: field?.id || ''
        }
      });
      onRefresh();
    }
  }, [updateView, currentView, onRefresh]);

  const handleProgressFieldChange = useCallback(async (field: Column | undefined) => {
    if (updateView && currentView?.id) {
      await updateView(currentView.id, {
        meta: {
          ...currentView.meta,
          progress_field_id: field?.id || ''
        }
      });
      onRefresh();
    }
  }, [updateView, currentView, onRefresh]);

  const handleCompletionFieldChange = useCallback(async (field: Column | undefined) => {
    if (updateView && currentView?.id) {
      await updateView(currentView.id, {
        meta: {
          ...currentView.meta,
          completion_field_id: field?.id || ''
        }
      });
      onRefresh();
    }
  }, [updateView, currentView, onRefresh]);

  return {
    handleStartDateFieldChange,
    handleEndDateFieldChange,
    handleProgressFieldChange,
    handleCompletionFieldChange,
  };
}

