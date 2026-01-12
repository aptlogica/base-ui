import { useState, useCallback, useMemo } from 'react';
import { GanttTask } from './useGanttData';
import type { Column } from '../../../types/api.types';
import { useToast } from '../../../components/common/Toast';
import { buildInitialValuesForEdit } from '../../../utils/initialValues';

interface UseGanttModalsOptions {
  tasks: GanttTask[];
  tableData?: any;
  actions?: {
    deleteRecord?: any;
    createTask?: (taskData: Partial<GanttTask>) => Promise<string>;
  };
  onRefresh: () => void;
  columns: Column[];
  rawRecords?: any[]; // Original records array for buildInitialValuesForEdit
  startDateField?: Column;
  endDateField?: Column;
  titleField?: Column;
  progressField?: Column;
}

export function useGanttModals({
  tasks,
  tableData,
  actions,
  onRefresh,
  columns,
  rawRecords = [],
  startDateField,
  endDateField,
  titleField,
  progressField,
}: UseGanttModalsOptions) {
  const toast = useToast();
  
  // Modal state
  const [modalState, setModalState] = useState({
    create: { isOpen: false },
    edit: { isOpen: false, selectedTask: null as GanttTask | null }
  });
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<GanttTask | null>(null);

  // Create record handler
  const handleCreateRecord = useCallback(() => {
    setModalState(prev => ({ ...prev, create: { isOpen: true } }));
  }, []);

  // Edit task handler
  const handleEditTask = useCallback((task: GanttTask) => {
    setModalState(prev => ({ ...prev, edit: { isOpen: true, selectedTask: task } }));
  }, []);

  // Delete task handler
  const handleDeleteTask = useCallback((task: GanttTask | null) => {
    setTaskToDelete(task);
    setDeleteConfirmModalOpen(true);
  }, []);

  // Close modals
  const handleCloseCreateModal = useCallback(() => {
    setModalState(prev => ({ ...prev, create: { isOpen: false } }));
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setModalState(prev => ({ ...prev, edit: { isOpen: false, selectedTask: null } }));
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setDeleteConfirmModalOpen(false);
    setTaskToDelete(null);
  }, []);

  // Success handlers
  const handleCreateSuccess = useCallback(({ recordId }: { recordId: string }) => {
    onRefresh();
  }, [onRefresh]);

  const handleEditSuccess = useCallback(({ recordId }: { recordId: string }) => {
    onRefresh();
  }, [onRefresh]);

  // Delete record handler (from edit modal)
  const handleDeleteRecord = useCallback(async (recordId: string) => {
    if (actions?.deleteRecord && tableData?.data?.model?.id) {
      await actions.deleteRecord.mutateAsync({
        model_id: String(tableData.data.model.id),
        row_id: Number(recordId)
      });
      onRefresh();
    }
  }, [actions, onRefresh, tableData]);

  // Confirm delete handler
  const handleConfirmDelete = useCallback(async () => {
    if (!actions?.deleteRecord || !taskToDelete || !tableData?.data?.model?.id) {
      toast.error('Missing information to delete record');
      return;
    }

    try {
      await actions.deleteRecord.mutateAsync({
        model_id: String(tableData.data.model.id),
        row_id: Number(taskToDelete.id)
      });
      setDeleteConfirmModalOpen(false);
      setTaskToDelete(null);
      toast.success('Record deleted successfully');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete record. Please try again.');
      // Don't close modal on error so user can retry
    }
  }, [actions, onRefresh, taskToDelete, tableData, toast]);

  // Duplicate record handler (optimized with Map for O(1) lookup)
  const taskMap = useMemo(() => {
    const map = new Map<string, GanttTask>();
    tasks.forEach(task => {
      map.set(String(task.id), task);
    });
    return map;
  }, [tasks]);

  const handleDuplicateRecord = useCallback(async (recordId: string) => {
    // Use Map for O(1) lookup instead of O(n) find()
    const task = taskMap.get(String(recordId));
    if (task && actions?.createTask) {
      const newTask = {
        ...task,
        name: `${task.name} (Copy)`,
        startDate: new Date(task.startDate.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
        endDate: new Date(task.endDate.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
      };
      await actions.createTask(newTask);
      onRefresh();
    }
  }, [taskMap, actions, onRefresh]);

  // Get initial values for modals
  const getCreateInitialValues = useCallback(() => {
    const values: Record<string, any> = {};
    if (startDateField) {
      // Use current date as default
      const startDate = new Date();
      values[startDateField.id] = startDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    if (endDateField) {
      // Use current date + 7 days as default
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      values[endDateField.id] = endDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    return values;
  }, [startDateField, endDateField]);

  // Create a Map for O(1) record lookups
  const rawRecordsMap = useMemo(() => {
    const map = new Map<string, any>();
    rawRecords.forEach(record => {
      const id = String(record.id || record._meta?.id);
      if (id) {
        map.set(id, record);
      }
    });
    return map;
  }, [rawRecords]);

  // Memoize normalized columns to prevent recreation
  const normalizedColumns = useMemo(() => {
    return columns.map((col: any) => ({
      ...col,
      key: col.key || col.column_name || col.name || String(col.id),
      name: col.name || col.column_name || col.title,
      columnName: col.columnName || col.column_name,
    }));
  }, [columns]);

  const getEditInitialValues = useCallback(() => {
    if (!modalState.edit.selectedTask) return {};
    
    const task = modalState.edit.selectedTask;
    
    // Use Map for O(1) lookup instead of O(n) find()
    const matchedRecord = rawRecordsMap.get(String(task.id));
    
    // Use buildInitialValuesForEdit to get all field values
    // This matches the pattern used in Calendar, Kanban, and Gallery views
    const recordToUse = matchedRecord || (task as any).rawData || task;
    const initialValues = buildInitialValuesForEdit({
      record: recordToUse,
      recordId: String(task.id),
      columns: normalizedColumns as any,
      rawRecords: rawRecords.length > 0 ? rawRecords : undefined,
    });
    
    return initialValues;
  }, [modalState.edit.selectedTask, rawRecordsMap, normalizedColumns, rawRecords]);

  return {
    // State
    modalState,
    deleteConfirmModalOpen,
    taskToDelete,
    
    // Handlers
    handleCreateRecord,
    handleEditTask,
    handleDeleteTask,
    handleCloseCreateModal,
    handleCloseEditModal,
    handleCloseDeleteModal,
    handleCreateSuccess,
    handleEditSuccess,
    handleDeleteRecord,
    handleConfirmDelete,
    handleDuplicateRecord,
    getCreateInitialValues,
    getEditInitialValues,
  };
}

