
/* eslint-disable sonarjs/cognitive-complexity */
import React, { useMemo, useCallback } from "react";
import CreateRecordModal from "../../../components/modals/CreateRecordModal";
import EditRecordModal from "../../../components/modals/EditRecordModal";
import CalendarHeader from "./CalendarHeader";
import EventsSidebar from "./EventsSidebar";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import DayView from "./DayView";
import YearView from "./YearView";
import ExportModal from "./ExportModal";
import { CalendarEvent } from "../hooks/useCalendarData";
import { GridColumn } from "../../GridViewPlugin/types/grid.types";
import { applyFilters } from "../../../utils/filterUtils";
import { buildInitialValuesForEdit } from "../../../utils/initialValues";
import { zonedToUtcISO } from '../../../utils/dateUtils';
import { useBaseAccess } from '../../../hooks/useBaseAccess';
// Custom hooks
import { useCalendarViewConfig } from "../hooks/useCalendarViewConfig";
import { useCalendarModals } from "../hooks/useCalendarModals";
import { useCalendarDateNavigation } from "../hooks/useCalendarDateNavigation";

interface CalendarViewProps {
  tableData: {
    model: any;
    columns: any[];
    records: any[];
    views?: any[];
  };
  uiColumns: GridColumn[];
  uiData: any[];
  uiTableId: string;
  events: CalendarEvent[];
  dateField?: GridColumn;
  view: any;
  viewId?: string;
  onRefresh: () => void;
  actions: {
    addRow: any;
    insertRowData: any;
    deleteRecord: any;
    updateField: any;
    updateView: any;
    updateEvent: any;
    createEvent: any;
    deleteEvent: any;
    changeDateField: any;
    updateViewConfig: any;
  };
}

const CalendarView: React.FC<CalendarViewProps> = ({
  tableData,
  uiColumns,
  uiData,
  uiTableId,
  events,
  dateField,
  view,
  viewId,
  onRefresh,
  actions,
}) => {
  // Extract base ID for permission checks
  const baseId = useMemo(() => String(tableData?.model?.base_id ?? ''), [tableData?.model?.base_id]);

  // Check permissions for read-only access
  const { isBaseReadOnly, canCreateRecord, canDeleteRecord, canUpdateRecord } = useBaseAccess(baseId || undefined);

  // Safe handlers pattern: Check read-only once at top level
  const isReadOnly = isBaseReadOnly();

  const {
    updateView,
    deleteEvent,
    changeDateField,
    updateViewConfig,
  } = actions;

  // Date navigation hook
  const {
    currentDate,
    setCurrentDate,
    setSelectedDate,
    currentView,
    setCurrentView,
    sidebarCollapsed,
    toggleSidebar,
  } = useCalendarDateNavigation();

  // Wrapper to convert string to CalendarViewType for onViewChange
  const handleViewChange = useCallback((view: string) => {
    setCurrentView(view as 'month' | 'week' | 'day' | 'year');
  }, [setCurrentView]);

  // View configuration hook
  const {
    filters,
    sorts,
    draftFilter,
    localFieldConfig,
    visibleColumns,
    handleAddFilter,
    handleRemoveFilter,
    handleUpdateFilter,
    handleSortChange,
    handleFieldToggle,
  } = useCalendarViewConfig({
    view,
    columns: uiColumns,
    updateView,
    updateViewConfig,
    isReadOnly,
  });

  // Modal management hook
  const {
    modalState,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleOpenExportModal,
    handleCloseCreateModal,
    handleCloseEditModal,
    handleCloseExportModal,
    handleCreateSuccess,
    handleEditSuccess,
    handleDeleteRecordFromModal,
  } = useCalendarModals();


  // Apply filters to events
  // Includes both saved filters and draft/real-time filter for preview
  const filteredEvents = useMemo(() => {
    const hasFilters = Array.isArray(filters) && filters.length > 0;
    const hasDraftFilter = draftFilter !== null;

    if (!hasFilters && !hasDraftFilter) return events;

    // Combine saved filters with draft filter (if any) for real-time preview
    const allFilters = hasDraftFilter
      ? [...filters, draftFilter]
      : filters;

    // Convert events to records format for filtering
    const records = events.map(event => ({
      data: event.data,
      id: event.id
    }));

    // Apply filters using the standard filter utility (includes both saved and draft)
    const filteredRecords = applyFilters(records, allFilters, visibleColumns);

    // Convert back to events
    // Optimized with Set for O(1) lookups instead of O(n) some() calls
    const filteredRecordIdsSet = new Set(filteredRecords.map(r => String(r.id)));
    return events.filter(event =>
      filteredRecordIdsSet.has(String(event.id))
    );
  }, [events, filters, draftFilter, visibleColumns]);

  // Don't apply sorting here - let EventsSidebar handle it for sidebar events
  // Calendar views display events in their natural order
  const sortedEvents = filteredEvents;

  // Wrapper for handleDeleteRecordFromModal to pass required params
  const handleDeleteFromModal = useCallback(async (recordId: string) => {
    await handleDeleteRecordFromModal(recordId, deleteEvent, tableData, onRefresh);
  }, [handleDeleteRecordFromModal, deleteEvent, tableData, onRefresh]);

  const onDuplicateCard = useCallback(() => {
    // Duplicate functionality - can be implemented later
  }, []);

  const getEditInitialValues = useCallback((): Record<string, any> => {
    if (!modalState.edit.selectedEvent) return {};

    // Find the original record from uiData
    // Optimized with Map for O(1) lookup instead of O(n) find()
    const uiDataMap = new Map(
      uiData.map(record => [String(record.id || record._meta?.id), record])
    );
    const matchedRecord = uiDataMap.get(String(modalState.edit?.selectedEvent?.id));

    if (!matchedRecord) return modalState.edit.selectedEvent.data || {};

    const initialValues = buildInitialValuesForEdit({
      record: matchedRecord,
      recordId: String(modalState.edit.selectedEvent.id),
      columns: uiColumns as any,
    });

    // Filter out empty string values to prevent unnecessary API calls
    const filteredValues: Record<string, any> = {};
    Object.entries(initialValues).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        filteredValues[key] = value;
      }
    });

    return filteredValues;
  }, [modalState.edit.selectedEvent, uiData, uiColumns]);

  // Handle date field change (similar to Kanban's group by change)
  const handleGroupByChange = useCallback(async (column: GridColumn | undefined) => {
    if (!column) return;

    try {
      // Update the date field in the view meta
      await changeDateField(column.id || column.key);
      // Force refresh to update the UI immediately
      onRefresh();
    } catch (error) {
      console.error('Failed to change date field:', error);
    }
  }, [changeDateField, onRefresh]);

  const getCreateInitialValues = useCallback(() => {
    const initialValues: any = {};

    // Include default values from field meta
    visibleColumns.forEach(col => {
      if (col.meta?.defaultValue !== undefined) {
        initialValues[col.key] = col.meta.defaultValue;
      }
    });

    if (modalState.create.selectedDate && dateField) {
      const date = modalState.create.selectedDate;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;

      const fieldType = String(dateField.type || '').toLowerCase();
      const fieldUidt = String(dateField.uidt || '').toLowerCase();
      const isDateField = fieldType === 'date' || fieldUidt === 'date';
      const isMonthOrYearView = currentView === 'month' || currentView === 'year';

      const tz = dateField.meta?.timeZoneLabel || dateField.meta?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const timeValue = isMonthOrYearView
        ? '00:00'
        : `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

      const dateValue = isDateField
        ? isoDate
        : zonedToUtcISO(isoDate, timeValue, tz);

      // Set initial value using both field.id and field.name for compatibility
      if (dateField.id) {
        initialValues[dateField.id] = dateValue;
      }
      if (dateField.key) {
        initialValues[dateField.key] = dateValue;
      }
      if (dateField.column_name) {
        initialValues[dateField.column_name] = dateValue;
      }
    }

    return initialValues;
  }, [modalState.create.selectedDate, dateField, visibleColumns]);


  const onCreateRecordHandler = !isReadOnly && canCreateRecord() ? () => handleOpenCreateModal(currentDate) : undefined;
  const onEventClickHandler = !isReadOnly && canUpdateRecord() ? handleOpenEditModal : undefined;
  const onDateClickHandler = !isReadOnly && canCreateRecord() ? handleOpenCreateModal : undefined;
  const onDeleteHandler = !isReadOnly && canDeleteRecord() ? handleDeleteFromModal : undefined;


  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <CalendarHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
     currentView={currentView}
        onViewChange={handleViewChange}
        dateField={dateField}
        onExport={handleOpenExportModal}
        onToggleSidebar={toggleSidebar}
        columns={visibleColumns}
        fieldConfig={localFieldConfig}
        filters={filters}
        onFieldToggle={isReadOnly ? undefined : handleFieldToggle}
        onAddFilter={handleAddFilter}
        onRemoveFilter={handleRemoveFilter}
        onUpdateFilter={handleUpdateFilter}
        onGroupByChange={isReadOnly ? undefined : handleGroupByChange}
        // tableId={uiTableId}
        events={sortedEvents.map(e => ({ ...e, id: String(e.id) }))}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Calendar Views - Full Width */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentView === "month" && (
            <MonthView
              currentDate={currentDate}
              events={sortedEvents}
              onEventClick={onEventClickHandler}
              onDateClick={onDateClickHandler}
              columns={visibleColumns}
              fieldConfig={localFieldConfig}
            />
          )}
          {currentView === "week" && (
            <WeekView
              currentDate={currentDate}
              events={sortedEvents}
              onEventClick={onEventClickHandler}
              onDateClick={onDateClickHandler}
              dateField={dateField}
              columns={visibleColumns}
              fieldConfig={localFieldConfig}
            />
          )}
          {currentView === "day" && (
            <DayView
              currentDate={currentDate}
              events={sortedEvents}
              onEventClick={onEventClickHandler}
              onDateClick={onDateClickHandler}
              dateField={dateField}
              columns={visibleColumns}
              fieldConfig={localFieldConfig}
            />
          )}
          {currentView === "year" && (
            <YearView
              currentDate={currentDate}
              events={sortedEvents}
              onDateSelect={setSelectedDate}
              onViewChange={handleViewChange}
            />
          )}
        </div>

        {/* Right Sidebar - Events List */}
        {!sidebarCollapsed && (
          <div className="w-80 border-l flex flex-col bg-card">
            <EventsSidebar
              events={sortedEvents}
              onEventClick={onEventClickHandler}
              currentView={currentView}
              currentDate={currentDate}
              columns={visibleColumns}
              sorts={sorts}
              onCreateRecord={onCreateRecordHandler}
              onSortChange={handleSortChange}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {modalState.create.isOpen && (
        <CreateRecordModal
          isOpen={modalState.create.isOpen}
          onClose={handleCloseCreateModal}
          table={{ id: uiTableId, title: tableData?.model?.title || 'Calendar' } as any}
          fields={uiColumns as any}
          title="New Record"
          submitLabel="Save Record"
          initialValues={getCreateInitialValues()}
          onSuccess={() => handleCreateSuccess(onRefresh)}
        />
      )}

      {modalState.edit.isOpen && modalState.edit.selectedEvent && (
        <EditRecordModal
          isOpen={modalState.edit.isOpen}
          onClose={handleCloseEditModal}
          table={{ id: uiTableId, title: tableData?.model?.title || 'Calendar' } as any}
          fields={uiColumns as any}
          recordId={String(modalState.edit.selectedEvent.id)}
          title="Edit Record"
          submitLabel="Update record"
          onSuccess={() => handleEditSuccess(onRefresh)}
          onDelete={onDeleteHandler}
          onDuplicate={isReadOnly ? undefined : onDuplicateCard}
          initialValues={getEditInitialValues()}
        />
      )}

      {modalState.export.isOpen && (
        <ExportModal
          isOpen={modalState.export.isOpen}
          onClose={handleCloseExportModal}
          events={events}
        />
      )}
    </div>
  );
};

export default CalendarView;
