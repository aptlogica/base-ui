import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Calendar, Plus, Layers, ZoomIn, ZoomOut } from 'lucide-react';
import type { TableResponse } from '../../../types/api.types';
import { GanttFieldConfiguration } from './GanttFieldSelector';
import { FilterPopover } from '../../../components/shared/table/FilterPopover';
import { SortPopover } from '../../../components/shared/table/SortPopover';
import { FieldsPopover } from '../../../components/shared/table/FieldsPopover';
import CreateRecordModal from '../../../components/modals/CreateRecordModal';
import EditRecordModal from '../../../components/modals/EditRecordModal';
import DeleteConfirmModal from '../../../components/modals/DeleteConfirmModal';
// Custom hooks
import { useGanttTaskProcessing } from '../hooks/useGanttTaskProcessing';
import { useGanttViewConfig } from '../hooks/useGanttViewConfig';
import { useGanttModals } from '../hooks/useGanttModals';
import { useGanttTimeline } from '../hooks/useGanttTimeline';
import { useGanttFieldConfig } from '../hooks/useGanttFieldConfig';
import { useFrontendPagination } from '../../../hooks/useFrontendPagination';
import { formatCompactNumber } from '../../../utils/helpers';
import { Loader } from '../../../components/ui/Loader';
import { useBaseAccess } from '../../../hooks/useBaseAccess';
import type { GanttTask } from '../hooks/useGanttData';
import { normalizeFieldType } from '../../../utils/fieldType';
import { ColumnConfig } from '../../../plugins/GridViewPlugin/types/grid.types';

// TaskCard component - moved outside to prevent recreation on every render
const TaskCard = React.memo(({ task, onEdit, onDelete }: { task: GanttTask; onEdit?: () => void; onDelete?: (e: React.MouseEvent) => void }) => {
  const duration = React.useMemo(() =>
    Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24)),
    [task.endDate, task.startDate]
  );
  const isOverdue = task.status === 'overdue';
  const isCompleted = task.status === 'completed';

  return (
    <div //NOSONAR
      className={`bg-card border rounded-xl transition-all duration-200 relative overflow-hidden ${onEdit ? 'hover:border-gray-300 hover:shadow-md cursor-pointer group' : ''}`}
      onClick={onEdit}
      onKeyDown={
        onEdit
          ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault(); // prevent scroll on Space
              onEdit();
            }
          }
          : undefined
      }
    >
      {/* Color accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-tl-xl rounded-bl-xl"
        style={{ backgroundColor: task.color }}
      />

      <div className="pl-4 pr-3 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Task Title */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">
                {task.name}
              </h3>
              {/* Status Badges */}
              {isOverdue && (
                <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-semibold rounded-full flex-shrink-0">
                  OVERDUE
                </span>
              )}
              {isCompleted && (
                <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-semibold rounded-full flex-shrink-0">
                  DONE
                </span>
              )}
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-600">
              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="font-medium">
                {task.startDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })} - {task.endDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>

            {/* Duration and Progress */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="font-medium">{duration}</span>
                <span>days</span>
              </div>

              {task.progress > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, task.progress))}%`,
                        backgroundColor: task.progress >= 100 ? '#10b981' : task.color
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 min-w-[2.5rem]">
                    {task.progress}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Delete Button */}
          {onDelete && (
            <button
              className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md flex-shrink-0 ml-1"
              onClick={onDelete}
              title="Delete Record"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
TaskCard.displayName = 'TaskCard';

// ChartTask component - moved outside to prevent recreation on every render
const ChartTask = React.memo(({
  task,
  position,
  rowTop,
  onEdit,
  onMouseEnter,
  onMouseLeave,
  showTooltip,
  tooltipTask,
  tooltipLines,
  tooltipRef,
  getTooltipClasses,
  getTooltipArrowClasses
}: {
  task: GanttTask;
  position: { left: number; width: number };
  rowTop: number;
  onEdit?: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  showTooltip: boolean;
  tooltipTask: GanttTask | null;
  tooltipLines: string[];
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  getTooltipClasses: () => string;
  getTooltipArrowClasses: () => string;
}) => {
  const isMilestone = position.width < 5;
  const progress = Math.min(Math.max(task.progress || 0, 0), 100);
  const isOverdue = task.status === 'overdue';
  const isCompleted = task.status === 'completed';

  return (
    <div //NOSONAR
      className={`absolute group transition-all duration-200 ${onEdit ? 'cursor-pointer' : ''
        } ${isMilestone ? 'w-0 h-0' : 'bg-background border rounded-xl'
        }`}
      style={{
        left: position.left,
        top: rowTop,
        width: isMilestone ? 0 : position.width,
        height: isMilestone ? 0 : 40,
      }}
      onClick={onEdit}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={
        onEdit
          ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault(); // prevent scroll on Space
              onEdit();
            }
          }
          : undefined
      }
    >
      {/* Color accent bar */}
      {!isMilestone && (
        <div
          className="absolute left-0 top-0 bottom-0 w-0"
          style={{ backgroundColor: task.color }}
        />
      )}

      {/* Task Content */}
      {!isMilestone && (
        <div className="relative pl-4 pr-3 py-2.5 h-full flex items-center bg-card border-l-4 rounded-xl" style={{ borderColor: task.color }}>
          <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {task.name}
              </h3>
              {/* Status Badges */}
              {isOverdue && (
                <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-semibold rounded-full flex-shrink-0">
                  OVERDUE
                </span>
              )}
              {isCompleted && (
                <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-semibold rounded-full flex-shrink-0">
                  DONE
                </span>
              )}
            </div>

            {/* Progress indicator */}
            {task.progress > 0 && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: task.progress >= 100 ? '#10b981' : task.color
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-600 min-w-[2rem]">
                  {task.progress}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && tooltipTask?.id === task.id && tooltipLines.length > 0 && (
        <div ref={tooltipRef} className={getTooltipClasses()}>
          <div className="space-y-1">
            {tooltipLines.map((line, idx) => {
              // Use line content + index as key since lines might not be unique
              const lineKey = `${line}-${idx}`;
              return (
                <div key={lineKey} className={idx === 0 ? 'font-semibold text-primary text-sm' : 'text-secondary text-xs'}>
                  {line}
                </div>
              );
            })}
          </div>
          <div className={getTooltipArrowClasses()}></div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if position or task data actually changed
  return (
    prevProps.position.left === nextProps.position.left &&
    prevProps.position.width === nextProps.position.width &&
    prevProps.rowTop === nextProps.rowTop &&
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.progress === nextProps.task.progress &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.showTooltip === nextProps.showTooltip &&
    prevProps.tooltipTask?.id === nextProps.tooltipTask?.id
  );
});
ChartTask.displayName = 'ChartTask';

interface GanttChartProps {
  tableData?: TableResponse;
  onRefresh?: () => void;
  actions?: {
    addRow: any;
    insertRowData: any;
    deleteRecord: any;
    updateField: any;
    updateView: any;
    moveTask: (taskId: string, newStartDate: Date, newEndDate: Date) => Promise<void>;
    createTask: (taskData: Partial<GanttTask>) => Promise<string>;
    deleteTask: (taskId: string) => Promise<void>;
    updateTaskProgress: (taskId: string, progress: number) => Promise<void>;
    updateViewConfig: (viewId: string, updates: any) => Promise<void>;
  };
}

export const GanttChart: React.FC<GanttChartProps> = ({ tableData, onRefresh, actions }) => {
  // Extract base ID for permission checks
  const baseId = useMemo(() => String(tableData?.data?.model?.base_id ?? ''), [tableData?.data?.model?.base_id]);

  // Check permissions for read-only access
  const {
    isBaseReadOnly,
    canCreateRecord,
    canUpdateRecord,
    canDeleteRecord
  } = useBaseAccess(baseId || undefined);

  // Safe handlers pattern: Check read-only once at top level
  const isReadOnly = isBaseReadOnly();

  // Process data into Gantt-ready format
  const processedData = useGanttTaskProcessing({ tableData });

  // View configuration hook (includes filtering and sorting)
  const {
    filters,
    sorts,
    localFieldConfig,
    filteredTasks,
    sortedTasksForSidebar,
    handleAddFilter,
    handleRemoveFilter,
    handleUpdateFilter,
    handleSortChange,
    handleFieldToggle
  } = useGanttViewConfig({
    view: processedData.currentView,
    columns: processedData.columns,
    updateView: actions?.updateView,
    tasks: processedData.tasks,
    isReadOnly,
  });

  // Timeline hook
  const {
    dayWidth,
    timelineDays,
    showTooltip,
    tooltipTask,
    tooltipRef,
    tooltipLines,
    getTaskPosition,
    zoomIn,
    zoomOut,
    resetZoom,
    handleTaskMouseEnter,
    handleTaskMouseLeave,
    getTooltipClasses,
    getTooltipArrowClasses,
  } = useGanttTimeline({
    filteredTasks,
    columns: processedData.columns,
    fieldConfig: localFieldConfig,
  });

  // Modals hook
  const {
    modalState,
    deleteConfirmModalOpen,
    taskToDelete,
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
  } = useGanttModals({
    tasks: processedData.tasks,
    tableData,
    actions,
    onRefresh: onRefresh || (() => { }),
    columns: processedData.columns,
    rawRecords: tableData?.data?.records || [],
    startDateField: processedData.startDateField,
    endDateField: processedData.endDateField,
  });

  // Field configuration handlers
  const {
    handleStartDateFieldChange,
    handleEndDateFieldChange,
    handleProgressFieldChange,
    handleCompletionFieldChange,
  } = useGanttFieldConfig({
    currentView: processedData.currentView,
    updateView: actions?.updateView,
    onRefresh: onRefresh || (() => { }),
  });

  // Memoize column mappings to prevent recreation on every render
  const fieldsPopoverColumns = useMemo((): ColumnConfig[] => {
    return processedData.columns.map((col): ColumnConfig => {
      const colAny = col as unknown as Record<string, unknown>;
      return {
        key: col.id || '',
        id: col.id ? String(col.id) : undefined,
        column_name: col.column_name,
        title: col.title || col.column_name || '',
        type: normalizeFieldType(col.uidt || 'text') as any,
        uidt: col.uidt,
        position: col.order_index || 0,
        order_index: col.order_index || 0,
        isSystem: col.system || false,
        system: col.system || false,
        hidden: Boolean(colAny.hidden),
        is_hidden: Boolean(colAny.isHidden || colAny.is_hidden),
        meta: col.meta,
        config: (colAny.config || col.meta || {}),
      };
    });
  }, [processedData.columns]);

  const filterPopoverColumns = useMemo((): ColumnConfig[] => {
    return processedData.columns.map((col: any): ColumnConfig => {
      const colAny = col as unknown as Record<string, unknown>;
      return {
        key: col.column_name || col.id || '',
        id: col.id ? String(col.id) : undefined,
        column_name: col.column_name,
        title: col.title || col.column_name || '',
        type: normalizeFieldType(col.uidt || 'text') as any,
        uidt: col.uidt,
        position: col.order_index || 0,
        order_index: col.order_index || 0,
        isSystem: col.system || false,
        system: col.system || false,
        hidden: Boolean(colAny.hidden),
        is_hidden: Boolean(colAny.isHidden || colAny.is_hidden),
        meta: col.meta,
        config: (colAny.config || col.meta || {}),
      };
    });
  }, [processedData.columns]);

  const sortPopoverColumns = useMemo(() => {
    return processedData.columns.map(col => ({
      key: col.column_name,
      column_name: col.column_name,
      title: col.title,
      type: col.uidt
    }));
  }, [processedData.columns]);

  // FRONTEND PAGINATION: Paginate sorted tasks for sidebar
  // This allows rendering only a portion of tasks initially for better performance
  const {
    allLoadedData: paginatedTasks,
    loadNextPage,
    hasMore,
    totalItems,
  } = useFrontendPagination({
    data: sortedTasksForSidebar,
    pageSize: 30, // Same as GridView, Kanban, Gallery, and Calendar
    initialPage: 1,
  });

  // Loading state for "Load more" button
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Handle loading more with loading state
  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true);
    loadNextPage();
    // Brief loading state for better UX (since loadNextPage is synchronous)
    setTimeout(() => setIsLoadingMore(false), 300);
  }, [loadNextPage]);

  // Infinite scroll: Load more when scrolling near bottom
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMore || isLoadingMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Load more when user is within 200px of bottom
      if (scrollHeight - scrollTop - clientHeight < 200) {
        handleLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, handleLoadMore]);

  // Helper functions to extract nested ternary operations
  const getTaskCardEditHandler = useCallback((task: GanttTask) => {
    if (isReadOnly) return undefined;
    if (!canUpdateRecord()) return undefined;
    return () => handleEditTask(task);
  }, [isReadOnly, canUpdateRecord, handleEditTask]);

  const getTaskCardDeleteHandler = useCallback((task: GanttTask) => {
    if (isReadOnly) return undefined;
    if (!canDeleteRecord()) return undefined;
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      handleDeleteTask(task);
    };
  }, [isReadOnly, canDeleteRecord, handleDeleteTask]);

  const getChartTaskEditHandler = useCallback((task: GanttTask) => {
    if (isReadOnly) return undefined;
    if (!canUpdateRecord()) return undefined;
    return () => handleEditTask(task);
  }, [isReadOnly, canUpdateRecord, handleEditTask]);

  const getEditModalDeleteHandler = useCallback((): ((recordId: string) => void) | undefined => {
    if (isReadOnly) return undefined;
    if (!canDeleteRecord()) return undefined;
    return (recordId: string) => {
      void handleDeleteRecord(recordId);
    };
  }, [isReadOnly, canDeleteRecord, handleDeleteRecord]);

  const getEditModalDuplicateHandler = useCallback((): ((recordId: string) => void) | undefined => {
    if (isReadOnly) return undefined;
    return (recordId: string) => {
      void handleDuplicateRecord(recordId);
    };
  }, [isReadOnly, handleDuplicateRecord]);

  // Virtualization for chart tasks
  const chartScrollParentRef = useRef<HTMLDivElement>(null);
  const ROW_HEIGHT = 60;

  const virtualizer = useVirtualizer({
    count: filteredTasks.length,
    getScrollElement: () => chartScrollParentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Memoize dependency lines (render only for visible virtual items)
  const dependencyLines = useMemo(() => {
    return virtualItems.map((virtualItem, idx) => {
      const task = filteredTasks[virtualItem.index];
      if (!task) return null;
      const position = getTaskPosition(task);
      const rowTop = virtualItem.start + 10;

      // Connect to the next virtual item if consecutive in data
      const nextVirtual = virtualItems[idx + 1];
      if (nextVirtual) {
        const nextTask = filteredTasks[nextVirtual.index];
        if (nextTask && task.endDate <= nextTask.startDate) {
          const nextPosition = getTaskPosition(nextTask);
          const nextRowTop = nextVirtual.start + 10;

          return (
            <line
              key={`dependency-${task.id}`}
              x1={position.left + position.width}
              y1={rowTop + 20}
              x2={nextPosition.left}
              y2={nextRowTop + 20}
              stroke="#666"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          );
        }
      }
      return null;
    }).filter(Boolean);
  }, [filteredTasks, getTaskPosition, virtualItems]);

  // Memoize timeline header cells to prevent re-rendering on zoom
  const timelineHeaderCells = useMemo(() => {
    return timelineDays.map((day, index) => {
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      return (
        <div
          key={`${day.getTime()}-${index}`}
          className={`border-r bg-card border-b p-2 text-center ${isWeekend ? 'bg-gray-50' : ''}`}
          style={{ width: dayWidth }}
        >
          <div className={`text-xs ${isWeekend ? 'text-gray-400' : 'text-gray-500'}`}>
            {day.toLocaleDateString('en-US', { weekday: 'short' })}
          </div>
          <div className={`text-sm font-medium ${isWeekend ? 'text-gray-400' : ''}`}>
            {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
      );
    });
  }, [timelineDays, dayWidth]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-card border-b px-4 py-3">
        {/* Desktop Layout - Hidden on mobile */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!isReadOnly && (
              <GanttFieldConfiguration
                columns={processedData.columns}
                startDateField={processedData.startDateField}
                endDateField={processedData.endDateField}
                progressField={processedData.progressField}
                completionField={processedData.completionField}
                onStartDateFieldChange={handleStartDateFieldChange}
                onEndDateFieldChange={handleEndDateFieldChange}
                onProgressFieldChange={handleProgressFieldChange}
                onCompletionFieldChange={handleCompletionFieldChange}
              />
            )}
            {!isReadOnly && handleFieldToggle && (
              <FieldsPopover
                columns={fieldsPopoverColumns}
                fieldConfig={localFieldConfig}
                onFieldToggle={handleFieldToggle}
                label="Fields"
                iconComponent={Layers}
              />
            )}
            {handleAddFilter && handleRemoveFilter && handleUpdateFilter && (
              <FilterPopover
                columns={filterPopoverColumns}
                filters={filters}
                onAddFilter={handleAddFilter}
                onRemoveFilter={handleRemoveFilter}
                onUpdateFilter={handleUpdateFilter}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* New Record Button - only show if user can create records and not read-only */}
            {!isReadOnly && canCreateRecord() && (
              <button
                onClick={handleCreateRecord}
                className="px-6 py-2 flex gap-2 items-center rounded-xl btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                New Record
              </button>
            )}
          </div>
        </div>

        {/* Mobile Layout - Shown on mobile */}
        <div className="flex md:hidden flex-col gap-3">
          {/* Top row: Title and create button */}
          {!isReadOnly && canCreateRecord() && (
            <div className="flex items-center justify-between">
              <button
                onClick={handleCreateRecord}
                className="px-6 py-2 rounded-xl btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                New Record
              </button>
            </div>
          )}

          {/* Second row: Field configuration */}
          {!isReadOnly && (
            <div className="flex items-center justify-center">
              <GanttFieldConfiguration
                columns={processedData.columns}
                startDateField={processedData.startDateField}
                endDateField={processedData.endDateField}
                progressField={processedData.progressField}
                completionField={processedData.completionField}
                onStartDateFieldChange={handleStartDateFieldChange}
                onEndDateFieldChange={handleEndDateFieldChange}
                onProgressFieldChange={handleProgressFieldChange}
                onCompletionFieldChange={handleCompletionFieldChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Task List - Modernized Design */}
        <div className="w-80 bg-[var(--color-selected-bg)] border-r flex flex-col shadow-sm">
          {/* Header */}
          <div className="px-4 py-2 border-b bg-card flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900 text-sm">Tasks</h2>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                {formatCompactNumber(totalItems)}
                {hasMore && ` (${formatCompactNumber(paginatedTasks.length)} loaded)`}
              </span>
            </div>
            {handleSortChange && (
              <SortPopover
                columns={sortPopoverColumns}
                sorts={sorts}
                onChange={handleSortChange}
              />
            )}
          </div>

          {/* Task List */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-3 space-y-2"
          >
            {totalItems === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">No tasks found</p>
                <p className="text-xs text-gray-500">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {paginatedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={getTaskCardEditHandler(task)}
                      onDelete={getTaskCardDeleteHandler(task)}
                    />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center py-4 px-2">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="px-6 py-2.5 text-sm font-medium rounded-xl btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoadingMore ? (
                        <Loader size={4} />
                      ) : (
                        <span>Load more ({formatCompactNumber(totalItems - paginatedTasks.length)} remaining)</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Gantt Chart Area - Single unified scrollable container */}
        <div className="flex-1 overflow-auto" ref={chartScrollParentRef}>
          {/* Timeline Header - Memoized */}
          <div className="bg-card sticky top-0 z-10">
            <div className="flex">
              <div className="flex-1">
                <div className="flex" style={{ width: timelineDays.length * dayWidth }}>
                  {timelineHeaderCells}
                </div>
              </div>
            </div>
          </div>

          {/* Chart Area - Same container as timeline (virtualized) */}
          <div
            className="relative"
            style={{ height: Math.max(virtualizer.getTotalSize() + 20, 100) }}
          >
            {/* SVG for Dependencies - Memoized */}
            <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7"
                  refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                </marker>
              </defs>
              {dependencyLines}
            </svg>

            {/* Chart Tasks - Using memoized components + virtualization */}
            {virtualItems.map((virtualItem) => {
              const task = filteredTasks[virtualItem.index];
              if (!task) return null;
              const position = getTaskPosition(task);
              const rowTop = virtualItem.start + 10;

              return (
                <ChartTask
                  key={task.id}
                  task={task}
                  position={position}
                  rowTop={rowTop}
                  onEdit={getChartTaskEditHandler(task)}
                  onMouseEnter={() => handleTaskMouseEnter(task)}
                  onMouseLeave={handleTaskMouseLeave}
                  showTooltip={showTooltip}
                  tooltipTask={tooltipTask}
                  tooltipLines={tooltipLines}
                  tooltipRef={tooltipRef}
                  getTooltipClasses={getTooltipClasses}
                  getTooltipArrowClasses={getTooltipArrowClasses}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-card border-t px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span>Zoom: {dayWidth}px/day</span>
            <span>Timeline: {timelineDays.length} days</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={zoomOut} className="p-1 hover:bg-gray-100 rounded">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={resetZoom} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">
              Reset
            </button>
            <button onClick={zoomIn} className="p-1 hover:bg-gray-100 rounded">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modalState.create.isOpen && (
        <CreateRecordModal
          isOpen={modalState.create.isOpen}
          onClose={handleCloseCreateModal}
          table={{ id: tableData?.data?.model?.id, title: tableData?.data?.model?.title || 'Gantt Chart' } as any}
          fields={processedData.columns}
          title="New record"
          submitLabel="Save record"
          initialValues={getCreateInitialValues()}
          onSuccess={handleCreateSuccess}
        />
      )}

      {modalState.edit.isOpen && modalState.edit.selectedTask && (
        <EditRecordModal
          isOpen={modalState.edit.isOpen}
          onClose={handleCloseEditModal}
          table={{ id: tableData?.data?.model?.id, title: tableData?.data?.model?.title || 'Gantt Chart' } as any}
          fields={processedData.columns}
          recordId={String(modalState.edit.selectedTask?.id || '')}
          title="Edit record"
          submitLabel="Update record"
          onSuccess={handleEditSuccess}
          onDelete={getEditModalDeleteHandler()}
          onDuplicate={getEditModalDuplicateHandler()}
          initialValues={getEditInitialValues()}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModalOpen && taskToDelete && (
        <DeleteConfirmModal
          isOpen={deleteConfirmModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          message={`Are you sure you want to delete the record "${taskToDelete?.name || ''}"? This action cannot be undone.`}
          title="Delete Record"
        />
      )}
    </div>
  );
};
