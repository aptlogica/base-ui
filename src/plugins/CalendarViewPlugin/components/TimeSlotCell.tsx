import React from "react";
import { Plus } from "lucide-react";
import EventChip from "./EventChip";
import MoreEventsDropdown from "./MoreEventsDropdown";
import { CalendarEvent } from "../hooks/useCalendarData";
import { getEventsForTimeSlot } from "../utils/calendarViewUtils";

interface TimeSlotCellProps {
  date: Date;
  hour: number;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  columns?: any[];
  fieldConfig?: any[];
  className?: string;
  enableKeyboard?: boolean;
}

const TimeSlotCell: React.FC<TimeSlotCellProps> = ({
  date,
  hour,
  events,
  onEventClick,
  onDateClick,
  columns,
  fieldConfig,
  className = "",
  enableKeyboard = false,
}) => {
  const slotEvents = getEventsForTimeSlot(events, date, hour);
  const hasEvents = slotEvents.length > 0;

  const handleCreate = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!onDateClick) return;
    const dateWithTime = new Date(date);
    dateWithTime.setHours(hour, 0, 0, 0);
    onDateClick(dateWithTime);
  };

  const handleContainerKeyDown = (event: React.KeyboardEvent) => {
    if (!enableKeyboard) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      if (!hasEvents && onDateClick) {
        const dateWithTime = new Date(date);
        dateWithTime.setHours(hour, 0, 0, 0);
        onDateClick(dateWithTime);
      }
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    if (!enableKeyboard) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <div //NOSONAR
      className={className}
      onClick={() => {
        if (!hasEvents && onDateClick) {
          const dateWithTime = new Date(date);
          dateWithTime.setHours(hour, 0, 0, 0);
          onDateClick(dateWithTime);
        }
      }}
      onKeyDown={handleContainerKeyDown}
    >
      {hasEvents && (
        <div className="absolute top-0 left-0 right-0 m-1 z-10">
          <div className="flex items-center gap-1">
            <div className="flex-1 min-w-0">
              {slotEvents.slice(0, 1).map((event) => (
                <EventChip
                  key={event.id}
                  event={event}
                  onClick={onEventClick || undefined}
                  columns={columns}
                  fieldConfig={fieldConfig}
                />
              ))}
            </div>

            {slotEvents.length > 1 && (
              <div //NOSONAR
                className="flex-shrink-0"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={handleMenuKeyDown}
              >
                <MoreEventsDropdown
                  events={slotEvents.slice(1)}
                  onEventClick={onEventClick}
                  columns={columns}
                  fieldConfig={fieldConfig}
                >
                  <div className="text-xs text-gray-600 font-medium hover:text-gray-900 transition-colors cursor-pointer">
                    + {slotEvents.length - 1}
                  </div>
                </MoreEventsDropdown>
              </div>
            )}

            {onDateClick && (
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleCreate}
                  className="p-1 hover:bg-gray-200 rounded"
                  aria-label={`Create event at ${hour}:00`}
                >
                  <Plus className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!hasEvents && onDateClick && (
        <div className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            onClick={handleCreate}
            className="p-1 hover:bg-gray-200 rounded pointer-events-auto"
            aria-label={`Create event at ${hour}:00`}
          >
            <Plus className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TimeSlotCell;
