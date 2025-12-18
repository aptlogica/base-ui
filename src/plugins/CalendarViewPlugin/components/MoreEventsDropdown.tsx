import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarEvent } from '../hooks/useCalendarData';
import EventChip from './EventChip';
import type { GridColumn } from '../../GridViewPlugin/types/grid.types';

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
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (!triggerRef.current) return;
        
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const dropdownWidth = 288; // w-72 = 288px
        const estimatedHeight = Math.min(events.length * 80 + 80, 400); // Increased for EventChip height
        
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
  }, [isOpen, events.length]);

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
        className="cursor-pointer hover:bg-gray-100 w-fit bg-card border rounded-lg px-1 py-0.5 transition-colors"
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
          className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg w-72"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            maxHeight: '300px',
            overflowY: events.length > 5 ? 'auto' : 'visible'
          }}
        >
          <div className="p-3">
            <div className="text-sm font-medium text-gray-900 mb-2">
              {events.length} more {events.length === 1 ? 'event' : 'events'}
            </div>
            <div className="space-y-2">
              {events.map((event, index) => (
                <EventChip
                  key={event.id || index}
                  event={event}
                  onClick={handleEventClick}
                  columns={columns}
                  fieldConfig={fieldConfig}
                />
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default MoreEventsDropdown;
