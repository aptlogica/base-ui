import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { Calendar, Download, Search, BarChart3, Plus } from "lucide-react";
import { CalendarEvent } from "../hooks/useCalendarData";
import { SortItem } from "../../../utils/sortUtils";
import { SortPopover } from "../../../components/shared/table/SortPopover";
import { BaseColumn } from "../../../types/column.types";
import { sortRowsByDataKey } from "../../../utils/sortUtils";
import { useFrontendPagination } from "../../../hooks/useFrontendPagination";
import { formatCompactNumber } from "../../../utils/helpers";
import { Loader } from "../../../components/ui/Loader";

interface EventsSidebarProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
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
  onDateSelect,
  selectedDate,
  currentView,
  currentDate,
  columns = [],
  sorts = [],
  onSortChange,
  onCreateRecord,
}) => {
  // Filter events based on current view
  const filteredEvents = useMemo(() => {
    switch (currentView) {
      case 'day':
        // Show events for the current day - use event.date string for accurate comparison
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return events.filter(event => event.date === dateStr);

      case 'week':
        // Show events for the current week
        const weekStart = new Date(currentDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        return events.filter(event => {
          const eventDate = new Date(event.dateTime);
          return eventDate >= weekStart && eventDate <= weekEnd;
        });

      case 'month':
        // Show events for the current month
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

        return events.filter(event => {
          const eventDate = new Date(event.dateTime);
          return eventDate >= monthStart && eventDate <= monthEnd;
        });

      case 'year':
        // Show events for the current year
        const yearStart = new Date(currentDate.getFullYear(), 0, 1);
        const yearEnd = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59, 999);

        return events.filter(event => {
          const eventDate = new Date(event.dateTime);
          return eventDate >= yearStart && eventDate <= yearEnd;
        });

      default:
        return events;
    }
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
          <button 
            onClick={onCreateRecord}
            className="px-3 py-1.5 flex items-center gap-2 rounded-xl btn-primary"
          >
            <Plus className="w-4 h-4" />
            Record
          </button>
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
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="bg-background border rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="w-1 h-14 bg-gray-300 rounded-tl rounded-bl flex-shrink-0"></div>
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
                    <span>Load more ({formatCompactNumber(totalItems - paginatedEvents.length)} remaining)</span>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EventsSidebar;