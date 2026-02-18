import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CalendarEvent } from '../hooks/useCalendarData';
import EventChip from './EventChip';
import type { GridColumn } from '../../GridViewPlugin/types/grid.types';
import { useFrontendPagination } from '../../../hooks/useFrontendPagination';
import { formatCompactNumber } from '../../../utils/helpers';
import { Loader } from '../../../components/ui/Loader';

interface MoreEventsDropdownProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  children: React.ReactNode;
  columns?: GridColumn[];
  fieldConfig?: any[];
}

const MoreEventsDropdown: React.FC<MoreEventsDropdownProps> = ({
  events,
  onEventClick,
  children,
  columns,
  fieldConfig,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; maxHeight: number } | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // FRONTEND PAGINATION: Paginate events for better performance
  const {
    allLoadedData: paginatedEvents,
    loadNextPage,
    hasMore,
    totalItems,
  } = useFrontendPagination({
    data: events,
    pageSize: 30, // Same as other views
    initialPage: 1,
  });

  // Handle loading more with loading state
  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true);
    loadNextPage();
    // Brief loading state for better UX
    setTimeout(() => setIsLoadingMore(false), 300);
  }, [loadNextPage]);

  // Infinite scroll: Load more when scrolling near bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMore || isLoadingMore || !isOpen) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Load more when user is within 100px of bottom (smaller threshold for popup)
      if (scrollHeight - scrollTop - clientHeight < 100) {
        handleLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, isOpen, handleLoadMore]);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const dropdownWidth = 288; // w-72 = 288px
        const maxDropdownHeight = 400;
        const minDropdownHeight = 160;

        // Prefer positioning below the trigger. Only place above if there's significantly more space.
        const spaceBelow = viewportHeight - rect.bottom - 8;
        const spaceAbove = rect.top - 8;
        const placeBelow = spaceBelow >= minDropdownHeight || spaceBelow >= spaceAbove;

        let top = placeBelow ? rect.bottom + 8 : rect.top - maxDropdownHeight - 8;

        // Align to left edge of trigger (more predictable for month grid)
        let left = rect.left;

        // If dropdown would go off right edge, adjust
        if (left + dropdownWidth > viewportWidth - 10) {
          left = viewportWidth - dropdownWidth - 10;
        }
        if (left < 10) left = 10;

        // Compute max height based on available space in chosen direction
        const availableHeight = placeBelow ? Math.max(120, spaceBelow - 10) : Math.max(120, spaceAbove - 10);
        const maxHeight = Math.min(maxDropdownHeight, availableHeight);

        // Clamp top within viewport
        if (placeBelow) {
          top = Math.min(top, viewportHeight - maxHeight - 10);
        } else {
          top = Math.max(10, rect.top - maxHeight - 8);
        }

        setPosition({ top, left, maxHeight });
      });
    } else {
      setPosition(null);
    }
  }, [isOpen, paginatedEvents.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleEventClick = (event: CalendarEvent) => {
    if (onEventClick) {
      onEventClick(event);
      setIsOpen(false);
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        className="cursor-pointer hover:bg-gray-100 w-fit bg-card border rounded-xl px-1 py-0.5 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();   // prevent page scroll on Space
            e.stopPropagation();
            setIsOpen(!isOpen);
          }
        }}
      >
        {children}
      </div>

      {isOpen && position && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] border rounded-xl shadow-lg w-72 flex flex-col"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            maxHeight: `${position.maxHeight}px`,
          }}
        >
          <div className="p-3 border-b bg-card rounded-t-xl rounded-tr-xl flex-shrink-0">
            <div className="text-sm font-medium text-gray-900">
              {formatCompactNumber(totalItems)} more {totalItems === 1 ? 'event' : 'events'}
              {hasMore && (
                <span className="ml-1 text-xs text-gray-500 font-normal">
                  ({formatCompactNumber(paginatedEvents.length)} loaded)
                </span>
              )}
            </div>
          </div>
          <div
            ref={scrollContainerRef}
            className="bg-card rounded-xl flex-1 overflow-y-auto p-3"
          >
            <div className="space-y-2">
              {paginatedEvents.map((event, index) => (
                <EventChip
                  key={event.id || index}
                  event={event}
                  onClick={onEventClick ? handleEventClick : undefined}
                  columns={columns}
                  fieldConfig={fieldConfig}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="bg-card flex justify-center py-3 mt-2">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-4 py-2 text-xs font-medium rounded-xl btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoadingMore ? (
                    <Loader size={4} />
                  ) : (
                    <span>Load more ({formatCompactNumber(totalItems - paginatedEvents.length)} remaining)</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default MoreEventsDropdown;
