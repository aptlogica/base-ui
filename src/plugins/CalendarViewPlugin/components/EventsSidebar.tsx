import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { Calendar, Plus } from "lucide-react";
import { CalendarEvent } from "../hooks/useCalendarData";
import { SortItem, sortRowsByDataKey } from "../../../utils/sortUtils";
import { SortPopover } from "../../../components/shared/table/SortPopover";
import { BaseColumn } from "../../../types/column.types";
import { useFrontendPagination } from "../../../hooks/useFrontendPagination";
import { formatCompactNumber } from "../../../utils/helpers";
import { LoadMoreSection } from "../../../components/shared/LoadMoreSection";
import { getDateRangeForView, toLocalDateKey } from "../utils/calendarViewUtils";

interface EventsSidebarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void; // Optional - only provided if user has permission
  currentView: string;
  currentDate: Date;
  columns?: BaseColumn[];
  sorts?: SortItem[];
  onSortChange?: (newSorts: SortItem[]) => void;
  onCreateRecord?: () => void; // Optional - only provided if user has permission
}

const EventsSidebar: React.FC<EventsSidebarProps> = ({
  events,
  onEventClick,
  currentView,
  currentDate,
  columns = [],
  sorts = [],
  onSortChange,
  onCreateRecord,
}) => {
  // Filter events based on current view
  const filteredEvents = useMemo(() => {
    if (currentView === 'day') {
      // Show events for the current day
      const dateStr = toLocalDateKey(currentDate);
      return events.filter(event => event.date === dateStr);
    }
    const range = getDateRangeForView(currentView, currentDate);
    if (!range) return events;
    return events.filter(event => {
      const eventDate = new Date(event.dateTime);
      return eventDate >= range.start && eventDate <= range.end;
    });
  }, [events, currentView, currentDate]);

  // Apply sorting to filtered events
  const sortedEvents = useMemo(() => {
    if (!Array.isArray(sorts) || sorts.length === 0) return filteredEvents;

    // Ensure columns are in the correct format for sorting (key and type required)
    const sortableColumns = columns.filter(col => col.key && col.type).map(col => ({
      key: col.key,
      type: col.type || col.uidt || 'text'
    }));

    if (sortableColumns.length === 0) return filteredEvents;

    // Convert events to records format for sorting
    const records = filteredEvents.map(event => ({
      data: event.data,
      id: event.id
    }));

    // Apply sorting using the standard sort utility
    const sortedRecords = sortRowsByDataKey(sortableColumns, sorts, records);

    // Convert back to events
    // Optimized with Map for O(1) lookups instead of O(n) find() calls
    const filteredEventsMap = new Map(filteredEvents.map(event => [String(event.id), event]));
    return sortedRecords.map(sortedRecord => {
      return filteredEventsMap.get(String(sortedRecord.id));
    }).filter((event): event is CalendarEvent => event !== undefined); // Filter out any undefined results
  }, [filteredEvents, sorts, columns]);

  // FRONTEND PAGINATION: Paginate sorted events
  // This allows rendering only a portion of events initially for better performance
  const {
    allLoadedData: paginatedEvents,
    loadNextPage,
    hasMore,
    totalItems,
  } = useFrontendPagination({
    data: sortedEvents,
    pageSize: 30, // Same as GridView, Kanban, and Gallery
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


  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).toUpperCase();
  };

  const formatTime = (dateTime: Date, isDateField?: boolean) => {
    // For date fields, don't show time
    if (isDateField) {
      return '';
    }
    // For datetime fields, show the actual time
    return dateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSectionTitle = () => {
    switch (currentView) {
      case 'day':
        return 'Records In this day';
      case 'week':
        return 'Records In selected hours';
      case 'month':
        return 'Records In this month';
      case 'year':
        return 'Records In this year';
      default:
        return 'Records In selected date';
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Records Section Header */}
      <div className="p-2 border-b bg-background">
        <div className="flex items-center space-x-2">
          <h4 className="text-sm font-medium text-gray-900">
            {getSectionTitle()}
            {totalItems > 0 && (
              <span className="ml-2 text-xs text-gray-500 font-normal">
                ({formatCompactNumber(totalItems)}
                {hasMore && `, ${formatCompactNumber(paginatedEvents.length)} loaded`})
              </span>
            )}
          </h4>
        </div>
        <div className="flex items-center justify-between mt-2">
          {columns.length > 0 && onSortChange && (
            <SortPopover
              columns={columns}
              sorts={sorts}
              onChange={onSortChange}
            />
          )}
          {onCreateRecord && (
            <button
              onClick={onCreateRecord}
              className="px-3 py-1.5 flex items-center gap-2 rounded-xl btn-primary"
            >
              <Plus className="w-4 h-4" />
              Record
            </button>
          )}
        </div>
      </div>

      {/* Events List - Scrollable */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-background"
      >
        {totalItems === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No events scheduled</p>
          </div>
        ) : (
          <>
            <div className="p-2.5 space-y-2">
              {paginatedEvents.map((event) => (
                <div //NOSONAR
                  key={event.id}
                  className={`bg-background border rounded-xl transition-colors group ${onEventClick ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
                  onClick={onEventClick ? () => onEventClick(event) : undefined}
                  onKeyDown={
                    onEventClick
                      ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault(); // prevent scroll on Space
                          e.stopPropagation();
                          onEventClick(event);
                        }
                      }
                      : undefined
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="w-1.5 h-12 bg-gray-300 rounded-tl-2xl rounded-bl-2xl flex-shrink-0"/>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(event.date)}{event.isDateField ? '' : ` • ${formatTime(event.dateTime, event.isDateField)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            <LoadMoreSection
              isVisible={hasMore}
              isLoading={isLoadingMore}
              onLoadMore={handleLoadMore}
              className="py-4 px-2"
              label={`Load more (${formatCompactNumber(totalItems - paginatedEvents.length)} remaining)`}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default EventsSidebar;
