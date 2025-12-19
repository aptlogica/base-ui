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
  onEventClick: (event: CalendarEvent) => void;
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
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
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
        // Estimate height based on paginated events (initial load) + header + load more button
        const estimatedItemHeight = 80;
        const initialItems = Math.min(paginatedEvents.length, 30);
        const estimatedHeight = Math.min(initialItems * estimatedItemHeight + 120, 400); // Header + padding + load more button
        
        // Try to position below the trigger, aligned to its right edge (since "+N" is on the right)
        let top = rect.bottom + 8;
        let left = rect.right - dropdownWidth; // Align to right edge of trigger
        
        // If dropdown would go off left edge, align to trigger's left edge instead
        if (left < 10) {
          left = rect.left;
        }
        
        // If dropdown would go off right edge, adjust
        if (left + dropdownWidth > viewportWidth - 10) {
          left = viewportWidth - dropdownWidth - 10;
        }
        
        // If there's not enough space below, show above
        if (top + estimatedHeight > viewportHeight - 10) {
          top = rect.top - estimatedHeight - 8;
          // Ensure it doesn't go off top edge
          if (top < 10) {
            top = 10;
          }
        }
        
        // Final bounds check
        const finalTop = Math.max(10, Math.min(top, viewportHeight - estimatedHeight - 10));
        const finalLeft = Math.max(10, Math.min(left, viewportWidth - dropdownWidth - 10));
        
        setPosition({ top: finalTop, left: finalLeft });
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
    onEventClick(event);
    setIsOpen(false);
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
            maxHeight: '400px',
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
            className="flex-1 overflow-y-auto p-3"
          >
            <div className="space-y-2">
              {paginatedEvents.map((event, index) => (
                <EventChip
                  key={event.id || index}
                  event={event}
                  onClick={handleEventClick}
                  columns={columns}
                  fieldConfig={fieldConfig}
                />
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center py-3 mt-2">
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
